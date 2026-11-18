/* Lateral direita de acessibilidade — compartilhada pelo site e pelos apps Lanhi.
   Abre por qualquer elemento com [data-acess]. Guarda as escolhas no aparelho (lanhi-a11y).
   Só muda a aparência da página: não envia nada para fora. */
(function () {
  'use strict';
  if (window.LANHI_ACESS) return;
  var CHAVE = 'lanhi-a11y';
  var raiz = document.documentElement;
  var OPCOES = [
    { id: 'contraste', nome: 'Contraste reforçado', desc: 'Textos e bordas mais marcados' },
    { id: 'legivel', nome: 'Letra de leitura fácil', desc: 'Formas mais abertas, boa para dislexia' },
    { id: 'espaco', nome: 'Mais espaço no texto', desc: 'Linhas, letras e palavras mais afastadas' },
    { id: 'links', nome: 'Destacar links', desc: 'Sublinha tudo o que é clicável' },
    { id: 'foco', nome: 'Foco bem visível', desc: 'Contorno forte em quem está selecionado' },
    { id: 'movimento', nome: 'Reduzir movimento', desc: 'Desliga animações e rolagens suaves' },
    { id: 'cinza', nome: 'Tons de cinza', desc: 'Tira as cores, para quem é sensível a elas' }
  ];
  var TAMANHOS = [1, 1.12, 1.25, 1.4];

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { return {}; } }
  function gravar(p) { try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) {} }
  var pref = ler();

  function aplicar() {
    OPCOES.forEach(function (o) { raiz.classList.toggle('a11y-' + o.id, !!pref[o.id]); });
    var t = TAMANHOS.indexOf(pref.tamanho) >= 0 ? pref.tamanho : 1;
    raiz.style.setProperty('--a11y-zoom', String(t));
    raiz.classList.toggle('a11y-zoom', t !== 1);
  }
  aplicar();

  var css = '' +
    'html.a11y-zoom body{zoom:var(--a11y-zoom)}' +
    'html.a11y-contraste{filter:contrast(1.28)}' +
    'html.a11y-cinza{filter:grayscale(1)}' +
    'html.a11y-contraste.a11y-cinza{filter:contrast(1.28) grayscale(1)}' +
    'html.a11y-legivel body,html.a11y-legivel body *:not(svg):not(svg *){font-family:Verdana,"Segoe UI",Tahoma,sans-serif!important}' +
    'html.a11y-espaco body p,html.a11y-espaco body li,html.a11y-espaco body dd,html.a11y-espaco body label,html.a11y-espaco body small{line-height:1.8!important;letter-spacing:.03em!important;word-spacing:.14em!important}' +
    'html.a11y-links body a{text-decoration:underline!important;text-underline-offset:3px!important;text-decoration-thickness:2px!important}' +
    'html.a11y-foco body :focus-visible{outline:4px solid #ffd257!important;outline-offset:3px!important;box-shadow:0 0 0 7px #111!important}' +
    'html.a11y-movimento *,html.a11y-movimento *::before,html.a11y-movimento *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}' +
    '.acess-scrim{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483000;opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.acess-scrim.on{opacity:1;pointer-events:auto}' +
    '.acess{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);z-index:2147483001;display:flex;flex-direction:column;background:#16181a;color:#eef0f1;border-left:1px solid rgba(155,162,169,.22);box-shadow:-24px 0 60px -20px rgba(0,0,0,.7);transform:translateX(104%);transition:transform .32s cubic-bezier(.2,.8,.2,1);font:16px/1.45 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;zoom:calc(1/var(--a11y-zoom,1));padding-bottom:env(safe-area-inset-bottom)}' +
    '.acess.on{transform:none}' +
    '.acess[hidden]{display:none}' +
    'html.claro .acess{background:#f9f9f9;color:#1d1f21;border-left-color:#d5d8db;box-shadow:-24px 0 60px -30px rgba(29,31,33,.35)}' +
    '.acess-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(155,162,169,.22)}' +
    '.acess-top h2{margin:0;font-size:18px;font-weight:700;letter-spacing:0}' +
    '.acess-x{width:44px;height:44px;border-radius:10px;border:1px solid rgba(155,162,169,.35);background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer}' +
    '.acess-corpo{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:8px 18px 24px}' +
    '.acess-bloco{padding:14px 0;border-bottom:1px solid rgba(155,162,169,.16)}' +
    '.acess-bloco:last-child{border-bottom:0}' +
    '.acess-rot{display:block;font-size:13px;font-weight:700;color:#aab1b8;margin:0 0 10px}' +
    'html.claro .acess-rot{color:#575e65}' +
    '.acess-tam{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}' +
    '.acess-tam button,.acess-voz button,.acess-pe button{min-height:44px;border-radius:10px;border:1px solid rgba(155,162,169,.35);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}' +
    '.acess-tam button[aria-pressed="true"]{background:#eef0f1;color:#16181a;border-color:#eef0f1}' +
    'html.claro .acess-tam button[aria-pressed="true"]{background:#1d1f21;color:#fff;border-color:#1d1f21}' +
    '.acess-op{display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:56px;padding:8px 0;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer}' +
    '.acess-op b{display:block;font-size:15.5px;font-weight:600}' +
    '.acess-op small{display:block;font-size:13px;color:#aab1b8;margin-top:2px}' +
    'html.claro .acess-op small{color:#575e65}' +
    '.acess-sw{flex:none;width:46px;height:28px;border-radius:14px;background:rgba(155,162,169,.35);position:relative;transition:background .2s}' +
    '.acess-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}' +
    '.acess-op[aria-checked="true"] .acess-sw{background:#2e7d4f}' +
    '.acess-op[aria-checked="true"] .acess-sw::after{transform:translateX(18px)}' +
    '.acess-op:focus-visible,.acess button:focus-visible{outline:3px solid #ffd257;outline-offset:2px}' +
    '.acess-voz{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.acess-voz .parar{grid-column:1/-1}' +
    '.acess-nota{font-size:13px;color:#aab1b8;margin:10px 0 0}' +
    'html.claro .acess-nota{color:#575e65}' +
    '.acess-pe{padding:12px 18px 16px;border-top:1px solid rgba(155,162,169,.22)}' +
    '.acess-pe button{width:100%}' +
    '@media (prefers-reduced-motion:reduce){.acess,.acess-scrim{transition:none}}';

  var painel, scrim, origem = null;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function montar() {
    if (painel) return;
    var st = el('style', { id: 'acess-css' }); st.textContent = css; document.head.appendChild(st);
    scrim = el('div', { 'class': 'acess-scrim' });
    painel = el('aside', { 'class': 'acess', id: 'acess', 'aria-labelledby': 'acess-tit', role: 'dialog', 'aria-modal': 'true', hidden: '' });
    var tam = TAMANHOS.map(function (t, i) {
      return '<button type="button" data-tam="' + t + '" aria-pressed="false" aria-label="Texto ' + ['normal', 'maior', 'grande', 'muito grande'][i] + '" style="font-size:' + (14 + i * 3) + 'px">A' + (i ? '+'.repeat(i) : '') + '</button>';
    }).join('');
    var ops = OPCOES.map(function (o) {
      return '<button type="button" class="acess-op" role="switch" aria-checked="false" data-op="' + o.id + '"><span><b>' + o.nome + '</b><small>' + o.desc + '</small></span><span class="acess-sw" aria-hidden="true"></span></button>';
    }).join('');
    var temVoz = 'speechSynthesis' in window;
    painel.innerHTML =
      '<div class="acess-top"><h2 id="acess-tit">Acessibilidade</h2><button type="button" class="acess-x" data-fechar aria-label="Fechar acessibilidade">×</button></div>' +
      '<div class="acess-corpo">' +
      '<div class="acess-bloco"><span class="acess-rot" id="acess-rot-tam">Tamanho do texto</span><div class="acess-tam" role="group" aria-labelledby="acess-rot-tam">' + tam + '</div></div>' +
      '<div class="acess-bloco">' + ops + '</div>' +
      (temVoz ? '<div class="acess-bloco"><span class="acess-rot">Ouvir em voz alta</span><div class="acess-voz"><button type="button" data-voz="pagina">Ouvir a página</button><button type="button" data-voz="selecao">Ouvir o selecionado</button><button type="button" class="parar" data-voz="parar">Parar a leitura</button></div><p class="acess-nota">A voz é a do próprio aparelho. Para ouvir só um trecho, selecione o texto antes.</p></div>' : '') +
      '</div><div class="acess-pe"><button type="button" data-restaurar>Voltar ao padrão</button></div>';
    document.body.appendChild(scrim); document.body.appendChild(painel);
    scrim.addEventListener('click', fechar);
    painel.addEventListener('click', clique);
    painel.addEventListener('keydown', teclado);
    sincronizar();
  }

  function sincronizar() {
    if (!painel) return;
    var t = TAMANHOS.indexOf(pref.tamanho) >= 0 ? pref.tamanho : 1;
    painel.querySelectorAll('[data-tam]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-tam')) === t)); });
    painel.querySelectorAll('[data-op]').forEach(function (b) { b.setAttribute('aria-checked', String(!!pref[b.getAttribute('data-op')])); });
  }

  function mudar(fn) { fn(); gravar(pref); aplicar(); sincronizar(); }

  function clique(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-fechar')) return fechar();
    if (b.hasAttribute('data-tam')) return mudar(function () { pref.tamanho = Number(b.getAttribute('data-tam')); });
    if (b.hasAttribute('data-op')) return mudar(function () { var k = b.getAttribute('data-op'); pref[k] = !pref[k]; });
    if (b.hasAttribute('data-restaurar')) return mudar(function () { pref = {}; });
    var v = b.getAttribute('data-voz');
    if (v === 'parar') return pararVoz();
    if (v === 'selecao') { var s = String(window.getSelection ? window.getSelection() : '').trim(); return falar(s || 'Selecione um trecho do texto e toque de novo em Ouvir o selecionado.'); }
    if (v === 'pagina') { var alvo = document.querySelector('main') || document.querySelector('[data-painel]:not(.esconde)') || document.body; return falar(textoDe(alvo)); }
  }

  function textoDe(n) {
    var c = n.cloneNode(true);
    c.querySelectorAll('script,style,svg,[aria-hidden="true"],[hidden],.esconde,#acess').forEach(function (x) { x.remove(); });
    return (c.innerText || c.textContent || '').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, 12000);
  }

  function voz() {
    var vs = window.speechSynthesis.getVoices() || [];
    return vs.filter(function (x) { return /^pt[-_]BR/i.test(x.lang); })[0] || vs.filter(function (x) { return /^pt/i.test(x.lang); })[0] || null;
  }
  function falar(txt) {
    if (!('speechSynthesis' in window) || !txt) return;
    pararVoz();
    var partes = txt.match(/[^.!?\n]+[.!?\n]*/g) || [txt], v = voz();
    partes.forEach(function (p) {
      p = p.trim(); if (!p) return;
      var u = new SpeechSynthesisUtterance(p); u.lang = 'pt-BR'; if (v) u.voice = v; u.rate = 1;
      window.speechSynthesis.speak(u);
    });
  }
  function pararVoz() { try { window.speechSynthesis.cancel(); } catch (e) {} }

  function focaveis() { return Array.prototype.slice.call(painel.querySelectorAll('button')).filter(function (b) { return b.offsetParent !== null; }); }
  function teclado(e) {
    if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (e.key !== 'Tab') return;
    var f = focaveis(); if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  function abrir(e) {
    if (e && e.preventDefault) e.preventDefault();
    montar(); sincronizar();
    origem = document.activeElement;
    painel.hidden = false;
    document.querySelectorAll('[data-acess]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    requestAnimationFrame(function () { painel.classList.add('on'); scrim.classList.add('on'); var x = painel.querySelector('[data-tam][aria-pressed="true"]') || painel.querySelector('button'); if (x) x.focus(); });
  }
  function fechar() {
    if (!painel || painel.hidden) return;
    painel.classList.remove('on'); scrim.classList.remove('on');
    document.querySelectorAll('[data-acess]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { if (!painel.classList.contains('on')) painel.hidden = true; }, 340);
    if (origem && origem.focus) origem.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-acess]');
    if (t) abrir(e);
  });
  document.querySelectorAll('[data-acess]').forEach(function (b) { b.setAttribute('aria-controls', 'acess'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-haspopup', 'dialog'); });

  window.LANHI_ACESS = { abrir: abrir, fechar: fechar };
})();
