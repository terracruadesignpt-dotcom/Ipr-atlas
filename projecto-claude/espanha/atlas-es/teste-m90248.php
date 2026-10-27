<?php
define('ABSPATH','/'); $GLOBALS['ac']=[]; $GLOBALS['opt']=[]; $GLOBALS['pg']=true; $GLOBALS['vis']=true; $GLOBALS['enq']=[];
function add_action($h,$f,$p=10){ $GLOBALS['ac'][$h][]=$f; }
function get_option($k,$d=false){ return $GLOBALS['opt'][$k] ?? $d; }
function is_page($x){ return $GLOBALS['pg']; }
function tcd_esp_visivel(){ return $GLOBALS['vis']; }
function content_url($p){ return 'https://x/wp-content/'.$p; }
function wp_enqueue_script($h,$u,$d,$v,$f){ $GLOBALS['enq'][]=[$h,$u,$v]; }
require __DIR__.'/t/modulos/m90248.php';
$n=0;$f=0; function ok($c,$m){ global $n,$f; $n++; if(!$c)$f++; echo ($c?'ok    ':'FALHA ').$m."\n"; }
$run=function(){ $GLOBALS['enq']=[]; foreach($GLOBALS['ac']['wp_enqueue_scripts'] as $cb) $cb(); return $GLOBALS['enq']; };
$e=$run(); ok(count($e)===1 && strpos($e[0][1],'assets/atlas/es-camadas.js')!==false && strlen($e[0][2])===10, 'administrador no Atlas: carrega es-camadas.js com versão');
$GLOBALS['vis']=false; ok(!$run(), 'Espanha fechada e sem ser administrador: não carrega');
$GLOBALS['vis']=true; $GLOBALS['pg']=false; ok(!$run(), 'fora do Atlas: não carrega');
$GLOBALS['pg']=true; $GLOBALS['opt']['tcd_es_camadas_off']='1'; ok(!$run(), 'interruptor desliga');
echo "\n$n testes, $f falhas\n"; exit($f?1:0);
