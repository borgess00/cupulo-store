import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type AuditAction =
  | "KEY_GENERATE"
  | "KEY_REVOKE"
  | "ACCESS_GRANT"
  | "ACCESS_REMOVE"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "FILE_UPLOAD"
  | "FILE_DELETE"
  | "USER_BAN"
  | "USER_UNBAN";

export async function audit(
  actor: string,
  action: AuditAction,
  target?: string,
  meta?: Prisma.InputJsonValue,
  client: Pick<typeof db, "auditLog"> = db,
) {
  await client.auditLog.create({ data: { actor, action, target, meta } });
}
