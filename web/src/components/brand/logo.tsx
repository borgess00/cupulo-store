import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Marca: ícone + "CUPULO" pesado + "store" em pincel. */
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: 34, md: 42, lg: 64 }[size];
  return (
    <Link href="/" aria-label="CUPULO STORE — início" className={cn("group inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={px}
        height={px}
        priority
        className="rounded-[22%] ring-1 ring-white/15 transition group-hover:ring-white/40"
      />
      <span className="relative leading-none">
        <span className={cn("block font-display text-paper", { sm: "text-xl", md: "text-2xl", lg: "text-4xl" }[size])}>
          CUPULO
        </span>
        <span
          className={cn(
            "absolute -bottom-2 right-[-0.6rem] -rotate-6 font-brush text-ash",
            { sm: "text-xs", md: "text-sm", lg: "text-lg" }[size],
          )}
        >
          store
        </span>
      </span>
    </Link>
  );
}
