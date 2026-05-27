"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CenaVideo = CenaVideo;
const jsx_runtime_1 = require("react/jsx-runtime");
const remotion_1 = require("remotion");
const AnimatedText_1 = require("./video/AnimatedText");
const LegendaPalavraAPalavra_1 = require("./video/LegendaPalavraAPalavra");
const constantes_1 = require("./constantes");
/**
 * Uma cena do reel com template configurável, transições sutis modernas,
 * legenda palavra-por-palavra opcional e narração TTS opcional.
 */
function CenaVideo({ cena, imagem, ehUltima, ctaFinal, template, comLegendaPalavraPalavra, narracao, }) {
    const frame = (0, remotion_1.useCurrentFrame)();
    const { fps, durationInFrames } = (0, remotion_1.useVideoConfig)();
    // ========== TRANSIÇÃO SUTIL E MODERNA ==========
    // Curvas premium: ease-out-expo entrada, ease-in-quart saída
    const easingEntrada = remotion_1.Easing.bezier(0.16, 1, 0.3, 1);
    const easingSaida = remotion_1.Easing.bezier(0.5, 0, 0.75, 0);
    const opacidadeIn = (0, remotion_1.interpolate)(frame, [0, constantes_1.FRAMES_CROSSFADE], [0, 1], {
        extrapolateRight: "clamp",
        easing: easingEntrada,
    });
    const opacidadeOut = (0, remotion_1.interpolate)(frame, [durationInFrames - constantes_1.FRAMES_CROSSFADE, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easingSaida });
    const opacidadeCena = opacidadeIn * opacidadeOut;
    // Blur sutil de transição (4px, bem leve - menos que antes)
    const blurIn = (0, remotion_1.interpolate)(frame, [0, constantes_1.FRAMES_CROSSFADE], [4, 0], {
        extrapolateRight: "clamp",
        easing: easingEntrada,
    });
    const blurOut = (0, remotion_1.interpolate)(frame, [durationInFrames - constantes_1.FRAMES_CROSSFADE, durationInFrames], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easingSaida });
    const blurTotal = Math.max(blurIn, blurOut);
    // Zoom transition sutil: entra 1.02 → 1, sai 1 → 0.98 (efeito dolly)
    const zoomEntrada = (0, remotion_1.interpolate)(frame, [0, constantes_1.FRAMES_CROSSFADE], [1.02, 1], {
        extrapolateRight: "clamp",
        easing: easingEntrada,
    });
    const zoomSaida = (0, remotion_1.interpolate)(frame, [durationInFrames - constantes_1.FRAMES_CROSSFADE, durationInFrames], [1, 0.98], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easingSaida });
    const zoomTransicao = zoomEntrada * zoomSaida;
    // ========== KEN BURNS ULTRA LEVE (1.0 → 1.03) + PAN ==========
    const escalaImagem = (0, remotion_1.interpolate)(frame, [0, durationInFrames], [1, 1.03], {
        extrapolateRight: "clamp",
        easing: remotion_1.Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    const panX = (0, remotion_1.interpolate)(frame, [0, durationInFrames], [0, cena.numero % 2 === 0 ? 12 : -12], { extrapolateRight: "clamp", easing: remotion_1.Easing.bezier(0.25, 0.1, 0.25, 1) });
    // ========== TEXTO "RESPIRANDO" (oscilação sutil contínua) ==========
    const respiracaoTexto = 1 + Math.sin(frame * 0.04) * 0.015;
    // ========== CTA: pop entrada + pulse + glow animado ==========
    const entradaCta = ehUltima
        ? (0, remotion_1.spring)({
            frame: frame - 6,
            fps,
            config: { damping: 9, stiffness: 110, mass: 0.55 },
            durationInFrames: 16,
        })
        : 0;
    const popInicial = ehUltima
        ? (0, remotion_1.interpolate)(entradaCta, [0, 0.5, 1], [0.8, 1.08, 1])
        : 1;
    const pulso = ehUltima ? 1 + Math.sin((frame - 6) * 0.11) * 0.035 : 1;
    const escalaCta = ehUltima ? popInicial * pulso : 1;
    const opacidadeCtaIn = ehUltima ? (0, remotion_1.interpolate)(entradaCta, [0, 1], [0, 1]) : 1;
    const intensidadeGlowCta = ehUltima
        ? 0.55 + Math.sin((frame - 6) * 0.09) * 0.25
        : 0;
    const [glowR, glowG, glowB] = template.glowCorRgb;
    const [glow2R, glow2G, glow2B] = template.glowCor2Rgb;
    return ((0, jsx_runtime_1.jsxs)(remotion_1.AbsoluteFill, { style: {
            backgroundColor: template.fundoCor,
            opacity: opacidadeCena,
            transform: `scale(${zoomTransicao})`,
            filter: blurTotal > 0 ? `blur(${blurTotal}px)` : undefined,
            willChange: "opacity, transform, filter",
        }, children: [imagem && ((0, jsx_runtime_1.jsxs)(remotion_1.AbsoluteFill, { children: [(0, jsx_runtime_1.jsxs)(remotion_1.AbsoluteFill, { children: [(0, jsx_runtime_1.jsx)(remotion_1.Img, { src: imagem.dataUrl, style: {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: `blur(${template.intensidadeBlurFundo}px) brightness(${template.brilhoFundo}) saturate(${template.saturacaoFundo})`,
                                    transform: "scale(1.2)",
                                } }), (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                                    background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${template.vinhetaIntensidade}) 100%)`,
                                } })] }), (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            transform: `translateX(${panX}px) scale(${escalaImagem})`,
                            willChange: "transform",
                        }, children: (0, jsx_runtime_1.jsx)(remotion_1.Img, { src: imagem.dataUrl, style: {
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                            } }) }), (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                            background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.85) 100%)",
                            pointerEvents: "none",
                        } })] })), !imagem && ((0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                    background: template.gradienteCta,
                } })), (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                    background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${template.vinhetaIntensidade * 0.6}) 100%)`,
                    pointerEvents: "none",
                } }), (0, jsx_runtime_1.jsx)("div", { style: {
                    position: "absolute",
                    top: 85,
                    left: 60,
                    padding: "10px 22px",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 999,
                    color: "white",
                    fontSize: 30,
                    fontWeight: 700,
                    fontFamily: template.fontFamily,
                    border: "1px solid rgba(255,255,255,0.1)",
                }, children: cena.numero }), (0, jsx_runtime_1.jsx)(remotion_1.AbsoluteFill, { style: {
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingLeft: 80,
                    paddingRight: 80,
                    paddingBottom: ehUltima ? 500 : 240,
                }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                        transform: `scale(${respiracaoTexto})`,
                        willChange: "transform",
                        maxWidth: "100%",
                        display: "flex",
                        justifyContent: "center",
                    }, children: comLegendaPalavraPalavra ? ((0, jsx_runtime_1.jsx)(LegendaPalavraAPalavra_1.LegendaPalavraAPalavra, { texto: cena.textoTela, startFrame: 4, duracaoFrames: Math.max(20, durationInFrames - 10), template: template, palavrasComTempo: narracao?.palavrasComTempo ?? null })) : ((0, jsx_runtime_1.jsx)(AnimatedText_1.AnimatedText, { texto: cena.textoTela, delayFrames: 4, tamanhoFonte: template.tamanhoTexto, comFadeOut: true, comGlow: template.textoGlow, variante: "padrao", larguraMaxima: 920 })) }) }), ehUltima && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: "absolute",
                    bottom: 200,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    opacity: opacidadeCtaIn,
                    transform: `scale(${escalaCta})`,
                    willChange: "transform, opacity",
                }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                        display: "inline-block",
                        padding: "32px 64px",
                        background: template.gradienteCta,
                        borderRadius: 999,
                        color: "white",
                        fontSize: 68,
                        fontWeight: 900,
                        fontFamily: template.fontFamily,
                        textTransform: template.transformTexto,
                        boxShadow: [
                            `0 14px 60px rgba(${glowR}, ${glowG}, ${glowB}, ${0.5 * intensidadeGlowCta})`,
                            `0 0 ${80 * intensidadeGlowCta}px rgba(${glowR}, ${glowG}, ${glowB}, ${0.5 * intensidadeGlowCta})`,
                            `0 0 ${140 * intensidadeGlowCta}px rgba(${glow2R}, ${glow2G}, ${glow2B}, ${0.35 * intensidadeGlowCta})`,
                            "inset 0 1px 0 rgba(255,255,255,0.25)",
                            "inset 0 -2px 0 rgba(0,0,0,0.15)",
                        ].join(", "),
                        textShadow: "0 2px 8px rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.18)",
                    }, children: ctaFinal }) })), narracao && ((0, jsx_runtime_1.jsx)(remotion_1.Audio, { src: narracao.dataUrl, volume: (f) => {
                    // Fade in nos primeiros 8 frames, fade out nos últimos 8
                    const fadeIn = (0, remotion_1.interpolate)(f, [0, 8], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    });
                    const fadeOut = (0, remotion_1.interpolate)(f, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return fadeIn * fadeOut;
                } }))] }));
}
//# sourceMappingURL=CenaVideo.js.map