# IPR Atlas · pacote único

Junta num só ficheiro minificado os guiões da lista `js` do `atlas.json` de produção, pela mesma ordem.
Pedido do Nuno a 04/11/2026 (ponto 17 da revisão do iniciante): preparar e ensaiar já, publicar de madrugada.

- `atlas-pacote.js`: gerado a 04/11/2026 a partir do atlas.json sha `90f34ca3…` (65 guiões). 1,83 MB (620 kB comprimido) contra 2,48 MB (790 kB) e 65 pedidos.
- Cada guião corre dentro de `try { } catch`: um erro num não pára os outros, como acontecia com guiões separados. Os erros aparecem na consola como `[IPR pacote] nome.js`.
- `habitats.js` lia o próprio endereço (`document.currentScript`) para achar os dados; no pacote esse endereço fica fixo no do commit original.
- Nenhum guião tem `let`, `const`, classes nem `"use strict"` no nível de topo (verificado com acorn), por isso o embrulho não muda o comportamento.

## Ensaio (04/11/2026, site real)
Computador e telemóvel, sem sessão: entrada, pesquisa, triagem, cartão «Ficha da propriedade», globais (`IPRViz`, `__ipe`, `iprAssistenteComprar`, `iprModo`), classes do `<html>` e mapa iguais à versão normal. 0 erros de JavaScript, 0 erros apanhados dentro do pacote.

## Publicar (de madrugada)
1. Se o `atlas.json` de produção já não tiver o sha `90f34ca3…`, refazer o pacote com `monta-pacote.js` sobre o atlas.json actual e voltar a ensaiar.
2. No `atlas.json`, trocar toda a lista `js` por um único endereço jsDelivr deste ficheiro, fixado pelo commit.
3. Verificar a página e a saúde do Núcleo. **Voltar atrás:** repor o `atlas.json` anterior (guardado em `_anteriores/` pelo Núcleo).

Atenção: a partir daí, cada mudança num guião obriga a refazer o pacote. As sessões que publicam no Atlas têm de o saber.
