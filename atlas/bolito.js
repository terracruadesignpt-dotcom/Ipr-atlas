/* IPR Atlas · Ajustes do sistema de design do Pedro Bolito (regenerativo.pt/interface/ajustes-atlas, /logotipos-do-ipr),
   escolhidos pelo Nuno a 30/10/2026: logótipo IPR Atlas com pulso de 4 s; painel de projectos «opção 3 · barra de
   ícones»; legenda «opção 2 · agrupada»; formulário de encomenda (zona de arrastar, «ou», notas em três pontos).
   Só aspecto e arrumação: os botões são os mesmos elementos, com os mesmos data-* e os mesmos ouvintes; nada se apaga.
   O texto completo de cada acção fica em title e aria-label. Desligar: window.IPR_BOLITO_OFF = true.
   Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. */
(function () {
  "use strict";
  if (window.IPR_BOLITO_OFF || window.__iprBolito) return;
  window.__iprBolito = 1;

  function en() { return (window.IPR_LINGUA || document.documentElement.lang || "pt").indexOf("en") === 0; }
  var NS = "http://www.w3.org/2000/svg";

  // ── Logótipo IPR Atlas (símbolo IPR, nome da ferramenta e linha do Instituto; pulso de 4 s no triângulo do I) ──
  var LOGO = "<svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false' viewBox='0 0 193.64 52.58'><g fill='#96bf3d'><polygon points='28.95 7.89 28.95 13.95 21.61 13.95 28.95 7.89'/><polygon points='28.95 14.12 28.95 20.18 21.61 20.18 28.95 14.12'/><polygon points='28.95 20.35 28.95 26.41 21.61 26.41 28.95 20.35'/><polygon points='21.61 26.41 21.61 20.35 28.95 20.35 21.61 26.41'/><polygon points='28.95 26.58 28.95 32.64 21.61 32.64 28.95 26.58'/><polygon points='21.61 32.64 21.61 26.58 28.95 26.58 21.61 32.64'/><polygon points='36.46 7.89 36.46 13.95 29.12 13.95 36.46 7.89'/><polygon points='29.12 13.95 29.12 7.89 36.46 7.89 29.12 13.95'/><polygon points='36.46 20.35 36.46 26.41 29.12 26.41 36.46 20.35'/><polygon points='29.12 26.41 29.12 20.35 36.46 20.35 29.12 26.41'/><polygon points='43.97 7.89 43.97 13.95 36.62 13.95 43.97 7.89'/><polygon points='36.62 13.95 36.62 7.89 43.97 7.89 36.62 13.95'/><polygon points='43.97 20.35 43.97 26.41 36.62 26.41 43.97 20.35'/><polygon points='36.62 26.41 36.62 20.35 43.97 20.35 36.62 26.41'/><polygon points='44.13 7.89 44.13 13.95 51.47 13.95 44.13 7.89'/><polygon points='51.47 14.12 51.47 20.18 44.13 20.18 51.47 14.12'/><polygon points='44.13 20.18 44.13 14.12 51.47 14.12 44.13 20.18'/><polygon points='44.13 26.41 44.13 20.35 51.47 20.35 44.13 26.41'/><polygon points='61.12 7.89 61.12 13.95 53.78 13.95 61.12 7.89'/><polygon points='53.78 13.95 53.78 7.89 61.12 7.89 53.78 13.95'/><polygon points='61.12 14.12 61.12 20.18 53.78 20.18 61.12 14.12'/><polygon points='61.12 20.35 61.12 26.41 53.78 26.41 61.12 20.35'/><polygon points='53.78 26.41 53.78 20.35 61.12 20.35 53.78 26.41'/><polygon points='61.12 26.58 61.12 32.64 53.78 32.64 61.12 26.58'/><polygon points='53.78 32.64 53.78 26.58 61.12 26.58 53.78 32.64'/><polygon points='68.63 7.89 68.63 13.95 61.28 13.95 68.63 7.89'/><polygon points='61.28 13.95 61.28 7.89 68.63 7.89 61.28 13.95'/><polygon points='68.63 20.35 68.63 26.41 61.28 26.41 68.63 20.35'/><polygon points='61.28 26.41 61.28 20.35 68.63 20.35 61.28 26.41'/><polygon points='76.13 7.89 76.13 13.95 68.79 13.95 76.13 7.89'/><polygon points='68.79 13.95 68.79 7.89 76.13 7.89 68.79 13.95'/><polygon points='76.13 20.35 76.13 26.41 68.79 26.41 76.13 20.35'/><polygon points='68.79 26.41 68.79 20.35 76.13 20.35 68.79 26.41'/><polygon points='76.13 32.64 76.13 26.58 68.79 26.58 76.13 32.64'/><polygon points='76.3 7.89 76.3 13.95 83.64 13.95 76.3 7.89'/><polygon points='83.64 14.12 83.64 20.18 76.3 20.18 83.64 14.12'/><polygon points='76.3 20.18 76.3 14.12 83.64 14.12 76.3 20.18'/><polygon points='76.3 26.41 76.3 20.35 83.64 20.35 76.3 26.41'/><polygon points='76.3 26.58 76.3 32.64 83.64 32.64 76.3 26.58'/><polygon points='19.87 7.89 19.87 13.95 12.53 13.95 19.87 7.89'/><polygon points='12.53 13.95 12.53 7.89 19.87 7.89 12.53 13.95'/><polygon points='19.87 14.12 19.87 20.18 12.53 20.18 19.87 14.12'/><polygon points='19.87 20.35 19.87 26.41 12.53 26.41 19.87 20.35'/><polygon points='12.53 26.41 12.53 20.35 19.87 20.35 12.53 26.41'/><polygon points='19.87 26.58 19.87 32.64 12.53 32.64 19.87 26.58'/><polygon points='12.53 32.64 12.53 26.58 19.87 26.58 12.53 32.64'/><polygon points='187.78 52.58 193.64 52.58 193.64 45.49'/></g><g fill='#818a72'><path d='M12.31,45.3v-5.74h.46v5.74h-.46Z'/><path d='M18.01,45.3l-3.42-4.96v4.96h-.46v-5.74h.47l3.4,4.89v-4.89h.46v5.74h-.46Z'/><path d='M19.82,44.12c.35.43.92.83,1.69.83,1.11,0,1.43-.65,1.43-1.14,0-.81-.72-1.03-1.49-1.25-.85-.25-1.76-.51-1.76-1.57,0-.94.8-1.53,1.78-1.53.81,0,1.42.3,1.84.81l-.31.36c-.39-.5-.94-.72-1.55-.72-.72,0-1.27.44-1.27,1.06,0,.68.68.88,1.42,1.08.88.27,1.84.56,1.84,1.72,0,.74-.46,1.63-1.93,1.63-.89,0-1.57-.38-1.98-.91l.3-.37Z'/><path d='M25.9,45.3v-5.29h-1.77v-.45h4.02v.45h-1.77v5.29h-.47Z'/><path d='M29.11,45.3v-5.74h.46v5.74h-.46Z'/><path d='M32.31,45.3v-5.29h-1.77v-.45h4.02v.45h-1.77v5.29h-.47Z'/><path d='M35.52,39.56h.47v3.53c0,1.16.58,1.87,1.64,1.87s1.64-.71,1.64-1.87v-3.53h.47v3.54c0,1.42-.72,2.31-2.11,2.31s-2.11-.9-2.11-2.31v-3.54Z'/><path d='M42.48,45.3v-5.29h-1.77v-.45h4.02v.45h-1.77v5.29h-.47Z'/><path d='M47.89,39.46c1.59,0,2.63,1.29,2.63,2.97s-1.05,2.97-2.63,2.97-2.64-1.29-2.64-2.97,1.04-2.97,2.64-2.97ZM47.89,39.91c-1.32,0-2.15,1.06-2.15,2.52s.83,2.52,2.15,2.52,2.15-1.08,2.15-2.52-.85-2.52-2.15-2.52Z'/><path d='M53.78,45.3v-5.74h1.73c1.68,0,2.74,1.3,2.74,2.87s-1.06,2.87-2.74,2.87h-1.73ZM54.24,44.85h1.27c1.43,0,2.25-1.08,2.25-2.42s-.81-2.43-2.25-2.43h-1.27v4.85Z'/><path d='M59.41,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M66.11,45.3v-5.74h2.03c1.04,0,1.63.77,1.63,1.68s-.6,1.68-1.63,1.68h-1.57v2.38h-.46ZM68.1,40.01h-1.52v2.46h1.52c.72,0,1.2-.51,1.2-1.23s-.48-1.23-1.2-1.23Z'/><path d='M70.76,45.3v-5.74h.46v5.29h2.63v.45h-3.09Z'/><path d='M78.8,45.3l-.54-1.41h-2.89l-.54,1.41h-.52l2.22-5.74h.58l2.22,5.74h-.52ZM76.81,40.04l-1.29,3.4h2.59l-1.3-3.4Z'/><path d='M84.01,45.3l-3.42-4.96v4.96h-.46v-5.74h.47l3.4,4.89v-4.89h.46v5.74h-.46Z'/><path d='M85.82,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M94.35,45.3l-.54-1.41h-2.89l-.54,1.41h-.52l2.22-5.74h.58l2.22,5.74h-.52ZM92.36,40.04l-1.29,3.4h2.59l-1.3-3.4Z'/><path d='M100.28,45.3v-5.09l-1.98,5.09h-.18l-1.98-5.09v5.09h-.46v-5.74h.69l1.85,4.76,1.84-4.76h.7v5.74h-.47Z'/><path d='M102.1,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M110.57,45.3l-3.42-4.96v4.96h-.46v-5.74h.47l3.4,4.89v-4.89h.46v5.74h-.46Z'/><path d='M113.76,45.3v-5.29h-1.77v-.45h4.02v.45h-1.77v5.29h-.47Z'/><path d='M119.17,39.46c1.59,0,2.63,1.29,2.63,2.97s-1.05,2.97-2.63,2.97-2.64-1.29-2.64-2.97,1.04-2.97,2.64-2.97ZM119.17,39.91c-1.32,0-2.15,1.06-2.15,2.52s.83,2.52,2.15,2.52,2.15-1.08,2.15-2.52-.85-2.52-2.15-2.52Z'/><path d='M128.24,45.3l-1.52-2.38h-1.2v2.38h-.46v-5.74h2.03c.94,0,1.65.63,1.65,1.68s-.7,1.62-1.5,1.65l1.57,2.41h-.56ZM127.05,40.01h-1.52v2.47h1.52c.72,0,1.2-.52,1.2-1.24s-.49-1.23-1.2-1.23Z'/><path d='M129.9,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M137.03,39.46c.89,0,1.55.38,2.04.98l-.35.27c-.38-.48-1-.8-1.69-.8-1.28,0-2.26,1.02-2.26,2.52s.98,2.53,2.26,2.53c.72,0,1.29-.38,1.59-.7v-1.38h-2.05v-.44h2.51v2c-.48.57-1.2.96-2.06.96-1.52,0-2.75-1.2-2.75-2.98s1.23-2.97,2.75-2.97Z'/><path d='M140.27,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M148.74,45.3l-3.42-4.96v4.96h-.46v-5.74h.47l3.4,4.89v-4.89h.46v5.74h-.46Z'/><path d='M150.55,45.3v-5.74h3.44v.45h-2.98v2.13h2.92v.45h-2.92v2.27h2.98v.45h-3.44Z'/><path d='M158.32,45.3l-1.52-2.38h-1.2v2.38h-.46v-5.74h2.03c.94,0,1.65.63,1.65,1.68s-.7,1.62-1.5,1.65l1.57,2.41h-.56ZM157.13,40.01h-1.52v2.47h1.52c.72,0,1.2-.52,1.2-1.24s-.49-1.23-1.2-1.23Z'/><path d='M163.92,45.3l-.54-1.41h-2.89l-.54,1.41h-.52l2.22-5.74h.58l2.22,5.74h-.52ZM161.93,40.04l-1.29,3.4h2.59l-1.3-3.4Z'/><path d='M166.07,45.3v-5.29h-1.77v-.45h4.02v.45h-1.77v5.29h-.47Z'/><path d='M169.27,45.3v-5.74h.46v5.74h-.46Z'/><path d='M172.76,45.3l-2.22-5.74h.54l1.97,5.19,1.98-5.19h.54l-2.22,5.74h-.58Z'/><path d='M178.62,39.46c1.59,0,2.63,1.29,2.63,2.97s-1.05,2.97-2.63,2.97-2.64-1.29-2.64-2.97,1.04-2.97,2.64-2.97ZM178.62,39.91c-1.32,0-2.15,1.06-2.15,2.52s.83,2.52,2.15,2.52,2.15-1.08,2.15-2.52-.85-2.52-2.15-2.52Z'/></g><g fill='#8e957e'><path d='M128.31,32.64h-7.93v-1.84h3.41l-1.88-5.08h-10.41l-1.99,5.08h3.66v1.84h-7.89v-1.84h2.17l7.82-19.73h-3.8v-1.84h6.22l8.28,21.56h2.35v1.84ZM121.31,24.07l-4.41-11.81h-.18l-4.58,11.81h9.17Z'/><path d='M140.26,28.5c-.47,3-2.07,4.5-4.8,4.5-1.54,0-2.7-.46-3.47-1.37s-1.15-2.14-1.15-3.67v-9.61h-2.59v-1.69h2.59v-5.18h1.95v5.18h6.29v1.69h-6.29v9.4c0,1.06.21,1.9.64,2.54.43.64,1.17.95,2.24.95.69,0,1.3-.21,1.85-.63.54-.42.95-1.29,1.21-2.61l1.53.5Z'/><path d='M149.07,32.64h-7.78v-1.66h2.91V9.53h-2.95v-1.66h4.9v23.11h2.91v1.66Z'/><path d='M152.84,17.92c.66-.55,1.46-.95,2.4-1.21s1.88-.38,2.83-.38c3.65,0,5.47,1.79,5.47,5.36v7.78c0,1.22.46,1.84,1.39,1.84.47,0,.86-.08,1.17-.25l.04,1.44c-.52.34-1.14.5-1.85.5-1.8,0-2.7-1.08-2.7-3.24v-.07c-.5.86-1.21,1.63-2.15,2.3-.94.67-2.03,1.01-3.29,1.01-1.04,0-2.1-.32-3.18-.95-1.08-.64-1.62-1.81-1.62-3.51,0-2.02.79-3.34,2.38-3.98,1.59-.64,3.26-.95,5.01-.95.5,0,.99.02,1.48.05.49.04.94.07,1.37.09v-1.69c0-1.22-.28-2.19-.83-2.9-.56-.71-1.56-1.06-3-1.06-1.19,0-2.25.24-3.2.72l-.64,2.88-1.64-.22.57-3.56ZM161.58,26.77v-1.48c-.45-.05-.94-.09-1.46-.13-.52-.04-1.07-.05-1.63-.05-1.28,0-2.45.2-3.5.59-1.05.4-1.58,1.27-1.58,2.61,0,1.15.37,1.93,1.1,2.32.73.4,1.45.59,2.13.59,1.18,0,2.29-.41,3.31-1.24,1.02-.83,1.56-1.9,1.63-3.22Z'/><path d='M180.59,28.1c0,1.49-.62,2.68-1.87,3.56-1.24.89-2.78,1.33-4.6,1.33-1.11,0-2.21-.16-3.29-.49s-1.9-.69-2.47-1.1l.43-3.38,1.6.14-.14,2.16c1.11.6,2.38.9,3.8.9,1.16,0,2.21-.23,3.15-.7.94-.47,1.4-1.21,1.4-2.21s-.34-1.64-1.01-2.05c-.68-.41-1.51-.7-2.51-.88s-1.98-.38-2.97-.59c-.98-.22-1.81-.61-2.49-1.19-.68-.58-1.01-1.48-1.01-2.7,0-1.63.58-2.8,1.74-3.51,1.16-.71,2.43-1.06,3.8-1.06,1.09,0,2.11.16,3.07.47.96.31,1.74.65,2.33,1.01l.36,3.67-1.63.22-.43-2.7c-.5-.26-1.02-.48-1.56-.65-.55-.17-1.17-.25-1.88-.25-1.11,0-2.01.2-2.7.61-.69.41-1.03,1.07-1.03,1.98s.33,1.55,1,1.93c.66.37,1.49.64,2.49.81s1.98.37,2.97.61c.98.24,1.81.66,2.47,1.26.66.6,1,1.54,1,2.81Z'/></g><polygon class='ipr-b5-p' fill='__FUNDO__' points='12.34 14.11 12.3 14.11 12.3 7.66 20.15 7.66 20.06 7.73'/></svg>";
  function logo() {
    var a = document.querySelector("#ipe .ipe-marca");
    if (!a || a.classList.contains("ipr-bolito-logo")) return;
    var fundo = "#14200F";
    try { var top = a.closest(".ipe-top"); var bg = top && getComputedStyle(top).backgroundColor; if (bg && bg !== "rgba(0, 0, 0, 0)") fundo = bg; } catch (e) {}
    a.classList.add("ipr-bolito-logo");
    a.setAttribute("aria-label", "IPR Atlas · Instituto de Planeamento Regenerativo");
    a.innerHTML = LOGO.replace("__FUNDO__", fundo);
  }

  // ── Painel de projectos · opção 3, barra de ícones ──
  var IC = {
    cubo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    pino: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    lapis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    part: '<circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 11l8-4M8 13l8 4"/>',
    arq: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>',
    juntar: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 8v6M14 11h6"/>',
    lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    mapa: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    olhoF: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
  };
  // [selector, ícone, curto pt, curto en]
  var ACC = [
    ["[data-a=v3d]", "cubo", "3D", "3D"],
    ["[data-ppl],[data-a=planta]", "pino", "Planta", "Plan"],
    ["[data-pnome],[data-a=nome]", "lapis", "Nome", "Name"],
    ["[data-psh],[data-a=partilhar]", "part", "Partilhar", "Share"],
    ["[data-arq]", "arq", "Arquivar", "Archive"],
    ["[data-jorg]", "juntar", "Juntar", "Join"],
    ["[data-pdel],[data-a=eliminar]", "lixo", "Eliminar", "Delete"]
  ];
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + IC[k] + "</svg>"; }
  function barra() {
    var bs = document.querySelectorAll("#ipe .ipr-ca>button:not([data-b5]), #ipe .ipr-tma>button:not([data-b5])");
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], m = null;
      for (var j = 0; j < ACC.length; j++) if (b.matches(ACC[j][0])) { m = ACC[j]; break; }
      b.setAttribute("data-b5", "1");
      if (!m) continue; // acção nova que não conhecemos: fica como está, só com o estilo da barra
      var cheio = (b.textContent || "").trim();
      if (cheio) { b.title = b.title || cheio; b.setAttribute("aria-label", cheio); }
      var curto = m[2] ? (en() ? m[3] : m[2]) : cheio;
      b.innerHTML = svg(m[1]) + "<span>" + curto.replace(/[<>&]/g, "") + "</span>";
    }
    // Organização: as mesmas marcas nas acções de cada projecto
    var os = document.querySelectorAll("#ipr-orgv .ov-acc>button:not([data-b5])");
    for (var q = 0; q < os.length; q++) {
      var ob = os[q], ik = ob.hasAttribute("data-ov-ir") ? "mapa" : ob.hasAttribute("data-ov-todas") ? "olho" : ob.hasAttribute("data-ov-nenhuma") ? "olhoF" : "";
      ob.setAttribute("data-b5", "1"); if (ik) ob.insertAdjacentHTML("afterbegin", svg(ik));
    }
    var vs = document.querySelectorAll("#ipe .ipr-ver-mapa:not([data-b5]), #ipe .tme-b[data-tme=ver]:not([data-b5])");
    for (var k = 0; k < vs.length; k++) { vs[k].setAttribute("data-b5", "1"); vs[k].insertAdjacentHTML("afterbegin", svg("mapa")); }
  }

  // ── Legenda do mapa · opção 2, agrupada (Relevo, Curvas de nível, Hidrografia…) ──
  var GR = [
    ["rel", "Relevo", "Relief", /mdt|dtm|hipsom|hypsom|sombream|hillshad|relevo|relief|declive|slope|exposi|aspect|formas|landform|vento|wind|eros/i],
    ["cur", "Curvas de nível", "Contours", /curvas|contour|equidist/i],
    ["hid", "Hidrografia", "Hydrography", /água|agua|water|hidro|hydro|bacia|basin|festo|ridge|acumula|accumul|humidade|wetness|twi|strahler|ribeir|stream|albufeir|reservoir/i],
    ["con", "Condicionantes", "Constraints", /\bren\b|\bran\b|pdm|natura|protegid|protected|condicionant|constraint|srup|sgifr|faixa|perigosidade|hazard|incêndio|fogo|fire/i],
    ["ocu", "Ocupação do solo", "Land cover", /\bcos\b|ocupa|land cover|uso do solo|habitat|clc/i],
    ["lim", "Cadastro e limites", "Cadastre and boundaries", /cadastr|freguesia|parish|concelho|municip|limite|boundar|parcela|parcel|caop|terreno|plot|distrito/i]
  ];
  var LINHA = /curvas|contour|linhas de água|linhas de agua|streams?|watercourse|rede |network|festo|ridge|estrada|road|caminho/i;
  function legenda() {
    var c = document.querySelector("#ipr-lgd .c");
    if (!c) return;
    var uns = Array.prototype.slice.call(c.querySelectorAll(":scope>.one, :scope>.l"));
    if (!uns.length) return;
    var assin = function () { return uns.map(function (o) { return o.textContent; }).join("|") + (en() ? "#en" : ""); };
    if (c.getAttribute("data-b5") === assin() && c.querySelector(":scope>.gh")) return;
    var grupos = {}, ordem = GR.map(function (g) { return g[0]; }).concat(["out"]);
    uns.forEach(function (o) {
      var multi = o.classList.contains("l"), sp = multi ? o.querySelector(":scope>b") : o.querySelector("span"), t = sp ? sp.textContent : o.textContent, g = "out";
      for (var i = 0; i < GR.length; i++) if (GR[i][3].test(t)) { g = GR[i][0]; break; }
      (grupos[g] = grupos[g] || []).push(o);
      // Detalhe entre parênteses alinhado à direita, em mono: «Curvas de nível (LiDAR DGT, 1 a 50 m)»
      if (sp && !o.querySelector("small.d")) {
        var m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(sp.textContent);
        if (m && m[1]) { sp.textContent = m[1]; var d = document.createElement("small"); d.className = "d"; d.textContent = m[2]; (multi ? sp : o).appendChild(d); }
      }
      var s = o.querySelector("s");
      if (multi) {
        // bloco com várias entradas (ex.: linhas de água por ordem de Strahler): cada linha com o seu traço
        if (LINHA.test(t)) { o.classList.add("ln"); Array.prototype.forEach.call(o.querySelectorAll(".r"), function (r) { var x = r.querySelector("s"); if (x) r.style.setProperty("--b-cor", x.style.background || x.style.backgroundColor || "#fff"); }); }
      } else if (LINHA.test(t)) { o.classList.add("ln"); if (s) o.style.setProperty("--b-cor", s.style.background || s.style.backgroundColor || "#fff"); if (/\b1 m\b/.test(t)) o.classList.add("fino"); }
      if (/hipsom|hypsom/i.test(t)) o.classList.add("rampa");
    });
    Array.prototype.slice.call(c.querySelectorAll(":scope>.gh")).forEach(function (h) { h.remove(); });
    var nomes = {}; GR.forEach(function (g) { nomes[g[0]] = en() ? g[2] : g[1]; }); nomes.out = en() ? "Other" : "Outras";
    ordem.forEach(function (k) {
      if (!grupos[k]) return;
      var h = document.createElement("div"); h.className = "gh"; h.textContent = nomes[k]; c.appendChild(h);
      grupos[k].forEach(function (o) { c.appendChild(o); });
    });
    c.setAttribute("data-b5", assin());
  }

  // ── Formulário de encomenda ──
  function formulario() {
    var f = document.getElementById("ipe-form");
    if (!f) return;
    // «ou» entre o artigo e a caderneta
    var cadLbl = f.querySelector('label[for="ipe-cad"]');
    if (cadLbl && !(cadLbl.previousElementSibling && cadLbl.previousElementSibling.classList.contains("ipr-ou"))) {
      var ou = document.createElement("div"); ou.className = "ipr-ou"; ou.textContent = en() ? "or" : "ou"; cadLbl.parentNode.insertBefore(ou, cadLbl);
    }
    // Zona de arrastar no lugar do «Choose File» do navegador; o input é o mesmo (fica no formulário, só fica invisível)
    var inp = document.getElementById("ipe-cad");
    if (inp && !inp.classList.contains("ipr-drop-in")) {
      inp.classList.add("ipr-drop-in");
      var z = document.createElement("label"); z.className = "ipr-drop"; z.setAttribute("for", "ipe-cad");
      z.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V4M6.5 7.5 10 4l3.5 3.5"/><path d="M3 13v3h14v-3"/></svg><span></span>';
      var tx = z.querySelector("span");
      var pinta = function () {
        var n = inp.files && inp.files.length ? inp.files[0].name : "";
        tx.innerHTML = (en() ? "<b>Choose file</b> or drag it here · PDF or image" : "<b>Escolher ficheiro</b> ou arrastar para aqui · PDF ou imagem") + (n ? '<span class="n"></span>' : "");
        if (n) tx.querySelector(".n").textContent = n;
      };
      pinta();
      inp.parentNode.insertBefore(z, inp.nextSibling);
      inp.addEventListener("change", pinta);
      ["dragenter", "dragover"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); z.classList.add("sobre"); }); });
      ["dragleave", "drop"].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); z.classList.remove("sobre"); }); });
      z.addEventListener("drop", function (e) {
        var fs = e.dataTransfer && e.dataTransfer.files; if (!fs || !fs.length) return;
        try { var dt = new DataTransfer(); dt.items.add(fs[0]); inp.files = dt.files; inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (x) {}
      });
    }
    // «Limpar terreno» passa para a linha da nota «Basta o artigo ou a caderneta.» quando esse modo está aberto: só estilo (CSS).
    // Nota final em três pontos curtos marcados com o triângulo do IPR (só em português; em inglês fica o texto traduzido).
    if (!en()) {
      var ns = f.querySelectorAll("p.ipe-nota:not([data-b5])");
      for (var i = 0; i < ns.length; i++) {
        var p = ns[i], t = p.textContent;
        if (t.indexOf("Valores sem IVA, por escalões.") !== 0 || t.indexOf("máximo 10 000 ha") < 0) continue;
        p.setAttribute("data-b5", "1");
        p.innerHTML = '<span class="ipr-nt">Valores sem IVA, por escalões.</span>' +
          '<span class="ipr-nt"><b>Com cobertura LiDAR total</b>, a ligação de pagamento aparece logo a seguir ao pedido. Sem ela, confirmamos os dados e enviamos o preço por e-mail.</span>' +
          '<span class="ipr-nt">Acima de 5 000 ha, sob consulta. Máximo de 10 000 ha por pedido.</span>';
      }
    }
  }

  function tudo() {
    if (window.IPR_BOLITO_OFF) return;
    try { logo(); } catch (e) {}
    try { barra(); } catch (e) {}
    try { legenda(); } catch (e) {}
    try { formulario(); } catch (e) {}
  }
  var t = 0, aCorrer = false;
  function agenda() { if (aCorrer) return; clearTimeout(t); t = setTimeout(function () { aCorrer = true; try { tudo(); } finally { aCorrer = false; } }, 120); }
  function arranca() {
    tudo();
    var alvo = document.getElementById("ipe") || document.body;
    new MutationObserver(agenda).observe(alvo, { childList: true, subtree: true });
    // a legenda pode viver fora de #ipe
    new MutationObserver(function () { agenda(); }).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arranca); else arranca();
})();
