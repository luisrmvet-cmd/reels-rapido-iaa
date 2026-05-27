"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GeradorVideo;
const react_1 = require("react");
const templates_1 = require("@/lib/templates");
const vozes_1 = require("@/lib/vozes");
const preparoImagens_1 = require("@/lib/preparoImagens");
const SeletorTemplate_1 = __importDefault(require("./SeletorTemplate"));
const SeletorVideoFundo_1 = __importDefault(require("./SeletorVideoFundo"));
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
            const resp = await fetch(endpointDestino, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            clearInterval(intervalProgresso);
            console.log(`[debug-render] resposta status=${resp.status} content-type=${resp.headers.get("content-type")}`);
            if (!resp.ok) {
                // Le como texto primeiro pra nao perder a mensagem caso nao seja JSON
                const erroTexto = await resp.text();
                let mensagem = `HTTP ${resp.status} ${resp.statusText}`;
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
                    // nao era JSON - usa o texto direto se for legivel
                    if (erroTexto && erroTexto.length < 500) {
                        mensagem = erroTexto;
                    }
                }
                console.error(`[debug-render] erro upstream:`, erroTexto);
                throw new Error(mensagem);
            }
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            console.log(`[debug-render] MP4 recebido, tamanho=${(blob.size / 1024 / 1024).toFixed(2)}MB`);
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
        return roteiroInicial = { roteiro };
        onConfirmar = {}(r);
        {
            setRoteiro(r);
            setEditando(false);
        }
    }
    onCancelar = {}();
    setEditando(false);
}
/>;
;
return className = "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4" >
    className;
"flex items-center gap-2" >
    className;
"w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-sm" >
;
/div>
    < h3;
className = "font-bold text-white" > Gerar;
Vídeo;
MP4 < /h3>
    < /div>;
{
    estado.tipo === "idle" && ({ /* Botão editar roteiro */}
        < button);
    type = "button";
    onClick = {}();
    setEditando(true);
}
className = "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm bg-zinc-800 border border-zinc-700 text-amber-400 active:scale-[0.98]"
    >
;
Editar;
roteiro;
antes;
de;
gerar
    < /button>
    < SeletorTemplate_1.default;
valor = { template };
onChange = { setTemplate } /  >
    { /* Vídeo de fundo (B-roll) — sub-etapa 8.1.A */}
    < SeletorVideoFundo_1.default;
valor = { videoFundoUrl };
onChange = { setVideoFundoUrl }
    /  >
    { /* Legenda PPP */}
    < label;
className = "flex items-center gap-3 p-3 bg-zinc-800 rounded-xl cursor-pointer active:scale-[0.98]" >
    type;
"checkbox";
checked = { comLegendaPPP };
onChange = {}(e);
setComLegendaPPP(e.target.checked);
className = "w-5 h-5 accent-fuchsia-500 shrink-0"
    /  >
    className;
"flex-1" >
    className;
"text-sm font-semibold text-white" >
;
Legenda;
palavra - por - palavra
    < /div>
    < div;
className = "text-xs text-zinc-400" >
    { comVoz } && vozDisponivel
    ? "✨ Sincronização perfeita com a voz"
    : "Estilo TikTok, palavras animadas";
/div>
    < /div>
    < /label>;
{ /* Música */ }
className;
{
    `flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${musicaDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"}`;
}
    >
        type;
"checkbox";
checked = { comMusica } && musicaDisponivel;
disabled = {};
musicaDisponivel;
onChange = {}(e);
setComMusica(e.target.checked);
className = "w-5 h-5 accent-fuchsia-500 shrink-0"
    /  >
    className;
"flex-1" >
    className;
"text-sm font-semibold text-white" >
;
Música;
de;
fundo
    < /div>
    < div;
className = "text-xs text-zinc-400" >
    { musicaDisponivel, comVoz, "Fade in/out + ducking automático quando voz toca": "Detectada em /public/audio/ com fade in/out",
        "Adicione um MP3 em /public/audio/ pra ativar":  }
    < /div>
    < /div>
    < /label>;
{ /* Voz IA */ }
className;
{
    `flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${vozDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"}`;
}
    >
        type;
"checkbox";
checked = { comVoz } && vozDisponivel;
disabled = {};
vozDisponivel;
onChange = {}(e);
setComVoz(e.target.checked);
className = "w-5 h-5 accent-fuchsia-500 shrink-0"
    /  >
    className;
"flex-1" >
    className;
"text-sm font-semibold text-white" >
;
Voz;
IA(ElevenLabs)
    < /div>
    < div;
className = "text-xs text-zinc-400" >
    { vozDisponivel, "Narração PT-BR + sincronização perfeita + cache local": "Configure ELEVENLABS_API_KEY no .env.local" }
    < /div>
    < /div>
    < /label>;
{ /* Seletor de voz (só se ativada) */ }
{
    comVoz && vozDisponivel && valor;
    {
        vozId;
    }
    onChange = { setVozId } /  >
    ;
}
type;
"button";
onClick = { gerarVideo };
className = "w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 active:scale-95"
    >
;
Gerar;
Vídeo;
MP4
    < /button>
    < />;
{
    estado.tipo === "preparando" && texto;
    "Preparando imagens...";
    emoji = "🖼️" /  >
    ;
}
{
    estado.tipo === "gerando_voz" && className;
    "space-y-3 py-3" >
        className;
    "text-center" >
        className;
    "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3" >
        className;
    "text-3xl animate-pulse" > ;
    /span>
        < /div>
        < p;
    className = "text-sm font-semibold text-white" >
        Gerando;
    narração;
    com;
    IA;
    /p>
        < p;
    className = "text-xs text-zinc-500 mt-1" >
        Cena;
    {
        estado.cenaAtual + 1;
    }
    de;
    {
        estado.totalCenas;
    }
    /p>
        < /div>
        < div;
    className = "w-full h-2 bg-zinc-800 rounded-full overflow-hidden" >
        className;
    "h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-500";
    style = {};
    {
        width: `${((estado.cenaAtual + 1) / estado.totalCenas) * 100}%`,
        ;
    }
}
/>
    < /div>
    < /div>;
{
    estado.tipo === "renderizando" && className;
    "space-y-3 py-3" >
        className;
    "flex items-center justify-between text-sm" >
        className;
    "text-zinc-300 font-semibold flex items-center gap-2" >
        className;
    "inline-block animate-spin" > ;
    /span>;
    Renderizando;
    vídeo;
    /span>
        < span;
    className = "text-fuchsia-400 font-bold" >
        { Math, : .round(estado.progresso * 100) } %
            /span>
        < /div>
        < div;
    className = "w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative" >
        className;
    "h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-300 ease-out relative overflow-hidden";
    style = {};
    {
        width: `${estado.progresso * 100}%`;
    }
}
    >
        className;
"absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" /  >
    /div>
    < /div>
    < p;
className = "text-xs text-zinc-500 text-center" >
    Isso;
pode;
demorar;
30 - 90;
segundos.Não;
feche;
a;
aba.
    < /p>
    < /div>;
{
    estado.tipo === "concluido" && className;
    "space-y-3" >
        className;
    "bg-black rounded-2xl overflow-hidden" >
        src;
    {
        estado.videoUrl;
    }
    controls;
    playsInline;
    className = "w-full aspect-[9/16] object-contain"
        /  >
        /div>
        < button;
    type = "button";
    onClick = { baixar };
    className = "w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95"
        >
    ;
    Baixar;
    MP4
        < /button>
        < button;
    type = "button";
    onClick = {}();
    setEstado({ tipo: "idle" });
}
className = "w-full py-3 rounded-2xl font-bold text-sm bg-zinc-800 text-white active:scale-95"
    >
;
Gerar;
novamente
    < /button>
    < /div>;
{
    estado.tipo === "erro" && className;
    "space-y-3" >
        className;
    "bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-3" >
    ;
    {
        estado.mensagem;
    }
    /div>;
    { /* Bloco de debug temporário - mostra:
        - endpoint chamado (deve ser https://reels-render-service.onrender.com/render)
        - timestamp da tentativa (confirma que é nova, não cache antigo)
    */
    }
    {
        estado.debug && className;
        "bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-[10px] rounded-2xl p-3 font-mono leading-relaxed" >
        ;
        debug < /div>
            < div > endpoint;
        {
            estado.debug.endpoint;
        }
        /div>
            < div > timestamp;
        {
            estado.debug.timestamp;
        }
        /div>
            < /div>;
    }
    type;
    "button";
    onClick = {}();
    {
        // Limpa COMPLETAMENTE o estado antes do retry.
        // Próximo gerarVideo() vai começar do zero,
        // sem mensagem antiga visível.
        setEstado({ tipo: "idle" });
        // Dispara nova tentativa
        gerarVideo();
    }
}
className = "w-full py-3 rounded-2xl font-bold bg-zinc-800 text-white active:scale-95"
    >
        Tentar;
de;
novo
    < /button>
    < /div>;
/div>;
;
function LoadingPremium({ texto, emoji, }) {
    return className = "text-center py-8" >
        className;
    "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3" >
        className;
    "text-3xl animate-pulse" > { emoji } < /span>
        < /div>
        < p;
    className = "text-sm font-semibold text-white" > { texto } < /p>
        < /div>;
    ;
}
//# sourceMappingURL=route.js.map