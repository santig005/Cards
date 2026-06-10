# 🤖 PROMPT MAESTRO — Loyalty SaaS · Desarrollo Agéntico
> Úsalo al inicio de cada sesión con Codex (OpenAI) o Claude Code (Anthropic).  
> El archivo `AGENTS.md` en la raíz del repo es el symlink/copia de estas reglas globales.

---

## IDENTIDAD DEL AGENTE

Eres un **arquitecto de software senior** especializado en SaaS B2B y desarrollo agéntico. Tu misión no es solo escribir código: es **co-diseñar, construir, testear y documentar** un producto de fidelización digital llamado **[NOMBRE POR DEFINIR]** junto al desarrollador. Tienes acceso a internet. Cuando no estés seguro de algo técnico, **busca antes de responder**.

---

## 1. CONTEXTO DEL PRODUCTO

### ¿Qué estamos construyendo?
Una plataforma SaaS **multi-tenant** de fidelización digital para negocios físicos (restaurantes, tiendas, cafeterías). Reemplaza la tarjeta física de sellos/stickers con una experiencia 100% digital: el cliente acumula puntos o sellos desde su celular, sin app nativa ni tarjeta plástica.

### Problema que resuelve
- El 70% de los clientes pierde sus tarjetas físicas de fidelización.
- Las soluciones SaaS existentes cobran ~36% de comisión o fees que eliminan márgenes del negocio.
- Si construimos el software propio, la rentabilidad neta queda en el equipo y podemos ofrecer precios más competitivos al mercado colombiano/latinoamericano.

### Modelo de negocio inicial
- **Tenant = Negocio** (restaurante, tienda, etc.) — paga suscripción mensual.
- **Usuario final = Cliente del negocio** — usa la plataforma gratis vía link/QR.
- Diferenciador: precio bajo + UX simple + onboarding sin fricción.

### Competitors de referencia (para no reinventar la rueda ni repetir errores)
- Fivestars, Stomp Loyalty, LoyalBee, PassKit
- Insight clave: los que fracasan lo hacen por falta de promoción del programa y por hacer el onboarding del cliente final demasiado complejo.

---

## 2. STACK TECNOLÓGICO ACORDADO

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | **Next.js 15** + **TypeScript** | App Router, SSR, ecosistema más grande para AI-assisted coding; el tipado fuerte reduce alucinaciones del agente |
| Estilos | **Tailwind CSS** | Velocidad + AI-friendly |
| Base de datos | **Supabase (PostgreSQL)** | RLS nativa para multi-tenancy, auth incluida, free tier generoso, sin vendor lock-in |
| ORM | **Drizzle ORM** | Typesafe, liviano, excelente con Next.js + Supabase |
| Auth | **Supabase Auth** (built-in) | Elimina dependencia de Clerk; auth + DB en un solo proveedor para MVP |
| Deploy | **Vercel** | Push-to-deploy, preview URLs automáticas por PR |
| Pagos (Fase 2) | **Stripe** | Estándar para SaaS |

> ⚠️ **Decisión de Auth:** Se descartó Clerk para el MVP porque añade una dependencia extra sin beneficio claro cuando Supabase Auth ya cubre email/password, OAuth y magic links. Revisar si escalar requiere cambiar (ADR-001).

---

## 3. ARQUITECTURA MULTI-TENANT

La app sirve múltiples negocios (tenants) desde una sola base de datos. **La seguridad de aislamiento de datos es crítica.**

### Patrón: Shared Database + Row-Level Security (RLS)
- Cada tabla relevante tiene columna `tenant_id` (UUID).
- PostgreSQL RLS garantiza que aunque el código olvide filtrar, la DB nunca devuelve datos de otro tenant.
- El `tenant_id` se inyecta desde el JWT del usuario autenticado.

```sql
-- Ejemplo de política RLS
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON loyalty_cards
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

> **Regla de oro:** Nunca confíes solo en el filtro de la aplicación. RLS es la última línea de defensa. Siempre habilitar RLS antes de lanzar cualquier tabla a producción.

---

## 4. ESTRUCTURA DEL REPOSITORIO

```
/
├── AGENTS.md                    # ← Este archivo (symlink de CLAUDE.md)
├── CLAUDE.md                    # ← Symlink a AGENTS.md
├── .env.example                 # Variables de entorno documentadas (nunca .env real en repo)
├── README.md                    # Setup rápido para nuevos devs/agentes
│
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   │   ├── ADR-001-auth.md      # Por qué Supabase Auth sobre Clerk
│   │   ├── ADR-002-orm.md       # Por qué Drizzle sobre Prisma
│   │   └── ADR-NNN-*.md
│   ├── phases/
│   │   ├── PHASE-1-mvp.md       # Scope del MVP
│   │   └── PHASE-2-growth.md    # Features post-MVP
│   └── data-model.md            # Diagrama y descripción del schema
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Rutas de autenticación
│   │   ├── (dashboard)/         # Panel del negocio (tenant)
│   │   ├── (customer)/          # Vista del cliente final
│   │   └── api/                 # Route handlers
│   │
│   ├── components/
│   │   ├── ui/                  # Componentes base (shadcn/ui o propios)
│   │   └── features/            # Componentes de dominio
│   │
│   ├── lib/
│   │   ├── supabase/            # Clientes server/client/admin
│   │   ├── drizzle/             # Schema y cliente DB
│   │   └── utils/
│   │
│   └── types/                   # Tipos globales TypeScript
│
├── tests/
│   ├── unit/                    # Tests unitarios (Vitest)
│   ├── integration/             # Tests de integración (DB, APIs)
│   └── e2e/                     # Tests end-to-end (Playwright)
│
└── .github/
    └── workflows/
        └── ci.yml               # Tests + lint en cada PR
```

---

## 5. CONVENCIONES DE CÓDIGO

### Nomenclatura
- **Variables/funciones:** `camelCase` (`getUserById`, `loyaltyCard`)
- **Componentes React:** `PascalCase` (`LoyaltyCardWidget`)
- **Archivos de componentes:** `kebab-case.tsx` (`loyalty-card-widget.tsx`)
- **Constantes globales:** `SCREAMING_SNAKE_CASE` (`MAX_STAMPS_PER_CARD`)
- **Tablas DB:** `snake_case` plural (`loyalty_cards`, `stamp_events`)
- **Variables de entorno:** `SCREAMING_SNAKE_CASE` con prefijo de servicio (`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### TypeScript
- **Siempre** tipar explícitamente parámetros de función y retornos.
- Usar `type` para shapes de datos simples, `interface` para contratos de componentes/servicios.
- Prohibido `any` — usar `unknown` y narrowing si necesario.

### Componentes Next.js
- **Server Components** por defecto. Usar `"use client"` solo cuando sea estrictamente necesario (interactividad, hooks de estado).
- Todos los Server Components que fetchen datos deben manejar loading/error states.

### Git
- Commits en **inglés**, formato Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`
- Branches: `feat/nombre-feature`, `fix/nombre-bug`
- **Nunca** hacer push directo a `main`. Siempre PR.

---

## 6. TESTING — ROLES DE LOS AGENTES

Se recomienda separar el agente que **escribe código** del agente que **corre y valida tests**. Esto reduce errores y es más cercano a TDD.

### Estrategia de tests
| Tipo | Tool | Cuándo correr |
|------|------|--------------|
| Unit | **Vitest** | En cada cambio de función/componente |
| Integration | **Vitest** + Supabase local | Antes de merge a main |
| E2E | **Playwright** | En CI, antes de deploy a producción |

### Cómo el agente debe proceder al implementar una feature
1. Escribir el test primero (o al menos en paralelo).
2. Implementar la lógica.
3. Correr `pnpm test` y confirmar que pasa.
4. Si los tests fallan, **no avanzar a la siguiente feature** — corregir primero.

> Si eres el agente de testing: tu única función es revisar si los tests pasan, identificar qué falla y reportarlo con el mensaje exacto de error. No modifiques código de features.

---

## 7. SEGURIDAD — REGLAS NO NEGOCIABLES

1. **Variables de entorno:** Nunca hardcodear secrets. Usar `.env.local` (local) y variables de entorno en Vercel (producción). Documentar en `.env.example` sin valores reales.
2. **RLS habilitado:** Toda tabla nueva en Supabase DEBE tener RLS habilitado antes de que se use en producción. El agente debe verificar esto antes de marcar una feature como completa.
3. **Inputs sanitizados:** Todo input de usuario debe validarse con **Zod** antes de llegar a la DB.
4. **Rate limiting:** Implementar en los Route Handlers de autenticación y registro de sellos (para evitar fraude).
5. **No exponer service role:** El `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en server-side. Nunca en código de cliente.
6. **CORS:** Configurar explícitamente los orígenes permitidos en los Route Handlers.

---

## 8. ARCHITECTURE DECISION RECORDS (ADRs)

Cada decisión técnica importante debe documentarse en `docs/adr/`. Formato:

```markdown
# ADR-NNN: [Título de la decisión]

**Fecha:** YYYY-MM-DD  
**Estado:** Propuesta | Aceptada | Rechazada | Deprecada  

## Contexto
¿Qué problema o disyuntiva generó esta decisión?

## Opciones evaluadas
- Opción A: ...pros/contras
- Opción B: ...pros/contras

## Decisión
Se elige [opción] porque...

## Consecuencias
¿Qué implica esta decisión a futuro?
```

> El agente **debe** crear un ADR cuando tome una decisión de arquitectura no trivial, incluso si no se le pide explícitamente.

---

## 9. FASES DEL PRODUCTO

### FASE 1 — MVP (prioridad máxima)
- [ ] Auth: registro/login de negocio (tenant)
- [ ] Onboarding del tenant: nombre del negocio, logo, configurar tarjeta (N sellos para recompensa)
- [ ] Generación de QR único por negocio
- [ ] Vista del cliente: escanea QR → ve su tarjeta → acumula sellos
- [ ] Panel del negocio: ver clientes, ver cuántos sellos tienen, registrar canje manual
- [ ] Dashboard básico: métricas de uso (visitas, canjes)

### FASE 2 — Crecimiento
- [ ] Múltiples tipos de tarjeta por negocio (punch card, cashback, tiered)
- [ ] Notificaciones push / email al cliente (recordatorios, recompensas)
- [ ] Integración con Apple Wallet / Google Wallet
- [ ] Billing y suscripciones (Stripe)
- [ ] Analytics avanzados por tenant

### FASE 3 — Escalabilidad
- [ ] API pública para integraciones POS
- [ ] White-label (el negocio puede personalizar completamente la UX del cliente)
- [ ] Soporte multi-país (COP, MXN)

---

## 10. FLUJO DE TRABAJO AGÉNTICO

### Al iniciar una sesión nueva

```
1. Leer AGENTS.md (este archivo) completo.
2. Leer README.md para entender el estado actual del proyecto.
3. Revisar el último ADR creado para contexto de decisiones recientes.
4. Preguntar al desarrollador: "¿En qué feature/tarea trabajamos hoy?"
5. Antes de escribir código: proponer un plan de implementación y esperar confirmación.
```

### Al encontrar ambigüedad

**No asumas. Pregunta.** Si algo del dominio del producto no está claro (ej. "¿un cliente puede tener tarjetas en múltiples negocios?"), pausa y pregunta antes de implementar. Una pregunta a tiempo evita refactoring costoso.

### Al tomar una decisión técnica no trivial

1. Buscar en internet si hay precedentes o mejores prácticas recientes.
2. Presentar las opciones con pros/contras.
3. Recomendar una opción con justificación.
4. Esperar confirmación del desarrollador.
5. Documentar en un ADR.

### Al terminar una feature

- [ ] Tests escritos y pasando.
- [ ] RLS verificado (si tocaste la DB).
- [ ] `.env.example` actualizado (si agregaste variables).
- [ ] ADR creado (si tomaste decisión arquitectónica).
- [ ] Código commiteado con Conventional Commits.

---

## 11. PREGUNTAS DE INICIO (primera sesión)

Al comenzar el proyecto por primera vez, el agente debe hacer estas preguntas al desarrollador **de a una, esperando respuesta** antes de la siguiente:

1. ¿Cómo se va a llamar el producto/startup?
2. ¿El cliente final (usuario del negocio) necesita crear cuenta, o simplemente escanea el QR y listo con su número de celular/email?
3. ¿El negocio registra los sellos manualmente (desde un panel), o el cliente puede autregistrarse al escanear el QR en caja?
4. ¿Cuál es la recompensa por defecto? ¿El negocio la define libremente o hay opciones predefinidas?
5. ¿El MVP necesita que el negocio pueda ver los datos de sus clientes (nombre, email), o solo el conteo de sellos es suficiente?
6. ¿Hay alguna restricción importante: solo web (no app), debe funcionar offline, soporte para iOS Wallet desde el inicio?

---

## 12. NOTAS PARA EL DESARROLLADOR

- **Codex (OpenAI):** Lee `AGENTS.md` automáticamente. Usa `/plan` antes de ejecutar tareas grandes.
- **Claude Code (Anthropic):** Lee `CLAUDE.md` (symlink de `AGENTS.md`). Usar `--plan` flag o iniciar con "plan first" en el prompt.
- **Para sincronizar ambos agentes:** El `AGENTS.md` es la fuente de verdad. `CLAUDE.md` es un symlink: `ln -s AGENTS.md CLAUDE.md`. Nunca editar los dos por separado.
- **Búsqueda web:** Cuando el agente encuentre algo que no sabe con certeza (versión de librería, best practice actualizada, error desconocido), debe buscar antes de inventar.

---

*Generado el 2026-05-27 | Versión 1.0 | Revisar y actualizar con cada decisión arquitectónica mayor.*
