"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GeradorVideo;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const templates_1 = require("@/lib/templates");
const vozes_1 = require("@/lib/vozes");
const preparoImagens_1 = require("@/lib/preparoImagens");
const SeletorTemplate_1 = __importDefault(require("./SeletorTemplate"));
const SeletorVoz_1 = __importDefault(require("./SeletorVoz"));
const SeletorVideoFundo_1 = __importDefault(require("./SeletorVideoFundo"));
const EditorRoteiro_1 = __importDefault(require("./EditorRoteiro"));
function GeradorVideo({ roteiro: roteiroInicial, imagens }) {
    const [roteiro, setRoteiro] = (0, react_1.useState)(roteiroInicial);
    const [estado, setEstado] = (0, react_1.useState)({ tipo: "idle" });
    const [editando, setEditando] = (0, react_1.useState)(false);
    const [comMusica, setComMusica] = (0, react_1.useState)(false);
    const [musicaDisponivel, setMusicaDisponivel] = (0, react_1.useState)(false);
    const [comVoz, setComVoz] = (0, react_1.useState)(false);
    const [vozDisponivel, setVozDisponivel] = (0, react_1.useState)(false);
    const [vozId, setVozId] = (0, react_1.useState)(vozes_1.VOZ_DEFAULT);
    const [comLegendaPPP, setComLegendaPPP] = (0, react_1.useState)(true);
    const [template, setTemplate] = (0, react_1.useState)(templates_1.TEMPLATE_DEFAULT);
    const [videoFundoUrl, setVideoFundoUrl] = (0, react_1.useState)(null);
    // Sincroniza quando o pai gera um novo roteiro
    (0, react_1.useEffect)(() => {
        setRoteiro(roteiroInicial);
    }, [roteiroInicial]);
    (0, react_1.useEffect)(() => {
        fetch("/api/tts-status")
            .then((r) => r.json())
            .then((d) => setVozDisponivel(!!d?.disponivel))
            .catch(() => setVozDisponivel(false));
        fetch("/api/musicas")
            .then((r) => r.json())
            .then((d) => setMusicaDisponivel(Array.isArray(d?.musicas) && d.musicas.length > 0))
            .catch(() => setMusicaDisponivel(false));
    }, []);
    (0, react_1.useEffect)(() => {
        return () => {
            if (estado.tipo === "concluido") {
                URL.revokeObjectURL(estado.videoUrl);
            }
        };
    }, [estado]);
    async function gerarVideo() {
        // Limpa COMPLETAMENTE qualquer estado anterior (erro, vídeo pronto, etc)
        // antes de começar nova tentativa. Evita que mensagens antigas fiquem
        // visíveis na tela durante o novo render.
        if (estado.tipo === "concluido") {
            URL.revokeObjectURL(estado.videoUrl);
        }
        setEstado({ tipo: "idle" });
        const timestampTentativa = new Date().toISOString();
        // Chama o servico de render direto, sem passar pela Vercel.
        // Vercel tem timeout de 60s -> renders longos dao 504.
        // Render.com nao tem esse limite.
        const renderServiceUrl = process.env.NEXT_PUBLIC_RENDER_SERVICE_URL;
        if (!renderServiceUrl) {
            console.error("[render] NEXT_PUBLIC_RENDER_SERVICE_URL nao configurada. Definir em Vercel > Settings > Environment Variables e fazer Redeploy.");
            setEstado({
                tipo: "erro",
                mensagem: "Servico de render nao configurado. Falta env var NEXT_PUBLIC_RENDER_SERVICE_URL no Vercel.",
                debug: {
                    endpoint: "(nao configurado)",
                    timestamp: timestampTentativa,
                },
            });
            return;
        }
        const endpoint = `${renderServiceUrl.replace(/\/+$/, "")}/render`;
        console.log("[render] usando endpoint:", endpoint);
        // alias usado pelo logging mais abaixo
        const endpointDestino = endpoint;
        try {
            setEstado({ tipo: "preparando" });
            const imagensSerializadas = await (0, preparoImagens_1.prepararImagens)(imagens);
            const duracaoVideoSegundos = roteiro.cenas.reduce((acc, c) => acc + c.duracaoSegundos, 0);
            const estimativaMs = duracaoVideoSegundos * 6000 +
                (comVoz ? roteiro.cenas.length * 3000 : 0);
            if (comVoz) {
                setEstado({
                    tipo: "gerando_voz",
                    cenaAtual: 0,
                    totalCenas: roteiro.cenas.length,
                });
                // Simula progresso de geração de voz (não temos progresso real do server)
                let cenaSimulada = 0;
                const intervalVoz = setInterval(() => {
                    cenaSimulada = Math.min(cenaSimulada + 1, roteiro.cenas.length);
                    setEstado((prev) => prev.tipo === "gerando_voz"
                        ? {
                            tipo: "gerando_voz",
                            cenaAtual: cenaSimulada,
                            totalCenas: roteiro.cenas.length,
                        }
                        : prev);
                }, 2200);
                // Após 80% do tempo estimado de voz, troca pra renderizando
                setTimeout(() => {
                    clearInterval(intervalVoz);
                    setEstado({ tipo: "renderizando", progresso: 0.05 });
                }, roteiro.cenas.length * 2400);
            }
            else {
                setTimeout(() => setEstado({ tipo: "renderizando", progresso: 0.05 }), 200);
            }
            const inicio = Date.now();
            const intervalProgresso = setInterval(() => {
                setEstado((prev) => {
                    if (prev.tipo !== "renderizando")
                        return prev;
                    const decorrido = Date.now() - inicio;
                    const p = Math.min(0.92, decorrido / estimativaMs);
                    return { tipo: "renderizando", progresso: p };
                });
            }, 400);
            const payload = {
                roteiro,
                imagens: imagensSerializadas,
                comMusica: comMusica && musicaDisponivel,
                template,
                comLegendaPalavraPalavra: comLegendaPPP,
                comVoz: comVoz && vozDisponivel,
                vozId,
                videoFundoUrl,
            };
            console.log(`[debug-render] ${timestampTentativa} POST ${endpointDestino}`, { payload: { ...payload, imagens: `${payload.imagens.length} imagens` } });
            // =================================================================
            // FASE 1: POST /render → recebe { jobId }
            // =================================================================
            const respPost = await fetch(endpointDestino, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!respPost.ok) {
                clearInterval(intervalProgresso);
                const erroTexto = await respPost.text();
                let mensagem = `HTTP ${respPost.status} ${respPost.statusText}`;
                try {
                    const erroJson = JSON.parse(erroTexto);
                    if (erroJson?.erro)
                        mensagem = erroJson.erro;
                    else if (erroJson?.error)
                        mensagem = erroJson.error;
                    else if (erroJson?.message)
                        mensagem = erroJson.message;
                }
                catch {
                    if (erroTexto && erroTexto.length < 500)
                        mensagem = erroTexto;
                }
                console.error(`[debug-render] erro POST /render:`, erroTexto);
                throw new Error(mensagem);
            }
            const { jobId } = (await respPost.json());
            if (!jobId) {
                clearInterval(intervalProgresso);
                throw new Error("Resposta sem jobId");
            }
            console.log(`[debug-render] jobId recebido: ${jobId}`);
            // Para a barra falsa - vamos usar progresso real do servidor
            clearInterval(intervalProgresso);
            // =================================================================
            // FASE 2: polling em /jobs/:id/status a cada 2s, ate done/error
            // =================================================================
            const TIMEOUT_TOTAL_MS = 15 * 60 * 1000; // 15min: cobre cold start + render
            const INTERVALO_POLLING_MS = 2000;
            const inicioPolling = Date.now();
            const statusUrl = `${endpointDestino.replace(/\/render$/, "")}/jobs/${jobId}/status`;
            const videoUrl = `${endpointDestino.replace(/\/render$/, "")}/jobs/${jobId}/video`;
            let estadoJob = "pending";
            let mensagemErro = "";
            let progressoJob = 0;
            while (Date.now() - inicioPolling < TIMEOUT_TOTAL_MS) {
                await new Promise((r) => setTimeout(r, INTERVALO_POLLING_MS));
                let dataStatus;
                try {
                    const respStatus = await fetch(statusUrl);
                    if (!respStatus.ok) {
                        console.warn(`[debug-render] status HTTP ${respStatus.status} - tentando de novo`);
                        continue;
                    }
                    dataStatus = await respStatus.json();
                }
                catch (e) {
                    console.warn(`[debug-render] erro de rede no polling, tentando de novo:`, e);
                    continue;
                }
                estadoJob = dataStatus.estado;
                progressoJob = (dataStatus.progresso ?? 0) / 100;
                // Atualiza barra com progresso real
                setEstado({
                    tipo: "renderizando",
                    progresso: Math.min(0.99, progressoJob),
                });
                console.log(`[debug-render] poll: estado=${estadoJob} progresso=${dataStatus.progresso}% etapa=${dataStatus.etapa}`);
                if (estadoJob === "done")
                    break;
                if (estadoJob === "error") {
                    mensagemErro = dataStatus.erro || "Render falhou";
                    break;
                }
            }
            if (estadoJob === "error")
                throw new Error(mensagemErro);
            if (estadoJob !== "done") {
                throw new Error("Render demorou mais que 15 minutos - tente de novo");
            }
            // =================================================================
            // FASE 3: baixar o MP4
            // =================================================================
            console.log(`[debug-render] baixando MP4 de ${videoUrl}`);
            const respVideo = await fetch(videoUrl);
            if (!respVideo.ok) {
                throw new Error(`Falha ao baixar MP4: HTTP ${respVideo.status}`);
            }
            const blob = await respVideo.blob();
            const url = URL.createObjectURL(blob);
            console.log(`[debug-render] MP4 baixado, tamanho=${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            setEstado({ tipo: "concluido", videoUrl: url });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : "Erro desconhecido";
            console.error(`[debug-render] ERRO em ${timestampTentativa}:`, msg);
            setEstado({
                tipo: "erro",
                mensagem: msg,
                debug: {
                    endpoint: endpointDestino,
                    timestamp: timestampTentativa,
                },
            });
        }
    }
    function baixar() {
        if (estado.tipo !== "concluido")
            return;
        const a = document.createElement("a");
        a.href = estado.videoUrl;
        a.download = `reel-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    // ===== Modo editor =====
    if (editando) {
        return ((0, jsx_runtime_1.jsx)(EditorRoteiro_1.default, { roteiroInicial: roteiro, onConfirmar: (r) => {
                setRoteiro(r);
                setEditando(false);
            }, onCancelar: () => setEditando(false) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-sm", children: "\uD83C\uDFA5" }), (0, jsx_runtime_1.jsx)("h3", { className: "font-bold text-white", children: "Gerar V\u00EDdeo MP4" })] }), estado.tipo === "idle" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setEditando(true), className: "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm bg-zinc-800 border border-zinc-700 text-amber-400 active:scale-[0.98]", children: "\u270F\uFE0F Editar roteiro antes de gerar" }), (0, jsx_runtime_1.jsx)(SeletorTemplate_1.default, { valor: template, onChange: setTemplate }), (0, jsx_runtime_1.jsx)(SeletorVideoFundo_1.default, { valor: videoFundoUrl, onChange: setVideoFundoUrl }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-3 p-3 bg-zinc-800 rounded-xl cursor-pointer active:scale-[0.98]", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: comLegendaPPP, onChange: (e) => setComLegendaPPP(e.target.checked), className: "w-5 h-5 accent-fuchsia-500 shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-semibold text-white", children: "\uD83D\uDCDD Legenda palavra-por-palavra" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400", children: comVoz && vozDisponivel
                                            ? "✨ Sincronização perfeita com a voz"
                                            : "Estilo TikTok, palavras animadas" })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: `flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${musicaDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: comMusica && musicaDisponivel, disabled: !musicaDisponivel, onChange: (e) => setComMusica(e.target.checked), className: "w-5 h-5 accent-fuchsia-500 shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-semibold text-white", children: "\uD83C\uDFB5 M\u00FAsica de fundo" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400", children: musicaDisponivel
                                            ? comVoz
                                                ? "Fade in/out + ducking automático quando voz toca"
                                                : "Detectada em /public/audio/ com fade in/out"
                                            : "Adicione um MP3 em /public/audio/ pra ativar" })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: `flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${vozDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: comVoz && vozDisponivel, disabled: !vozDisponivel, onChange: (e) => setComVoz(e.target.checked), className: "w-5 h-5 accent-fuchsia-500 shrink-0" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-semibold text-white", children: "\uD83C\uDF99\uFE0F Voz IA (ElevenLabs)" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400", children: vozDisponivel
                                            ? "Narração PT-BR + sincronização perfeita + cache local"
                                            : "Configure ELEVENLABS_API_KEY no .env.local" })] })] }), comVoz && vozDisponivel && ((0, jsx_runtime_1.jsx)(SeletorVoz_1.default, { valor: vozId, onChange: setVozId })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: gerarVideo, className: "w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 active:scale-95", children: "\uD83C\uDFAC Gerar V\u00EDdeo MP4" })] })), estado.tipo === "preparando" && ((0, jsx_runtime_1.jsx)(LoadingPremium, { texto: "Preparando imagens...", emoji: "\uD83D\uDDBC\uFE0F" })), estado.tipo === "gerando_voz" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3", children: (0, jsx_runtime_1.jsx)("span", { className: "text-3xl animate-pulse", children: "\uD83C\uDF99\uFE0F" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-white", children: "Gerando narra\u00E7\u00E3o com IA..." }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-zinc-500 mt-1", children: ["Cena ", estado.cenaAtual + 1, " de ", estado.totalCenas] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full h-2 bg-zinc-800 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-500", style: {
                                width: `${((estado.cenaAtual + 1) / estado.totalCenas) * 100}%`,
                            } }) })] })), estado.tipo === "renderizando" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-zinc-300 font-semibold flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-block animate-spin", children: "\u2699\uFE0F" }), "Renderizando v\u00EDdeo..."] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-fuchsia-400 font-bold", children: [Math.round(estado.progresso * 100), "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-300 ease-out relative overflow-hidden", style: { width: `${estado.progresso * 100}%` }, children: (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" }) }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 text-center", children: "Isso pode demorar 30-90 segundos. N\u00E3o feche a aba." })] })), estado.tipo === "concluido" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-black rounded-2xl overflow-hidden", children: (0, jsx_runtime_1.jsx)("video", { src: estado.videoUrl, controls: true, playsInline: true, className: "w-full aspect-[9/16] object-contain" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: baixar, className: "w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95", children: "\u2B07\uFE0F Baixar MP4" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setEstado({ tipo: "idle" }), className: "w-full py-3 rounded-2xl font-bold text-sm bg-zinc-800 text-white active:scale-95", children: "\uD83D\uDD04 Gerar novamente" })] })), estado.tipo === "erro" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-3", children: ["\u274C ", estado.mensagem] }), estado.debug && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-[10px] rounded-2xl p-3 font-mono leading-relaxed", children: [(0, jsx_runtime_1.jsx)("div", { children: "\uD83D\uDD0D debug" }), (0, jsx_runtime_1.jsxs)("div", { children: ["endpoint: ", estado.debug.endpoint] }), (0, jsx_runtime_1.jsxs)("div", { children: ["timestamp: ", estado.debug.timestamp] })] })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                            // Limpa COMPLETAMENTE o estado antes do retry.
                            // Próximo gerarVideo() vai começar do zero,
                            // sem mensagem antiga visível.
                            setEstado({ tipo: "idle" });
                            // Dispara nova tentativa
                            gerarVideo();
                        }, className: "w-full py-3 rounded-2xl font-bold bg-zinc-800 text-white active:scale-95", children: "Tentar de novo" })] }))] }));
}
function LoadingPremium({ texto, emoji, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3", children: (0, jsx_runtime_1.jsx)("span", { className: "text-3xl animate-pulse", children: emoji }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-white", children: texto })] }));
}
//# sourceMappingURL=GeradorVideo.js.map