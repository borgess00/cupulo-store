import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { ChangelogManager } from "@/components/admin/changelog-manager";
import { DeleteProduct } from "@/components/admin/delete-product";
import { FileManager } from "@/components/admin/file-manager";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductForm } from "@/components/admin/product-form";
import { AdminTitle, Panel } from "@/components/admin/ui";
import { ProductCover } from "@/components/brand/product-cover";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Editar produto" };

async function Editor({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      files: { orderBy: { createdAt: "desc" }, include: { _count: { select: { downloads: true } } } },
      changelog: { orderBy: { publishedAt: "desc" } },
    },
  });
  if (!product) notFound();

  return (
    <>
      <AdminTitle title={product.name}>
        <ButtonLink href={`/produto/${product.slug}`} variant="outline" size="sm" target="_blank">
          Ver no site <ExternalLink className="h-4 w-4" />
        </ButtonLink>
      </AdminTitle>
      {sp.criado && <p className="mb-4 rounded-md border border-line-strong px-4 py-2 text-sm">Produto criado. Agora envie a imagem e os arquivos.</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel title="Informações">
          <ProductForm
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              shortDesc: product.shortDesc,
              description: product.description,
              category: product.category,
              platform: product.platform,
              type: product.type,
              youtubeUrl: product.youtubeUrl,
              tutorialMd: product.tutorialMd,
              sortOrder: product.sortOrder,
              active: product.active,
            }}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="Imagem">
            <ProductCover product={product} className="mb-3 rounded-md border border-line" />
            <ImageUploader productId={product.id} hasImage={!!product.imageUrl} />
          </Panel>
          <Panel title="Arquivos">
            <FileManager
              productId={product.id}
              files={product.files.map((f) => ({
                id: f.id,
                name: f.name,
                sizeBytes: f.sizeBytes.toString(),
                version: f.version,
                createdAt: f.createdAt.toISOString(),
                downloads: f._count.downloads,
              }))}
            />
          </Panel>
          <Panel title="Changelog">
            <ChangelogManager
              productId={product.id}
              entries={product.changelog.map((c) => ({ ...c, publishedAt: c.publishedAt.toISOString() }))}
            />
          </Panel>
          <Panel title="Zona de perigo">
            <p className="mb-3 text-sm text-ash">Só é possível excluir produtos sem keys nem clientes. Caso contrário, desmarque “Ativo”.</p>
            <DeleteProduct productId={product.id} name={product.name} />
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function EditarProduto(props: PageProps<"/admin/produtos/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem]" />}>
      <Editor {...props} />
    </Suspense>
  );
}
