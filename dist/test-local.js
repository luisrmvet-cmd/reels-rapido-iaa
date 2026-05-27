"use strict";
/**
 * Teste local rápido. Roda com: npm run test:local
 *
 * Envia POST /render para o servidor que você está rodando localmente,
 * usando um payload mínimo válido. Salva o MP4 em ./output/teste.mp4.
 *
 * Pré-requisito: servidor rodando (`npm run dev` em outro terminal).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080";
// =============================================================
// Payload de teste mínimo
// =============================================================
// Imagem de 1x1 vermelha em base64 (placeholder)
const IMG_PLACEHOLDER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const payload = {
    roteiro: {
        capa: "Teste rápido",
        cenas: [
            {
                numero: 1,
                duracaoSegundos: 3,
                textoTela: "Cena 1 de teste",
                narracao: "Esta é a primeira cena de teste do servidor de render.",
                indiceImagem: 0,
            },
            {
                numero: 2,
                duracaoSegundos: 3,
                textoTela: "Cena 2",
                narracao: "Segunda cena para validar o funcionamento.",
                indiceImagem: 0,
            },
        ],
        ctaFinal: "Saiba mais!",
    },
    imagens: [
        {
            dataUrl: IMG_PLACEHOLDER,
            largura: 1,
            altura: 1,
        },
    ],
    comMusica: false,
    template: "tiktok_viral",
    comLegendaPalavraPalavra: false,
    comVoz: false, // sem TTS pra teste rápido (não precisa ElevenLabs)
    vozId: "matilda_fem",
};
async function main() {
    console.log(`[teste] Enviando POST ${SERVER_URL}/render...`);
    const inicio = Date.now();
    const resp = await fetch(`${SERVER_URL}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const erro = await resp.text();
        console.error(`[teste] FALHOU (${resp.status}):`, erro);
        process.exit(1);
    }
    // Salva o MP4
    const outDir = path_1.default.join(process.cwd(), "output");
    fs_1.default.mkdirSync(outDir, { recursive: true });
    const outPath = path_1.default.join(outDir, "teste.mp4");
    const arrayBuffer = await resp.arrayBuffer();
    fs_1.default.writeFileSync(outPath, Buffer.from(arrayBuffer));
    const duracao = Date.now() - inicio;
    const tamanho = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
    console.log(`[teste] OK em ${duracao}ms. MP4 salvo em ${outPath} (${tamanho}MB)`);
}
main().catch((e) => {
    console.error("[teste] Erro fatal:", e);
    process.exit(1);
});
//# sourceMappingURL=test-local.js.map