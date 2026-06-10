# 🌟 Lista de deseos — Sellio

Backlog vivo de ideas para mejorar el producto (funcionalidad + experiencia +
expansión). No es un compromiso ni un orden cerrado: es un mapa para decidir qué
construir. Cada ítem trae una estimación grosera de **esfuerzo** (🟢 bajo /
🟡 medio / 🔴 alto) y de **valor** percibido.

> Estado del MVP a la fecha: Fase 1 prácticamente completa (auth de negocio,
> onboarding + logo, QR, vista del cliente con OTP, panel con sellos + canje
> manual, dashboard con analytics, gestión de clientes). Ver `docs/adr/` y el
> `CLAUDE.md` para el roadmap por fases.

---

## 1. Funcionalidad (corto plazo, sin dependencias externas)

| Idea | Valor | Esfuerzo | Notas |
|------|-------|----------|-------|
| **Detalle de cliente** | Alto | 🟡 | Vista con historial (línea de tiempo de sellos/canjes), datos y métricas del cliente. |
| **Paginación + orden de clientes** | Alto | 🟢 | Ordenar por nombre / sellos / más reciente; paginar o scroll infinito cuando crezca la lista. |
| **Export CSV de clientes** | Medio | 🟢 | Descargar nombre, teléfono, email, sellos, canjes. Útil para el negocio. |
| **Filtro "recompensa lista"** | Medio | 🟢 | Ver/ordenar clientes más cerca del premio o con canje disponible. |
| **Generador de afiche QR imprimible** | Alto | 🟡 | PDF/imagen con el QR + logo + “acumulá sellos”, para pegar en caja. Gran ayuda de adopción. |
| **Helper `getCurrentTenant()`** | Interno | 🟢 | Extraer el boilerplate `getUser` + buscar tenant que hoy se repite en cada action/página. Allana i18n y futuras features. |

## 2. Experiencia del cliente final

| Idea | Valor | Esfuerzo | Notas |
|------|-------|----------|-------|
| **PWA / “Agregar a inicio”** | Alto | 🟡 | La tarjeta se siente app nativa sin serlo (manifest + service worker básico). Muy alineado con “sin app nativa”. |
| **Confeti / micro-animación al canjear** | Medio | 🟢 | Momento de dopamina al completar/redimir. |
| **Recordatorio de “guardá tu link”** mejorado | Bajo | 🟢 | Hoy es un tip; se puede reforzar con “agregar a contactos/inicio”. |
| **Apple/Google Wallet** | Alto | 🔴 | Fase 2 del roadmap. Pases nativos en la wallet del teléfono. Complejo (certificados Apple, etc.). |

## 3. Apariencia / UX (pulido visual)

| Idea | Valor | Esfuerzo | Notas |
|------|-------|----------|-------|
| **Pasada de accesibilidad** | Medio | 🟡 | Focus states, roles ARIA, contraste, navegación por teclado. |
| **Tap targets grandes para el cajero** | Medio | 🟢 | Uso con una mano en caja; botones más grandes en el flujo de sellos. |
| **Skeletons de carga** | — | ✅ | Hecho para dashboard y clientes. Extender a más vistas si hace falta. |
| **Modo oscuro** | Bajo | 🟡 | Opcional; el branding gold ya tiene buen contraste. |

## 4. Crecimiento (Fase 2 — requieren proveedor externo)

| Idea | Valor | Esfuerzo | Dependencia |
|------|-------|----------|-------------|
| **Notificaciones al cliente** | Alto | 🟡 | “Tu recompensa está lista”, recordatorio de inactividad. Necesita proveedor (WhatsApp/email). |
| **Billing / suscripciones (Stripe)** | Alto | 🔴 | Cobrar la suscripción al negocio. Planes + checkout + webhooks + gating por plan. Necesita cuenta Stripe. |
| **Múltiples tipos de tarjeta** | Medio | 🟡 | Punch card, cashback, tiered (hoy: punch card). |
| **Analytics avanzados** | Medio | 🟡 | Cohortes, retención, top clientes, exportes. (Ya hay base: 7 días, recurrentes, tasa de canje.) |

---

## 5. 🌍 Multi-país y 🗣️ Multi-idioma (lo que más interesa)

Ambos están contemplados en la Fase 3 del `CLAUDE.md` (“soporte multi-país COP/MXN”).
El repo es chico y limpio, así que **es buen momento para sentar las bases ahora**,
antes de que crezca la cantidad de texto y de lógica de moneda.

### 5.1 Multi-idioma (i18n) — dificultad 🟡 baja-media

**Por qué importa:** habilita expandirse fuera del español. El driver real no es
inglés (LATAM hispano comparte idioma) sino **portugués (Brasil)**. Si Brasil entra
en el plan, i18n es prerequisito.

**Cómo lo haría:**
1. **Framework:** [`next-intl`](https://next-intl.dev) — estándar para el App Router de Next 16.
2. **Estrategia de locale:** por **cookie** (sin cambiar la URL) para no romper los
   links `/c/[slug]` existentes; selector de idioma en el panel y detección por
   navegador para el cliente.
3. **Catálogos:** `messages/es.json`, `messages/pt.json`, `messages/en.json`.
4. **Extracción de strings:** reemplazar los textos hardcodeados por `t('clave')`.
   Es el grueso del trabajo, pero **mecánico** y se puede hacer **incremental,
   pantalla por pantalla**, empezando por el **flujo del cliente** (landing +
   tarjeta), que es lo de mayor valor.
5. **Mensajes de error de las server actions:** hoy devuelven texto en español;
   convendría que devuelvan **códigos** y traducir en la UI (o pasar `locale`).

**Esfuerzo estimado:** setup ~1–2 h; extracción ~1–2 días enfocados (o incremental).
**Riesgo:** bajo — la superficie es pequeña hoy.

### 5.2 Multi-país — dificultad 🟡 media

Más allá del idioma, “multi-país” implica:
1. **Moneda y formato:** mostrar montos con `Intl.NumberFormat` por país (COP, MXN,
   BRL). Hoy casi no se muestran montos (las recompensas son texto), así que es
   barato empezar.
2. **Teléfono:** la normalización a E.164 ya existe con default `+57`; habría que
   hacer el **código de país configurable por negocio** (hoy asume Colombia).
3. **Zona horaria:** los analytics ya agrupan en `America/Bogota`; debería pasar a
   ser **configurable por tenant** (ej. `tenants.timezone`).
4. **Habeas Data / legales:** el aviso actual cita la Ley 1581 de Colombia; por país
   habría que ajustar el texto legal (se resuelve junto con i18n).
5. **Billing localizado** (Fase 2): métodos de pago y moneda por país en Stripe.

**Cambios de schema sugeridos (cuando se encare):** `tenants.country_code`,
`tenants.timezone`, `tenants.locale`. Pequeños y aditivos.

---

## 6. Notas de mantenibilidad

- **El repo está sano:** patrones consistentes, TS estricto, RLS encapsulada en
  `withAuth`, tests + CI. Agregar features sigue un molde claro.
- **Deuda menor a vigilar:** (a) textos hardcodeados → i18n; (b) boilerplate
  repetido de tenant/usuario → `getCurrentTenant()`; (c) faltan tests de
  integración de RLS (hoy solo unitarios de dominio).

---

*Documento vivo. Actualizar a medida que se priorice o se complete cada ítem.*
