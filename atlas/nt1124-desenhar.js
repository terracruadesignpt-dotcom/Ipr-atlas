/* IPR Atlas · Painel «Desenhar» num só cartão (24/11/2026, 21h40). Terracrua Design.
   Nuno (21h38, fotografia): «quando carregas na ferramenta desenhar, abre estas coisas todas. Isto não faz sentido nenhum.
   Está feio, não está intuitivo, está desarmonioso, está amador.» Antes: três faixas soltas (a do modo, «Forma/Tipo» e a dos
   subtipos), com o «Forma» separado do que se desenha.
   Agora, no computador, o modo Desenhar abre um só cartão, alinhado à esquerda por baixo da barra das ferramentas:
   - O terreno: Escolher parcelas, Desenhar o terreno, Carregar ficheiro, Apagar terreno.
   - Elementos: separadores por tipo (Água, Acessos, Vegetação, Edificado, Limites e zonas) e, para o tipo escolhido, cada
     elemento com o seu símbolo por cima do nome, arrumado em Pontos, Linhas e Áreas. Escolher «Muro» já diz que é uma linha.
   - Rodapé: Acabar (quando há uma linha ou área a meio), Desfazer, Exportar, Limpar e «Mais» (Desenho livre, Desenhar na Base,
     Marcador).
   Cada botão carrega no botão original (faixa do modo e nt1124-trabalho.js), por isso o comportamento é o mesmo; as faixas de
   origem ficam escondidas só enquanto este cartão está aberto. Telemóvel: fica como estava.
   Desligar: ?dpainel=0 ou localStorage ipr_dp=0. */
(function () {
  "use strict";
  var W = window, D = document, R = D.documentElement;
  try { if (/[?&]dpainel=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_dp") === "0") return; } catch (e) {}
  if (W.__iprDP) return; W.__iprDP = 1;
  function pc() { try { return W.matchMedia("(min-width: 1024px)").matches; } catch (e) { return W.innerWidth >= 1024; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var TIPOS = [
    ["agua", "Água", "#3d8fd6", { p: ["Nascente", "Poço", "Furo", "Depósito"], l: ["Vala em curva de nível", "Keyline", "Tubagem", "Linha de água"], g: ["Charca", "Zona húmida", "Bacia de retenção"] }],
    ["acessos", "Acessos", "#b98a52", { p: ["Portão", "Cancela", "Passagem"], l: ["Caminho", "Estrada", "Trilho"], g: ["Eira e parque", "Zona de manobra"] }],
    ["veg", "Vegetação", "#6fa83a", { p: ["Árvore", "Árvore notável"], l: ["Sebe", "Linha de plantação", "Corta-vento"], g: ["Pomar", "Horta", "Mata", "Pastagem"] }],
    ["edif", "Edificado", "#bdb8a8", { p: ["Poste", "Colmeia", "Painel solar"], l: ["Muro", "Vedação", "Rede eléctrica"], g: ["Casa", "Armazém", "Estufa"] }],
    ["lim", "Limites e zonas", "#e5484d", { p: ["Marco"], l: ["Estrema", "Faixa de servidão"], g: ["Terreno", "Zona 0 a 5", "Faixa de combustível"] }]
  ];
  var FORMAS = [["p", "Pontos"], ["l", "Linhas"], ["g", "Áreas"]];
  var TERRENO = [["Escolher parcelas", /escolher parcelas|pick parcels/i], ["Desenhar o terreno", /desenhar o terreno|draw the plot/i], ["Carregar ficheiro", /carregar ficheiro|upload/i], ["Apagar terreno", /apagar terreno|erase/i]];
  var MAIS = [["Desenho livre", /desenho livre|freehand/i], ["Desenhar na Base", /desenhar na base|draw on the base/i], ["Marcador", /^marcador|^marker/i]];

  var st = { tipo: "agua", sel: "" };
  try { var g0 = W.localStorage.getItem("ipr_dp_tipo"); if (g0) st.tipo = g0; } catch (e) {}

  var CSS =
    "html.ipr-dp-on #ipr-modos-acc,html.ipr-dp-on #ipr-trb{position:fixed!important;left:-9999px!important;top:-9999px!important;opacity:0!important;pointer-events:none!important}" +
    "#ipr-dp{position:fixed;z-index:2147480040;display:none;width:min(560px,var(--ipr-dp-w,560px));max-height:calc(100vh - var(--ipr-dp-y,140px) - 24px);overflow:auto;padding:14px 16px 12px;border-radius:18px;background:rgba(13,17,11,.84);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border:1px solid rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 40px -12px rgba(0,0,0,.6);color:#e6e4d9;font:13px/1.4 Geist,Inter,system-ui,sans-serif;box-sizing:border-box}" +
    "html.ipr-dp-on #ipr-dp{display:block}" +
    "#ipr-dp .cab{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}" +
    "#ipr-dp .cab b{font:600 14px Geist,Inter,system-ui,sans-serif;letter-spacing:-.01em}" +
    "#ipr-dp .x{width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.06);color:#e6e4d9;cursor:pointer;font-size:15px;line-height:1}" +
    "#ipr-dp .x:hover{background:rgba(255,255,255,.12)}" +
    "#ipr-dp h6{margin:12px 0 6px;font:500 10px 'Geist Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8d907f}" +
    "#ipr-dp .lin{display:flex;flex-wrap:wrap;gap:6px}" +
    "#ipr-dp .bt{height:32px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#dcdacf;font:500 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}" +
    "#ipr-dp .bt:hover{background:rgba(255,255,255,.08);color:#fff}" +
    "#ipr-dp .bt.p{background:#94BE39;border-color:#94BE39;color:#11160d}" +
    "#ipr-dp .tabs{display:flex;flex-wrap:wrap;gap:4px;padding:3px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}" +
    "#ipr-dp .tab{flex:1 1 auto;height:30px;padding:0 12px;border:0;border-radius:999px;background:none;color:#bdbcb0;font:500 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}" +
    "#ipr-dp .tab i{width:8px;height:8px;border-radius:2px;display:inline-block}" +
    "#ipr-dp .tab.on{background:rgba(236,234,224,.94);color:#11160d;font-weight:600}" +
    "#ipr-dp .grp{display:grid;grid-template-columns:62px 1fr;gap:8px;align-items:start;margin-top:10px}" +
    "#ipr-dp .grp>span{font:500 10px 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#8d907f;padding-top:12px}" +
    "#ipr-dp .els{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}" +
    "#ipr-dp .el{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:58px;padding:8px 6px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:#e6e4d9;font:500 12px/1.2 Geist,Inter,system-ui,sans-serif;text-align:center;cursor:pointer}" +
    "#ipr-dp .el:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06)}" +
    "#ipr-dp .el.on{border-color:#94BE39;background:rgba(148,190,57,.14);color:#f2f0e6}" +
    "#ipr-dp .el svg{width:34px;height:16px;display:block}" +
    "#ipr-dp .rod{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}" +
    "#ipr-dp .rod .esp{flex:1 1 auto}" +
    "#ipr-dp .mais{position:relative}" +
    "#ipr-dp .mais>div{display:none;position:absolute;right:0;bottom:38px;min-width:190px;padding:6px;border-radius:12px;background:rgba(13,17,11,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 28px -10px rgba(0,0,0,.6)}" +
    "#ipr-dp .mais.ab>div{display:block}" +
    "#ipr-dp .mais>div button{display:block;width:100%;text-align:left;height:32px;padding:0 10px;border:0;border-radius:8px;background:none;color:#dcdacf;font:500 12.5px Geist,Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-dp .mais>div button:hover{background:rgba(255,255,255,.07)}" +
    "#ipr-dp .dica{margin-top:8px;color:#8d907f;font-size:11.5px}";

  function acc() { return D.getElementById("ipr-modos-acc"); }
  function trb() { return D.getElementById("ipr-trb"); }
  function noAcc(re) { var a = acc(); if (!a) return null; return [].filter.call(a.querySelectorAll("button"), function (b) { return re.test((b.textContent || "").trim()); })[0] || null; }
  function emDesenhar() { var b = D.querySelector('#ipr-modos button[data-modo="desenhar"]'); return !!(b && b.getAttribute("aria-pressed") === "true"); }
  function simb(n, f) { try { return W.IPR_SIMBOLOS && W.IPR_SIMBOLOS.svg ? W.IPR_SIMBOLOS.svg(n, f) : ""; } catch (e) { return ""; } }

  function tipo() { for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i][0] === st.tipo) return TIPOS[i]; return TIPOS[0]; }
  function render() {
    var p = D.getElementById("ipr-dp"); if (!p) return;
    var T = tipo(), h = '<div class="cab"><b>Desenhar</b><button type="button" class="x" data-a="fechar" title="Fechar" aria-label="Fechar">×</button></div>';
    h += "<h6>O terreno</h6><div class=\"lin\">" + TERRENO.map(function (x, i) { return noAcc(x[1]) ? '<button type="button" class="bt' + (i === 0 ? " p" : "") + '" data-ter="' + i + '">' + esc(x[0]) + "</button>" : ""; }).join("") + "</div>";
    h += "<h6>Elementos</h6><div class=\"tabs\">" + TIPOS.map(function (x) { return '<button type="button" class="tab' + (x[0] === T[0] ? " on" : "") + '" data-t="' + x[0] + '"><i style="background:' + x[2] + '"></i>' + esc(x[1]) + "</button>"; }).join("") + "</div>";
    FORMAS.forEach(function (f) {
      var L = T[3][f[0]] || []; if (!L.length) return;
      h += '<div class="grp"><span>' + f[1] + '</span><div class="els">' + L.map(function (n) {
        return '<button type="button" class="el' + (st.sel === T[0] + "|" + n ? " on" : "") + '" data-f="' + f[0] + '" data-s="' + esc(n) + '" title="' + esc(n) + '">' + simb(n, f[0]) + "<span>" + esc(n) + "</span></button>";
      }).join("") + "</div></div>";
    });
    var t = trb(), acabar = t && t.querySelector('button[data-a="acabar"]');
    h += '<div class="rod">' + (acabar ? '<button type="button" class="bt p" data-o="acabar">Acabar</button>' : "") +
      '<button type="button" class="bt" data-o="desfazer">Desfazer</button><button type="button" class="bt" data-o="exportar">Exportar</button><button type="button" class="bt" data-o="limpar">Limpar desenho</button>' +
      '<span class="esp"></span><div class="mais"><button type="button" class="bt" data-a="mais">Mais ▾</button><div>' +
      MAIS.map(function (x, i) { return noAcc(x[1]) ? '<button type="button" data-mais="' + i + '">' + esc(x[0]) + "</button>" : ""; }).join("") + "</div></div></div>";
    h += '<div class="dica">' + (st.sel ? "Clique no mapa para desenhar. Linhas e áreas acabam no último ponto com duplo clique ou em «Acabar»." : "Escolha o elemento e desenhe no mapa. O símbolo é o que vai aparecer.") + "</div>";
    p.innerHTML = h;
  }

  function clicar(sel) { var t = trb(), b = t && t.querySelector(sel); if (b) { b.click(); return true; } return false; }
  function escolher(f, s) {
    var T = tipo();
    // a faixa de origem refaz-se a cada clique: forma, tipo, subtipo, por esta ordem
    clicar('button[data-f="' + f + '"]');
    clicar('button[data-t="' + T[0] + '"]');
    var ok = clicar('button[data-s="' + (W.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"')) + '"]');
    st.sel = ok ? T[0] + "|" + s : "";
    render();
  }

  function montar() {
    if (D.getElementById("ipr-dp")) return;
    var s = D.createElement("style"); s.id = "ipr-dp-css"; s.textContent = CSS; D.head.appendChild(s);
    var p = D.createElement("div"); p.id = "ipr-dp"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Desenhar"); D.body.appendChild(p);
    p.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "fechar") { var d = D.querySelector('#ipr-modos button[data-modo="desenhar"]'); if (d) d.click(); return; }
      if (a === "mais") { b.parentNode.classList.toggle("ab"); return; }
      if (b.hasAttribute("data-ter")) { var x = noAcc(TERRENO[+b.getAttribute("data-ter")][1]); if (x) x.click(); return; }
      if (b.hasAttribute("data-mais")) { var y = noAcc(MAIS[+b.getAttribute("data-mais")][1]); if (y) y.click(); b.closest(".mais").classList.remove("ab"); return; }
      if (b.hasAttribute("data-t") && !b.hasAttribute("data-s")) { st.tipo = b.getAttribute("data-t"); st.sel = ""; try { W.localStorage.setItem("ipr_dp_tipo", st.tipo); } catch (x2) {} render(); return; }
      if (b.hasAttribute("data-s")) { escolher(b.getAttribute("data-f"), b.getAttribute("data-s")); return; }
      var o = b.getAttribute("data-o");
      if (o) { clicar('button[data-a="' + o + '"]'); if (o !== "desfazer") st.sel = ""; setTimeout(render, 80); }
    });
    var t = trb();
    if (t && W.MutationObserver) new MutationObserver(function () {
      // sincroniza «Acabar» e o elemento armado com a faixa de origem
      if (!R.classList.contains("ipr-dp-on")) return;
      var armado = t.querySelector("button[data-s].ac"); if (!armado && st.sel) st.sel = "";
      clearTimeout(montar.t); montar.t = setTimeout(render, 50);
    }).observe(t, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  function posicionar() {
    var p = D.getElementById("ipr-dp"), bar = D.getElementById("tb-bar"); if (!p || !bar) return;
    var r = bar.getBoundingClientRect(), x = Math.round(r.left), y = Math.round(r.bottom + 8);
    var dir = D.getElementById("ipe-dir"), lim = W.innerWidth - 16;
    if (dir && dir.getClientRects().length) { var rd = dir.getBoundingClientRect(); if (rd.width > 120 && rd.left > x + 300) lim = rd.left - 12; }
    p.style.left = x + "px"; p.style.top = y + "px";
    R.style.setProperty("--ipr-dp-w", Math.max(340, lim - x) + "px");
    R.style.setProperty("--ipr-dp-y", y + "px");
  }

  var aberto = false;
  function correr() {
    if (!D.head || !D.body) return;
    var ligar = pc() && emDesenhar() && !!acc() && !!trb();
    if (ligar) { montar(); if (!aberto) { aberto = true; render(); } posicionar(); }
    else if (aberto) { aberto = false; st.sel = ""; }
    R.classList.toggle("ipr-dp-on", ligar);
  }
  (function vez(n) { correr(); if (n < 120) setTimeout(function () { vez(n + 1); }, 400); })(0);
  setInterval(correr, 600);
  W.addEventListener("resize", correr);
})();
