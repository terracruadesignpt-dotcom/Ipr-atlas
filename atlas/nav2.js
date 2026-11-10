/* IPR Atlas · navegacao 2 (Bolito, trabalho em curso de 10/11/2026, regenerativo.pt/atlas-2-design).
   Ligado por defeito em ecras de 1024 px ou mais (decisao do Nuno, 10/11/2026). ?nav2=0 desliga neste browser, ?nav2=1 volta a ligar. */
(function(){
  var W=window,D=document,on=false;
  try{var q=(location.search.match(/[?&]nav2=([01])/)||[])[1];
    if(q)localStorage.setItem('ipr_nav2',q);
    var g=localStorage.getItem('ipr_nav2');
    on=g==='1'||(g!=='0'&&W.matchMedia&&W.matchMedia('(min-width:1024px)').matches);}catch(e){on=!!(W.matchMedia&&W.matchMedia('(min-width:1024px)').matches);}
  if(!on||W.__iprNav2)return; W.__iprNav2=1;
  var st=D.createElement('style');st.id='ipr-nav2';st.textContent="#tb-bar{position:absolute;left:0;right:0;top:0;z-index:30;height:44px;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:0 10px;background:#141513;border-bottom:1px solid #383A33;font:500 11.5px/1.2 Inter,system-ui,sans-serif;white-space:nowrap}\n#tb-bar .tb-h{font:600 10px/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#C3C5BC;padding:0 6px 0 2px}\n#tb-bar .tb-q{margin-left:6px;width:28px;height:28px;border-radius:50%;border:1px solid #383A33;background:transparent;color:#94BE39;font:600 13px Inter,sans-serif;cursor:pointer;flex:none;padding:0}\n#tb-bar .tb-q:hover{border-color:#94BE39}\n#tb-bar .tb-sc{flex:1 1 auto;min-width:0;display:flex;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none;padding-right:24px}\n#tb-bar .tb-sc::-webkit-scrollbar{display:none}\n#tb-bar .tb-sc.mf{-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}\n#tb-bar .tb-mais{flex:none;width:28px;height:32px;margin-left:-6px;border:1px solid #383A33;border-radius:3px;background:#0B0C0A;color:#94BE39;font:600 16px/1 Inter,sans-serif;cursor:pointer;padding:0}\n#tb-bar .tb-mais:hover{border-color:#94BE39}\n#tb-bar .tb-t{position:relative;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border:1px solid #383A33;border-radius:3px;background:#1B1C19;color:#F5F4EE;cursor:pointer;flex:none;font:inherit}\n#tb-bar .tb-t svg{width:14px;height:14px;color:#94BE39;flex:none}\n#tb-bar .tb-t .n{display:inline}\n#tb-bar .tb-t:hover{border-color:#94BE39}\n#tb-bar .tb-t[aria-pressed=true]{gap:7px;padding:0 12px;background:#0B0C0A;color:#94BE39;border-color:#94BE39;box-shadow:inset 0 -2px 0 #B8A83A}\n#tb-bar .tb-t[aria-pressed=true] .n{display:inline}\n#tb-bar.so-icones .tb-t[aria-pressed=false]:hover::after{content:attr(data-n);position:absolute;left:50%;top:35px;transform:translateX(-50%);background:#0B0C0A;color:#F5F4EE;border:1px solid #383A33;border-radius:3px;padding:3px 8px;font:500 11.5px/1.4 Inter,sans-serif;pointer-events:none;z-index:2}\n#tb-bar .tb-m{display:inline-flex;align-items:center;gap:4px;flex:none;padding-left:10px;border-left:1px solid #383A33}\n#tb-bar .tb-m button{height:28px;min-width:28px;border:1px dashed #383A33;border-radius:3px;background:transparent;color:#C3C5BC;font:500 11px Inter,sans-serif;cursor:pointer;padding:0 8px}\n#tb-bar .tb-m button.ch{border-style:solid;color:#F5F4EE}\n#tb-bar .tb-m button.g{border-style:solid}\n#tb-bar .tb-m button[aria-pressed=true]{border-color:#94BE39;color:#94BE39}\n#tb-bar .tb-m button:hover{border-color:#94BE39}\n#ipe #ipe-mapa .ipe-tools{top:52px!important}\n#tb-qg .tb-q{font:600 15px/1 Inter,sans-serif;color:#94BE39}\n#ipr-pa-raiz{top:54px!important}\n#ipe-mapa .maplibregl-ctrl-top-left,#ipe-mapa .maplibregl-ctrl-top-right{top:44px!important}\n#tb-pan{position:absolute;left:10px;top:62px;z-index:29;width:300px;max-height:calc(100% - 80px);overflow:auto;background:#1B1C19;border-radius:3px;box-shadow:0 8px 24px rgba(0,0,0,.55);-webkit-overflow-scrolling:touch}\n#tb-pan[hidden]{display:none!important}\n#tb-pan #ipr-t62{display:block!important;position:static!important;margin:0!important;padding:0!important;width:auto!important;transform:none!important}\n#tb-pan #ipr-t62>*{display:none!important}\n#tb-pan #ipr-t62>.ipr-t62-c{display:flex!important;margin:0!important}\n#tb-x{position:absolute;left:314px;top:62px;z-index:31;width:24px;height:24px;border:0;border-radius:3px;background:#0B0C0A;color:#C3C5BC;font:16px/1 Inter,sans-serif;cursor:pointer;padding:0}\n#tb-x:hover{color:#94BE39}\n\n#mi-ii{position:fixed;right:16px;top:90px;z-index:2147481500;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln,#2c312a);border-radius:12px;box-shadow:0 10px 32px rgba(0,0,0,.4);font:13px/1.45 Inter,sans-serif;padding:14px 16px 16px}\n#mi-ii[hidden]{display:none}\n#mi-ii h3{margin:0 28px 2px 0;font:600 15px/1.3 Inter,sans-serif}\n#mi-ii .ii-g{color:var(--mu,#9aa08f);font-size:11.5px;margin-bottom:10px}\n#mi-ii h4{margin:12px 0 4px;font:600 10.5px Inter,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--mu,#9aa08f)}\n#mi-ii p{margin:0 0 6px}\n#mi-ii a{color:#9fc7e8}\n#mi-ii .x{position:absolute;right:8px;top:8px;border:0;background:none;color:inherit;font-size:20px;line-height:1;cursor:pointer;padding:4px 8px}\n#mi-ii .ii-r{display:flex;align-items:center;gap:8px;margin:3px 0}\n#mi-ii .ii-r s{flex:0 0 16px;height:11px;border-radius:2px;border:1px solid rgba(255,255,255,.18)}\n#mi-ii .ii-r img{flex:0 0 20px;width:20px;height:20px;object-fit:contain}\n#mi-ii .ii-w{max-width:100%;height:auto;background:#fff;border-radius:4px;padding:4px;display:block;margin:4px 0}\n#mi-ii .ii-m{color:var(--tx2,#cfd2c4);font-size:12px}\n#mi-ii .ii-sh{font-size:11.5px;color:var(--mu,#9aa08f);margin:6px 0 2px}\n#mi-ii dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px}\n#mi-ii dt{color:var(--mu,#9aa08f)}\n#mi-ii dd{margin:0;overflow-wrap:anywhere}\n#tao label>span>i{display:none!important}\n#tao .mi-b{flex:0 0 auto;width:18px;height:18px;border-radius:50%;border:1px solid currentColor;background:none;color:var(--mu,#9aa08f);font:italic 600 11px/16px Georgia,serif;text-align:center;cursor:pointer;padding:0;opacity:.8}\n#tao .mi-b:hover{opacity:1;color:var(--tx,#e9eadf)}\n#tao label:has(> .mi-b){position:relative;padding-right:26px!important}\n#tao label > .mi-b{position:absolute;right:4px;top:3px;margin:0}\n#tao label:has(> .mi-b:hover){background:rgba(148,190,57,.14);border-radius:6px;box-shadow:inset 2px 0 0 #94BE39}\n@media (max-width:700px){#mi-ii{right:8px!important;left:8px!important;width:auto;top:auto!important;bottom:70px;max-height:60vh}}\n#ipe-esq .ipr-it,#ipe-esq .ipr-it.on,.ipe .ipr-it,.ipe .ipr-it.on{border:0!important;background:transparent!important;box-shadow:none!important;outline:0!important}\n#ipe-esq .ipr-it label{border:0!important;background:transparent!important;box-shadow:none!important}\n#ipe-esq .ipr-it{display:flex;flex-wrap:wrap;align-items:center;padding-top:1px;padding-bottom:1px}\n#ipe-esq .ipr-it label{flex:0 0 100%;box-sizing:border-box}\n#ipe-esq .ipr-it.c2-t .ipr-cor{display:none!important}\n#ipe-esq input.ipr-ck[type=checkbox],#tao input[type=checkbox],#ipr-t62 .ipr-t62-c input[type=checkbox],#ipe-esq input.ipr-gsw[type=checkbox]{-webkit-appearance:none;appearance:none;position:relative;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;padding:0!important;border-radius:50%!important;margin:0 2px!important;flex:none;cursor:pointer;border:0!important;background:var(--k,#94BE39)!important;opacity:.32;box-shadow:none;transition:opacity .15s,box-shadow .15s}\n#ipe-esq input.ipr-ck[type=checkbox]:checked,#tao input[type=checkbox]:checked,#ipr-t62 .ipr-t62-c input[type=checkbox]:checked,#ipe-esq input.ipr-gsw[type=checkbox]:checked{opacity:1;box-shadow:none}\n#ipe-esq input.ipr-ck[type=checkbox]:checked::after,#tao input[type=checkbox]:checked::after,#ipr-t62 .ipr-t62-c input[type=checkbox]:checked::after,#ipe-esq input.ipr-gsw[type=checkbox]:checked::after{content:none!important}\n#ipe-esq input.ipr-ck[type=checkbox]:hover,#tao input[type=checkbox]:hover,#ipr-t62 .ipr-t62-c input[type=checkbox]:hover,#ipe-esq input.ipr-gsw[type=checkbox]:hover{opacity:.7}\n#ipe-esq input.ipr-ck[type=checkbox]:checked:hover,#tao input[type=checkbox]:checked:hover,#ipr-t62 .ipr-t62-c input[type=checkbox]:checked:hover,#ipe-esq input.ipr-gsw[type=checkbox]:checked:hover{opacity:1}\n#ipe-esq input.ipr-ck[type=checkbox]:disabled,#tao input[type=checkbox]:disabled,#ipr-t62 .ipr-t62-c input[type=checkbox]:disabled,#ipe-esq input.ipr-gsw[type=checkbox]:disabled{opacity:.15;cursor:default}\n#ipe-esq input.ipr-ck[type=checkbox]:focus-visible,#tao input[type=checkbox]:focus-visible,#ipr-t62 .ipr-t62-c input[type=checkbox]:focus-visible,#ipe-esq input.ipr-gsw[type=checkbox]:focus-visible{outline:2px solid #B5D86A;outline-offset:3px}\n#ipe-esq .ipr-it:not(.on) .ipr-nome{color:#C3C5BC}\n#ipe-esq .ipr-it.on .ipr-nome{color:#F5F4EE}\n#ipe-esq .ipr-it.c2-far .ipr-nome{color:#8A8C83!important}\n#ipe-esq .ipr-it .ipr-nome small.c2-esc{display:none!important}\n#ipe-esq .ipr-it input.ipr-op{-webkit-appearance:none;appearance:none;flex:1;height:3px;min-width:0;border-radius:2px;margin:7px 0 9px 26px;padding:0;cursor:pointer;background:linear-gradient(90deg,var(--k,#94BE39) var(--v,60%),#383A33 var(--v,60%))}\n#ipe-esq .ipr-it input.ipr-op::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:11px;height:11px;border-radius:50%;border:0;background:var(--k,#94BE39);box-shadow:0 0 0 2px #1B1C19}\n#ipe-esq .ipr-it input.ipr-op::-moz-range-thumb{width:11px;height:11px;border-radius:50%;border:0;background:var(--k,#94BE39);box-shadow:0 0 0 2px #1B1C19}\n#ipe-esq .ipr-it input.ipr-op::-moz-range-track{background:transparent}\n#ipe-esq .c2-pct{font:500 11px 'IBM Plex Mono',monospace;color:#C3C5BC;width:40px;text-align:right;margin:0 2px 2px 0}\n#ipe-esq .c2-i,#ipe-esq .c2-z{flex:none;display:inline-grid;place-items:center;cursor:pointer;margin-left:4px;padding:0;font:italic 600 11px Georgia,serif;line-height:1}\n#ipe-esq .c2-i{width:17px;height:17px;border-radius:50%;border:1.3px solid #8A8C83;color:#C3C5BC;background:transparent}\n#ipe-esq .c2-i:hover{border-color:#B5D86A;color:#B5D86A}\n#ipe-esq .c2-i.ab{background:#B5D86A;border-color:#B5D86A;color:#0B0C0A}\n#ipe-esq .c2-z{width:21px;height:21px;border-radius:4px;border:0;background:#0B0C0A}\n#ipe-esq .c2-z svg{width:12px;height:12px;fill:none;stroke:#B5D86A;stroke-width:2;stroke-linecap:round}\n#ipe-esq .c2-z:hover{background:#232420}\n#c2-pop{position:fixed;z-index:99999;width:240px;box-sizing:border-box;background:#0B0C0A;border:1px solid #383A33;border-radius:6px;padding:11px 30px 12px 13px;color:#C3C5BC;font:12.5px/1.45 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.55);display:none}\n#c2-pop.ab{display:block}\n#c2-pop:before{content:\"\";position:absolute;left:-7px;top:12px;width:12px;height:12px;background:#0B0C0A;border-left:1px solid #383A33;border-bottom:1px solid #383A33;transform:rotate(45deg)}\n#c2-pop b{display:block;color:#F5F4EE;font-size:13px;font-weight:600;margin-bottom:4px}\n#c2-pop .c2-x{position:absolute;right:6px;top:4px;width:20px;height:20px;border:0;background:none;color:#8A8C83;font-size:16px;cursor:pointer;padding:0}\n#c2-pop .c2-x:hover{color:#F5F4EE}\n\n#ipe-esq input.ipr-gsw[type=checkbox]:indeterminate{opacity:1;background:linear-gradient(90deg,var(--k,#94BE39) 50%,rgba(148,190,57,.3) 50%)!important;box-shadow:none}\n#ipe-esq input.ipr-gsw[type=checkbox]::before,#ipe-esq input.ipr-gsw[type=checkbox]::after,#ipe-esq input.ipr-ck[type=checkbox]::before,#ipe-esq input.ipr-ck[type=checkbox]::after,#tao input[type=checkbox]::before,#tao input[type=checkbox]::after,#ipr-t62 .ipr-t62-c input[type=checkbox]::before,#ipr-t62 .ipr-t62-c input[type=checkbox]::after{content:none!important;display:none!important}\n#ipe-esq .ipr-it.on .ipr-nome{color:#F5F4EE!important}\n\n#ipe .ipe-marca>svg:not(.tp-logo){display:none!important}\n#ipe .ipe-marca .tp-logo{display:block!important;height:24px!important;width:auto!important;overflow:visible}\n#ipe .ipe-marca{padding:0!important;margin-right:4px}\n#ipe header.ipe-top>#ipr-be-pq{flex:0 0 300px;width:300px;min-width:240px;max-width:300px;position:relative;margin:0 4px 0 12px;font:500 12.5px/1.2 Inter,system-ui,sans-serif}\n#ipe header.ipe-top>#ipr-be-pq #ipe-busca{margin:0!important;min-height:34px;box-sizing:border-box}\n#ipe header.ipe-top>#ipr-be-pq #ipe-q{min-width:0;font-size:13px}\n#ipe header.ipe-top>#ipr-be-pq #ipe-busca kbd{display:none!important}\n#ipe header.ipe-top>#ipr-be-pq #ipr-pb-3d{background:transparent!important;color:var(--tx,#E4E2D8)!important;border:1px solid var(--ln,#2E3A26)!important;border-radius:6px!important;font:600 11px/1 Inter,system-ui,sans-serif!important;padding:5px 7px!important}\n#ipe header.ipe-top>#ipr-be-pq #ipe-qres,#ipe header.ipe-top>#ipr-be-pq #ipr-pb-sug{position:absolute;left:0;right:0;top:100%;margin-top:4px;max-height:60vh;overflow:auto;background:var(--p1,#14200F);border:1px solid var(--ln,#2E3A26);border-radius:8px;z-index:60}\n#ipe header.ipe-top>#ipr-be-pq #ipe-qres:empty{display:none}\n#ipe #ipr-be-pq-b,#ipe #ipr-be-pqp{display:none!important}\n@media (max-width:640px){#ipe header.ipe-top>#ipr-be-pq{flex-basis:180px;min-width:150px}}\n#ipe #ipe-mapa .ipe-tools>.tp-pega{display:flex;align-items:center;justify-content:center;width:100%;min-width:30px;height:14px;margin:0 0 2px;cursor:grab;touch-action:none;pointer-events:auto;order:-99}\n#ipe #ipe-mapa .ipe-tools>.tp-pega span{display:block;width:22px;height:4px;border-radius:2px;background:#8C8F84;opacity:.75}\n#ipe #ipe-mapa .ipe-tools>.tp-pega:hover span{opacity:1;background:#A9AC9F}\nhtml.tp-arrasta,html.tp-arrasta *{cursor:grabbing!important;user-select:none!important}\n#ipe-esq .ipr-it>label{display:flex!important;align-items:center}\n#ipe-esq .ipr-it .ipr-nome{flex:1 1 auto;min-width:0}\n#ipe-esq .ipr-it .c2-z{margin-left:4px}\n#ipe-esq .ipr-it .c2-i{margin-left:auto!important}\n#ipe-esq .ipr-it .c2-z+.c2-i{margin-left:4px!important}\n#ipe-esq .ipr-it .ipr-nome+.c2-i,#ipe-esq .ipr-it .ipr-nome+.c2-z{margin-left:auto!important}\n.tp-sec{display:block;font:400 11px/1.3 Inter,system-ui,sans-serif!important;color:#ABADA1!important;margin-top:1px;letter-spacing:0}\n#ipe-esq .c2-i,#tao .mi-b,#ipe .ipr-ii-b{border:1.3px solid #70726A!important;color:#ABADA1!important;background:transparent!important;opacity:1!important}\n#ipe-esq .c2-i:hover,#tao .mi-b:hover,#ipe .ipr-ii-b:hover{border-color:#B5D86A!important;color:#B5D86A!important}\n#ipe-esq .c2-i.ab{background:#B5D86A!important;border-color:#B5D86A!important;color:#0B0C0A!important}\n#tao label:has(> .ipr-ii-b){position:relative;padding-right:26px!important}\n#tao label > .ipr-ii-b{position:absolute;right:4px;top:3px;margin:0}\n#ipe-esq .ipr-it>label{position:relative;padding-right:26px!important;box-sizing:border-box}\n#ipe-esq .ipr-it .ipr-nome>.ipr-ii-b{position:absolute!important;right:2px;top:50%;transform:translateY(-50%);margin:0!important}\n#ipe-esq .ipr-it .c2-z{margin-left:auto!important}\n#ipe-esq .c2-i:hover,#tao .mi-b:hover,#ipe .ipr-ii-b:hover,#ipe .tp-hov,#ipe-esq .c2-i.ab:not(.tp-pin){border-color:#F5F4EE!important;color:#F5F4EE!important;background:transparent!important}\n#ipe .ipr-ii-b.tp-pin,#ipe-esq .c2-i.tp-pin,#tao .mi-b.tp-pin{background:#B5D86A!important;border-color:#B5D86A!important;color:#0B0C0A!important}\n#tao h5{display:flex!important;align-items:center;gap:7px}\n#tao h5 .tp-ic{flex:none;width:15px;height:15px;color:#B5D86A}\n#ipe .ipr-ii-b,#ipe-esq .c2-i,#tao .mi-b{font:600 11px/1 Georgia,serif!important;font-style:normal!important;width:18px!important;height:18px!important;display:inline-grid!important;place-items:center;padding:0!important;box-sizing:border-box}\n#ipr-lgd>.tp-lpega{display:flex;justify-content:center;padding:6px 0 9px;cursor:grab;touch-action:none}\n#ipr-lgd>.tp-lpega span{display:block;width:22px;height:4px;border-radius:2px;background:#8C8F84;opacity:.75}\n#ipr-lgd>.tp-lpega:hover span{opacity:1;background:#A9AC9F}\n#ipr-lgd>.h{padding-right:34px!important}\n#ipr-lgd>.tp-lmin{position:absolute;right:6px;top:21px;width:20px;height:20px;display:grid;place-items:center;padding:0;border:1px solid #383A33;border-radius:4px;background:none;color:#C3C5BC;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;z-index:2}\n#ipr-lgd>.tp-lmin:hover{border-color:#F5F4EE;color:#F5F4EE}\n#ipr-lgd.min>.tp-lmin{top:19px}\n#ipr-lgd img{background:transparent!important;padding:0!important}\n#ipr-lgd .ipr-76.tp-wi{display:flex!important;flex-wrap:wrap;align-items:center;gap:6px 8px}\n#ipr-lgd .ipr-76.tp-wi>b{display:flex!important;align-items:center;gap:6px;flex:1 1 auto;order:2;margin:0!important;font:400 12px/1.3 Inter,system-ui,sans-serif!important;color:#F5F4EE}\n#ipr-lgd .ipr-76.tp-wi>img.w{order:1;flex:none;width:22px!important;height:16px!important;max-height:16px!important;object-fit:cover;object-position:left top;border-radius:1px!important;margin:0!important}\n#ipr-lgd .ipr-76.tp-hip{display:block!important}\n#ipr-lgd .ipr-76.tp-hip>img.w{display:none!important}\n#ipr-lgd .tp-vb{display:flex;gap:7px;margin:4px 0 2px;position:relative}\n#ipr-lgd .tp-vb .br{display:flex;flex-direction:column;width:9px;border-radius:1px;overflow:hidden}\n#ipr-lgd .tp-vb .br i{display:block;height:14px}\n#ipr-lgd .tp-vb .lb{position:relative;width:46px;height:98px;font:400 10px/1.2 'IBM Plex Mono',ui-monospace,monospace;color:#C3C5BC}\n#ipr-lgd .tp-vb .lb span{position:absolute;left:0}\n#ipr-lgd .tp-vb .lb em{position:absolute;left:0;top:-2px;font-style:normal;color:#ABADA1}\n#ipr-lgd .tp-li{flex:none;display:inline-grid;place-items:center;width:16px;height:16px;margin-left:auto;padding:0;border-radius:50%;border:1.3px solid #70726A;background:transparent;color:#ABADA1;font:600 10px/1 Georgia,serif;cursor:pointer;box-sizing:border-box}\n#ipr-lgd .tp-li:hover,#ipr-lgd .tp-li.tp-hov{border-color:#F5F4EE;color:#F5F4EE}\n#ipr-lgd .tp-li.tp-pin{background:#B5D86A;border-color:#B5D86A;color:#0B0C0A}\n#ipr-lgd .r{align-items:center}\n#tp-lpop{position:fixed;z-index:99999;width:260px;max-height:70vh;overflow:auto;box-sizing:border-box;background:#0B0C0A;border:1px solid #383A33;border-radius:6px;padding:11px 30px 12px 13px;color:#C3C5BC;font:12.5px/1.45 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.55)}\n#tp-lpop[hidden]{display:none}\n#tp-lpop b{display:block;color:#F5F4EE;font-size:13px;font-weight:600;margin-bottom:4px}\n#tp-lpop .x{position:absolute;right:6px;top:4px;width:20px;height:20px;border:0;background:none;color:#8A8C83;font-size:16px;cursor:pointer;padding:0}\n#tp-lpop .im img{display:block;max-width:100%;margin-top:8px;background:#F4F2EB;border-radius:4px;padding:6px;box-sizing:border-box}\n#ipe-esq .ipr-it>label{align-items:flex-start!important;padding-top:6px!important;padding-bottom:6px!important}\n#ipe-esq .ipr-it .ipr-nome{line-height:18px!important}\n#ipe-esq .ipr-it>label>input.ipr-ck{margin-top:2px!important;align-self:flex-start!important}\n#ipe-esq .ipr-it>label>.c2-z,#ipe-esq .ipr-it>label>.ipr-opc-b,#ipe-esq .ipr-it>label>.c2-i{align-self:flex-start!important;margin-top:0!important}\n#ipe-esq .ipr-it .ipr-nome>.ipr-ii-b{top:6px!important;transform:none!important}\n#tao label{align-items:flex-start!important}\n#tao label>span{line-height:18px!important}\n#ipe-esq #tao label>input{margin-top:2px!important;align-self:flex-start!important}\n#tao label>.ipr-ii-b,#tao label>.mi-b{top:3px!important;transform:none!important}\n#ipe #ipr-be-topo #ipr-be-cq-b{display:none!important}\n#tb-bar>.tp-cq{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;margin:0 10px 0 0;border:1px solid #94BE39;border-radius:999px;background:transparent;color:#E4E2D8;font:600 12px/1 Inter,system-ui,sans-serif;cursor:pointer}\n#tb-bar>.tp-cq svg{color:#94BE39}\n#tb-bar>.tp-cq em{font-style:normal;color:#B5D86A}\n#tb-bar>.tp-cq em:empty{display:none}\n#tb-bar>.tp-cq:hover{background:rgba(148,190,57,.14)}\n#tb-bar>.tp-cq[hidden]{display:none}\nhtml #ipe header.ipe-top #ipe-nivel,html:not([data-neutro-off]) #ipe:not(.claro) header.ipe-top span.ipe-beta.ipe-beta{display:inline-flex!important;align-items:center;height:24px;padding:0 12px!important;border:1px solid #94BE39!important;border-radius:999px!important;background:rgba(148,190,57,.08)!important;color:#B5D86A!important;font:500 11.5px/1 'IBM Plex Mono',ui-monospace,monospace!important;letter-spacing:.08em!important;box-sizing:border-box}\n#ipe header.ipe-top>#ipr-be-pq{flex-basis:380px!important;width:380px!important;max-width:380px!important}\n#ipe header.ipe-top>#ipr-be-pq #ipe-busca>svg{color:#6F8F2E!important;transition:color .15s}\n#ipe header.ipe-top>#ipr-be-pq #ipe-busca:hover>svg,#ipe header.ipe-top>#ipr-be-pq #ipe-busca:focus-within>svg{color:#B5D86A!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min,#ipe #ipr-lgd{min-width:220px!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.one,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l,#ipe #ipr-lgd .c>.one,#ipe #ipr-lgd .c>.l{position:relative!important;padding-right:26px!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.one>span:not(.n5-nc):not(.n5-rp),#ipe #ipr-lgd .c>.one>span:not(.n5-nc):not(.n5-rp){display:block!important;order:9;width:0!important;min-width:0!important;overflow:visible!important;font-size:0!important;position:static!important;margin:0!important;padding:0!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.one>.n5-nc,#ipe #ipr-lgd .c>.one>.n5-nc{order:2;flex:1 1 auto;position:static!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l>b,#ipe #ipr-lgd .c>.l>b{display:block!important;order:2;flex:1 1 auto;min-width:0;position:static!important;margin:0!important;font:400 12px/1.3 Inter,system-ui,sans-serif!important;color:#F5F4EE!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l>.n5-nc,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c .ipr-ii-f,#ipe #ipr-lgd .c>.l>.n5-nc,#ipe #ipr-lgd .c .ipr-ii-f{display:none!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.one .ipr-ii-b,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l .ipr-ii-b,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l>.tp-li,#ipe #ipr-lgd .c>.one .ipr-ii-b,#ipe #ipr-lgd .c>.l .ipr-ii-b,#ipe #ipr-lgd .c>.l>.tp-li{display:inline-grid!important;place-items:center;position:absolute!important;right:2px!important;left:auto!important;top:50%!important;transform:translateY(-50%)!important;margin:0!important;width:16px!important;height:16px!important;font:600 10px/1 Georgia,serif!important;border:1.3px solid #70726A!important;border-radius:50%!important;color:#ABADA1!important;background:transparent!important;padding:0!important;box-sizing:border-box}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.one .ipr-ii-b:hover,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l .ipr-ii-b:hover,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l>.tp-li:hover,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c .tp-hov,#ipe #ipr-lgd .c>.one .ipr-ii-b:hover,#ipe #ipr-lgd .c>.l .ipr-ii-b:hover,#ipe #ipr-lgd .c>.l>.tp-li:hover,#ipe #ipr-lgd .c .tp-hov{border-color:#F5F4EE!important;color:#F5F4EE!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c .ipr-ii-b.tp-pin,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c .tp-li.tp-pin,#ipe #ipr-lgd .c .ipr-ii-b.tp-pin,#ipe #ipr-lgd .c .tp-li.tp-pin{background:#B5D86A!important;border-color:#B5D86A!important;color:#0B0C0A!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l.tp-hip .ipr-ii-b,html:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l.tp-hip>.tp-li,#ipe #ipr-lgd .c>.l.tp-hip .ipr-ii-b,#ipe #ipr-lgd .c>.l.tp-hip>.tp-li{top:1px!important;transform:none!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l.tp-hip,#ipe #ipr-lgd .c>.l.tp-hip{display:block!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .tp-vb .lb em,#ipe #ipr-lgd .tp-vb .lb em{display:none!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l.tp-wi,#ipe #ipr-lgd .c>.l.tp-wi{display:flex!important;flex-wrap:nowrap!important;align-items:center;gap:8px}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l.tp-wi>img.w,#ipe #ipr-lgd .c>.l.tp-wi>img.w{order:1;flex:none;width:22px!important;height:16px!important;max-height:16px!important;object-fit:cover;object-position:left top;margin:0!important;background:transparent!important;padding:0!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min .c>.l .r>.tp-li,#ipe #ipr-lgd .c>.l .r>.tp-li{margin-left:auto!important;margin-right:-24px!important}\n.ipr-janb.tp-janb-off{display:none!important}\n#ipe #ipr-lgd>.h{padding-left:34px!important}\n#ipe #ipr-lgd>.tp-lfade{position:absolute;left:8px;top:21px;width:20px;height:20px;display:grid;place-items:center;padding:0;border:1px solid #383A33;border-radius:4px;background:none;color:#ABADA1;cursor:pointer;z-index:2}\n#ipe #ipr-lgd.min>.tp-lfade{top:19px}\n#ipe #ipr-lgd>.tp-lfade:hover{border-color:#F5F4EE;color:#F5F4EE}\n#ipe #ipr-lgd>.tp-lfade.on{background:#B5D86A;border-color:#B5D86A;color:#0B0C0A}\n#ipe #ipr-lgd>.tp-lop{display:flex;align-items:center;gap:10px;padding:2px 10px 8px 12px}\n#ipe #ipr-lgd>.tp-lop[hidden]{display:none!important}\n#ipe #ipr-lgd.min>.tp-lop{display:none!important}\n#ipe #ipr-lgd .tp-lr{-webkit-appearance:none;appearance:none;flex:1;height:4px;margin:0;border-radius:2px;background:linear-gradient(90deg,#C8E06A var(--v,100%),#3A3C35 var(--v,100%));cursor:pointer}\n#ipe #ipr-lgd .tp-lr::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#C8E06A;border:0}\n#ipe #ipr-lgd .tp-lr::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#C8E06A;border:0}\n#ipe #ipr-lgd .tp-lp{font:400 11px/1 'IBM Plex Mono',ui-monospace,monospace;color:#C3C5BC;min-width:32px;text-align:right}\n#tao h5.tp-tc{box-shadow:inset 3px 0 0 var(--tc);padding-left:9px!important}\n#tao h5.tp-tc .tp-ic{color:var(--tc)!important}\n#ipe #tao h5.tp-tc{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 45%,#1B1C19)}\n#ipe #tao h5.tp-tc.tp-on{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 70%,#ffffff)}\n#tao.tp-n0>h5{display:none!important}\n#tao.tp-n1>h4::before{transform:rotate(45deg)}\n#tao.tp-n1>label.tp-vis{display:flex!important}\n#tao.tp-n1>h5{cursor:pointer}\n#tao.tp-n1>h5::after{content:\"\";margin-left:auto;margin-right:4px;width:0;height:0;border-left:4px solid currentColor;border-top:3px solid transparent;border-bottom:3px solid transparent;opacity:.55;transition:transform .15s}\n#tao.tp-n1>h5.tp-ab::after{transform:rotate(90deg)}\n#tao.tp-n1>h5:hover{color:#F5F4EE}\n#ipe-esq #tao label>input[type=checkbox]{width:10px!important;height:10px!important;min-width:10px!important;margin-top:4px!important}\n#ipe .ipe-tr .tp-tb{display:inline-flex;align-items:center;justify-content:center}\n#ipe .ipe-tr .tp-tb.tp-on{color:#B5D86A}\n#ipe .ipe-tr #tp-pa-t .tp-pa-ic{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:#94BE39;color:#141513}\n#ipe .ipe-tr #tp-pa-t:hover .tp-pa-ic,#ipe .ipe-tr #tp-pa-t.tp-on .tp-pa-ic{background:#B5D86A}\n#ipr-lingueta{display:none!important}\n#tp-ling{position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:4;display:flex;align-items:center;justify-content:center;width:20px;height:48px;padding:0;border:1px solid var(--ln,#383A33);border-left:0;border-radius:0 6px 6px 0;background:var(--p1,#1B1C19);color:#C3C5BC;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.2)}\n#tp-ling:hover{color:#B5D86A}\n#tp-ling[hidden]{display:none!important}\n#tes .mi-b{border:1.3px solid #70726A!important;color:#ABADA1!important;background:transparent!important;opacity:1!important}\n#tes .mi-b:hover{border-color:#B5D86A!important;color:#B5D86A!important}\n#tes label:has(> .ipr-ii-b){position:relative;padding-right:26px!important}\n#tes label > .ipr-ii-b{position:absolute;right:4px;top:3px;margin:0}\n#tes .mi-b:hover{border-color:#F5F4EE!important;color:#F5F4EE!important;background:transparent!important}\n#tes .mi-b.tp-pin{background:#B5D86A!important;border-color:#B5D86A!important;color:#0B0C0A!important}\n#tes h5{display:flex!important;align-items:center;gap:7px}\n#tes h5 .tp-ic{flex:none;width:15px;height:15px;color:#B5D86A}\n#tes .mi-b{font:600 11px/1 Georgia,serif!important;font-style:normal!important;width:18px!important;height:18px!important;display:inline-grid!important;place-items:center;padding:0!important;box-sizing:border-box}\n#tes label{align-items:flex-start!important}\n#tes label>span{line-height:18px!important}\n#ipe-esq #tes label>input{margin-top:2px!important;align-self:flex-start!important}\n#tes label>.ipr-ii-b,#tes label>.mi-b{top:3px!important;transform:none!important}\n#tes h5.tp-tc{box-shadow:inset 3px 0 0 var(--tc);padding-left:9px!important}\n#tes h5.tp-tc .tp-ic{color:var(--tc)!important}\n#ipe #tes h5.tp-tc{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 45%,#1B1C19)}\n#ipe #tes h5.tp-tc.tp-on{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 70%,#ffffff)}\n#tes.tp-n0>h5{display:none!important}\n#tes.tp-n1>h4::before{transform:rotate(45deg)}\n#tes.tp-n1>label.tp-vis{display:flex!important}\n#tes.tp-n1>h5{cursor:pointer}\n#tes.tp-n1>h5::after{content:\"\";margin-left:auto;margin-right:4px;width:0;height:0;border-left:4px solid currentColor;border-top:3px solid transparent;border-bottom:3px solid transparent;opacity:.55;transition:transform .15s}\n#tes.tp-n1>h5.tp-ab::after{transform:rotate(90deg)}\n#tes.tp-n1>h5:hover{color:#F5F4EE}\n#ipe-esq #tes label>input[type=checkbox]{width:10px!important;height:10px!important;min-width:10px!important;margin-top:4px!important}\n#tes input[type=checkbox]{-webkit-appearance:none;appearance:none;position:relative;width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;padding:0!important;border-radius:50%!important;margin:0 2px!important;flex:none;cursor:pointer;border:0!important;background:var(--k,#94BE39)!important;opacity:.32;box-shadow:none;transition:opacity .15s,box-shadow .15s}\n#tes input[type=checkbox]:checked{opacity:1;box-shadow:none}\n#tes input[type=checkbox]:checked::after{content:none!important}\n#tes input[type=checkbox]:hover{opacity:.7}\n#tes input[type=checkbox]:checked:hover{opacity:1}\n#tes input[type=checkbox]:disabled{opacity:.15;cursor:default}\n#tes input[type=checkbox]:focus-visible{outline:2px solid #B5D86A;outline-offset:3px}\n#tes input[type=checkbox]::before,#tes input[type=checkbox]::after{content:none!important;display:none!important}\n#tes label>span>i{display:none!important}\n#tes label{line-height:18px!important}\n#ipe #tes h5.tp-tc{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 45%,#1B1C19);padding-left:9px!important}\n#ipe #tes h5.tp-tc.tp-on{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--tc) 70%,#ffffff)}\n#tes h5.tp-tc .tp-ic{color:var(--tc)!important}\n#tes.tp-n0>h5,#tes.tp-n0>small,#tes.tp-n1>small{display:none!important}\n#ipe:not(.claro) .iprv-pc{color:#F5F4EE!important}\n#ipe:not(.claro) .iprv-pc h4{color:#B5D86A!important}\n#ipe:not(.claro) .iprv-pc td:first-child{color:#C3C5BC!important}\n#ipe:not(.claro) .iprv-pc td{border-bottom-color:#383A33!important}\n#ipe:not(.claro) .iprv-cota b{color:#B5D86A;font-weight:600;margin-right:4px}\n#ipe .ipr-arv-cab .ipr-crono-b,#ipe .ipr-testes{display:none!important}\n#tp-lingd{position:absolute;right:0;top:72%;transform:translateY(-50%);z-index:7;display:flex;align-items:center;justify-content:center;width:20px;height:48px;padding:0;border:1px solid var(--ln,#383A33);border-right:0;border-radius:6px 0 0 6px;background:var(--p1,#1B1C19);color:#C3C5BC;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.2)}\n#tp-lingd:hover{color:#B5D86A}\n#tp-lingd[hidden]{display:none!important}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais){background:transparent!important}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) > .ipe-sbh{display:flex!important;flex-wrap:wrap;align-items:center;column-gap:8px;background:#0B0C0A!important;border-top:1px solid #383A33!important;border-bottom:1px solid #383A33!important;padding-top:10px!important;padding-bottom:10px!important}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) > .ipe-sbh .tp-av{flex:none;width:24px;height:24px;border-radius:50%;background:#B5D86A;color:#0B0C0A;font:700 12px Inter,sans-serif;display:grid;place-items:center}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) > .ipe-sbh::after{content:attr(data-conta);flex-basis:100%;padding-left:46px;margin-top:1px;font:500 10.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#B5D86A}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipr-mb-b.actual{border-color:transparent!important;background:#232420!important;border-radius:4px!important;box-shadow:inset 0 -2px 0 #94BE39}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b{border-radius:14px!important;border-color:#94BE39!important;color:#B5D86A!important}\n#ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b:hover{background:rgba(148,190,57,.12)!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .iac-sw{display:none!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-n{cursor:pointer;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;column-gap:0}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-n>.tp-bl{grid-column:1;grid-row:1;margin-top:4px!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-n>.iac-nt{grid-column:2;grid-row:1}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-n>.tp-sub{grid-column:2;grid-row:2}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-n>.ipr-ii-b{grid-column:3;grid-row:1;margin-left:6px}\n#ipe #ipr-be-cqp li.ipr-cq-it .tp-bl{flex:none;display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--lc);margin:0 8px 0 2px;vertical-align:middle}\n#ipe #ipr-be-cqp li.ipr-cq-it.iac-esc .tp-bl{opacity:.3}\n#ipe #ipr-be-cqp li.ipr-cq-it .iac-eng{display:none!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .iac-ctl{align-self:flex-start!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .iac-olho{color:var(--lc)!important}\n#ipe #ipr-be-cqp li.ipr-cq-it.iac-esc .iac-olho{color:#6F716A!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-pega{color:var(--lc)!important;opacity:1}\n#ipe #ipr-be-cqp li.ipr-cq-it.iac-esc .ipr-cq-pega{opacity:.4}\n#ipe #ipr-be-cqp li.ipr-cq-it .tp-sub{display:block!important;font-size:11px;line-height:14px;color:#8A8C82;white-space:normal;margin-left:0}\n#ipe #ipr-be-cqp li.ipr-cq-it .iac-nt{white-space:normal!important}\n#ipe #ipr-be-cqp li.ipr-cq-it.tp-sel{background:#232420!important;border-radius:4px}\n#ipe #ipr-be-cqp li.ipr-cq-it.tp-sel .ipr-cq-op{display:flex!important;align-items:center;gap:10px;padding:2px 6px 6px 22px}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-op>span{display:none!important}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-op input[type=range]{flex:1;accent-color:var(--lc);height:14px}\n#ipe #ipr-be-cqp li.ipr-cq-it .ipr-cq-op output{font:500 11px 'IBM Plex Mono',monospace;color:#C3C5BC;min-width:36px;text-align:right}\n#ipe #ipr-be-cqp li.ipr-cq-it.tp-fundo .iac-rem,#ipe #ipr-be-cqp li.ipr-cq-it.tp-fundo .iac-olho{display:none!important}\n#ipe #ipr-cq{position:relative}\n#ipe #ipr-cq>.tp-cqfade{position:absolute;right:12px;top:12px;width:22px;height:22px;display:grid;place-items:center;padding:0;border:1px solid #383A33;border-radius:4px;background:none;color:#ABADA1;cursor:pointer;z-index:2}\n#ipe #ipr-cq>.tp-cqfade:hover{border-color:#F5F4EE;color:#F5F4EE}\n#ipe #ipr-cq>.tp-cqfade.on{background:#B5D86A;border-color:#B5D86A;color:#0B0C0A}\n#ipe #ipr-cq>.tp-cqop{display:flex;align-items:center;gap:10px;padding:8px 14px 8px 14px;border-bottom:1px solid #383A33}\n#ipe #ipr-cq>.tp-cqop[hidden]{display:none!important}\n#ipe #ipr-cq .tp-cqr{-webkit-appearance:none;appearance:none;flex:1;height:4px;margin:0;border-radius:2px;background:linear-gradient(90deg,#C8E06A var(--v,100%),#3A3C35 var(--v,100%));cursor:pointer}\n#ipe #ipr-cq .tp-cqr::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#C8E06A;border:0}\n#ipe #ipr-cq .tp-cqr::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#C8E06A;border:0}\n#ipe #ipr-cq .tp-cqp{font:400 11px/1 'IBM Plex Mono',ui-monospace,monospace;color:#C3C5BC;min-width:32px;text-align:right}\n#ipe-esq li.ipr-sub{position:relative}\n#ipe-esq li.ipr-sub .tp-dots{display:inline-flex;gap:3px;margin-left:auto;margin-right:6px;vertical-align:middle}\n#ipe-esq li.ipr-sub .tp-dots i{display:block;width:8px;height:8px;border-radius:50%}\n#ipe-esq li.ipr-sub.tp-on{color:#F5F4EE!important;box-shadow:inset 3px 0 0 var(--sc)}\n#ipe-esq li.ipr-sub.tp-on>small{color:#B5D86A!important}\nhtml:not([data-neutro-off]) #ipe #ipr-lgd.n5-min,#ipe #ipr-lgd{width:max-content!important;min-width:200px!important;max-width:min(420px,calc(100% - 90px))!important;height:auto!important;max-height:calc(100vh - 150px)!important;overflow-y:auto!important}\n#ipe #ipr-lgd .c{max-height:none!important;overflow:visible!important}\n#ipe #ipr-lgd .c>.l>b,#ipe #ipr-lgd .c>.l>span,#ipe #ipr-lgd .c>.one>span{white-space:normal!important;text-overflow:clip!important;overflow:visible!important}\n#tb-bar span.tb-h{position:relative;isolation:isolate;display:inline-flex;align-items:center;flex:none;height:30px;box-sizing:border-box;padding:0 20px 0 11px;margin:0 2px 0 0;background:#4A4D44;clip-path:polygon(0 0,calc(100% - 11px) 0,100% 50%,calc(100% - 11px) 100%,0 100%);border-radius:3px 0 0 3px;font:600 10px/1 Inter,sans-serif;letter-spacing:.14em;color:#C3C5BC}\n#tb-bar span.tb-h::before{content:'';position:absolute;inset:0;z-index:-1;background:#141513;clip-path:polygon(1px 1px,calc(100% - 11.4px) 1px,calc(100% - 1.4px) 50%,calc(100% - 11.4px) calc(100% - 1px),1px calc(100% - 1px))}\n#ipe.claro #tb-bar span.tb-h{background:#B9B4A2}\n#ipe.claro #tb-bar span.tb-h::before{background:#FAF8F1}\nhtml #ipe header.ipe-top #ipe-nivel+span.ipe-beta{margin-left:-12px!important}\nhtml #ipe header.ipe-top .ipe-ctx{flex:0 0 auto!important;min-width:170px;max-width:230px}\nhtml #ipe header.ipe-top #ipr-be-pq{flex:1 1 380px!important;min-width:170px!important;width:auto!important;max-width:380px!important}\n#ipe #ipr-lgd{display:flex!important;flex-direction:column;overflow:hidden!important}\n#ipe #ipr-lgd>.c{flex:1 1 auto;min-height:0;overflow-y:auto!important}\n#ipe #ipr-lgd>.tp-lpega,#ipe #ipr-lgd>.h,#ipe #ipr-lgd>.tp-lop{flex:none}\n#ipe #ipr-lgd>.tp-rz{position:absolute;z-index:4;touch-action:none}\n#ipe #ipr-lgd>.tp-rz-e{top:24px;bottom:12px;right:0;width:7px;cursor:ew-resize}\n#ipe #ipr-lgd>.tp-rz-w{top:24px;bottom:12px;left:0;width:7px;cursor:ew-resize}\n#ipe #ipr-lgd>.tp-rz-s{left:12px;right:12px;bottom:0;height:7px;cursor:ns-resize}\n#ipe #ipr-lgd>.tp-rz-se{right:0;bottom:0;width:14px;height:14px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 0 55%,#8C8F84 55% 62%,transparent 62% 72%,#8C8F84 72% 79%,transparent 79%);opacity:.7}\n#ipe #ipr-lgd>.tp-rz:hover{background-color:rgba(148,190,57,.35)}\n#ipe #ipr-lgd>.tp-rz-se:hover{opacity:1;background-color:transparent}\n#ipe #ipr-lgd.min>.tp-rz-s,#ipe #ipr-lgd.min>.tp-rz-se{display:none}\n#ipe #ipr-lgd .c>.ipr-ii-auto+.ipr-ii-f,#ipe #ipr-lgd .c>.ipr-ii-auto+.ipr-ii-f+.ipr-ii-auto{display:none!important}\n#ipe #ipr-lgd .c>.one>span.n5-nc>.ipr-ii-b{display:none!important}\n#ipe #ipr-lgd .ipr-ii-auto{display:flex!important;flex-direction:column;align-items:flex-start;margin:4px 0 10px 3px!important;flex-wrap:nowrap!important}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r{display:flex!important;align-items:center;gap:9px;margin:0!important;min-height:16px;width:auto!important}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r>s{display:block;flex:0 0 12px;width:12px;height:16px;border:0;border-radius:0;box-shadow:inset 1px 0 0 rgba(255,255,255,.08),inset -1px 0 0 rgba(255,255,255,.08)}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r:first-child>s{border-radius:3px 3px 0 0}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r:last-of-type>s{border-radius:0 0 3px 3px}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r>img{flex:0 0 16px;width:16px;height:16px;object-fit:contain}\n#ipe #ipr-lgd .ipr-ii-auto .ii-r>span{font:400 11.5px/1.2 'IBM Plex Mono',ui-monospace,monospace;color:#C3C5BC;white-space:nowrap!important}\n#ipe #ipr-lgd .ipr-ii-auto>:not(.ii-r){font-size:11px;color:#8C8F84;margin:4px 0 0}\n#ipe.claro #ipr-lgd .ipr-ii-auto .ii-r>span{color:#5b5f4f}\n#ipe-esq li.ipr-it:has(.ipr-nome>.ipr-ii-b) .c2-i{display:none!important}\n#ipe #ipr-lgd .ipr-ii-auto.tp-bx{align-items:stretch!important;margin:5px 0 8px 3px!important}\n#ipe #ipr-lgd .ipr-ii-auto.tp-bx>.ii-r,#ipe #ipr-lgd .ipr-ii-auto.tp-bx>.ii-sh,#ipe #ipr-lgd .ipr-ii-auto.tp-bx>:not(.tp-b){display:none!important}\n#ipe #ipr-lgd .c>.ipr-ii-auto.tp-b1{display:none!important}\n#ipe #ipr-lgd .tp-b{min-width:200px}\n#ipe #ipr-lgd .tp-bg,#ipe #ipr-lgd .tp-seg{height:10px;border-radius:3px}\n#ipe #ipr-lgd .tp-seg{display:flex;overflow:hidden}#ipe #ipr-lgd .tp-seg i{flex:1}\n#ipe #ipr-lgd .tp-gl{display:flex;justify-content:space-between;gap:12px;margin:3px 0 0;font:400 10.5px/1.2 'IBM Plex Mono',ui-monospace,monospace;color:#A9AC9F}\n#ipe #ipr-lgd .tp-ch{display:flex;flex-wrap:wrap;gap:4px 12px}\n#ipe #ipr-lgd .tp-ch>span{display:inline-flex;align-items:center;gap:6px;font:400 11.5px/1.3 Inter,sans-serif;color:#C3C5BC}\n#ipe #ipr-lgd .tp-ch>span>s{flex:none;width:11px;height:11px;border-radius:2px}\n#ipe #ipr-lgd .tp-me{font:normal 400 10.5px Inter,sans-serif;color:#8C8F84}\n#ipe.claro #ipr-lgd .tp-ch>span{color:#5b5f4f}\n#ipe #ipr-lgd .c>.l.ag-l{display:block!important;position:relative;padding-right:24px!important;white-space:normal!important}\n#ipe #ipr-lgd .c>.l.ag-l>b{display:block!important;margin:0 0 6px!important;white-space:normal!important}\n#ipe #ipr-lgd .c>.l.ag-l.tp-agx>.ag-r{display:none!important}\n#ipe #ipr-lgd .c>.l.ag-l>.ag-n{display:block!important;margin:5px 0 0!important;font:400 10.5px/1.3 Inter,sans-serif!important;color:#8C8F84!important;white-space:normal!important}\n#ipe #ipr-lgd .tp-ch img.tp-im{flex:none;width:14px;height:14px;object-fit:contain}\n#ipe #ipr-lgd .c>.l.ag-l{padding-top:6px!important;padding-bottom:8px!important}\n#ipe #ipr-lgd .c>.l.ag-l>b>.ipr-ii-b,#ipe #ipr-lgd .c>.l.ag-l .ipr-ii-b{top:6px!important;transform:none!important}\n#ipe #ipr-lgd .c>.l.ag-l>b{margin-bottom:7px!important}\n#ipe #ipr-lgd .c>.l.ag-l+.ipr-ii-f,#ipe #ipr-lgd .c>.l.ag-l+.ipr-ii-auto,#ipe #ipr-lgd .c>.l.ag-l+.ipr-ii-f+.ipr-ii-auto,#ipe #ipr-lgd .c>.l.ag-l+.ipr-ii-f+.ipr-ii-auto+.ipr-ii-f,#ipe #ipr-lgd .c>.l.ag-l+.ipr-ii-f+.ipr-ii-auto+.ipr-ii-f+.ipr-ii-auto{display:none!important}\n#ipe .tp-bw{position:relative;display:flex;min-width:0;box-sizing:border-box}\n#ipe .tp-bw>input.ipr-busca{flex:1 1 auto;width:100%!important;min-width:0;margin:0!important;padding-right:34px!important}\n#ipe input.ipr-busca::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none}\n#ipe .tp-bw>.tp-bx{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:24px;height:24px;border:0;border-radius:50%;background:transparent;color:#ABADA1;font:400 19px/1 Inter,sans-serif;cursor:pointer;padding:0;display:none;place-items:center}\n#ipe .tp-bw.tp-cv>.tp-bx{display:grid}\n#ipe .tp-bw>.tp-bx:hover{color:#F5F4EE;background:rgba(255,255,255,.08)}\n#ipe.claro .tp-bw>.tp-bx{color:#5b5f4f}#ipe.claro .tp-bw>.tp-bx:hover{color:#202319;background:rgba(0,0,0,.06)}\nhtml body #ipe.claro .tp-logo text{fill:#202319}\nhtml body #ipe.claro .tp-logo rect{fill:#C9C5B5}\nhtml body #ipe.claro header.ipe-top #ipe-nivel{border-color:#4E6B1E!important;color:#3E5518!important;background:transparent!important}\nhtml body #ipe.claro header.ipe-top span.ipe-beta{border:1px solid #4E6B1E!important;color:#3E5518!important;background:transparent!important;border-radius:999px!important}\nhtml body #ipe.claro .ipe-tools{background:#FFFFFF!important;border-color:#DCD9CC!important;box-shadow:0 2px 10px rgba(32,35,25,.12)!important}\nhtml body #ipe.claro .ipe-tg .ipe-t{color:#202319!important;background:transparent!important}\nhtml body #ipe.claro .ipe-tg .ipe-t svg{stroke:currentColor}\nhtml body #ipe.claro .ipe-tg .ipe-t.ipe-t--mais svg{fill:currentColor;stroke:none}\nhtml body #ipe.claro .ipe-tg .ipe-t:hover{background:#EFEEE5!important}\nhtml body #ipe.claro .ipe-tg .ipe-t[aria-pressed=true]{background:#202319!important;color:#B5D86A!important}\nhtml body #ipe.claro .ipe-tg .ipe-t:disabled{color:#A9AC9C!important}\nhtml body #ipe.claro .ipe-tip kbd{color:#C3C5BC!important}\nhtml body #ipe.claro #tb-qg .tb-q{color:#3E5518!important}\nhtml body #ipe.claro #tb-bar{background:#F4F2EB!important;border-bottom:1px solid #DCD9CC!important;box-shadow:none!important}\nhtml body #ipe.claro #tb-bar .tb-t{background:#FFFFFF!important;border-color:#DCD9CC!important;color:#202319!important}\nhtml body #ipe.claro #tb-bar .tb-t svg{color:#4E6B1E!important}\nhtml body #ipe.claro #tb-bar .tb-t:hover{border-color:#4E6B1E!important}\nhtml body #ipe.claro #tb-bar .tb-t[aria-pressed=true]{background:#202319!important;color:#B5D86A!important;border-color:#202319!important}\nhtml body #ipe.claro #tb-bar .tb-t[aria-pressed=true] svg{color:#B5D86A!important}\nhtml body #ipe.claro #tb-bar span.tb-h{color:#4F5344!important;background:#A9AC9C!important}\nhtml body #ipe.claro #tb-bar span.tb-h::before{background:#F4F2EB!important}\nhtml body #ipe.claro #tb-bar .tb-mais{background:#FFFFFF!important;border-color:#DCD9CC!important;color:#3E5518!important}\nhtml body #ipe.claro #tb-bar .tb-m button{border-color:#B9B5A5!important;color:#4F5344!important;background:transparent!important}\nhtml body #ipe.claro #tb-bar .tb-m button.ch{color:#202319!important}\nhtml body #ipe.claro #tb-bar .tb-m button[aria-pressed=true]{border-color:#4E6B1E!important;color:#3E5518!important;background:#FFFFFF!important}\nhtml body #ipe.claro #tb-bar>.tp-cq{background:#FFFFFF!important;border-color:#4E6B1E!important;color:#202319!important}\nhtml body #ipe.claro #tb-bar>.tp-cq svg,html body #ipe.claro #tb-bar>.tp-cq em{color:#3E5518!important}\nhtml body #ipe.claro #tb-x{background:#FFFFFF!important;color:#4F5344!important;border:1px solid #DCD9CC!important}\nhtml body #ipe.claro #tb-pan{background:#FFFFFF!important;color:#202319!important;border:1px solid #DCD9CC!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) > .ipe-sbh{background:#F4F2EB!important;border-color:#DCD9CC!important;color:#202319!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) > .ipe-sbh::after{color:#4E6B1E!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipr-mb-b.actual{background:#EFEEE5!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b{border-color:#94BE39!important;color:#2F4113!important;background:#FFFFFF!important;opacity:1!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b svg{color:#4E6B1E!important}\nhtml body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b:disabled,html body #ipe.claro #ipe-esq > section.ipe-sb:has(> #ipe-locais) .ipe-loc-acc .ipe-b.ipr-73e-off{border-color:#DCD9CC!important;color:#A9AC9C!important}\nhtml body #ipe.claro #ipe-esq .ipr-it .ipr-nome,html body #ipe.claro #ipe-esq .ipr-it:not(.on) .ipr-nome{color:#3E4234!important}\nhtml body #ipe.claro #ipe-esq .ipr-it.on .ipr-nome{color:#202319!important}\nhtml body #ipe.claro .tp-sec{color:#6B6F5E!important}\nhtml body #ipe.claro #ipe-esq .c2-pct{color:#4F5344!important}\nhtml body #ipe.claro #ipe-esq li.ipr-sub.tp-on{color:#202319!important}\nhtml body #ipe.claro #ipe-esq li.ipr-sub.tp-on>small{color:#3E5518!important}\nhtml body #ipe.claro #ipe-esq .ipr-it input.ipr-op::-webkit-slider-thumb{box-shadow:0 0 0 2px #FFFFFF}\nhtml body #ipe.claro #ipe-esq .ipr-it input.ipr-op::-moz-range-thumb{box-shadow:0 0 0 2px #FFFFFF}\nhtml body #ipe.claro #ipe-esq .c2-i,html body #ipe.claro #tao .mi-b,html body #ipe.claro #tes .mi-b,html body #ipe.claro .ipr-ii-b,html body #ipe.claro #ipr-lgd .tp-li{border-color:#8A8C83!important;color:#5B5F4F!important;background:transparent!important}\nhtml body #ipe.claro #ipe-esq .c2-i:hover,html body #ipe.claro #tao .mi-b:hover,html body #ipe.claro #tes .mi-b:hover,html body #ipe.claro .ipr-ii-b:hover,html body #ipe.claro .tp-hov,html body #ipe.claro #ipr-lgd .tp-li:hover{border-color:#202319!important;color:#202319!important;background:transparent!important}\nhtml body #ipe.claro #ipe-esq .c2-i.tp-pin,html body #ipe.claro #tao .mi-b.tp-pin,html body #ipe.claro #tes .mi-b.tp-pin,html body #ipe.claro .ipr-ii-b.tp-pin,html body #ipe.claro #ipr-lgd .tp-li.tp-pin{background:#202319!important;border-color:#202319!important;color:#B5D86A!important}\nhtml body #ipe.claro #tao h5 .tp-ic,html body #ipe.claro #tes h5 .tp-ic{color:#4E6B1E}\nhtml body #ipe.claro #tao.tp-n1>h5:hover,html body #ipe.claro #tes.tp-n1>h5:hover{color:#202319}\nhtml body #ipe.claro #tao h5.tp-tc,html body #ipe.claro #tes h5.tp-tc{box-shadow:inset 3px 0 0 var(--tc)!important}\nhtml body #ipe.claro #tao label:has(> .mi-b:hover){background:rgba(148,190,57,.16)}\nbody:has(#ipe.claro) #c2-pop,body:has(#ipe.claro) #tp-lpop{background:#FFFFFF;border-color:#DCD9CC;color:#3E4234;box-shadow:0 8px 24px rgba(32,35,25,.16)}\nbody:has(#ipe.claro) #c2-pop:before{background:#FFFFFF;border-color:#DCD9CC}\nbody:has(#ipe.claro) #c2-pop b,body:has(#ipe.claro) #tp-lpop b{color:#202319}\nhtml body #ipe.claro #ipr-lgd{background:rgba(255,255,255,.97)!important;color:#202319!important;border:1px solid #DCD9CC!important;box-shadow:0 4px 16px rgba(32,35,25,.14)!important}\nhtml body #ipe.claro #ipr-lgd>button.h,html body #ipe.claro #ipr-lgd>button.h i{color:#3E5518!important}\nhtml body #ipe.claro #ipr-lgd .tp-lpega span{background:#B9B5A5!important}\nhtml body #ipe.claro #ipr-lgd .c>.l>b,html body #ipe.claro #ipr-lgd .c>.one>span,html body #ipe.claro #ipr-lgd.n5-min .c>.l>b,html body #ipe.claro #ipr-lgd .ipr-76.tp-wi>b{color:#202319!important}\nhtml body #ipe.claro #ipr-lgd .tp-vb .lb,html body #ipe.claro #ipr-lgd .ipr-ii-auto .ii-r>span,html body #ipe.claro #ipr-lgd .tp-ch>span,html body #ipe.claro #ipr-lgd .tp-lp,html body #ipe.claro #ipr-lgd .tp-gl,html body #ipe.claro #ipr-lgd .tp-gl *,html body #ipe.claro #ipr-lgd .tp-seg,html body #ipe.claro #ipr-lgd .tp-bm{color:#3E4234!important}\nhtml body #ipe.claro #ipr-lgd .tp-vb .lb em{color:#6B6F5E!important}\nhtml body #ipe.claro #ipr-lgd>.tp-lmin,html body #ipe.claro #ipr-lgd>.tp-lfade{background:#FFFFFF!important;border-color:#DCD9CC!important;color:#4F5344!important}\nhtml body #ipe.claro #ipr-lgd>.tp-lmin:hover,html body #ipe.claro #ipr-lgd>.tp-lfade:hover{border-color:#202319!important;color:#202319!important}\nhtml body #ipe.claro #ipr-lgd>.tp-lfade.on{background:#202319!important;border-color:#202319!important;color:#B5D86A!important}\nhtml body #ipe.claro #ipr-cq>.tp-cqfade{background:#FFFFFF!important;border-color:#DCD9CC!important;color:#4F5344!important}\nhtml body #ipe.claro #ipr-cq>.tp-cqfade.on{background:#202319!important;color:#B5D86A!important}\nhtml body #ipe.claro #ipr-cq .tp-cqp,html body #ipe.claro #ipr-be-cqp li.ipr-cq-it .ipr-cq-op output{color:#4F5344!important}\nhtml body #ipe.claro #ipr-be-cqp li.ipr-cq-it.tp-sel{background:#EFEEE5!important}\nhtml body #ipe.claro .ipe-tr .tp-tb.tp-on,html body #ipe.claro #tp-ling:hover,html body #ipe.claro #tp-lingd:hover{color:#3E5518!important}\nhtml body #ipe.claro #ipe-form h3.ipe-h{color:#202319!important}\nhtml body #ipe.claro #ipe-form h3.ipe-h>b{color:#4E6B1E!important}\nhtml body #ipe.claro .ipe-met .ipe-mb{color:#202319!important}\nhtml body #ipe.claro .ipe-met .ipe-mb span{color:#3E4234!important}\nhtml body #ipe.claro .ipe-met .ipe-mb[aria-pressed=true],html body #ipe.claro .ipe-met .ipe-mb.on{background:#202319!important}\nhtml body #ipe.claro .ipe-met .ipe-mb[aria-pressed=true] span,html body #ipe.claro .ipe-met .ipe-mb.on span{color:#B5D86A!important}\nhtml body #ipe.claro #ipe-form .ipe-kpi{background:#F4F2EB!important;border-color:#DCD9CC!important;color:#202319!important}\nhtml body #ipe.claro #ipe-form .ipe-kpi .mono,html body #ipe.claro #ipe-form .ipe-kpi b,html body #ipe.claro #ipe-form .ipe-kpi strong{color:#202319!important}\nhtml body #ipe.claro #ipe-form label.ipe-chk{background:#FFFFFF!important;border-color:#DCD9CC!important;color:#3E4234!important}\nhtml body #ipe.claro #ipe-form label.ipe-chk b{color:#202319!important}\nhtml body #ipe.claro #ipe-form .ipe-nota,html body #ipe.claro #ipe-form .ipe-nota .ipr-nt{color:#5B5F4F!important}\nhtml body #ipe.claro #ipe-form .ipe-nota b{color:#202319!important}\nhtml body #ipe.claro #ipe-form label.ipe-lbl{color:#3E4234!important}\nhtml body #ipe.claro #ipe-limpar{color:#5B5F4F!important}\nhtml body #ipe.claro .ipe-guia-p li{color:#6B6F5E!important}\nhtml body #ipe.claro .tp-bw>.tp-bx{color:#5B5F4F}\nhtml body #ipe.claro #ipe-form .ipe-kpi span{color:#5B5F4F!important}\nhtml body #ipe.claro #ipe-form .ipe-kpi strong{color:#202319!important}\nhtml body #ipe.claro #ipe-form .ipe-kpi div+div strong{color:#3E5518!important}\nhtml body #ipe.claro #ipe-form label.ipe-chk strong{color:#202319!important}\nhtml body #ipe.claro #ipe-form label.ipe-chk .n5-tags i{color:#4F5344!important;border-color:#DCD9CC!important;background:#F4F2EB!important}\nhtml body #ipe.claro #ipe-esq .ipr-it input.ipr-op{background:linear-gradient(90deg,var(--k,#94BE39) var(--v,60%),#D3D0C2 var(--v,60%))!important}\n#ipe #tao>h5,#ipe #tes>h5{position:relative}\n#ipe #tao>h5 .tp-cnt,#ipe #tes>h5 .tp-cnt{display:none;align-items:center;gap:5px;position:absolute;right:26px;top:50%;transform:translateY(-50%);font:600 11px/1 'IBM Plex Mono',ui-monospace,monospace;color:var(--tc);letter-spacing:0}\n#ipe #tao>h5 .tp-cnt.on,#ipe #tes>h5 .tp-cnt.on{display:inline-flex}\n#ipe #tao>h5 .tp-cnt i,#ipe #tes>h5 .tp-cnt i{width:8px;height:8px;border-radius:50%;background:var(--tc);flex:none}\n#ipe #tao>h5 .tp-cnt b,#ipe #tes>h5 .tp-cnt b{font-weight:600;color:var(--tc)}\n#ipe.claro #tao>h5 .tp-cnt b,#ipe.claro #tes>h5 .tp-cnt b{color:color-mix(in srgb,var(--tc) 60%,#202319)}\n";(D.head||D.documentElement).appendChild(st);
  D.documentElement.classList.add('ipr-nav2');

  var st2=D.createElement('style');st2.id='ipr-nav2-ajuste';
  st2.textContent='@media (max-width:1700px){html.ipr-nav2:not([data-neutro-off]) body #ipe header.ipe-top span.ipe-beta.ipe-beta,html.ipr-nav2 body #ipe header.ipe-top #ipe-nivel{display:none!important}html.ipr-nav2 body #ipe header.ipe-top .ipe-ctx{min-width:120px!important;max-width:150px!important;overflow:hidden}html.ipr-nav2 body #ipe header.ipe-top .ipe-ctx *{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}html.ipr-nav2 body #ipe header.ipe-top #ipr-be-pq{max-width:140px!important}}';
  (D.head||D.documentElement).appendChild(st2);
(function () {
  if (window.__tb) return; window.__tb = 1;
  var D = document, bar = null, sc = null, xb = null, pan = null, qg = null, ult = '';
  function t62() { return D.getElementById('ipr-t62'); }
  function chave(o) { return o.getAttribute('data-t62') ? 't:' + o.getAttribute('data-t62') : 'a:' + o.getAttribute('data-agt'); }
  function orig(k) { var t = t62(); if (!t) return null; var p = k.split(':'); return t.querySelector(p[0] === 't' ? '[data-t62="' + p[1] + '"]' : '[data-agt="' + p[1] + '"]'); }
  function poe(bs) {
    sc.innerHTML = '';
    bs.forEach(function (o) {
      var c = D.createElement('button'), n = o.querySelector('.n'), sv = o.querySelector('svg'), nm = n ? n.textContent.trim() : o.textContent.trim();
      c.type = 'button'; c.className = 'tb-t'; c.setAttribute('data-k', chave(o)); c.setAttribute('data-n', nm); c.setAttribute('aria-label', nm); c.setAttribute('aria-pressed', 'false');
      c.innerHTML = (sv ? sv.outerHTML : '') + '<span class="n"></span>'; c.querySelector('.n').textContent = nm;
      sc.appendChild(c);
    });
  }
  function monta() {
    var M = D.getElementById('ipe-mapa'), t = t62();
    if (!M) return false; if (!t) return false;
    var bs = t.querySelectorAll('button[data-t62],button[data-agt]'); if (!bs.length) return false;
    bar = D.createElement('div'); bar.id = 'tb-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Temas');
    bar.innerHTML = '<span class="tb-h">Temas</span><div class="tb-sc"></div><button type="button" class="tb-mais" aria-label="Mais temas" title="Mais temas">\u203a</button><span class="tb-m"><span class="tb-h">Os meus</span><button type="button" data-px="1">1</button><button type="button" data-px="2">2</button><button type="button" data-px="3">3</button><button type="button" class="g" data-pxg="">Guardar</button></span>';
    sc = bar.querySelector('.tb-sc');
    poe(bs);
    M.appendChild(bar);
    qg = D.createElement('div'); qg.className = 'ipe-tg'; qg.id = 'tb-qg';
    qg.innerHTML = '<button type="button" class="ipe-t tb-q" title="Por onde come\u00e7ar?" aria-label="Por onde come\u00e7ar?">?<span class="ipe-tip">Por onde come\u00e7ar?</span></button>';
    qg.addEventListener('click', function () { var t = t62(); var q = t ? t.querySelector('.ipr-70-com') : null; if (q) q.click(); D.documentElement.classList.remove('tb-fechado'); });
    pan = D.createElement('div'); pan.id = 'tb-pan'; pan.hidden = true; M.appendChild(pan);
    var par = t.parentNode, P = Node.prototype, ap = P.appendChild, ib = P.insertBefore;
    function preso(n) { return n ? (n.id === 'ipr-t62' ? n.parentNode === pan : false) : false; }
    P.appendChild = function (n) { if (this !== pan) { if (preso(n)) return n; } return ap.call(this, n); };
    P.insertBefore = function (n, r) { if (this !== pan) { if (preso(n)) return n; } return ib.call(this, n, r); };
    ap.call(pan, t);
    xb = D.createElement('button'); xb.type = 'button'; xb.id = 'tb-x'; xb.title = 'Fechar o painel (o tema continua ligado)'; xb.setAttribute('aria-label', 'Fechar o painel'); xb.textContent = '\u00d7'; xb.hidden = true; M.appendChild(xb);
    xb.addEventListener('click', function () { D.documentElement.classList.add('tb-fechado'); sinc(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('tb-mais')) { var fim = sc.scrollLeft + sc.clientWidth > sc.scrollWidth - 4; sc.scrollTo({ left: fim ? 0 : sc.scrollLeft + Math.round(sc.clientWidth * 0.7), behavior: 'auto' }); return; }
      var t = t62(); if (!t) return;
      if (b.classList.contains('tb-q')) { var q = t.querySelector('.ipr-70-com'); if (q) q.click(); D.documentElement.classList.remove('tb-fechado'); return; }
      if (b.hasAttribute('data-px')) { var p = t.querySelector('[data-px="' + b.getAttribute('data-px') + '"]'); if (p) p.click(); setTimeout(sinc, 60); return; }
      if (b.hasAttribute('data-pxg')) { var g = t.querySelector('[data-pxg]'); if (g) g.click(); setTimeout(sinc, 60); return; }
      var k = b.getAttribute('data-k'); if (!k) return;
      var o = orig(k); if (!o) return;
      var fech = D.documentElement.classList.contains('tb-fechado');
      if (o.getAttribute('aria-pressed') === 'true') { if (fech) { D.documentElement.classList.remove('tb-fechado'); sinc(); return; } }
      D.documentElement.classList.remove('tb-fechado');
      o.click(); setTimeout(sinc, 60);
    });
    D.documentElement.classList.add('tb-on');
    new MutationObserver(function () { if (ult) return; ult = 'x'; setTimeout(function () { ult = ''; sinc(); }, 120); }).observe(pan, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class', 'title'] });
    window.addEventListener('resize', sinc); sc.addEventListener('scroll', mais);
    sinc(); return true;
  }
  function mais() {
    var mb = bar.querySelector('.tb-mais'), sobra = sc.scrollWidth > sc.clientWidth + 2, fim = sc.scrollLeft + sc.clientWidth > sc.scrollWidth - 4;
    mb.hidden = !sobra; sc.classList.toggle('mf', sobra ? !fim : false);
    mb.textContent = fim ? '\u2039' : '\u203a'; mb.title = fim ? 'Voltar ao in\u00edcio' : 'Mais temas';
  }
  function sinc() {
    if (!bar) return; var t = t62(); if (!t) return;
    var bs = t.querySelectorAll('button[data-t62],button[data-agt]'); if (bs.length !== sc.children.length) poe(bs);
    var tl = D.querySelector('#ipe-mapa .ipe-tools'); if (tl) { if (qg.parentNode !== tl) tl.appendChild(qg); } qg.hidden = !t.querySelector('.ipr-70-com');
    sc.querySelectorAll('.tb-t').forEach(function (c) { var o = orig(c.getAttribute('data-k')); c.setAttribute('aria-pressed', o ? (o.getAttribute('aria-pressed') === 'true' ? 'true' : 'false') : 'false'); });
    bar.querySelectorAll('.tb-m [data-px]').forEach(function (c) { var o = t.querySelector('[data-px="' + c.getAttribute('data-px') + '"]'); if (!o) return; c.title = o.title || ''; c.classList.toggle('ch', !o.classList.contains('vz')); c.setAttribute('aria-pressed', o.getAttribute('aria-pressed') === 'true' ? 'true' : 'false'); });
    var g = t.querySelector('[data-pxg]'), gb = bar.querySelector('[data-pxg]'); if (g) { gb.setAttribute('aria-pressed', g.getAttribute('aria-pressed') === 'true' ? 'true' : 'false'); gb.textContent = g.textContent.trim() || 'Guardar'; }
    if (t.parentNode !== pan) pan.appendChild(t);
    var s = t.querySelector('.ipr-t62-c');
    var vis = s ? !D.documentElement.classList.contains('tb-fechado') : false;
    xb.hidden = !vis; pan.hidden = !vis;
    mais();
  }
  var n = 0;
  (function espera() { if (monta()) return; n++; if (n < 2000) setTimeout(espera, 150); })();
})();

;
(function () {
  if (window.__mi) return; window.__mi = 1;
  var D = document, cx = null, aberto = '';
  function tao() { return D.getElementById('tao'); }
  function titulo(lb) { var s = lb.querySelector('span'), t = ''; if (!s) return ''; s.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.nodeValue; }); return t.trim(); }
  function desc(lb) { var i = lb.querySelector('span > i'); return i ? i.textContent.trim() : ''; }
  function sub(lb) { var e = lb.previousElementSibling; while (e) { if (e.tagName === 'H5') return e.textContent.trim(); e = e.previousElementSibling; } return ''; }
  function caixa() {
    if (cx) return cx;
    cx = D.createElement('div'); cx.id = 'mi-ii'; cx.setAttribute('role', 'dialog'); cx.hidden = true;
    D.body.appendChild(cx);
    cx.addEventListener('click', function (e) { if (e.target.closest('.x')) fecha(); });
    return cx;
  }
  function fecha() { if (cx) cx.hidden = true; aberto = ''; }
  function esc(x) { return String(x).replace(/[<>"]/g, function (c) { return c === '<' ? '&lt;' : (c === '>' ? '&gt;' : '&quot;'); }); }
  function abre(b) {
    var lb = b.closest('label'), id = b.getAttribute('data-mi');
    if (aberto === id) { if (!cx.hidden) { fecha(); return; } }
    var o = D.getElementById('ipr-ii'); if (o) { if (!o.hidden) { var x = o.querySelector('.x'); if (x) x.click(); else o.hidden = true; } }
    var c = caixa(), d = desc(lb), sg = sub(lb);
    c.innerHTML = '<button type="button" class="x" aria-label="Fechar">\u00d7</button><h3>' + esc(titulo(lb)) + '</h3><div class="ii-g">Mundo \u00b7 fontes globais' + (sg ? ' \u00b7 ' + esc(sg) : '') + '</div>' +
      (d ? '<h4>O que \u00e9</h4><p>' + esc(d) + '</p>' : '<p class="ii-m">Sem descri\u00e7\u00e3o para esta camada.</p>');
    c.hidden = false; aberto = id;
    var t = tao().getBoundingClientRect(), r = lb.getBoundingClientRect(), w = c.offsetWidth, h = c.offsetHeight;
    var x0 = t.right + 8; if (x0 + w > innerWidth - 8) x0 = Math.max(8, t.left - w - 8);
    var y0 = Math.max(8, Math.min(r.top - 6, innerHeight - h - 8));
    c.style.left = x0 + 'px'; c.style.right = 'auto'; c.style.top = y0 + 'px';
  }
  function poe() {
    var t = tao(); if (!t) return;
    [].forEach.call(t.querySelectorAll('label'), function (lb) {
      var inp = lb.querySelector('input[data-tao]'); if (!inp) return;
      var meu = lb.querySelector('.mi-b');
      if (lb.querySelector('.ipr-ii-b')) { if (meu) meu.remove(); return; }
      if (meu) return;
      var b = D.createElement('button'); b.type = 'button'; b.className = 'mi-b'; b.textContent = 'i';
      b.setAttribute('data-mi', inp.getAttribute('data-tao'));
      b.title = 'Sobre esta camada'; b.setAttribute('aria-label', b.title);
      lb.appendChild(b);
    });
  }
  D.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#tao .mi-b') : null;
    if (b) { e.preventDefault(); e.stopPropagation(); abre(b); return; }
    var o = e.target.closest ? e.target.closest('#tao .ipr-ii-b') : null;
    if (o) {
      fecha();
      var p = D.getElementById('ipr-ii'), id = o.getAttribute('data-ii');
      if (p) { if (!p.hidden) { if (p.__mi === id) { e.preventDefault(); e.stopPropagation(); var x = p.querySelector('.x'); if (x) x.click(); else p.hidden = true; p.__mi = ''; return; } } }
      setTimeout(function () { var q = D.getElementById('ipr-ii'); if (q) q.__mi = id; }, 0);
      return;
    }
    if (cx) { if (!cx.hidden) { if (!cx.contains(e.target)) fecha(); } }
  }, true);
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });
  var tm = null;
  new MutationObserver(function () { if (tm) return; tm = setTimeout(function () { tm = null; poe(); }, 150); }).observe(D.documentElement, { childList: true, subtree: true });
  poe();
})();
;

(function () {
  var LUPA = '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4 4M6.5 4.5v4M4.5 6.5h4"/></svg>';
  var aberto = null, pop = null;
  function cls(el, c, on) { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }
  function esq() { return document.getElementById('ipe-esq'); }
  function txtNome(li) {
    var n = li.querySelector('.ipr-nome'); if (!n) return '';
    var t = ''; n.childNodes.forEach(function (c) { if (c.nodeType === 3) t += c.nodeValue; });
    return t.trim();
  }
  function caixa() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.id = 'c2-pop'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = '<button type="button" class="c2-x" aria-label="Fechar">\u00d7</button><b></b><span></span>';
    document.body.appendChild(pop);
    pop.querySelector('.c2-x').addEventListener('click', function () { fecha(); });
    return pop;
  }
  function liDe(id) { var e = esq(); return e ? e.querySelector('.ipr-it[data-id="' + id + '"]') : null; }
  function posiciona() {
    if (!aberto || !pop) return;
    var li = liDe(aberto), e = esq();
    if (!li || !li.querySelector('.c2-i')) { fecha(); return; }
    var re = e.getBoundingClientRect(), rl = li.getBoundingClientRect();
    if (rl.bottom < re.top || rl.top > re.bottom) { pop.style.visibility = 'hidden'; return; }
    pop.style.visibility = '';
    pop.style.left = (re.right + 12) + 'px';
    pop.style.top = Math.max(8, rl.top - 4) + 'px';
  }
  function abre(li) {
    var p = caixa();
    aberto = li.getAttribute('data-id');
    p.querySelector('b').textContent = txtNome(li);
    p.querySelector('span').textContent = li.getAttribute('data-c2d') || '';
    p.classList.add('ab');
    marca(); posiciona();
  }
  function fecha() { aberto = null; if (pop) pop.classList.remove('ab'); marca(); }
  function marca() {
    var e = esq(); if (!e) return;
    e.querySelectorAll('.c2-i').forEach(function (b) {
      var on = b.closest('.ipr-it').getAttribute('data-id')

 === aberto;
      cls(b, 'ab', on); b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  function pct(r) {
    var v = Math.round((r.value - r.min) / (r.max - r.min) * 100);
    r.style.setProperty('--v', v + '%');
    var s = r.nextElementSibling;
    if (s) { if (s.classList.contains('c2-pct')) { if (s.textContent !== r.value + '%') s.textContent = r.value + '%'; } }
  }
  function trata(li) {
    var cor = li.querySelector('.ipr-cor'), ck = li.querySelector('input.ipr-ck');
    if (cor) li.style.setProperty('--k', cor.style.background || cor.style.backgroundColor);
    if (ck) { if (ck.type === 'checkbox') { if (cor) cls(li, 'c2-t', true); } }
    var lab = li.querySelector('label'), opc = li.querySelector('.ipr-opc-b');
    var desc = null, est = null;
    li.querySelectorAll('.ipr-nome small').forEach(function (s) {
      if (s.classList.contains('ipr-cad')) return;
      if (s.classList.contains('ipr-est')) { est = s; } else { desc = s; }
    });
    cls(li, 'c2-far', !!est);
    if (est) {
      cls(est, 'c2-esc', true);
      if (!li.querySelector('.c2-z')) {
        var z = document.createElement('button'); z.type = 'button'; z.className = 'c2-z';
        z.title = 'Aproximar o mapa para ver'; z.setAttribute('aria-label', z.title); z.innerHTML = LUPA;
        lab.insertBefore(z, opc || null);
      }
    }
    if (desc) {
      cls(desc, 'c2-esc', true);
      if (li.getAttribute('data-c2d') !== desc.textContent.trim()) li.setAttribute('data-c2d', desc.textContent.trim());
      if (!li.querySelector('.c2-i')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'c2-i'; b.textContent = 'i';
        b.title = 'Mais informação'; b.setAttribute('aria-label', b.title);
        lab.insertBefore(b, opc || null);
      }
    }
    var r = li.querySelector('input.ipr-op');
    if (r) {
      if (!r.nextElementSibling || !r.nextElementSibling.classList.contains('c2-pct')) {
        var sp = document.createElement('span'); sp.className = 'c2-pct'; r.parentNode.insertBefore(sp, r.nextSibling);
      }
      pct(r);
    }
  }
  function cabecalhos(e) {
    e.querySelectorAll('.ipr-sub small').forEach(function (s) {
      if (/(ligadas| on)$/.test(s.textContent)) return;
      var b = s.querySelector('b'); if (!b) return;
      var tot = parseInt(s.textContent, 10); if (isNaN(tot)) return;
      var ing = String(window.IPR_LINGUA || 'pt').toLowerCase().indexOf('pt') !== 0;
      s.textContent = b.textContent + (ing ? ' of ' : ' de ') + tot + (ing ? ' on' : ' ligadas');
    });
  }
  var pend = false;
  function corre() {
    pend = false;
    var e = esq(); if (!e) return;
    e.querySelectorAll('.ipr-it').forEach(trata);
    cabecalhos(e); marca();
    if (aberto) { var li = liDe(aberto); if (li) { if (pop) pop.querySelector('span').textContent = li.getAttribute('data-c2d') || ''; } }
    posiciona();
  }
  function agenda() { if (!pend) { pend = true; requestAnimationFrame(corre); } }
  function zoom(li) {
    var id = li.getAttribute('data-id'), n = 0;
    (function passo() {
      var l = liDe(id);
      if (!l) return;
      if (!l.classList.contains('c2-far')) return;
      if (n > 7) return;
      var bz = document.querySelector('.maplibregl-ctrl-zoom-in');
      if (!bz) return;
      bz.click(); n++; setTimeout(passo, 450);
    })();
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var bi = t.closest ? t.closest('#ipe-esq .c2-i') : null;
    var bzz = t.closest ? t.closest('#ipe-esq .c2-z') : null;
    if (bi) {
      ev.preventDefault(); ev.stopPropagation();
      var li = bi.closest('.ipr-it');
      if (aberto === li.getAttribute('data-id')) fecha(); else abre(li);
      return;
    }
    if (bzz) { ev.preventDefault(); ev.stopPropagation(); zoom(bzz.closest('.ipr-it')); }
  }, true);
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.classList) { if (t.classList.contains('ipr-op')) pct(t); }
  }, true);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (aberto) fecha(); } });
  window.addEventListener('resize', posiciona);
  document.addEventListener('scroll', posiciona, true);
  function liga() {
    var e = esq();
    if (!e) { setTimeout(liga, 300); return; }
    new MutationObserver(agenda).observe(e, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    corre();
  }
  liga();
})();

;
(function(){
  var LOGO = '\u003csvg class="tp-logo" viewBox="0 0 168 27" role="img" aria-label="IPR Atlas">\u003cg transform="translate(-12.5 -7.9)">\u003cpath fill="#94BE39" d="M28.9 7.9L28.9 13.9L21.6 13.9L28.9 7.9ZM28.9 14.1L28.9 20.2L21.6 20.2L28.9 14.1ZM28.9 20.4L28.9 26.4L21.6 26.4L28.9 20.4ZM21.6 26.4L21.6 20.4L28.9 20.4L21.6 26.4ZM28.9 26.6L28.9 32.6L21.6 32.6L28.9 26.6ZM21.6 32.6L21.6 26.6L28.9 26.6L21.6 32.6ZM36.5 7.9L36.5 13.9L29.1 13.9L36.5 7.9ZM29.1 13.9L29.1 7.9L36.5 7.9L29.1 13.9ZM36.5 20.4L36.5 26.4L29.1 26.4L36.5 20.4ZM29.1 26.4L29.1 20.4L36.5 20.4L29.1 26.4ZM44 7.9L44 13.9L36.6 13.9L44 7.9ZM36.6 13.9L36.6 7.9L44 7.9L36.6 13.9ZM44 20.4L44 26.4L36.6 26.4L44 20.4ZM36.6 26.4L36.6 20.4L44 20.4L36.6 26.4ZM44.1 7.9L44.1 13.9L51.5 13.9L44.1 7.9ZM51.5 14.1L51.5 20.2L44.1 20.2L51.5 14.1ZM44.1 20.2L44.1 14.1L51.5 14.1L44.1 20.2ZM44.1 26.4L44.1 20.4L51.5 20.4L44.1 26.4ZM61.1 7.9L61.1 13.9L53.8 13.9L61.1 7.9ZM53.8 13.9L53.8 7.9L61.1 7.9L53.8 13.9ZM61.1 14.1L61.1 20.2L53.8 20.2L61.1 14.1ZM61.1 20.4L61.1 26.4L53.8 26.4L61.1 20.4ZM53.8 26.4L53.8 20.4L61.1 20.4L53.8 26.4ZM61.1 26.6L61.1 32.6L53.8 32.6L61.1 26.6ZM53.8 32.6L53.8 26.6L61.1 26.6L53.8 32.6ZM68.6 7.9L68.6 13.9L61.3 13.9L68.6 7.9ZM61.3 13.9L61.3 7.9L68.6 7.9L61.3 13.9ZM68.6 20.4L68.6 26.4L61.3 26.4L68.6 20.4ZM61.3 26.4L61.3 20.4L68.6 20.4L61.3 26.4ZM76.1 7.9L76.1 13.9L68.8 13.9L76.1 7.9ZM68.8 13.9L68.8 7.9L76.1 7.9L68.8 13.9ZM76.1 20.4L76.1 26.4L68.8 26.4L76.1 20.4ZM68.8 26.4L68.8 20.4L76.1 20.4L68.8 26.4ZM76.1 32.6L76.1 26.6L68.8 26.6L76.1 32.6ZM76.3 7.9L76.3 13.9L83.6 13.9L76.3 7.9ZM83.6 14.1L83.6 20.2L76.3 20.2L83.6 14.1ZM76.3 20.2L76.3 14.1L83.6 14.1L76.3 20.2ZM76.3 26.4L76.3 20.4L83.6 20.4L76.3 26.4ZM76.3 26.6L76.3 32.6L83.6 32.6L76.3 26.6ZM12.5 13.9L12.5 7.9L19.9 7.9L12.5 13.9ZM19.9 7.9L19.9 13.9L12.5 13.9L19.9 7.9ZM19.9 14.1L19.9 20.2L12.5 20.2L19.9 14.1ZM19.9 20.4L19.9 26.4L12.5 26.4L19.9 20.4ZM12.5 26.4L12.5 20.4L19.9 20.4L12.5 26.4ZM19.9 26.6L19.9 32.6L12.5 32.6L19.9 26.6ZM12.5 32.6L12.5 26.6L19.9 26.6L12.5 32.6Z"/>\u003c/g>\u003crect x="78.2" y="0" width="0.8" height="24.7" fill="#383A33"/>\u003ctext x="84" y="24.7" font-family="Outfit,sans-serif" font-weight="400" font-size="35.3" letter-spacing="-0.6" fill="#F5F4EE">Atlas\u003c/text>\u003cpath fill="#94BE39" d="M162 27H168V20.4Z"/>\u003c/svg>';
  var D = document, POS = null;
  function pega(){
    var t = D.querySelector('#ipe-mapa .ipe-tools');
    if (!t) return;
    var h = t.querySelector(':scope > .tp-pega');
    if (!h) {
      h = D.createElement('div'); h.className = 'tp-pega'; h.title = 'Arrastar'; h.setAttribute('aria-label', 'Arrastar ferramentas');
      h.appendChild(D.createElement('span'));
      h.addEventListener('pointerdown', comeca);
      h.addEventListener('dblclick', function(){ POS = null; repor(t); });
    }
    if (t.firstElementChild !== h) t.insertBefore(h, t.firstChild);
    if (POS) aplica(t);
  }
  function repor(t){ ['left','top','right','bottom'].forEach(function(k){ t.style.removeProperty(k); }); t.classList.remove('tp-solto'); }
  function aplica(t){
    t.style.setProperty('left', POS.x + 'px', 'important');
    t.style.setProperty('top', POS.y + 'px', 'important');
    t.style.setProperty('right', 'auto', 'important');
    t.style.setProperty('bottom', 'auto', 'important');
    t.classList.add('tp-solto');
  }
  function comeca(e){
    var t = D.querySelector('#ipe-mapa .ipe-tools'), m = D.getElementById('ipe-mapa');
    if (!t) return;
    if (!m) return;
    e.preventDefault();
    var rt = t.getBoundingClientRect();
    var k = t.offsetWidth ? rt.width / t.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, l0 = t.offsetLeft, t0 = t.offsetTop;
    var W0 = m.clientWidth - t.offsetWidth - 4, H0 = m.clientHeight - t.offsetHeight - 4;
    var h = e.currentTarget;
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
    D.documentElement.classList.add('tp-arrasta');
    t.style.setProperty('transition', 'none', 'important');
    POS = { x: l0, y: t0 }; aplica(t);
    function mexe(ev){
      var x = l0 + (ev.clientX - x0) / k, y = t0 + (ev.clientY - y0) / k;
      x = Math.max(4, Math.min(x, W0));
      y = Math.max(48, Math.min(y, H0));
      POS = { x: Math.round(x), y: Math.round(y) }; aplica(t);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
      t.style.removeProperty('transition');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function go(){
    var top = D.querySelector('#ipe header.ipe-top');
    if (!top) return;
    var m = top.querySelector(':scope > .ipe-marca');
    if (m) { if (!m.querySelector('.tp-logo')) m.insertAdjacentHTML('beforeend', LOGO); }
    pega();
    var pq = D.getElementById('ipr-be-pq');
    if (!pq) return;
    var sep = top.querySelector(':scope > .ipe-vsep');
    var ref = sep ? sep.nextSibling : null;
    if (pq.parentNode !== top) top.insertBefore(pq, ref);
    else if (sep) { if (pq.previousElementSibling !== sep) top.insertBefore(pq, ref); }
    var b = D.querySelector('#ipe [data-sb="busca"]');
    if (b) { if (b.parentNode !== pq) pq.appendChild(b); }
  }
  var n = 0;
  (function ciclo(){ try { go(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 250); })();
})();

(function(){
  var RE = /^([\s\S]*?\S)\s*\(([^()]{2,80})\)\s*$/;
  function parte(el){
    if (el.querySelector('.tp-sec')) return;
    for (var i = 0; i < el.childNodes.length; i++) {
      var t = el.childNodes[i];
      if (t.nodeType !== 3) continue;
      var m = RE.exec(t.nodeValue);
      if (!m) continue;
      var s = document.createElement('span'); s.className = 'tp-sec'; s.textContent = m[2];
      t.nodeValue = m[1];
      el.insertBefore(s, t.nextSibling);
      return;
    }
  }
  function corre(){
    document.querySelectorAll('#ipe-esq .ipr-it .ipr-nome, #tao label, #tao label > span, #ipr-t62 .ipr-t62-c label').forEach(parte);
  }
  var n = 0;
  (function ciclo(){ try { corre(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1200 : 300); })();
})();

(function(){
  var W = window, D = document, SEL = '.ipr-ii-b, .c2-i, .mi-b, .tp-li';
  var pin = null, hov = null, tf = 0, passa = false;
  function botao(t){ return (t ? (t.closest ? t.closest(SEL) : null) : null); }
  function caixas(){ return ['ipr-ii', 'mi-ii', 'c2-pop', 'tp-lpop'].map(function(i){ return D.getElementById(i); }).filter(Boolean); }
  function aberta(c){ return c.id === 'c2-pop' ? c.classList.contains('ab') : !c.hidden; }
  function fecharTudo(){
    caixas().forEach(function(c){
      if (!aberta(c)) return;
      var x = c.querySelector('.x, .c2-x');
      passa = true;
      try { if (x) x.click(); else c.hidden = true; } catch (e) {}
      passa = false;
    });
  }
  function abrir(b){ fecharTudo(); if (b.classList.contains('tp-li')) { if (W.__tpLeg) W.__tpLeg(b); if (W.__tpAlinha) W.__tpAlinha(b); return; } passa = true; try { b.click(); } catch (e) {} passa = false; if (W.__tpAlinha) W.__tpAlinha(b); }
  function marca(){
    D.querySelectorAll('.tp-pin, .tp-hov').forEach(function(b){ if (b !== pin) b.classList.remove('tp-pin'); if (b !== hov) b.classList.remove('tp-hov'); });
    if (pin) pin.classList.add('tp-pin');
    if (hov) hov.classList.add('tp-hov');
  }
  W.addEventListener('click', function(e){
    if (passa) return;
    var b = botao(e.target);
    if (b) {
      e.preventDefault(); e.stopImmediatePropagation();
      clearTimeout(tf);
      if (pin === b) { pin = null; hov = null; fecharTudo(); }
      else { pin = b; hov = null; abrir(b); }
      marca(); return;
    }
    var x = e.target.closest ? e.target.closest('#ipr-ii .x, #mi-ii .x, #c2-pop .c2-x, #tp-lpop .x') : null;
    if (x) { pin = null; hov = null; marca(); }
  }, true);
  W.addEventListener('keydown', function(e){ if (e.key === 'Escape') { pin = null; hov = null; marca(); } }, true);
  function naCaixa(t){ return t ? (t.closest ? t.closest('#ipr-ii, #mi-ii, #c2-pop, #tp-lpop') : null) : null; }
  W.addEventListener('pointerover', function(e){
    if (e.pointerType === 'touch') return;
    var b = botao(e.target);
    if (b) {
      clearTimeout(tf);
      if (pin) return;
      if (hov !== b) { hov = b; marca(); }
      return;
    }
    if (naCaixa(e.target)) clearTimeout(tf);
  }, true);
  W.addEventListener('pointerout', function(e){
    if (pin) return;
    if (!hov) return;
    var de = botao(e.target) || naCaixa(e.target);
    if (!de) return;
    var para = e.relatedTarget;
    if (para) { if (botao(para) === hov) return; if (naCaixa(para)) return; }
    clearTimeout(tf);
    tf = setTimeout(function(){ hov = null; marca(); }, 60);
  }, true);
})();

(function(){
  var IC = {limites: '\u003cpath d="M4 4h16v16H4z" stroke-dasharray="3 2.5"/>\u003ccircle cx="12" cy="12" r="1.6"/>', sat: '\u003cpath d="M5 7l3-3 4 4-3 3z"/>\u003cpath d="M15 17l3-3 4 4-3 3z"/>\u003cpath d="M10 12l2-2 4 4-2 2z"/>\u003cpath d="M4 15a5 5 0 0 0 5 5"/>', relevo: '\u003cpath d="M2 19l6-9 4 5 3-4 7 8z"/>', clima: '\u003cpath d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 17.6 9 3.5 3.5 0 0 1 17 16H7z"/>\u003cpath d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/>', veg: '\u003cpath d="M12 3l6 8h-3.5l4.5 6H5l4.5-6H6z"/>\u003cpath d="M12 17v4"/>', pop: '\u003ccircle cx="9" cy="8" r="3"/>\u003cpath d="M3 20a6 6 0 0 1 12 0"/>\u003ccircle cx="17" cy="9" r="2.4"/>\u003cpath d="M16.5 14a4.5 4.5 0 0 1 4.5 5"/>', risco: '\u003cpath d="M12 3l10 18H2z"/>\u003cpath d="M12 10v5M12 18v.5"/>', europa: '\u003ccircle cx="12" cy="12" r="9"/>\u003cpath d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', ocup: '\u003cpath d="M3 3h18v18H3z"/>\u003cpath d="M3 10h18M10 3v18M10 15h11"/>', agua: '\u003cpath d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>', solo: '\u003cpath d="M3 7c3-2 6 2 9 0s6-2 9 0"/>\u003cpath d="M3 12h18M3 17h18"/>\u003cpath d="M7 14.5v.5M14 14.5v.5M10 19.5v.5M17 19.5v.5"/>'};
  var RG = [['limites', /^limit/i], ['sat', /^sat/i], ['relevo', /^relev/i], ['clima', /^clima/i], ['veg', /^veget/i], ['pop', /^popul/i], ['risco', /^risc/i], ['europa', /^europ/i], ['ocup', /^ocupa/i], ['agua', /^.gua/i], ['solo', /^solo/i]];
  function poe(){
    document.querySelectorAll('#tao h5').forEach(function(h){
      if (h.querySelector('.tp-ic')) return;
      var t = (h.textContent || '').trim(), k = '';
      RG.forEach(function(r){ if (!k) { if (r[1].test(t)) k = r[0]; } });
      if (!k) return;
      h.insertAdjacentHTML('afterbegin', '\u003csvg class="tp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '\u003c/svg>');
    });
  }
  var n = 0;
  (function ciclo(){ try { poe(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var W = window, D = document, POSL = null, LIM = 26;
  var HIP = [['#FF0000','1100 m'],['#FF5500','600'],['#FFAA00','400'],['#FFFF00','200'],['#B0E000','100'],['#6FC400','50'],['#38A800','']];
  function el(t, c, tx){ var e = D.createElement(t); if (c) e.className = c; if (tx) e.textContent = tx; return e; }
  function pop(){
    var p = D.getElementById('tp-lpop');
    if (p) return p;
    p = el('div'); p.id = 'tp-lpop'; p.hidden = true; p.setAttribute('role', 'dialog');
    var x = el('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar');
    x.addEventListener('click', function(){ p.hidden = true; });
    p.appendChild(x); p.appendChild(el('b')); p.appendChild(el('span')); p.appendChild(el('div', 'im'));
    D.body.appendChild(p);
    return p;
  }
  W.__tpLeg = function(b){
    var p = pop();
    p.querySelector('b').textContent = b.getAttribute('data-t') || '';
    p.querySelector('span').textContent = b.getAttribute('data-x') || '';
    var im = p.querySelector('.im'); im.textContent = '';
    var src = b.getAttribute('data-img');
    if (src) { var i = el('img'); i.alt = ''; i.src = src; im.appendChild(i); }
    p.hidden = false;
    var r = b.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    var x = r.right + 12; if (x + w > W.innerWidth - 8) x = Math.max(8, r.left - w - 12);
    var y = Math.max(8, Math.min(r.top - 10, W.innerHeight - h - 8));
    p.style.left = Math.round(x) + 'px'; p.style.top = Math.round(y) + 'px';
  };
  function botaoI(alvo, t, x, img){
    var b = alvo.querySelector(':scope > .tp-li');
    if (!b) { b = el('button', 'tp-li', 'i'); b.type = 'button'; b.setAttribute('aria-label', 'Mais informa\u00e7\u00e3o'); alvo.appendChild(b); }
    b.setAttribute('data-t', t || ''); b.setAttribute('data-x', x || '');
    if (img) b.setAttribute('data-img', img); else b.removeAttribute('data-img');
    return b;
  }
  function barra(blk, img){
    if (blk.querySelector('.tp-vb')) return;
    var vb = el('div', 'tp-vb'), br = el('div', 'br'), lb = el('div', 'lb');
    HIP.forEach(function(c, i){
      var s = el('i'); s.style.background = c[0]; br.appendChild(s);
      if (c[1]) { var t = el('span', null, c[1]); t.style.top = ((i + 1) * 14 - 6) + 'px'; lb.appendChild(t); }
    });
    var u = el('em', null, 'm'); lb.appendChild(u);
    vb.appendChild(br); vb.appendChild(lb);
    img.parentNode.insertBefore(vb, img);
    blk.classList.add('tp-hip');
  }
  function linhas(box){
    var c = box.querySelector('.c'); if (!c) return;
    c.querySelectorAll('.ipr-76').forEach(function(blk){
      var nome = blk.querySelector(':scope > b'), nm = '';
      if (nome) { nome.childNodes.forEach(function(n){ if (n.nodeType === 3) nm += n.nodeValue; }); nm = nm.trim(); }
      blk.querySelectorAll(':scope > img.w').forEach(function(img){
        if (/hipsometria/i.test(img.src)) { barra(blk, img); return; }
        if (!img.getAttribute('data-tp')) {
          img.setAttribute('data-tp', '1');
          if (img.src.indexOf('?') > 0) { if (!/TRANSPARENT=/i.test(img.src)) img.src = img.src + '\u0026TRANSPARENT=TRUE'; }
        }
        blk.classList.add('tp-wi');
        var tl = blk.querySelector(':scope > .tp-li');
        if (blk.querySelector('.ipr-ii-b')) { if (tl) tl.remove(); } else botaoI(blk, nm, 'Legenda do servi\u00e7o:', img.src);
      });
      blk.querySelectorAll('.r > span, .sh').forEach(function(s){
        var tx = (s.getAttribute('data-tpx') || s.textContent || '').trim();
        if (!(tx.length > LIM)) return;
        if (!s.getAttribute('data-tpx')) s.setAttribute('data-tpx', tx);
        var cur = tx.slice(0, LIM).replace(/\s+\S*$/, '') + '\u2026';
        if (s.firstChild) { if (s.firstChild.nodeType === 3) s.firstChild.nodeValue = cur; }
        botaoI(s.parentNode.classList.contains('r') ? s.parentNode : s, nm, tx);
      });
    });
    [].forEach.call([], function(o){
      var nc = o.querySelector('.n5-nc'), sp = o.querySelector(':scope > span:not(.n5-nc):not(.n5-rp)');
      if (!sp) return;
      var tx = (sp.getAttribute('data-tpx') || sp.firstChild ? (sp.getAttribute('data-tpx') || sp.firstChild.nodeValue || '') : '').trim();
      var extra = nc ? (nc.textContent || '').trim() : '';
      if (tx.length > LIM) {
        if (!sp.getAttribute('data-tpx')) sp.setAttribute('data-tpx', tx);
        if (sp.firstChild.nodeType === 3) sp.firstChild.nodeValue = tx.slice(0, LIM).replace(/\s+\S*$/, '') + '\u2026';
        if (!o.querySelector('.ipr-ii-b')) botaoI(o, tx, extra);
      }
    });
  }
  function aplica(box){
    box.style.setProperty('left', POSL.x + 'px', 'important');
    box.style.setProperty('top', POSL.y + 'px', 'important');
    box.style.setProperty('right', 'auto', 'important');
    box.style.setProperty('bottom', 'auto', 'important');
  }
  W.__tpPosL = function(x, y){ var b = D.getElementById('ipr-lgd'); POSL = { x: x, y: y }; if (b) aplica(b); };
  function arrasta(e){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var pai = box.offsetParent; if (!pai) return;
    e.preventDefault(); e.stopPropagation();
    var rb = box.getBoundingClientRect(), k = box.offsetWidth ? rb.width / box.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, l0 = box.offsetLeft, t0 = box.offsetTop;
    var W0 = pai.clientWidth - box.offsetWidth - 4, H0 = pai.clientHeight - box.offsetHeight - 4;
    POSL = { x: l0, y: t0 }; aplica(box);
    D.documentElement.classList.add('tp-arrasta');
    function mexe(ev){
      POSL = { x: Math.round(Math.max(4, Math.min(l0 + (ev.clientX - x0) / k, W0))), y: Math.round(Math.max(4, Math.min(t0 + (ev.clientY - y0) / k, H0))) };
      aplica(box);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    if (!box.querySelector(':scope > .tp-lpega')) {
      var pg = el('div', 'tp-lpega'); pg.title = 'Arrastar'; pg.appendChild(el('span'));
      pg.addEventListener('pointerdown', arrasta);
      box.insertBefore(pg, box.firstChild);
    }
    var mb = box.querySelector(':scope > .tp-lmin');
    if (!mb) {
      mb = el('button', 'tp-lmin'); mb.type = 'button';
      mb.addEventListener('click', function(ev){ ev.stopPropagation(); var h = box.querySelector(':scope > .h'); if (h) h.click(); });
      box.appendChild(mb);
    }
    var mn = box.classList.contains('min'), q = mn ? '+' : '\u2013';
    if (mb.textContent !== q) { mb.textContent = q; mb.title = mn ? 'Abrir a legenda' : 'Minimizar'; mb.setAttribute('aria-label', mb.title); }
    if (POSL) aplica(box);
    linhas(box);
  }
  var obs = null;
  (function liga(){
    var box = D.getElementById('ipr-lgd');
    if (!box) { setTimeout(liga, 600); return; }
    try { deco(); } catch (e) {}
    if (W.MutationObserver) {
      obs = new MutationObserver(function(){ obs.disconnect(); try { deco(); } catch (e) {} obs.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] }); });
      obs.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] });
    }
    setInterval(function(){ try { deco(); } catch (e) {} }, 1500);
  })();
})();

(function(){
  var D = document, aberto = false;
  function prox(){
    var bar = D.getElementById('tb-bar'), org = D.getElementById('ipr-be-cq-b');
    if (!bar) return;
    if (!org) return;
    var b = D.getElementById('tp-cq');
    if (!b) {
      b = D.createElement('button'); b.type = 'button'; b.id = 'tp-cq'; b.className = 'tp-cq';
      b.title = 'Camadas ligadas'; b.setAttribute('aria-label', 'Camadas ligadas');
      b.innerHTML = '\u003csvg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="m12 3 9 5-9 5-9-5z"/>\u003cpath d="m3 13 9 5 9-5"/>\u003c/svg>\u003cem>\u003c/em>';
      b.addEventListener('click', function(ev){
        ev.stopPropagation();
        var o = D.getElementById('ipr-be-cq-b'); if (!o) return;
        if (aberto) { aberto = false; return; }
        o.click();
        var p = D.getElementById('ipr-be-cqp');
        if (p) { if (!p.hidden) { var r = b.getBoundingClientRect(); p.style.left = Math.round(Math.max(8, r.left)) + 'px'; p.style.top = Math.round(r.bottom + 6) + 'px'; } }
      });
    }
    if (bar.firstElementChild !== b) bar.insertBefore(b, bar.firstChild);
    var n = org.querySelector('.ipr-be-n'), em = b.querySelector('em'), v = n ? n.textContent : '';
    if (em.textContent !== v) em.textContent = v;
    b.hidden = org.hidden;
  }
  window.addEventListener('pointerdown', function(e){ var t = e.target; if (!t.closest) return; if (!t.closest('#tp-cq')) return; var p = D.getElementById('ipr-be-cqp'); aberto = p ? !p.hidden : false; }, true);
  var k = 0;
  (function ciclo(){ try { prox(); } catch (e) {} k++; setTimeout(ciclo, k > 60 ? 1000 : 300); })();
})();

(function(){
  var D = document, OPV = 100, ABRE = false;
  function marca(n){ if (n) { if (n.id === 'ipr-lgd') n.__iprJanb = 1; } }
  try {
    marca(D.getElementById('ipr-lgd'));
    var mo0 = new MutationObserver(function(ms){ ms.forEach(function(m){ [].forEach.call(m.addedNodes, function(n){ if (n.nodeType === 1) { marca(n); if (n.querySelector) marca(n.querySelector('#ipr-lgd')); } }); }); if (D.getElementById('ipr-lgd')) mo0.disconnect(); });
    mo0.observe(D.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  function esconderJanb(box){
    var r = box.getBoundingClientRect();
    D.querySelectorAll('.ipr-janb').forEach(function(b){
      if (b.classList.contains('tp-janb-off')) return;
      var bl = parseFloat(b.style.left), bt = parseFloat(b.style.top), bw = b.offsetWidth || 96, bh = b.offsetHeight || 30;
      var xe = Math.max(4, Math.min(innerWidth - bw - 4, r.right - bw - 44)), ye = r.top - bh - 2; if (!(ye > 2)) ye = r.top + 4;
      if (Math.abs(bl - xe) > 3) return;
      if (Math.abs(bt - ye) > 3) return;
      b.classList.add('tp-janb-off');
    });
  }
  function aplica(box){ box.style.setProperty('opacity', String(OPV / 100), 'important'); }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    if (!box.__iprJanb) box.__iprJanb = 1;
    esconderJanb(box);
    var h = box.querySelector(':scope > .h');
    var fb = box.querySelector(':scope > .tp-lfade');
    if (!fb) {
      fb = D.createElement('button'); fb.type = 'button'; fb.className = 'tp-lfade'; fb.title = 'Transpar\u00eancia da legenda'; fb.setAttribute('aria-label', fb.title);
      fb.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">\u003ccircle cx="12" cy="12" r="8"/>\u003cpath d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>\u003c/svg>';
      fb.addEventListener('click', function(ev){ ev.stopPropagation(); ABRE = !ABRE; deco(); });
      box.appendChild(fb);
    }
    fb.classList.toggle('on', ABRE);
    var row = box.querySelector(':scope > .tp-lop');
    if (!row) {
      row = D.createElement('div'); row.className = 'tp-lop';
      var r = D.createElement('input'); r.type = 'range'; r.min = '35'; r.max = '100'; r.step = '5'; r.className = 'tp-lr'; r.setAttribute('aria-label', 'Transpar\u00eancia da legenda');
      var s = D.createElement('span'); s.className = 'tp-lp';
      row.appendChild(r); row.appendChild(s);
      r.addEventListener('input', function(){ OPV = +r.value; pinta(row); aplica(box); });
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel'].forEach(function(k){ row.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
      if (h) { if (h.nextSibling) box.insertBefore(row, h.nextSibling); else box.appendChild(row); } else box.appendChild(row);
    } else if (h) { if (row.previousElementSibling !== h) box.insertBefore(row, h.nextSibling); }
    row.hidden = !ABRE;
    pinta(row);
    if (OPV !== 100) aplica(box);
  }
  function pinta(row){
    var r = row.querySelector('input'), s = row.querySelector('span');
    if (String(r.value) !== String(OPV)) r.value = String(OPV);
    r.style.setProperty('--v', ((OPV - 35) / 65 * 100) + '%');
    s.textContent = OPV + '%';
  }
  (function liga(){
    var box = D.getElementById('ipr-lgd');
    if (!box) { setTimeout(liga, 400); return; }
    try { deco(); } catch (e) {}
    var mo = new MutationObserver(function(){ mo.disconnect(); try { deco(); } catch (e) {} mo.observe(box, { childList: true }); });
    mo.observe(box, { childList: true });
    setInterval(function(){ try { deco(); } catch (e) {} }, 1000);
  })();
})();

(function(){
  var CR = [[/^limit/i, '#C9B27C'], [/^sat/i, '#8FB8DE'], [/^relev/i, '#C08A5B'], [/^clima/i, '#6FC6D8'], [/^veget/i, '#94BE39'], [/^popul/i, '#CFA083'], [/^risc/i, '#D9876C'], [/^europ/i, '#A99BD6'], [/^ocupa/i, '#D8C25A'], [/^.gua/i, '#4FA3D9'], [/^solo/i, '#A8805A']];
  function cores(){
    var cor = '';
    document.querySelectorAll('#tao > *').forEach(function(el){
      if (el.tagName === 'H5') {
        var t = (el.textContent || '').trim(); cor = '';
        CR.forEach(function(c){ if (!cor) { if (c[0].test(t)) cor = c[1]; } });
        if (cor) { if (el.style.getPropertyValue('--tc') !== cor) el.style.setProperty('--tc', cor); el.classList.add('tp-tc'); }
        return;
      }
      if (el.tagName !== 'LABEL') return;
      if (!cor) return;
      if (el.style.getPropertyValue('--k') !== cor) el.style.setProperty('--k', cor);
    });
  }
  var n = 0;
  (function ciclo(){ try { cores(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var niv = 0;
  function tao(){ return document.getElementById('tao'); }
  function aplicar(){
    var t = tao(); if (!t) return;
    t.classList.toggle('tp-n0', niv === 0);
    t.classList.toggle('tp-n1', niv === 1);
    if (niv === 2) t.classList.add('aberto'); else t.classList.remove('aberto');
    var ab = false, h = null;
    Array.prototype.forEach.call(t.children, function(el){
      if (el.tagName === 'H5') { ab = el.classList.contains('tp-ab'); h = el; h.__tpOn = 0; return; }
      if (el.tagName !== 'LABEL') return;
      el.classList.toggle('tp-vis', ab);
      var i = el.querySelector('input');
      if (h) { if (i) { if (i.checked) h.__tpOn = 1; } }
    });
    Array.prototype.forEach.call(t.querySelectorAll(':scope > h5'), function(x){ x.classList.toggle('tp-on', x.__tpOn === 1); });
  }
  window.addEventListener('click', function(e){
    var h = e.target.closest ? e.target.closest('#tao > h4, #tao > h5') : null;
    if (!h) return;
    if (h.tagName === 'H5') {
      if (niv !== 1) return;
      h.classList.toggle('tp-ab'); aplicar(); return;
    }
    e.stopImmediatePropagation(); e.preventDefault();
    niv = (niv + 1) % 3;
    if (niv === 0) Array.prototype.forEach.call(tao().querySelectorAll('h5.tp-ab'), function(x){ x.classList.remove('tp-ab'); });
    aplicar();
  }, true);
  window.addEventListener('change', function(e){ if (e.target.closest) { if (e.target.closest('#tao')) setTimeout(aplicar, 0); } }, true);
  var n = 0;
  (function ciclo(){ try { var t = tao(); if (t) { if (!t.__tpNiv) { t.__tpNiv = 1; aplicar(); } else aplicar(); } } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var B = [
    ['tp-crono-t', 'Cronologia: comparar o terreno em anos diferentes', '\u003csvg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/>\u003cpath d="M3.5 4.5v4h4"/>\u003cpath d="M12 7.5V12l3 2"/>\u003c/svg>', '.ipr-crono-b'],
    ['tp-net-t', 'Testar internet: verifica se chega para carregar as camadas', '\u003csvg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/>\u003ccircle cx="12" cy="19.5" r="1.2" fill="currentColor"/>\u003c/svg>', '#ipr-lig-b'],
    ['tp-pa-t', 'Pergunte ao Atlas', '\u003cspan class="tp-pa-ic">\u003csvg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">\u003cpath d="M4 5h16v11H9l-5 4z"/>\u003c/svg>\u003c/span>', '#ipr-pa-b']
  ];
  var R = {};
  function por(){
    var tema = document.getElementById('ipe-tema'); if (!tema) return;
    B.forEach(function(d){
      var b = R[d[0]];
      if (!b) {
        b = document.createElement('button'); b.type = 'button'; b.id = d[0]; b.className = 'ipe-ib tp-tb';
        b.title = d[1]; b.setAttribute('aria-label', d[1]); b.innerHTML = d[2];
        b.addEventListener('click', function(e){ e.preventDefault(); var o = document.querySelector(d[3]); if (o) o.click(); setTimeout(est, 50); });
        R[d[0]] = b;
      }
    });
    var a = R['tp-crono-t'], c = R['tp-net-t'], q = R['tp-pa-t'];
    if (tema.nextElementSibling !== a) tema.parentNode.insertBefore(a, tema.nextSibling);
    if (a.nextElementSibling !== q) tema.parentNode.insertBefore(q, a.nextSibling);
    if (c.nextElementSibling !== tema) tema.parentNode.insertBefore(c, tema);
    est();
  }
  function est(){
    B.forEach(function(d){
      var b = R[d[0]], o = document.querySelector(d[3]);
      if (!b) return;
      b.classList.toggle('tp-on', o ? o.getAttribute('aria-expanded') === 'true' : false);
    });
  }
  var n = 0;
  (function ciclo(){ try { por(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var L = null;
  function lingueta(){
    var ipe = document.getElementById('ipe'), cam = document.getElementById('ipe-camadas'), mapa = document.getElementById('ipe-mapa');
    if (!ipe) return; if (!cam) return; if (!mapa) return;
    if (!L) {
      L = document.createElement('button'); L.type = 'button'; L.id = 'tp-ling';
      L.addEventListener('click', function(e){ e.stopPropagation(); cam.click(); setTimeout(lingueta, 60); });
    }
    if (L.parentNode !== mapa) mapa.appendChild(L);
    var largo = window.innerWidth > 900, fechado = largo ? ipe.classList.contains('sem-esq') : !ipe.classList.contains('esq-aberto');
    var d = fechado ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7';
    var tt = fechado ? 'Abrir o painel das camadas' : 'Recolher o painel das camadas';
    if (L.getAttribute('data-d') !== d) {
      L.setAttribute('data-d', d); L.title = tt; L.setAttribute('aria-label', tt);
      L.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="' + d + '"/>\u003c/svg>';
    }
    L.hidden = largo ? false : !fechado;
  }
  var n = 0;
  (function ciclo(){ try { lingueta(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ try { lingueta(); } catch (e) {} });
})();

(function(){
  var IC = {fundo: '\u003cpath d="m12 3 9 5-9 5-9-5z"/>\u003cpath d="m3 13 9 5 9-5"/>', prop: '\u003cpath d="M4 4h16v16H4z" stroke-dasharray="3 2.5"/>\u003ccircle cx="12" cy="12" r="1.6"/>', cond: '\u003cpath d="M12 3l8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6z"/>', agua: '\u003cpath d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'};
  var RG = [['fundo', /^fundo/i, '#B9B4A2'], ['prop', /^propr/i, '#C9B27C'], ['cond', /^condic/i, '#D9876C'], ['agua', /^.gua/i, '#4FA3D9']];
  var SVG0 = '\u003csvg class="tp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var niv = 0;
  function g(){ return document.getElementById('tes'); }
  function aplicar(){
    var t = g(); if (!t) return;
    t.classList.toggle('tp-n0', niv === 0);
    t.classList.toggle('tp-n1', niv === 1);
    if (niv === 2) t.classList.add('aberto'); else t.classList.remove('aberto');
    var ab = false, h = null, cor = '';
    Array.prototype.forEach.call(t.children, function(el){
      if (el.tagName === 'H5') {
        h = el; h.__tpOn = 0; ab = el.classList.contains('tp-ab'); cor = '';
        var tx = (el.textContent || '').trim();
        RG.forEach(function(r){ if (!cor) { if (r[1].test(tx)) { cor = r[2]; if (!el.querySelector('.tp-ic')) el.insertAdjacentHTML('afterbegin', SVG0 + IC[r[0]] + '\u003c/svg>'); } } });
        if (cor) { if (el.style.getPropertyValue('--tc') !== cor) el.style.setProperty('--tc', cor); el.classList.add('tp-tc'); }
        return;
      }
      if (el.tagName !== 'LABEL') return;
      el.classList.toggle('tp-vis', ab);
      if (cor) { if (el.style.getPropertyValue('--k') !== cor) el.style.setProperty('--k', cor); }
      var i = el.querySelector('input');
      if (h) { if (i) { if (i.checked) h.__tpOn = 1; } }
    });
    Array.prototype.forEach.call(t.querySelectorAll(':scope > h5'), function(x){ x.classList.toggle('tp-on', x.__tpOn === 1); });
  }
  window.addEventListener('click', function(e){
    var h = e.target.closest ? e.target.closest('#tes > h4, #tes > h5') : null;
    if (!h) return;
    if (h.tagName === 'H5') { if (niv !== 1) return; h.classList.toggle('tp-ab'); aplicar(); return; }
    e.stopImmediatePropagation(); e.preventDefault();
    niv = (niv + 1) % 3;
    if (niv === 0) Array.prototype.forEach.call(g().querySelectorAll('h5.tp-ab'), function(x){ x.classList.remove('tp-ab'); });
    aplicar();
  }, true);
  window.addEventListener('change', function(e){ if (e.target.closest) { if (e.target.closest('#tes')) setTimeout(aplicar, 0); } }, true);
  var n = 0;
  (function ciclo(){ try { aplicar(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ });
})();

(function(){
  var L = null;
  function aba(){
    var ipe = document.getElementById('ipe'), pn = document.getElementById('ipe-pn'), mapa = document.getElementById('ipe-mapa');
    if (!ipe) return; if (!pn) return; if (!mapa) return;
    if (!L) {
      L = document.createElement('button'); L.type = 'button'; L.id = 'tp-lingd';
      L.addEventListener('click', function(e){ e.stopPropagation(); pn.click(); setTimeout(aba, 60); });
    }
    if (L.parentNode !== mapa) mapa.appendChild(L);
    var fechado = ipe.classList.contains('sem-dir');
    var d = fechado ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7';
    var tt = fechado ? 'Abrir o painel da direita' : 'Recolher o painel da direita';
    if (L.getAttribute('data-d') !== d) {
      L.setAttribute('data-d', d); L.title = tt; L.setAttribute('aria-label', tt);
      L.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\u003cpath d="' + d + '"/>\u003c/svg>';
    }
    L.hidden = !(window.innerWidth > 900);
  }
  var n = 0;
  (function ciclo(){ try { aba(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
  window.addEventListener('resize', function(){ try { aba(); } catch (e) {} });
})();

(function(){
  var KW = [[/topon/i, '#F5F4EE'], [/curvas/i, '#FFFFFF'], [/hipsom/i, '#94BE39'], [/picos/i, '#D8C25A'], [/relevo/i, '#C08A5B'], [/.gua/i, '#4FA3D9'], [/sat.lite/i, '#8FB8DE'], [/orto/i, '#C9B27C'], [/cadastr/i, '#F3E3B5']];
  var SEL = '';
  function lum(c){
    var m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return 1;
    return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255;
  }
  function corDe(li, nome){
    var sw = li.querySelector('.iac-sw'), c = '';
    if (sw) c = sw.style.backgroundColor || '';
    if (!c) {
      document.querySelectorAll('#tao label, #tes label').forEach(function(l){ if (!c) { if ((l.textContent || '').trim().indexOf(nome) === 0) c = l.style.getPropertyValue('--k'); } });
    }
    if (!c) KW.forEach(function(k){ if (!c) { if (k[0].test(nome)) c = k[1]; } });
    if (!c) c = '#94BE39';
    if (!(lum(c) >= 0.28)) c = '#8A8D82';
    return c;
  }
  function arruma(){
    var p = document.getElementById('ipr-be-cqp'); if (!p) return;
    p.querySelectorAll('li.ipr-cq-it').forEach(function(li){
      var nt = li.querySelector('.iac-nt'), n = li.querySelector('.ipr-cq-n');
      if (!nt) return; if (!n) return;
      var cur = (nt.textContent || '').trim();
      var full = nt.getAttribute('data-tp-base') === cur ? nt.getAttribute('data-tp-full') : cur;
      var m = full.match(/^(.*?)\s*\(([^)]*)\)/), base = m ? m[1] : full;
      nt.setAttribute('data-tp-full', full); nt.setAttribute('data-tp-base', base);
      if (!m) { var o = n.querySelector('.tp-sub'); if (o) o.remove(); }
      if (m) {
        if (nt.textContent !== base) nt.textContent = base;
        var sb = n.querySelector('.tp-sub');
        if (!sb) { sb = document.createElement('small'); sb.className = 'tp-sub'; nt.insertAdjacentElement('afterend', sb); }
        if (sb.textContent !== m[2]) sb.textContent = m[2];
      }
      var c = corDe(li, base);
      if (li.style.getPropertyValue('--lc') !== c) li.style.setProperty('--lc', c);
      if (!n.querySelector('.tp-bl')) { var b = document.createElement('span'); b.className = 'tp-bl'; n.insertBefore(b, n.firstChild); }
      var rem = li.querySelector('.iac-rem');
      li.classList.toggle('tp-fundo', rem ? rem.classList.contains('iac-off') : false);
      li.classList.toggle('tp-sel', (li.getAttribute('data-id') || base) === SEL);
    });
  }
  window.addEventListener('click', function(e){
    var n = e.target.closest ? e.target.closest('#ipr-be-cqp li.ipr-cq-it .ipr-cq-n') : null;
    if (!n) return;
    if (e.target.closest('button')) return;
    var li = n.closest('li'), id = li.getAttribute('data-id') || (li.querySelector('.iac-nt') || {}).textContent;
    SEL = SEL === id ? '' : id; arruma();
  }, true);
  var n = 0;
  (function ciclo(){ try { arruma(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 600 : 300); })();
})();

(function(){
  function conta(){
    var s = document.getElementById('ipe-locais'); if (!s) return;
    var h = s.parentElement.querySelector(':scope > .ipe-sbh'); if (!h) return;
    var u = document.getElementById('ipe-user'), nome = u ? (u.textContent || '').trim() : '';
    var txt = nome ? (nome + ' \u00b7 a sua conta') : 'sem sess\u00e3o \u00b7 entre para guardar';
    if (h.getAttribute('data-conta') !== txt) h.setAttribute('data-conta', txt);
    var av = h.querySelector('.tp-av');
    if (!av) { av = document.createElement('span'); av.className = 'tp-av'; var car = h.querySelector('.ipe-car'); if (car) car.insertAdjacentElement('afterend', av); else h.insertBefore(av, h.firstChild); }
    var ini = nome ? nome.charAt(0).toUpperCase() : '?';
    if (av.textContent !== ini) av.textContent = ini;
  }
  var n = 0;
  (function ciclo(){ try { conta(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1500 : 300); })();
})();

(function(){
  var D = document, OPV = 100, ABRE = false;
  function aplica(){ var p = D.getElementById('ipr-be-cqp'); if (p) p.style.setProperty('opacity', String(OPV / 100), 'important'); }
  function pinta(row){
    var r = row.querySelector('input'), s = row.querySelector('span');
    if (String(r.value) !== String(OPV)) r.value = String(OPV);
    r.style.setProperty('--v', ((OPV - 35) / 65 * 100) + '%');
    s.textContent = OPV + '%';
  }
  function deco(){
    var sec = D.getElementById('ipr-cq'); if (!sec) return;
    var h = sec.querySelector(':scope > .ipr-cq-h'); if (!h) return;
    var fb = sec.querySelector(':scope > .tp-cqfade');
    if (!fb) {
      fb = D.createElement('button'); fb.type = 'button'; fb.className = 'tp-cqfade'; fb.title = 'Transpar\u00eancia do painel'; fb.setAttribute('aria-label', fb.title);
      fb.innerHTML = '\u003csvg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">\u003ccircle cx="12" cy="12" r="8"/>\u003cpath d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>\u003c/svg>';
      fb.addEventListener('click', function(ev){ ev.stopPropagation(); ev.preventDefault(); ABRE = !ABRE; deco(); });
      sec.appendChild(fb);
    }
    fb.classList.toggle('on', ABRE);
    var row = sec.querySelector(':scope > .tp-cqop');
    if (!row) {
      row = D.createElement('div'); row.className = 'tp-cqop';
      var r = D.createElement('input'); r.type = 'range'; r.min = '35'; r.max = '100'; r.step = '5'; r.className = 'tp-cqr'; r.setAttribute('aria-label', 'Transpar\u00eancia do painel');
      var s = D.createElement('span'); s.className = 'tp-cqp';
      row.appendChild(r); row.appendChild(s);
      r.addEventListener('input', function(){ OPV = +r.value; pinta(row); aplica(); });
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel'].forEach(function(k){ row.addEventListener(k, function(e){ e.stopPropagation(); }, { passive: true }); });
    }
    if (row.previousElementSibling !== h) sec.insertBefore(row, h.nextSibling);
    row.hidden = !ABRE;
    pinta(row);
    if (OPV !== 100) aplica();
  }
  var n = 0;
  (function ciclo(){ try { deco(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1000 : 300); })();
})();

(function(){
  function sub(){
    document.querySelectorAll('#ipe-esq ul.ipr-lista').forEach(function(ul){
      var cab = null, cores = [];
      function fecha(){
        if (!cab) return;
        var d = cab.querySelector(':scope > .tp-dots');
        if (!d) { d = document.createElement('span'); d.className = 'tp-dots'; var sm = cab.querySelector(':scope > small'); if (sm) cab.insertBefore(d, sm); else cab.appendChild(d); }
        var h = cores.map(function(c){ return '\u003ci style="background:' + c + '">\u003c/i>'; }).join('');
        if (d.getAttribute('data-h') !== h) { d.setAttribute('data-h', h); d.innerHTML = h; }
        cab.classList.toggle('tp-on', cores.length > 0);
        if (cores.length) { if (cab.style.getPropertyValue('--sc') !== cores[0]) cab.style.setProperty('--sc', cores[0]); }
      }
      Array.prototype.forEach.call(ul.children, function(li){
        if (li.classList.contains('ipr-sub')) { fecha(); cab = li; cores = []; return; }
        if (!cab) return;
        if (!li.classList.contains('ipr-it')) return;
        var ck = li.querySelector('input.ipr-ck');
        if (ck) { if (ck.checked) cores.push(li.style.getPropertyValue('--k') || '#94BE39'); }
      });
      fecha();
    });
  }
  window.addEventListener('change', function(){ setTimeout(function(){ try { sub(); } catch (e) {} }, 0); }, true);
  var n = 0;
  (function ciclo(){ try { sub(); } catch (e) {} n++; setTimeout(ciclo, n > 60 ? 1200 : 400); })();
})();
(function(){
  var D = document, W = window, TAM = null, SIG = '';
  try { localStorage.removeItem('atl_lgd_tam'); } catch (e) {}
  function poe(box){
    if (!TAM) return;
    if (TAM.w) { box.style.setProperty('width', TAM.w + 'px', 'important'); box.style.setProperty('max-width', 'none', 'important'); box.style.setProperty('min-width', '160px', 'important'); }
    if (box.classList.contains('min')) { box.style.removeProperty('height'); box.style.removeProperty('max-height'); return; }
    if (TAM.h) { box.style.setProperty('height', TAM.h + 'px', 'important'); box.style.setProperty('max-height', 'none', 'important'); }
  }
  function puxa(e, lado){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var pai = box.offsetParent; if (!pai) return;
    e.preventDefault(); e.stopPropagation();
    var rb = box.getBoundingClientRect(), k = box.offsetWidth ? rb.width / box.offsetWidth : 1;
    if (!k) k = 1;
    var x0 = e.clientX, y0 = e.clientY, w0 = box.offsetWidth, h0 = box.offsetHeight, l0 = box.offsetLeft, t0 = box.offsetTop;
    var maxW = pai.clientWidth - 8, maxH = pai.clientHeight - t0 - 6;
    if (W.__tpPosL) W.__tpPosL(l0, t0);
    TAM = { w: w0, h: TAM ? TAM.h : 0 };
    if (lado.indexOf('s') >= 0) TAM.h = h0;
    D.documentElement.classList.add('tp-arrasta');
    function mexe(ev){
      var dx = (ev.clientX - x0) / k, dy = (ev.clientY - y0) / k;
      if (lado.indexOf('e') >= 0) TAM.w = Math.round(Math.max(160, Math.min(w0 + dx, maxW - l0)));
      if (lado.indexOf('w') >= 0) {
        var nw = Math.round(Math.max(160, Math.min(w0 - dx, l0 + w0 - 4)));
        TAM.w = nw; if (W.__tpPosL) W.__tpPosL(l0 + w0 - nw, t0);
      }
      if (lado.indexOf('s') >= 0) TAM.h = Math.round(Math.max(90, Math.min(h0 + dy, maxH)));
      poe(box);
    }
    function fim(){
      D.removeEventListener('pointermove', mexe, true); D.removeEventListener('pointerup', fim, true); D.removeEventListener('pointercancel', fim, true);
      D.documentElement.classList.remove('tp-arrasta');
    }
    D.addEventListener('pointermove', mexe, true); D.addEventListener('pointerup', fim, true); D.addEventListener('pointercancel', fim, true);
  }
  function deco(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    ['e', 'w', 's', 'se'].forEach(function(l){
      if (box.querySelector(':scope > .tp-rz-' + l)) return;
      var h = D.createElement('div'); h.className = 'tp-rz tp-rz-' + l; h.title = 'Arrastar para mudar o tamanho';
      h.addEventListener('pointerdown', function(ev){ puxa(ev, l); });
      h.addEventListener('dblclick', function(ev){ ev.stopPropagation(); TAM = null; try { localStorage.removeItem('atl_lgd_tam'); } catch (e) {} ['width', 'max-width', 'min-width', 'height', 'max-height'].forEach(function(q){ box.style.removeProperty(q); }); });
      box.appendChild(h);
    });
    var hi = box.querySelector(':scope > .h i'), sg = (hi ? hi.textContent : '') + ':' + box.querySelectorAll('.c > .one, .c > .l').length;
    if (sg !== SIG) { SIG = sg; if (TAM) { TAM = null; ['width', 'max-width', 'min-width', 'height', 'max-height'].forEach(function(q){ box.style.removeProperty(q); }); } }
    box.classList.toggle('tp-rzon', !!TAM);
    poe(box);
  }
  (function liga(){
    if (!D.getElementById('ipr-lgd')) { setTimeout(liga, 700); return; }
    try { deco(); } catch (e) {}
    var ob = null, bx = null;
    setInterval(function(){
      try { deco(); } catch (e) {}
      var b = D.getElementById('ipr-lgd');
      if (b !== bx) { if (ob) ob.disconnect(); bx = b; if (b) { if (W.MutationObserver) { ob = new MutationObserver(function(){ if (!bx.querySelector(':scope > .tp-rz-e')) { try { deco(); } catch (e) {} } }); ob.observe(b, { childList: true }); } } }
    }, 1200);
  })();
})();
(function(){
  var RX = /^Entre\s+(\S+)\s+e\s+(\S+)$/;
  function curto(){
    document.querySelectorAll('#ipr-lgd .ipr-ii-auto .ii-r > span').forEach(function(s){
      if (s.getAttribute('data-tp-c')) return;
      var m = RX.exec((s.textContent || '').trim());
      s.setAttribute('data-tp-c', '1');
      if (!m) return;
      s.title = s.textContent; s.textContent = m[1] + ' \u2013 ' + m[2];
    });
  }
  setInterval(function(){ try { curto(); } catch (e) {} }, 900);
})();
(function(){
  var D = document;
  var NUM = /^[\u003c>]?\s*-?\d/;
  var ORD = /muito|alt[oa]|m\u00e9di|baix|elevad|reduzid|moderad/i;
  function nums(t){ return t.match(/-?\d+(?:[.,]\d+)?/g) || []; }
  function cor(r){ var s = r.querySelector('s'); if (!s) return ''; var c = s.style.backgroundColor || ''; return c; }
  function txt(r){ var s = r.querySelector('span'); if (!s) return ''; return (s.getAttribute('title') || s.textContent || '').trim(); }
  function curto(r){ var s = r.querySelector('span'); return s ? (s.textContent || '').trim() : ''; }
  function el(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function titulo(a){ var e = a.previousElementSibling; while (e) { if (e.classList.contains('one')) return e; if (e.classList.contains('l')) return e; if (e.classList.contains('ipr-ii-auto')) return null; e = e.previousElementSibling; } return null; }
  function faz(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    var ant = '';
    box.querySelectorAll('.c > .ipr-ii-auto').forEach(function(a){
      if (getComputedStyle(a).display === 'none') { if (!a.classList.contains('tp-b1')) return; }
      var rs = [].slice.call(a.querySelectorAll(':scope > .ii-r'));
      if (!rs.length) return;
      var sig = rs.map(function(r){ return cor(r) + '=' + curto(r); }).join('|');
      if (a.getAttribute('data-tp-b') === sig) { ant = (rs.length > 1) ? sig : ''; return; }
      a.setAttribute('data-tp-b', sig);
      var v = a.querySelector(':scope > .tp-b'); if (v) v.remove();
      a.classList.remove('tp-b1', 'tp-bm');
      a.classList.add('tp-bx');
      a.title = rs.map(txt).join('\n');
      var uc = {}; rs.forEach(function(r){ uc[cor(r)] = 1; });
      if (rs.length === 1 || Object.keys(uc).length === 1) {
        a.classList.add('tp-b1');
        var t = titulo(a), c = cor(rs[0]);
        if (t) { var sw = t.querySelector(':scope > s'); if (sw) { if (c) sw.style.background = c; } }
        ant = ''; return;
      }
      var b = el('div', 'tp-b');
      if (sig === ant) { a.classList.add('tp-bm'); b.appendChild(el('em', 'tp-me', 'mesma escala de cima')); a.appendChild(b); return; }
      ant = sig;
      var labs = rs.map(curto), cs = rs.map(cor);
      var tudoNum = labs.every(function(l){ return NUM.test(l); });
      var dif = {}; labs.forEach(function(l){ dif[l] = 1; });
      var tudoOrd = labs.every(function(l){ return ORD.test(l); });
      if (Object.keys(dif).length !== labs.length) tudoOrd = false;
      if (labs.length === 2) tudoOrd = false;
      labs = labs.map(function(l){ var k = l.indexOf(', '); var r = k > 0 ? l.slice(0, k) : l; return r.replace(/^Entre\s+(\S+)\s+e\s+(\S+)$/, '$1 \u2013 $2'); });
      if (tudoNum) {
        var g = el('div', 'tp-bg'); g.style.background = 'linear-gradient(90deg,' + cs.join(',') + ')'; b.appendChild(g);
        var n0 = nums(labs[0]), n1 = nums(labs[labs.length - 1]);
        var e0 = n0.length ? n0[0] : labs[0], e1 = n1.length ? n1[n1.length - 1] : labs[labs.length - 1];
        if (/^\s*>/.test(labs[labs.length - 1])) e1 = e1 + '+';
        var gl = el('div', 'tp-gl'); gl.appendChild(el('span', '', e0)); gl.appendChild(el('span', '', e1)); b.appendChild(gl);
      } else if (tudoOrd) {
        var sg = el('div', 'tp-seg'); cs.forEach(function(c){ var i = el('i'); i.style.background = c; sg.appendChild(i); }); b.appendChild(sg);
        var gl2 = el('div', 'tp-gl'); gl2.appendChild(el('span', '', labs[0])); gl2.appendChild(el('span', '', labs[labs.length - 1])); b.appendChild(gl2);
      } else {
        var ch = el('div', 'tp-ch');
        var vis = {};
        rs.forEach(function(r, k){ var l = labs[k]; if (vis[l + cs[k]]) return; vis[l + cs[k]] = 1; var s = el('span'); var q = el('s'); q.style.background = cs[k] || 'transparent'; s.appendChild(q); s.appendChild(D.createTextNode(l)); ch.appendChild(s); });
        b.appendChild(ch);
      }
      a.appendChild(b);
    });
  }
  setInterval(function(){ try { faz(); } catch (e) {} }, 1000);
})();
(function(){
  var D = document;
  var NUM = /^[\u003c>]?\s*-?\d/;
  var ORD = /muito|alt[oa]|m\u00e9di|baix|elevad|reduzid|moderad/i;
  function nums(t){ return t.match(/-?\d+(?:[.,]\d+)?/g) || []; }
  function el(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function corImg(im){
    if (!im) return '';
    if (!im.complete) return null;
    if (!im.naturalWidth) return '';
    try {
      var cv = D.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      var x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      var d = x.getImageData(Math.floor(cv.width / 2), Math.floor(cv.height / 2), 1, 1).data;
      if (!(d[3] >= 20)) return '';
      return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    } catch (e) { return ''; }
  }
  function curta(l){ var k = l.indexOf(', '); var r = k > 0 ? l.slice(0, k) : l; return r.replace(/^Entre\s+(\S+)\s+e\s+(\S+)$/, '$1 \u2013 $2'); }
  function faz(){
    var box = D.getElementById('ipr-lgd'); if (!box) return;
    box.querySelectorAll('.c > .l.ag-l').forEach(function(L){
      var rs = [].slice.call(L.querySelectorAll(':scope > .ag-r'));
      if (!rs.length) return;
      var labs = rs.map(function(r){ var s = r.querySelector('span'); return s ? (s.textContent || '').trim() : ''; });
      var sig = labs.join('|');
      if (L.getAttribute('data-tp-b') === sig) return;
      var cs = [], falta = false;
      rs.forEach(function(r){ var c = corImg(r.querySelector('img')); if (c === null) falta = true; cs.push(c || ''); });
      if (falta) return;
      L.setAttribute('data-tp-b', sig);
      var v = L.querySelector(':scope > .tp-b'); if (v) v.remove();
      L.classList.add('tp-agx');
      L.title = labs.join('\n');
      var b = el('div', 'tp-b');
      var dif = {}; labs.forEach(function(l){ dif[l] = 1; });
      var semCor = cs.some(function(c){ return !c; });
      var tudoNum = labs.every(function(l){ return NUM.test(l); });
      var tudoOrd = labs.every(function(l){ return ORD.test(l); });
      if (Object.keys(dif).length !== labs.length) { tudoOrd = false; tudoNum = false; }
      if (!(labs.length >= 3)) { tudoOrd = false; tudoNum = false; }
      if (semCor) { tudoOrd = false; tudoNum = false; }
      var cl = labs.map(curta);
      var uc2 = {}; cs.forEach(function(c){ uc2[c] = 1; });
      if (Object.keys(uc2).length === 1) { if (!semCor) { rs = rs.slice(0, 1); cl = cl.slice(0, 1); } }
      if (tudoNum) {
        var g = el('div', 'tp-bg'); g.style.background = 'linear-gradient(90deg,' + cs.join(',') + ')'; b.appendChild(g);
        var n0 = nums(cl[0]), n1 = nums(cl[cl.length - 1]);
        var gl = el('div', 'tp-gl'); gl.appendChild(el('span', '', n0.length ? n0[0] : cl[0])); gl.appendChild(el('span', '', (n1.length ? n1[n1.length - 1] : cl[cl.length - 1]) + (/^\s*>/.test(cl[cl.length - 1]) ? '+' : ''))); b.appendChild(gl);
      } else if (tudoOrd) {
        var sg = el('div', 'tp-seg'); cs.forEach(function(c){ var i = el('i'); i.style.background = c; sg.appendChild(i); }); b.appendChild(sg);
        var gl2 = el('div', 'tp-gl'); gl2.appendChild(el('span', '', cl[0])); gl2.appendChild(el('span', '', cl[cl.length - 1])); b.appendChild(gl2);
      } else {
        var ch = el('div', 'tp-ch'), vis = {};
        rs.forEach(function(r, k){ var l = cl[k]; if (vis[l]) return; vis[l] = 1; var s = el('span'); var im = r.querySelector('img'); if (im) { var q = im.cloneNode(); q.className = 'tp-im'; s.appendChild(q); } s.appendChild(D.createTextNode(l)); ch.appendChild(s); });
        b.appendChild(ch);
      }
      var bb = L.querySelector(':scope > b');
      if (bb) bb.insertAdjacentElement('afterend', b); else L.insertBefore(b, L.firstChild);
    });
  }
  setInterval(function(){ try { faz(); } catch (e) {} }, 1000);
})();
(function(){
  var D = document;
  function liga(i){
    var w = i.parentElement;
    if (!w.classList.contains('tp-bw')) {
      var cs = getComputedStyle(i);
      w = D.createElement('span'); w.className = 'tp-bw';
      w.style.flex = cs.flex; w.style.order = cs.order; w.style.margin = cs.margin;
      i.parentNode.insertBefore(w, i); w.appendChild(i);
    }
    if (w.querySelector(':scope > .tp-bx')) { w.classList.toggle('tp-cv', !!i.value); return; }
    var x = D.createElement('button'); x.type = 'button'; x.className = 'tp-bx';
    x.title = 'Apagar o que foi escrito'; x.setAttribute('aria-label', x.title); x.textContent = '\u00d7';
    x.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      i.value = '';
      ['input', 'search', 'change', 'keyup'].forEach(function(t){ try { i.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} });
      w.classList.remove('tp-cv'); i.focus();
    });
    i.addEventListener('input', function(){ w.classList.toggle('tp-cv', !!i.value); });
    w.appendChild(x);
    w.classList.toggle('tp-cv', !!i.value);
  }
  setInterval(function(){ try { D.querySelectorAll('input.ipr-busca').forEach(liga); } catch (e) {} }, 800);
})();
(function(){
  var D = document;
  function conta(box){
    var hs = box.querySelectorAll(':scope > h5');
    hs.forEach(function(h){
      var n = 0, e = h.nextElementSibling;
      while (e) {
        if (e.tagName === 'H5') break;
        if (e.tagName === 'H4') break;
        var cs = e.querySelectorAll('input[type=checkbox]');
        cs.forEach(function(c){ if (c.checked) n++; });
        e = e.nextElementSibling;
      }
      var b = h.querySelector(':scope > .tp-cnt');
      if (!b) { b = D.createElement('span'); b.className = 'tp-cnt'; b.innerHTML = String.fromCharCode(60)+'i>'+String.fromCharCode(60)+'/i>'+String.fromCharCode(60)+'b>'+String.fromCharCode(60)+'/b>'; h.appendChild(b); }
      var t = String(n);
      if (b.lastChild.textContent !== t) b.lastChild.textContent = t;
      b.classList.toggle('on', n > 0);
      b.title = n === 1 ? '1 camada ligada' : n + ' camadas ligadas';
    });
  }
  function corre(){ try { D.querySelectorAll('#tao, #tes').forEach(conta); } catch (e) {} }
  D.addEventListener('change', function(){ setTimeout(corre, 30); }, true);
  setInterval(corre, 900);
})();
(function(){
  var D = document, alvo = null, ro = null;
  function caixa(){
    var ids = ['ipr-ii', 'tp-lpop'];
    for (var i = 0; i !== ids.length; i++) { var c = D.getElementById(ids[i]); if (c) { if (!c.hidden) { if (c.offsetHeight) return c; } } }
    return null;
  }
  function poe(){
    if (!alvo) return;
    var L = D.getElementById('ipr-lgd'), c = caixa();
    if (!L) return; if (!c) return;
    if (!alvo.isConnected) return;
    var lr = L.getBoundingClientRect(), h = c.offsetHeight;
    var y = Math.max(8, lr.bottom - h);
    c.style.top = Math.round(y) + 'px'; c.style.bottom = 'auto';
  }
  window.__tpAlinha = function(b){
    alvo = b.closest('#ipr-lgd') ? b : null;
    if (!alvo) return;
    [0, 40, 150, 400, 900, 1600].forEach(function(t){ setTimeout(poe, t); });
    try {
      if (!ro) ro = new ResizeObserver(function(){ poe(); });
      ro.disconnect();
      var c = D.getElementById('ipr-ii'); if (c) ro.observe(c);
      var p2 = D.getElementById('tp-lpop'); if (p2) ro.observe(p2);
      var L = D.getElementById('ipr-lgd'); if (L) ro.observe(L);
    } catch (e) {}
  };
})();

})();
