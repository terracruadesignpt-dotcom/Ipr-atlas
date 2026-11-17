const M=require('./motor.js');const W=1200,H=1200,cell=1.2;const dem=new Float32Array(W*H),mask=new Uint8Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const Y=y*cell,X=x*cell;let f=Y<300?150-0.15*Y:150-45-0.04*(Y-300);
f-=5*Math.exp(-((X-300)**2)/(2*30*30))*Math.min(1,Y/120); f-=3*Math.exp(-((X-120)**2)/(2*25*25))*Math.min(1,Y/150);
f+=2*Math.sin(X/57)+Math.random()*0.15; dem[y*W+x]=f; const ex=(x-W/2)/(W*0.45),ey=(y-H/2)/(H*0.45); mask[y*W+x]=ex*ex+ey*ey<1?1:0;}
const r=M({W,H,cell,dem,mask,params:{suav:4,areaVale:4000,areaCumeada:4000,grade:0.003,espac:20,janela:20}});
console.log(JSON.stringify(r.resumo)); console.log(JSON.stringify(r.keypoints));
console.log('mestres',r.mestres.map(m=>m.troços.length), 'vales',r.vales.length,'cum',r.cumeadas.length);
require('fs').writeFileSync('res2.json',JSON.stringify({W,H,r}));
