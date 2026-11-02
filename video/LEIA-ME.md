# Planos 3D do relevo (vídeo IPR)

Página `web/filme.html`: MapLibre GL 5.24.0 (copiar `maplibre-gl.js` e `.css` de `npm pack maplibre-gl@5.24.0`), relevo da
Mapterhorn pelo Worker `https://terracruadesign.pt/ipr-relevo/{z}/{x}/{y}.webp`, cor por altitude, sombreado, céu.
Cenas na lista `C` (centro, zoom, inclinação, rumo, rotação por segundo, efeitos: `cont` curvas, `agua` água a subir, `sol` sol a rodar).

Gravar (Chromium do Playwright, SwiftShader; ~3,5 s por imagem a 1080p, as curvas de nível pesam muito):

    LIMPO=1 node render.js pt 0 25 <t0> <t1> saida.mp4     # 16:9, sem textos nem logótipos
    LIMPO=1 node render.js pt 1 25 <t0> <t1> saida.mp4     # 9:16

Cada corrida em bocados de até ~30 s de filme (o limite das tarefas de fundo é 2 h).
