import Image from "next/image";
import { Barcode } from "@/components/brand/barcode";
import { Splatter } from "@/components/brand/splatter";
import { cn } from "@/lib/cn";
import { PLATFORM_LABEL } from "@/lib/format";

/** Capa do produto: a imagem enviada ou uma arte gerada no estilo da marca. */
export function ProductCover({
  product,
  className,
  priority,
}: {
  product: { slug: string; name: string; imageUrl: string | null; platform: string; category: string };
  className?: string;
  priority?: boolean;
}) {
  if (product.imageUrl) {
    return (
      <div className={cn("relative aspect-[16/10] overflow-hidden bg-ink-3", className)}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover grayscale-[35%] transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
        />
      </div>
    );
  }
  const words = product.name.split(" ");
  const last = words.pop();
  return (
    <div
      aria-hidden="true"
      className={cn("relative aspect-[16/10] overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#262626,#0d0d0d_70%)]", className)}
    >
      <div className="absolute -right-6 -top-6 h-36 w-36 halftone-fade opacity-40" />
      <Splatter seed={product.slug} className="absolute -bottom-10 -left-8 h-44 w-44 text-white/[0.09]" />
      <div className="absolute inset-0 scanlines" />
      <span className="tape absolute left-4 top-4 -rotate-3 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
        {PLATFORM_LABEL[product.platform] ?? product.platform}
      </span>
      <div className="absolute inset-x-4 bottom-4">
        <p className="glitch-shift font-display text-[2.1rem] leading-[0.9] text-paper text-worn sm:text-4xl">
          {words.join(" ")}
          {words.length > 0 && <br />}
          <span className="text-[1.25em]">{last}</span>
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="-rotate-3 font-brush text-sm text-ash">{product.category.toLowerCase()}</span>
          <Barcode value={product.slug.toUpperCase().slice(0, 14)} showText={false} className="w-24 text-paper/60" />
        </div>
      </div>
    </div>
  );
}
