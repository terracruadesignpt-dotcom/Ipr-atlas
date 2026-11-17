;(function(){const G=window.__G;const P=Object.assign({espac:20,grade:0.003,areaVale:5000,areaCumeada:5000,suav:4,janela:20,maxKp:6,primario:0},window.__P||{});
const r=iprKeylineMotor({W:G.Wd,H:G.Hd,cell:G.cell,dem:G.dem,mask:G.mask,params:P});window.__R=r;
document.body.innerHTML='';document.body.style.margin=0;const sc=Math.min(860/G.Wd,600/G.Hd);const cv=document.createElement('canvas');cv.width=G.Wd*sc;cv.height=G.Hd*sc;document.body.appendChild(cv);const cx=cv.getContext('2d');
const hs=document.createElement('canvas');hs.width=G.Wd;hs.height=G.Hd;const hc=hs.getContext('2d');const id=hc.createImageData(G.Wd,G.Hd);const W=G.Wd,d=G.dem;
for(let y=1;y<G.Hd-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;const gx=(d[i+1]-d[i-1])/(2*G.cell),gy=(d[i+W]-d[i-W])/(2*G.cell);const sh=Math.max(0,( -gx*0.5 + gy*0.5 + 1)/Math.sqrt(gx*gx+gy*gy+1)/1.3);let v=60+180*sh;if(!G.mask[i])v*=0.6;id.data[i*4]=v;id.data[i*4+1]=v;id.data[i*4+2]=v*0.95;id.data[i*4+3]=255;}
hc.putImageData(id,0,0);cx.drawImage(hs,0,0,cv.width,cv.height);
const L=(l,c,w,ds)=>{cx.beginPath();l.forEach((p,i)=>i?cx.lineTo(p[0]*sc,p[1]*sc):cx.moveTo(p[0]*sc,p[1]*sc));cx.strokeStyle=c;cx.lineWidth=w;cx.setLineDash(ds||[]);cx.stroke();};
r.cumeadas.forEach(l=>L(l,'#c98a4a',1.2,[4,3]));r.vales.forEach(l=>L(l,'#3d8cff',2));r.paralelas.forEach(p=>L(p.linha,'#2fbf45',1.4));r.mestres.forEach(m=>m.troços.forEach(t=>L(t,m.primaria?'#ff2a10':'#f2a23a',m.primaria?3.5:2.5,m.primaria?[]:[6,3])));
cx.setLineDash([]);r.keypoints.forEach((k,i)=>{cx.beginPath();cx.arc(k.x*sc,k.y*sc,5,0,7);cx.fillStyle='#000';cx.fill();cx.strokeStyle='#fff';cx.lineWidth=2;cx.stroke();cx.fillStyle='#fff';cx.font='bold 12px sans-serif';cx.fillText('KP'+(i+1),k.x*sc+7,k.y*sc-5);});
window.__out={resumo:r.resumo,kps:r.keypoints.map(k=>({z:k.z,b:k.bacia_ha,fim:k.fim}))};})();
JSON.stringify(window.__out)
