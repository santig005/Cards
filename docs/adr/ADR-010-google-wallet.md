# ADR-010: Pase de Google Wallet (etapa 2 de entrega de la tarjeta)

**Fecha:** 2026-06-15
**Estado:** Aceptada — en construcción
**Relacionado:** [ADR-009](./ADR-009-customer-card-delivery.md) (dirección general), [ADR-004](./ADR-004-customer-otp.md) (OTP del cliente)

## Contexto

El ADR-009 definió la dirección (C: PWA + Wallet, por etapas). La etapa 1 (PWA-lite +
Web Push) ya está en `main` y probada. Esta etapa agrega el **pase de Google Wallet** como
segundo canal de entrega: el cliente guarda su tarjeta en Google Wallet con un tap y el pase
se **auto-actualiza** cuando suma sellos o completa la recompensa, sin re-login.

Se eligió Google antes que Apple porque es **gratis** y de menor fricción (Apple = US$99/año
+ certificados + web service propio). Ver ADR-009 §"Las tres vías".

## Investigación (2026-06-15, docs oficiales de Google)

- **Costo:** sin fees. El API y la cuenta de emisor son gratuitos.
- **Onboarding:** cuenta de emisor en la Google Pay & Wallet console → `issuerId`; habilitar
  la Google Wallet API en Google Cloud; **service account** (JSON) para el REST API.
- **Demo mode → publishing access:** las cuentas nuevas solo emiten a cuentas de prueba hasta
  que se solicita acceso de publicación desde el dashboard. Suficiente para desarrollar ya.
- **Disponibilidad:** sin restricción de país documentada para emisor ni usuario final;
  Google Wallet funciona para usuarios Android en Colombia/LATAM.

Fuentes: developers.google.com/wallet/retail/loyalty-cards (issuer-onboarding, faq).

## Decisiones (responden las preguntas abiertas del ADR-009)

- **Q2 — El pase es un ESPEJO.** La tarjeta en DB (`loyalty_cards`) sigue siendo la única
  fuente de verdad; el pase es una vista que se sincroniza vía PATCH del Loyalty Object.
- **Q4 — Representación: imagen "strip" dinámica.** Los sellos se muestran como una imagen
  generada server-side (círculos llenos/vacíos, estética de la tarjeta web) en el `heroImage`
  del pase, además de campos de texto (`loyaltyPoints` = "3/10", descripción de la recompensa)
  como respaldo accesible. **Nota técnica crítica:** Google **cachea las imágenes por URL**, así
  que la URL del strip debe ser **versionada por estado** (p.ej. `/api/wallet/strip/<cardId>?s=3`)
  y el PATCH del objeto debe apuntar a la nueva URL en cada cambio para forzar el refetch.
- **Q5 — Geofencing: NO en esta etapa.** No tenemos coordenadas por tenant. Se difiere (sumaría
  columna lat/long + UI de onboarding + campo `locations` del pase).
- **Q6 — Un Loyalty Object por (tenant, cliente).** Una **Loyalty Class** por programa/tenant; un
  **Loyalty Object** por cada `loyalty_card`. Cliente en varios negocios → varios pases.
- **Actualizaciones: reusar la abstracción de canales** (ADR-009 Q9). Se agrega un
  `googleWalletChannel` al fan-out de `notifyCustomer`: en cada sello hace PATCH del objeto
  (estado + heroImage versionado) y, al completar la recompensa, `addMessage` para que aparezca
  como notificación en el pase. La lógica de dominio (`addStamp`) no cambia.
- **Credenciales por entorno, canal opcional.** La service account y el `issuerId` se leen de env
  vars server-side; si faltan, el canal es NO-OP silencioso (igual que `webPushChannel`), para no
  romper build/dev ni bloquear el resto de canales.

## Consecuencias

- **Schema nuevo (aditivo, RLS por tenant):** `wallet_passes` (tenant_id, customer_id,
  channel `google`, object_id, class_id, status, created_at). Migración a aplicar a mano en
  Supabase (convención del proyecto).
- **Endpoint de generación de imagen** del strip (server-side; el repo ya usa `sharp` y tiene
  precedente en `/pwa-icon/[size]`). URLs públicas y versionadas por estado.
- **Endpoint/acción "Save to Google Wallet"** que crea (o reusa) la Loyalty Class del tenant y el
  Loyalty Object del cliente, y devuelve el JWT firmado para el botón. Conviven con el opt-in de
  Web Push en la misma pantalla de la tarjeta (enrolamiento unificado).
- **Dependencia externa con trámite:** el `issuerId` + service account los crea el humano en
  Google Cloud. El canal se construye en paralelo y se activa al setear las env vars. Para
  lanzamiento público hay que pasar de demo mode a publishing access.
- **Env vars nuevas:** `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SA_EMAIL`,
  `GOOGLE_WALLET_SA_PRIVATE_KEY` (o ruta/Base64 del JSON), `GOOGLE_WALLET_CLASS_SUFFIX`.

## Pendiente / fuera de alcance

- **Apple Wallet** (ADR-009 Q3): cuando el share iOS justifique el costo.
- **Geofencing** (Q5): requiere coordenadas por tenant.
- **Publishing access** (salir de demo mode): trámite previo al lanzamiento público real.

---

*Documento vivo. Actualizar al construir cada parte.*
