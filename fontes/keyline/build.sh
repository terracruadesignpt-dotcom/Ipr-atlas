set -e
cd /home/claude/keyline
python3 - <<'PY'
m=open('motor.js').read().replace('if (typeof module !== "undefined") module.exports = iprKeylineMotor;\n','')
u=open('ui.js').read().replace("      if (!M.isStyleLoaded || M.isStyleLoaded() !== false) {}\n","").replace("  /*__MOTOR__*/\n", m)
open('keyline.js','w').write(u)
PY
npx terser keyline.js -c -m -o corpo.min.js
printf '/* IPR Atlas · motor keyline (fase 2, em teste), 17/11/2026. Versão 0.2: a keyline atravessa vales pequenos; vales e cumeadas só dentro do terreno. Carregado pelo m92020. Terracrua Design. */\n' > keyline.min.js
cat corpo.min.js >> keyline.min.js
node -e "new Function(require('fs').readFileSync('keyline.min.js','utf8'))"
wc -c keyline.min.js; sha256sum keyline.min.js | cut -c1-64
