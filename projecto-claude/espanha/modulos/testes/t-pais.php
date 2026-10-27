<?php
require __DIR__ . '/wp-stub.php';
require __DIR__ . '/../m90241.php';
require __DIR__ . '/../m90242.php';
$casos = array(
	'Almodôvar' => array( -8.06, 37.51, 'PT' ), 'Lisboa' => array( -9.14, 38.72, 'PT' ), 'Porto' => array( -8.61, 41.15, 'PT' ),
	'Bragança' => array( -6.76, 41.81, 'PT' ), 'Faro' => array( -7.93, 37.02, 'PT' ), 'Évora' => array( -7.91, 38.57, 'PT' ),
	'Elvas' => array( -7.16, 38.88, 'PT' ), 'Caia (fronteira)' => array( -7.035, 38.88, 'PT_FRONTEIRA' ), 'Valença (fronteira)' => array( -8.64, 42.03, 'PT_FRONTEIRA' ),
	'Miranda do Douro (fronteira)' => array( -6.274, 41.494, 'PT_FRONTEIRA' ), 'Tui (fronteira)' => array( -8.645, 42.05, 'PT_FRONTEIRA' ),
	'Badajoz' => array( -6.97, 38.78, 'ES' ), 'Ourense' => array( -7.86, 42.34, 'ES' ), 'Vigo' => array( -8.72, 42.24, 'ES' ),
	'Huelva Aracena' => array( -6.58, 37.90, 'ES' ), 'Madrid' => array( -3.70, 40.42, 'ES' ), 'Lleida' => array( 1.20, 41.95, 'ES' ),
	'Irun' => array( -1.79, 43.34, 'ES' ), 'Jaca' => array( -0.55, 42.57, 'ES' ), 'Maiorca' => array( 2.75, 39.75, 'ES' ),
	'Zamora Arribes (fronteira)' => array( -6.45, 41.35, 'PT_FRONTEIRA' ), 'Zamora' => array( -5.75, 41.50, 'ES' ), 'Cáceres' => array( -6.37, 39.47, 'ES' ),
	'Tenerife' => array( -16.50, 28.35, 'ES_ILHAS' ), 'Ceuta' => array( -5.32, 35.89, 'ES_ILHAS' ),
	'Funchal' => array( -16.91, 32.65, 'PT' ), 'Ponta Delgada' => array( -25.67, 37.74, 'PT' ),
	'Perpignan (FR)' => array( 2.89, 42.70, '' ), 'Andorra' => array( 1.52, 42.51, '' ), 'Bordéus (FR)' => array( -0.58, 44.84, '' ),
);
foreach ( $casos as $n => $c ) { $r = tcd_esp_pais( $c[0], $c[1] ); ok( $r === $c[2], "$n → " . ( $r ?: "''" ) ); }
$t = microtime( true ); for ( $i = 0; $i < 200; $i++ ) { tcd_esp_pais( -7.2 + $i * 0.001, 38.8 ); } $ms = ( microtime( true ) - $t ) * 1000 / 200;
ok( $ms < 5, sprintf( 'tempo por ponto %.2f ms', $ms ) );
fim();
