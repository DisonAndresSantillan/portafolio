/* ════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS — GSAP + ScrollTrigger
   Efectos: parallax por capas · tarjetas apiladas (stack) ·
            pipeline "pinned" tipo scrollytelling · reveals.
   Tolerante a fallos: si GSAP no carga o se pide reduced-motion,
   no se aplica nada y el sitio se ve igual (contenido visible).
   ════════════════════════════════════════════════════════════ */
(function () {
  // --- Guardas de seguridad ---
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-ready');

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

  /* ── 2 · HERO: el contenido sube y se desvanece al salir ───── */
  var heroInner = document.querySelector('#home .hero-inner');
  if (heroInner) {
    gsap.to(heroInner, {
      yPercent: 16, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── 3 · TARJETAS APILADAS (proyectos) ──────────────────────
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

  /* ── 4 · PIPELINE "pinned" (scrollytelling) ─────────────────
     Solo en escritorio: la sección se fija y al hacer scroll
     avanza por las 5 etapas (llamando a switchS de main.js).
     En móvil se mantienen las pestañas clicables de siempre.    */
  if (typeof window.switchS === 'function') {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
      var STAGES = 5, cur = -1;
      var st = ScrollTrigger.create({
        trigger: '#pipeline',
        start: 'top top',
        end: '+=' + (STAGES * 55) + '%',
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          var i = Math.min(STAGES - 1, Math.floor(self.progress * STAGES));
          if (i !== cur) { cur = i; window.switchS(i); }
        }
      });
      return function () { st.kill(); };           // cleanup al cambiar de breakpoint
    });
  }

  /* ── 5 · Refresh cuando todo cargue (imágenes/fuentes) ─────── */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
