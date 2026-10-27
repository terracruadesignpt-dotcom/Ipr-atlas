#!/usr/bin/env python3
"""Obtém do EUR-Lex o Anexo I (A: instruções de desistência; B: formulário de desistência) da
Directiva 2011/83/UE em cada língua oficial da UE, no texto consolidado (com as alterações da
Directiva 2019/2161). Corre num computador ou servidor com acesso ao eur-lex.europa.eu
(o ambiente do Claude não tem). Não traduz nada: grava o texto oficial tal como vem.

Uso:  python3 obter_formularios.py [pasta_saida]
Saída: <pasta>/<LG>.md (um por língua) e <pasta>/_relatorio.txt
Requer: requests, beautifulsoup4  (pip install requests beautifulsoup4)
"""
import re, sys, time, pathlib
import requests
from bs4 import BeautifulSoup

LINGUAS = ['BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 'GA', 'HR', 'HU', 'IT',
           'LT', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SL', 'SV']
# Texto consolidado em vigor (alterado pela Directiva 2019/2161); recurso: texto original.
CELEX = ['02011L0083-20220528', '32011L0083']
URL = 'https://eur-lex.europa.eu/legal-content/{lg}/TXT/HTML/?uri=CELEX:{celex}'
ROMANO_I = re.compile(r'\bI\s*$')
ROMANO_II = re.compile(r'\bII\s*$')

def anexo_i(html):
    sopa = BeautifulSoup(html, 'html.parser')
    # Títulos de anexo: parágrafos «doc-ti» (original) ou «title-annex-1» (consolidado).
    titulos = sopa.select('p.doc-ti, p.title-annex-1')
    ini = fim = None
    for t in titulos:
        tx = t.get_text(' ', strip=True)
        if ini is None and ROMANO_I.search(tx) and len(tx) < 20:
            ini = t
        elif ini is not None and ROMANO_II.search(tx) and len(tx) < 20:
            fim = t
            break
    if ini is None:
        return None
    partes, n = [], ini
    while n is not None and n is not fim:
        if getattr(n, 'name', None) in ('p', 'td', 'li', 'span') and not n.find(['p', 'table']):
            tx = n.get_text(' ', strip=True)
            if tx and (not partes or partes[-1] != tx):
                partes.append(tx)
        n = n.find_next()
    return '\n\n'.join(partes)

def main():
    saida = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'anexo-i')
    saida.mkdir(parents=True, exist_ok=True)
    rel = []
    for lg in LINGUAS:
        texto, usado = None, None
        for celex in CELEX:
            url = URL.format(lg=lg, celex=celex)
            try:
                r = requests.get(url, timeout=60, headers={'User-Agent': 'IPR-legal-check/1.0'})
                if r.status_code == 200:
                    texto = anexo_i(r.text)
                    if texto:
                        usado = url
                        break
            except requests.RequestException as e:
                rel.append(f'{lg}: erro {e}')
            time.sleep(2)
        if texto:
            (saida / f'{lg}.md').write_text(f'<!-- Fonte oficial: {usado} (obtido em {time.strftime("%Y-%m-%d")}) -->\n\n{texto}\n', encoding='utf-8')
            rel.append(f'{lg}: ok ({len(texto)} caracteres) {usado}')
        else:
            rel.append(f'{lg}: POR OBTER (anexo não encontrado)')
    (saida / '_relatorio.txt').write_text('\n'.join(rel) + '\n', encoding='utf-8')
    print('\n'.join(rel))

if __name__ == '__main__':
    main()
