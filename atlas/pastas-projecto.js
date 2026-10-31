/* IPR Atlas · Três pastas nos ficheiros dos projectos (pedido do Nuno, 31/10/2026, 02h17: «só três pastas, Base Cartográfica,
   Design Terracrua Design e Implementação; facturas, recibos, proposta comercial e informação de arranque saem dos projectos»).
   Acrescenta às caixas «Ficheiros do projecto» e «Ficheiros da organização» do §74 do ajustes.js (.ipr-pf73), sem mexer nele:
   1. A escolha de pasta para carregar passa a ter só as três (Design por omissão).
   2. A lista do §74 é substituída por esta: as três pastas sempre à vista, cada ficheiro com Abrir, Descarregar, Retirar e
      «Mover para» (só para quem gere o projecto: o servidor responde «pode»). Mover usa POST /tcd/v1/pfich/pasta (m90381 v2),
      que só muda a pasta; o ficheiro e o sha256 ficam iguais.
   3. As pastas antigas lêem-se como no servidor: 0.3, 0.4 e sem pasta em Design, 0.5 em Implementação; 0.0 a 0.2 só aparecem
      à equipa («Fora dos projectos»), se o servidor as mandar.
   A lista volta a pedir-se quando a caixa abre e quando o §74 refaz a sua (depois de carregar ou retirar).
   Desligar: window.IPR_PASTAS_OFF = true ou ?pastas=0. Texto escapado (textContent). Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.__iprPastas || W.IPR_PASTAS_OFF) return;
  try { if (new URLSearchParams(location.search).get("pastas") === "0") return; } catch (e) {}
  W.__iprPastas = 1;
  if (!W.tcdNonce) return;

  var PASTAS = [["base", "Base Cartográfica"], ["design", "Design Terracrua Design"], ["impl", "Implementação"]];
  var ANTIGAS = { "": "design", "0.3": "design", "0.4": "design", "0.5": "impl", "0.0": "fora", "0.1": "fora", "0.2": "fora" };
  function chave(p) { p = String(p == null ? "" : p); return PASTAS.some(function (x) { return x[0] === p; }) || p === "fora" ? p : (ANTIGAS[p] || "design"); }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function api(rota, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": W.tcdNonce || "" }, op.headers || {});
    return fetch("/wp-json/tcd/v1/" + rota, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j && j.message) || ("Erro " + r.status)); return j; }); });
  }
  function tam(b) { b = +b || 0; return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }

  var CSS = ".ipr-pf73.ipr-pp-on>.c>.l{display:none}" +
    ".ipr-pp .pg{display:flex;justify-content:space-between;gap:8px;font:600 10.5px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mu,#9aa08f);margin:8px 0 4px}" +
    ".ipr-pp .pg i{font-style:normal;color:var(--ac,#b5c46a)}.ipr-pp .vz{font-size:12px;color:var(--mu,#9aa08f);padding:2px 6px 4px}" +
    ".ipr-pp ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}" +
    ".ipr-pp li{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:5px 6px;border-radius:6px;background:var(--p2,#1d221c)}" +
    ".ipr-pp li .n{flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ipr-pp li small{color:var(--mu,#9aa08f);white-space:nowrap}" +
    ".ipr-pp li a,.ipr-pp li button{all:unset;cursor:pointer;font:600 11.5px Inter,sans-serif;color:var(--ac,#b5c46a)}.ipr-pp li button.r{color:#d9725b}" +
    ".ipr-pp li select{font:11.5px Inter,sans-serif;background:var(--p2,#1d221c);color:var(--tx);border:1px solid var(--ln,#2c312a);border-radius:6px;padding:2px 4px;max-width:100%}" +
    ".ipr-pp .m{color:var(--mu,#9aa08f);font-size:12px;min-height:1em}";
  function css() { if (D.getElementById("ipr-pp-css")) return; var s = el("style"); s.id = "ipr-pp-css"; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }

  // A escolha de pasta para carregar: só as três, Design por omissão.
  function escolha(d) {
    var s = d.querySelector(".ps"); if (!s || s.getAttribute("data-pp") === "1") return;
    s.textContent = "";
    PASTAS.forEach(function (p) { var o = el("option", "", p[1]); o.value = p[0]; s.appendChild(o); });
    s.value = "design"; s.setAttribute("data-pp", "1");
  }

  function montar(d) {
    if (d.__pp) return;
    var c = d.querySelector(".c"), L = d.querySelector(".l"); if (!c || !L) return;
    d.__pp = { a: 0 };
    d.classList.add("ipr-pp-on");
    var caixa = el("div", "ipr-pp"), msg = el("div", "m"); msg.setAttribute("role", "status");
    caixa.appendChild(msg); var lista = el("div"); caixa.appendChild(lista);
    c.appendChild(caixa);
    escolha(d);
    function pedir() {
      var alvo = d.dataset.alvo; if (!alvo) return;
      var n = ++d.__pp.a;
      api("pfich?alvo=" + encodeURIComponent(alvo)).then(function (j) { if (n === d.__pp.a) desenhar(j); }).catch(function (e) { if (n === d.__pp.a) { lista.textContent = ""; lista.appendChild(el("div", "vz", e.message)); } });
    }
    function desenhar(j) {
      var fs = j.ficheiros || [], pode = !!j.pode, grupos = {};
      fs.forEach(function (f) { var k = chave(f.pasta); (grupos[k] = grupos[k] || []).push(f); });
      var ps = PASTAS.slice(); if (grupos.fora) ps.push(["fora", (j.pastas && j.pastas.fora) || "Fora dos projectos (0.0 a 0.2)"]);
      lista.textContent = "";
      ps.forEach(function (p) {
        var g = grupos[p[0]] || [], cab = el("div", "pg"); cab.appendChild(el("span", "", p[1])); cab.appendChild(el("i", "", g.length || "")); lista.appendChild(cab);
        if (!g.length) { lista.appendChild(el("div", "vz", "Vazia.")); return; }
        var ul = el("ul");
        g.forEach(function (f) {
          var li = el("li"); li.setAttribute("data-pp-id", f.id);
          var nm = el("span", "n", f.nome); nm.title = f.nome; li.appendChild(nm);
          li.appendChild(el("small", "", tam(f.tamanho) + " · " + String(f.quando || "").slice(0, 10).split("-").reverse().join("/") + (f.por ? " · " + f.por : "")));
          var u = String(f.url || ""); if (u) {
            var a1 = el("a", "", "Abrir"); a1.href = u + "&_wpnonce=" + encodeURIComponent(W.tcdNonce || ""); a1.target = "_blank"; a1.rel = "noopener"; li.appendChild(a1);
            var a2 = el("a", "", "Descarregar"); a2.href = u + "&dl=1&_wpnonce=" + encodeURIComponent(W.tcdNonce || ""); li.appendChild(a2);
          }
          if (pode) {
            var s = el("select"); s.setAttribute("aria-label", "Mover «" + f.nome + "» para");
            var o0 = el("option", "", "Mover para…"); o0.value = ""; s.appendChild(o0);
            PASTAS.forEach(function (q) { if (q[0] === p[0]) return; var o = el("option", "", q[1]); o.value = q[0]; s.appendChild(o); });
            s.setAttribute("data-pp-mover", f.id); li.appendChild(s);
          }
          if (f.meu || pode) { var r = el("button", "r", "Retirar"); r.type = "button"; r.setAttribute("data-pp-r", f.id); li.appendChild(r); }
          ul.appendChild(li);
        });
        lista.appendChild(ul);
      });
    }
    caixa.addEventListener("change", function (e) {
      var s = e.target; if (!s || !s.getAttribute || !s.getAttribute("data-pp-mover") || !s.value) return;
      var id = +s.getAttribute("data-pp-mover"), para = s.value; s.disabled = true;
      api("pfich/pasta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, pasta: para }) }).then(function () {
        msg.textContent = "Movido para «" + PASTAS.filter(function (q) { return q[0] === para; })[0][1] + "»."; pedir();
      }).catch(function (x) { msg.textContent = x.message; s.disabled = false; s.value = ""; });
    });
    caixa.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-pp-r]"); if (!b) return;
      if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = "Confirmar retirar"; setTimeout(function () { b.dataset.c = ""; b.textContent = "Retirar"; }, 4000); return; }
      b.disabled = true;
      api("pfich/retirar?id=" + b.getAttribute("data-pp-r"), { method: "POST" }).then(pedir).catch(function (x) { msg.textContent = x.message; b.disabled = false; });
    });
    d.addEventListener("toggle", function () { if (d.open) pedir(); });
    // O §74 refaz a sua lista depois de carregar ou retirar: esta acompanha.
    try { new MutationObserver(function () { clearTimeout(d.__pp.t); d.__pp.t = setTimeout(pedir, 150); }).observe(L, { childList: true }); } catch (e) {}
    if (d.open) pedir();
  }

  function ciclo() {
    try { css(); D.querySelectorAll("details.ipr-pf73").forEach(function (d) { montar(d); escolha(d); }); } catch (e) {}
  }
  setInterval(function () { if (!D.hidden) ciclo(); }, 1500);
  setTimeout(ciclo, 600);
  W.IPRPastas = { _t: { chave: chave } };
})();
