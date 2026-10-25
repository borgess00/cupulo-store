import { execSync } from "node:child_process";

// Aplica as migrations no banco de teste antes de rodar.
// Os testes APAGAM as tabelas: por segurança, só rodam num banco cujo nome contém "test".
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://cupulo:cupulo@localhost:5432/cupulo_test";
  const dbName = new URL(url).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    console.error(`\n✖ Recusando rodar testes no banco "${dbName}": o nome do banco de teste precisa conter "test".\n`);
    process.exit(1);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
