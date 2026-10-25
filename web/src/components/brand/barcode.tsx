import { seededRandom } from "@/lib/seeded";
import { cn } from "@/lib/cn";

/** Código de barras decorativo gerado a partir de um texto. */
export function Barcode({ value, className, showText = true }: { value: string; className?: string; showText?: boolean }) {
  const rand = seededRandom(value);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 200) {
    const w = 1 + Math.floor(rand() * 4);
    if (rand() > 0.35) bars.push({ x, w });
    x += w + 1 + Math.floor(rand() * 2);
  }
  return (
    <div className={cn("inline-flex flex-col items-stretch", className)} aria-hidden="true">
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-8 w-full">
        {bars.map((b) => (
          <rect key={b.x} x={b.x} y={0} width={b.w} height={40} fill="currentColor" />
        ))}
      </svg>
      {showText && (
        <span className="mt-1 text-center font-mono text-[0.6rem] tracking-[0.35em] opacity-80">{value}</span>
      )}
    </div>
  );
}
