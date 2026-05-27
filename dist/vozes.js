"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOZ_DEFAULT = exports.CATALOGO_VOZES = void 0;
exports.listarVozes = listarVozes;
exports.obterVoz = obterVoz;
exports.CATALOGO_VOZES = {
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
exports.VOZ_DEFAULT = "matilda_fem";
function listarVozes() {
    return Object.values(exports.CATALOGO_VOZES);
}
function obterVoz(id) {
    return exports.CATALOGO_VOZES[id] ?? exports.CATALOGO_VOZES[exports.VOZ_DEFAULT];
}
//# sourceMappingURL=vozes.js.map