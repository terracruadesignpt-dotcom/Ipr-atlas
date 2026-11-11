/* IPR Atlas · lote.js (05/11/2026). Terracrua Design.
   Nuno, 05/11/2026, 11h10: «Isto continua muito lento.» Cada pedido ao site custa 1,5 a 3 s só a arrancar o PHP, e o
   Atlas fazia cerca de 25 ao abrir, alguns repetidos (m599/estado três vezes, m90553/impl duas).
   Este guião, carregado antes dos outros, faz duas coisas aos pedidos de leitura (GET) às rotas da lista:
     1. pedidos iguais feitos com menos de 20 s de intervalo recebem a mesma resposta (sem novo pedido);
     2. os que saem ao mesmo tempo (dentro de 80 ms) vão juntos num só pedido ao m90905 (POST /tcd/v1/m905/lote).
   Qualquer escrita (POST) a tcd/v1 apaga a memória dos 20 s, para nunca se ver um estado antigo depois de uma mudança.
   Se o lote falhar, cada pedido segue sozinho, como antes, e o lote fica desligado até recarregar a página.
   Desligar: ?lote=0.
   11/11/2026 (Nuno: «não pode acontecer»):
     a) Chave da sessão caducada (Atlas aberto há mais de um dia): o site respondia 403 ao lote e a todos os pedidos que
        se seguiam, e a pessoa ficava sem os seus mapas até recarregar. Agora, ao primeiro 403 de chave inválida, pede uma
        chave nova ao site (admin-ajax rest-nonce), actualiza a da página e repete o pedido uma vez.
     b) m599/estado (só para a equipa): depois de um 403, este navegador não volta a pedi-lo durante 12 h; a resposta
        de recusa é dada aqui, sem ir ao servidor (eram cerca de 190 pedidos inúteis por dia). */
(function () {
  "use strict";
  var W = window;
  if (W.__iprLote) return;
  try { if (/[?&]lote=0\b/.test(location.search)) return; } catch (e) {}
  var ROTAS = ["m599/estado", "m90553/impl", "m735/tipos", "m736/estado", "meus-mapas", "cloud/meus", "projecto/gestao",
    "projecto/arquivados", "org/projectos", "org/grupos-meus", "mundo/estado", "fogo/aviso", "agua/estado", "projectos",
    "m904/fichas", "pfich"];
  var BASE = "/wp-json/tcd/v1/", orig = W.fetch.bind(W), MEM = {}, FILA = [], T = 0, OFF = false, N = { lote: 0, juntos: 0, mem: 0, chave: 0, m599: 0 };
  // a) chave nova da sessão: um só pedido de cada vez; devolve true se a página passou a ter uma chave válida
  var NOVA = null, FRESCA = "";
  function chaveNova() {
    if (NOVA) return NOVA;
    NOVA = orig("/wp-admin/admin-ajax.php?action=rest-nonce", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (t) {
        t = String(t || "").trim();
        if (!/^[a-f0-9]{8,12}$/i.test(t)) return false;
        W.tcdNonce = FRESCA = t; N.chave++;
        try { if (W.wpApiSettings) W.wpApiSettings.nonce = t; } catch (e) {}
        return true;
      })
      .catch(function () { return false; })
      .then(function (ok) { setTimeout(function () { NOVA = null; }, 60000); return ok; });
    return NOVA;
  }
  function comChave(o) {
    var x = {}; o = o || {}; for (var k in o) x[k] = o[k];
    var c = FRESCA || W.tcdNonce; if (FRESCA) W.tcdNonce = FRESCA;
    var h = new Headers(o.headers || {}); if (c) h.set("X-WP-Nonce", c); x.headers = h; return x;
  }
  function chaveMa(r) {
    if (!r || r.status !== 403) return Promise.resolve(false);
    return r.clone().json().then(function (j) { return !!j && j.code === "rest_cookie_invalid_nonce"; }, function () { return false; });
  }
  // pedido isolado com nova tentativa se a chave estiver caducada
  function isolado(u, o) {
    return orig(u, o).then(function (r) {
      return chaveMa(r).then(function (ma) {
        if (!ma) return r;
        return chaveNova().then(function (ok) { return ok ? orig(u, comChave(o)) : r; });
      });
    });
  }
  // b) m599/estado recusado: lembrado 12 h neste navegador
  var M599 = "ipr_m599_recusado";
  function m599Recusado() { try { var t = +localStorage.getItem(M599) || 0; return Date.now() - t < 43200000; } catch (e) { return false; } }
  function m599Marcar() { try { localStorage.setItem(M599, String(Date.now())); } catch (e) {} }
  W.__iprLote = N;

  function chave(u) {
    // devolve "rota?query" normalizada, ou "" se o pedido não é para o lote
    var a; try { a = new URL(u, location.href); } catch (e) { return ""; }
    if (a.origin !== location.origin || a.pathname.indexOf(BASE) !== 0) return "";
    var p = a.pathname.slice(BASE.length).replace(/\/+$/, "");
    if (ROTAS.indexOf(p) < 0) return "";
    a.searchParams.delete("_wpnonce"); a.searchParams.delete("_"); a.searchParams.sort();
    var q = a.searchParams.toString().replace(/%2C/gi, ",");
    return p + (q ? "?" + q : "");
  }
  function resposta(s, d) { if (s === 204 || s === 304) return new Response(null, { status: s }); return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json; charset=UTF-8" } }); }
  function enviar() {
    T = 0;
    var f = FILA; FILA = [];
    if (!f.length) return;
    if (f.length === 1 || OFF) { f.forEach(function (x) { isolado(x.u, x.o).then(x.ok, x.nao); }); return; }
    N.lote++; N.juntos += f.length;
    var pedirLote = function () { return orig(BASE + "m905/lote", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-WP-Nonce": W.tcdNonce || "" }, body: JSON.stringify({ r: f.map(function (x) { return x.k; }) }) }); };
    pedirLote()
      .then(function (r) { return chaveMa(r).then(function (ma) { return ma ? chaveNova().then(function (ok) { if (ok) { f.forEach(function (x) { x.o = comChave(x.o); }); return pedirLote(); } return r; }) : r; }); })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var r = j && j.r; if (!r || r.length !== f.length) throw new Error("lote");
        f.forEach(function (x, i) { x.ok(resposta(r[i].s, r[i].d)); });
      })
      .catch(function () { OFF = true; f.forEach(function (x) { isolado(x.u, x.o).then(x.ok, x.nao); }); });
  }
  // Contador do Atendimento (m90682, admin-ajax tcd_atd_eq op=lista): perguntava de 30 em 30 s, ~1,7 s de PHP cada vez.
  // Com o painel fechado passa a ir ao site no máximo de 2 em 2 minutos; nos intervalos repete a última resposta.
  var ATD = null;
  function atendimento(u, o) {
    var b = o && o.body;
    if (!(b instanceof FormData) || b.get("action") !== "tcd_atd_eq") return null;
    if (b.get("op") !== "lista") { ATD = null; return null; }
    var w = D_("tcdatdq"); if (w && !w.hidden) { ATD = null; return null; }
    if (ATD && Date.now() - ATD.t < 115000) { N.mem++; return ATD.p.then(function (x) { return resposta(x.s, x.d); }); }
    var p = orig(u, o).then(function (r) { return r.clone().json().catch(function () { return null; }).then(function (d) { return { s: r.status, d: d, r: r }; }); });
    ATD = { t: Date.now(), p: p };
    p.then(function (x) { if (x.s >= 400 || x.d === null) ATD = null; }, function () { ATD = null; });
    return p.then(function (x) { return x.r; });
  }
  function D_(id) { return document.getElementById(id); }
  W.fetch = function (u, o) {
    var m = String((o && o.method) || (u && u.method) || "GET").toUpperCase();
    var url = typeof u === "string" ? u : (u && u.url) || "";
    if (m === "POST" && url.indexOf("admin-ajax.php") >= 0) { var a = atendimento(u, o); if (a) return a; }
    if (m !== "GET") {
      if (url && url.indexOf(BASE) >= 0) { MEM = {}; if (W.tcdNonce && typeof u === "string") return isolado(u, o); }
      return orig(u, o);
    }
    if (typeof u !== "string" && !(u instanceof URL)) return orig(u, o);
    var k = chave(String(u));
    if (!k) return (W.tcdNonce && String(u).indexOf(BASE) >= 0) ? isolado(u, o) : orig(u, o);
    if (!W.tcdNonce) return orig(u, o);
    if (k.indexOf("m599/estado") === 0 && m599Recusado()) { N.m599++; return Promise.resolve(resposta(403, { code: "rest_forbidden", message: "Só para a equipa.", data: { status: 403 } })); }
    var c = MEM[k];
    if (c && Date.now() - c.t < 20000) { N.mem++; return c.p.then(function (x) { return resposta(x.s, x.d); }); }
    var p = new Promise(function (ok, nao) {
      FILA.push({ k: k, u: u, o: o, ok: ok, nao: nao });
      if (FILA.length >= 16) { clearTimeout(T); enviar(); } else if (!T) T = setTimeout(enviar, 80);
    }).then(function (r) {
      return r.clone().json().catch(function () { return null; }).then(function (d) { return { s: r.status, d: d, r: r }; });
    });
    MEM[k] = { t: Date.now(), p: p };
    p.then(function (x) { if (x.s === 403 && k.indexOf("m599/estado") === 0) m599Marcar(); if (x.s >= 400 || x.d === null) delete MEM[k]; }, function () { delete MEM[k]; });
    return p.then(function (x) { return x.r; });
  };
})();
