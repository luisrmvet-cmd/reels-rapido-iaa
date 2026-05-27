"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedText = AnimatedText;
const jsx_runtime_1 = require("react/jsx-runtime");
const remotion_1 = require("remotion");
const react_1 = __importDefault(require("react"));
/**
 * Texto premium para Remotion:
 *  - entrada smooth spring com fade + slide-up
 *  - easing premium (bezier customizado)
 *  - sombra cinematográfica + glow opcional
 *  - bounce sutil nos emojis
 *  - fade-out + leve blur de saída pra crossfade
 *  - variante "legenda_tiktok" com fundo blur por linha
 *  - quebra automática inteligente em linhas
 */
function AnimatedText({ texto, delayFrames = 0, tamanhoFonte = 88, cor = "white", comFadeOut = true, variante = "padrao", comGlow = true, larguraMaxima, style, }) {
    const frame = (0, remotion_1.useCurrentFrame)();
    const { fps, durationInFrames } = (0, remotion_1.useVideoConfig)();
    // ENTRADA: spring premium ~400ms
    const entrada = (0, remotion_1.spring)({
        frame: frame - delayFrames,
        fps,
        config: {
            damping: 20,
            stiffness: 130,
            mass: 0.65,
        },
        durationInFrames: 14,
    });
    const translateY = (0, remotion_1.interpolate)(entrada, [0, 1], [50, 0], {
        easing: remotion_1.Easing.bezier(0.16, 1, 0.3, 1), // ease-out-expo, sensação premium
    });
    const opacidadeEntrada = (0, remotion_1.interpolate)(entrada, [0, 1], [0, 1]);
    // SAÍDA: fade + blur leve nos últimos frames (transição cinematográfica)
    const opacidadeSaida = comFadeOut
        ? (0, remotion_1.interpolate)(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: remotion_1.Easing.bezier(0.4, 0, 0.2, 1),
        })
        : 1;
    const blurSaida = comFadeOut
        ? (0, remotion_1.interpolate)(frame, [durationInFrames - 10, durationInFrames], [0, 4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
        : 0;
    const opacidade = opacidadeEntrada * opacidadeSaida;
    // Quebra texto em linhas (split natural por palavras se for legenda TikTok)
    const linhas = variante === "legenda_tiktok" ? quebrarEmLinhas(texto, 16) : [texto];
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            transform: `translateY(${translateY}px)`,
            opacity: opacidade,
            filter: blurSaida > 0 ? `blur(${blurSaida}px)` : undefined,
            textAlign: "center",
            maxWidth: larguraMaxima ? `${larguraMaxima}px` : "100%",
            willChange: "transform, opacity, filter",
            display: "flex",
            flexDirection: "column",
            gap: variante === "legenda_tiktok" ? 12 : 0,
            alignItems: "center",
            ...style,
        }, children: linhas.map((linha, idxLinha) => ((0, jsx_runtime_1.jsx)(LinhaDeTexto, { texto: linha, variante: variante, tamanhoFonte: tamanhoFonte, cor: cor, comGlow: comGlow, frameAtual: frame - delayFrames }, idxLinha))) }));
}
function LinhaDeTexto({ texto, variante, tamanhoFonte, cor, comGlow, frameAtual, }) {
    const partes = quebrarTextoPorEmojis(texto);
    // Glow pulsante (sutil) — só na variante padrão
    const intensidadeGlow = comGlow
        ? 0.7 + Math.sin(frameAtual * 0.05) * 0.15
        : 0;
    const estiloBase = {
        fontSize: tamanhoFonte,
        fontWeight: 900,
        lineHeight: 1.1,
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: "-0.02em",
        color: cor,
        display: "inline-block",
    };
    // ===== VARIANTE LEGENDA TIKTOK =====
    if (variante === "legenda_tiktok") {
        return ((0, jsx_runtime_1.jsx)("span", { style: {
                ...estiloBase,
                padding: "16px 28px",
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 18,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
            }, children: partes.map((p, i) => p.ehEmoji ? ((0, jsx_runtime_1.jsx)(EmojiBounce, { emoji: p.texto, indice: i, frame: frameAtual }, i)) : ((0, jsx_runtime_1.jsx)(react_1.default.Fragment, { children: p.texto }, i))) }));
    }
    // ===== VARIANTE PADRÃO (com glow + sombra cinematográfica) =====
    const sombras = [
        // Sombras de profundidade (cinematográficas)
        "0 6px 30px rgba(0,0,0,0.95)",
        "0 3px 12px rgba(0,0,0,0.9)",
        "0 0 1px rgba(0,0,0,0.6)",
    ];
    if (comGlow) {
        // Glow colorido pulsante (sensação viral TikTok)
        sombras.push(`0 0 ${28 * intensidadeGlow}px rgba(217, 70, 239, ${0.35 * intensidadeGlow})`);
        sombras.push(`0 0 ${48 * intensidadeGlow}px rgba(124, 58, 237, ${0.22 * intensidadeGlow})`);
    }
    return ((0, jsx_runtime_1.jsx)("span", { style: {
            ...estiloBase,
            textShadow: sombras.join(", "),
        }, children: partes.map((p, i) => p.ehEmoji ? ((0, jsx_runtime_1.jsx)(EmojiBounce, { emoji: p.texto, indice: i, frame: frameAtual }, i)) : ((0, jsx_runtime_1.jsx)(react_1.default.Fragment, { children: p.texto }, i))) }));
}
/**
 * Emoji com bounce sutil contínuo.
 */
function EmojiBounce({ emoji, indice, frame, }) {
    const fase = indice * 0.7;
    const oscilacao = Math.sin(frame * 0.18 + fase);
    const translateY = oscilacao * 5;
    const escala = 1 + oscilacao * 0.035;
    return ((0, jsx_runtime_1.jsx)("span", { style: {
            display: "inline-block",
            transform: `translateY(${translateY}px) scale(${escala})`,
            willChange: "transform",
        }, children: emoji }));
}
/**
 * Quebra um texto em segmentos alternando texto / emoji.
 */
function quebrarTextoPorEmojis(texto) {
    const regexEmoji = /([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}]+)/gu;
    const partes = [];
    let ultimoIndice = 0;
    let match;
    while ((match = regexEmoji.exec(texto)) !== null) {
        if (match.index > ultimoIndice) {
            partes.push({
                texto: texto.slice(ultimoIndice, match.index),
                ehEmoji: false,
            });
        }
        partes.push({ texto: match[0], ehEmoji: true });
        ultimoIndice = match.index + match[0].length;
    }
    if (ultimoIndice < texto.length) {
        partes.push({ texto: texto.slice(ultimoIndice), ehEmoji: false });
    }
    return partes.length > 0 ? partes : [{ texto, ehEmoji: false }];
}
/**
 * Quebra texto em linhas tentando não passar de maxCaracteresPorLinha
 * sem cortar palavras. Estilo TikTok captions.
 */
function quebrarEmLinhas(texto, maxCaracteresPorLinha) {
    const palavras = texto.split(/\s+/);
    const linhas = [];
    let linhaAtual = "";
    for (const palavra of palavras) {
        const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        if (tentativa.length <= maxCaracteresPorLinha || linhaAtual === "") {
            linhaAtual = tentativa;
        }
        else {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        }
    }
    if (linhaAtual)
        linhas.push(linhaAtual);
    return linhas;
}
//# sourceMappingURL=AnimatedText.js.map