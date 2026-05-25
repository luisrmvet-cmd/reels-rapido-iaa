export type EstiloReel =
  | "venda"
  | "demonstracao"
  | "dor"
  | "curiosidade"
  | "prova_social";

export type DuracaoReel = 15 | 20;

export interface ImagemUpload {
  id: string;
  file: File;
  previewUrl: string;
}

export interface DadosFormulario {
  assunto: string;
  duracao: DuracaoReel;
  estilo: EstiloReel;
  imagens: ImagemUpload[];
}

export interface Cena {
  numero: number;
  textoTela: string;
  narracao: string;
  duracaoSegundos: number;
}

export interface RoteiroGerado {
  capa: string;
  cenas: Cena[];
  ctaFinal: string;
  legendaPost: string;
  hashtags: string[];
}
