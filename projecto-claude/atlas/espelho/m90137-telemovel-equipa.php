<?php
// Módulo 90137: acabamentos no telemóvel para as páginas da equipa (capturas do Nuno, 20/10/2026, 21h25, iPhone).
// Actua por cima do m90030 (barra de cima), m90130 (Início), m90029 (Administração), m90020 (Clientes), m90201
// (Projectos antigos), m90028 (Reportar) e m90160 (Convidar), sem os alterar. Só CSS e um pouco de JS, só em
// ecrãs até 782 px, só nas páginas da equipa (tcd_hub_paginas). O que corrige:
// 1. A barra fixa da equipa ficava a 46 px do topo por causa da barra do WordPress, que no telemóvel desaparece ao
//    rolar: o conteúdo via-se por cima e por baixo dela. Agora a barra do WordPress não aparece nestas páginas no
//    telemóvel, a barra da equipa fica no topo e o conteúdo começa logo abaixo (altura medida a cada mudança).
// 2. Os botões fixos de baixo (Convidar, Cookies, Reportar, assistente) tapavam o fim da página: folga em baixo e o
//    Reportar sobe para não ficar debaixo do botão redondo.
// 3. A tabela das Facturas (Administração) saía do ecrã e os cabeçalhos sobrepunham-se: passa a rolar na horizontal.
// 4. «Escolhe um cliente à esquerda» e «Escolhe um projecto à esquerda»: no telemóvel a lista está em cima.
// Desligar: opção tcd_mob2_off = 1.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_mob2_on() { return '1' !== (string) get_option( 'tcd_mob2_off', '' ) && function_exists( 'tcd_hub_paginas' ) && function_exists( 'tcd_hub_ok' ) && tcd_hub_ok() && is_page( tcd_hub_paginas() ); }

add_action( 'wp_footer', function () {
	if ( ! tcd_mob2_on() ) { return; }
	echo '<style id="tcdmob2">@media (max-width:782px){'
		. 'html body #wpadminbar{display:none!important}html{margin-top:0!important}'
		. 'html body .tcdhb-top{top:0!important;height:auto!important;min-height:48px}'
		. 'html.tcdhb-on body,html.tcdhb-on body.admin-bar{padding-top:var(--hbh,96px)!important;padding-bottom:110px!important}'
		. 'html.tcdhb-on .tcdhb{top:var(--hbh,96px)!important}'
		. 'html body .tcdr2-b{bottom:72px!important}'
		. 'html body .tcdad table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap;font-size:14px}'
		. 'html body .tcdad th,html body .tcdad td{padding:6px 8px}'
		. '}</style>'
		. '<script>(function(){var b=document.querySelector(".tcdhb-top");if(!b)return;var r=document.documentElement;'
		. 'function h(){if(innerWidth>782)return;r.style.setProperty("--hbh",Math.ceil(b.getBoundingClientRect().height)+"px");}'
		. 'h();addEventListener("load",h);addEventListener("resize",h);if(window.ResizeObserver){new ResizeObserver(h).observe(b);}'
		. 'function t(){if(innerWidth>900)return;var ps=document.querySelectorAll("p");for(var i=0;i<ps.length;i++){var p=ps[i];if(p.childNodes.length===1&&p.firstChild.nodeType===3&&p.textContent.indexOf("à esquerda")>-1){p.firstChild.nodeValue=p.textContent.replace("à esquerda","em cima");}}}'
		. 't();addEventListener("load",t);setTimeout(t,1500);setTimeout(t,4000);document.addEventListener("click",function(){setTimeout(t,400);},true);'
		. '})();</script>'; // phpcs:ignore
}, 999 );
