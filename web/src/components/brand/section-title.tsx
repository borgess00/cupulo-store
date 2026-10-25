import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Título de seção: etiqueta pequena + título pesado + rabisco em pincel. */
export function SectionTitle({
  kicker,
  title,
  brush,
  className,
  as: Tag = "h2",
}: {
  kicker?: string;
  title: ReactNode;
  brush?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("relative", className)}>
      {kicker && (
        <p className="mb-3 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ash">
          <span className="h-px w-6 bg-ash" />
          {kicker}
        </p>
      )}
      <Tag className="font-display text-4xl text-paper text-worn sm:text-5xl md:text-6xl">{title}</Tag>
      {brush && <p className="-mt-1 -rotate-2 font-brush text-xl text-ash sm:text-2xl">{brush}</p>}
    </div>
  );
}
