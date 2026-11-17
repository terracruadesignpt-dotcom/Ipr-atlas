const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1440,height:860}});
const fails=[];p.on('requestfailed',r=>fails.push(r.url().slice(0,90)+' '+(r.failure()||{}).errorText));
const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,150)));
await p.goto('https://terracruadesign.pt/atlas/',{timeout:90000,waitUntil:'load'});
await p.waitForTimeout(20000);await p.screenshot({path:'anon2.png'});
console.log(JSON.stringify({fails:fails.slice(0,10),errs:errs.slice(0,10),nivel:await p.evaluate(()=>window.IPR_NIVEL)}));
await b.close();})();
