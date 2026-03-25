import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
      "@legalconnect/shared": path.resolve(__dirname, "packages/shared/src"),
      "@legalconnect/email": path.resolve(__dirname, "packages/email/src"),
    },
  },
});
