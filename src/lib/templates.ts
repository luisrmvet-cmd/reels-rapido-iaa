import type { IdTemplate } from "@/types/video";

/**
 * Cada template define a "personalidade visual" do vídeo:
 *  - paleta (gradiente do CTA, glow, fundo)
 *  - tipografia (tamanho, peso, transform)
 *  - intensidade dos efeitos (blur, vinheta, pulso)
 *  - estilo da capa
 *
 * Trocar o template não altera nada do pipeline, só o look.
 */
export interface Template {
  id: IdTemplate;
  nome: string;
  emoji: string;
  descricao: string;

  // Cores
  fundoCor: string;
  gradienteCta: string; // CSS linear-gradient
  glowCorRgb: [number, number, number]; // pra usar em rgba(r,g,b,a)
  glowCor2Rgb: [number, number, number];

  // Tipografia
  tamanhoTexto: number;
  pesoTexto: 800 | 900;
  transformTexto: "none" | "uppercase";
  fontFamily: string;

  // Efeitos
  intensidadeBlurFundo: number; // px do blur do fundo
  saturacaoFundo: number; // saturate()
  brilhoFundo: number; // brightness()
  vinhetaIntensidade: number; // 0..1

  // Capa
  capaFundo: string; // cor de fundo da pílula da capa
  capaCor: string;
  capaTamanho: number;
  capaCorBlur: boolean; // se true, usa blur translúcido (TikTok); se false, sólido

  // Glow do texto
  textoGlow: boolean;
  textoGlowAmplitude: number; // 0..1
}

export const TEMPLATES: Record<IdTemplate, Template> = {
  tiktok_viral: {
    id: "tiktok_viral",
    nome: "TikTok Viral",
    emoji: "🔥",
    descricao: "Cores fortes, glow rosa/roxo, energia alta",
    fundoCor: "#0a0a0a",
    gradienteCta: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)",
    glowCorRgb: [236, 72, 153],
    glowCor2Rgb: [139, 92, 246],
    tamanhoTexto: 88,
    pesoTexto: 900,
    transformTexto: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    intensidadeBlurFundo: 55,
    saturacaoFundo: 1.4,
    brilhoFundo: 0.5,
    vinhetaIntensidade: 0.5,
    capaFundo: "rgba(0,0,0,0.7)",
    capaCor: "#ffffff",
    capaTamanho: 62,
    capaCorBlur: true,
    textoGlow: true,
    textoGlowAmplitude: 1.0,
  },

  reels_clean: {
    id: "reels_clean",
    nome: "Reels Clean",
    emoji: "✨",
    descricao: "Limpo, branco/cinza, sem ruído visual",
    fundoCor: "#0a0a0a",
    gradienteCta: "linear-gradient(90deg, #f5f5f5 0%, #d4d4d8 100%)",
    glowCorRgb: [255, 255, 255],
    glowCor2Rgb: [212, 212, 216],
    tamanhoTexto: 84,
    pesoTexto: 800,
    transformTexto: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    intensidadeBlurFundo: 70,
    saturacaoFundo: 0.85,
    brilhoFundo: 0.55,
    vinhetaIntensidade: 0.35,
    capaFundo: "rgba(255,255,255,0.95)",
    capaCor: "#0a0a0a",
    capaTamanho: 56,
    capaCorBlur: false,
    textoGlow: false,
    textoGlowAmplitude: 0,
  },

  dark_premium: {
    id: "dark_premium",
    nome: "Dark Premium",
    emoji: "🖤",
    descricao: "Tons escuros, glow dourado sutil",
    fundoCor: "#000000",
    gradienteCta: "linear-gradient(90deg, #eab308 0%, #f59e0b 100%)",
    glowCorRgb: [234, 179, 8],
    glowCor2Rgb: [245, 158, 11],
    tamanhoTexto: 86,
    pesoTexto: 900,
    transformTexto: "uppercase",
    fontFamily: "system-ui, -apple-system, sans-serif",
    intensidadeBlurFundo: 70,
    saturacaoFundo: 0.7,
    brilhoFundo: 0.35,
    vinhetaIntensidade: 0.7,
    capaFundo: "rgba(0,0,0,0.85)",
    capaCor: "#eab308",
    capaTamanho: 58,
    capaCorBlur: true,
    textoGlow: true,
    textoGlowAmplitude: 0.6,
  },

  saas_moderno: {
    id: "saas_moderno",
    nome: "SaaS Moderno",
    emoji: "💎",
    descricao: "Azul/ciano, profissional e tech",
    fundoCor: "#020617",
    gradienteCta: "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)",
    glowCorRgb: [6, 182, 212],
    glowCor2Rgb: [59, 130, 246],
    tamanhoTexto: 84,
    pesoTexto: 800,
    transformTexto: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    intensidadeBlurFundo: 60,
    saturacaoFundo: 1.1,
    brilhoFundo: 0.5,
    vinhetaIntensidade: 0.55,
    capaFundo: "rgba(2,6,23,0.85)",
    capaCor: "#06b6d4",
    capaTamanho: 56,
    capaCorBlur: true,
    textoGlow: true,
    textoGlowAmplitude: 0.7,
  },

  capcut_style: {
    id: "capcut_style",
    nome: "CapCut Style",
    emoji: "🎬",
    descricao: "Verde neon + amarelo, energia jovem",
    fundoCor: "#0a0a0a",
    gradienteCta: "linear-gradient(90deg, #22c55e 0%, #facc15 100%)",
    glowCorRgb: [34, 197, 94],
    glowCor2Rgb: [250, 204, 21],
    tamanhoTexto: 90,
    pesoTexto: 900,
    transformTexto: "uppercase",
    fontFamily: "system-ui, -apple-system, sans-serif",
    intensidadeBlurFundo: 50,
    saturacaoFundo: 1.5,
    brilhoFundo: 0.55,
    vinhetaIntensidade: 0.45,
    capaFundo: "rgba(0,0,0,0.7)",
    capaCor: "#facc15",
    capaTamanho: 64,
    capaCorBlur: true,
    textoGlow: true,
    textoGlowAmplitude: 1.0,
  },
};

export const TEMPLATE_DEFAULT: IdTemplate = "tiktok_viral";
