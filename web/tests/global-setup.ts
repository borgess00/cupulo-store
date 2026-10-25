import { execSync } from "node:child_process";

// Aplica as migrations no banco de teste antes de rodar.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://cupulo:cupulo@localhost:5432/cupulo_test";
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
