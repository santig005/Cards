import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Service worker (PWA) con @serwist/next. Conservador a propósito en multi-tenant:
// - SW deshabilitado en desarrollo (evita cachés que confunden el dev loop).
// - El SW se genera desde `src/app/sw.ts` y se emite a `public/sw.js`.
// Nota: @serwist/next es un plugin de webpack; por eso el script `build` usa
// `next build --webpack` (Next 16 usa Turbopack por defecto, que no ejecuta el
// plugin). Ver ADR-007.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // En dev no queremos SW: ni precache ni runtime caching mientras desarrollamos.
  disable: process.env.NODE_ENV !== "production",
  // El registro lo hace nuestro componente <PwaRegister/>; no inyectamos script.
  register: false,
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El default de Next para el body de Server Actions es 1 MB; la subida de
      // logo (validada a <=2 MB) lo excedía. Damos margen para el archivo + campos.
      bodySizeLimit: "4mb",
    },
  },
};

export default withSerwist(withNextIntl(nextConfig));
