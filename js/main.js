/* ─── CURSOR ──────────────────────────────────────── */
/* solo con ratón real; en táctil el CSS oculta #dot/#ring y aquí no se anima nada */
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  const dot=document.getElementById('dot'), rng=document.getElementById('ring');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
  (function lr(){rx+=(mx-rx)*.13;ry+=(my-ry)*.13;rng.style.left=rx+'px';rng.style.top=ry+'px';requestAnimationFrame(lr)})();
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>{rng.style.width='54px';rng.style.height='54px';rng.style.borderColor='rgba(77,201,255,.9)'});
    el.addEventListener('mouseleave',()=>{rng.style.width='34px';rng.style.height='34px';rng.style.borderColor='rgba(77,201,255,.5)'});
  });
}

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

  /* ── PARÁMETROS DEL WOVEN — tocar aquí para variar el efecto ──
     Geometría del nudo, partículas, física del ratón y movimiento. */
  const WOVEN = {
    camZ:        5,        // distancia de la cámara (menos = más cerca/grande)
    knotRadius:  2.5,      // radio del toro-nudo
    knotTube:    0.5,      // grosor del tubo del nudo
    knotSegs:    220,      // segmentos a lo largo → nº de partículas (220×40 ≈ 9k)
    knotRadial:  40,       // segmentos radiales → nº de partículas
    colors:      ['#4dc9ff','#9be8ff','#d19bff'],  // degradado de marca: --ai → --ml → --pur
    brightBase:  0.65,     // brillo mínimo por partícula
    brightVar:   0.35,     // variación aleatoria de brillo (chispeo)
    dotSize:     0.025,    // tamaño de cada partícula (con 0.01 el tejido casi no se ve)
    dotOpacity:  0.85,     // opacidad global de las partículas
    mouseRange:  3,        // alcance del ratón en coords de mundo
    repelRadius: 2.5,      // radio de repulsión alrededor del cursor
    repelForce:  0.01,     // fuerza de la repulsión
    spring:      0.001,    // fuerza de retorno al origen (muelle)
    damping:     0.95,     // amortiguación de la velocidad (0–1, menos = se frena antes)
    spinSpeed:   0.05      // velocidad de giro del nudo (rad/s)
  };

  /* móvil/táctil: menos partículas y render más barato para que no se congele,
     y calibrado con MÁS movimiento (sin ratón, el giro lento parecía estático) */
  const COARSE = window.matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
  if(COARSE){
    WOVEN.knotSegs   = 110;    // 110×22 ≈ 2.4k partículas (vs ~9k en escritorio)
    WOVEN.knotRadial = 22;
    WOVEN.dotSize    = Math.max(WOVEN.dotSize, 0.045);  // puntos mayores compensan la densidad
    WOVEN.spinSpeed  = 0.14;   // giro claramente perceptible
    WOVEN.repelForce = Math.max(WOVEN.repelForce, 0.016); // ondas más visibles al tocar
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
  // en pantalla vertical la cámara se aleja para que el nudo quepa a lo ancho
  const camDist = ()=> WOVEN.camZ * (innerHeight > innerWidth ? 1.4 : 1);
  camera.position.z = camDist();
  const renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:!COARSE, alpha:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, COARSE ? 1.3 : 2));

  // posiciones base = vértices de un toro-nudo
  const knot = new THREE.TorusKnotGeometry(WOVEN.knotRadius, WOVEN.knotTube, WOVEN.knotSegs, WOVEN.knotRadial);
  const base = knot.attributes.position;
  const N = base.count;

  const positions = new Float32Array(N*3);
  const original  = new Float32Array(N*3);
  const colors    = new Float32Array(N*3);
  const vel       = new Float32Array(N*3);             // velocidad por partícula

  const cA=new THREE.Color(WOVEN.colors[0]), cM=new THREE.Color(WOVEN.colors[1]), cP=new THREE.Color(WOVEN.colors[2]);
  const tmp=new THREE.Color();
  for(let i=0;i<N;i++){
    const x=base.getX(i), y=base.getY(i), z=base.getZ(i);
    positions[i*3]=original[i*3]=x;
    positions[i*3+1]=original[i*3+1]=y;
    positions[i*3+2]=original[i*3+2]=z;
    const t=i/N;                                        // recorre el degradado a lo largo del nudo
    if(t<0.5) tmp.copy(cA).lerp(cM, t/0.5);
    else      tmp.copy(cM).lerp(cP, (t-0.5)/0.5);
    const b=WOVEN.brightBase+Math.random()*WOVEN.brightVar;
    colors[i*3]=tmp.r*b; colors[i*3+1]=tmp.g*b; colors[i*3+2]=tmp.b*b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,3));

  const material = new THREE.PointsMaterial({
    size:WOVEN.dotSize, vertexColors:true, transparent:true, opacity:WOVEN.dotOpacity,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  const points = new THREE.Points(geo, material);
  scene.add(points);
  const posAttr = geo.attributes.position;

  // puntero en coordenadas de mundo (plano z=0) — ratón o dedo
  let mwx=0, mwy=0;
  function aim(cx, cy){
    mwx = ((cx/innerWidth)*2-1)*WOVEN.mouseRange;
    mwy = (-(cy/innerHeight)*2+1)*WOVEN.mouseRange;
  }
  let lastTouch = -1e9;                              // último toque real (para el dedo fantasma)
  window.addEventListener('mousemove', e=>aim(e.clientX, e.clientY), { passive:true });
  window.addEventListener('touchstart', e=>{ const t=e.touches[0]; if(t){ aim(t.clientX, t.clientY); lastTouch=performance.now(); } }, { passive:true });
  window.addEventListener('touchmove',  e=>{ const t=e.touches[0]; if(t){ aim(t.clientX, t.clientY); lastTouch=performance.now(); } }, { passive:true });

  const clock = new THREE.Clock();
  const MIN_DT = COARSE ? 1000/30 : 0;             // en móvil 30 fps bastan y ahorran CPU/batería
  let lastT = 0;
  function frame(t){
    requestAnimationFrame(frame);
    if(t - lastT < MIN_DT) return;
    lastT = t;

    /* dedo fantasma (solo táctil): si no hay toque reciente, un punto
       invisible recorre el tejido en órbita → siempre hay ondulación */
    if(COARSE && t - lastTouch > 1200){
      const s = clock.getElapsedTime();
      mwx = Math.sin(s*0.55)*1.8;
      mwy = Math.cos(s*0.42)*1.5;
    }

    for(let i=0;i<N;i++){
      const ix=i*3, iy=ix+1, iz=ix+2;
      let px=positions[ix], py=positions[iy], pz=positions[iz];
      let vx=vel[ix], vy=vel[iy], vz=vel[iz];

      // repulsión del ratón
      const dx=px-mwx, dy=py-mwy, dz=pz;
      const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d<WOVEN.repelRadius && d>0.0001){
        const f=(WOVEN.repelRadius-d)*WOVEN.repelForce/d;
        vx+=dx*f; vy+=dy*f; vz+=dz*f;
      }
      // retorno al origen + amortiguación
      vx=(vx+(original[ix]-px)*WOVEN.spring)*WOVEN.damping;
      vy=(vy+(original[iy]-py)*WOVEN.spring)*WOVEN.damping;
      vz=(vz+(original[iz]-pz)*WOVEN.spring)*WOVEN.damping;

      positions[ix]=px+vx; positions[iy]=py+vy; positions[iz]=pz+vz;
      vel[ix]=vx; vel[iy]=vy; vel[iz]=vz;
    }
    posAttr.needsUpdate = true;
    const el = clock.getElapsedTime();
    points.rotation.y = el*WOVEN.spinSpeed;
    if(COARSE) points.rotation.x = Math.sin(el*0.18)*0.12;   // balanceo sutil extra en móvil
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.position.z = camDist();
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

/* ─── SKILLS CLOTHESLINE — arrastrar para recorrer la línea ───
   Las tarjetas no se mueven ni se descuelgan: la pista (overflow-x)
   se desplaza con el cursor, con una inercia suave al soltar. */
(function(){
  const track = document.getElementById('clTrack');
  if(!track) return;
  const mq = window.matchMedia('(min-width:761px)');
  let down=false, startX=0, startSL=0, lastX=0, lastT=0, vx=0, momentum=null;

  function onDown(e){
    if(!mq.matches) return;
    down=true; startX=lastX=e.clientX; startSL=track.scrollLeft;
    lastT=performance.now(); vx=0;
    if(momentum){ cancelAnimationFrame(momentum); momentum=null; }
    track.classList.add('cl-drag');
    try{ track.setPointerCapture(e.pointerId); }catch(_){}
  }
  function onMove(e){
    if(!down) return;
    track.scrollLeft = startSL - (e.clientX - startX);
    const now = performance.now(), dt = now - lastT;
    if(dt > 0){ vx = (e.clientX - lastX) / dt; }    // px/ms para la inercia
    lastX = e.clientX; lastT = now;
  }
  function onUp(){
    if(!down) return;
    down=false;
    track.classList.remove('cl-drag');
    let v = -vx * 14;                               // impulso inicial
    (function glide(){
      if(Math.abs(v) < 0.4) return;
      track.scrollLeft += v; v *= 0.92;             // fricción
      momentum = requestAnimationFrame(glide);
    })();
  }
  track.addEventListener('pointerdown', onDown);
  track.addEventListener('pointermove', onMove);
  track.addEventListener('pointerup', onUp);
  track.addEventListener('pointercancel', onUp);

  /* arranque: media tarjeta cortada a cada lado → se ve que hay más
     contenido y que se puede arrastrar (1ª y 4ª asoman a medias) */
  let touched = false;
  track.addEventListener('pointerdown', ()=>{ touched = true; }, { once:true });
  function intro(){
    if(touched || !mq.matches) return;
    const card = track.querySelector('.sk-card');
    if(card) track.scrollLeft = card.offsetWidth / 2;
  }
  intro();
  window.addEventListener('load', intro);   // re-mide tras cargar fuentes/imágenes
})();

/* ─── ACORDEONES MÓVILES — journey y research plegados, tap para expandir ─── */
(function(){
  const mqM = window.matchMedia('(max-width:640px)');
  document.querySelectorAll('#experience .card, #research .res-card').forEach(c=>{
    c.addEventListener('click', e=>{
      if(!mqM.matches) return;
      if(e.target.closest('a')) return;            // los enlaces internos no pliegan
      c.classList.toggle('open');
    });
  });
})();

/* ─── NAV MÓVIL — hamburguesa + nombre al pasar el hero ─── */
(function(){
  const nav = document.querySelector('nav');
  const burger = document.getElementById('navBurger');
  if(!nav || !burger) return;
  burger.addEventListener('click', ()=>{
    const open = nav.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });
  // al elegir una sección se cierra el menú
  nav.querySelectorAll('.nav-links a').forEach(a=> a.addEventListener('click', ()=>{
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded','false');
  }));
  // .past-hero → el CSS móvil muestra el nombre en la barra fuera del hero
  const home = document.getElementById('home');
  function onScroll(){
    nav.classList.toggle('past-hero', window.scrollY > (home ? home.offsetHeight - 140 : 400));
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

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
