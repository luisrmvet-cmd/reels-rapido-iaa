"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DURACAO_MAXIMA_SEGUNDOS = exports.FRAMES_CROSSFADE = exports.ID_COMPOSICAO = exports.ALTURA = exports.LARGURA = exports.FPS = void 0;
exports.segundosParaFrames = segundosParaFrames;
// =============================================================
// MODO TESTE ULTRA-LEVE (reducao agressiva de RAM)
// Render Free Plan: 512MB total, OOM em ~450MB na pratica
// =============================================================
exports.FPS = 12;
exports.LARGURA = 480;
exports.ALTURA = 854;
exports.ID_COMPOSICAO = "ReelVertical";
/** Crossfade simplificado. 3 frames @ 12fps = 250ms. */
exports.FRAMES_CROSSFADE = 3;
/** Duracao maxima do reel em segundos (modo teste). */
exports.DURACAO_MAXIMA_SEGUNDOS = 6;
function segundosParaFrames(segundos) {
    return Math.round(segundos * exports.FPS);
}
//# sourceMappingURL=constantes.js.map