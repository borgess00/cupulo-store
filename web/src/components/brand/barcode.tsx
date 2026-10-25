import { seededRandom } from "@/lib/seeded";
import { cn } from "@/lib/cn";

/** Código de barras decorativo gerado a partir de um texto. */
export function Barcode({ value, className, showText = true }: { value: string; className?: string; showText?: boolean }) {
  const rand = seededRandom(value);
  // Todas as barras num único <path> (HTML bem menor que centenas de <rect>).
  let d = "";
  let x = 0;
  while (x < 200) {
    const w = 1 + Math.floor(rand() * 4);
    if (rand() > 0.35) d += `M${x} 0h${w}v40h-${w}z`;
    x += w + 1 + Math.floor(rand() * 2);
  }
  return (
    <div className={cn("inline-flex flex-col items-stretch", className)} aria-hidden="true">
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-8 w-full">
        <path d={d} fill="currentColor" />
      </svg>
      {showText && (
        <span className="mt-1 text-center font-mono text-[0.6rem] tracking-[0.35em] opacity-80">{value}</span>
      )}
    </div>
  );
}
