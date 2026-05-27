"use strict";
/**
 * Servidor de render Remotion dedicado — render ASSINCRONO.
 *
 * Pipeline:
 *   POST /render            → cria job, retorna { jobId } imediatamente
 *   GET  /jobs/:id/status   → polling (pending/rendering/done/error)
 *   GET  /jobs/:id/video    → baixa o MP4 quando done
 *
 * Worker em background processa 1 job por vez (RAM limitada).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const bundler_1 = require("@remotion/bundler");
const renderer_1 = require("@remotion/renderer");
const constantes_1 = require("./remotion/constantes");
const tts_1 = require("./tts");
const jobs_1 = require("./jobs");
// =============================================================
// Cache do Remotion (Chrome headless + bundle)
// =============================================================
const remotionCacheDir = path_1.default.join(os_1.default.tmpdir(), "remotion-cache");
try {
    fs_1.default.mkdirSync(remotionCacheDir, { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(remotionCacheDir, "browser"), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(remotionCacheDir, "bundle"), { recursive: true });
    process.env.REMOTION_CACHE_DIR = remotionCacheDir;
    process.env.REMOTION_BROWSER_CACHE_DIR = remotionCacheDir;
    process.env.PUPPETEER_CACHE_DIR = remotionCacheDir;
    process.env.PLAYWRIGHT_BROWSERS_PATH = remotionCacheDir;
    console.log(`[startup] remotionCacheDir: ${remotionCacheDir}`);
}
catch (e) {
    console.warn("[startup] Falha:", e);
}
const app = (0, express_1.default)();
// CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    next();
});
app.use(express_1.default.json({ limit: "50mb" }));
const PORT = Number(process.env.PORT) || 8080;
// =============================================================
// Bundle cache (1x por processo)
// =============================================================
let bundleCache = null;
async function obterBundle() {
    if (bundleCache && fs_1.default.existsSync(bundleCache))
        return bundleCache;
    const entry = path_1.default.join(__dirname, "remotion", "index.ts");
    const entryJs = path_1.default.join(__dirname, "remotion", "index.js");
    const entryReal = fs_1.default.existsSync(entry) ? entry : entryJs;
    if (!fs_1.default.existsSync(entryReal)) {
        throw new Error(`[bundle] Entry nao encontrado: ${entry} nem ${entryJs}`);
    }
    console.log(`[bundle] Bundling ${entryReal}...`);
    const inicio = Date.now();
    const out = await (0, bundler_1.bundle)({
        entryPoint: entryReal,
        outDir: path_1.default.join(remotionCacheDir, `bundle-${Date.now()}`),
    });
    console.log(`[bundle] OK em ${Date.now() - inicio}ms -> ${out}`);
    bundleCache = out;
    return out;
}
// =============================================================
// Healthcheck + info de jobs
// =============================================================
app.get("/", (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
        status: "ok",
        servico: "reels-render-service",
        modo: "assincrono",
        fila: (0, jobs_1.tamanhoFila)(),
        jobsTotal: (0, jobs_1.totalJobs)(),
        memoria: { rssMB: Math.round(mem.rss / 1024 / 1024), heapMB: Math.round(mem.heapUsed / 1024 / 1024) },
    });
});
app.get("/healthz", (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
        status: "ok",
        cacheDir: remotionCacheDir,
        servico: "reels-render-service",
        versao: "0.2.0-async",
        modo: "assincrono",
        bundleCacheado: bundleCache !== null,
        ttsHabilitado: Boolean(process.env.ELEVENLABS_API_KEY),
        fila: (0, jobs_1.tamanhoFila)(),
        jobsTotal: (0, jobs_1.totalJobs)(),
        memoria: { rssMB: Math.round(mem.rss / 1024 / 1024), heapMB: Math.round(mem.heapUsed / 1024 / 1024) },
    });
});
// =============================================================
// POST /render — cria job, retorna 202 { jobId }
// =============================================================
app.post("/render", (req, res) => {
    const body = req.body;
    if (!body?.roteiro || !Array.isArray(body.imagens)) {
        res.status(400).json({ erro: "Payload invalido: faltam roteiro ou imagens" });
        return;
    }
    const job = (0, jobs_1.criarJob)(body);
    console.log(`[POST /render] job criado: ${job.id} (fila=${(0, jobs_1.tamanhoFila)()})`);
    res.status(202).json({
        jobId: job.id,
        estado: job.estado,
        posicaoFila: (0, jobs_1.tamanhoFila)(),
    });
    // Dispara o worker (idempotente — se ja estiver rodando, nao faz nada)
    processarFila();
});
// =============================================================
// GET /jobs/:id/status — polling
// =============================================================
app.get("/jobs/:id/status", (req, res) => {
    const job = (0, jobs_1.obterJob)(req.params.id);
    if (!job) {
        res.status(404).json({ erro: "Job nao encontrado" });
        return;
    }
    // Calcula URL do video se done (relativa ao service)
    const videoUrl = job.estado === "done" ? `/jobs/${job.id}/video` : undefined;
    res.json({
        jobId: job.id,
        estado: job.estado,
        progresso: job.progresso,
        etapa: job.etapa,
        videoUrl,
        tamanhoBytes: job.tamanhoBytes,
        erro: job.erro,
    });
});
// =============================================================
// GET /jobs/:id/video — baixa o MP4 quando done
// =============================================================
app.get("/jobs/:id/video", (req, res) => {
    const reqId = Math.random().toString(36).slice(2, 8);
    console.log(`[download ${reqId}] download started: jobId=${req.params.id}`);
    const job = (0, jobs_1.obterJob)(req.params.id);
    if (!job) {
        console.error(`[download ${reqId}] download failed: job nao encontrado`);
        res.status(404).json({ erro: "Job nao encontrado" });
        return;
    }
    if (job.estado !== "done") {
        console.warn(`[download ${reqId}] job ainda nao pronto. estado=${job.estado}`);
        res.status(409).json({ erro: `Job ainda nao pronto. estado=${job.estado}` });
        return;
    }
    const mp4 = job.caminhoMp4 ?? (0, jobs_1.caminhoMp4DoJob)(job.id);
    console.log(`[download ${reqId}] caminho do arquivo: ${mp4}`);
    if (!fs_1.default.existsSync(mp4)) {
        console.error(`[download ${reqId}] download failed: arquivo nao existe no disco`);
        res.status(410).json({ erro: "MP4 expirou ou foi removido" });
        return;
    }
    const stat = fs_1.default.statSync(mp4);
    console.log(`[download ${reqId}] file exists: true | file size bytes: ${stat.size} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
    if (stat.size === 0) {
        console.error(`[download ${reqId}] download failed: arquivo tem 0 bytes`);
        res.status(500).json({ erro: "Arquivo gerado tem 0 bytes" });
        return;
    }
    if (stat.size < 10240) {
        console.warn(`[download ${reqId}] AVISO: arquivo muito pequeno (${stat.size} bytes) - pode estar corrompido`);
    }
    // Le os primeiros bytes pra validar assinatura MP4 antes de enviar
    try {
        const fd = fs_1.default.openSync(mp4, "r");
        const headerBuf = Buffer.alloc(16);
        fs_1.default.readSync(fd, headerBuf, 0, 16, 0);
        fs_1.default.closeSync(fd);
        const ftyp = headerBuf.slice(4, 8).toString("ascii");
        console.log(`[download ${reqId}] MP4 signature (bytes 4-8): "${ftyp}" (esperado: "ftyp")`);
        if (ftyp !== "ftyp") {
            console.error(`[download ${reqId}] ALERTA: assinatura MP4 invalida! Arquivo provavelmente corrompido.`);
            // Nao bloqueia o envio - deixa o cliente ver o que ta acontecendo
        }
    }
    catch (e) {
        console.warn(`[download ${reqId}] falha ao ler header pra validar:`, e instanceof Error ? e.message : e);
    }
    // Headers obrigatorios
    const contentType = "video/mp4";
    const contentDisposition = `attachment; filename="reel.mp4"`;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size.toString());
    res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");
    console.log(`[download ${reqId}] content-type enviado: ${contentType}`);
    console.log(`[download ${reqId}] content-disposition: ${contentDisposition}`);
    // Detector de cliente que desconecta antes do download terminar
    let clienteFechou = false;
    req.on("close", () => {
        if (!res.writableEnded) {
            clienteFechou = true;
            console.warn(`[download ${reqId}] cliente fechou conexao durante download`);
        }
    });
    // res.sendFile: deixa Express gerenciar stream, suporta range requests,
    // mais robusto que readFileSync+end pra arquivos grandes
    res.sendFile(mp4, { acceptRanges: true }, (err) => {
        if (err) {
            console.error(`[download ${reqId}] download failed durante envio:`, err.message);
            if (!res.headersSent) {
                res.status(500).json({ erro: `Falha ao enviar MP4: ${err.message}` });
            }
            return;
        }
        if (clienteFechou) {
            console.warn(`[download ${reqId}] download interrompido pelo cliente`);
        }
        else {
            console.log(`[download ${reqId}] download finished: ${(stat.size / 1024 / 1024).toFixed(2)}MB enviados`);
        }
    });
});
// =============================================================
// WORKER LOOP — 1 job por vez
// =============================================================
let workerRodando = false;
function processarFila() {
    if (workerRodando)
        return;
    workerRodando = true;
    setImmediate(loopWorker);
}
async function loopWorker() {
    try {
        while (true) {
            const job = (0, jobs_1.proximoJob)();
            if (!job)
                break;
            console.log(`[worker] pegou job ${job.id}. fila restante: ${(0, jobs_1.tamanhoFila)()}`);
            try {
                await processarJob(job);
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error(`[worker] job ${job.id} falhou:`, msg);
                (0, jobs_1.atualizarJob)(job.id, {
                    estado: "error",
                    erro: msg,
                    terminadoEm: Date.now(),
                });
            }
        }
    }
    finally {
        workerRodando = false;
        console.log(`[worker] fila vazia, encerrando worker`);
    }
}
// =============================================================
// processarJob — pipeline de render granular (etapas 1-7)
// =============================================================
async function processarJob(job) {
    const inicioTotal = Date.now();
    const body = job.payload;
    (0, jobs_1.atualizarJob)(job.id, {
        estado: "rendering",
        iniciadoEm: Date.now(),
        etapa: "iniciando",
        progresso: 0,
    });
    console.log(`[job ${job.id}] render started. cenas=${body.roteiro.cenas.length}, template=${body.template}`);
    // ===== Cap de duracao =====
    const duracaoTotal = body.roteiro.cenas.reduce((acc, c) => acc + (c.duracaoSegundos || 0), 0);
    if (duracaoTotal > constantes_1.DURACAO_MAXIMA_SEGUNDOS) {
        console.warn(`[job ${job.id}] duracao=${duracaoTotal}s excede ${constantes_1.DURACAO_MAXIMA_SEGUNDOS}s. Truncando.`);
        const fator = constantes_1.DURACAO_MAXIMA_SEGUNDOS / duracaoTotal;
        body.roteiro.cenas = body.roteiro.cenas.map((c) => ({
            ...c,
            duracaoSegundos: Math.max(1, Math.round(c.duracaoSegundos * fator)),
        }));
    }
    // Modo teste leve: voz/musica/legenda OFF
    if (body.comVoz)
        body.comVoz = false;
    if (body.comMusica)
        body.comMusica = false;
    if (body.comLegendaPalavraPalavra)
        body.comLegendaPalavraPalavra = false;
    let narracoes = null;
    if (body.comVoz) {
        narracoes = [];
        for (const cena of body.roteiro.cenas) {
            const texto = cena.narracao?.trim() || cena.textoTela?.trim() || "";
            if (!texto) {
                narracoes.push(null);
                continue;
            }
            const resultado = await (0, tts_1.gerarVozTTS)(texto, body.vozId);
            if (!resultado) {
                narracoes.push(null);
                continue;
            }
            const dataUrl = `data:audio/mp3;base64,${resultado.buffer.toString("base64")}`;
            narracoes.push({
                dataUrl,
                duracaoSegundos: resultado.duracaoSegundos,
                palavrasComTempo: resultado.palavras.length > 0 ? resultado.palavras : null,
            });
        }
    }
    const propsVideo = {
        capa: body.roteiro.capa,
        cenas: body.roteiro.cenas,
        ctaFinal: body.roteiro.ctaFinal,
        imagens: body.imagens,
        musicaUrl: null,
        template: body.template,
        comLegendaPalavraPalavra: body.comLegendaPalavraPalavra,
        narracoes,
    };
    // ===== ETAPA 1: bundle =====
    (0, jobs_1.atualizarJob)(job.id, { etapa: "bundle", progresso: 5 });
    console.log(`[job ${job.id}] [etapa-1] bundle: start`);
    const inicioBundle = Date.now();
    const bundleLocation = await obterBundle();
    console.log(`[job ${job.id}] [etapa-1] bundle: ok em ${Date.now() - inicioBundle}ms`);
    // ===== ETAPA 2: ensureBrowser =====
    (0, jobs_1.atualizarJob)(job.id, { etapa: "ensureBrowser", progresso: 10 });
    console.log(`[job ${job.id}] [etapa-2] ensureBrowser: start`);
    const inicioEnsure = Date.now();
    await (0, renderer_1.ensureBrowser)();
    console.log(`[job ${job.id}] [etapa-2] ensureBrowser: ok em ${Date.now() - inicioEnsure}ms`);
    // ===== ETAPA 3: openBrowser =====
    (0, jobs_1.atualizarJob)(job.id, { etapa: "openBrowser", progresso: 15 });
    console.log(`[job ${job.id}] [etapa-3] openBrowser: start`);
    const inicioOpen = Date.now();
    const browserInstance = await (0, renderer_1.openBrowser)("chrome", {
        chromiumOptions: {
            gl: "swangle",
            enableMultiProcessOnLinux: false,
            disableWebSecurity: true,
            ignoreCertificateErrors: true,
        },
    });
    console.log(`[job ${job.id}] [etapa-3] openBrowser: ok em ${Date.now() - inicioOpen}ms`);
    try {
        // ===== ETAPA 4: selectComposition =====
        (0, jobs_1.atualizarJob)(job.id, { etapa: "selectComposition", progresso: 20 });
        console.log(`[job ${job.id}] [etapa-4] selectComposition: start`);
        const inicioSelect = Date.now();
        const composicao = await (0, renderer_1.selectComposition)({
            serveUrl: bundleLocation,
            id: constantes_1.ID_COMPOSICAO,
            inputProps: propsVideo,
            puppeteerInstance: browserInstance,
        });
        console.log(`[job ${job.id}] [etapa-4] selectComposition: ok. ${composicao.width}x${composicao.height} @ ${composicao.fps}fps, ${composicao.durationInFrames} frames`);
        const framesDir = path_1.default.join(os_1.default.tmpdir(), `frames-${job.id}`);
        fs_1.default.mkdirSync(framesDir, { recursive: true });
        const caminhoSaida = (0, jobs_1.caminhoMp4DoJob)(job.id);
        // ===== ETAPA 5: renderFrames =====
        (0, jobs_1.atualizarJob)(job.id, { etapa: "renderFrames", progresso: 25 });
        console.log(`[job ${job.id}] [etapa-5] renderFrames started: ${composicao.durationInFrames} frames`);
        const inicioFrames = Date.now();
        let memPicoRss = process.memoryUsage().rss;
        const renderFramesOutput = await (0, renderer_1.renderFrames)({
            composition: composicao,
            serveUrl: bundleLocation,
            inputProps: propsVideo,
            outputDir: framesDir,
            imageFormat: "jpeg",
            jpegQuality: 70,
            concurrency: 1,
            everyNthFrame: 1,
            puppeteerInstance: browserInstance,
            onStart: ({ frameCount }) => {
                console.log(`[job ${job.id}] [etapa-5] onStart: ${frameCount} frames`);
            },
            onFrameUpdate: (framesRenderizados, _frameIndex, timeMs) => {
                const mem = process.memoryUsage();
                if (mem.rss > memPicoRss)
                    memPicoRss = mem.rss;
                // Mapeia progresso de frames pra 25-85% do progresso total
                const pctFrames = framesRenderizados / composicao.durationInFrames;
                const progresso = Math.round(25 + pctFrames * 60);
                (0, jobs_1.atualizarJob)(job.id, { progresso });
                if (framesRenderizados <= 5 || framesRenderizados % 10 === 0 || framesRenderizados === composicao.durationInFrames) {
                    console.log(`[job ${job.id}] [etapa-5] render progress: ${framesRenderizados}/${composicao.durationInFrames} (${Math.round(pctFrames * 100)}%) | frame=${timeMs}ms | rss=${(mem.rss / 1024 / 1024).toFixed(0)}MB pico=${(memPicoRss / 1024 / 1024).toFixed(0)}MB`);
                }
            },
        });
        console.log(`[job ${job.id}] [etapa-5] render finished em ${Date.now() - inicioFrames}ms (${renderFramesOutput.frameCount} frames, pico=${(memPicoRss / 1024 / 1024).toFixed(0)}MB)`);
        // ===== ETAPA 6: closeBrowser =====
        (0, jobs_1.atualizarJob)(job.id, { etapa: "closeBrowser", progresso: 87 });
        console.log(`[job ${job.id}] [etapa-6] closeBrowser`);
        try {
            await browserInstance.close({ silent: true });
        }
        catch (e) {
            console.warn(`[job ${job.id}] [etapa-6] closeBrowser warning:`, e instanceof Error ? e.message : e);
        }
        // ===== ETAPA 7: stitchFramesToVideo =====
        (0, jobs_1.atualizarJob)(job.id, { etapa: "stitchFramesToVideo", progresso: 90 });
        console.log(`[job ${job.id}] [etapa-7] stitchFramesToVideo: start`);
        const inicioStitch = Date.now();
        await (0, renderer_1.stitchFramesToVideo)({
            fps: composicao.fps,
            height: composicao.height,
            width: composicao.width,
            outputLocation: caminhoSaida,
            codec: "h264",
            crf: 32,
            x264Preset: "ultrafast",
            force: true,
            assetsInfo: renderFramesOutput.assetsInfo,
        });
        console.log(`[job ${job.id}] [etapa-7] stitchFramesToVideo: ok em ${Date.now() - inicioStitch}ms`);
        // Limpa frames intermediarios
        try {
            fs_1.default.rmSync(framesDir, { recursive: true, force: true });
        }
        catch { }
        // ===== Validacao rigorosa do MP4 =====
        console.log(`[job ${job.id}] outputLocation: ${caminhoSaida}`);
        if (!fs_1.default.existsSync(caminhoSaida)) {
            throw new Error("MP4 nao foi gerado em disco apos stitch");
        }
        const stat = fs_1.default.statSync(caminhoSaida);
        console.log(`[job ${job.id}] file size bytes: ${stat.size}`);
        if (stat.size === 0) {
            try {
                fs_1.default.unlinkSync(caminhoSaida);
            }
            catch { }
            throw new Error("MP4 gerado com 0 bytes");
        }
        if (stat.size < 10000) {
            try {
                fs_1.default.unlinkSync(caminhoSaida);
            }
            catch { }
            throw new Error(`MP4 muito pequeno (${stat.size} bytes) - provavelmente corrompido`);
        }
        // Le o arquivo pra validar estrutura interna
        const buffer = fs_1.default.readFileSync(caminhoSaida);
        // Bytes 4-8 devem ser "ftyp" (tipo de arquivo MP4)
        const ftyp = buffer.slice(4, 8).toString("ascii");
        if (ftyp !== "ftyp") {
            try {
                fs_1.default.unlinkSync(caminhoSaida);
            }
            catch { }
            throw new Error(`MP4 sem assinatura "ftyp" valida (encontrei "${ftyp}") - container corrompido`);
        }
        // MP4 valido precisa ter um atom "moov" (movie metadata, sem ele o player nao sabe duracao)
        // Procura nos primeiros 100KB E nos ultimos 100KB (pode ser moov-at-end)
        const procurar = (b, needle) => b.indexOf(Buffer.from(needle, "ascii"));
        const headSize = Math.min(buffer.length, 100 * 1024);
        const tailSize = Math.min(buffer.length, 100 * 1024);
        const moovInicio = procurar(buffer.slice(0, headSize), "moov");
        const moovFim = procurar(buffer.slice(buffer.length - tailSize), "moov");
        const temMoov = moovInicio >= 0 || moovFim >= 0;
        console.log(`[job ${job.id}] MP4 valido: ${stat.size} bytes, ftyp="${ftyp}", moov=${temMoov ? "presente" : "AUSENTE"} (head=${moovInicio}, tail=${moovFim})`);
        if (!temMoov) {
            // moov ausente = video sem metadata = nao toca em nenhum player
            try {
                fs_1.default.unlinkSync(caminhoSaida);
            }
            catch { }
            throw new Error("MP4 sem atom 'moov' - FFmpeg nao finalizou o arquivo (header de metadata faltando)");
        }
        // ===== Marca como done =====
        (0, jobs_1.atualizarJob)(job.id, {
            estado: "done",
            progresso: 100,
            etapa: "concluido",
            caminhoMp4: caminhoSaida,
            tamanhoBytes: stat.size,
            terminadoEm: Date.now(),
        });
        console.log(`[job ${job.id}] CONCLUIDO em ${Date.now() - inicioTotal}ms total. ${(stat.size / 1024 / 1024).toFixed(2)}MB`);
    }
    finally {
        // Garante que o browser fecha mesmo em erro
        try {
            await browserInstance.close({ silent: true });
        }
        catch {
            // ignora
        }
    }
}
// =============================================================
// Signal handlers (SIGTERM/SIGINT)
// =============================================================
const sinalHandler = (sinal) => {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    console.error(`[SINAL] Recebido ${sinal} apos ${uptime.toFixed(1)}s de uptime`);
    console.error(`[SINAL] Memoria: rss=${(mem.rss / 1024 / 1024).toFixed(0)}MB heap=${(mem.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    console.error(`[SINAL] Jobs ativos: ${(0, jobs_1.totalJobs)()}, fila: ${(0, jobs_1.tamanhoFila)()}`);
    setTimeout(() => process.exit(0), 100);
};
process.on("SIGTERM", () => sinalHandler("SIGTERM"));
process.on("SIGINT", () => sinalHandler("SIGINT"));
process.on("uncaughtException", (err) => {
    console.error(`[UNCAUGHT_EXCEPTION]`, err.message);
    if (err.stack)
        console.error(err.stack);
});
process.on("unhandledRejection", (reason) => {
    console.error(`[UNHANDLED_REJECTION]`, reason);
});
// =============================================================
// Startup
// =============================================================
const server = app.listen(PORT, () => {
    const mem = process.memoryUsage();
    console.log(`reels-render-service ouvindo em http://0.0.0.0:${PORT}`);
    console.log(`MODO: assincrono com fila de jobs`);
    console.log(`Endpoints:`);
    console.log(`  POST /render            → cria job, retorna { jobId }`);
    console.log(`  GET  /jobs/:id/status   → estado do job`);
    console.log(`  GET  /jobs/:id/video    → MP4 quando done`);
    console.log(`  GET  /healthz           → health check`);
    console.log(`Memoria inicial: rss=${(mem.rss / 1024 / 1024).toFixed(0)}MB heap=${(mem.heapUsed / 1024 / 1024).toFixed(0)}MB`);
});
// Timeouts longos (mas agora menos criticos - render eh assincrono)
server.requestTimeout = 60 * 1000;
server.headersTimeout = 60 * 1000;
server.keepAliveTimeout = 30 * 1000;
//# sourceMappingURL=server.js.map