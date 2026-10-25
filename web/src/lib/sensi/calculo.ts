// ─────────────────────────────────────────────────────────────
// LÓGICA DO GERADOR DE SENSI — edite os números em CONFIG.
//
// Como funciona:
//   sensi = base da mira × fator de tela × fator de densidade
//           × bônus de 120 Hz × multiplicador do estilo × ajuste de dedos
// e o resultado é limitado entre MIN e MAX (escala do Free Fire: 0 a 200).
//
// Telas menores e de menor densidade pedem sensi MAIS ALTA (o dedo
// percorre menos distância), telas maiores pedem sensi um pouco mais baixa.
// Os valores abaixo são um PONTO DE PARTIDA: calibre com seus testes.
// ─────────────────────────────────────────────────────────────

export const MIRAS = ["geral", "pontoVermelho", "mira2x", "mira4x", "awm", "olhadinha"] as const;
export type Mira = (typeof MIRAS)[number];

export const NOMES_MIRA: Record<Mira, string> = {
  geral: "Geral",
  pontoVermelho: "Ponto Vermelho",
  mira2x: "Mira 2x",
  mira4x: "Mira 4x",
  awm: "Mira AWM",
  olhadinha: "Olhadinha",
};

export const ESTILOS = {
  agressivo: { nome: "Agressivo", descricao: "Capa rápida e rush. Mais velocidade para puxar." },
  equilibrado: { nome: "Equilibrado", descricao: "Bom para tudo: rush e troca de tiro à distância." },
  preciso: { nome: "Preciso", descricao: "Mais controle no capa e tiros de longe." },
} as const;
export type Estilo = keyof typeof ESTILOS;

export const CONFIG = {
  MIN: 0,
  MAX: 200,

  /** Sensi base de cada mira para a tela de referência, estilo equilibrado. */
  base: {
    geral: 170,
    pontoVermelho: 155,
    mira2x: 145,
    mira4x: 130,
    awm: 80,
    olhadinha: 165,
  } satisfies Record<Mira, number>,

  /** Aparelho de referência (iPhone 6,1" / 460 ppi). */
  telaReferencia: 6.1,
  ppiReferencia: 460,

  /** Quanto o tamanho da tela e a densidade influenciam (0 = nada, 1 = proporcional). */
  pesoTela: 0.6,
  pesoPpi: 0.15,

  /** Em 120 Hz o movimento fica mais fluido: sensi um pouco maior. */
  bonus120hz: 0.03,

  /** Multiplicador de cada estilo por mira. */
  estilos: {
    agressivo: { geral: 1.08, pontoVermelho: 1.06, mira2x: 1.04, mira4x: 1.0, awm: 0.95, olhadinha: 1.08 },
    equilibrado: { geral: 1, pontoVermelho: 1, mira2x: 1, mira4x: 1, awm: 1, olhadinha: 1 },
    preciso: { geral: 0.93, pontoVermelho: 0.92, mira2x: 0.92, mira4x: 0.9, awm: 1.05, olhadinha: 0.95 },
  } satisfies Record<Estilo, Record<Mira, number>>,

  /** Jogar com mais dedos dá mais controle: sensi um pouco menor. */
  dedos: { 2: 1.04, 3: 1.0, 4: 0.97 } as Record<2 | 3 | 4, number>,

  /** Limites aceitos no formulário. */
  limites: { telaMin: 4, telaMax: 8, ppiMin: 200, ppiMax: 600 },
};

export type EntradaSensi = {
  tela: number; // polegadas
  ppi: number;
  hz: 60 | 120;
  estilo: Estilo;
  dedos: 2 | 3 | 4;
};

export type ResultadoSensi = Record<Mira, number>;

export function validarEntrada(e: EntradaSensi): string | null {
  const { telaMin, telaMax, ppiMin, ppiMax } = CONFIG.limites;
  if (!Number.isFinite(e.tela) || e.tela < telaMin || e.tela > telaMax) return `Tela deve ficar entre ${telaMin}" e ${telaMax}".`;
  if (!Number.isFinite(e.ppi) || e.ppi < ppiMin || e.ppi > ppiMax) return `Densidade (DPI) deve ficar entre ${ppiMin} e ${ppiMax}.`;
  if (!(e.estilo in ESTILOS)) return "Escolha um estilo de jogo.";
  if (![2, 3, 4].includes(e.dedos)) return "Escolha quantos dedos você usa.";
  return null;
}

export function gerarSensi(e: EntradaSensi): ResultadoSensi {
  const fatorTela = Math.pow(CONFIG.telaReferencia / e.tela, CONFIG.pesoTela);
  const fatorPpi = Math.pow(CONFIG.ppiReferencia / e.ppi, CONFIG.pesoPpi);
  const fatorHz = e.hz === 120 ? 1 + CONFIG.bonus120hz : 1;
  const fatorDedos = CONFIG.dedos[e.dedos];

  const resultado = {} as ResultadoSensi;
  for (const mira of MIRAS) {
    const valor = CONFIG.base[mira] * fatorTela * fatorPpi * fatorHz * fatorDedos * CONFIG.estilos[e.estilo][mira];
    resultado[mira] = Math.round(Math.min(CONFIG.MAX, Math.max(CONFIG.MIN, valor)));
  }
  return resultado;
}
