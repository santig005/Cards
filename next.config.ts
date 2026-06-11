import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El default de Next para el body de Server Actions es 1 MB; la subida de
      // logo (validada a <=2 MB) lo excedía. Damos margen para el archivo + campos.
      bodySizeLimit: "4mb",
    },
  },
};

export default withNextIntl(nextConfig);
