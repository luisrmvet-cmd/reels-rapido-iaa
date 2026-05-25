# 📹 Vídeos de Fundo

Esta pasta contém os vídeos de fundo (B-roll) usados como background nos Reels.

## Como funciona — categorias automáticas

Qualquer **subpasta** aqui vira automaticamente uma **categoria** na UI.
Exemplo: crie a pasta `pet/` e ela aparece como categoria "pet" no app.

```
public/videos/
├── .gitkeep
├── pet/
│   ├── cachorro-correndo.mp4
│   └── gato-brincando.mp4
├── lifestyle/
│   ├── cafe-manha.mp4
│   └── caminhada.mp4
└── tech/
    └── teclado-digitando.mp4
```

## Formatos aceitos

- `.mp4` (recomendado, H.264)
- `.webm`
- `.mov`

## Dicas importantes

### Tamanho
Vídeos curtos e pequenos:
- Resolução: 1080x1920 vertical (ou 1920x1080 horizontal, será cropado)
- Duração: 5-30s (vai ficar em loop se for menor que o reel)
- Peso: < 5MB por vídeo (idealmente < 2MB)

### Vercel: ATENÇÃO
Arquivos nesta pasta são **bundled na imagem da Vercel** (limite 250MB total).
Se você tiver muitos vídeos, mova para uma CDN:
- Cloudinary (free tier generoso)
- Bunny.net
- Supabase Storage
- AWS S3

Quando mover pra CDN, atualize o `next.config.js` com o domínio nos `remotePatterns`.

### Royalty-free
Sempre use vídeos com licença livre. Fontes:
- https://pixabay.com/videos/
- https://www.pexels.com/videos/
- https://coverr.co/
