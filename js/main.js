/* ═══════════════════════════════════════════════════════════
   ГИЛЬДИЯ МАСТЕРОВ ЯРОСЛАВИИ — main.js
   Nav · Theme · Video · Bear assembly scroll-scrub · Wheel · Vitrines · GSAP
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   CATEGORIES & WHEEL CONFIG
───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { name: 'Украшения', anchor: '#jewelry', weight: 0.30 },
  { name: 'Декор',     anchor: '#decor',   weight: 0.2333 },
  { name: 'Сладости',  anchor: '#sweet',   weight: 0.2333 },
  { name: 'Угощения',  anchor: '#food',    weight: 0.2334 },
];

const SECTOR_COUNT    = 24;
const SECTORS_PER_CAT = 6;   // 4 × 6 = 24
const SECTOR_DEG      = 360 / SECTOR_COUNT; // 15°

/* ─────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────── */
let wheelSectors  = [];   // array of category indices (0–3), length 24
let wheelAngle    = 0;    // accumulated rotation in degrees
let isSpinning    = false;
let currentTheme  = 'dark';

/* ─────────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────────── */
(function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const html = document.documentElement;
  const STORAGE_KEY = 'guild-theme';

  // Restore saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    html.setAttribute('data-theme', 'light');
    currentTheme = 'light';
  }

  if (!btn) return;

  btn.addEventListener('click', () => {
    if (currentTheme === 'dark') {
      html.setAttribute('data-theme', 'light');
      currentTheme = 'light';
    } else {
      html.removeAttribute('data-theme');
      currentTheme = 'dark';
    }
    localStorage.setItem(STORAGE_KEY, currentTheme);
    // Redraw wheel in new theme colours
    drawWheel(wheelAngle);
  });
})();


/* ─────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────── */
(function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  burger.addEventListener('click', () => {
    const isOpen = mobile.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  mobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobile.classList.remove('is-open');
      burger.setAttribute('aria-expanded', false);
    });
  });
})();


/* ─────────────────────────────────────────────────────────
   VIDEO BEAR
───────────────────────────────────────────────────────── */
(function initVideo() {
  const btn   = document.getElementById('soundBtn');
  const video = document.getElementById('totemVideo');
  if (!btn || !video) return;

  let playing = false;

  btn.addEventListener('click', () => {
    if (playing) {
      video.pause();
      video.muted = true;
      btn.innerHTML = '<span class="hero__sound-icon">&#9654;</span> Разбудить Хранителя';
      playing = false;
    } else {
      video.muted = false;
      video.play().catch(() => { video.muted = true; video.play(); });
      btn.innerHTML = '<span class="hero__sound-icon">⏸</span> Усыпить Хранителя';
      playing = true;
    }
  });

  video.addEventListener('ended', () => {
    playing = false;
    btn.innerHTML = '<span class="hero__sound-icon">&#9654;</span> Разбудить Хранителя';
  });
})();


/* ─────────────────────────────────────────────────────────
   CANVAS WHEEL — DRAW
───────────────────────────────────────────────────────── */
const canvas  = document.getElementById('totemWheel');
const ctx     = canvas ? canvas.getContext('2d') : null;

/* Shuffle 24 sectors (6 per category, Fisher–Yates) */
function buildSectors() {
  const arr = [];
  for (let c = 0; c < CATEGORIES.length; c++) {
    for (let s = 0; s < SECTORS_PER_CAT; s++) arr.push(c);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Neutral metallic sector base (no per-category colour). */
function sectorNeutralHex(altIdx) {
  if (currentTheme === 'light') {
    return altIdx ? '#d4cdc0' : '#e8e2d6';
  }
  return altIdx ? '#151311' : '#1e1b17';
}

/** Subtle lighten / darken for sector gradients (#rrggbb). */
function shadeColor(hex, factor) {
  const h = hex.replace('#', '');
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  if (factor < 0) {
    const m = 1 + factor * 0.45;
    r = Math.max(0, Math.min(255, Math.round(r * m)));
    g = Math.max(0, Math.min(255, Math.round(g * m)));
    b = Math.max(0, Math.min(255, Math.round(b * m)));
  } else {
    r = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor * 0.28)));
    g = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor * 0.28)));
    b = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor * 0.28)));
  }
  return `rgb(${r},${g},${b})`;
}

/** Category name along bisector: first letter at outer edge, last toward centre. */
function drawCategoryNameRadial(catIdx, midAngle, cx, cy, R, Ri) {
  const word  = CATEGORIES[catIdx].name;
  const chars = Array.from(word);
  const rOuter = R - 9;
  const rInner = Ri + 12;
  const band   = Math.max(rOuter - rInner, 1);
  const halfRad = (SECTOR_DEG / 2) * (Math.PI / 180);
  const step = band / (chars.length + 0.35);

  let fontPx = Math.min(10, Math.max(5, Math.floor(step * 0.9)));

  const textColor = currentTheme === 'light'
    ? 'rgba(72, 52, 28, 0.92)'
    : 'rgba(212, 176, 110, 0.92)';

  function fitsAt(size) {
    ctx.font = `500 ${size}px "Cinzel", "Georgia", serif`;
    return chars.every((ch, k) => {
      const r = rOuter - step * (k + 0.5);
      const chord = 2 * r * Math.sin(halfRad);
      return ctx.measureText(ch).width <= chord * 0.9;
    });
  }

  while (fontPx > 5 && !fitsAt(fontPx)) fontPx--;

  ctx.font         = `500 ${fontPx}px "Cinzel", "Georgia", serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  chars.forEach((ch, k) => {
    const r = rOuter - step * (k + 0.5);
    const x = cx + Math.cos(midAngle) * r;
    const y = cy + Math.sin(midAngle) * r;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = textColor;
    if (currentTheme === 'dark') {
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 1.5;
      ctx.shadowOffsetY = 0.5;
    }
    ctx.fillText(ch, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

function drawWheel(angleDeg) {
  if (!ctx) return;

  const DPR = window.devicePixelRatio || 1;
  const W   = canvas.width  / DPR;   // logical size
  const H   = canvas.height / DPR;
  const cx  = W / 2;
  const cy  = H / 2;
  const R   = cx - 8;                // outer radius (inset for jewelled rim)
  const Ri  = R * 0.295;             // inner "hole" radius (medallion covers it)

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startDeg = -90 + angleDeg;   // sector 0 begins at 12 o'clock

  wheelSectors.forEach((catIdx, i) => {
    const s1 = (startDeg + i * SECTOR_DEG) * (Math.PI / 180);
    const s2 = (startDeg + (i + 1) * SECTOR_DEG) * (Math.PI / 180);
    const midAngle = s1 + (s2 - s1) / 2;

    const altIdx = Math.floor(i / 2) % 2;
    const base   = sectorNeutralHex(altIdx);
    const x0 = cx + Math.cos(midAngle) * Ri;
    const y0 = cy + Math.sin(midAngle) * Ri;
    const x1 = cx + Math.cos(midAngle) * (R - 1.5);
    const y1 = cy + Math.sin(midAngle) * (R - 1.5);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, shadeColor(base, -0.38));
    g.addColorStop(0.5, base);
    g.addColorStop(1, shadeColor(base, currentTheme === 'light' ? 0.22 : 0.18));

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, s1, s2);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = currentTheme === 'light'
      ? 'rgba(139,115,73,0.28)'
      : 'rgba(197,160,89,0.22)';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R - 1.2, s1, s2);
    ctx.strokeStyle = currentTheme === 'light'
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    drawCategoryNameRadial(catIdx, midAngle, cx, cy, R, Ri);
  });

  ctx.beginPath();
  ctx.arc(cx, cy, R + 2.5, 0, Math.PI * 2);
  ctx.strokeStyle = currentTheme === 'light'
    ? 'rgba(139,115,73,0.35)'
    : 'rgba(197,160,89,0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, R + 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = currentTheme === 'light'
    ? 'rgba(212,176,110,0.65)'
    : 'rgba(212,176,110,0.55)';
  ctx.lineWidth = 1.35;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
  ctx.strokeStyle = currentTheme === 'light'
    ? 'rgba(92,61,17,0.2)'
    : 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, Ri, 0, Math.PI * 2);
  const innerG = ctx.createRadialGradient(
    cx - Ri * 0.25, cy - Ri * 0.25, 0,
    cx, cy, Ri
  );
  if (currentTheme === 'light') {
    innerG.addColorStop(0, '#FAF8F4');
    innerG.addColorStop(1, '#EDE7D9');
  } else {
    innerG.addColorStop(0, '#1E1A16');
    innerG.addColorStop(1, '#121212');
  }
  ctx.fillStyle = innerG;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, Ri, 0, Math.PI * 2);
  ctx.strokeStyle = currentTheme === 'light'
    ? 'rgba(139,115,73,0.45)'
    : 'rgba(197,160,89,0.5)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, Ri - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = currentTheme === 'light'
    ? 'rgba(255,255,255,0.35)'
    : 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/* Handle HiDPI / retina screens — один размер для обёртки и canvas (без конфликта с CSS). */
function setupCanvas() {
  if (!canvas) return;
  const DPR  = window.devicePixelRatio || 1;
  const cap  = window.innerWidth >= 720 ? 420 : 360;
  const gutter = window.innerWidth <= 420 ? 32 : 48;
  const size = Math.min(cap, Math.max(260, window.innerWidth - gutter));

  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
  canvas.width  = Math.round(size * DPR);
  canvas.height = Math.round(size * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const wrap = canvas.closest('.totem__wheel-wrap');
  if (wrap) {
    wrap.style.width  = size + 'px';
    wrap.style.height = size + 'px';
  }
}


/* ─────────────────────────────────────────────────────────
   CANVAS WHEEL — SPIN LOGIC
───────────────────────────────────────────────────────── */
(function initTotem() {
  if (!canvas || !ctx) return;

  // Build sectors and initial draw
  wheelSectors = buildSectors();
  setupCanvas();
  drawWheel(0);

  window.addEventListener('resize', () => {
    setupCanvas();
    drawWheel(wheelAngle);
  });

  const spinBtn    = document.getElementById('totemSpinBtn');
  const resultBox  = document.getElementById('totemResultBox');
  const resultText = document.getElementById('totemResultText');
  const followBtn  = document.getElementById('followBtn');

  if (!spinBtn) return;

  spinBtn.addEventListener('click', spin);

  function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // 1. Pick weighted category
    const chosen = pickWeightedCategory();

    // 2. Find all sector indices matching chosen category
    const catIdx      = CATEGORIES.indexOf(chosen);
    const matching    = wheelSectors
      .map((c, i) => c === catIdx ? i : -1)
      .filter(i => i !== -1);
    const targetSector = matching[Math.floor(Math.random() * matching.length)];

    // 3. Calculate target angle:
    //    After total rotation R, sector at top = floor(((-R % 360 + 360) % 360) / 15)
    //    We want center of targetSector at top (pointer):
    //    -R ≡ targetSector * SECTOR_DEG + SECTOR_DEG/2  (mod 360)
    //    R  = fullRotations*360 - targetSector*15 - 7.5

    const sectorCenter   = targetSector * SECTOR_DEG + SECTOR_DEG / 2;
    const normalised     = (((-sectorCenter) % 360) + 360) % 360;
    const currentMod     = ((wheelAngle % 360) + 360) % 360;
    let   delta          = normalised - currentMod;
    if (delta <= 10) delta += 360;  // ensure forward spin

    const fullRotations  = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle    = wheelAngle + fullRotations + delta;

    // 4. Animate with GSAP if available, else manual rAF
    if (window.gsap) {
      const proxy = { val: wheelAngle };
      gsap.to(proxy, {
        val:      targetAngle,
        duration: 4.5,
        ease:     'power4.out',
        onUpdate() {
          wheelAngle = proxy.val;
          drawWheel(wheelAngle);
        },
        onComplete: () => showResult(chosen),
      });
    } else {
      animateSpin(wheelAngle, targetAngle, 4500, showResult.bind(null, chosen));
    }
  }

  /* Fallback animation (no GSAP) */
  function animateSpin(from, to, duration, onDone) {
    const start = performance.now();
    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      wheelAngle = from + (to - from) * easeOut(t);
      drawWheel(wheelAngle);
      if (t < 1) requestAnimationFrame(frame);
      else onDone();
    }
    requestAnimationFrame(frame);
  }

  function showResult(chosen) {
    isSpinning = false;
    spinBtn.disabled  = false;
    spinBtn.textContent = 'Спросить снова';

    resultText.textContent = chosen.name;
    if (followBtn) followBtn.href = chosen.anchor;

    resultBox.hidden = false;
    resultBox.removeAttribute('hidden');

    // Smooth scroll into view
    setTimeout(() => {
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);

    // Pulse medallion
    const med = document.getElementById('totemMedallion');
    if (med && window.gsap) {
      gsap.fromTo(med, { scale: 0.85 }, {
        scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)',
      });
    }
  }
})();


/* ─────────────────────────────────────────────────────────
   WEIGHTED RANDOM
───────────────────────────────────────────────────────── */
function pickWeightedCategory() {
  const r = Math.random();
  let cumulative = 0;
  for (const cat of CATEGORIES) {
    cumulative += cat.weight;
    if (r < cumulative) return cat;
  }
  return CATEGORIES[CATEGORIES.length - 1];
}


/* ─────────────────────────────────────────────────────────
   VITRINE TOGGLES
───────────────────────────────────────────────────────── */
(function initVitrines() {
  document.querySelectorAll('.js-vitrine-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('aria-controls');
      const panel   = document.getElementById(panelId);
      const isOpen  = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      document.querySelectorAll('.js-vitrine-toggle').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.textContent = 'Открыть витрину';
          const op = document.getElementById(other.getAttribute('aria-controls'));
          if (op) op.classList.remove('is-open');
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      btn.textContent = isOpen ? 'Открыть витрину' : 'Закрыть витрину';
      if (panel) panel.classList.toggle('is-open', !isOpen);

      if (!isOpen) {
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
      }
    });
  });
})();


/* ─────────────────────────────────────────────────────────
   BEAR ASSEMBLY — scroll-scrubbed video (sticky track)
───────────────────────────────────────────────────────── */
function initBearAssemblyScrub() {
  const track = document.getElementById('heroBearScrollTrack');
  const video = document.getElementById('bearAssemblyVideo');
  const hint  = document.getElementById('bearScrollHint');
  const ST = window.ScrollTrigger;
  if (!track || !video || !ST) return;

  const inverted = track.getAttribute('data-bear-scroll-inverted') === 'true';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    const settle = () => {
      if (!video.duration || isNaN(video.duration)) return;
      video.currentTime = inverted ? 0 : Math.max(0, video.duration - 0.04);
    };
    if (video.readyState >= 1) settle();
    else video.addEventListener('loadedmetadata', settle, { once: true });
    return;
  }

  video.pause();

  let targetTime = 0;
  let rafId = null;

  const prefersCoarse = window.matchMedia('(pointer: coarse)').matches;
  const lowBandwidthScroll = window.matchMedia('(max-width: 768px)').matches;

  function applyVideoTime() {
    rafId = null;
    if (!video.duration || isNaN(video.duration)) return;
    const t = Math.max(0, Math.min(video.duration, targetTime));
    try {
      video.currentTime = t;
    } catch (e) { /* ignore */ }
  }

  function queueSeek(t) {
    targetTime = t;
    if (rafId != null) return;
    rafId = requestAnimationFrame(applyVideoTime);
  }

  ST.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    scrub: prefersCoarse || lowBandwidthScroll ? 1.15 : 0.55,
    onUpdate: (self) => {
      const p = self.progress;
      if (!video.duration || isNaN(video.duration)) return;
      const t = inverted ? (1 - p) * video.duration : p * video.duration;
      queueSeek(t);
      if (hint) hint.classList.toggle('is-faded', p > 0.14);
    },
  });

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => ST.refresh(), 150);
  }, { passive: true });

  video.addEventListener('loadedmetadata', () => {
    ST.refresh();
    try {
      video.currentTime = inverted ? Math.max(0, video.duration - 0.02) : 0;
    } catch (e) { /* ignore */ }
  });
}


/* ─────────────────────────────────────────────────────────
   GSAP SCROLL ANIMATIONS
───────────────────────────────────────────────────────── */
(function initAnimations() {
  function tryInit() {
    if (!window.gsap || !window.ScrollTrigger) {
      setTimeout(tryInit, 100);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    initBearAssemblyScrub();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.gs-reveal', { opacity: 1, y: 0 });
      return;
    }

    // Batch reveals
    ScrollTrigger.batch('.gs-reveal', {
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out',
      }),
      start: 'top 90%',
      once:  true,
    });

    // Hero headline (above fold)
    gsap.to('#heroHeadline .gs-reveal', {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: 'power3.out', delay: 0.3,
    });

    // Wheel wrap
    gsap.from('.totem__wheel-wrap.gs-reveal', {
      scale: 0.88, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#totem-wheel-premium', start: 'top 75%', once: true },
    });

    // About deco rings
    gsap.from('.about__deco-ring', {
      scale: 0, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.about', start: 'top 72%', once: true },
    });

    // Nav
    gsap.from('.nav', { y: -24, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
  }
  tryInit();
})();


/* ─────────────────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
───────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
