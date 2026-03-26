import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@legalconnect/shared",
    "@legalconnect/crypto",
    "@legalconnect/email",
  ],
};

export default withNextIntl(nextConfig);
