import { Splatter } from "@/components/brand/splatter";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden px-4 py-24 text-center">
      <Splatter seed="404" className="absolute top-6 h-80 w-80 text-white/[0.06]" />
      <p className="relative font-display text-[9rem] leading-none text-worn">404</p>
      <p className="relative -mt-2 -rotate-2 font-brush text-2xl text-ash">errou o capa</p>
      <p className="relative mt-6 text-ash">Esta página não existe ou não está disponível para você.</p>
      <div className="relative mt-8 flex gap-3">
        <ButtonLink href="/">Início</ButtonLink>
        <ButtonLink href="/biblioteca" variant="outline">Minha biblioteca</ButtonLink>
      </div>
    </div>
  );
}
