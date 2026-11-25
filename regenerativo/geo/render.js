window.IPRV=async function(dataUrl,opts){
 const d=await (await fetch(dataUrl)).json();
 const P1=['#3a4a2a','#435432','#4c5d35','#55663b','#3e5030','#4a5a2e','#5b6a3f'],P2=['#3f5a2e','#486636','#52703c','#3a5330','#5d7a44'];
 let s=11;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};
 const lat=37.46,mx=111320*Math.cos(lat*Math.PI/180),my=110540;
 const circ=(x,y,rx,ry,n,dx=0,dy=0)=>{const r=[];for(let i=0;i<=n;i++){const a=i/n*2*Math.PI;r.push([x+(rx*Math.cos(a)+dx)/mx,y+(ry*Math.sin(a)+dy)/my])}return r};
 const T=[],S=[];
 for(const [x,y,r0,h0,c] of d.t){const pal=c>=5?P2:P1;const r=r0*(0.9+rnd()*0.5),h=h0*(0.8+rnd()*0.4);
  T.push({type:'Feature',properties:{h,c:pal[Math.floor(rnd()*pal.length)]},geometry:{type:'Polygon',coordinates:[circ(x,y,r,r,7)]}});
  S.push({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[circ(x,y,r*1.2,r*0.85,7,h*0.5,h*0.28)]}})}
 const O='https://ortos.dgterritorio.gov.pt/wms/ortosat2023?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ortoSat2023-CorVerdadeira&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512&FORMAT=image/jpeg';
 const DEM=location.origin+'/ipr-relevo/{z}/{x}/{y}.webp';
 document.body.innerHTML='<div id=m style="width:'+opts.w+'px;height:'+opts.h+'px"></div>';
 const M=window.M=new maplibregl.Map({container:'m',pixelRatio:1,canvasContextAttributes:{preserveDrawingBuffer:true,antialias:true},attributionControl:false,center:opts.c,zoom:opts.z,pitch:opts.p,bearing:opts.b,maxPitch:85,
 style:{version:8,sources:{o:{type:'raster',tiles:[O],tileSize:512,maxzoom:19},dem:{type:'raster-dem',tiles:[DEM],tileSize:512,maxzoom:14,encoding:'terrarium'},
 tr:{type:'geojson',data:{type:'FeatureCollection',features:T}},sh:{type:'geojson',data:{type:'FeatureCollection',features:S}},ch:{type:'geojson',data:{type:'FeatureCollection',features:d.charcas}}},
 terrain:{source:'dem',exaggeration:opts.e||1.4},sky:{'sky-color':'#b9cfe3','horizon-color':'#e9eef0','fog-color':'#e2e8ea','horizon-fog-blend':0.5,'fog-ground-blend':0.25},
 light:{anchor:'map',position:[1.4,210,35],color:'#fff3dc',intensity:0.4},
 layers:[{id:'o',type:'raster',source:'o',paint:{'raster-saturation':0.15,'raster-contrast':0.05}},
 {id:'sh',type:'fill',source:'sh',paint:{'fill-color':'#1b1a12','fill-opacity':0.3}},
 {id:'chb',type:'line',source:'ch',paint:{'line-color':'#b9a57a','line-width':3,'line-blur':1.5}},
 {id:'ch',type:'fill',source:'ch',paint:{'fill-color':'#2d5566','fill-opacity':0.95}},
 {id:'tr',type:'fill-extrusion',source:'tr',paint:{'fill-extrusion-color':['get','c'],'fill-extrusion-height':['get','h'],'fill-extrusion-base':0}}]}});
 await new Promise(r=>{M.once('idle',r);setTimeout(r,120000)});return T.length};
