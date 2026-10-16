// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { existsSync } from "node:fs";

// Server code reads its configuration from process.env at runtime, load .env for `astro dev`
// (variables that are already set take precedence)
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [solid()],
  // Keep whitespace handling identical to the previous (SolidStart) markup
  compressHTML: true,
  vite: {
    plugins: [tailwindcss(), Icons({ compiler: "solid" })],
    ssr: {
      noExternal: ["@kobalte/core"],
    },
  },
});
