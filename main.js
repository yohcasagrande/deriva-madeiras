/* =========================================================
   Deriva Madeiras · scripts do site
   ========================================================= */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const WHATSAPP = '554799781978';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const zap = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

  /* ---------- menu do celular ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  if (menuBtn && menu) {
    const abre = (sim) => {
      menu.classList.toggle('aberto', sim);
      menuBtn.setAttribute('aria-expanded', String(sim));
      menuBtn.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu');
    };
    menuBtn.addEventListener('click', () => abre(!menu.classList.contains('aberto')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) abre(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { abre(false); menuBtn.focus(); } });
  }

  /* ---------- animação de entrada ---------- */
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !semMovimento) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    $$('.revela').forEach((el) => io.observe(el));
  } else {
    $$('.revela').forEach((el) => el.classList.add('visivel'));
  }
  $$('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- filtro das peças ---------- */
  $$('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filtro;
    $$('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('.peca').forEach((p) => {
      const mostra = f === 'todas' || p.dataset.cat === f;
      p.hidden = !mostra;
      if (mostra) p.classList.add('visivel');
    });
  }));

  /* ---------- "quero uma assim": mensagem pronta no WhatsApp ---------- */
  $$('[data-peca]').forEach((a) => a.addEventListener('click', () => {
    const peca = a.dataset.peca;
    a.href = peca === 'Peça sob medida'
      ? zap('Olá, Deriva! Vim pelo site e tenho uma ideia de peça sob medida.')
      : zap(`Olá, Deriva! Vi no site a peça "${peca}" e quero saber mais.`);
  }));

  /* =========================================================
     GRAVE A SUA MARCA: prévia da gravação a laser na tábua
     ========================================================= */
  const canvas = $('#grav-canvas');
  const form = $('#form-grav');
  if (!canvas || !form) return;

  // Foto da tábua e o trecho dela que aparece na prévia (coordenadas da foto de 1400 px)
  const FOTO = { src: 'tabua-alca-1400.jpg', corte: { x: 200, y: 0, w: 1000, h: 1100 } };
  // Área plana da tábua onde a gravação é aplicada: cantos superior esquerdo, superior direito,
  // inferior direito e inferior esquerdo, já no sistema da prévia (foto menos o corte)
  const AREA = [[458, 350], [752, 375], [554, 840], [246, 809]];
  const MASCARA = { w: 440, h: 750 };
  const COR_QUEIMADO = 'rgb(48, 24, 9)';

  const ctx = canvas.getContext('2d');
  const foto = new Image();
  const mascara = Object.assign(document.createElement('canvas'), { width: MASCARA.w, height: MASCARA.h });
  const queimado = Object.assign(document.createElement('canvas'), { width: MASCARA.w, height: MASCARA.h });
  const camada = Object.assign(document.createElement('canvas'), { width: canvas.width, height: canvas.height });

  const el = {
    linha1: $('#g-linha1'), linha2: $('#g-linha2'), tamanho: $('#g-tamanho'), posicao: $('#g-posicao'),
    logo: $('#g-logo'), inverter: $('#g-inverter'), logoNome: $('[data-logo-nome]'),
    qtd: $('#g-qtd'), data: $('#g-data'), nome: $('#g-nome'), cidade: $('#g-cidade'),
    erro: $('[data-erro]', form), aviso: $('[data-aviso]', form), enviar: $('[data-enviar]', form),
    baixar: $('[data-baixar]'), carregando: $('[data-carregando]'),
  };
  const est = { aba: 'texto', logo: null, logoNomeArquivo: '', pronto: false };

  const FONTES = {
    classica: { nome: 'clássica', css: (px) => `400 ${px}px "Gloock", Georgia, serif`, escala: 1, caixa: (t) => t, espaco: 0 },
    moderna: { nome: 'moderna', css: (px) => `800 ${px}px "Manrope", Arial, sans-serif`, escala: .62, caixa: (t) => t.toUpperCase(), espaco: .14 },
    manuscrita: { nome: 'cursiva', css: (px) => `400 ${px}px Allura, cursive`, escala: 1.22, caixa: (t) => t, espaco: 0 },
  };
  const fonteAtual = () => $('input[name="fonte"]:checked', form).value;

  /* homografia do quadrado unitário para o quadrilátero da área */
  function homografia([p0, p1, p2, p3]) {
    const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den;
    const h = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
    const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
    return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]; };
  }
  const mapa = homografia(AREA);

  /* desenha um triângulo da imagem de origem no triângulo de destino (transformação afim) */
  function triangulo(c, img, s, d) {
    const [[sx0, sy0], [sx1, sy1], [sx2, sy2]] = s;
    let [[dx0, dy0], [dx1, dy1], [dx2, dy2]] = d;
    // aumenta um pouco o triângulo de recorte para não sobrar fresta entre as partes
    const cx = (dx0 + dx1 + dx2) / 3, cy = (dy0 + dy1 + dy2) / 3, k = 1.02;
    const cresce = (x, y) => [cx + (x - cx) * k, cy + (y - cy) * k];
    c.save();
    c.beginPath();
    c.moveTo(...cresce(dx0, dy0)); c.lineTo(...cresce(dx1, dy1)); c.lineTo(...cresce(dx2, dy2));
    c.closePath(); c.clip();
    const den = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
    const a = -(sy0 * (dx2 - dx1) - sy1 * dx2 + sy2 * dx1 + (sy1 - sy2) * dx0) / den;
    const b = (sy1 * dy2 + sy0 * (dy1 - dy2) - sy2 * dy1 + (sy2 - sy1) * dy0) / den;
    const cc = (sx0 * (dx2 - dx1) - sx1 * dx2 + sx2 * dx1 + (sx1 - sx2) * dx0) / den;
    const dd = -(sx1 * dy2 + sx0 * (dy1 - dy2) - sx2 * dy1 + (sx2 - sx1) * dy0) / den;
    const e = (sx0 * (sy2 * dx1 - sy1 * dx2) + sy0 * (sx1 * dx2 - sx2 * dx1) + (sx2 * sy1 - sx1 * sy2) * dx0) / den;
    const f = (sx0 * (sy2 * dy1 - sy1 * dy2) + sy0 * (sx1 * dy2 - sx2 * dy1) + (sx2 * sy1 - sx1 * sy2) * dy0) / den;
    c.transform(a, b, cc, dd, e, f);
    c.drawImage(img, 0, 0);
    c.restore();
  }

  function deforma(img) {
    const c = camada.getContext('2d');
    c.clearRect(0, 0, camada.width, camada.height);
    const N = 14;
    const { w, h } = MASCARA;
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N;
        const s00 = [u0 * w, v0 * h], s10 = [u1 * w, v0 * h], s11 = [u1 * w, v1 * h], s01 = [u0 * w, v1 * h];
        const d00 = mapa(u0, v0), d10 = mapa(u1, v0), d11 = mapa(u1, v1), d01 = mapa(u0, v1);
        triangulo(c, img, [s00, s10, s11], [d00, d10, d11]);
        triangulo(c, img, [s00, s11, s01], [d00, d11, d01]);
      }
    }
  }

  /* escreve texto com espaçamento entre letras (nem todo navegador tem letterSpacing no canvas) */
  function textoEspacado(c, texto, x, y, espacoPx) {
    if (!espacoPx) { c.fillText(texto, x, y); return; }
    const larguras = [...texto].map((ch) => c.measureText(ch).width);
    const total = larguras.reduce((s, l) => s + l, 0) + espacoPx * (larguras.length - 1);
    let cx = x - total / 2;
    c.save(); c.textAlign = 'left';
    [...texto].forEach((ch, i) => { c.fillText(ch, cx, y); cx += larguras[i] + espacoPx; });
    c.restore();
  }
  function larguraEspacada(c, texto, espacoPx) {
    return [...texto].reduce((s, ch) => s + c.measureText(ch).width, 0) + espacoPx * Math.max(0, [...texto].length - 1);
  }

  function desenhaMascara() {
    const c = mascara.getContext('2d');
    const { w, h } = MASCARA;
    c.clearRect(0, 0, w, h);
    const escala = Number(el.tamanho.value) / 100;
    const cy = h * (Number(el.posicao.value) / 100);
    c.fillStyle = '#000';

    if (est.aba === 'logo') {
      if (!est.logo) return false;
      const maxW = w * .8 * escala, maxH = h * .36 * escala;
      const r = Math.min(maxW / est.logo.width, maxH / est.logo.height);
      const lw = Math.max(1, Math.round(est.logo.width * r)), lh = Math.max(1, Math.round(est.logo.height * r));
      const tmp = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
      const t = tmp.getContext('2d');
      t.drawImage(est.logo, 0, 0, lw, lh);
      const px = t.getImageData(0, 0, lw, lh);
      const inv = el.inverter.checked;
      for (let i = 0; i < px.data.length; i += 4) {
        const lum = (0.299 * px.data[i] + 0.587 * px.data[i + 1] + 0.114 * px.data[i + 2]) / 255;
        let v = inv ? lum : 1 - lum;
        v = Math.min(1, Math.max(0, (v - 0.12) / 0.7));
        px.data[i] = px.data[i + 1] = px.data[i + 2] = 0;
        px.data[i + 3] = Math.round(v * px.data[i + 3]);
      }
      t.putImageData(px, 0, 0);
      c.drawImage(tmp, (w - lw) / 2, cy - lh / 2);
      return true;
    }

    const f = FONTES[fonteAtual()];
    const t1 = f.caixa(el.linha1.value.trim());
    const t2 = f.caixa(el.linha2.value.trim());
    if (!t1 && !t2) return false;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const limite = w * .86;

    let p1 = w * .21 * f.escala * escala;
    c.font = f.css(p1);
    while (t1 && p1 > 12 && larguraEspacada(c, t1, p1 * f.espaco) > limite) { p1 -= 1; c.font = f.css(p1); }
    let p2 = Math.max(12, p1 * (fonteAtual() === 'moderna' ? .5 : .42));
    const f2 = fonteAtual() === 'manuscrita' ? FONTES.classica : f;
    c.font = f2.css(p2);
    while (t2 && p2 > 10 && larguraEspacada(c, t2, p2 * .12) > limite) { p2 -= 1; c.font = f2.css(p2); }

    const gap = p1 * .35;
    const altura = (t1 ? p1 : 0) + (t2 ? p2 + gap : 0);
    let y = cy - altura / 2;
    if (t1) { c.font = f.css(p1); textoEspacado(c, t1, w / 2, y + p1 / 2, p1 * f.espaco); y += p1 + gap; }
    if (t2) { c.font = f2.css(p2); textoEspacado(c, fonteAtual() === 'moderna' ? t2 : t2, w / 2, y + p2 / 2, p2 * .12); }
    return true;
  }

  function desenha() {
    if (!est.pronto) return;
    const { x, y, w, h } = FOTO.corte;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.drawImage(foto, x, y, w, h, 0, 0, canvas.width, canvas.height);
    if (!desenhaMascara()) return;

    const q = queimado.getContext('2d');
    q.clearRect(0, 0, queimado.width, queimado.height);
    q.globalCompositeOperation = 'source-over';
    q.drawImage(mascara, 0, 0);
    q.globalCompositeOperation = 'source-in';
    q.fillStyle = COR_QUEIMADO;
    q.fillRect(0, 0, queimado.width, queimado.height);
    q.globalCompositeOperation = 'source-over';
    deforma(queimado);

    // halo leve da queima e depois o traço principal, os dois multiplicando a cor da madeira
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = .28;
    ctx.filter = 'blur(2.5px)';
    ctx.drawImage(camada, 0, 0);
    ctx.globalAlpha = .9;
    ctx.filter = 'blur(0.5px)';
    ctx.drawImage(camada, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
  }

  let pedido = 0;
  const redesenha = () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(desenha); };

  const fontesProntas = document.fonts
    ? Promise.all(['400 40px "Gloock"', '800 40px "Manrope"', '400 40px Allura'].map((f) => document.fonts.load(f))).catch(() => {})
    : Promise.resolve();
  const fotoPronta = new Promise((ok) => { foto.onload = ok; foto.onerror = ok; foto.src = FOTO.src; });
  Promise.all([fontesProntas, fotoPronta]).then(() => {
    est.pronto = foto.naturalWidth > 0;
    el.carregando.hidden = est.pronto;
    if (!est.pronto) el.carregando.textContent = 'Não foi possível carregar a foto da tábua.';
    desenha();
  });

  [el.linha1, el.linha2, el.tamanho, el.posicao, el.inverter].forEach((i) => i.addEventListener('input', redesenha));
  $$('input[name="fonte"]', form).forEach((r) => r.addEventListener('change', redesenha));

  /* abas texto / logo */
  const abas = $$('[data-aba]', form);
  function trocaAba(nome, foco) {
    est.aba = nome;
    abas.forEach((b) => {
      const ativa = b.dataset.aba === nome;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
      $(`#${b.getAttribute('aria-controls')}`).hidden = !ativa;
      if (ativa && foco) b.focus();
    });
    redesenha();
  }
  abas.forEach((b) => {
    b.addEventListener('click', () => trocaAba(b.dataset.aba));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = abas.indexOf(b);
      trocaAba(abas[(i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length].dataset.aba, true);
    });
  });

  el.logo.addEventListener('change', () => {
    const arq = el.logo.files && el.logo.files[0];
    if (!arq) return;
    const url = URL.createObjectURL(arq);
    const img = new Image();
    img.onload = () => {
      est.logo = img; est.logoNomeArquivo = arq.name;
      el.logoNome.textContent = arq.name;
      el.erro.textContent = '';
      redesenha();
    };
    img.onerror = () => { el.logoNome.textContent = 'Não consegui abrir esse arquivo. Tente um PNG ou JPG.'; };
    img.src = url;
  });

  /* baixar a prévia para mandar no WhatsApp */
  el.baixar.addEventListener('click', () => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'previa-gravacao-marecasa.jpg' });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, 'image/jpeg', .9);
    } catch (err) {
      el.aviso.textContent = 'Para baixar a prévia, abra o site publicado (no computador local o navegador bloqueia).';
      el.aviso.className = 'aviso aviso--erro';
    }
  });

  /* quantidade */
  const limitaQtd = (n) => Math.max(1, Math.min(1000, n || 1));
  const marcaAtalho = () => $$('[data-atalho]', form).forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.atalho) === Number(el.qtd.value))));
  $$('[data-qtd]', form).forEach((b) => b.addEventListener('click', () => {
    el.qtd.value = limitaQtd(parseInt(el.qtd.value, 10) + Number(b.dataset.qtd)); marcaAtalho();
  }));
  $$('[data-atalho]', form).forEach((b) => b.addEventListener('click', () => { el.qtd.value = b.dataset.atalho; marcaAtalho(); }));
  el.qtd.addEventListener('input', marcaAtalho);
  el.qtd.addEventListener('blur', () => { el.qtd.value = limitaQtd(parseInt(el.qtd.value, 10)); marcaAtalho(); });
  marcaAtalho();

  const hoje = new Date();
  el.data.min = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  el.nome.addEventListener('input', () => {
    if (el.nome.value.trim()) { el.nome.removeAttribute('aria-invalid'); el.erro.textContent = ''; }
  });

  function mensagem() {
    const f = FONTES[fonteAtual()];
    const qtd = limitaQtd(parseInt(el.qtd.value, 10));
    let gravacao;
    if (est.aba === 'logo') {
      gravacao = 'o meu logo (vou enviar o arquivo aqui na conversa)';
    } else {
      const partes = [el.linha1.value.trim(), el.linha2.value.trim()].filter(Boolean).map((t) => `"${t}"`);
      gravacao = `${partes.join(' e ')} (letra ${f.nome})`;
    }
    const linhas = [
      'Olá, Deriva! Quero um orçamento de peças com gravação a laser.',
      '',
      '*Peça de referência:* tábua de corte com alça',
      `*Gravação:* ${gravacao}`,
      `*Para:* ${$('input[name="ocasiao"]:checked', form).value}`,
      `*Quantidade:* ${qtd} ${qtd === 1 ? 'peça' : 'peças'}`,
    ];
    if (el.data.value) { const [a, m, d] = el.data.value.split('-'); linhas.push(`*Preciso receber até:* ${d}/${m}/${a}`); }
    linhas.push(`*Nome:* ${el.nome.value.trim()}`);
    if (el.cidade.value.trim()) linhas.push(`*Cidade:* ${el.cidade.value.trim()}`);
    linhas.push('', 'Fiz a prévia da gravação no site e posso mandar a imagem.');
    return linhas.join('\n');
  }

  el.enviar.addEventListener('click', (e) => {
    el.erro.textContent = '';
    el.aviso.textContent = '';
    el.aviso.className = 'aviso';
    const semGravacao = est.aba === 'logo' ? !est.logo : !(el.linha1.value.trim() || el.linha2.value.trim());
    if (semGravacao || !el.nome.value.trim()) {
      e.preventDefault();
      const faltas = [];
      if (semGravacao) faltas.push(est.aba === 'logo' ? 'envie o arquivo do logo' : 'escreva o nome ou a marca');
      if (!el.nome.value.trim()) { faltas.push('diga o seu nome'); el.nome.setAttribute('aria-invalid', 'true'); }
      el.erro.textContent = `Falta pouco: ${faltas.join(' e ')}.`;
      if (!el.nome.value.trim()) el.nome.focus();
      return;
    }
    el.enviar.href = zap(mensagem());
    el.aviso.textContent = 'Pronto! O WhatsApp abriu com o pedido escrito. Se quiser, baixe a prévia e mande junto.';
    el.aviso.className = 'aviso aviso--ok';
  });
})();
