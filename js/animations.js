/* ════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS — Lenis (smooth scroll) + GSAP + ScrollTrigger
   Efectos: scroll suave con inercia · parallax por capas · entrada
            del hero · reveals con máscara · reveal de imágenes
            (clip-path) · botones magnéticos · barra de progreso ·
            tarjetas apiladas (stack).
   Tolerante a fallos: si Lenis/GSAP no cargan o se pide
   reduced-motion, no se aplica nada y el sitio se ve igual.
   ════════════════════════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 0 · LENIS · scroll suave con inercia ───────────────────
     Es independiente de GSAP. Si no carga la librería o se pide
     reduced-motion, simplemente se usa el scroll nativo.         */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis;
  }

  /* ── Guardas de seguridad para GSAP ── */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Sin GSAP igual movemos Lenis con su propio rAF.
    if (lenis) {
      var rafLoop = function (t) { lenis.raf(t); requestAnimationFrame(rafLoop); };
      requestAnimationFrame(rafLoop);
    }
    return;
  }
  if (reduce) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-ready');

  /* ── Integrar Lenis con el ticker de GSAP y ScrollTrigger ── */
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ── 1 · PARALLAX por capas ─────────────────────────────────
     Cualquier elemento con [data-parallax="0.2"] se desplaza a
     distinta velocidad mientras su sección cruza la pantalla.   */
  gsap.utils.toArray('[data-parallax]').forEach(function (el) {
    var speed = parseFloat(el.dataset.parallax) || 0.2;
    var section = el.closest('section') || el.parentElement;
    gsap.fromTo(el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });

  /* ── 2 · HERO · entrada escalonada al cargar ─────────────────
     El contenido del hero aparece en cascada (eyebrow → nombre →
     rol → descripción → botones → stats).                        */
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
  heroTl
    .from('.hero-eyebrow', { y: 24, autoAlpha: 0 })
    .from('.hero-name',    { y: 40, autoAlpha: 0 }, '-=0.6')
    .from('.hero-role',    { y: 20, autoAlpha: 0 }, '-=0.6')
    .from('.hero-desc',    { y: 20, autoAlpha: 0 }, '-=0.6')
    .from('.hero-btns .btn',  { y: 22, autoAlpha: 0, stagger: 0.08 }, '-=0.55')
    .from('.hero-stats > div',{ y: 22, autoAlpha: 0, stagger: 0.10 }, '-=0.5');

  /* ── 3 · HERO · el contenido sube y se desvanece al salir ──── */
  var heroInner = document.querySelector('#home .hero-inner');
  if (heroInner) {
    gsap.to(heroInner, {
      yPercent: 16, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── 4 · REVEAL con máscara · títulos suben desde abajo ──────
     Se envuelve el contenido en una máscara (overflow:hidden) y
     el texto entra subiendo. Preserva el markup interno (spans
     de gradiente intactos).                                      */
  function wrapReveal(el) {
    var inner = document.createElement('span');
    inner.className = 'r-inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    var mask = document.createElement('span');
    mask.className = 'r-mask';
    mask.appendChild(inner);
    el.appendChild(mask);
    return inner;
  }
  gsap.utils.toArray('.sec-title, .band-quote').forEach(function (el) {
    var inner = wrapReveal(el);
    gsap.from(inner, {
      yPercent: 115, ease: 'power4.out', duration: 1,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ── 5 · REVEAL de imágenes con clip-path (wipe vertical) ──── */
  gsap.utils.toArray('.about-img-wrap img, .stack-media img').forEach(function (img) {
    gsap.from(img, {
      clipPath: 'inset(0 0 100% 0)', ease: 'power3.out', duration: 1.2,
      scrollTrigger: { trigger: img, start: 'top 90%' }
    });
  });

  /* ── 6 · BOTONES MAGNÉTICOS (solo en dispositivos con ratón) ─ */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    gsap.utils.toArray('.btn, .ft-soc a').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.35,
          y: (e.clientY - r.top - r.height / 2) * 0.5,
          duration: 0.4, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ── 7 · BARRA DE PROGRESO de scroll ───────────────────────── */
  gsap.to('.scroll-prog', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ── 8 · TARJETAS APILADAS (proyectos) ──────────────────────
     Las cards son position:sticky (CSS). Aquí, mientras la
     siguiente sube por encima, la anterior se reduce y oscurece. */
  var cards = gsap.utils.toArray('.stack-card');
  cards.forEach(function (card, i) {
    if (i === cards.length - 1) return;            // la última se queda intacta
    var inner = card.querySelector('.stack-inner');
    if (!inner) return;
    gsap.to(inner, {
      scale: 0.9, autoAlpha: 0.55, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true }
    });
  });

  /* ── 9 · Refresh cuando todo cargue (imágenes/fuentes) ────── */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
