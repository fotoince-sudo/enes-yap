// Enes Yapı — Lovable'dan bağımsız, düz Vite yapılandırması.
// Türkhosting (Plesk Node.js) için normal Node sunucusu çıktısı: .output/server/index.mjs
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // SSR hata sarmalayıcısı: src/server.ts
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: "node-server" })] : []),
    viteReact(),
  ],
}));
