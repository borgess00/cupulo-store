"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Download, KeyRound, Package, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/keys", label: "Keys", icon: KeyRound },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/downloads", label: "Downloads", icon: Download },
];

/** Versão que lê a URL (marca o item ativo). Fica dentro de <Suspense>. */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/** Links do menu; sem `pathname` (no fallback estático) nenhum item fica marcado. */
export function AdminNavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Admin" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = !!pathname && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
              active ? "bg-paper text-ink" : "text-ash hover:bg-white/5 hover:text-paper",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
