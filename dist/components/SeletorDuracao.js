"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SeletorDuracao;
const jsx_runtime_1 = require("react/jsx-runtime");
function SeletorDuracao({ valor, onChange }) {
    const opcoes = [5, 15, 20];
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-semibold text-zinc-300 mb-2", children: "Dura\u00E7\u00E3o do v\u00EDdeo" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-3", children: opcoes.map((opcao) => {
                    const ativo = valor === opcao;
                    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => onChange(opcao), className: `
                py-4 rounded-2xl font-bold text-lg transition-all
                ${ativo
                            ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 scale-[1.02]"
                            : "bg-zinc-800 text-zinc-400 active:scale-95"}
              `, children: [opcao, "s"] }, opcao));
                }) })] }));
}
//# sourceMappingURL=SeletorDuracao.js.map