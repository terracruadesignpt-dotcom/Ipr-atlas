<?php
define('ABSPATH','/'); $A=[];
function add_action($h,$cb,$p=10){ global $A; $A[$h][$p][]=$cb; }
function get_option($k,$d=''){ return $d; }
$PONTOS=0;
function tcd_sn_ip(){ return $_SERVER['REMOTE_ADDR']; }
// Sentinela simulada, registada primeiro (como o m14553), prioridade 1
add_action('init',function(){ global $PONTOS; if(''===trim((string)($_SERVER['HTTP_USER_AGENT']??''))) $PONTOS+=5; },1);
require $argv[1];
function corre(){ global $A; ksort($A['init']); foreach($A['init'] as $l) foreach($l as $cb) $cb(); }
foreach ([['91.108.5.146','/wp-json/tcd/v1/telegram',0],['149.154.167.1','/wp-json/tcd/v1/telegram',0],['8.8.8.8','/wp-json/tcd/v1/telegram',5],['91.108.5.146','/outra',5]] as [$ip,$u,$esp]) {
 $PONTOS=0; $_SERVER=['REMOTE_ADDR'=>$ip,'REQUEST_URI'=>$u]; corre(); echo ($PONTOS===$esp?'ok   ':'FALHA ')."$ip $u pontos=$PONTOS (esperado $esp)\n";
}
