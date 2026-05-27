"use strict";
/**
 * Provider de Text-to-Speech (server-side) usando ElevenLabs.
 *
 * Recursos:
 *  - Endpoint `/with-timestamps` para sincronização perfeita
 *  - Cache em disco baseado em hash de (texto + voice + settings)
 *  - Fallback gracioso: retorna null se sem API key ou erro
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarVozTTS = gerarVozTTS;
exports.ttsConfigurado = ttsConfigurado;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const vozes_1 = require("./vozes");
const MODELO = "eleven_multilingual_v2";
/**
 * Configurações da voz - mantidas constantes pra que o cache funcione.
 * Se você mudar isso, todos os caches antigos viram inválidos automaticamente
 * (pq o hash do conteúdo muda).
 */
const VOICE_SETTINGS = {
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.35,
    use_speaker_boost: true,
};
/**
 * Diretório de cache em disco (sobrevive entre requests, some no restart do servidor)
 */
const CACHE_DIR = path_1.default.join(os_1.default.tmpdir(), "reels-rapido-ia-tts-cache");
function garantirDir() {
    if (!fs_1.default.existsSync(CACHE_DIR)) {
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
    }
}
function calcularHash(texto, voiceId) {
    const settingsStr = JSON.stringify(VOICE_SETTINGS);
    const conteudo = `${MODELO}|${voiceId}|${settingsStr}|${texto.trim()}`;
    return crypto_1.default.createHash("sha256").update(conteudo).digest("hex").slice(0, 24);
}
function lerCache(hash) {
    const mp3Path = path_1.default.join(CACHE_DIR, `${hash}.mp3`);
    const metaPath = path_1.default.join(CACHE_DIR, `${hash}.json`);
    try {
        if (!fs_1.default.existsSync(mp3Path) || !fs_1.default.existsSync(metaPath))
            return null;
        const mp3 = fs_1.default.readFileSync(mp3Path);
        const meta = JSON.parse(fs_1.default.readFileSync(metaPath, "utf-8"));
        return { mp3, meta };
    }
    catch {
        return null;
    }
}
function gravarCache(hash, mp3, meta) {
    try {
        garantirDir();
        fs_1.default.writeFileSync(path_1.default.join(CACHE_DIR, `${hash}.mp3`), mp3);
        fs_1.default.writeFileSync(path_1.default.join(CACHE_DIR, `${hash}.json`), JSON.stringify(meta));
    }
    catch (e) {
        console.warn("[TTS-CACHE] Falha ao gravar cache:", e);
    }
}
/**
 * Converte alinhamento por caractere (do ElevenLabs) em alinhamento por palavra.
 *
 * O endpoint /with-timestamps retorna:
 *   alignment: {
 *     characters: ["O", "l", "á", " ", "m", "u", "n", "d", "o"],
 *     character_start_times_seconds: [0.0, 0.05, ...],
 *     character_end_times_seconds: [0.05, 0.1, ...]
 *   }
 */
function agruparPalavras(alignment) {
    if (!alignment?.characters?.length)
        return [];
    const palavras = [];
    let bufferPalavra = "";
    let inicioPalavra = 0;
    let fimPalavra = 0;
    for (let i = 0; i < alignment.characters.length; i++) {
        const c = alignment.characters[i];
        const inicio = alignment.character_start_times_seconds[i] ?? 0;
        const fim = alignment.character_end_times_seconds[i] ?? inicio;
        const ehSeparador = /\s/.test(c);
        if (ehSeparador) {
            if (bufferPalavra.length > 0) {
                palavras.push({
                    palavra: bufferPalavra,
                    inicioSegundos: inicioPalavra,
                    fimSegundos: fimPalavra,
                });
                bufferPalavra = "";
            }
        }
        else {
            if (bufferPalavra.length === 0) {
                inicioPalavra = inicio;
            }
            bufferPalavra += c;
            fimPalavra = fim;
        }
    }
    // Última palavra sem espaço final
    if (bufferPalavra.length > 0) {
        palavras.push({
            palavra: bufferPalavra,
            inicioSegundos: inicioPalavra,
            fimSegundos: fimPalavra,
        });
    }
    return palavras;
}
async function gerarVozTTS(texto, vozId) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
        console.warn("[TTS] ELEVENLABS_API_KEY não configurada — pulando voz");
        return null;
    }
    if (!texto || texto.trim().length === 0)
        return null;
    const voz = (0, vozes_1.obterVoz)(vozId);
    const hash = calcularHash(texto, voz.voiceId);
    // === Tenta cache primeiro ===
    const cache = lerCache(hash);
    if (cache) {
        console.log(`[TTS-CACHE] HIT (${hash})`);
        return {
            buffer: cache.mp3,
            duracaoSegundos: cache.meta.duracaoSegundos,
            palavras: cache.meta.palavras,
        };
    }
    console.log(`[TTS-CACHE] MISS (${hash}) — chamando ElevenLabs`);
    // === Chama ElevenLabs com timestamps ===
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voz.voiceId}/with-timestamps`;
    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                text: texto.trim(),
                model_id: MODELO,
                voice_settings: VOICE_SETTINGS,
            }),
        });
        if (!resp.ok) {
            const err = await resp.text().catch(() => "");
            console.error(`[TTS] ElevenLabs ${resp.status}: ${err.slice(0, 300)}`);
            return null;
        }
        // O endpoint /with-timestamps retorna JSON com:
        // { audio_base64, alignment, normalized_alignment }
        const data = (await resp.json());
        if (!data?.audio_base64) {
            console.error("[TTS] Resposta sem audio_base64");
            return null;
        }
        const buffer = Buffer.from(data.audio_base64, "base64");
        // Prefere alignment normalizado (mais consistente), fallback pro raw
        const alignment = data.normalized_alignment ?? data.alignment;
        const palavras = alignment ? agruparPalavras(alignment) : [];
        // Duração: usa o fim da última palavra + uma pequena margem
        const duracaoSegundos = palavras.length > 0
            ? palavras[palavras.length - 1].fimSegundos + 0.15
            : Math.max(1, texto.length / 14); // fallback
        gravarCache(hash, buffer, { duracaoSegundos, palavras });
        return { buffer, duracaoSegundos, palavras };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[TTS] Erro ao chamar ElevenLabs:", msg);
        return null;
    }
}
function ttsConfigurado() {
    return !!process.env.ELEVENLABS_API_KEY?.trim();
}
//# sourceMappingURL=tts.js.map