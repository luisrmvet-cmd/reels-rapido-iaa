import type { Cena, RoteiroGerado } from "./index";

export interface ImagemSerializada {
  id: string;
  dataUrl: string;
}

export type IdTemplate =
  | "tiktok_viral"
  | "reels_clean"
  | "dark_premium"
  | "saas_moderno"
  | "capcut_style";

/**
 * ID de uma voz no nosso catálogo curado.
 */
export type IdVoz =
  | "matilda_fem"
  | "sarah_fem"
  | "rachel_fem"
  | "adam_masc"
  | "antoni_masc"
  | "josh_masc";

/**
 * Timestamp por palavra (resultado do endpoint /with-timestamps).
 */
export interface PalavraComTempo {
  palavra: string;
  inicioSegundos: number;
  fimSegundos: number;
}

/**
 * Áudio de narração gerado pelo TTS.
 */
export interface AudioNarracao {
  /** data:audio/mp3;base64,... */
  dataUrl: string;
  /** Duração real em segundos. */
  duracaoSegundos: number;
  /** Timestamps por palavra (se disponíveis). null = use fallback proporcional. */
  palavrasComTempo: PalavraComTempo[] | null;
}

export interface PropsVideoReel extends Record<string, unknown> {
  capa: string;
  cenas: Cena[];
  ctaFinal: string;
  imagens: ImagemSerializada[];
  musicaUrl: string | null;
  template: IdTemplate;
  comLegendaPalavraPalavra: boolean;
  narracoes: (AudioNarracao | null)[] | null;
}

export interface PayloadRender {
  roteiro: RoteiroGerado;
  imagens: ImagemSerializada[];
  comMusica: boolean;
  template: IdTemplate;
  comLegendaPalavraPalavra: boolean;
  comVoz: boolean;
  vozId: IdVoz;
  duracaoSegundos: number;
  /**
   * URL do vídeo de fundo (B-roll). Opcional.
   * Sub-etapa 8.1.A: aceito no payload mas ignorado pelo render.
   * Sub-etapa 8.1.B: será usado como background no Remotion.
   */
  videoFundoUrl?: string | null;
}

export type EstadoRender =
  | { tipo: "idle" }
  | { tipo: "preparando" }
  | { tipo: "gerando_voz"; cenaAtual: number; totalCenas: number }
  | { tipo: "renderizando"; progresso: number; etapa?: string }
  | { tipo: "concluido"; videoUrl: string; urlDownloadDireto?: string }
  | {
      tipo: "erro";
      mensagem: string;
      debug?: {
        endpoint: string;
        timestamp: string;
      };
    };
