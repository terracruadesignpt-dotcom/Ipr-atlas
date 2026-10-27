<?php
// Simula o do_shortcode_tag do WordPress com a cache do m90013 (lógica copiada para teste) e o m90177.
define('ABSPATH','/'); define('HOUR_IN_SECONDS',3600);
$F=[]; $T=[]; $LOGADO=false;
function add_filter($h,$cb,$p=10,$n=1){ global $F; $F[$h][$p][]=[$cb,$n]; }
function add_action($h,$cb,$p=10,$n=1){ add_filter($h,$cb,$p,$n); }
function apply_filters($h,$v,...$a){ global $F; if(empty($F[$h]))return $v; ksort($F[$h]); foreach($F[$h] as $l) foreach($l as [$cb,$n]) $v=$cb(...array_slice(array_merge([$v],$a),0,$n)); return $v; }
function get_option($k,$d=false){ return $d; } function is_user_logged_in(){ global $LOGADO; return $LOGADO; }
function get_transient($k){ global $T; return $T[$k]??false; } function set_transient($k,$v,$e){ global $T; $T[$k]=$v; }
// m90013 (só a cache)
function tcd_pg2_chave($p){ return 'tcd_pg_'.md5($p); } function tcd_pg2_cacheavel($p){ return !in_array($p,['contacto','consultoria'],true); }
add_filter('pre_do_shortcode_tag',function($r,$tag,$attr){ if('tcd_pg'!==$tag||is_user_logged_in())return $r; $p=$attr['p']??''; if(!tcd_pg2_cacheavel($p))return $r; $c=get_transient(tcd_pg2_chave($p)); return is_string($c)&&''!==$c?$c:$r; },10,3);
add_filter('do_shortcode_tag',function($out,$tag,$attr){ if('tcd_pg'!==$tag||''===$out)return $out; $p=$attr['p']??''; if(!is_user_logged_in()&&tcd_pg2_cacheavel($p)&&false===strpos($out,'tcd_pg_cache')) set_transient(tcd_pg2_chave($p),$out.'<!-- tcd_pg_cache -->',12*HOUR_IN_SECONDS); return $out; },10,3);
require $argv[1];
// do_shortcode_tag do núcleo do WordPress
function sc($tag,$attr){ $r=apply_filters('pre_do_shortcode_tag',false,$tag,$attr,[]); if(false!==$r) return $r; $out='<div><p>Uma equipa que desenhou e implementou centenas de milhares de hectares em Angola, Portugal e Estados Unidos.</p><p>infraestrutura</p></div>'; return apply_filters('do_shortcode_tag',$out,$tag,$attr,[]); }
$a=sc('tcd_pg',['p'=>'equipa']); $b=sc('tcd_pg',['p'=>'equipa']);
$ok=function($s){ return strpos($s,'perto de meio milhão')!==false && strpos($s,'infra-estrutura')!==false && strpos($s,'centenas')===false; };
echo "1.º pedido (gera a cache): ".($ok($a)?'corrigido':'NÃO corrigido')."\n2.º pedido (vem da cache): ".($ok($b)?'corrigido':'NÃO corrigido')."\n";
$LOGADO=true; echo "com sessão: ".($ok(sc('tcd_pg',['p'=>'equipa']))?'corrigido':'NÃO corrigido')."\n";
