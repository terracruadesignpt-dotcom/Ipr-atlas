/* Terracrua Design · validação de identificadores espanhóis no formulário de encomenda (Atlas).
 * NIF de pessoa (DNI 8 algarismos + letra), NIE (X/Y/Z + 7 algarismos + letra),
 * CIF/NIF de entidade (letra + 7 algarismos + controlo), e referencia catastral (14 ou 20).
 * Só valida o formato e os dígitos de controlo; a existência confirma-se no VIES (operadores
 * intracomunitários) ou fica a cargo do cliente. */
(function (g) {
  'use strict';
  var LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';

  function limpar(v) { return String(v || '').toUpperCase().replace(/[\s.\-]/g, '').replace(/^ES/, ''); }

  function dni(v) {
    var m = /^(\d{8})([A-Z])$/.exec(v);
    return !!m && LETRAS[parseInt(m[1], 10) % 23] === m[2];
  }

  function nie(v) {
    var m = /^([XYZ])(\d{7})([A-Z])$/.exec(v);
    if (!m) return false;
    var n = parseInt('XYZ'.indexOf(m[1]) + m[2], 10);
    return LETRAS[n % 23] === m[3];
  }

  function cif(v) {
    var m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(v);
    if (!m) return false;
    var d = m[2], par = 0, impar = 0;
    for (var i = 0; i < 7; i++) {
      var x = parseInt(d[i], 10);
      if (i % 2 === 0) { var y = x * 2; impar += Math.floor(y / 10) + (y % 10); } else { par += x; }
    }
    var c = (10 - ((par + impar) % 10)) % 10;
    var letra = 'JABCDEFGHI'[c];
    var soLetra = 'NPQRSW'.indexOf(m[1]) >= 0;   // entidades que levam letra
    var soNum = 'ABEH'.indexOf(m[1]) >= 0;       // entidades que levam número
    if (soLetra) return m[3] === letra;
    if (soNum) return m[3] === String(c);
    return m[3] === String(c) || m[3] === letra;
  }

  /* Devolve {ok, tipo} com tipo 'dni' | 'nie' | 'cif' | null. Aceita prefixo ES (NIF-IVA). */
  function validarNifEs(valor) {
    var v = limpar(valor);
    if (dni(v)) return { ok: true, tipo: 'dni', valor: v };
    if (nie(v)) return { ok: true, tipo: 'nie', valor: v };
    if (cif(v)) return { ok: true, tipo: 'cif', valor: v };
    // NIF especiais de pessoa (K, L, M): letra + 7 algarismos + letra de controlo
    var m = /^([KLM])(\d{7})([A-Z])$/.exec(v);
    if (m && LETRAS[parseInt(m[2], 10) % 23] === m[3]) return { ok: true, tipo: 'nif-especial', valor: v };
    return { ok: false, tipo: null, valor: v };
  }

  /* Referencia catastral: 14 caracteres identificam a parcela; 20 incluem o
   * imóvel (4 algarismos) e dois caracteres de controlo. Para rústica, as 14
   * primeiras posições são província (2), município (3), sector (1 letra),
   * polígono (3) e parcela (5). Aqui só se valida o formato; a geometria
   * vem do serviço do Catastro. */
  function lerRefCatastral(valor) {
    var v = String(valor || '').toUpperCase().replace(/[\s.\-]/g, '');
    if (!/^[0-9A-Z]{14}([0-9]{4}[A-Z]{2})?$/.test(v)) return { ok: false, valor: v };
    var r = { ok: true, valor: v, parcela14: v.slice(0, 14), completa: v.length === 20 };
    var ru = /^(\d{2})(\d{3})([A-Z])(\d{3})(\d{5})$/.exec(r.parcela14);
    if (r.completa) r.dc_ok = dcCatastral(v) === v.slice(18, 20);
    if (ru) {
      r.rustica = { provincia: ru[1], municipio: ru[2], sector: ru[3],
                    poligono: parseInt(ru[4], 10), parcela: parseInt(ru[5], 10) };
    }
    return r;
  }

  /* Dígitos de control da referencia de 20 caracteres. Algoritmo conhecido
   * (pesos 13,15,12,5,4,17,9,21,3,7,1; tabela MQWERTYUIOPASDFGHJKLBZX), confirmado
   * só num exemplo público: serve de AVISO ao cliente, nunca de recusa. O Catastro
   * é que decide se a referência existe. Confirmar com respostas reais (ES-4). */
  function dcCatastral(rc) {
    var P = [13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1], T = 'MQWERTYUIOPASDFGHJKLBZX';
    var A = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', out = '';
    [rc.slice(0, 7) + rc.slice(14, 18), rc.slice(7, 14) + rc.slice(14, 18)].forEach(function (p) {
      var s = 0;
      for (var i = 0; i < 11; i++) {
        var c = p[i];
        s += P[i] * (/[0-9]/.test(c) ? parseInt(c, 10) : A.indexOf(c) + 1);
      }
      out += T[s % 23];
    });
    return out;
  }

  var api = { validarNifEs: validarNifEs, lerRefCatastral: lerRefCatastral };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else g.TCD_ES = api;
})(typeof window !== 'undefined' ? window : globalThis);
