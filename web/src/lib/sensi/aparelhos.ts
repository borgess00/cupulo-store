// ─────────────────────────────────────────────────────────────
// TABELA DE APARELHOS do Gerador de Sensi iOS.
// Para adicionar um iPhone: copie uma linha e ajuste os valores.
//   tela: tamanho da tela em polegadas
//   ppi:  densidade da tela (pixels por polegada)
//   hz:   taxa de atualização (60 ou 120 — ProMotion)
// ─────────────────────────────────────────────────────────────

export type Aparelho = { id: string; nome: string; tela: number; ppi: number; hz: 60 | 120 };

export const APARELHOS: Aparelho[] = [
  { id: "iphone-se", nome: "iPhone SE (2ª/3ª geração)", tela: 4.7, ppi: 326, hz: 60 },
  { id: "iphone-8", nome: "iPhone 8", tela: 4.7, ppi: 326, hz: 60 },
  { id: "iphone-8-plus", nome: "iPhone 8 Plus", tela: 5.5, ppi: 401, hz: 60 },
  { id: "iphone-x", nome: "iPhone X / XS", tela: 5.8, ppi: 458, hz: 60 },
  { id: "iphone-xr", nome: "iPhone XR", tela: 6.1, ppi: 326, hz: 60 },
  { id: "iphone-xs-max", nome: "iPhone XS Max", tela: 6.5, ppi: 458, hz: 60 },
  { id: "iphone-11", nome: "iPhone 11", tela: 6.1, ppi: 326, hz: 60 },
  { id: "iphone-11-pro", nome: "iPhone 11 Pro", tela: 5.8, ppi: 458, hz: 60 },
  { id: "iphone-11-pro-max", nome: "iPhone 11 Pro Max", tela: 6.5, ppi: 458, hz: 60 },
  { id: "iphone-12-mini", nome: "iPhone 12 mini / 13 mini", tela: 5.4, ppi: 476, hz: 60 },
  { id: "iphone-12", nome: "iPhone 12 / 12 Pro", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-12-pro-max", nome: "iPhone 12 Pro Max", tela: 6.7, ppi: 458, hz: 60 },
  { id: "iphone-13", nome: "iPhone 13", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-13-pro", nome: "iPhone 13 Pro", tela: 6.1, ppi: 460, hz: 120 },
  { id: "iphone-13-pro-max", nome: "iPhone 13 Pro Max", tela: 6.7, ppi: 458, hz: 120 },
  { id: "iphone-14", nome: "iPhone 14", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-14-plus", nome: "iPhone 14 Plus", tela: 6.7, ppi: 458, hz: 60 },
  { id: "iphone-14-pro", nome: "iPhone 14 Pro", tela: 6.1, ppi: 460, hz: 120 },
  { id: "iphone-14-pro-max", nome: "iPhone 14 Pro Max", tela: 6.7, ppi: 460, hz: 120 },
  { id: "iphone-15", nome: "iPhone 15", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-15-plus", nome: "iPhone 15 Plus", tela: 6.7, ppi: 460, hz: 60 },
  { id: "iphone-15-pro", nome: "iPhone 15 Pro", tela: 6.1, ppi: 460, hz: 120 },
  { id: "iphone-15-pro-max", nome: "iPhone 15 Pro Max", tela: 6.7, ppi: 460, hz: 120 },
  { id: "iphone-16e", nome: "iPhone 16e", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-16", nome: "iPhone 16", tela: 6.1, ppi: 460, hz: 60 },
  { id: "iphone-16-plus", nome: "iPhone 16 Plus", tela: 6.7, ppi: 460, hz: 60 },
  { id: "iphone-16-pro", nome: "iPhone 16 Pro", tela: 6.3, ppi: 460, hz: 120 },
  { id: "iphone-16-pro-max", nome: "iPhone 16 Pro Max", tela: 6.9, ppi: 460, hz: 120 },
  { id: "iphone-17", nome: "iPhone 17", tela: 6.3, ppi: 460, hz: 120 },
  { id: "iphone-air", nome: "iPhone Air", tela: 6.5, ppi: 460, hz: 120 },
  { id: "iphone-17-pro", nome: "iPhone 17 Pro", tela: 6.3, ppi: 460, hz: 120 },
  { id: "iphone-17-pro-max", nome: "iPhone 17 Pro Max", tela: 6.9, ppi: 460, hz: 120 },
];
