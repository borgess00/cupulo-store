import { db } from "@/lib/db";

export async function resetDb() {
  await db.$executeRawUnsafe(
    `TRUNCATE "DownloadLog","Redemption","Access","Key","ProductFile","ChangelogEntry","Product","User","RateLimit","AuditLog" RESTART IDENTITY CASCADE`,
  );
}

let n = 0;
export async function makeUser(name = "user") {
  n++;
  return db.user.create({ data: { discordId: `9000000000000${String(n).padStart(5, "0")}`, username: `${name}${n}` } });
}

export async function makeProduct(slug = "pack-teste") {
  return db.product.create({
    data: { slug, name: "Pack Teste", shortDesc: "x", description: "x", category: "Packs", platform: "ANDROID" },
  });
}

export const DAY = 24 * 60 * 60 * 1000;

/** Diferença em dias (com casas) entre a data e agora. */
export function daysFromNow(d: Date | null | undefined) {
  return d ? (d.getTime() - Date.now()) / DAY : NaN;
}
