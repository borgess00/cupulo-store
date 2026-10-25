"use client";

import { useActionState, useState } from "react";
import { Check, Copy, FileDown, KeyRound, Loader2 } from "lucide-react";
import { generateKeysAction, type GenerateState } from "@/app/admin/actions/keys";
import { fieldCls, labelCls } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { submitWithoutReset } from "@/lib/form";
import { toCsv } from "@/lib/csv";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function KeyGenerator({ products }: { products: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(generateKeysAction, null);
  const [copied, setCopied] = useState(false);

  const result = state?.ok ? state : null;
  const fileBase = result ? `keys-${result.product.toLowerCase().replace(/\W+/g, "-")}-${result.createdAt.slice(0, 10)}` : "";

  return (
    <div className="space-y-5">
      <form onSubmit={submitWithoutReset(action)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_6rem_1.4fr_auto] lg:items-end">
        <div>
          <label htmlFor="gk-product" className={labelCls}>Produto</label>
          <select id="gk-product" name="productId" required className={fieldCls} defaultValue="">
            <option value="" disabled>Escolha…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gk-duration" className={labelCls}>Duração</label>
          <select id="gk-duration" name="duration" className={fieldCls} defaultValue="DAYS_30">
            <option value="DAYS_7">7 dias</option>
            <option value="DAYS_30">30 dias</option>
            <option value="LIFETIME">Vitalícia</option>
          </select>
        </div>
        <div>
          <label htmlFor="gk-qty" className={labelCls}>Qtd.</label>
          <input id="gk-qty" name="quantity" type="number" min={1} max={500} defaultValue={1} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="gk-note" className={labelCls}>Observação (opcional)</label>
          <input id="gk-note" name="note" maxLength={200} placeholder="ex.: sorteio de sábado" className={fieldCls} />
        </div>
        <button type="submit" disabled={pending} className={buttonClasses("primary", "md", "sm:col-span-2 lg:col-span-1")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Gerar
        </button>
      </form>
      {state && !state.ok && <p role="alert" className="text-sm text-danger">{state.error}</p>}

      {result && (
        <div className="rounded-md border border-paper/60 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl">{result.keys.length} key(s) geradas</p>
              <p className="text-sm text-ash">{result.product} · {result.duration}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClasses("outline", "sm")}
                onClick={async () => {
                  await navigator.clipboard.writeText(result.keys.join("\n"));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
              </button>
              <button type="button" className={buttonClasses("outline", "sm")} onClick={() => download(`${fileBase}.txt`, result.keys.join("\r\n") + "\r\n", "text/plain;charset=utf-8")}>
                <FileDown className="h-4 w-4" /> .txt
              </button>
              <button
                type="button"
                className={buttonClasses("outline", "sm")}
                onClick={() =>
                  download(
                    `${fileBase}.csv`,
                    toCsv([["key", "produto", "duracao", "lote", "gerada_em"], ...result.keys.map((k) => [k, result.product, result.duration, result.batchId, result.createdAt])]),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <FileDown className="h-4 w-4" /> .csv
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-danger">
            Guarde agora: por segurança, as keys ficam salvas só como hash e não poderão ser vistas de novo.
          </p>
          <pre className="mt-3 max-h-72 overflow-auto rounded border border-line bg-ink p-3 font-mono text-sm leading-7">{result.keys.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}
