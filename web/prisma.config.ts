import "dotenv/config";
import { defineConfig } from "prisma/config";

// A CLI (migrations) usa a conexão direta; o app em runtime usa DATABASE_URL (pooler).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
