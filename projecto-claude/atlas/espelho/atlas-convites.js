/* Convites a profissionais (m90135): vista no Estúdio. */
(function () {
  "use strict";
  var C = JSON.parse(document.getElementById("tcv-cfg").textContent);
  var app = document.getElementById("tcv-app");
  var EST = { por_convidar: "Por convidar", convidado: "Convidado", seguimento: "Em seguimento", respondeu: "Respondeu", aceitou: "Aceitou", recusou: "Recusou", fora: "Fora da lista" };
  var sel = {}, filtro = { pais: "", pr: "", est: C.filtro === "seguir" ? "seguir" : "", tipo: "", q: "" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function post(acao, dados) {
    var f = new FormData(); f.append("action", acao); f.append("n", C.nonce);
    Object.keys(dados).forEach(function (k) { if (Array.isArray(dados[k])) dados[k].forEach(function (v) { f.append(k + "[]", v); }); else f.append(k, dados[k]); });
    return fetch(C.ajax, { method: "POST", body: f, credentials: "same-origin" }).then(function (r) { return r.json(); });
  }
  function passa(d) {
    if (filtro.pais && (d.pais || "").slice(0, 2).toLowerCase() !== filtro.pais) return false;
    if (filtro.pr && d.prioridade !== filtro.pr) return false;
    if (filtro.tipo && d.tipo !== filtro.tipo) return false;
    if (filtro.est === "seguir") { if (!((d.estado === "convidado" || d.estado === "seguimento") && d.proximo && d.proximo <= C.hoje)) return false; }
    else if (filtro.est && d.estado !== filtro.est) return false;
    if (filtro.q) { var t = (d.nome + " " + d.organizacao + " " + d.regiao + " " + d.profissoes + " " + d.notas).toLowerCase(); if (t.indexOf(filtro.q.toLowerCase()) < 0) return false; }
    return true;
  }
  function conta() { var n = 0, s = 0; C.itens.forEach(function (d) { if ((d.estado === "convidado" || d.estado === "seguimento") && d.proximo && d.proximo <= C.hoje) s++; if (d.estado === "aceitou") n++; }); return { seguir: s, aceitaram: n }; }
  function linha(d) {
    var org = d.organizacao && d.organizacao !== d.nome ? '<small>' + esc(d.organizacao) + '</small>' : '';
    var site = d.site ? '<a href="' + esc(d.site) + '" target="_blank" rel="noopener">site</a>' : '';
    var em = d.email ? '<a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a>' : '<i>sem e-mail</i>';
    var hist = d.hist && d.hist.length ? d.hist.length + ' envio(s), último ' + esc((d.ultimo || "").slice(0, 10)) + (d.codigo ? ' · ' + esc(d.codigo) : '') : '';
    return '<tr data-id="' + d.id + '" class="pr-' + esc(d.prioridade) + ' es-' + esc(d.estado) + '">' +
      '<td><input type="checkbox" data-sel' + (sel[d.id] ? ' checked' : '') + (d.estado === "aceitou" || d.estado === "recusou" || d.estado === "fora" ? ' disabled' : '') + '></td>' +
      '<td><b>' + esc(d.nome) + '</b>' + org + '<div class="l">' + site + ' ' + em + (d.telefone ? ' · ' + esc(d.telefone) : '') + '</div></td>' +
      '<td>' + esc(d.pais) + '<br><small>' + esc(d.regiao) + '</small></td>' +
      '<td><small>' + esc(d.profissoes) + '</small><div class="n">' + esc(d.notas) + '</div></td>' +
      '<td>' + esc(d.tipo) + '<br><small>conf. ' + esc(d.confianca) + '</small></td>' +
      '<td><select data-pr>' + ["A", "B", "C"].map(function (p) { return '<option' + (d.prioridade === p ? ' selected' : '') + '>' + p + '</option>'; }).join("") + '</select></td>' +
      '<td><select data-est>' + Object.keys(EST).map(function (k) { return '<option value="' + k + '"' + (d.estado === k ? ' selected' : '') + '>' + EST[k] + '</option>'; }).join("") + '</select><div class="l">' + hist + '</div>' +
      '<label class="l">seguir em <input type="date" data-prox value="' + esc(d.proximo) + '"></label></td>' +
      '<td><textarea data-nota rows="2" placeholder="Nota">' + esc(d.nota_nuno) + '</textarea></td></tr>';
  }
  function render() {
    var c = conta();
    var lista = C.itens.filter(passa);
    var h = '<div class="tcv-top">' +
      '<label>País <select data-f="pais"><option value="">todos</option><option value="pt">Portugal</option><option value="es">Espanha</option></select></label>' +
      '<label>Prioridade <select data-f="pr"><option value="">todas</option><option>A</option><option>B</option><option>C</option></select></label>' +
      '<label>Estado <select data-f="est"><option value="">todos</option><option value="seguir">Para seguir hoje (' + c.seguir + ')</option>' + Object.keys(EST).map(function (k) { return '<option value="' + k + '">' + EST[k] + '</option>'; }).join("") + '</select></label>' +
      '<label>Tipo <select data-f="tipo"><option value="">todos</option><option value="empresa">empresa</option><option value="pessoa">pessoa</option><option value="desconhecido">desconhecido</option></select></label>' +
      '<label>Procurar <input type="search" data-f="q" placeholder="nome, região, profissão"></label>' +
      '<span class="m">' + lista.length + ' na lista · ' + Object.keys(sel).filter(function (k) { return sel[k]; }).length + ' marcados · ' + c.aceitaram + ' aceitaram</span></div>';
    h += '<div class="tcv-of"><b>Oferta para os marcados:</b> ' + Object.keys(C.ofertas).map(function (k) { return '<label><input type="checkbox" data-of value="' + k + '"' + (k === "designer3" || k === "base100" ? ' checked' : '') + '> ' + esc(C.ofertas[k]) + '</label>'; }).join(" ") +
      ' <label><input type="checkbox" data-seg> é seguimento (segunda mensagem)</label> <button type="button" class="b" data-prep>Preparar envio</button> <button type="button" class="b s" data-todos>Marcar os da lista</button> <button type="button" class="b s" data-nenhum>Desmarcar</button></div>';
    h += '<div id="tcv-conf"></div>';
    h += '<table><thead><tr><th></th><th>Quem</th><th>Onde</th><th>O que faz</th><th>Tipo</th><th>Pr.</th><th>Estado</th><th>Nota</th></tr></thead><tbody>' + lista.map(linha).join("") + '</tbody></table>';
    app.innerHTML = h;
    app.querySelectorAll("[data-f]").forEach(function (el) { el.value = filtro[el.dataset.f]; });
  }
  function guardar(id, campos) { return post("tcd_cv_guardar", Object.assign({ id: id }, campos)).then(function (j) { if (j && j.success) { var i = C.itens.findIndex(function (x) { return x.id == id; }); if (i >= 0) C.itens[i] = Object.assign(C.itens[i], j.data); } }); }
  app.addEventListener("change", function (ev) {
    var t = ev.target, tr = t.closest("tr");
    if (t.dataset.f !== undefined) { filtro[t.dataset.f] = t.value; render(); return; }
    if (t.matches("[data-sel]")) { sel[tr.dataset.id] = t.checked; render(); return; }
    if (t.matches("[data-pr]")) guardar(tr.dataset.id, { prioridade: t.value });
    if (t.matches("[data-est]")) guardar(tr.dataset.id, { estado: t.value });
    if (t.matches("[data-prox]")) guardar(tr.dataset.id, { proximo: t.value });
    if (t.matches("[data-nota]")) guardar(tr.dataset.id, { nota_nuno: t.value });
  });
  app.addEventListener("input", function (ev) { if (ev.target.dataset.f === "q") { filtro.q = ev.target.value; clearTimeout(app._t); app._t = setTimeout(render, 250); } });
  app.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-todos")) { C.itens.filter(passa).forEach(function (d) { if (["aceitou", "recusou", "fora"].indexOf(d.estado) < 0) sel[d.id] = true; }); render(); }
    if (b.hasAttribute("data-nenhum")) { sel = {}; render(); }
    if (b.hasAttribute("data-prep")) preparar();
    if (b.hasAttribute("data-enviar")) enviar();
    if (b.hasAttribute("data-cancelar")) document.getElementById("tcv-conf").innerHTML = "";
  });
  function escolhidos() { return C.itens.filter(function (d) { return sel[d.id]; }); }
  function ofertas() { return Array.prototype.map.call(app.querySelectorAll("[data-of]:checked"), function (c) { return c.value; }); }
  function preparar() {
    var e = escolhidos(), of = ofertas(), box = document.getElementById("tcv-conf");
    if (!e.length || !of.length) { box.innerHTML = '<p class="aviso">Marque pelo menos um convidado e uma oferta.</p>'; return; }
    var site = e.filter(function (d) { return d.tipo === "empresa" && d.email; }), mao = e.filter(function (d) { return !(d.tipo === "empresa" && d.email); });
    box.innerHTML = '<div class="conf"><h2>Confirmar o envio</h2><p>' + e.length + ' convidado(s). Oferta: <b>' + of.map(function (k) { return esc(C.ofertas[k]); }).join(", ") + '</b>.' +
      (app.querySelector("[data-seg]").checked ? ' Mensagem de seguimento.' : '') + '</p>' +
      '<p><b>' + site.length + '</b> recebem o e-mail pelo site (empresas com e-mail): ' + esc(site.map(function (d) { return d.nome; }).join("; ")) + '</p>' +
      '<p><b>' + mao.length + '</b> ficam para enviar à mão (pessoas singulares ou sem e-mail): ' + esc(mao.map(function (d) { return d.nome; }).join("; ")) + '</p>' +
      '<p class="m">Cada um recebe um código PRO-XXXXXX pessoal, válido 60 dias, ligado ao seu e-mail. Ao activar, a oferta é ligada à conta e o convidado passa a «Aceitou». Sem resposta em 30 dias, entra em «Para seguir».</p>' +
      '<p><button type="button" class="b" data-enviar>Confirmar e enviar</button> <button type="button" class="b s" data-cancelar>Cancelar</button></p><div id="tcv-res"></div></div>';
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function enviar() {
    var e = escolhidos(), of = ofertas(), res = document.getElementById("tcv-res"), btn = app.querySelector("[data-enviar]");
    btn.disabled = true; res.textContent = "A enviar…";
    post("tcd_cv_enviar", { ids: e.map(function (d) { return d.id; }), ofertas: of, seguimento: app.querySelector("[data-seg]").checked ? 1 : 0 }).then(function (j) {
      if (!j || !j.success) { res.innerHTML = '<p class="aviso">' + esc(j && j.data ? j.data : "Não foi possível enviar.") + '</p>'; btn.disabled = false; return; }
      var h = '<p><b>' + j.data.enviados + '</b> enviados pelo site. <b>' + j.data.amao + '</b> para enviar à mão:</p>';
      j.data.itens.forEach(function (it) {
        if (it.canal === "mao") h += '<details><summary>' + esc(it.nome) + ' · ' + esc(it.email || "sem e-mail") + ' · ' + esc(it.codigo) + (it.mailto ? ' · <a href="' + esc(it.mailto) + '">abrir no e-mail</a>' : '') + '</summary><textarea rows="12" readonly>' + esc(it.mensagem) + '</textarea></details>';
        else if (it.canal === "falhou") h += '<p class="aviso">Falhou o envio a ' + esc(it.nome) + ' (' + esc(it.email) + ').</p>';
      });
      res.innerHTML = h;
      j.data.itens.forEach(function (it) { var i = C.itens.findIndex(function (x) { return x.id == it.id; }); if (i >= 0) { C.itens[i].estado = app.querySelector("[data-seg]").checked ? "seguimento" : "convidado"; C.itens[i].codigo = it.codigo; C.itens[i].ultimo = C.hoje; C.itens[i].proximo = ""; C.itens[i].hist = (C.itens[i].hist || []).concat([{}]); } });
      sel = {};
    });
  }
  render();
})();
