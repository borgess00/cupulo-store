"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl text-worn">Deu ruim</p>
      <p className="mt-1 -rotate-2 font-brush text-xl text-ash">algo travou por aqui</p>
      <p className="mt-6 text-ash">Tente de novo. Se continuar, avise a staff no Discord.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Tentar de novo</Button>
        <ButtonLink href="/" variant="outline">Início</ButtonLink>
      </div>
    </div>
  );
}
