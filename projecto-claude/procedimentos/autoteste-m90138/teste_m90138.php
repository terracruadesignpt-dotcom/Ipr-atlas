<?php
// Teste local do m90138 com WordPress e WooCommerce simulados.
define('ABSPATH','/'); define('MINUTE_IN_SECONDS',60); define('HOUR_IN_SECONDS',3600); define('DAY_IN_SECONDS',86400);
$F=[]; $A=[]; $O=[]; $T=[]; $TG=[]; $CRON=[]; $ORD=[]; $MODO='ok';
function add_filter($h,$cb,$p=10,$n=1){ global $F; $F[$h][$p][]=$cb; }
function remove_filter($h,$cb,$p=10){ global $F; if(isset($F[$h][$p])) $F[$h][$p]=array_values(array_filter($F[$h][$p],function($c)use($cb){return $c!==$cb;})); }
function apply_filters($h,$v,...$a){ global $F; if(empty($F[$h]))return $v; ksort($F[$h]); foreach($F[$h] as $cbs) foreach($cbs as $cb) $v=$cb($v,...$a); return $v; }
function add_action($h,$cb,$p=10,$n=1){ global $A; $A[$h][]=$cb; }
function get_option($k,$d=false){ global $O; return $O[$k]??$d; }
function update_option($k,$v,$a=null){ global $O; $O[$k]=$v; }
function get_transient($k){ global $T; return $T[$k]??false; }
function set_transient($k,$v,$e){ global $T; $T[$k]=$v; }
function delete_transient($k){ global $T; unset($T[$k]); }
function add_option($k,$v,$d='',$a=null){ global $O; if(array_key_exists($k,$O)) return false; $O[$k]=$v; return true; }
function delete_option($k){ global $O; unset($O[$k]); }
function wp_clear_scheduled_hook($h){ global $CRON; unset($CRON[$h]); }
function do_action($h,...$a){ global $A; foreach($A[$h]??[] as $cb) $cb(...$a); }
function remove_action($h,$cb,$p=10){ global $A; if(isset($A[$h])) $A[$h]=array_values(array_filter($A[$h],function($c)use($cb){return $c!==$cb;})); }

function wp_next_scheduled($h){ global $CRON; return $CRON[$h]??false; }
function wp_schedule_event($t,$r,$h){ global $CRON; $CRON[$h]=$t; }
function wp_unschedule_event($t,$h){ global $CRON; unset($CRON[$h]); }
function wp_json_encode($v){ return json_encode($v); }
function sanitize_text_field($s){ return trim(strip_tags((string)$s)); }
function wp_strip_all_tags($s){ return strip_tags($s); }
function tcd_tg_enviar($m){ global $TG; $TG[]=$m; }
function wp_mail($to,$s,$m,$h='',$a=[]){ $r=apply_filters('pre_wp_mail',null,['to'=>$to,'subject'=>$s]); if($r!==null) return $r; $GLOBALS['ENVIADOS'][]=$s; return true; }
class WP_REST_Request{ public $m,$r,$p=[]; function __construct($m,$r){$this->m=$m;$this->r=$r;} function set_body_params($p){$this->p=$p;} function get_body_params(){return $this->p;} }
class WP_REST_Response{ public $d,$s; function __construct($d,$s=200){$this->d=$d;$this->s=$s;} function get_data(){return $this->d;} function get_status(){return $this->s;} }
class WP_Error{ public $c,$m,$d; function __construct($c,$m,$d){$this->c=$c;$this->m=$m;$this->d=$d;} }
function rest_ensure_response($r){ if($r instanceof WP_Error) return new WP_REST_Response(['code'=>$r->c,'message'=>$r->m],$r->d['status']); return $r; }
class Ordem{ public $id,$st='pending',$tot=99,$meta=[],$notas=[],$email='autoteste.base@example.com'; function __construct($id){$this->id=$id;} function get_id(){return $this->id;} function get_status(){return $this->st;} function get_total(){return $this->tot;} function get_meta($k){return $this->meta[$k]??'';} function update_meta_data($k,$v){$this->meta[$k]=$v;} function add_order_note($n){$this->notas[]=$n;} function save(){} function save_meta_data(){} function get_billing_email(){return $this->email;} function delete($f){ $this->st='trash'; $this->id=0; } }
function wc_get_orders($a){ global $ORD; $v=$a['meta_query'][0]['value']; foreach($ORD as $o) if($o->meta['_tcd_pedido']===$v) return [$o]; return []; }
function wc_get_order($id){ global $ORD; return $id? ($ORD[$id]??false) : false; }
class Srv{ function dispatch($req){ global $MODO,$ORD;
  $p=$req->get_body_params();
  if($MODO==='erro') return new WP_Error('tcd_x','Bloqueado pela guarda',['status'=>400]);
  if($MODO==='vazio') return new WP_REST_Response(['ok'=>true]);
  if($MODO==='excepcao') throw new RuntimeException('falha interna');
  $g=json_decode($p['geojson'],true); if(empty($g['features'])) return new WP_Error('g','sem geo',['status'=>400]);
  if($p['email']!=='autoteste.base@example.com' || $p['website']!=='' || time()-(int)$p['t']/1000<8) return new WP_Error('d','dados',['status'=>400]);
  $o=new Ordem(500+count($ORD)); $ORD[$o->id]=$o; $o->meta['_tcd_pedido']='REF'.count($ORD); do_action('woocommerce_new_order',$o->id,$o); if($MODO==='excdepois') throw new RuntimeException('depois de criar'); $o->meta['_tcd_area_ha']=1.23; if($MODO==='semmail'){ } else { wp_mail('equipa@x.pt','Pedido Base Cartográfica 1,2 ha · '.$p['nome'],''); wp_mail($p['email'],'Recebemos',''); wp_mail('outro@x.pt','Outro assunto',''); }
  if($MODO==='processing') $o->st='processing';
  return new WP_REST_Response(['ok'=>true,'pedido'=>$o->meta['_tcd_pedido'],'area_ha'=>1.23]); } }
function rest_get_server(){ static $s; return $s ?: $s=new Srv; }
require __DIR__.'/m90138.php';
$ok=0;$fa=0; function v($c,$t){ global $ok,$fa; if($c){$ok++;echo "ok   $t\n";}else{$fa++;echo "FALHA $t\n";} }
function corre($m){ global $MODO,$T; $MODO=$m; return tcd_autoteste_correr(true); }
// agendamento
tcd_autoteste_agendar(); v(isset($CRON['tcd_autoteste_diario']) && gmdate('H:i',$CRON['tcd_autoteste_diario'])==='05:10','agenda às 05:10 UTC');
$O['tcd_autoteste_off']=1; tcd_autoteste_agendar(); v(!isset($CRON['tcd_autoteste_diario']),'interruptor desagenda'); v(tcd_autoteste_correr()===null,'interruptor impede correr'); unset($O['tcd_autoteste_off']);
// caminho bom
$GLOBALS['ENVIADOS']=[]; $r=corre('ok');
v($r['ok']===1 && $r['encomenda']>0 && $r['pedido']!=='','caminho bom passa: '.json_encode($r['passos']));
v($GLOBALS['ENVIADOS']===['Outro assunto'],'só os e-mails do teste são travados');
$o=$ORD[$r['encomenda']]; v($r['passos']['lixo']==='ok' && $o->st==='trash' && $o->meta['tocwoo_enabled']==='0' && !empty($o->meta['_tcd_autoteste']) && count($o->notas)===1,'encomenda marcada, sem factura, no lixo');
v(empty($TG),'sem Telegram quando passa');
v(get_option('tcd_autoteste_ultimo')['ok']===1 && count(get_option('tcd_autoteste_hist'))===1,'resultado e histórico gravados');
$GLOBALS['ENVIADOS']=[]; wp_mail(TCD_AUTOTESTE_EMAIL,'depois',''); v($GLOBALS['ENVIADOS']===['depois'],'e-mails voltam a sair depois do teste');
// referência vazia (caso Vila Bita)
$r=corre('vazio'); v($r['ok']===0 && strpos($r['passos']['resposta'],'falhou')===0 && count($TG)===1,'«ok» sem referência falha e avisa');
// guarda bloqueia
$TG=[]; unset($T['tcd_autoteste_tg']); $r=corre('erro'); v($r['ok']===0 && strpos($r['passos']['resposta'],'Bloqueado')!==false && count($TG)===1,'erro da guarda aparece no aviso');
// Telegram no máximo 1 por dia
$r=corre('erro'); v(count($TG)===1,'Telegram no máximo 1 por dia');
// excepção
unset($T['tcd_autoteste_tg']); $TG=[]; $r=corre('excepcao'); v($r['ok']===0 && strpos($r['erro'],'falha interna')!==false && count($TG)===1 && empty($GLOBALS['tcd_autoteste_activo']),'excepção apanhada, filtro de e-mail retirado');
// sem e-mails
unset($T['tcd_autoteste_tg']); $r=corre('semmail'); v($r['ok']===0 && strpos($r['passos']['emails'],'falhou')===0,'sem e-mails tentados falha');
// estado errado
unset($T['tcd_autoteste_tg']); $r=corre('processing'); v($r['ok']===0 && strpos($r['passos']['encomenda'],'processing')!==false && $ORD[$r['encomenda']]->st==='processing' && strpos($r['passos']['lixo'],'não')===0 && strpos(end($TG),'#'.$r['encomenda'])!==false,'em processamento: falha, não vai para o lixo, aviso com número');
unset($T['tcd_autoteste_tg']); $r=corre('excdepois'); $e=$ORD[$r['encomenda']]??null; v($r['ok']===0 && $e && $e->st==='trash' && $e->meta['tocwoo_enabled']==='0' && strpos($r['erro'],'depois de criar')!==false,'excepção depois de criar: encomenda limpa na mesma');
v(empty($GLOBALS['tcd_autoteste_activo']) && !isset($O['tcd_autoteste_trinco']),'estado global e trinco limpos');
$n=count($ORD); $MODO='ok'; v(tcd_autoteste_correr()===null && count($ORD)===$n,'sem forçar, não repete no mesmo dia');
// trinco
$O['tcd_autoteste_trinco']=time(); $MODO='ok'; v(tcd_autoteste_correr(true)===null,'trinco impede duas execuções'); $O['tcd_autoteste_trinco']=time()-3600; v(is_array(tcd_autoteste_correr(true)),'trinco abandonado é retomado');
v(count(get_option('tcd_autoteste_hist'))<=30,'histórico limitado');
echo "\n$ok ok, $fa falhas\n";
