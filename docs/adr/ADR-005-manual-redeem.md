# ADR-005: Canje manual + integridad de sellos

**Fecha:** 2026-06-10
**Estado:** Aceptada

## Contexto

`addStamp` canjeaba **automáticamente**: al llegar al sello requerido, en la misma
acción reiniciaba la tarjeta a 0 y sumaba el canje. Problema de negocio: la tarjeta
se "canjeaba" sin que el cajero confirmara que **entregó el premio**, y no había
forma de corregir un sello dado por error. El scope del MVP pedía explícitamente
"registrar canje manual".

## Decisión

Separar **sellar** de **canjear**, y agregar **deshacer**:

1. **`addStamp`** ya no auto-canjea. Suma un sello y, si completa la tarjeta, la deja
   en estado "lista" (`full`). Si la tarjeta ya está llena, **rechaza** sellar de más.
2. **`redeemReward`** (nueva): acción explícita del cajero. Solo procede si
   `canRedeem()`; reinicia a 0, suma `totalRedeemed` y registra el evento `redeem`.
   Esto es la confirmación de "premio entregado".
3. **`undoLastStamp`** (nueva): deshace el último sello dentro de una ventana de
   5 minutos (corrección de error del cajero). Borra el evento y decrementa.

La lógica de transición se extrajo a funciones **puras** en `src/lib/loyalty.ts`
(`applyStamp`, `canRedeem`, `isWithinCooldown`, `normalizePhoneToE164`) para poder
testearla sin DB. Las server actions las consumen.

### UI
`StampButton` ahora muestra **"🎁 Canjear"** cuando la tarjeta está completa, y
**"+1 Sello"** (o "🎁 Último sello") cuando no. Tras sellar aparece un enlace
**"Deshacer"** por unos segundos.

### Anti-fraude (refuerza Paso 1)
- Cooldown de 3 s por tarjeta entre sellos (anti doble-tap).
- Tope de sellos: no se puede pasar de `stampsRequired` (hay que canjear primero).

### Métrica
El dashboard ahora cuenta "Sellos dados" filtrando `eventType = 'stamp'` (antes
incluía los `redeem`).

## Consecuencias

- El canje es un acto consciente: no se descuenta sin entrega del premio.
- Un sello erróneo es reversible dentro de la ventana (auditable: se borra su evento).
- `src/lib/loyalty.ts` queda como capa de dominio testeable; ver
  `tests/unit/loyalty.test.ts`.
