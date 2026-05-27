"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarRoteiro = gerarRoteiro;
function gerarRoteiro(params) {
    const { assunto, estilo, duracao, quantidadeImagens } = params;
    // Define quantidade de cenas baseado na duração
    // 15s = 4 cenas (~3,75s cada)
    // 20s = 5 cenas (~4s cada)
    const totalCenas = duracao === 15 ? 4 : 5;
    const duracaoPorCena = duracao / totalCenas;
    const templates = TEMPLATES_POR_ESTILO[estilo];
    // Pega template aleatório dentro do estilo escolhido
    const template = templates[Math.floor(Math.random() * templates.length)];
    const cenas = [];
    for (let i = 0; i < totalCenas; i++) {
        const cenaTemplate = template.cenas[i] ?? template.cenas[template.cenas.length - 1];
        cenas.push({
            numero: i + 1,
            textoTela: substituirVariaveis(cenaTemplate.textoTela, assunto),
            narracao: substituirVariaveis(cenaTemplate.narracao, assunto),
            duracaoSegundos: Number(duracaoPorCena.toFixed(2)),
        });
    }
    return {
        capa: substituirVariaveis(template.capa, assunto),
        cenas,
        ctaFinal: substituirVariaveis(template.ctaFinal, assunto),
        legendaPost: substituirVariaveis(template.legenda, assunto),
        hashtags: template.hashtags,
    };
}
function substituirVariaveis(texto, assunto) {
    return texto.replace(/\{assunto\}/g, assunto.trim());
}
const TEMPLATES_POR_ESTILO = {
    venda: [
        {
            capa: "VOCÊ PRECISA VER ISSO 👇",
            cenas: [
                {
                    textoTela: "Ninguém te conta isso sobre {assunto}",
                    narracao: "Existe uma forma muito mais simples de resolver isso.",
                },
                {
                    textoTela: "O segredo está aqui ✨",
                    narracao: "E hoje eu vou te mostrar exatamente como funciona.",
                },
                {
                    textoTela: "Resultado em poucos dias 🔥",
                    narracao: "Pessoas comuns já estão tendo resultados incríveis.",
                },
                {
                    textoTela: "Funciona pra qualquer pessoa",
                    narracao: "Não importa sua idade ou experiência.",
                },
                {
                    textoTela: "Garante o seu agora 👇",
                    narracao: "Link na bio, vagas limitadas.",
                },
            ],
            ctaFinal: "👉 LINK NA BIO",
            legenda: "Salva esse vídeo pra não esquecer 📌\n\nSe você quer {assunto} sem complicação, o link tá na bio.\n\nMarca um amigo que precisa ver isso 👇",
            hashtags: ["#dicas", "#aprender", "#reels", "#viral", "#fyp"],
        },
    ],
    demonstracao: [
        {
            capa: "OLHA SÓ COMO FUNCIONA 👀",
            cenas: [
                {
                    textoTela: "Passo 1: comece por aqui",
                    narracao: "Primeiro, você precisa fazer isso aqui.",
                },
                {
                    textoTela: "Passo 2: agora é assim",
                    narracao: "Depois disso, o próximo passo é simples.",
                },
                {
                    textoTela: "Passo 3: o pulo do gato 🐱",
                    narracao: "E esse é o detalhe que muita gente esquece.",
                },
                {
                    textoTela: "Pronto! Resultado final ✅",
                    narracao: "E é exatamente assim que você consegue {assunto}.",
                },
                {
                    textoTela: "Salva esse vídeo 📌",
                    narracao: "Salva pra não esquecer de aplicar.",
                },
            ],
            ctaFinal: "📌 SALVA PRA APLICAR DEPOIS",
            legenda: "Passo a passo de {assunto} 👆\n\nSalva esse vídeo pra fazer com calma depois.\n\nComenta aqui se você já tentou 👇",
            hashtags: ["#tutorial", "#passoapasso", "#aprender", "#dicas", "#reels"],
        },
    ],
    dor: [
        {
            capa: "ISSO É MAIS COMUM DO QUE PARECE 😔",
            cenas: [
                {
                    textoTela: "Você sente isso também?",
                    narracao: "Aquela sensação de que nada funciona com {assunto}.",
                },
                {
                    textoTela: "Você não está sozinho 💔",
                    narracao: "Milhares de pessoas passam pelo mesmo problema.",
                },
                {
                    textoTela: "Mas existe uma saída ✨",
                    narracao: "E ela é mais simples do que parece.",
                },
                {
                    textoTela: "O primeiro passo é esse 👇",
                    narracao: "Comece reconhecendo que dá pra mudar.",
                },
                {
                    textoTela: "Hora de virar essa página 🔥",
                    narracao: "Você merece um resultado diferente.",
                },
            ],
            ctaFinal: "👇 SEGUE PRA MAIS DICAS",
            legenda: "Se você se identificou com esse vídeo, comenta aqui 💬\n\nNão é frescura, é real.\n\nVamos resolver isso juntos 🙏",
            hashtags: ["#realidade", "#vidareal", "#dicas", "#reels", "#fyp"],
        },
    ],
    curiosidade: [
        {
            capa: "VOCÊ SABIA DISSO? 🤯",
            cenas: [
                {
                    textoTela: "Quase ninguém sabe disso 🤫",
                    narracao: "Tem uma curiosidade sobre {assunto} que vai te surpreender.",
                },
                {
                    textoTela: "Espera só pra ver 👀",
                    narracao: "Você nunca mais vai ver isso da mesma forma.",
                },
                {
                    textoTela: "Olha que loucura 🤯",
                    narracao: "Foi por isso que tudo mudou.",
                },
                {
                    textoTela: "Você acreditaria nisso?",
                    narracao: "E o melhor é que você pode testar agora mesmo.",
                },
                {
                    textoTela: "Comenta o que achou 👇",
                    narracao: "Conta aqui se você já sabia disso.",
                },
            ],
            ctaFinal: "💬 COMENTA O QUE ACHOU",
            legenda: "Você já tinha ouvido falar disso? 🤔\n\nMe conta nos comentários!\n\nSe te surpreendeu, manda pra alguém 👇",
            hashtags: ["#curiosidades", "#vocesabia", "#fatos", "#reels", "#fyp"],
        },
    ],
    prova_social: [
        {
            capa: "OLHA O RESULTADO ✨",
            cenas: [
                {
                    textoTela: "Antes era assim 😬",
                    narracao: "Eu também já estive nesse ponto com {assunto}.",
                },
                {
                    textoTela: "Depois de aplicar... 🚀",
                    narracao: "Em poucas semanas tudo começou a mudar.",
                },
                {
                    textoTela: "Hoje o resultado é esse 🔥",
                    narracao: "E o melhor é que qualquer pessoa consegue.",
                },
                {
                    textoTela: "Não foi sorte. Foi método.",
                    narracao: "Foi seguindo um passo a passo simples.",
                },
                {
                    textoTela: "Sua vez é agora 👇",
                    narracao: "Bora começar essa transformação.",
                },
            ],
            ctaFinal: "🔥 SEGUE PRA TRANSFORMAR",
            legenda: "Resultado real 💯\n\nNão tem milagre, tem consistência.\n\nSegue aqui que toda semana eu mostro mais 👇",
            hashtags: ["#transformacao", "#resultado", "#antesedepois", "#reels", "#fyp"],
        },
    ],
};
//# sourceMappingURL=geradorRoteiro.js.map