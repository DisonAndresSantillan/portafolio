/* ─── CURSOR ──────────────────────────────────────── */
const dot=document.getElementById('dot'), rng=document.getElementById('ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
(function lr(){rx+=(mx-rx)*.13;ry+=(my-ry)*.13;rng.style.left=rx+'px';rng.style.top=ry+'px';requestAnimationFrame(lr)})();
document.querySelectorAll('a,button').forEach(el=>{
  el.addEventListener('mouseenter',()=>{rng.style.width='54px';rng.style.height='54px';rng.style.borderColor='rgba(77,201,255,.9)'});
  el.addEventListener('mouseleave',()=>{rng.style.width='34px';rng.style.height='34px';rng.style.borderColor='rgba(77,201,255,.5)'});
});

/* ─── HERO WOVEN LIGHT (Three.js) ─────────────────── */
/* Tejido de partículas sobre un toro-nudo que gira y reacciona al ratón.
   Portado de un componente React/Three.js/framer-motion a vanilla. Se dibuja
   sobre el #bg-canvas global (alpha) → como el resto de secciones tienen fondo
   opaco, solo se ve en el hero, tras el nombre. Color: degradado de marca
   (cian → cian claro → morado). El bucle de física es allocation-free para ir
   fluido con ~9k partículas. Sin Three.js o con prefers-reduced-motion no anima. */
(function(){
  const cv = document.getElementById('bg-canvas');
  if(typeof THREE === 'undefined') return;             // Three.js no cargó → no rompe

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:true, alpha:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // posiciones base = vértices de un toro-nudo
  const knot = new THREE.TorusKnotGeometry(1.5, 0.5, 220, 40);
  const base = knot.attributes.position;
  const N = base.count;                                // ~9.000 puntos

  const positions = new Float32Array(N*3);
  const original  = new Float32Array(N*3);
  const colors    = new Float32Array(N*3);
  const vel       = new Float32Array(N*3);             // velocidad por partícula

  // paleta de marca: --ai → --ml → --pur
  const cA=new THREE.Color('#4dc9ff'), cM=new THREE.Color('#9be8ff'), cP=new THREE.Color('#d19bff');
  const tmp=new THREE.Color();
  for(let i=0;i<N;i++){
    const x=base.getX(i), y=base.getY(i), z=base.getZ(i);
    positions[i*3]=original[i*3]=x;
    positions[i*3+1]=original[i*3+1]=y;
    positions[i*3+2]=original[i*3+2]=z;
    const t=i/N;                                        // recorre el degradado a lo largo del nudo
    if(t<0.5) tmp.copy(cA).lerp(cM, t/0.5);
    else      tmp.copy(cM).lerp(cP, (t-0.5)/0.5);
    const b=0.65+Math.random()*0.35;                   // leve variación de brillo → chispeo
    colors[i*3]=tmp.r*b; colors[i*3+1]=tmp.g*b; colors[i*3+2]=tmp.b*b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,3));

  const material = new THREE.PointsMaterial({
    size:0.03, vertexColors:true, transparent:true, opacity:0.85,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  const points = new THREE.Points(geo, material);
  scene.add(points);
  const posAttr = geo.attributes.position;

  // ratón en coordenadas de mundo (plano z=0)
  let mwx=0, mwy=0;
  window.addEventListener('mousemove', e=>{
    mwx = ((e.clientX/innerWidth)*2-1)*3;
    mwy = (-(e.clientY/innerHeight)*2+1)*3;
  });

  const clock = new THREE.Clock();
  function frame(){
    for(let i=0;i<N;i++){
      const ix=i*3, iy=ix+1, iz=ix+2;
      let px=positions[ix], py=positions[iy], pz=positions[iz];
      let vx=vel[ix], vy=vel[iy], vz=vel[iz];

      // repulsión del ratón
      const dx=px-mwx, dy=py-mwy, dz=pz;
      const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d<1.5 && d>0.0001){
        const f=(1.5-d)*0.01/d;
        vx+=dx*f; vy+=dy*f; vz+=dz*f;
      }
      // retorno al origen + amortiguación
      vx=(vx+(original[ix]-px)*0.001)*0.95;
      vy=(vy+(original[iy]-py)*0.001)*0.95;
      vz=(vz+(original[iz]-pz)*0.001)*0.95;

      positions[ix]=px+vx; positions[iy]=py+vy; positions[iz]=pz+vz;
      vel[ix]=vx; vel[iy]=vy; vel[iz]=vz;
    }
    posAttr.needsUpdate = true;
    points.rotation.y = clock.getElapsedTime()*0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  renderer.render(scene, camera);
  if(!reduce) requestAnimationFrame(frame);
})();

/* (contadores del hero eliminados junto con la sección de stats) */

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
  const h=a.getAttribute('href');
  e.preventDefault();
  if(!h||h==='#')return;                         // enlaces placeholder (#) no navegan
  const t=document.querySelector(h);
  if(!t)return;
  if(window.lenis)window.lenis.scrollTo(t,{offset:-62});   // deja espacio para el nav fijo
  else t.scrollIntoView({behavior:'smooth',block:'start'});
}));
