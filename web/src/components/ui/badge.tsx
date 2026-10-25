import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "solid" | "muted" | "danger";

export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em]",
        {
          default: "border border-line-strong text-paper",
          solid: "bg-paper text-ink",
          muted: "border border-line text-smoke",
          danger: "border border-danger/60 text-danger",
        }[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
