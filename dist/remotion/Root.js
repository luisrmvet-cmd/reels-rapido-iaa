"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemotionRoot = RemotionRoot;
const jsx_runtime_1 = require("react/jsx-runtime");
const remotion_1 = require("remotion");
const ReelVideo_1 = require("./ReelVideo");
const constantes_1 = require("./constantes");
const propsDefault = {
    capa: "VOCÊ PRECISA VER ISSO 👇",
    ctaFinal: "👉 LINK NA BIO",
    imagens: [],
    musicaUrl: null,
    template: "tiktok_viral",
    comLegendaPalavraPalavra: false,
    narracoes: null,
    cenas: [
        {
            numero: 1,
            textoTela: "Cena 1 de exemplo",
            narracao: "Narração da cena 1",
            duracaoSegundos: 3.75,
        },
        {
            numero: 2,
            textoTela: "Cena 2 de exemplo",
            narracao: "Narração da cena 2",
            duracaoSegundos: 3.75,
        },
        {
            numero: 3,
            textoTela: "Cena 3 de exemplo",
            narracao: "Narração da cena 3",
            duracaoSegundos: 3.75,
        },
        {
            numero: 4,
            textoTela: "Cena 4 de exemplo",
            narracao: "Narração da cena 4",
            duracaoSegundos: 3.75,
        },
    ],
};
function RemotionRoot() {
    const duracaoTotalFrames = propsDefault.cenas.reduce((acc, c) => acc + (0, constantes_1.segundosParaFrames)(c.duracaoSegundos), 0);
    return ((0, jsx_runtime_1.jsx)(remotion_1.Composition, { id: constantes_1.ID_COMPOSICAO, component: ReelVideo_1.ReelVideo, durationInFrames: duracaoTotalFrames, fps: constantes_1.FPS, width: constantes_1.LARGURA, height: constantes_1.ALTURA, defaultProps: propsDefault, calculateMetadata: ({ props }) => {
            const dur = props.cenas.reduce((acc, c) => acc + (0, constantes_1.segundosParaFrames)(c.duracaoSegundos), 0);
            return {
                durationInFrames: dur,
            };
        } }));
}
//# sourceMappingURL=Root.js.map