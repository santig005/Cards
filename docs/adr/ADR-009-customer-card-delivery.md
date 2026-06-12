# ADR-009: Canales de entrega de la tarjeta de fidelización al cliente final

**Fecha:** 2026-06-11
**Estado:** Propuesta — **diseño abierto, NO implementar aún**. Documento de referencia para una futura fase de "tarjeta en el teléfono + notificaciones".

> Este ADR es deliberadamente **abierto a modificación**. Antes de construir cualquier parte,
> el agente/dev que lo retome **debe consultar al humano** las "Preguntas abiertas" del final,
> porque varias decisiones dependen de costo, share de iOS y prioridad de negocio que pueden
> haber cambiado.

---

## Contexto

La tarjeta de sellos vive en la base de datos (fuente de verdad: `loyalty_cards`, eventos de
sello/canje). Hoy el cliente final accede por un **link** `/c/[slug]` y se identifica con **OTP**
(ver [ADR-004](./ADR-004-customer-otp.md)). No hay forma de que el cliente "tenga" la tarjeta en
su teléfono ni de notificarle proactivamente.

Queremos dos cosas, **sin depender de WhatsApp pago** (hoy solo tenemos el sandbox de Twilio):

1. Que la tarjeta **viva en el teléfono** del cliente (acceso rápido, sensación de app).
2. **Notificaciones proactivas**: "tu recompensa está lista", "hace rato que no venís",
   "sumaste un sello".

### Realidad técnica que acota el diseño (importante)

- **NFC no es viable en este mercado.** El NFC de loyalty (Apple VAS / Google Smart Tap) exige
  terminales POS certificadas con NFC que un negocio pequeño en LATAM no tiene; y **iOS no
  expone Web NFC**. El flujo siempre es **escanear un QR**. → El NFC **no debe** justificar
  ninguna decisión acá.
- **Mercado**: Android ~80%+ en Colombia/LATAM; iOS es minoría y con más fricción.
- **Web Push e instalabilidad NO requieren caché offline** (Serwist/webpack). Un service worker
  mínimo propio alcanza, manteniendo Turbopack. Serwist solo se justifica si además se quiere
  offline robusto de la tarjeta (hoy: no esencial).

---

## Las tres vías de entrega (complementarias, no excluyentes)

| Vía | Fricción de adopción | Notificaciones | Costo / dependencia | Interactivo | Offline |
|-----|----------------------|----------------|---------------------|-------------|---------|
| **Link plano** (hoy) | Nula | ❌ | Ninguno | Sí (web) | ❌ |
| **PWA instalada + Web Push** | Media (instalar; alta en iOS) | ✅ Web Push **gratis** | VAPID (gratis) | Sí (web) | Opcional |
| **Pase de Wallet** (Apple/Google) | **Baja** (guardar con 1 tap) | ✅ Push del pase + geofence | Apple US$99/año + cert; Google ~gratis | ❌ (pase pasivo) | N/A |

La tarjeta en DB es la **fuente de verdad**; cada vía es una **"vista" que se sincroniza**. Lo
ideal es ofrecer las opciones **en el mismo momento de enrolamiento** y que el cliente elija
según su tolerancia a la fricción.

---

## Cómo se auto-actualiza el pase sin re-login (responde la duda del OTP)

La preocupación era: "el cliente tiene que loguearse y poner OTP cada vez". **No.** El OTP solo
se necesita **una vez, al emitir el pase**, para atarlo al `customer_id`. Después, las
actualizaciones fluyen **servidor → pase** sin intervención del cliente, porque el pase lleva su
propia credencial.

### Apple Wallet (PassKit)
- El `.pkpass` se emite con `serialNumber` + `authenticationToken` + `webServiceURL` +
  `passTypeIdentifier`.
- Para actualizar: el servidor manda un **push por APNs** (con el certificado del Pass Type ID).
  El dispositivo entonces hace `GET {webServiceURL}/.../passes/{passTypeId}/{serial}` con el
  `authenticationToken` → descarga el pase nuevo. **El token del pase ES la credencial; no hay
  re-login ni OTP.**
- Requiere implementar los endpoints REST de PassKit Web Service (registrar dispositivo, listar
  seriales actualizados, entregar último pase, log).
- Soporta `locations` (lat/long) y `relevantDate` → **recordatorio en pantalla de bloqueo** al
  pasar cerca del local o en una fecha.

### Google Wallet
- Se crea una **Loyalty Class** y un **Loyalty Object** vía la **REST API** (service account,
  server-side). El cliente lo guarda con un link **"Save to Google Wallet"** (JWT firmado).
- Para actualizar: el servidor hace **PATCH/UPDATE del object** → Google **propaga el cambio
  solo** al pase guardado. `addMessage` sobre el object → aparece como **notificación** en el
  pase. **Sin polling ni re-login.**
- También soporta `locations` para recordatorio geolocalizado.
- En general **más simple y barato** que Apple (no hay cuota anual de developer ni cert que
  renovar manualmente).

---

## Diseño propuesto: enrolamiento unificado

1. El cliente escanea el QR del negocio → `/c/[slug]`.
2. Se identifica con **OTP una sola vez** (igual que hoy).
3. Pantalla **"Guardá tu tarjeta"** que ofrece, según el dispositivo detectado:
   - **Agregar a inicio (PWA)** + **activar notificaciones (Web Push)**.
   - **Agregar a Apple Wallet** / **Guardar en Google Wallet**.
   - *(fallback)* **guardar el link** (lo de hoy).
4. La tarjeta en DB sigue siendo la fuente de verdad. Cada canal suscrito queda registrado.
5. Cuando el empleado registra un sello (o se completa la recompensa), un **servicio de
   notificación con fan-out** empuja el cambio a **todos los canales suscritos** del cliente:
   Web Push y/o update del/los pase(s).

> Punto de diseño clave: la fricción (OTP + elegir canal) es **un evento único de enrolamiento**,
> idéntico para PWA y para Wallet. Después, todo es automático.

---

## Consecuencias arquitectónicas

- **Servicio de notificación multicanal con fan-out**: "notificar al cliente X: recompensa lista"
  debe ser una **abstracción** que despacha a los canales activos (Web Push, Apple, Google,
  y eventualmente WhatsApp). **No acoplar** la lógica de dominio a un proveedor.
- **Cambios de schema futuros** (aditivos, con RLS por tenant):
  - `push_subscriptions` (tenant_id, customer_id, endpoint, p256dh, auth).
  - `wallet_passes` (tenant_id, customer_id, channel `apple|google`, external_id/serial,
    auth_token, status).
  - `tenants.location` (lat/long) para geofencing del pase.
  - Preferencias de notificación por cliente (recompensa / inactividad / nuevo sello).
- **Scheduler** para recordatorios de inactividad (Vercel Cron o función programada de Supabase).
- **Habeas Data**: el opt-in de notificaciones debe registrarse junto al aviso de tratamiento de
  datos ya existente.

---

## Recomendación de secuencia (cuando se decida construir)

1. **PWA-lite instalable + Web Push** (service worker propio mínimo, **manteniendo Turbopack**):
   barato, push gratis, cubre fuerte el grueso Android. Es el mejor primer paso y reemplaza la
   necesidad inmediata de WhatsApp pago para retención.
2. **Google Wallet pass**: baja fricción de adopción, auto-update simple, costo casi nulo.
3. **Apple Wallet pass**: cuando el share iOS justifique el costo (US$99/año + cert + web service).
4. **Geofencing**: requiere coordenadas por tenant; sumar cuando haya señal de valor.

> Nota: esta secuencia **deja sin efecto la PR #15** (PWA con Serwist/webpack), cuyo único costo
> era cambiar el build a webpack para soportar caché offline que hoy no necesitamos. Ver discusión
> Turbopack vs webpack.

---

## Opciones evaluadas (resumen)

- **A — Solo PWA + Web Push.** Pros: gratis, interactivo, un canal. Contras: fricción de instalar
  (alta en iOS); el push iOS exige PWA instalada.
- **B — Solo Wallet passes.** Pros: baja fricción, auto-update nativo, push/geofence. Contras: más
  backend, costo/cert de Apple, pase pasivo (no interactivo).
- **C — Ambos, enrolamiento unificado (elegida como dirección).** Pros: el cliente elige según su
  fricción; máxima cobertura; la DB es la única fuente de verdad. Contras: más superficie a
  mantener → por eso se construye **por etapas** (ver secuencia).

**Dirección elegida:** C, construida incrementalmente empezando por PWA-lite + Web Push.

---

## Preguntas abiertas (un agente futuro DEBE consultarlas al humano antes de construir)

1. ¿Qué canal se construye primero? (recomendación: PWA push + Google Wallet; Apple después).
2. ¿El pase de Wallet es la **tarjeta primaria** o un **espejo** de la PWA?
3. ¿Se justifica pagar el Apple Developer Program (US$99/año) según el share de iOS de ese momento?
4. ¿Cómo se representa el **punch-card** dentro de un pase (imagen "strip" generada vs. campos de
   texto/puntos)? Los pases tienen layout limitado.
5. ¿Queremos/tenemos **coordenadas por tenant** para los recordatorios geolocalizados?
6. Cuando un cliente está en **varios negocios**, ¿un pase por tenant? (probable: sí).
7. ¿Preferencias **granulares** de notificación por cliente (recompensa / inactividad / nuevo
   sello), o un único opt-in?
8. Si el cliente **rechaza** el permiso de push, ¿cuándo y cómo se le vuelve a ofrecer?
9. ¿El servicio de notificación se hace **proveedor-agnóstico desde el día 1** (interfaz de canal)
   o se empieza acoplado a Web Push y se abstrae al sumar Wallet/WhatsApp?

---

*Documento vivo. Actualizar a medida que se decida y construya cada canal. Relacionado:
[ADR-004 (OTP del cliente)](./ADR-004-customer-otp.md), `docs/lista-de-deseos.md` (PWA, Wallet,
notificaciones).*
