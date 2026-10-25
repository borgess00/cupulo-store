import { ButtonLink } from "@/components/ui/button";

// Landing completa na Etapa 3.
export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-6xl text-worn">Cupulo Store</h1>
      <ButtonLink href="/login" className="mt-8">Entrar</ButtonLink>
    </section>
  );
}
