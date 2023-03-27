import solid from "solid-start/vite";
import { defineConfig } from "vite";
import { isoImport } from "vite-plugin-iso-import";
import webfontDownload from "vite-plugin-webfont-dl";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import Icons from "unplugin-icons/vite";
import { prismaPlugin } from "./prisma/prisma-vite-plugin";
import devtools from "solid-devtools/vite";

export default defineConfig({
  plugins: [
    devtools({
      autoname: true,
      locator: {
        targetIDE: "vscode",
        componentLocation: true,
        jsxLocation: true,
      },
    }),
    solid(),
    isoImport(),
    webfontDownload([
      "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;800&display=swap&family=Inter:wght@500;600;700",
    ]),
    ViteImageOptimizer(),
    Icons({
      compiler: "solid",
    }),
    prismaPlugin(),
  ],
  ssr: { external: ["@prisma/client"], noExternal: ["@kobalte/core"] },
});
