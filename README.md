# 🎬 Reels Rápido IA — Etapa 6

Gerador de roteiros e vídeos verticais para Reels e TikTok.
Mobile-first, PWA, Next.js + Remotion + ElevenLabs.

## 🎯 Novidades da Etapa 6

- ✅ **Timestamps reais por palavra** — sincronização PERFEITA legenda × voz
- ✅ **6 vozes premade** (3 femininas + 3 masculinas) com perfis distintos
- ✅ **Editor manual do roteiro** antes de gerar voz
- ✅ **Cache de TTS** — não regera voz pra texto idêntico (economiza créditos)
- ✅ **Ducking automático** — música abaixa quando voz toca
- ✅ **Fade in/out na narração** (8 frames cada lado)

## 🚀 Como rodar

```bash
npm install
npm run dev
```

## 🎙️ Ativar Voz IA

1. Copie `.env.example` → `.env.local`
2. Pegue API key grátis em https://elevenlabs.io
3. Cole em `ELEVENLABS_API_KEY=...`
4. Reinicie `npm run dev`

**Free tier:** 10k chars/mês. Com **cache local**, você regera o mesmo
texto várias vezes sem queimar créditos.

### Vozes disponíveis

| Voz | Gênero | Personalidade |
|---|---|---|
| Matilda 🌟 | Feminina | Calorosa, conversacional |
| Sarah 👩‍💼 | Feminina | Profissional, clara |
| Rachel 🎧 | Feminina | Calma, narração |
| Adam 🎙️ | Masculina | Grave, autoritária |
| Antoni 🎬 | Masculina | Versátil, comercial |
| Josh 🔥 | Masculina | Jovem, energética |

> ℹ️ Todas usam o modelo `eleven_multilingual_v2` em PT-BR.
> Funcionam bem mas com **leve sotaque** (não nativo BR).
> Pra vozes nativas brasileiras, é necessário plano **Creator+** do ElevenLabs.

## 🎵 Música de Fundo

1. Baixe MP3 royalty-free em https://pixabay.com/music/
2. Coloque em `public/audio/` (qualquer nome)
3. App detecta sozinho
4. Volume: 25% normal → **8% durante narração** (ducking)
5. Fade in/out 1 segundo

## 🔄 Cache de Voz

O cache fica em `<tmp>/reels-rapido-ia-tts-cache/`.
Indexado por hash de `(texto + voice_id + settings)`.
- **Hit:** voz é reusada (instantâneo, 0 créditos)
- **Miss:** chama ElevenLabs, grava no cache
- Sumiço: reinicia o servidor (cache é em `/tmp`)

## 📝 Editor de Roteiro

Botão "✏️ Editar roteiro" na tela de geração. Permite:
- Editar capa
- Editar texto na tela de cada cena
- Editar **narração** de cada cena (o que a voz vai falar)
- Editar CTA final
- Ver total de caracteres antes de gerar

## 🏗️ Estrutura

```
src/
├── app/api/
│   ├── render/        # gera MP4
│   ├── tts-status/    # checa ElevenLabs
│   └── musicas/       # lista MP3s
├── components/
│   ├── video/         # AnimatedText, LegendaPalavraAPalavra
│   ├── EditorRoteiro.tsx
│   ├── SeletorTemplate.tsx
│   ├── SeletorVoz.tsx
│   └── ...
├── lib/
│   ├── templates.ts   # 5 presets visuais
│   ├── vozes.ts       # catálogo de 6 vozes
│   └── tts.ts         # provider ElevenLabs + cache + timestamps
└── remotion/          # composição 1080x1920
```
