#!/usr/bin/env python3
# Gera os PDF anexos ao e-mail de confirmação (ES-11, opção tcd_es11_adjuntos) a partir de legal-es/.
# Tira as notas internas ([REVISAR…], [CONFIRMAR…], [COMPLETAR…]). Os marcadores por preencher ([FECHA…] etc.)
# ficam visíveis e, enquanto houver algum, o PDF sai com a marca «BORRADOR». Uso: python3 gerar.py [--final]
import re, subprocess, sys, pathlib
L = pathlib.Path(__file__).resolve().parent.parent / 'legal-es'
SAIDA = pathlib.Path(__file__).resolve().parent
NOTA = re.compile(r'\[(REVISAR|CONFIRMAR|COMPLETAR)[^\[\]]*(\[[^\]]*\][^\[\]]*)*\]')
def limpar(t):
    t = NOTA.sub('', t)
    t = re.sub(r'^\s*$\n(?=\s*$)', '', t, flags=re.M)
    return t
CSS = """body{font-family:'DejaVu Serif',Georgia,serif;font-size:10.5pt;line-height:1.45;color:#222;margin:0}
h1{font-size:17pt;color:#3f4630;margin:0 0 6pt}h2{font-size:12.5pt;color:#3f4630;margin:16pt 0 4pt}h3{font-size:11pt;margin:12pt 0 4pt}
table{border-collapse:collapse;width:100%;font-size:9pt}td,th{border:1px solid #ccc;padding:3pt 5pt;vertical-align:top}
blockquote{margin:6pt 0 6pt 12pt;padding-left:8pt;border-left:2px solid #c9c4ae}
.pie{font-size:8pt;color:#666;margin-top:20pt;border-top:1px solid #ddd;padding-top:4pt}
.borrador{font:700 14pt sans-serif;color:#b00;border:2px solid #b00;padding:4pt 8pt;margin-bottom:10pt;display:inline-block}"""
def pdf(md, nome, titulo, final):
    t = (L / md).read_text()
    if md.startswith('formulario'):  # para o cliente só A (modelo) e B (informação); C a F são instruções internas
        a = t[t.find('## A.'):t.find('## B.')]; b = t[t.find('## B.'):t.find('\n## C.')]
        a = '\n'.join(l for l in a.split('\n')[1:] if not l.startswith('Página propuesta'))
        b = '\n'.join(b.split('\n')[1:])
        t = '# Formulario de desistimiento\n' + a + '\n## Información sobre el desistimiento\n' + b
        t = t.replace('[ENLACE]', 'terracruadesign.pt/es/desistimiento/')
    t = limpar(t)
    falta = sorted(set(re.findall(r'\[[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ .,º/\-0-9…]{3,}\]', t)))
    corpo = subprocess.run(['pandoc', '-f', 'markdown', '-t', 'html'], input=t, capture_output=True, text=True, check=True).stdout
    marca = '' if (final and not falta) else '<div class="borrador">BORRADOR · NO ENVIAR A CLIENTES</div>'
    html = f'<!doctype html><html lang="es"><meta charset="utf-8"><title>{titulo}</title><style>{CSS}</style><body>{marca}{corpo}<p class="pie">IPR – Instituto de Planeamento Regenerativo, Lda. (Terracrua Design) · NIF-IVA PT518739538 · terracruadesign.pt/es/</p></body></html>'
    h = SAIDA / (nome + '.html'); h.write_text(html)
    subprocess.run(['wkhtmltopdf', '-q', '--encoding', 'utf-8', '-s', 'A4', '-T', '18mm', '-B', '18mm', '-L', '18mm', '-R', '18mm', str(h), str(SAIDA / (nome + '.pdf'))], check=False)
    h.unlink()
    return falta
final = '--final' in sys.argv
for md, nome, tit in [('terminos-y-condiciones.md', 'terminos-y-condiciones', 'Términos y condiciones'), ('formulario-desistimiento.md', 'formulario-desistimiento', 'Formulario de desistimiento')]:
    f = pdf(md, nome, tit, final)
    print(nome + '.pdf', 'BORRADOR' if f or not final else 'final', ('por preencher: ' + ', '.join(f)) if f else '')
