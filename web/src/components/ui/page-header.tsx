import type { ReactNode } from "react";
import { Splatter } from "@/components/brand/splatter";

export function PageHeader({ kicker, title, brush, children }: { kicker?: string; title: string; brush?: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <Splatter seed={title} className="absolute -right-10 -top-16 h-64 w-64 text-white/[0.05]" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-48 halftone-fade opacity-10" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {kicker && <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ash">{kicker}</p>}
        <h1 className="font-display text-5xl text-worn sm:text-6xl">{title}</h1>
        {brush && <p className="mt-1 -rotate-1 font-brush text-xl text-ash">{brush}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}
