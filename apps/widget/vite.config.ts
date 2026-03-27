import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "LegalConnectWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    cssCodeSplit: false,
    target: "es2020",
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Ensure everything is inlined into a single file
        inlineDynamicImports: true,
      },
    },
  },
});
