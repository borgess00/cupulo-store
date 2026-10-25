"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crosshair, RotateCcw } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { APARELHOS } from "@/lib/sensi/aparelhos";
import {
  CONFIG,
  ESTILOS,
  type Estilo,
  gerarSensi,
  MIRAS,
  NOMES_MIRA,
  type ResultadoSensi,
  validarEntrada,
} from "@/lib/sensi/calculo";

const inputCls =
  "h-12 w-full rounded-md border border-line-strong bg-ink px-3 text-paper outline-none transition focus:border-paper";

export function SensiForm() {
  const [aparelhoId, setAparelhoId] = useState("iphone-13");
  const [tela, setTela] = useState("6.1");
  const [ppi, setPpi] = useState("460");
  const [hz, setHz] = useState<60 | 120>(60);
  const [estilo, setEstilo] = useState<Estilo>("equilibrado");
  const [dedos, setDedos] = useState<2 | 3 | 4>(3);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoSensi | null>(null);
  const [copiado, setCopiado] = useState(false);
  const resultadoRef = useRef<HTMLDivElement>(null);

  function escolherAparelho(id: string) {
    setAparelhoId(id);
    const a = APARELHOS.find((x) => x.id === id);
    if (a) {
      setTela(String(a.tela));
      setPpi(String(a.ppi));
      setHz(a.hz);
    }
  }

  function gerar(e: React.FormEvent) {
    e.preventDefault();
    const entrada = { tela: Number(tela.replace(",", ".")), ppi: Number(ppi), hz, estilo, dedos };
    const problema = validarEntrada(entrada);
    setErro(problema);
    if (!problema) {
      setResultado(gerarSensi(entrada));
      setCopiado(false);
      // No celular o resultado fica abaixo do formulário: rola até ele.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
  }

  async function copiar() {
    if (!resultado) return;
    const nome = APARELHOS.find((a) => a.id === aparelhoId)?.nome ?? `Tela ${tela}"`;
    const texto = [
      `SENSI CUPULO STORE — ${nome} (${ESTILOS[estilo].nome})`,
      ...MIRAS.map((m) => `${NOMES_MIRA[m]}: ${resultado[m]}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={gerar} className="card-grunge space-y-6 p-5 sm:p-7">
        <div>
          <label htmlFor="aparelho" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-ash">
            Modelo do iPhone
          </label>
          <select id="aparelho" value={aparelhoId} onChange={(e) => escolherAparelho(e.target.value)} className={inputCls}>
            {APARELHOS.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
            <option value="outro">Outro (preencher manualmente)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tela" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-ash">
              Tela (pol.)
            </label>
            <input id="tela" inputMode="decimal" value={tela} onChange={(e) => { setTela(e.target.value); setAparelhoId("outro"); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ppi" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-ash">
              DPI (densidade)
            </label>
            <input id="ppi" inputMode="numeric" value={ppi} onChange={(e) => { setPpi(e.target.value); setAparelhoId("outro"); }} className={inputCls} />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ash">Taxa de atualização</legend>
          <div className="grid grid-cols-2 gap-2">
            {([60, 120] as const).map((v) => (
              <Choice key={v} name="hz" checked={hz === v} onChange={() => setHz(v)} label={`${v} Hz`} sub={v === 120 ? "ProMotion" : "Padrão"} />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ash">Estilo de jogo</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(ESTILOS) as Estilo[]).map((k) => (
              <Choice key={k} name="estilo" checked={estilo === k} onChange={() => setEstilo(k)} label={ESTILOS[k].nome} sub={ESTILOS[k].descricao} />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ash">Quantos dedos você usa?</legend>
          <div className="grid grid-cols-3 gap-2">
            {([2, 3, 4] as const).map((d) => (
              <Choice key={d} name="dedos" checked={dedos === d} onChange={() => setDedos(d)} label={`${d} dedos`} />
            ))}
          </div>
        </fieldset>

        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}

        <button type="submit" className={buttonClasses("primary", "lg", "w-full")}>
          <Crosshair className="h-5 w-5" /> Gerar minha sensi
        </button>
        <p className="text-xs text-smoke">
          Escala do Free Fire: {CONFIG.MIN} a {CONFIG.MAX}. Teste no modo treino e ajuste fino de 5 em 5.
        </p>
      </form>

      <div ref={resultadoRef} aria-live="polite" className="scroll-mt-20">
        <AnimatePresence mode="wait">
          {resultado ? (
            <motion.div
              key={JSON.stringify(resultado)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card-grunge p-5 sm:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-3xl">Sua sensi</p>
                <span className="-rotate-3 font-brush text-ash">{ESTILOS[estilo].nome.toLowerCase()}</span>
              </div>
              <ul className="mt-5 space-y-4">
                {MIRAS.map((m, i) => (
                  <motion.li
                    key={m}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold uppercase tracking-[0.15em] text-ash">{NOMES_MIRA[m]}</span>
                      <span className="font-display text-4xl tabular-nums">{resultado[m]}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-paper"
                        initial={{ width: 0 }}
                        animate={{ width: `${(resultado[m] / CONFIG.MAX) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 }}
                      />
                    </div>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={copiar} className={buttonClasses("primary", "md")}>
                  {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiado ? "Copiado!" : "Copiar valores"}
                </button>
                <button type="button" onClick={() => setResultado(null)} className={buttonClasses("outline", "md")}>
                  <RotateCcw className="h-4 w-4" /> Gerar de novo
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vazio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-72 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong p-8 text-center"
            >
              <Crosshair className="h-10 w-10 text-ash" />
              <p className="mt-3 font-display text-2xl">Preencha e gere</p>
              <p className="mt-1 max-w-xs text-sm text-ash">
                Você recebe a sensi de Geral, Ponto Vermelho, 2x, 4x, AWM e Olhadinha.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Choice({ name, checked, onChange, label, sub }: { name: string; checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-md border p-3 transition ${
        checked ? "border-paper bg-white/[0.06]" : "border-line hover:border-line-strong"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="font-display text-lg">{label}</span>
      {sub && <span className="text-xs text-ash">{sub}</span>}
    </label>
  );
}
