import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Not required for `prisma generate`, so fall back to an empty string during install/build
    url: process.env.DATABASE_URL ?? "",
  },
});
