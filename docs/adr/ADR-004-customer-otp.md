# ADR-004: Auth del cliente final con OTP (WhatsApp)

**Fecha:** 2026-06-10
**Estado:** Aceptada

## Contexto

Tras el Paso 1 (RLS), quedaba un hueco: la tarjeta del cliente
(`/c/[slug]/tarjeta/[cardId]`) era **pública** — cualquiera con el `cardId` la veía,
y cualquiera podía crear/consultar fichas escribiendo un teléfono. Había que
autenticar al cliente final sin agregar fricción innecesaria (insight de CLAUDE.md:
los programas fracasan cuando el onboarding del cliente es complejo).

La memoria del proyecto ya fijaba: **OTP por celular, registro progresivo, sin
formulario explícito**.

## Decisión

OTP de un solo paso vía **Supabase Phone Auth**, canal **WhatsApp** (mejor
entregabilidad y costo en LATAM que SMS — ver más abajo). Flujo:

1. Cliente ingresa su celular → `requestOtp()` valida negocio/programa y llama
   `supabase.auth.signInWithOtp({ phone, options: { channel: 'whatsapp' } })`.
2. Ingresa el código → `verifyOtp()` hace `verifyOtp({ phone, token, type: 'sms' })`,
   lo que crea la **sesión** (cookies) y un `auth.users` con su teléfono.
3. Se vincula/crea la ficha: `customers.auth_user_id = auth.uid()` y su tarjeta.
4. La tarjeta queda **privada**: la página exige sesión y carga la tarjeta con
   `withAuth(uid)`; RLS (`cards_self_select`) bloquea cualquier tarjeta ajena.

**Progresivo:** una vez verificado, la sesión persiste (middleware refresca en
`/c/*`). En visitas siguientes, el landing detecta la sesión y manda directo a la
tarjeta — sin pedir OTP de nuevo.

### Normalización de teléfono
Se normaliza a **E.164** (requisito de Supabase). Sin código de país se asume
**Colombia (+57)**; con `+` el usuario puede sobreescribirlo.

### Qué corre como servicio (y por qué)
La escritura del Paso 2 (reclamar/crear ficha + tarjeta) corre por la conexión de
servicio: el cliente recién "reclama" una ficha que pudo crearse con
`auth_user_id` nulo, así que RLS todavía no se la deja ver/actualizar. Es seguro
porque está **acotada por el teléfono ya verificado por OTP**. Las lecturas
posteriores sí pasan por RLS.

### RLS (migración 0002)
- `customers_self_select`: el cliente ve su ficha (`auth_user_id = auth.uid()`).
- `cards_self_select`: el cliente ve sus tarjetas.
- Tenant/programa son **info pública** (ya se muestran en el landing) → se leen vía
  servicio, no necesitan política de cliente.

## Configuración requerida en Supabase (acción del dev)

> El código funciona, pero necesita el proveedor configurado para enviar mensajes.

1. **Authentication → Providers → Phone:** habilitar "Phone".
2. Para **desarrollo sin gastar**: Authentication → Phone → **Test OTP** — agregar
   un número de prueba con su código fijo. Permite verificar el flujo completo sin
   enviar WhatsApp real.
3. Para **producción**: conectar **Twilio** (o proveedor con soporte WhatsApp) y
   habilitar el canal WhatsApp. Cargar `Account SID`, `Auth Token` y el remitente.

## Opciones evaluadas (canal)

- **WhatsApp (elegida):** domina en LATAM, mejor entregabilidad, más barato.
- **SMS:** más universal pero más caro y con entregabilidad irregular en la región.
- **Email/magic link:** descartado, el producto se ancla en el celular.

## Consecuencias

- La tarjeta deja de ser pública: requiere sesión + es del propio cliente (RLS).
- Dependencia operativa nueva: proveedor de mensajería (costo variable por país).
- **Pendiente:** botón "salir" para el cliente (logout) y, una vez estable el
  flujo del cliente, evaluar `FORCE RLS` para blindar también la ruta de servicio.
- Reaprovecha el mismo `auth.users` que el dueño; un cliente autenticado que entre
  a `/dashboard` es redirigido (no posee tenant). Caso "misma persona dueña y
  clienta" se ignora en MVP.
