"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, KeyRound, LogOut, Menu, Shield, User, X } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { DiscordIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";

type HeaderUser = { name: string; image: string | null; isAdmin: boolean } | null;

const MEMBER_LINKS = [
  { href: "/biblioteca", label: "Minha biblioteca", icon: BookOpen },
  { href: "/resgatar", label: "Resgatar key", icon: KeyRound },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function HeaderActions({ user, links }: { user: HeaderUser; links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // O menu guarda em qual página foi aberto: ao navegar, fecha sozinho.
  const [state, setState] = useState<{ kind: "menu" | "user"; path: string } | null>(null);
  const open = state?.path === pathname ? state.kind : null;
  const setOpen = (kind: "menu" | "user" | null) => setState(kind ? { kind, path: pathname } : null);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora e com Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setState(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const memberLinks = user?.isAdmin ? [...MEMBER_LINKS, { href: "/admin", label: "Painel admin", icon: Shield }] : MEMBER_LINKS;

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {user ? (
        <button
          type="button"
          onClick={() => setOpen(open === "user" ? null : "user")}
          aria-expanded={open === "user"}
          aria-haspopup="menu"
          className="hidden items-center gap-2 rounded-md border border-line px-2 py-1.5 transition hover:border-line-strong md:inline-flex"
        >
          <Avatar src={user.image} />
          <span className="max-w-32 truncate text-sm font-semibold">{user.name}</span>
        </button>
      ) : (
        <Link href="/login" className={buttonClasses("primary", "sm", "hidden md:inline-flex")}>
          <DiscordIcon className="h-4 w-4" /> Entrar
        </Link>
      )}

      <button
        type="button"
        onClick={() => setOpen(open === "menu" ? null : "menu")}
        aria-label={open === "menu" ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open === "menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line md:hidden"
      >
        {open === "menu" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open === "user" && user && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-60 overflow-hidden rounded-md border border-line-strong bg-ink-2 shadow-2xl"
          >
            <MemberMenu links={memberLinks} />
          </motion.div>
        )}
        {open === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 z-50 border-b border-line-strong bg-ink px-4 pb-6 pt-2 shadow-2xl md:hidden"
          >
            {user && (
              <div className="flex items-center gap-3 border-b border-line py-4">
                <Avatar src={user.image} size={40} />
                <span className="truncate font-display text-xl">{user.name}</span>
              </div>
            )}
            <nav aria-label="Menu" className="flex flex-col py-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(null)}
                  className="py-3 font-display text-2xl text-ash transition hover:text-paper"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            {user ? (
              <div className="overflow-hidden rounded-md border border-line">
                <MemberMenu links={memberLinks} />
              </div>
            ) : (
              <div className="grid gap-3">
                <Link href="/login" className={buttonClasses("primary", "lg", "w-full")}>
                  <DiscordIcon className="h-5 w-5" /> Entrar com Discord
                </Link>
                <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md", "w-full")}>
                  Comprar no Discord
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberMenu({ links }: { links: { href: string; label: string; icon: typeof User }[] }) {
  return (
    <div className="flex flex-col">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          role="menuitem"
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
        >
          <Icon className="h-4 w-4 text-ash" /> {label}
        </Link>
      ))}
      <form action={signOutAction} className="border-t border-line">
        <button
          type="submit"
          role="menuitem"
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-ash transition hover:bg-white/5 hover:text-paper"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </form>
    </div>
  );
}

function Avatar({ src, size = 28 }: { src: string | null; size?: number }) {
  if (!src) return <span style={{ width: size, height: size }} className="inline-block rounded-full bg-white/10" />;
  return <Image src={src} alt="" width={size} height={size} className="rounded-full ring-1 ring-white/20" />;
}
