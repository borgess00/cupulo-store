"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/actions/products";
import { buttonClasses } from "@/components/ui/button";

export function DeleteProduct({ productId, name }: { productId: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={buttonClasses("danger", "sm")}
        onClick={() => {
          if (!confirm(`Excluir "${name}" definitivamente?`)) return;
          start(async () => {
            const r = await deleteProduct(productId);
            if (r && !r.ok) setError(r.error ?? "Não foi possível excluir.");
          });
        }}
      >
        <Trash2 className="h-4 w-4" /> Excluir produto
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
