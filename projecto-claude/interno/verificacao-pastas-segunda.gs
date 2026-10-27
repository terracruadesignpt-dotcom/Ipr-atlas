/**
 * Verificação semanal das pastas de projecto (IPR02.5)
 * IPR | Terracrua Design · 20/10/2026
 *
 * O que faz: todas as segundas às 8h percorre as pastas «NNN.Nome» de IPR02.5 e verifica
 *   1. as seis pastas do processo (0.0 a 0.5);
 *   2. ficheiros soltos na raiz do projecto;
 *   3. entregas em 0.4: subpastas Fn_AAAA-MM-DD, nomes TCDNNN_Fn_..., PDF e QGIS (.zip) presentes;
 *   4. nomes proibidos («final», «(1)», «:», «|», dupla extensão, IMG_0000, espaços duplos)
 *      no 1.º nível de 0.3 e dentro de 0.4.
 * Só lê. Não move, não renomeia, não apaga nada.
 *
 * Instalar (Susana, na conta terracrua.design.pt@gmail.com):
 *   1. script.google.com › Novo projecto › colar este ficheiro › Guardar.
 *   2. Preencher DESENHADORES e EM_CURSO abaixo.
 *   3. Executar «verificar» uma vez (pede autorização ao Drive e ao Gmail). Com DRY_RUN = true,
 *      o resumo vai só para o Nuno e para a Susana, e cada desenhador NÃO recebe nada.
 *   4. Quando o resumo estiver certo: DRY_RUN = false e executar «instalarSegunda» uma vez.
 */

const DRY_RUN = true;

const PASTA_PROJECTOS = '1Q2sN7jHBad2fj1eW25L3DKHJ56CE0Kex'; // IPR02.5 - PASTA PROJECTOS TCD
const RESUMO_PARA = ['nuno@terracruadesign.pt', 'susana@terracruadesign.pt'];

// Número do projecto -> e-mail do desenhador responsável (preencher)
const DESENHADORES = {
  // '286': 'miguel@terracruadesign.pt',
  // '281': 'ana@terracruadesign.pt',
};

// Projectos em curso a verificar. Vazio = todos os projectos numerados.
const EM_CURSO = [
  // '286', '288', '290',
];

const PASTAS = [
  '0.0 - Info de Arranque',
  '0.1 - Proposta Comercial',
  '0.2 - FT´s & RC´s',
  '0.3 - Trabalho',
  '0.4 - Entregáveis',
  '0.5 - Fotos',
];

const RE_PROJECTO = /^(\d{3})\.\s*(.+)$/;
const RE_ENTREGA = /^F(\d+)_(\d{4}-\d{2}-\d{2})$/;
const PROIBIDOS = [
  [/final/i, '«final» no nome'],
  [/\(\d+\)/, 'cópia «(1)»'],
  [/[:|]/, '«:» ou «|» no nome'],
  [/\.(pdf|pptx?|docx?|xlsx?|dwg|zip|qgz)\.(pdf|pptx?|docx?|xlsx?|zip)$/i, 'dupla extensão'],
  [/^IMG_\d+/i, 'nome de câmara'],
  [/ {2,}/, 'espaços duplos'],
  [/\b(copia|cópia|ok)\b/i, '«copia» ou «ok» no nome'],
];

function verificar() {
  const raiz = DriveApp.getFolderById(PASTA_PROJECTOS);
  const it = raiz.getFolders();
  const resultados = [];
  while (it.hasNext()) {
    const p = it.next();
    const m = p.getName().match(RE_PROJECTO);
    if (!m) continue;
    const num = m[1];
    if (EM_CURSO.length && EM_CURSO.indexOf(num) < 0) continue;
    resultados.push(verificarProjecto(p, num));
  }
  resultados.sort((a, b) => b.num.localeCompare(a.num));
  enviar(resultados);
}

function verificarProjecto(pasta, num) {
  const r = { num: num, nome: pasta.getName(), url: pasta.getUrl(), problemas: [], avisos: [], entregas: [] };

  const sub = {};
  const fs = pasta.getFolders();
  while (fs.hasNext()) { const f = fs.next(); sub[f.getName()] = f; }
  PASTAS.forEach(n => { if (!sub[n]) r.problemas.push('Falta a pasta «' + n + '»'); });
  Object.keys(sub).forEach(n => {
    if (PASTAS.indexOf(n) < 0) r.problemas.push('Pasta fora da estrutura na raiz: «' + n + '»');
  });

  const soltos = [];
  const fi = pasta.getFiles();
  while (fi.hasNext()) soltos.push(fi.next().getName());
  if (soltos.length) r.problemas.push(soltos.length + ' ficheiro(s) solto(s) na raiz: ' + soltos.slice(0, 5).join(', ') + (soltos.length > 5 ? '…' : ''));

  const trab = sub['0.3 - Trabalho'];
  if (trab) nomesProibidos(trab, '0.3', r, false);

  const ent = sub['0.4 - Entregáveis'];
  if (ent) {
    const ef = ent.getFolders();
    let n = 0;
    while (ef.hasNext()) {
      const f = ef.next();
      const mm = f.getName().match(RE_ENTREGA);
      if (!mm) { r.avisos.push('Em 0.4, pasta com nome antigo: «' + f.getName() + '» (entrega anterior ao processo?)'); continue; }
      n++;
      r.entregas.push(verificarEntrega(f, num, mm[1], mm[2], r));
    }
    const ei = ent.getFiles();
    while (ei.hasNext()) r.problemas.push('Ficheiro solto em 0.4 (devia estar numa subpasta Fn_data): ' + ei.next().getName());
    if (!n) r.avisos.push('Ainda sem nenhuma entrega Fn_AAAA-MM-DD em 0.4');
  }
  return r;
}

function verificarEntrega(pasta, num, fase, data, r) {
  const e = { nome: pasta.getName(), pdf: 0, qgis: false, dwg: false, xlsx: false };
  const prefixo = 'TCD' + num + '_F' + fase + '_';
  const it = pasta.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    const n = f.getName();
    if (/\.pdf$/i.test(n)) e.pdf++;
    if (/qgis.*\.zip$/i.test(n) || /\.zip$/i.test(n)) e.qgis = true;
    if (/\.dwg$/i.test(n)) e.dwg = true;
    if (/\.xlsx$/i.test(n) || f.getMimeType() === MimeType.GOOGLE_SHEETS) e.xlsx = true;
    if (n.indexOf(prefixo) !== 0) r.problemas.push(pasta.getName() + ': nome fora da regra «' + n + '» (devia começar por ' + prefixo + ')');
    PROIBIDOS.forEach(([re, motivo]) => { if (re.test(n)) r.problemas.push(pasta.getName() + ': ' + motivo + ' em «' + n + '»'); });
  }
  if (!e.pdf) r.problemas.push(pasta.getName() + ': sem pranchas em PDF');
  if (!e.qgis) r.problemas.push(pasta.getName() + ': sem projecto QGIS empacotado (.zip)');
  return e;
}

function nomesProibidos(pasta, onde, r) {
  const vistos = [];
  const it = pasta.getFiles();
  while (it.hasNext()) vistos.push(it.next().getName());
  const fo = pasta.getFolders();
  while (fo.hasNext()) vistos.push(fo.next().getName());
  vistos.forEach(n => PROIBIDOS.forEach(([re, motivo]) => {
    if (re.test(n)) r.avisos.push(onde + ': ' + motivo + ' em «' + n + '»');
  }));
}

function bloco(r) {
  const li = a => a.map(x => '<li>' + esc(x) + '</li>').join('');
  let h = '<h3 style="margin:16px 0 4px"><a href="' + r.url + '">' + esc(r.nome) + '</a></h3>';
  if (!r.problemas.length && !r.avisos.length) return h + '<p style="margin:0;color:#3a6b35">Tudo em ordem.</p>';
  if (r.problemas.length) h += '<p style="margin:4px 0"><b>Corrigir</b></p><ul>' + li(r.problemas) + '</ul>';
  if (r.avisos.length) h += '<p style="margin:4px 0"><b>Ver</b></p><ul>' + li(r.avisos) + '</ul>';
  return h;
}

function enviar(res) {
  const data = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM');
  const comProb = res.filter(r => r.problemas.length).length;
  const topo = '<p>' + res.length + ' projectos verificados; ' + comProb + ' com coisas a corrigir.</p>';
  const rodape = '<p style="color:#777;font-size:12px">Verificação automática das pastas (só leitura). Regras: «000_PROCESSO DE ENTREGAS DOS PROJECTOS» em IPR02.5.' + (DRY_RUN ? ' Modo de ensaio: os desenhadores ainda não recebem.' : '') + '</p>';

  GmailApp.sendEmail(RESUMO_PARA.join(','), 'Pastas dos projectos · ' + data,
    'Ver a versão HTML.', { htmlBody: topo + res.map(bloco).join('') + rodape, name: 'IPR | Terracrua Design' });

  if (DRY_RUN) return;
  const porPessoa = {};
  res.forEach(r => {
    const em = DESENHADORES[r.num];
    if (!em) return;
    (porPessoa[em] = porPessoa[em] || []).push(r);
  });
  Object.keys(porPessoa).forEach(em => {
    const lista = porPessoa[em];
    GmailApp.sendEmail(em, 'Os teus projectos · pastas a ' + data, 'Ver a versão HTML.',
      { htmlBody: '<p>Olá,</p><p>Isto é o que a verificação de hoje encontrou nos teus projectos.</p>' + lista.map(bloco).join('') + rodape,
        name: 'IPR | Terracrua Design' });
  });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function instalarSegunda() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'verificar') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('verificar').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone('Europe/Lisbon').create();
}
