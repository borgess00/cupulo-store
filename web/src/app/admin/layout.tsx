import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

// Cada página do admin confere requireAdmin() no servidor (o proxy é só a primeira barreira).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-10">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
        <p className="mb-3 flex items-center gap-2 font-display text-2xl">
          <Shield className="h-5 w-5" /> Painel
        </p>
        <Suspense fallback={<AdminNavLinks />}>
          <AdminNav />
        </Suspense>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
