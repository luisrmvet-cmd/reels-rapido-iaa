"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReelVideo = ReelVideo;
const jsx_runtime_1 = require("react/jsx-runtime");
const remotion_1 = require("remotion");
const CenaVideo_1 = require("./CenaVideo");
const constantes_1 = require("./constantes");
const templates_1 = require("./templates");
/**
 * Composição principal: monta cenas em crossfade, barra de stories,
 * capa overlay, música de fundo com fade in/out e narração TTS.
 */
function ReelVideo({ capa, cenas, ctaFinal, imagens, musicaUrl, template: idTemplate, comLegendaPalavraPalavra, narracoes, }) {
    const template = templates_1.TEMPLATES[idTemplate] ?? templates_1.TEMPLATES[templates_1.TEMPLATE_DEFAULT];
    const cenasComTiming = cenas.map((cena, idx) => {
        const duracaoFrames = (0, constantes_1.segundosParaFrames)(cena.duracaoSegundos);
        const inicioBase = cenas
            .slice(0, idx)
            .reduce((acc, c) => acc + (0, constantes_1.segundosParaFrames)(c.duracaoSegundos), 0);
        const inicio = idx === 0 ? 0 : inicioBase - constantes_1.FRAMES_CROSSFADE;
        const ehUltima = idx === cenas.length - 1;
        const duracaoExtendida = idx === 0
            ? duracaoFrames + (ehUltima ? 0 : constantes_1.FRAMES_CROSSFADE)
            : duracaoFrames + constantes_1.FRAMES_CROSSFADE + (ehUltima ? 0 : constantes_1.FRAMES_CROSSFADE);
        return { cena, inicio, duracao: duracaoExtendida, idx, ehUltima };
    });
    const duracaoTotal = cenas.reduce((acc, c) => acc + (0, constantes_1.segundosParaFrames)(c.duracaoSegundos), 0);
    // ===== Calcular janelas de narração para ducking automático =====
    // Quando uma narração toca, a música abaixa pra não competir
    const janelasNarracao = [];
    if (narracoes) {
        cenasComTiming.forEach(({ inicio, idx }) => {
            const narr = narracoes[idx];
            if (!narr)
                return;
            const inicioRealCena = idx === 0 ? 0 : inicio + constantes_1.FRAMES_CROSSFADE;
            const duracaoNarr = (0, constantes_1.segundosParaFrames)(narr.duracaoSegundos);
            janelasNarracao.push({
                inicio: inicioRealCena,
                fim: inicioRealCena + duracaoNarr,
            });
        });
    }
    function ehDentroDaNarracao(f) {
        return janelasNarracao.some((j) => f >= j.inicio && f <= j.fim);
    }
    // Música com fade in/out (1 segundo cada)
    const framesFade = 30;
    // Volumes:
    // - sem narração: 0.25 (volume confortável)
    // - durante narração (ducked): 0.08 (audível só de fundo)
    const VOL_MUSICA_NORMAL = 0.25;
    const VOL_MUSICA_DUCKED = 0.08;
    return ((0, jsx_runtime_1.jsxs)(remotion_1.AbsoluteFill, { style: { backgroundColor: template.fundoCor }, children: [cenasComTiming.map(({ cena, inicio, duracao, idx, ehUltima }) => {
                const imagem = imagens.length > 0 ? imagens[idx % imagens.length] : null;
                const narracao = narracoes && narracoes[idx] ? narracoes[idx] : null;
                return ((0, jsx_runtime_1.jsx)(remotion_1.Sequence, { from: inicio, durationInFrames: duracao, layout: "none", children: (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { children: (0, jsx_runtime_1.jsx)(CenaVideo_1.CenaVideo, { cena: cena, imagem: imagem, ehUltima: ehUltima, ctaFinal: ctaFinal, template: template, comLegendaPalavraPalavra: comLegendaPalavraPalavra, narracao: narracao }) }) }, cena.numero));
            }), musicaUrl && ((0, jsx_runtime_1.jsx)(remotion_1.Audio, { src: musicaUrl, volume: (f) => {
                    const fadeIn = (0, remotion_1.interpolate)(f, [0, framesFade], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    });
                    const fadeOut = (0, remotion_1.interpolate)(f, [duracaoTotal - framesFade, duracaoTotal], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    // Ducking: abaixa o volume durante narração
                    const volBase = ehDentroDaNarracao(f)
                        ? VOL_MUSICA_DUCKED
                        : VOL_MUSICA_NORMAL;
                    return volBase * fadeIn * fadeOut;
                } })), (0, jsx_runtime_1.jsx)(remotion_1.Sequence, { from: 0, durationInFrames: 48, children: (0, jsx_runtime_1.jsx)(CapaOverlay, { texto: capa, idTemplate: idTemplate }) }), (0, jsx_runtime_1.jsx)(BarraProgressoStories, { cenasComTiming: cenasComTiming.map(({ inicio, idx }) => {
                    const duracaoOriginal = (0, constantes_1.segundosParaFrames)(cenas[idx].duracaoSegundos);
                    const inicioReal = idx === 0 ? 0 : inicio + constantes_1.FRAMES_CROSSFADE;
                    return { inicioReal, duracaoOriginal };
                }) })] }));
}
/**
 * Barra de progresso premium estilo Instagram Stories.
 * Animação ultra fluida com easing suave.
 */
function BarraProgressoStories({ cenasComTiming, }) {
    const frame = (0, remotion_1.useCurrentFrame)();
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            position: "absolute",
            top: 28,
            left: 36,
            right: 36,
            display: "flex",
            gap: 6,
            zIndex: 100,
            pointerEvents: "none",
        }, children: cenasComTiming.map((c, idx) => {
            const progresso = (0, remotion_1.interpolate)(frame, [c.inicioReal, c.inicioReal + c.duracaoOriginal], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                // Easing suave em vez de linear - mais "premium"
                easing: remotion_1.Easing.bezier(0.4, 0, 0.2, 1),
            });
            return ((0, jsx_runtime_1.jsx)("div", { style: {
                    flex: 1,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.22)",
                    overflow: "hidden",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    boxShadow: "inset 0 1px 0 rgba(0,0,0,0.2)",
                }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                        width: `${progresso * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 100%)",
                        borderRadius: 999,
                        boxShadow: "0 0 10px rgba(255,255,255,0.7)",
                    } }) }, idx));
        }) }));
}
/**
 * Overlay da capa (1.5s iniciais). Usa cores do template.
 */
function CapaOverlay({ texto, idTemplate, }) {
    const frame = (0, remotion_1.useCurrentFrame)();
    const template = templates_1.TEMPLATES[idTemplate] ?? templates_1.TEMPLATES[templates_1.TEMPLATE_DEFAULT];
    const opacidade = (0, remotion_1.interpolate)(frame, [0, 6, 38, 48], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: remotion_1.Easing.bezier(0.4, 0, 0.2, 1),
    });
    return ((0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 120,
            paddingLeft: 80,
            paddingRight: 80,
            pointerEvents: "none",
            opacity: opacidade,
        }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                padding: template.capaCorBlur ? "16px 28px" : "20px 40px",
                background: template.capaFundo,
                backdropFilter: template.capaCorBlur ? "blur(20px)" : undefined,
                WebkitBackdropFilter: template.capaCorBlur ? "blur(20px)" : undefined,
                color: template.capaCor,
                fontSize: template.capaTamanho,
                fontWeight: 900,
                borderRadius: 22,
                fontFamily: template.fontFamily,
                textTransform: template.transformTexto,
                letterSpacing: "-0.01em",
                maxWidth: "85%",
                textAlign: "center",
                boxShadow: "0 12px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
                border: template.capaCorBlur
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none",
            }, children: texto }) }));
}
//# sourceMappingURL=ReelVideo.js.map