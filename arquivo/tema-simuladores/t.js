const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:860}});
const t0=Date.now();
try{await p.goto('https://terracruadesign.pt/atlas/',{timeout:60000,waitUntil:'load'});console.log('load',Date.now()-t0);
await p.waitForTimeout(8000);await p.screenshot({path:'anon1.png'});}catch(e){console.log('ERR',e.message)}
await b.close();})();
