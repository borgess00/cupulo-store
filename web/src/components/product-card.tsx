import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCover } from "@/components/brand/product-cover";
import { Badge } from "@/components/ui/badge";
import type { StoreProduct } from "@/lib/products";

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="card-grunge glitch-hover group flex flex-col overflow-hidden"
    >
      <ProductCover product={product} className="border-b border-line" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl">{product.name}</h3>
          {product.type === "TOOL" && <Badge tone="solid">Ferramenta</Badge>}
        </div>
        <p className="flex-1 text-sm text-ash">{product.shortDesc}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-paper">
          Ver produto <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
