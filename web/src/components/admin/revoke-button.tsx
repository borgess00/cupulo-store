"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Ban } from "lucide-react";
import { revokeKeyAction } from "@/app/admin/actions/keys";
import { buttonClasses } from "@/components/ui/button";

export function RevokeButton({ keyId, redeemed }: { keyId: string; redeemed: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClasses("danger", "sm")}
      onClick={() => {
        const reason = prompt(
          redeemed
            ? "Revogar esta key? O tempo que ela deu ao cliente será removido.\n\nMotivo (opcional):"
            : "Revogar esta key? Ela não poderá mais ser resgatada.\n\nMotivo (opcional):",
        );
        if (reason === null) return;
        start(async () => {
          const r = await revokeKeyAction(keyId, reason);
          if (!r.ok) alert(r.error);
          router.refresh();
        });
      }}
    >
      <Ban className="h-4 w-4" /> Revogar
    </button>
  );
}
