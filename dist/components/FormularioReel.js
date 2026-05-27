"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormularioReel;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const SeletorDuracao_1 = __importDefault(require("./SeletorDuracao"));
const SeletorEstilo_1 = __importDefault(require("./SeletorEstilo"));
const UploadImagens_1 = __importDefault(require("./UploadImagens"));
const PreviewRoteiro_1 = __importDefault(require("./PreviewRoteiro"));
const geradorRoteiro_1 = require("@/lib/geradorRoteiro");
const MIN_IMAGENS = 3;
const MAX_IMAGENS = 5;
function FormularioReel() {
    const [assunto, setAssunto] = (0, react_1.useState)("");
    const [duracao, setDuracao] = (0, react_1.useState)(5);
    const [estilo, setEstilo] = (0, react_1.useState)("venda");
    const [imagens, setImagens] = (0, react_1.useState)([]);
    const [roteiro, setRoteiro] = (0, react_1.useState)(null);
    const [erro, setErro] = (0, react_1.useState)(null);
    const podeGerar = assunto.trim().length >= 5 && imagens.length >= MIN_IMAGENS;
    function gerar() {
        setErro(null);
        if (assunto.trim().length < 5) {
            setErro("Conte um pouco mais sobre o vídeo (mínimo 5 caracteres).");
            return;
        }
        if (imagens.length < MIN_IMAGENS) {
            setErro(`Adicione pelo menos ${MIN_IMAGENS} imagens.`);
            return;
        }
        const novoRoteiro = (0, geradorRoteiro_1.gerarRoteiro)({
            assunto,
            estilo,
            duracao,
            quantidadeImagens: imagens.length,
        });
        setRoteiro(novoRoteiro);
        // rolar pro topo no celular
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }
    function voltarParaFormulario() {
        setRoteiro(null);
    }
    // Se tem roteiro, mostra preview
    if (roteiro) {
        return ((0, jsx_runtime_1.jsx)(PreviewRoteiro_1.default, { roteiro: roteiro, imagens: imagens, onVoltar: voltarParaFormulario, onRegerar: gerar }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "assunto", className: "block text-sm font-semibold text-zinc-300 mb-2", children: "Sobre o que \u00E9 o v\u00EDdeo?" }), (0, jsx_runtime_1.jsx)("textarea", { id: "assunto", value: assunto, onChange: (e) => setAssunto(e.target.value), placeholder: "Ex: meu curso de ingl\u00EAs em 30 dias", rows: 3, className: "w-full px-4 py-3 rounded-2xl bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500 text-base" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 text-xs text-zinc-500 text-right", children: [assunto.length, " caracteres"] })] }), (0, jsx_runtime_1.jsx)(SeletorDuracao_1.default, { valor: duracao, onChange: setDuracao }), (0, jsx_runtime_1.jsx)(SeletorEstilo_1.default, { valor: estilo, onChange: setEstilo }), (0, jsx_runtime_1.jsx)(UploadImagens_1.default, { imagens: imagens, onChange: setImagens, min: MIN_IMAGENS, max: MAX_IMAGENS }), erro && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-3", children: erro })), (0, jsx_runtime_1.jsx)("div", { className: "sticky bottom-4 pt-2", children: (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: gerar, disabled: !podeGerar, className: `
            w-full py-5 rounded-2xl font-extrabold text-lg transition-all
            ${podeGerar
                        ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/40 active:scale-95"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}
          `, children: "\u2728 Gerar Roteiro" }) })] }));
}
//# sourceMappingURL=FormularioReel.js.map