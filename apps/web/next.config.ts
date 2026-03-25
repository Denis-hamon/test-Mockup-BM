import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@legalconnect/shared",
    "@legalconnect/crypto",
    "@legalconnect/email",
  ],
};

export default nextConfig;
