import type { IdVoz } from "@/types/video";

/**
 * Catálogo curado de vozes premade do ElevenLabs.
 *
 * IMPORTANTE: ElevenLabs free tier não permite usar vozes da Voice Library
 * via API (que incluem vozes nativas BR). As vozes abaixo são do
 * "premade roster" (disponíveis a todos), e funcionam com PT-BR através
 * do modelo `eleven_multilingual_v2`. O sotaque será levemente diferente
 * de um falante nativo, mas a inteligibilidade é alta.
 *
 * Quando o usuário fizer upgrade pro plano Creator+ no ElevenLabs,
 * podemos adicionar vozes da Voice Library com sotaque nativo brasileiro.
 */
export interface PerfilVoz {
  id: IdVoz;
  /** Voice ID do ElevenLabs. */
  voiceId: string;
  /** Nome amigável exibido na UI. */
  nome: string;
  emoji: string;
  /** Tipo: feminina ou masculina. */
  genero: "feminina" | "masculina";
  /** Descrição da personalidade da voz. */
  descricao: string;
  /** Tags pra filtro futuro (não usado ainda). */
  tags: string[];
}

export const CATALOGO_VOZES: Record<IdVoz, PerfilVoz> = {
  matilda_fem: {
    id: "matilda_fem",
    voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda
    nome: "Matilda",
    emoji: "🌟",
    genero: "feminina",
    descricao: "Calorosa e amigável — ótima para conteúdo conversacional",
    tags: ["amigável", "calorosa", "conversação"],
  },
  sarah_fem: {
    id: "sarah_fem",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
    nome: "Sarah",
    emoji: "👩‍💼",
    genero: "feminina",
    descricao: "Profissional e clara — estilo apresentadora de notícias",
    tags: ["profissional", "clara", "notícias"],
  },
  rachel_fem: {
    id: "rachel_fem",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    nome: "Rachel",
    emoji: "🎧",
    genero: "feminina",
    descricao: "Calma e jovem — perfeita para narração e tutoriais",
    tags: ["calma", "narração", "tutorial"],
  },
  adam_masc: {
    id: "adam_masc",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
    nome: "Adam",
    emoji: "🎙️",
    genero: "masculina",
    descricao: "Voz grave e rica — autoridade e confiança",
    tags: ["grave", "autoritário", "confiante"],
  },
  antoni_masc: {
    id: "antoni_masc",
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni
    nome: "Antoni",
    emoji: "🎬",
    genero: "masculina",
    descricao: "Equilibrada e profissional — versátil para qualquer conteúdo",
    tags: ["versátil", "profissional", "comercial"],
  },
  josh_masc: {
    id: "josh_masc",
    voiceId: "TxGEqnHWrfWFTfGW9XjX", // Josh
    nome: "Josh",
    emoji: "🔥",
    genero: "masculina",
    descricao: "Grave e jovem — energia e impacto",
    tags: ["jovem", "energético", "impacto"],
  },
};

export const VOZ_DEFAULT: IdVoz = "matilda_fem";

export function listarVozes(): PerfilVoz[] {
  return Object.values(CATALOGO_VOZES);
}

export function obterVoz(id: IdVoz): PerfilVoz {
  return CATALOGO_VOZES[id] ?? CATALOGO_VOZES[VOZ_DEFAULT];
}
