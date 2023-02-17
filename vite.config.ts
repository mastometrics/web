import solid from "solid-start/vite";
import { defineConfig } from "vite";
import { isoImport } from "vite-plugin-iso-import";

export default defineConfig({
  plugins: [solid(), isoImport()],
  ssr: { external: ["@prisma/client"], noExternal: ["@kobalte/core"] },
});
