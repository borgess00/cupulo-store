import { seededRandom } from "@/lib/seeded";
import { cn } from "@/lib/cn";

/** Mancha de tinta decorativa (gota central + respingos). */
export function Splatter({ seed = "cupulo", className }: { seed?: string; className?: string }) {
  const rand = seededRandom(seed);
  const blob: string[] = [];
  const points = 14;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 26 + rand() * 18;
    blob.push(`${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`);
  }
  const drops = Array.from({ length: 22 }, () => {
    const a = rand() * Math.PI * 2;
    const d = 45 + rand() * 50;
    return {
      cx: 100 + Math.cos(a) * d,
      cy: 100 + Math.sin(a) * d,
      r: 1 + rand() * (d < 70 ? 6 : 3),
    };
  });
  const streaks = Array.from({ length: 5 }, () => {
    const a = rand() * Math.PI * 2;
    const len = 30 + rand() * 45;
    return {
      x1: 100 + Math.cos(a) * 30,
      y1: 100 + Math.sin(a) * 30,
      x2: 100 + Math.cos(a) * (30 + len),
      y2: 100 + Math.sin(a) * (30 + len),
      w: 1.5 + rand() * 3,
    };
  });
  return (
    <svg viewBox="0 0 200 200" className={cn("pointer-events-none", className)} aria-hidden="true">
      <polygon points={blob.join(" ")} fill="currentColor" />
      {streaks.map((s, i) => (
        <line key={i} {...s} stroke="currentColor" strokeWidth={s.w} strokeLinecap="round" />
      ))}
      {drops.map((d, i) => (
        <circle key={i} cx={d.cx.toFixed(1)} cy={d.cy.toFixed(1)} r={d.r.toFixed(1)} fill="currentColor" />
      ))}
    </svg>
  );
}
