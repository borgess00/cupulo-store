import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminTitle, Panel } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Novo produto" };

async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function NovoProduto() {
  return (
    <>
      <AdminTitle title="Novo produto" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Guard>
          <Panel>
            <ProductForm />
            <p className="mt-4 text-xs text-smoke">Depois de criar, você poderá enviar a imagem, os arquivos e o changelog.</p>
          </Panel>
        </Guard>
      </Suspense>
    </>
  );
}
