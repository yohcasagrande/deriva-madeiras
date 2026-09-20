# Site da Deriva Madeiras

Site estático (HTML, CSS e JavaScript puro, sem build) pronto para a Vercel. Todos os arquivos ficam na raiz, sem pastas, para o upload pelo navegador no GitHub não bagunçar a estrutura.

```
index.html      página única
style.css       visual
main.js         menu, filtro das peças, prévia da gravação a laser e pedido pelo WhatsApp
*.jpg           fotos do Instagram @marecasamadeiras, em 700 e 1400 px
vercel.json     URLs limpas e cache das imagens
robots.txt, sitemap.xml, favicon.svg, apple-touch-icon.png, og-image.jpg
```

## Publicar (GitHub + Vercel)

1. No GitHub, crie o repositório `deriva-madeiras` (sem README).
2. Clique em **uploading an existing file**, selecione todos os arquivos desta pasta com Cmd+A, arraste e clique em **Commit changes**.
3. Na Vercel: **Add New > Project**, importe `deriva-madeiras`, Framework Preset **Other**, **Deploy**.
4. O site fica em `https://deriva-madeiras.vercel.app`. Cada commit no GitHub atualiza o site sozinho.

Se o endereço final for outro (nome diferente na Vercel ou domínio próprio), troque `deriva-madeiras.vercel.app` em `index.html` (canonical, og:url, og:image e o bloco JSON-LD), `robots.txt` e `sitemap.xml`.

## Ajustes rápidos

- **WhatsApp:** constante `WHATSAPP` no topo de `main.js` e os links `wa.me/554799781978` do `index.html`.
- **Prévia da gravação:** `FOTO` (foto da tábua e o recorte exibido) e `AREA` (os quatro cantos da parte plana da tábua onde a gravação é aplicada), no começo da seção "GRAVE A SUA MARCA" de `main.js`. Para trocar a tábua da prévia, troque a foto e marque os quatro cantos de novo.
- **Peças:** cada peça é um `<li class="peca">` no `index.html`. O `data-cat` define o filtro e o `data-peca` é o nome que vai na mensagem do WhatsApp.
