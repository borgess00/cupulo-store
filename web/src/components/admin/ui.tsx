import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card-grunge p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-smoke">{label}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{value}</p>
      {hint && <p className="text-xs text-ash">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card-grunge p-4 sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-2xl">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Table({ children, minWidth = "40rem" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("bg-white/[0.03] px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-smoke", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-t border-line px-3 py-2.5 align-middle", className)}>{children}</td>;
}

/** Paginação via query string (?page=). */
export function Pagination({ page, totalPages, params }: { page: number; totalPages: number; params: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    q.set("page", String(p));
    return `?${q.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ash">
      <span>
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 hover:border-line-strong">
            Próxima <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export const fieldCls =
  "h-10 w-full rounded-md border border-line-strong bg-ink px-3 text-sm text-paper outline-none transition focus:border-paper";
export const labelCls = "mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ash";

/** Lê um parâmetro de busca como string simples. */
export function sp(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function pageNumber(v: string | string[] | undefined): number {
  const n = Number(sp(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
}
