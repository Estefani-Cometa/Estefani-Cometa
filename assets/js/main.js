/* ==========================================================================
   Portafolio — Estefani Cometa
   Módulos:
   1. Entrada y barra de progreso   5. Pestañas de tecnologías
   2. Menú móvil                    6. Títulos que se escriben
   3. Diálogo de CV                 7. Revelado, secciones y menú activo
   4. Cielo: red de nodos luminosos    8. Cursor, chispas y botones magnéticos
                                    9. Scroll en el hero y enlaces
   ========================================================================== */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* 1. ENTRADA Y BARRA DE PROGRESO ------------------------------------------- */
(function initIntro() {
  const intro = document.querySelector('.intro');
  const ready = () => root.classList.add('ready');
  let seen = false;
  try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch (e) { /* sin storage */ }

  if (!intro || reduceMotion || seen) { intro?.remove(); ready(); return; }

  window.addEventListener('load', () => {
    setTimeout(() => {
      intro.classList.add('is-done');
      setTimeout(ready, 250);
      setTimeout(() => intro.remove(), 1000);
      try { sessionStorage.setItem('intro-seen', '1'); } catch (e) { /* sin storage */ }
    }, 700);
  });
})();

(function initProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();


/* 2. MENÚ MÓVIL ------------------------------------------------------------ */
(function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#primary-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();


/* 3. DIÁLOGO DE CV --------------------------------------------------------- */
(function initCvDialog() {
  const dialog = document.querySelector('.cv-dialog');
  if (!dialog) return;

  document.querySelectorAll('.cv-trigger').forEach((b) => b.addEventListener('click', () => dialog.showModal()));
  document.querySelectorAll('.cv-close, .cv-close-secondary').forEach((b) => b.addEventListener('click', () => dialog.close()));
  document.querySelector('.cv-print')?.addEventListener('click', () => window.print());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
})();


/* 4. CIELO: red de nodos luminosos con profundidad (lenta y discreta) ------------ */
(function initSky() {
  const canvas = document.getElementById('sky');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');

  // Paleta del portafolio: sobre todo celeste y violeta, con algo de rosa
  const PALETTE = ['85,219,245', '85,219,245', '148,116,255', '148,116,255', '244,93,180'];
  const LINK = 170;                // distancia máxima para unir dos nodos
  const SPEED = .07;               // deriva lenta
  const sprites = {};              // destellos pre-dibujados (más rápido que gradientes por fotograma)

  function sprite(rgb) {
    if (sprites[rgb]) return sprites[rgb];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.09, `rgba(${rgb},1)`);
    grad.addColorStop(.26, `rgba(${rgb},.55)`); grad.addColorStop(.52, `rgba(${rgb},.14)`); grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return (sprites[rgb] = c);
  }

  let W, H, nodes = [], bokeh = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false };

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rand = (a, b) => a + Math.random() * (b - a);
    const n = Math.min(72, Math.round((W * H) / 20000));
    nodes = Array.from({ length: n }, () => ({
      x: rand(0, W), y: rand(0, H), z: rand(.35, 1),
      a: rand(0, 6.28), vx: rand(-1, 1) * SPEED, vy: rand(-1, 1) * SPEED,
      s: rand(9, 17), c: PALETTE[Math.floor(Math.random() * PALETTE.length)], ph: rand(0, 6.28),
    }));
    // Círculos grandes y desenfocados al fondo: dan sensación de profundidad
    bokeh = Array.from({ length: W < 700 ? 6 : 12 }, () => ({
      x: rand(0, W), y: rand(0, H), z: rand(.15, .4), vx: rand(-1, 1) * SPEED * .6, vy: rand(-1, 1) * SPEED * .6,
      s: rand(28, 60), c: PALETTE[Math.floor(Math.random() * PALETTE.length)], al: rand(.09, .17), ph: rand(0, 6.28),
    }));
  }

  addEventListener('pointermove', (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.on = true; }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.on = false; });

  const wrap = (v, max) => (v < -60 ? max + 60 : v > max + 60 ? -60 : v);

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    const mx = (mouse.x / W - .5), my = (mouse.y / H - .5);   // leve paralaje con el cursor

    const place = (p) => {
      p.x = wrap(p.x + p.vx, W); p.y = wrap(p.y + p.vy, H);
      let y = (p.y - scrollY * p.z * .1) % H; if (y < 0) y += H;
      return { x: p.x - mx * 28 * p.z + Math.sin(t * .0002 + p.ph) * 6, y: y - my * 28 * p.z, p };
    };

    // 1) círculos desenfocados (fondo)
    ctx.globalCompositeOperation = 'lighter';
    bokeh.forEach((b) => {
      const { x, y } = place(b);
      ctx.globalAlpha = b.al; ctx.drawImage(sprite(b.c), x - b.s, y - b.s, b.s * 2, b.s * 2);
    });

    // 2) líneas finas entre nodos cercanos
    const pos = nodes.map(place);
    ctx.lineWidth = .9;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.globalAlpha = (1 - d / LINK) * .42 * Math.min(pos[i].p.z, pos[j].p.z) * 1.5;
          ctx.strokeStyle = `rgb(${pos[i].p.c})`;
          ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
        }
      }
      // el cursor se une suavemente a los nodos cercanos
      if (mouse.on) {
        const dm = Math.hypot(pos[i].x - mouse.x, pos[i].y - mouse.y);
        if (dm < 170) {
          ctx.globalAlpha = (1 - dm / 170) * .35; ctx.strokeStyle = 'rgb(240,238,255)';
          ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    // 3) nodos brillantes que respiran despacio
    pos.forEach(({ x, y, p }) => {
      const pulse = .75 + .25 * Math.sin(t * .0007 + p.ph), s = p.s * p.z * (.9 + .15 * pulse);
      ctx.globalAlpha = Math.min(1, .95 * p.z * pulse);
      ctx.drawImage(sprite(p.c), x - s, y - s, s * 2, s * 2);
    });

    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  build();
  addEventListener('resize', build);
  requestAnimationFrame(frame);
})();


/* 5. PESTAÑAS DE TECNOLOGÍAS ------------------------------------------------ */
(function initTech() {
  const tabs = [...document.querySelectorAll('.tech-tab')];
  const panels = [...document.querySelectorAll('.tech-panel')];
  const stage = document.querySelector('.tech-stage');
  if (!tabs.length) return;

  panels.forEach((p) => p.querySelectorAll('.tech-list span').forEach((s, i) => s.style.setProperty('--k', i)));
  let current = 0;

  function show(index, focus) {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === current)); t.tabIndex = i === current ? 0 : -1; });
    panels.forEach((p, i) => { p.classList.toggle('is-active', i === current); p.classList.toggle('is-before', i < current); });
    if (focus) tabs[current].focus();
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
  document.querySelector('.tech-tabs').addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step) { e.preventDefault(); show(current + step, true); }
  });
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => show(current + Number(b.dataset.step))));

  // Deslizar con el dedo en móvil
  let startX = null;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
  show(0);
})();


/* 6. TÍTULOS QUE SE ESCRIBEN ------------------------------------------------ */
(function initTyping() {
  const titles = document.querySelectorAll('.type-title');
  titles.forEach((el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    const walk = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...c.textContent.replace(/\s+/g, ' ')].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
          s.style.setProperty('--c', n++); s.textContent = ch;
          frag.append(s);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
    walk(el);
    el.dataset.chars = n;
  });

  const whenReady = (el, fn) => {
    if (!el.classList.contains('hero-title') || root.classList.contains('ready')) return fn(el);
    new MutationObserver((_, o) => { if (root.classList.contains('ready')) { o.disconnect(); fn(el); } })
      .observe(root, { attributes: true, attributeFilter: ['class'] });
  };

  const run = (el) => {
    if (reduceMotion) { el.classList.add('typed'); return; }
    el.classList.add('typing');
    setTimeout(() => { el.classList.remove('typing'); el.classList.add('typed'); }, Number(el.dataset.chars) * 32 + 500);
  };

  if (!('IntersectionObserver' in window)) { titles.forEach((el) => el.classList.add('typed')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { whenReady(e.target, run); io.unobserve(e.target); }
  }), { threshold: .6 });
  titles.forEach((el) => io.observe(el));
})();


/* 7. REVELADO, SECCIONES Y MENÚ ACTIVO ------------------------------------- */
(function initScroll() {
  const reveals = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('.section, .contact');
  if (!('IntersectionObserver' in window)) { reveals.forEach((el) => el.classList.add('is-visible')); return; }

  const once = (selector, cls, options) => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); }
    }), options);
    selector.forEach((el) => io.observe(el));
  };
  // Los hermanos dentro de una lista entran escalonados
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--i', siblings.indexOf(el));
  });
  once(reveals, 'is-visible', { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  once(sections, 'in-view', { threshold: .05 });

  // Enlace activo en el menú
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.nav-cta)')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const nav = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${e.target.id}`)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => nav.observe(t));
})();


/* 8. CURSOR, CHISPAS Y BOTONES MAGNÉTICOS ------------------------------------ */
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

(function initCursor() {
  if (reduceMotion || !finePointer) return;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  const label = ring.querySelector('span');
  root.classList.add('cursor-on');

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  }, { passive: true });
  (function follow() {
    rx += (mx - rx) * .15; ry += (my - ry) * .15;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(follow);
  })();

  // El aro crece sobre lo clicable y muestra una palabra si el elemento tiene data-cursor
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [role="tab"], [data-cursor]');
    ring.classList.toggle('is-link', !!t);
    if (label) label.textContent = t?.dataset.cursor || '';
  });
  addEventListener('pointerdown', () => ring.classList.add('is-down'));
  addEventListener('pointerup', () => ring.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => root.classList.remove('cursor-on'));
  document.documentElement.addEventListener('pointerenter', () => root.classList.add('cursor-on'));
})();

(function initFx() {
  const canvas = document.getElementById('fx');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#f45db4', '#9474ff', '#55dbf5', '#ffffff'];
  const parts = [];
  let W, H;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const spawn = (x, y, vx, vy, life, size, star) =>
    parts.push({ x, y, vx, vy, life, max: life, size, star, c: COLORS[Math.floor(Math.random() * COLORS.length)] });

  // Al hacer clic (o tocar) sale una explosión de destellos
  addEventListener('pointerdown', (e) => {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.283 + Math.random() * .4, sp = 1.5 + Math.random() * 3;
      spawn(e.clientX, e.clientY, Math.cos(a) * sp, Math.sin(a) * sp, 40 + Math.random() * 20, 2 + Math.random() * 3, i % 3 === 0);
    }
  });

  // Estela de chispas al mover el cursor (solo con ratón)
  if (finePointer) {
    let last = 0;
    addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      spawn(e.clientX, e.clientY, (Math.random() - .5) * .6, Math.random() * .6 + .2, 36, 1.5 + Math.random() * 2, false);
    }, { passive: true });
  }

  function star(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * .5, y - r * .5); ctx.lineTo(x + r * 2, y); ctx.lineTo(x + r * .5, y + r * .5);
    ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * .5, y + r * .5); ctx.lineTo(x - r * 2, y); ctx.lineTo(x - r * .5, y - r * .5);
    ctx.closePath(); ctx.fill();
  }

  function loop() {
    if (parts.length) {
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy = p.vy * .97 + .03; p.life--;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.c;
        if (p.star) star(p.x, p.y, p.size * .7); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      if (!parts.length) ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(loop);
  }
  resize(); addEventListener('resize', resize); loop();
})();

// Botones, redes y flechas se acercan suavemente al cursor
(function initMagnetic() {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * .28}px ${(e.clientY - r.top - r.height / 2) * .28}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
})();


/* 9. SCROLL EN EL HERO Y ENLACES --------------------------------------------- */
(function initHeroScroll() {
  const copy = document.querySelector('.hero-copy-column');
  const orbits = document.querySelector('.hero-orbits');
  if (!copy || reduceMotion) return;
  let ticking = false;
  const update = () => {
    const y = Math.min(scrollY, 900);
    copy.style.translate = `0 ${-y * .12}px`;
    copy.style.opacity = String(Math.max(0, 1 - y / 750));
    if (orbits) orbits.style.translate = `0 ${y * .22}px`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
})();

(function initLinks() {
  // Certificados sin URL real todavía: no saltan al inicio de la página
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // Desplazamiento suave entre secciones; el navegador respeta reduced motion.
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((a) => a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));
})();
