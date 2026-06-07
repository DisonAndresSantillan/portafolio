/* ─── CURSOR ──────────────────────────────────────── */
const dot=document.getElementById('dot'), rng=document.getElementById('ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
(function lr(){rx+=(mx-rx)*.13;ry+=(my-ry)*.13;rng.style.left=rx+'px';rng.style.top=ry+'px';requestAnimationFrame(lr)})();
document.querySelectorAll('a,button').forEach(el=>{
  el.addEventListener('mouseenter',()=>{rng.style.width='54px';rng.style.height='54px';rng.style.borderColor='rgba(77,201,255,.9)'});
  el.addEventListener('mouseleave',()=>{rng.style.width='34px';rng.style.height='34px';rng.style.borderColor='rgba(77,201,255,.5)'});
});

/* ─── BACKGROUND PARTICLE CANVAS ─────────────────── */
(function(){
  const cv=document.getElementById('bg-canvas');
  const ctx=cv.getContext('2d');
  let W,H,pts=[];

  function resize(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight}
  resize(); window.addEventListener('resize',resize);

  function make(){
    pts=[];
    const N=Math.floor((W*H)/18000);
    for(let i=0;i<N;i++) pts.push({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.6+.6,
      p:Math.random()*Math.PI*2, ps:.012+Math.random()*.018,
      c:Math.random()>.55?'77,201,255':Math.random()>.5?'155,232,255':'209,155,255'
    });
  }
  make(); window.addEventListener('resize',make);

  function draw(){
    ctx.clearRect(0,0,W,H);
    // connections
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(77,201,255,${(1-d/120)*.18})`; ctx.lineWidth=.8; ctx.stroke();
        }
      }
    }
    // dots
    pts.forEach(p=>{
      p.p+=p.ps; p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      const g=(Math.sin(p.p)+1)/2;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r+g*.6,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.c},${.55+g*.35})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ─── COUNTERS ────────────────────────────────────── */
function cnt(el,t,sfx=''){
  let s=0;
  const fn=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1700,1);el.textContent=Math.floor(p*t)+sfx;if(p<1)requestAnimationFrame(fn);else el.textContent=t+sfx};
  requestAnimationFrame(fn);
}
const cObs=new IntersectionObserver(e=>{if(e[0].isIntersecting){cnt(document.getElementById('c-y'),8,'+');cnt(document.getElementById('c-p'),50,'+');cnt(document.getElementById('c-r'),1,'');cObs.disconnect()}},{threshold:.4});
cObs.observe(document.getElementById('home'));

/* ─── SCROLL REVEAL ───────────────────────────────── */
const obs=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add('vis')}),{threshold:.08,rootMargin:'0px 0px -32px 0px'});
document.querySelectorAll('.rev,.tl-item').forEach(el=>obs.observe(el));

/* ─── SKILL BARS ──────────────────────────────────── */
const bObs=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting)x.target.querySelectorAll('.bar-fill').forEach(b=>{setTimeout(()=>{b.style.width=b.dataset.w+'%'},180)})}),{threshold:.25});
document.querySelectorAll('.sk-card').forEach(c=>bObs.observe(c));

/* ─── NAV ACTIVE ──────────────────────────────────── */
window.addEventListener('scroll',()=>{
  const y=window.scrollY+80;
  document.querySelectorAll('section[id]').forEach(s=>{
    if(y>=s.offsetTop&&y<s.offsetTop+s.offsetHeight)
      document.querySelectorAll('.nav-links a').forEach(a=>
        a.classList.toggle('active',a.getAttribute('href')==='#'+s.id));
  });
});

/* ─── PIPELINE CANVAS HELPERS ─────────────────────── */
let sAF={};
function size(id){
  const c=document.getElementById('cv'+id);if(!c)return null;
  const w=c.parentElement;c.width=w.offsetWidth;c.height=w.offsetHeight;
  return c.getContext('2d');
}
function initC(id){
  const ctx=size(id); if(!ctx)return;
  if(sAF[id])cancelAnimationFrame(sAF[id]);
  [p0,p1,p2,p3,p4][id](document.getElementById('cv'+id),ctx,id);
}

/* p0 — Data Ingestion: streaming particles → node grid */
function p0(cv,ctx,id){
  const W=cv.width,H=cv.height;
  const pts=Array.from({length:50},()=>({x:Math.random()*W*.26,y:Math.random()*H,vx:1.2+Math.random()*2,c:['77,201,255','155,232,255','209,155,255'][Math.floor(Math.random()*3)],r:1.4+Math.random()*1.8,trail:[]}));
  const nds=[];
  for(let c=0;c<4;c++)for(let r=0;r<5;r++)nds.push({x:W*.56+c*W*.11,y:H*.1+r*H*.2,a:0});
  function fr(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<nds.length;i++)for(let j=i+1;j<nds.length;j++){
      const d=Math.hypot(nds[i].x-nds[j].x,nds[i].y-nds[j].y);
      if(d<W*.18){ctx.beginPath();ctx.moveTo(nds[i].x,nds[i].y);ctx.lineTo(nds[j].x,nds[j].y);ctx.strokeStyle='rgba(77,201,255,.1)';ctx.lineWidth=1;ctx.stroke();}
    }
    nds.forEach(n=>{n.a=Math.max(0,n.a-.022);ctx.beginPath();ctx.arc(n.x,n.y,4+n.a*5,0,Math.PI*2);ctx.fillStyle=`rgba(77,201,255,${.45+n.a*.55})`;ctx.fill()});
    pts.forEach(p=>{
      p.trail.push({x:p.x,y:p.y});if(p.trail.length>10)p.trail.shift();p.x+=p.vx;
      if(p.x>W*.52){let cl=nds[0];nds.forEach(n=>{if(Math.hypot(n.x-p.x,n.y-p.y)<Math.hypot(cl.x-p.x,cl.y-p.y))cl=n});cl.a=1;p.x=Math.random()*W*.2;p.y=Math.random()*H;p.trail=[]}
      p.trail.forEach((t,i)=>{ctx.beginPath();ctx.arc(t.x,t.y,p.r*(i/p.trail.length),0,Math.PI*2);ctx.fillStyle=`rgba(${p.c},${(i/p.trail.length)*.5})`;ctx.fill()});
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${p.c},1)`;ctx.fill();
    });
    sAF[id]=requestAnimationFrame(fr);
  }fr();
}

/* p1 — Signal Processing: raw vs filtered */
function p1(cv,ctx,id){
  const W=cv.width,H=cv.height;let t=0;
  function fr(){
    ctx.fillStyle='rgba(4,8,15,.22)';ctx.fillRect(0,0,W,H);t+=.036;
    ctx.strokeStyle='rgba(77,201,255,.06)';ctx.lineWidth=1;
    for(let gx=0;gx<=W;gx+=W/10){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke()}
    for(let gy=0;gy<=H;gy+=H/6){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke()}
    ctx.beginPath();for(let x=0;x<W;x++){const a=(x/W)*Math.PI*8+t;const y=H*.28+(Math.sin(a)*.38+Math.sin(a*2.4)*.18+(Math.random()-.5)*.22)*H*.15;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
    ctx.strokeStyle='rgba(209,155,255,.5)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();for(let x=0;x<W;x++){const a=(x/W)*Math.PI*8+t;const y=H*.68+(Math.sin(a)*.38+Math.sin(a*2.4)*.18)*H*.15;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
    ctx.strokeStyle='rgba(77,201,255,.88)';ctx.lineWidth=2;ctx.stroke();
    ctx.font='11px JetBrains Mono,monospace';
    ctx.fillStyle='rgba(209,155,255,.7)';ctx.fillText('RAW SIGNAL',14,H*.15);
    ctx.fillStyle='rgba(77,201,255,.8)';ctx.fillText('FILTERED',14,H*.55);
    const sx=(t*26)%W;ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,H);ctx.strokeStyle='rgba(77,201,255,.1)';ctx.lineWidth=1;ctx.stroke();
    sAF[id]=requestAnimationFrame(fr);
  }fr();
}

/* p2 — Training: loss + accuracy */
function p2(cv,ctx,id){
  const W=cv.width,H=cv.height,MAX=80;let ep=0;const ld=[],ad=[];
  function fr(){
    ctx.clearRect(0,0,W,H);ep=Math.min(ep+.32,MAX);
    ctx.strokeStyle='rgba(77,201,255,.06)';ctx.lineWidth=1;
    for(let gx=0;gx<=W;gx+=W/8){ctx.beginPath();ctx.moveTo(gx,36);ctx.lineTo(gx,H-34);ctx.stroke()}
    for(let gy=0;gy<5;gy++){const y=36+gy*(H-70)/4;ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(W-16,y);ctx.stroke()}
    if(Math.floor(ep)>ld.length){const e=ld.length;ld.push(2.5*Math.exp(-e*.07)+.08+Math.sin(e*.5)*.04);ad.push(Math.min(.5+.48*(1-Math.exp(-e*.06))+Math.sin(e*.4)*.01,.99))}
    if(ld.length>1){ctx.beginPath();ld.forEach((v,i)=>{const x=32+(i/MAX)*(W-48),y=36+(1-v/2.6)*(H-70);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.strokeStyle='rgba(255,179,155,.88)';ctx.lineWidth=2.5;ctx.stroke()}
    if(ad.length>1){ctx.beginPath();ad.forEach((v,i)=>{const x=32+(i/MAX)*(W-48),y=36+(1-v)*(H-70);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.strokeStyle='rgba(77,201,255,.88)';ctx.lineWidth=2.5;ctx.stroke()}
    ctx.font='11px JetBrains Mono,monospace';
    ctx.fillStyle='rgba(77,201,255,.8)';ctx.fillText('── ACCURACY',8,19);
    ctx.fillStyle='rgba(255,179,155,.8)';ctx.fillText('── LOSS',116,19);
    ctx.fillStyle='rgba(90,122,154,.7)';ctx.fillText(`EPOCH ${Math.floor(ep)}/${MAX}`,W-120,H-10);
    if(ld.length){ctx.fillStyle='rgba(77,201,255,.9)';ctx.fillText(`${(ad[ad.length-1]*100).toFixed(1)}%`,W-62,19);ctx.fillStyle='rgba(255,179,155,.9)';ctx.fillText(ld[ld.length-1].toFixed(3),W-62,34)}
    if(ep<MAX){sAF[id]=requestAnimationFrame(fr)}else{ep=0;ld.length=0;ad.length=0;setTimeout(()=>{sAF[id]=requestAnimationFrame(fr)},1400)}
  }fr();
}

/* p3 — Evaluation: confusion matrix + ROC */
function p3(cv,ctx,id){
  const W=cv.width,H=cv.height;let t=0;const mat=[[.96,.04],[.03,.97]];
  function fr(){
    ctx.clearRect(0,0,W,H);t+=.013;
    const ms=Math.min(W*.38,H*.62),mx=W*.04,my=(H-ms)/2,cell=ms/2;
    ctx.font='10px JetBrains Mono,monospace';ctx.fillStyle='rgba(77,201,255,.6)';ctx.fillText('CONFUSION MATRIX',mx,my-12);
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){
      const v=mat[r][c],a=Math.min(1,t*.8)*v,ok=r===c,cx2=mx+c*cell,cy2=my+r*cell;
      ctx.fillStyle=ok?`rgba(77,201,255,${.1+a*.4})`:`rgba(255,100,100,${.05+a*.2})`;ctx.fillRect(cx2,cy2,cell-3,cell-3);
      ctx.strokeStyle=ok?'rgba(77,201,255,.4)':'rgba(255,100,100,.25)';ctx.lineWidth=1;ctx.strokeRect(cx2,cy2,cell-3,cell-3);
      ctx.font='bold 18px Orbitron,monospace';ctx.fillStyle=ok?'rgba(77,201,255,.95)':'rgba(255,160,160,.75)';ctx.textAlign='center';
      ctx.fillText(`${(a*100).toFixed(0)}%`,cx2+(cell-3)/2,cy2+(cell-3)/2+6);ctx.textAlign='left';
    }
    const rx=W*.5,ry=H*.08,rw=W*.44,rh=H*.8;
    ctx.font='10px JetBrains Mono,monospace';ctx.fillStyle='rgba(77,201,255,.6)';ctx.fillText('ROC CURVE',rx,ry-8);
    ctx.strokeStyle='rgba(77,201,255,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx,ry+rh);ctx.lineTo(rx+rw,ry+rh);ctx.stroke();
    ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(rx,ry+rh);ctx.lineTo(rx+rw,ry);ctx.strokeStyle='rgba(90,122,154,.25)';ctx.stroke();ctx.setLineDash([]);
    const pr=Math.min(1,t*.52);
    ctx.beginPath();for(let i=0;i<=50*pr;i++){const fpr=i/50,tpr=1-Math.exp(-8*fpr)+fpr*.05;const x=rx+fpr*rw,y=ry+rh-Math.min(tpr,1)*rh;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
    ctx.strokeStyle='rgba(77,201,255,.88)';ctx.lineWidth=2.5;ctx.stroke();
    ctx.font='bold 13px Orbitron,monospace';ctx.fillStyle='rgba(77,201,255,.9)';ctx.fillText(`AUC: ${(0.97*Math.min(1,t*.52)).toFixed(2)}`,rx+rw*.06,ry+rh*.2);
    sAF[id]=requestAnimationFrame(fr);
  }fr();
}

/* p4 — Deployment: architecture + packets */
function p4(cv,ctx,id){
  const W=cv.width,H=cv.height;let t=0;
  const ns=[{x:W*.08,y:H*.5,l:'CLIENT',c:'#9be8ff'},{x:W*.28,y:H*.28,l:'API GW',c:'#4dc9ff'},{x:W*.28,y:H*.72,l:'AUTH',c:'#d19bff'},{x:W*.52,y:H*.5,l:'MODEL',c:'#4dc9ff'},{x:W*.74,y:H*.28,l:'AZURE',c:'#9be8ff'},{x:W*.74,y:H*.72,l:'DB',c:'#fff59b'},{x:W*.92,y:H*.5,l:'MON',c:'#ffb39b'}];
  const es=[[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6]],pk=[];
  function fr(){
    ctx.clearRect(0,0,W,H);t+=.016;
    if(Math.random()<.07){const e=es[Math.floor(Math.random()*es.length)];pk.push({f:ns[e[0]],t2:ns[e[1]],p:0,sp:.018+Math.random()*.028,c:ns[e[0]].c})}
    es.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(ns[a].x,ns[a].y);ctx.lineTo(ns[b].x,ns[b].y);ctx.strokeStyle='rgba(77,201,255,.1)';ctx.lineWidth=1.5;ctx.stroke()});
    for(let i=pk.length-1;i>=0;i--){pk[i].p+=pk[i].sp;if(pk[i].p>=1){pk.splice(i,1);continue}const px=pk[i].f.x+(pk[i].t2.x-pk[i].f.x)*pk[i].p,py=pk[i].f.y+(pk[i].t2.y-pk[i].f.y)*pk[i].p;const g=ctx.createRadialGradient(px,py,0,px,py,8);g.addColorStop(0,pk[i].c);g.addColorStop(1,'transparent');ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(px,py,2.5,0,Math.PI*2);ctx.fillStyle=pk[i].c;ctx.fill()}
    ns.forEach(n=>{
      const pu=(Math.sin(t*1.8+n.x*.01)+1)/2;
      const rr=parseInt(n.c.slice(1,3),16),gg=parseInt(n.c.slice(3,5),16),bb=parseInt(n.c.slice(5,7),16);
      ctx.beginPath();ctx.arc(n.x,n.y,18+pu*4,0,Math.PI*2);ctx.fillStyle=`rgba(${rr},${gg},${bb},.09)`;ctx.fill();
      ctx.beginPath();ctx.arc(n.x,n.y,13,0,Math.PI*2);ctx.fillStyle=`rgba(${rr},${gg},${bb},.2)`;ctx.strokeStyle=`rgba(${rr},${gg},${bb},.75)`;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
      ctx.font='9px JetBrains Mono,monospace';ctx.fillStyle=n.c;ctx.textAlign='center';ctx.fillText(n.l,n.x,n.y+26);ctx.textAlign='left';
    });
    ctx.font='11px JetBrains Mono,monospace';ctx.fillStyle='rgba(77,201,255,.5)';ctx.fillText(`REQ/S: ${(114+Math.sin(t)*17).toFixed(0)}`,8,H-18);ctx.fillText(`LATENCY: ${(43+Math.sin(t*1.4)*6).toFixed(0)}ms`,8,H-6);
    sAF[id]=requestAnimationFrame(fr);
  }fr();
}

/* ─── STAGE TABS ──────────────────────────────────── */
const sTabs=document.querySelectorAll('.pipe-tab'),sPanels=document.querySelectorAll('.pipe-panel');
let curS=0;
function switchS(i){
  sTabs.forEach(t=>t.classList.remove('active'));sPanels.forEach(p=>p.classList.remove('active'));
  sTabs[i].classList.add('active');document.getElementById('s-'+i).classList.add('active');
  if(sAF[curS])cancelAnimationFrame(sAF[curS]);curS=i;
  setTimeout(()=>initC(i),50);
}
sTabs.forEach((t,i)=>t.addEventListener('click',()=>switchS(i)));
const pipeObs=new IntersectionObserver(e=>{if(e[0].isIntersecting){initC(0);pipeObs.disconnect()}},{threshold:.15});
pipeObs.observe(document.getElementById('pipeline'));

/* ─── RESIZE ──────────────────────────────────────── */
window.addEventListener('resize',()=>{
  const a=document.querySelector('.pipe-panel.active');
  if(a)initC(parseInt(a.id.split('-')[1]));
});

/* ─── FORM ────────────────────────────────────────── */
document.getElementById('cForm').addEventListener('submit',function(e){
  e.preventDefault();const b=this.querySelector('button[type=submit]'),o=b.innerHTML;
  b.innerHTML='<i class="fas fa-spinner fa-spin"></i> SENDING...';b.disabled=true;
  fetch(this.action,{method:'POST',body:new FormData(this),headers:{Accept:'application/json'}})
    .then(r=>r.ok?(alert("Message sent! I'll get back to you soon."),this.reset()):alert('Error. Email: edison.andres68@gmail.com'))
    .catch(()=>alert('Error. Email: edison.andres68@gmail.com'))
    .finally(()=>{b.innerHTML=o;b.disabled=false});
});

function dlCV(){const a=document.createElement('a');a.href='assets/docs/Edison_Santillan_AI_Engineer_CV.pdf';a.download='Edison_Santillan_AI_Engineer_CV.pdf';document.body.appendChild(a);a.click();document.body.removeChild(a)}

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();const t=document.querySelector(a.getAttribute('href'));
  if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
}));
