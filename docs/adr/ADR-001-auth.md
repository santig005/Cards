# ADR-001: Supabase Auth sobre Clerk

**Fecha:** 2026-05-27  
**Estado:** Aceptada

## Contexto

El proyecto necesita autenticación para dos tipos de usuario:
1. **Tenant (negocio):** email/password para acceder al panel de administración.
2. **Cliente final:** OTP por celular (registro progresivo, sin formulario explícito).

Se evaluó si usar Clerk o Supabase Auth como proveedor.

## Opciones evaluadas

- **Clerk:** Excelente DX, componentes UI preconstruidos, pero añade una dependencia de pago externa. Para el cliente final con OTP por celular, requiere configuración adicional. Tiene su propio SDK separado de la DB.
- **Supabase Auth (built-in):** Auth + DB en un solo proveedor. Soporta email/password, magic links y phone OTP nativamente. El JWT de Supabase Auth es el mismo que se usa en las políticas RLS de la DB.

## Decisión

Se elige **Supabase Auth** porque:
- Elimina una dependencia externa (y su costo adicional en escala).
- El JWT de auth se integra directamente con las políticas RLS — no se necesita middleware para inyectar `tenant_id`.
- Phone OTP está disponible nativamente para el flujo del cliente final.
- Un solo proveedor para auth + DB reduce la complejidad operativa del MVP.

## Consecuencias

- Si en el futuro se necesitan features avanzadas de auth (SSO enterprise, passwordless avanzado, magic links branded), evaluar migración a Clerk como ADR de revisión.
- El `tenant_id` se maneja como metadata en el JWT de Supabase (campo `app_metadata`).
