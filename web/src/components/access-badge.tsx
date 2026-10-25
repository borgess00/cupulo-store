import { Badge } from "@/components/ui/badge";
import type { AccessStatus } from "@/lib/access-math";

export function AccessBadge({ status }: { status: AccessStatus }) {
  if (status === "lifetime") return <Badge tone="solid">Vitalício</Badge>;
  if (status === "active") return <Badge>Ativo</Badge>;
  return <Badge tone="danger">Expirado</Badge>;
}
