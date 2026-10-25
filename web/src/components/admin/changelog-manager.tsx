"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { type ActionState, addChangelog, deleteChangelog } from "@/app/admin/actions/products";
import { fieldCls, labelCls } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

type Entry = { id: string; version: string; notes: string; publishedAt: string };

export function ChangelogManager({ productId, entries }: { productId: string; entries: Entry[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(addChangelog, null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-display text-lg">v{e.version} <span className="font-sans text-xs text-smoke">{formatDate(e.publishedAt)}</span></p>
                <p className="whitespace-pre-line text-ash">{e.notes}</p>
              </div>
              <button
                type="button"
                aria-label={`Excluir versão ${e.version}`}
                className={buttonClasses("ghost", "sm")}
                onClick={async () => {
                  if (!confirm(`Excluir a versão ${e.version} do changelog?`)) return;
                  await deleteChangelog(e.id);
                  router.refresh();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <input type="hidden" name="productId" value={productId} />
        <div>
          <label htmlFor="cl-version" className={labelCls}>Versão</label>
          <input id="cl-version" name="version" required placeholder="1.1" className={fieldCls} />
        </div>
        <div>
          <label htmlFor="cl-notes" className={labelCls}>O que mudou</label>
          <textarea id="cl-notes" name="notes" required rows={2} className={`${fieldCls} h-auto py-2`} />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className={buttonClasses("outline", "sm")}>
            <Plus className="h-4 w-4" /> Adicionar versão
          </button>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        </div>
      </form>
    </div>
  );
}
