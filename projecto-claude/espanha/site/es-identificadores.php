<?php
/* Terracrua Design · validação de identificadores espanhóis (servidor).
 * Mesma lógica de es-identificadores.js. Para incluir no módulo da encomenda ES. */
if (!defined('ABSPATH') && php_sapi_name() !== 'cli') { exit; }

if (!function_exists('tcd_es_nif')) {
    function tcd_es_nif($valor) {
        $L = 'TRWAGMYFPDXBNJZSQVHLCKE';
        $v = strtoupper(preg_replace('/[\s.\-]/', '', (string) $valor));
        $v = preg_replace('/^ES/', '', $v);
        if (preg_match('/^(\d{8})([A-Z])$/', $v, $m)) {
            return array('ok' => $L[intval($m[1]) % 23] === $m[2], 'tipo' => 'dni', 'valor' => $v);
        }
        if (preg_match('/^([XYZ])(\d{7})([A-Z])$/', $v, $m)) {
            $n = intval(strpos('XYZ', $m[1]) . $m[2]);
            return array('ok' => $L[$n % 23] === $m[3], 'tipo' => 'nie', 'valor' => $v);
        }
        if (preg_match('/^([KLM])(\d{7})([A-Z])$/', $v, $m)) {
            return array('ok' => $L[intval($m[2]) % 23] === $m[3], 'tipo' => 'nif-especial', 'valor' => $v);
        }
        if (preg_match('/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/', $v, $m)) {
            $par = 0; $impar = 0;
            for ($i = 0; $i < 7; $i++) {
                $x = intval($m[2][$i]);
                if ($i % 2 === 0) { $y = $x * 2; $impar += intdiv($y, 10) + ($y % 10); } else { $par += $x; }
            }
            $c = (10 - (($par + $impar) % 10)) % 10;
            $letra = 'JABCDEFGHI'[$c];
            if (strpos('NPQRSW', $m[1]) !== false) { $ok = ($m[3] === $letra); }
            elseif (strpos('ABEH', $m[1]) !== false) { $ok = ($m[3] === (string) $c); }
            else { $ok = ($m[3] === (string) $c || $m[3] === $letra); }
            return array('ok' => $ok, 'tipo' => 'cif', 'valor' => $v);
        }
        return array('ok' => false, 'tipo' => null, 'valor' => $v);
    }

    /* Dígitos de control (aviso, nunca recusa; ver es-identificadores.js). */
    function tcd_es_dc_catastral($rc) {
        $P = array(13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1); $T = 'MQWERTYUIOPASDFGHJKLBZX';
        $A = array_merge(range('A', 'N'), array('Ñ'), range('O', 'Z'));
        $out = '';
        foreach (array(substr($rc, 0, 7) . substr($rc, 14, 4), substr($rc, 7, 7) . substr($rc, 14, 4)) as $p) {
            $s = 0;
            for ($i = 0; $i < 11; $i++) {
                $c = $p[$i];
                $s += $P[$i] * (ctype_digit($c) ? intval($c) : (array_search($c, $A, true) + 1));
            }
            $out .= $T[$s % 23];
        }
        return $out;
    }

    function tcd_es_ref_catastral($valor) {
        $v = strtoupper(preg_replace('/[\s.\-]/', '', (string) $valor));
        if (!preg_match('/^[0-9A-Z]{14}([0-9]{4}[A-Z]{2})?$/', $v)) { return array('ok' => false, 'valor' => $v); }
        $r = array('ok' => true, 'valor' => $v, 'parcela14' => substr($v, 0, 14), 'completa' => strlen($v) === 20);
        if ($r['completa']) { $r['dc_ok'] = (tcd_es_dc_catastral($v) === substr($v, 18, 2)); }
        if (preg_match('/^(\d{2})(\d{3})([A-Z])(\d{3})(\d{5})$/', $r['parcela14'], $m)) {
            $r['rustica'] = array('provincia' => $m[1], 'municipio' => $m[2], 'sector' => $m[3],
                                  'poligono' => intval($m[4]), 'parcela' => intval($m[5]));
        }
        return $r;
    }
}
