const { minify } = require('terser');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ordem = JSON.parse(fs.readFileSync(process.argv[2] || 'pacote/ordem.json'));
const lista = JSON.parse(fs.readFileSync('atlas-novo3.json')).js;
(async () => {
  let saida = ';/* IPR Atlas · pacote único (04/11/2026). Gerado a partir do atlas.json ' + crypto.createHash('sha256').update(fs.readFileSync('atlas-novo3.json')).digest('hex').slice(0,12) + ', pela mesma ordem. Cada ficheiro corre protegido: um erro num não pára os outros. Terracrua Design. */\n';
  let bruto = 0;
  for (let i = 0; i < ordem.length; i++) {
    let src = fs.readFileSync(ordem[i], 'utf8'); bruto += Buffer.byteLength(src);
    const nome = path.basename(ordem[i]).slice(3);
    if (nome === 'habitats.js') {
      const antes = src;
      src = src.replace('var c = document.currentScript && document.currentScript.src;', 'var c = ' + JSON.stringify(lista[i]) + ';');
      if (src === antes) throw new Error('habitats: substituição falhou');
    }
    const r = await minify(src, { compress: { passes: 1 }, mangle: true, format: { comments: false, ascii_only: false } });
    if (!r.code) throw new Error('terser falhou em ' + nome);
    saida += 'try{' + r.code + '\n}catch(e){try{console.error("[IPR pacote] ' + nome + '",e)}catch(_){}}\n';
  }
  fs.writeFileSync('pacote/atlas-pacote.js', saida);
  const gz = require('zlib').gzipSync(saida).length;
  console.log('bruto', bruto, '| pacote', Buffer.byteLength(saida), '| gzip', gz, '| sha', crypto.createHash('sha256').update(saida).digest('hex'));
})().catch(e => { console.error(e.message); process.exit(1); });
