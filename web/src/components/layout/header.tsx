import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { Logo } from "@/components/brand/logo";
import { HeaderActions } from "@/components/layout/header-actions";

export const NAV_LINKS = [
  { href: "/#produtos", label: "Produtos" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#faq", label: "FAQ" },
];

async function HeaderUser() {
  const session = await getSession();
  const u = session?.user;
  return (
    <HeaderActions
      user={u?.id ? { name: u.name ?? "Jogador", image: u.image ?? null, isAdmin: u.isAdmin } : null}
      links={NAV_LINKS}
    />
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo size="sm" />
        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold uppercase tracking-[0.18em] text-ash transition hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Suspense fallback={<div className="h-10 w-28 animate-pulse rounded-md bg-white/5" />}>
          <HeaderUser />
        </Suspense>
      </div>
    </header>
  );
}
