<?php
// Teste local do m90048 com WordPress simulado.
define('ABSPATH','/'); define('HOUR_IN_SECONDS',3600); define('DAY_IN_SECONDS',86400);
define('TCD_EMAIL_EQUIPA','equipa@exemplo.pt');
$F=[]; $O=[]; $T=[]; $TG=[]; $NOTAS=[];
function add_filter($h,$cb,$p=10,$n=1){ global $F; $F[$h][]=$cb; }
function get_option($k,$d=false){ global $O; return $O[$k]??$d; }
function update_option($k,$v,$a=null){ global $O; $O[$k]=$v; }
function get_transient($k){ global $T; return $T[$k]??false; }
function set_transient($k,$v,$e){ global $T; $T[$k]=$v; }
function sanitize_text_field($s){ return trim(strip_tags((string)$s)); }
function sanitize_email($s){ return trim((string)$s); }
function is_email($s){ return (bool)filter_var($s,FILTER_VALIDATE_EMAIL); }
function untrailingslashit($s){ return rtrim($s,'/'); }
function esc_html($s){ return htmlspecialchars((string)$s,ENT_QUOTES); }
function tcd_tg_enviar($m){ global $TG; $TG[]=$m; }
class WP_Error{ public $c,$m,$d; function __construct($c,$m,$d){$this->c=$c;$this->m=$m;$this->d=$d;} }
class WP_REST_Response{ public $d; function __construct($d){$this->d=$d;} function get_data(){return $this->d;} }
class WP_REST_Request{ public $p,$f,$r,$m; function __construct($p,$f=[],$r='/tcd/v1/pedido-base',$m='POST'){$this->p=$p;$this->f=$f;$this->r=$r;$this->m=$m;}
 function get_method(){return $this->m;} function get_route(){return $this->r;} function get_body_params(){return $this->p;} function set_body_params($p){$this->p=$p;} function get_file_params(){return $this->f;} }
class Ordem{ public $tot=10; function add_order_note($n){ global $NOTAS; $NOTAS[]=$n; } function get_total(){return $this->tot;} function get_id(){return 15999;} }
function wc_get_orders($a){ $v=$a['meta_query'][0]['value']; if($v==='REF0'){ $o=new Ordem; $o->tot=0; return [$o]; } return $v==='REF1' ? [new Ordem] : []; }
// área como no m14473 (fórmula do Turf), só para o teste
function tcd_area_anel($c){$n=count($c); if($n<4)return 0; $t=0;$r=6378137.0; for($i=0;$i<$n-1;$i++){$p1=$c[$i];$p2=$c[$i+1];$p3=$c[($i+2)%($n-1)]; $t+=(deg2rad($p3[0])-deg2rad($p1[0]))*sin(deg2rad($p2[1]));} return abs($t*$r*$r/2);}
function tcd_area_geometria($g){ $polys=$g['type']==='Polygon'?[$g['coordinates']]:$g['coordinates']; $m=0; foreach($polys as $pl) foreach($pl as $k=>$ring){$a=tcd_area_anel($ring);$m+=$k?-$a:$a;} return max(0,$m);}
require __DIR__.'/m90048.php';
$poli=json_encode(['type'=>'FeatureCollection','features'=>[['type'=>'Feature','geometry'=>['type'=>'Polygon','coordinates'=>[[[-7.98,37.47],[-7.97,37.47],[-7.97,37.48],[-7.98,37.47]]]]]]]);
$plano=json_encode(['type'=>'FeatureCollection','features'=>[['type'=>'Feature','geometry'=>['type'=>'Polygon','coordinates'=>[[[-7.98,37.47],[-7.98,37.47],[-7.98,37.47],[-7.98,37.47]]]]]]]);
$base=['nome'=>'Pedro Franco','email'=>'pedro@exemplo.pt','telefone'=>'910000000','consentimento'=>'1','t'=>(string)((time()-120)*1000),'geojson'=>$poli,'metodo'=>'desenhar'];
$ok=0;$falhou=0; function v($c,$t){ global $ok,$falhou; if($c){$ok++;echo "ok   $t\n";} else {$falhou++;echo "FALHA $t\n";} }
function limpa(){ global $T; $T=[]; }
$_SERVER['REMOTE_ADDR']='1.2.3.4';
// 1 sem isco: não mexe
$r=new WP_REST_Request($base+['website'=>'']); v(tcd_pbi_antes(null,null,$r)===null && $r->p['website']==='', 'sem isco passa intacto');
// 2 isco + pessoa: limpa e marca
limpa(); $r=new WP_REST_Request(array_merge($base,['website'=>'https://pedro.pt'])); $x=tcd_pbi_antes(null,null,$r);
v($x===null && $r->p['website']==='' && $GLOBALS['tcd_pbi_marca']===spl_object_id($r), 'isco + pessoa: campo limpo, segue');
// 3 depois: nota na encomenda
tcd_pbi_depois(new WP_REST_Response(['ok'=>true,'pedido'=>'REF1']),null,$r); v(count($NOTAS)===1 && empty($GLOBALS['tcd_pbi_marca']), 'nota na encomenda');
// 4 isco + rápido (bot)
limpa();
$r=new WP_REST_Request(array_merge($base,['website'=>'x','t'=>(string)(time()*1000)])); $x=tcd_pbi_antes(null,null,$r);
v($x instanceof WP_Error && $x->d['status']===400 && count($TG)===1 && strpos($TG[0],'tempo')!==false, 'isco + rápido: 400 e Telegram');
// 5 isco sem terreno
$r=new WP_REST_Request(array_merge($base,['website'=>'x','geojson'=>''])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error, 'isco sem terreno: 400');
// 6 isco, polígono de área 0
$r=new WP_REST_Request(array_merge($base,['website'=>'x','geojson'=>$plano])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error, 'isco com polígono de área 0: 400');
// 7 isco, ficheiro de limite carregado
$r=new WP_REST_Request(array_merge($base,['website'=>'x','geojson'=>'']),['limite'=>['name'=>'a.kml','error'=>0]]); v(tcd_pbi_antes(null,null,$r)===null, 'isco com ficheiro de limite: segue');
// 8 isco sem consentimento
$r=new WP_REST_Request(array_merge($base,['website'=>'x','consentimento'=>''])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error, 'isco sem consentimento: 400');
// 9 tecto de Telegram: 10 + 1 resumo
limpa(); $TG=[]; for($i=0;$i<8;$i++){ $_SERVER['REMOTE_ADDR']="9.9.9.$i"; for($j=0;$j<4;$j++){ $r=new WP_REST_Request(array_merge($base,['website'=>'x','t'=>'0'])); tcd_pbi_antes(null,null,$r);} } v(count($TG)===11, 'Telegram: 2 por IP, 10 por dia + resumo: '.count($TG));
limpa(); $_SERVER['REMOTE_ADDR']='5.5.5.5'; $c=[]; for($j=0;$j<7;$j++){ $r=new WP_REST_Request(array_merge($base,['website'=>'x','t'=>'0'])); $y=tcd_pbi_antes(null,null,$r); $c[]=$y->d['status']; } v($c[4]===400 && $c[5]===429, '5 por hora e IP, depois 429');
limpa(); $_SERVER['REMOTE_ADDR']='6.6.6.6'; $acc=0; for($j=0;$j<3;$j++){ $r=new WP_REST_Request(array_merge($base,['website'=>'x'])); if(tcd_pbi_antes(null,null,$r)===null)$acc++; } v($acc===2, 'tecto de aceites: 2 por IP e dia ('.$acc.')');
limpa(); $acc=0; for($j=0;$j<20;$j++){ $_SERVER['REMOTE_ADDR']="7.7.$j.1"; $r=new WP_REST_Request(array_merge($base,['website'=>'x'])); if(tcd_pbi_antes(null,null,$r)===null)$acc++; } v($acc===15, 'tecto de aceites: 15 por dia ('.$acc.')');
limpa(); $_SERVER['REMOTE_ADDR']='1.2.3.4';
// 10 outra rota e GET não mexem
$r=new WP_REST_Request(array_merge($base,['website'=>'x']),[],'/tcd/v1/outra'); v(tcd_pbi_antes(null,null,$r)===null && $r->p['website']==='x','outra rota intacta');
$r=new WP_REST_Request(array_merge($base,['website'=>'x']),[],'/tcd/v1/pedido-base','GET'); v(tcd_pbi_antes(null,null,$r)===null,'GET intacto');
// 11 resposta já existente (erro anterior) mantém-se
$e=new WP_Error('a','b',[]); $r=new WP_REST_Request(array_merge($base,['website'=>'x'])); v(tcd_pbi_antes($e,null,$r)===$e,'resposta anterior mantém-se');
// 12 interruptor
$O['tcd_pbi_off']=1; $r=new WP_REST_Request(array_merge($base,['website'=>'x','t'=>'0'])); v(tcd_pbi_antes(null,null,$r)===null,'interruptor desliga'); unset($O['tcd_pbi_off']);
// 13 registo limitado a 50
v(count($O['tcd_pbi_log'])<=50, 'registo ≤ 50 ('.count($O['tcd_pbi_log']).')');
// 14 geojson lixo / gigante
$r=new WP_REST_Request(array_merge($base,['website'=>'x','geojson'=>'{nao json'])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error,'geojson inválido: 400');
$r=new WP_REST_Request(array_merge($base,['website'=>'x','geojson'=>['a'=>1]])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error,'geojson em array: 400 sem erro PHP');
// 15 t não numérico
$r=new WP_REST_Request(array_merge($base,['website'=>'x','t'=>'abc'])); v(tcd_pbi_antes(null,null,$r) instanceof WP_Error,'t inválido: 400');
// 16 mensagem leva contacto e não tem HTML
v(strpos($x->m,'equipa@exemplo.pt')!==false && strpos($x->m,'<')===false,'mensagem com contacto, sem HTML');
// casos da revisão
limpa(); set_error_handler(function($n,$m){ global $AV; $AV[]=$m; return true; }); $AV=[];
$r=new WP_REST_Request(array_merge($base,['website'=>['a'],'nome'=>['x'],'email'=>['y'],'telefone'=>['z'],'t'=>'0'])); $y=tcd_pbi_antes(null,null,$r); restore_error_handler();
v(empty($AV) && $y instanceof WP_Error, 'arrays nos campos sem avisos PHP');
limpa(); $r=new WP_REST_Request(array_merge($base,['website'=>'0','t'=>(string)((time()-7*3600)*1000)])); v(tcd_pbi_antes(null,null,$r)===null, 'website="0" tratado como vazio (como no m14473)');
limpa(); $r=new WP_REST_Request(array_merge($base,['website'=>'x','nome'=>'A&nbsp;<b>B</b>','t'=>'0'])); $TG=[]; tcd_pbi_antes(null,null,$r); v(isset($TG[0]) && strpos($TG[0],'&nbsp;')===false && strpos($TG[0],'<b>')===false, 'Telegram sem entidades nem etiquetas');
limpa(); $r1=new WP_REST_Request(array_merge($base,['website'=>'x'])); tcd_pbi_antes(null,null,$r1); $r2=new WP_REST_Request($base+['website'=>'']); $NOTAS=[]; tcd_pbi_depois(new WP_REST_Response(['ok'=>true,'pedido'=>'REF1']),null,$r2); v(count($NOTAS)===0, 'marca presa ao pedido certo');
$TG=[]; limpa(); $r=new WP_REST_Request(array_merge($base,['website'=>'x'])); tcd_pbi_antes(null,null,$r);
$GLOBALS['ZERO']=1; function_exists('x');
$TG=[]; limpa(); $_SERVER['REMOTE_ADDR']='8.8.8.8'; $r=new WP_REST_Request(array_merge($base,['website'=>'x'])); tcd_pbi_antes(null,null,$r); tcd_pbi_depois(new WP_REST_Response(['ok'=>true,'pedido'=>'REF0']),null,$r); v(count($TG)===1 && strpos($TG[0],'0 €')!==false, 'encomenda a 0 € (vale já aplicado): aviso Telegram');
$log=$O['tcd_pbi_log']; $ac=array_values(array_filter($log,function($e){return $e['aceite'];})); v($ac && $ac[0]['nome']==='' && $ac[0]['email']==='@exemplo.pt', 'aceites guardam só o domínio');
echo "\n$ok ok, $falhou falhas\n";
