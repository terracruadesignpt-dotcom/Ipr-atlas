<?php
define('ABSPATH','/'); $GLOBALS['ac']=[]; $GLOBALS['opt']=[]; $GLOBALS['pg']=true; $GLOBALS['adm']=true; $GLOBALS['enq']=[];
function add_action($h,$f,$p=10){ $GLOBALS['ac'][$h][]=$f; }
function get_option($k,$d=false){ return $GLOBALS['opt'][$k] ?? $d; }
function is_page($x){ return $GLOBALS['pg']; }
function current_user_can($c){ return $GLOBALS['adm']; }
function content_url($p){ return 'https://x/wp-content/'.$p; }
function wp_enqueue_script($h,$u,$d,$v,$f){ $GLOBALS['enq'][]=[$h,$u,$v]; }
require __DIR__.'/t/modulos/m90310.php';
$n=0;$f=0; function ok($c,$m){ global $n,$f; $n++; if(!$c)$f++; echo ($c?'ok    ':'FALHA ').$m."\n"; }
$run=function(){ $GLOBALS['enq']=[]; foreach($GLOBALS['ac']['wp_enqueue_scripts'] as $cb) $cb(); return $GLOBALS['enq']; };
$e=$run(); ok(count($e)===1 && strpos($e[0][1],'assets/atlas/fr-camadas.js')!==false && strlen($e[0][2])===10, 'administrador no Atlas: carrega fr-camadas.js com versão');
$GLOBALS['adm']=false; ok(!$run(), 'França fechada e sem ser administrador: não carrega');
$GLOBALS['opt']['tcd_fra_aberto']='1'; ok(count($run())===1, 'França aberta: carrega para todos');
$GLOBALS['pg']=false; ok(!$run(), 'fora do Atlas: não carrega');
$GLOBALS['pg']=true; $GLOBALS['opt']['tcd_fr_camadas_off']='1'; ok(!$run(), 'interruptor desliga');
echo "\n$n testes, $f falhas\n"; exit($f?1:0);
