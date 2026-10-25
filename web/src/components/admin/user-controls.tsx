"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Ban, Gift, Loader2, Trash2, Undo2 } from "lucide-react";
import { grantAccessAction, removeAccessAction, setBanAction, type UserActionState } from "@/app/admin/actions/users";
import { fieldCls, labelCls } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { submitWithoutReset } from "@/lib/form";

export function GrantAccessForm({ userId, products }: { userId: string; products: { id: string; name: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState("30");
  const [state, action, pending] = useActionState<UserActionState, FormData>(async (prev, fd) => {
    const r = await grantAccessAction(prev, fd);
    if (r?.ok) router.refresh();
    return r;
  }, null);

  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_6rem_auto] sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label htmlFor="ga-product" className={labelCls}>Produto</label>
        <select id="ga-product" name="productId" required defaultValue="" className={fieldCls}>
          <option value="" disabled>Escolha…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="ga-mode" className={labelCls}>Tempo</label>
        <select id="ga-mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={fieldCls}>
          <option value="7">+7 dias</option>
          <option value="30">+30 dias</option>
          <option value="custom">Outro…</option>
          <option value="lifetime">Vitalício</option>
        </select>
      </div>
      <div>
        <label htmlFor="ga-days" className={labelCls}>Dias</label>
        <input id="ga-days" name="days" type="number" min={1} max={3650} disabled={mode !== "custom"} className={fieldCls} />
      </div>
      <button type="submit" disabled={pending} className={buttonClasses("primary", "md")}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Conceder
      </button>
      {state?.error && <p role="alert" className="text-sm text-danger sm:col-span-4">{state.error}</p>}
      {state?.ok && state.message && <p role="status" className="text-sm sm:col-span-4">{state.message}</p>}
    </form>
  );
}

export function RemoveAccessButton({ userId, productId, name }: { userId: string; productId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Remover acesso a ${name}`}
      className={buttonClasses("danger", "sm")}
      onClick={() => {
        if (!confirm(`Remover todo o acesso a "${name}"? (tempo e vitalício)`)) return;
        start(async () => {
          await removeAccessAction(userId, productId);
          router.refresh();
        });
      }}
    >
      <Trash2 className="h-4 w-4" /> Remover
    </button>
  );
}

export function BanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClasses(banned ? "outline" : "danger", "sm")}
      onClick={() => {
        if (!confirm(banned ? "Desbloquear este usuário?" : "Bloquear este usuário? Ele perde o acesso ao site e não consegue resgatar keys.")) return;
        start(async () => {
          const r = await setBanAction(userId, !banned);
          if (r && !r.ok) alert(r.error);
          router.refresh();
        });
      }}
    >
      {banned ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />} {banned ? "Desbloquear" : "Bloquear"}
    </button>
  );
}
