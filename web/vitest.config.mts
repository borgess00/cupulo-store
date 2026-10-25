import path from "node:path";
const __dirname = import.meta.dirname;
import { defineConfig } from "vitest/config";

// Os testes de integração usam um banco SEPARADO (TEST_DATABASE_URL), que é limpo a cada teste.
const testDb = process.env.TEST_DATABASE_URL ?? "postgresql://cupulo:cupulo@localhost:5432/cupulo_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL: testDb,
      KEY_PEPPER: "pepper-de-teste-com-mais-de-32-caracteres-123456",
      BOT_API_TOKEN: "token-de-teste-com-mais-de-32-caracteres-abcdef",
    },
  },
});
