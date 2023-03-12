import { createRequire } from "module";

// Below is a workaround for importing non-type values from @prisma/client
// which throws the vague error below at runtime in the production build:
// `Uncaught TypeError: Error resolving module specifier “.prisma/client/index-browser”. Relative module specifiers must start with “./”, “../” or “/”.`
// https://github.com/prisma/prisma/issues/12504
export function prismaPlugin() {
  const require = createRequire(import.meta.url);
  const pathName = require.resolve("@prisma/client").replace("@prisma/client/index.js", "");

  return {
    name: "prisma-vite-plugin",
    config: () => ({
      resolve: {
        alias: {
          ".prisma/client/index-browser": `${pathName}.prisma/client/index-browser.js`,
        },
      },
    }),
  };
}
