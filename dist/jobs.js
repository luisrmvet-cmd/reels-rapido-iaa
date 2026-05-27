"use strict";
/**
 * Gerenciamento de jobs de render assincrono.
 *
 * Como funciona:
 *   1. POST /render cria um job em estado `pending`
 *   2. Worker pega da fila (1 por vez) e processa
 *   3. Frontend faz polling em GET /jobs/:id/status
 *   4. Quando done, frontend baixa em GET /jobs/:id/video
 *
 * Limitacoes intencionais:
 *   - 1 job concorrente (Render free/starter nao aguenta paralelo)
 *   - Estado em memoria (perde no restart - ok pra MVP)
 *   - MP4 em /tmp/jobs (limpa apos 10min)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarJobId = gerarJobId;
exports.criarJob = criarJob;
exports.obterJob = obterJob;
exports.atualizarJob = atualizarJob;
exports.caminhoMp4DoJob = caminhoMp4DoJob;
exports.proximoJob = proximoJob;
exports.tamanhoFila = tamanhoFila;
exports.totalJobs = totalJobs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const JOBS = new Map();
const FILA = []; // ids em ordem FIFO
const PASTA_JOBS = path_1.default.join(os_1.default.tmpdir(), "jobs");
const TTL_MS = 10 * 60 * 1000; // 10 min — depois disso o MP4 e o job somem
const LIMPEZA_INTERVALO_MS = 60 * 1000; // 1 min
try {
    fs_1.default.mkdirSync(PASTA_JOBS, { recursive: true });
}
catch {
    // ignora
}
/** Gera id curto, legivel, único */
function gerarJobId() {
    return crypto_1.default.randomBytes(6).toString("hex");
}
function criarJob(payload) {
    const id = gerarJobId();
    const job = {
        id,
        estado: "pending",
        progresso: 0,
        etapa: "fila",
        payload,
        criadoEm: Date.now(),
    };
    JOBS.set(id, job);
    FILA.push(id);
    return job;
}
function obterJob(id) {
    return JOBS.get(id);
}
function atualizarJob(id, patch) {
    const job = JOBS.get(id);
    if (!job)
        return undefined;
    Object.assign(job, patch);
    return job;
}
function caminhoMp4DoJob(id) {
    return path_1.default.join(PASTA_JOBS, `${id}.mp4`);
}
/**
 * Tira o próximo job da fila (se houver). Retorna undefined se vazia.
 */
function proximoJob() {
    while (FILA.length > 0) {
        const id = FILA.shift();
        const job = JOBS.get(id);
        if (job && job.estado === "pending")
            return job;
        // se job nao existe ou nao esta pending, pula
    }
    return undefined;
}
function tamanhoFila() {
    return FILA.length;
}
function totalJobs() {
    return JOBS.size;
}
/**
 * Limpa jobs antigos e arquivos MP4 órfãos.
 * Roda em intervalo.
 */
function limpezaPeriodica() {
    const agora = Date.now();
    for (const [id, job] of JOBS) {
        const idade = agora - (job.terminadoEm ?? job.criadoEm);
        if (idade > TTL_MS) {
            // Remove arquivo se existir
            try {
                const mp4 = caminhoMp4DoJob(id);
                if (fs_1.default.existsSync(mp4))
                    fs_1.default.unlinkSync(mp4);
            }
            catch {
                // ignora
            }
            JOBS.delete(id);
            console.log(`[jobs] removido job antigo: ${id} (idade=${Math.round(idade / 1000)}s)`);
        }
    }
}
setInterval(limpezaPeriodica, LIMPEZA_INTERVALO_MS);
//# sourceMappingURL=jobs.js.map