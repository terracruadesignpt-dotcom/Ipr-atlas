/* IPR Atlas · objectos-3d.js (11/11/2026). Pedido do Nuno, 01h01: «gostava que as pessoas pudessem trazer objetos 3D para
   cima do seu 3D da propriedade». Caixa às 01h2x: «Só Intelligence e equipa».
   Na Ficha da propriedade (separador Resumo) aparece «Objectos 3D». Carrega-se um ficheiro glTF binário (.glb, até 25 MB;
   o SketchUp, o Blender, o Rhino e o Revit exportam-no), escolhe-se o sítio no mapa, a rotação, a escala e a altura,
   e grava-se na Base (módulo m91532). Os objectos aparecem a quem abre a Base, no mapa principal e na vista 3D da ficha,
   assentes no relevo. Desenha-se com three.js (r147) numa camada própria do MapLibre.
   Desligar: window.IPR_OBJ3D_OFF = true ou ?obj3d=0. Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (W.IPR_OBJ3D_OFF || /[?&]obj3d=0(&|$)/.test(location.search)) return; } catch (e) {}
  if (W.__iprObj3d || !W.tcdNonce) return; W.__iprObj3d = 1;

  var THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js";
  var GLTF_URL = "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js";
  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en"; }
  function T(a, b) { return en() ? b : a; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function est() { return W.__ipe && W.__ipe.estado; }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function rest(caminho, corpo) {
    var o = { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } };
    if (corpo instanceof FormData) { o.method = "POST"; o.body = corpo; }
    else if (corpo) { o.method = "POST"; o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(corpo); }
    return fetch("/wp-json/tcd/v1/" + caminho, o).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || j.code) throw new Error((j && j.message) || ("HTTP " + r.status)); return j; }); });
  }

  // ---------- three.js, carregado só quando há objectos ----------
  var tP = null;
  function script(u) { return new Promise(function (ok, no) { var s = D.createElement("script"); s.src = u; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = function () { no(new Error(u)); }; D.head.appendChild(s); }); }
  function three() {
    if (W.THREE && W.THREE.GLTFLoader) return Promise.resolve(W.THREE);
    if (tP) return tP;
    var amd = W.define && W.define.amd ? W.define : null; if (amd) W.define = undefined;
    tP = (W.THREE ? Promise.resolve() : script(THREE_URL)).then(function () { return script(GLTF_URL); })
      .then(function () { if (amd) W.define = amd; return W.THREE; }, function (e) { if (amd) W.define = amd; tP = null; throw e; });
    return tP;
  }

  // ---------- modelos ----------
  var BASES = {};   // enc -> { editar, objectos:[...], cenas: {id: THREE.Scene} }
  function carregarBase(enc) {
    if (BASES[enc] && BASES[enc].p) return BASES[enc].p;
    var B = BASES[enc] = BASES[enc] || { objectos: [], cenas: {}, editar: false };
    B.p = rest("base-obj3d?enc=" + enc).then(function (j) {
      B.editar = !!j.editar; B.objectos = j.objectos || [];
      if (!B.objectos.length) return B;
      return three().then(function () { return Promise.all(B.objectos.map(function (o) { return cena(enc, o); })); }).then(function () { redesenhar(); return B; });
    }).catch(function () { return B; });
    return B.p;
  }
  function cena(enc, o) {
    var B = BASES[enc]; if (B.cenas[o.id]) return Promise.resolve(B.cenas[o.id]);
    return fetch("/wp-json/tcd/v1/base-obj3d/glb?enc=" + enc + "&id=" + o.id, { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(function (buf) { return new Promise(function (ok, no) { new W.THREE.GLTFLoader().parse(buf, "", function (g) { ok(g); }, no); }); })
      .then(function (g) {
        var s = new W.THREE.Scene();
        var l1 = new W.THREE.DirectionalLight(0xffffff, 1.1); l1.position.set(0.5, 1, 0.8); s.add(l1);
        var l2 = new W.THREE.HemisphereLight(0xffffff, 0x8a8a70, 1.1); s.add(l2); s.add(new W.THREE.AmbientLight(0xffffff, 0.45));
        s.add(g.scene); B.cenas[o.id] = s; return s;
      }).catch(function () { return null; });
  }

  // ---------- camada de desenho (uma por mapa) ----------
  var MAPAS = [];
  function encDoMapa(m) {
    try { var c = m.getContainer().closest(".ipe-card"); if (c) { var E = est(), p = E && E.mapas && E.mapas[+c.getAttribute("data-i")]; return p ? +p.id : 0; } } catch (e) {}
    return 0;
  }
  function camada(m) {
    var renderer = null, camera = null;
    return {
      id: "obj3d", type: "custom", renderingMode: "3d",
      onAdd: function (map, gl) {
        camera = new W.THREE.Camera();
        renderer = new W.THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
        renderer.autoClear = false;
      },
      render: function (gl, args) {
        if (!renderer) return;
        var M = new W.THREE.Matrix4().fromArray((args && args.defaultProjectionData && args.defaultProjectionData.mainMatrix) || args);
        var encs = Object.keys(BASES), so = encDoMapa(m);
        encs.forEach(function (k) {
          if (so && +k !== so) return;
          var B = BASES[k];
          (B.objectos || []).forEach(function (o) {
            var s = B.cenas[o.id]; if (!s) return;
            var h = 0; try { h = (m.getTerrain && m.getTerrain()) ? (m.queryTerrainElevation([o.lon, o.lat]) || 0) : 0; } catch (e) {}
            var mc = W.maplibregl.MercatorCoordinate.fromLngLat([o.lon, o.lat], h + (+o.alt || 0));
            var u = mc.meterInMercatorCoordinateUnits() * (+o.escala || 1);
            var ex = 1; try { ex = (m.getTerrain && m.getTerrain() && m.getTerrain().exaggeration) || 1; } catch (e) {}
            var L = new W.THREE.Matrix4().makeTranslation(mc.x, mc.y, mc.z)
              .scale(new W.THREE.Vector3(u, -u, u * ex))
              .multiply(new W.THREE.Matrix4().makeRotationAxis(new W.THREE.Vector3(1, 0, 0), Math.PI / 2))
              .multiply(new W.THREE.Matrix4().makeRotationAxis(new W.THREE.Vector3(0, 1, 0), -(+o.rot || 0) * Math.PI / 180));
            camera.projectionMatrix = M.clone().multiply(L);
            renderer.resetState(); renderer.render(s, camera);
          });
        });
      }
    };
  }
  function montar(m) {
    if (!m || m.__iprO3) return; m.__iprO3 = 1; MAPAS.push(m);
    function poe() { if (!vivo(m)) return; try { if (W.THREE && !m.getLayer("obj3d") && Object.keys(BASES).some(function (k) { return BASES[k].objectos.length; })) m.addLayer(camada(m)); } catch (e) {} }
    m.on("styledata", function () { if (vivo(m) && !m.getLayer("obj3d")) setTimeout(poe, 60); });
    m.__iprO3poe = poe; poe();
    var enc = encDoMapa(m); if (enc) carregarBase(enc);
  }
  function vivo(m) { try { return !m._removed && m.getContainer() && m.getContainer().isConnected; } catch (e) { return false; } }
  function redesenhar() { MAPAS.forEach(function (m) { if (!vivo(m)) return; try { if (!m.getLayer("obj3d") && m.__iprO3poe) m.__iprO3poe(); m.triggerRepaint(); } catch (e) {} }); }

  // ---------- painel ----------
  var P = null, S = { enc: 0, sel: "", mover: false, msg: "" };
  function css() {
    if (D.getElementById("ipr-o3-css")) return;
    var st = D.createElement("style"); st.id = "ipr-o3-css";
    st.textContent = "#ipr-o3{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:60;width:min(560px,calc(100vw - 32px));max-height:60vh;overflow:auto;background:#1d2118;color:#ebe7d8;border:1px solid rgba(148,190,57,.5);border-radius:12px;padding:12px 14px;font:13px/1.45 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}" +
      "#ipr-o3 h4{margin:0 0 8px;font:600 14px Outfit,Inter,sans-serif;display:flex;justify-content:space-between;gap:8px}#ipr-o3 button{font:600 12px Inter,sans-serif;padding:6px 10px;border-radius:7px;border:1px solid rgba(235,231,216,.25);background:transparent;color:inherit;cursor:pointer}" +
      "#ipr-o3 button.pri{background:#94be39;color:#141513;border-color:#94be39}#ipr-o3 .l{display:flex;flex-direction:column;gap:6px;margin:8px 0}#ipr-o3 .o{border:1px solid rgba(235,231,216,.15);border-radius:8px;padding:8px}#ipr-o3 .o.sel{border-color:#94be39}" +
      "#ipr-o3 .o .r{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px}#ipr-o3 label{display:flex;gap:6px;align-items:center}#ipr-o3 input[type=number]{width:72px;background:#141513;color:inherit;border:1px solid rgba(235,231,216,.25);border-radius:6px;padding:4px 6px}" +
      "#ipr-o3 .m{opacity:.8;font-size:12px}#ipr-o3 .av{margin-top:6px;color:#b5d86a}.ipr-o3-abrir{display:block;width:100%;margin:8px 0 0;padding:9px 12px;border-radius:8px;border:1px solid rgba(148,190,57,.6);background:transparent;color:inherit;font:600 13px/1.2 Inter,system-ui,sans-serif;cursor:pointer;text-align:left}.ipr-o3-abrir:hover{background:rgba(148,190,57,.12)}";
    D.head.appendChild(st);
  }
  function painel() {
    css();
    if (!P) { P = D.createElement("div"); P.id = "ipr-o3"; D.body.appendChild(P); P.addEventListener("click", clique); P.addEventListener("change", muda); }
    var B = BASES[S.enc] || { objectos: [] };
    var h = "<h4><span>" + T("Objectos 3D", "3D objects") + " · " + esc(S.nome || "") + "</span><button type='button' data-a='fechar' aria-label='" + T("Fechar", "Close") + "'>×</button></h4>";
    if (B.editar) h += "<div><label><input type='file' accept='.glb,model/gltf-binary' data-a='ficheiro' hidden><button type='button' class='pri' data-a='escolher'>" + T("Carregar objecto (.glb, até 25 MB)", "Upload object (.glb, up to 25 MB)") + "</button></label><div class='m'>" +
      T("Exporte em glTF binário (.glb) do SketchUp, Blender, Rhino ou Revit, em metros. Depois escolha o sítio no mapa.", "Export binary glTF (.glb) from SketchUp, Blender, Rhino or Revit, in metres. Then pick the spot on the map.") + "</div></div>";
    else h += "<div class='m'>" + T("Carregar e mudar objectos 3D é do IPR Atlas Intelligence (dono, editores e equipa).", "Uploading and editing 3D objects is part of IPR Atlas Intelligence (owner, editors and team).") + "</div>";
    h += "<div class='l'>" + (B.objectos.length ? B.objectos.map(function (o) {
      var r = "<div class='o" + (o.id === S.sel ? " sel" : "") + "' data-id='" + o.id + "'><b>" + esc(o.nome || o.id) + "</b> <span class='m'>" + Math.round((o.bytes || 0) / 1024) + " kB · " + esc(o.quem || "") + "</span>";
      if (B.editar) r += "<div class='r'><button type='button' data-a='mover'>" + (S.mover && S.sel === o.id ? T("Carregue no mapa…", "Click on the map…") : T("Pôr no mapa", "Place on map")) + "</button>" +
        "<label>" + T("Rotação", "Rotation") + " <input type='number' step='5' data-k='rot' value='" + (+o.rot || 0) + "'>°</label>" +
        "<label>" + T("Escala", "Scale") + " <input type='number' step='0.1' min='0.001' data-k='escala' value='" + (+o.escala || 1) + "'>×</label>" +
        "<label>" + T("Altura", "Height") + " <input type='number' step='0.5' data-k='alt' value='" + (+o.alt || 0) + "'> m</label>" +
        "<button type='button' data-a='ver'>" + T("Ver", "View") + "</button><button type='button' data-a='retirar'>" + T("Retirar", "Remove") + "</button></div>";
      else r += "<div class='r'><button type='button' data-a='ver'>" + T("Ver", "View") + "</button></div>";
      return r + "</div>";
    }).join("") : "<div class='m'>" + T("Ainda não há objectos nesta Base.", "No objects on this Base yet.") + "</div>") + "</div>";
    if (S.msg) h += "<div class='av'>" + esc(S.msg) + "</div>";
    P.innerHTML = h; P.hidden = false;
  }
  function objecto(id) { var B = BASES[S.enc]; return B && B.objectos.filter(function (o) { return o.id === id; })[0]; }
  function gravar(o) {
    return rest("base-obj3d/editar", { enc: S.enc, id: o.id, lon: o.lon, lat: o.lat, rot: o.rot, escala: o.escala, alt: o.alt })
      .then(function () { S.msg = T("Gravado.", "Saved."); painel(); }).catch(function (x) { S.msg = x.message; painel(); });
  }
  function clique(ev) {
    var b = ev.target.closest("[data-a]"); if (!b) return;
    var a = b.getAttribute("data-a"), card = b.closest("[data-id]"), o = card && objecto(card.getAttribute("data-id"));
    if (a === "fechar") { P.hidden = true; S.mover = false; return; }
    if (a === "escolher") { var f = P.querySelector("[data-a=ficheiro]"); if (f) f.click(); return; }
    if (!o) return;
    S.sel = o.id;
    if (a === "mover") { S.mover = true; S.msg = T("Carregue no mapa onde fica o objecto.", "Click on the map where the object goes."); painel(); return; }
    if (a === "ver") { var m = mapa(); if (m) m.easeTo({ center: [o.lon, o.lat], zoom: Math.max(m.getZoom(), 17), pitch: Math.max(m.getPitch(), 55) }); return; }
    if (a === "retirar") {
      if (!b.__conf) { b.__conf = 1; b.textContent = T("Retirar? Carregue outra vez", "Remove? Click again"); return; }
      rest("base-obj3d/editar", { enc: S.enc, id: o.id, retirar: 1 }).then(function () {
        var B = BASES[S.enc]; B.objectos = B.objectos.filter(function (x) { return x.id !== o.id; }); S.msg = T("Retirado da vista (o ficheiro fica guardado).", "Removed from view (the file is kept)."); painel(); redesenhar();
      }).catch(function (x) { S.msg = x.message; painel(); });
    }
  }
  function muda(ev) {
    var t = ev.target;
    if (t.getAttribute("data-a") === "ficheiro" && t.files && t.files[0]) {
      var f = t.files[0];
      if (f.size > 25 * 1024 * 1024) { S.msg = T("Ficheiro acima de 25 MB.", "File above 25 MB."); painel(); return; }
      var m = mapa(), c = m ? m.getCenter() : { lng: 0, lat: 0 };
      var fd = new FormData(); fd.append("enc", S.enc); fd.append("ficheiro", f, f.name); fd.append("nome", f.name.replace(/\.glb$/i, "")); fd.append("lon", c.lng); fd.append("lat", c.lat);
      S.msg = T("A carregar ", "Uploading ") + f.name + "…"; painel();
      rest("base-obj3d", fd).then(function (j) {
        var B = BASES[S.enc]; B.objectos.push(j.objecto); S.sel = j.objecto.id; S.mover = true;
        S.msg = T("Carregado. Carregue no mapa onde fica o objecto.", "Uploaded. Click on the map where the object goes."); painel();
        return three().then(function () { return cena(S.enc, j.objecto); }).then(function () { MAPAS.forEach(function (mm) { if (vivo(mm) && mm.__iprO3poe) mm.__iprO3poe(); }); redesenhar(); });
      }).catch(function (x) { S.msg = x.message; painel(); });
      return;
    }
    var k = t.getAttribute("data-k"), card = t.closest("[data-id]"), o = card && objecto(card.getAttribute("data-id"));
    if (!k || !o) return;
    o[k] = parseFloat(t.value) || (k === "escala" ? 1 : 0); redesenhar(); gravar(o);
  }
  function abrir(enc, nome) {
    S.enc = enc; S.nome = nome; S.msg = ""; S.sel = ""; S.mover = false;
    carregarBase(enc).then(function () { var m = mapa(); if (m) montar(m); painel(); });
  }
  W.__iprObjectos3d = { abrir: abrir, mapas: MAPAS, bases: BASES };

  // clique no mapa principal para pôr o objecto escolhido
  function ligarMapa() {
    var m = mapa(); if (!m || m.__iprO3click) return !!m; m.__iprO3click = 1; montar(m);
    m.on("click", function (e) {
      if (!S.mover || !S.sel || !P || P.hidden) return;
      var o = objecto(S.sel); if (!o) return;
      o.lon = +e.lngLat.lng.toFixed(7); o.lat = +e.lngLat.lat.toFixed(7); S.mover = false; redesenhar(); gravar(o);
    });
    return true;
  }
  (function espera(n) { if (!ligarMapa() && n < 80) setTimeout(function () { espera(n + 1); }, 500); })(0);

  // mapas novos (vistas 3D das fichas)
  var ML = W.maplibregl;
  if (ML && ML.Map && !ML.Map.__iprO3) {
    var Orig = ML.Map, Novo = function (o) { var m = new Orig(o); setTimeout(function () { try { montar(m); } catch (e) {} }, 0); return m; };
    Novo.prototype = Orig.prototype; Object.keys(Orig).forEach(function (k) { try { Novo[k] = Orig[k]; } catch (e) {} }); Novo.__iprO3 = 1; ML.Map = Novo;
  }

  // botão na Ficha da propriedade; os objectos da Base aberta aparecem sem abrir o painel
  function varrer() {
    D.querySelectorAll("#ipe .ipe-card.on .ipr-fx").forEach(function (fx) {
      if (fx.querySelector(":scope > .ipr-o3-abrir")) return;
      var c = fx.closest(".ipe-card"), E = est(), p = E && E.mapas && E.mapas[+c.getAttribute("data-i")]; if (!p || !p.id) return;
      css();
      var b = D.createElement("button"); b.type = "button"; b.className = "ipr-o3-abrir"; b.textContent = T("◫ Objectos 3D nesta Base (.glb)", "◫ 3D objects on this Base (.glb)");
      b.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); abrir(+p.id, p.local || ("#" + p.id)); });
      var ref = fx.querySelector(":scope > .ipr-bd-abrir"); fx.insertBefore(b, ref ? ref.nextSibling : (fx.querySelector(":scope > .ipr-tcam") || null));
      carregarBase(+p.id).then(function () { var m = mapa(); if (m) montar(m); redesenhar(); });
    });
  }
  var t = null;
  new MutationObserver(function () { if (t) return; t = 1; W.requestAnimationFrame(function () { setTimeout(function () { t = null; try { varrer(); } catch (e) {} }, 60); }); })
    .observe(D.body || D.documentElement, { childList: true, subtree: true });
  varrer();
})();
