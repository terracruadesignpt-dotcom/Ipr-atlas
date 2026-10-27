/* IPR Atlas · separador Cloud (20/10/2026).
   Acrescenta ao Atlas um separador «Cloud» com os terrenos que a pessoa tem na IPR Cloud,
   quem participa e com que papel, e como abrir no QField. Lê GET /tcd/v1/cloud/meus.
   Não mexe no app.js: junta um botão a #ipe-tabs e um painel .ipe-pane; o Atlas já
   mostra e esconde painéis pelo data-tab. Usa as variáveis de cor do Atlas, por isso
   segue o tema claro e o escuro. */
(function () {
  "use strict";
  var NONCE = window.tcdNonce || "";
  if (!NONCE) return; // só com sessão iniciada
  var REST = "/wp-json/tcd/v1/";
  var PAPEL = { admin: "Administrador", manager: "Gestor", editor: "Editor", reporter: "Repórter", reader: "Leitor" };
  var AJUDA = {
    admin: "Pode tudo neste projecto.",
    manager: "Gere o projecto e as pessoas.",
    editor: "Altera os dados no campo e no QGIS.",
    reporter: "Acrescenta pontos, fotografias e notas; não altera o desenho.",
    reader: "Só consulta."
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ha(n) { return n ? (n >= 100 ? Math.round(n) : n.toFixed(1)).toString().replace(".", ",") + " ha" : ""; }
  function ha_tempo(iso) {
    if (!iso) return "ainda não sincronizado";
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (m < 1) return "sincronizado agora";
    if (m < 60) return "sincronizado há " + m + " min";
    var h = Math.round(m / 60);
    return h < 48 ? "sincronizado há " + h + " h" : "sincronizado há " + Math.round(h / 24) + " dias";
  }

  var CSS =
    ".ipc-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:2px 0 10px}" +
    ".ipc-sinc{font:500 11px var(--mono);letter-spacing:.06em;color:var(--mu)}" +
    ".ipc-ter{border:1px solid var(--ln2);background:var(--p2);border-radius:6px;margin:0 0 8px;overflow:hidden}" +
    ".ipc-ter>button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;gap:2px 8px;width:100%;padding:10px 12px;cursor:pointer}" +
    ".ipc-ter>button:hover{background:var(--p3)}" +
    ".ipc-ter>button:focus-visible{outline:2px solid var(--ac);outline-offset:-2px}" +
    ".ipc-cod{font:600 12px var(--mono);color:var(--ac2)}" +
    ".ipc-nome{font-size:14px;color:var(--tx);grid-column:1}" +
    ".ipc-meta{font:11.5px var(--mono);color:var(--mu);grid-column:1}" +
    ".ipc-papel{grid-column:2;grid-row:1/span 3;align-self:center;font:500 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ac);border:1px solid var(--acs);background:var(--acs);border-radius:4px;padding:3px 7px}" +
    ".ipc-ter .ipc-corpo{display:none;padding:2px 12px 12px;border-top:1px solid var(--ln)}" +
    ".ipc-ter.on .ipc-corpo{display:block}" +
    ".ipc-ter.on{border-color:var(--ac)}" +
    ".ipc-pess{list-style:none;margin:0;padding:0}" +
    ".ipc-pess li{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--ln);font-size:13px;color:var(--tx)}" +
    ".ipc-pess li:last-child{border-bottom:0}" +
    ".ipc-pess i{font:normal 11px var(--mono);color:var(--mu)}" +
    ".ipc-passos{margin:4px 0 0 18px;padding:0;font-size:13px;color:var(--tx);line-height:1.5}" +
    ".ipc-srv{display:flex;gap:6px;margin-top:6px}" +
    ".ipc-srv code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;font:12px var(--mono);background:var(--p3);border:1px solid var(--ln2);border-radius:4px;padding:5px 7px;color:var(--tx)}" +
    ".ipc-acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}" +
    ".ipc-nota{font-size:12.5px;color:var(--mu);margin:6px 0 0}" +
    ".ipc-plano{margin-top:14px;padding-top:10px;border-top:1px solid var(--ln);font-size:13px;color:var(--tx)}";

  function montar() {
    var tabs = document.getElementById("ipe-tabs");
    var conta = document.querySelector('.ipe-pane[data-pane="conta"]') || document.querySelector(".ipe-pane");
    if (!tabs || !conta) return false;
    if (document.querySelector('.ipe-tab[data-tab="cloud"]')) return true;
    var st = document.getElementById("ipc-css") || document.createElement("style");
    if (!st.parentNode) { st.id = "ipc-css"; st.textContent = CSS; document.head.appendChild(st); }

    var b = document.createElement("button");
    b.type = "button";
    b.className = "ipe-tab";
    b.setAttribute("role", "tab");
    b.dataset.tab = "cloud";
    b.setAttribute("aria-selected", "false");
    b.textContent = "Cloud";
    var antes = tabs.querySelector('.ipe-tab[data-tab="conta"]');
    tabs.insertBefore(b, antes || null);

    var p = document.querySelector('.ipe-pane[data-pane="cloud"]') || document.createElement("div");
    p.className = "ipe-pane";
    p.dataset.pane = "cloud";
    p.hidden = true;
    if (!p.parentNode) {
      p.innerHTML = '<div class="ipe-vazio">A carregar…</div>';
      conta.parentNode.insertBefore(p, conta);
    }

    var carregado = !!p.dataset.ok;
    b.addEventListener("click", function () {
      // o Atlas trata de mostrar o painel; aqui só se carrega na primeira vez
      if (!carregado) { carregado = true; p.dataset.ok = "1"; carregar(p); }
    });
    if (new URLSearchParams(location.search).get("separador") === "cloud") setTimeout(function () { b.click(); }, 300);
    return true;
  }

  function carregar(p) {
    fetch(REST + "cloud/meus", { credentials: "same-origin", headers: { "X-WP-Nonce": NONCE } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || "Erro"); return j; }); })
      .then(function (d) { desenhar(p, d); })
      .catch(function (e) {
        p.innerHTML = '<div class="ipe-vazio">Não foi possível ler a Cloud: ' + esc(e.message) + "</div>";
      });
  }

  function desenhar(p, d) {
    var t = d.terrenos || [];
    var h = '<div class="ipc-top"><span class="ipe-lbl" style="margin:0">Os meus terrenos</span>' +
      '<span class="ipc-sinc">' + esc(ha_tempo(d.sincronizado)) + "</span></div>";
    if (d.a_preparar) {
      h += '<div class="ipe-vazio">A preparar a lista. Volte a abrir dentro de um minuto.</div>';
    } else if (!t.length) {
      h += '<div class="ipe-vazio">Ainda não tem terrenos na IPR Cloud. Cada Base Cartográfica e cada projecto ' +
        'da Terracrua Design aparecem aqui, prontos a abrir no QField.</div>';
    }
    t.forEach(function (x, i) {
      var v = x.centro && x.centro.length === 2 ? "/atlas/?v=" + x.centro[1] + "," + x.centro[0] + ",15" : null;
      h += '<div class="ipc-ter" data-i="' + i + '"><button type="button" aria-expanded="false">' +
        '<span class="ipc-cod">' + esc(x.codigo) + "</span>" +
        '<span class="ipc-papel" title="' + esc(AJUDA[x.papel] || "") + '">' + esc(PAPEL[x.papel] || x.papel) + "</span>" +
        '<span class="ipc-nome">' + esc(x.nome || x.local || "Terreno") + "</span>" +
        '<span class="ipc-meta">' + esc([x.local, ha(x.area_ha), x.tipo === "base" ? "Base Cartográfica" : "Projecto"].filter(Boolean).join(" · ")) + "</span>" +
        '</button><div class="ipc-corpo">' +
        '<span class="ipe-lbl">Pessoas</span>' +
        (x.pessoas && x.pessoas.length
          ? '<ul class="ipc-pess">' + x.pessoas.map(function (q) {
              return "<li><span>" + esc(q.nome || "—") + '</span><i title="' + esc(AJUDA[q.papel] || "") + '">' + esc(PAPEL[q.papel] || q.papel) + "</i></li>";
            }).join("") + "</ul>"
          : '<p class="ipc-nota">Só o dono, por agora.</p>') +
        '<p class="ipc-nota">' + esc(AJUDA[x.papel] || "") + "</p>" +
        '<span class="ipe-lbl">Abrir no QField</span>' +
        '<ol class="ipc-passos"><li>Instale o QField no telemóvel ou no tablet.</li>' +
        "<li>No ecrã de entrada, toque duas vezes no logótipo e escreva o endereço do servidor.</li>" +
        "<li>Entre com a sua conta da Terracrua Design e escolha <b>" + esc(x.codigo) + "</b>.</li></ol>" +
        '<div class="ipc-srv"><code>' + esc(d.servidor) + '</code><button type="button" class="ipe-b ipe-b--s" data-copiar="' + esc(d.servidor) + '">Copiar</button></div>' +
        '<div class="ipc-acc">' + (v ? '<a class="ipe-b ipe-b--s ipe-b--ac" href="' + esc(v) + '">Ver no mapa</a>' : "") + "</div>" +
        "</div></div>";
    });
    var pl = d.plano || {};
    if (pl.plano && pl.plano !== "nenhum") {
      h += '<div class="ipc-plano"><span class="ipe-lbl" style="margin-top:0">O seu plano</span>' +
        esc({ base: "Base Cartográfica", designer: "Plano Designer", estudio: "Plano Estúdio", org: "Plano Organização", rede: "Plano Rede" }[pl.plano] || pl.plano) +
        (pl.ate ? " · até " + esc(new Date(pl.ate * 1000).toLocaleDateString("pt-PT")) : "") +
        (pl.gb ? " · até " + esc(pl.gb) + " GB" : "") + "</div>";
    }
    p.innerHTML = h;
    p.addEventListener("click", function (e) {
      var c = e.target.closest("[data-copiar]");
      if (c) {
        try { navigator.clipboard.writeText(c.dataset.copiar); c.textContent = "Copiado"; } catch (er) {}
        return;
      }
      var bt = e.target.closest(".ipc-ter>button");
      if (bt) {
        var box = bt.parentNode, on = !box.classList.contains("on");
        box.classList.toggle("on", on);
        bt.setAttribute("aria-expanded", String(on));
      }
    });
  }

  // o Atlas desenha os separadores depois de arrancar (e volta a desenhá-los ao mudar de modo)
  var n = 0;
  (function tentar() {
    if (montar()) {
      var tabs = document.getElementById("ipe-tabs");
      new MutationObserver(function () { montar(); }).observe(tabs, { childList: true });
    } else if (n++ < 120) setTimeout(tentar, 250);
  })();
})();
