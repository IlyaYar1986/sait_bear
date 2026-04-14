/* ═══════════════════════════════════════════════════════════
   ГИЛЬДИЯ МАСТЕРОВ ЯРОСЛАВИИ — main.js
   Nav · Theme · Video · Wheel · Vitrines · GSAP
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   PERFORMANCE — слабые устройства, экономия трафика, reduced motion
───────────────────────────────────────────────────────── */
function detectPerfProfile() {
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const mem = navigator.deviceMemory;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!(conn && conn.saveData);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowMem = typeof mem === 'number' && mem <= 4;
  const lowCores = cores <= 4;
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const lowEnd = reduced || saveData || lowMem || (narrow && coarse && lowCores);
  return {
    lowEnd,
    reducedMotion: reduced,
    saveData,
    coarse,
    narrow,
  };
}

const PERF = detectPerfProfile();
if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.classList.toggle('perf-low', PERF.lowEnd);
}

/* ─────────────────────────────────────────────────────────
   THEME STATE
───────────────────────────────────────────────────────── */
let currentTheme = 'dark';

/* ─────────────────────────────────────────────────────────
   TOTEM WHEEL — как в 1index.html (цветные секторы, гравировка, CSS‑вращение)
───────────────────────────────────────────────────────── */
const TOTEM_CATEGORIES = [
  { name: 'Украшения', link: '#jewelry' },
  { name: 'Декор', link: '#decor' },
  { name: 'Сладости', link: '#sweet' },
  { name: 'Угощения', link: '#food' },
];

/** Порядок секторов совпадает с 1index.html (25 секторов). */
const TOTEM_SECTOR_LABELS = [
  'Украшения', 'Декор', 'Сладости', 'Угощения',
  'Украшения', 'Сладости', 'Декор', 'Угощения',
  'Украшения', 'Декор', 'Сладости', 'Угощения',
  'Украшения', 'Сладости', 'Декор', 'Угощения',
  'Украшения', 'Декор', 'Сладости', 'Угощения',
  'Украшения', 'Сладости', 'Декор', 'Угощения',
  'Украшения',
];

const totemPaletteDark = {
  Украшения: { base: '#2e2820', line: 'rgba(197,160,89,0.2)', dot: 'rgba(197,160,89,0.12)' },
  Декор: { base: '#252015', line: 'rgba(197,160,89,0.18)', dot: 'rgba(197,160,89,0.1)' },
  Сладости: { base: '#322a20', line: 'rgba(212,176,110,0.2)', dot: 'rgba(212,176,110,0.12)' },
  Угощения: { base: '#1e1a14', line: 'rgba(197,160,89,0.16)', dot: 'rgba(197,160,89,0.09)' },
};

const totemPaletteLight = {
  Украшения: { base: '#e5dfd6', line: 'rgba(143,107,42,0.24)', dot: 'rgba(143,107,42,0.14)' },
  Декор: { base: '#ded7ce', line: 'rgba(143,107,42,0.22)', dot: 'rgba(143,107,42,0.12)' },
  Сладости: { base: '#ebe4d8', line: 'rgba(166,124,50,0.3)', dot: 'rgba(166,124,50,0.18)' },
  Угощения: { base: '#e2dcd3', line: 'rgba(143,107,42,0.22)', dot: 'rgba(143,107,42,0.11)' },
};

const totemChrome = {
  dark: {
    outerRing: 'rgba(197,160,89,0.15)',
    innerGuide: 'rgba(255,255,255,0.04)',
    rimDot: 'rgba(197,160,89,0.18)',
    sectorEdge: 'rgba(197,160,89,0.14)',
    label: '#d4c4a8',
    ring1: 'rgba(197,160,89,0.14)',
    ring2: 'rgba(255,255,255,0.04)',
    innerDot: 'rgba(197,160,89,0.12)',
  },
  light: {
    outerRing: 'rgba(143,107,42,0.24)',
    innerGuide: 'rgba(80,72,60,0.12)',
    rimDot: 'rgba(143,107,42,0.26)',
    sectorEdge: 'rgba(143,107,42,0.22)',
    label: '#4a3818',
    ring1: 'rgba(143,107,42,0.22)',
    ring2: 'rgba(80,72,60,0.1)',
    innerDot: 'rgba(143,107,42,0.16)',
  },
};

const totemCategoryDative = {
  Украшения: 'Украшениям',
  Декор: 'Декору',
  Сладости: 'Сладостям',
  Угощения: 'Угощениям',
};

let totemLogicalSize = 420;
let totemCurrentRotationDeg = 0;

function totemResolvedLight() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light') return true;
  if (t === 'dark') return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

function getTotemPalette() {
  return totemResolvedLight() ? totemPaletteLight : totemPaletteDark;
}

function getTotemChrome() {
  return totemResolvedLight() ? totemChrome.light : totemChrome.dark;
}

function totemScale() {
  return totemLogicalSize / 420;
}

function totemCategoryLink(name) {
  const found = TOTEM_CATEGORIES.find((c) => c.name === name);
  return found ? found.link : '#';
}

function totemPickWinnerIndex() {
  const sectorCount = TOTEM_SECTOR_LABELS.length;
  const r = Math.random();
  let targetLabel;
  if (r < 0.4) {
    targetLabel = 'Украшения';
  } else {
    const t = (r - 0.4) / 0.6;
    const j = Math.min(Math.floor(t * 3), 2);
    targetLabel = ['Декор', 'Сладости', 'Угощения'][j];
  }
  const candidates = [];
  for (let i = 0; i < sectorCount; i++) {
    if (TOTEM_SECTOR_LABELS[i] === targetLabel) candidates.push(i);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function totemSpinWaitMs() {
  if (PERF.reducedMotion) return 100;
  if (PERF.lowEnd) return 3400;
  return 5900;
}

function drawTotemWheel() {
  const canvas = document.getElementById('totemWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sectorCount = TOTEM_SECTOR_LABELS.length;
  const s = totemScale();
  const center = totemLogicalSize / 2;
  const radius = 188 * s;
  const arc = (Math.PI * 2) / sectorCount;
  const pal = getTotemPalette();

  ctx.clearRect(0, 0, totemLogicalSize, totemLogicalSize);

  function drawOuterOrnament() {
    const c = getTotemChrome();
    ctx.save();
    ctx.translate(center, center);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6 * s, 0, Math.PI * 2);
    ctx.strokeStyle = c.outerRing;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius - 12 * s, 0, Math.PI * 2);
    ctx.strokeStyle = c.innerGuide;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 50; i++) {
      const a = (Math.PI * 2 / 50) * i;
      const r = radius + 1 * s;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, 1.7 * s, 0, Math.PI * 2);
      ctx.fillStyle = c.rimDot;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSector(startAngle, endAngle, fill) {
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = getTotemChrome().sectorEdge;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  function drawSectorCarving(startAngle, endAngle, lineColor, dotColor) {
    const mid = startAngle + (endAngle - startAngle) / 2;
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(mid);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    for (let r = 52 * s; r <= 160 * s; r += 24 * s) {
      ctx.beginPath();
      ctx.arc(0, 0, r, -0.09, 0.09);
      ctx.stroke();
    }
    for (let r = 70 * s; r <= 154 * s; r += 28 * s) {
      ctx.beginPath();
      ctx.arc(r, 0, 2 * s, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(46 * s, 0);
    ctx.bezierCurveTo(70 * s, -10 * s, 98 * s, -10 * s, 120 * s, 0);
    ctx.bezierCurveTo(98 * s, 10 * s, 70 * s, 10 * s, 46 * s, 0);
    ctx.strokeStyle = lineColor;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(86 * s, 0);
    ctx.bezierCurveTo(96 * s, -6 * s, 108 * s, -6 * s, 118 * s, 0);
    ctx.bezierCurveTo(108 * s, 6 * s, 96 * s, 6 * s, 86 * s, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawSectorText(startAngle, label) {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = getTotemChrome().label;
    const fontPx = Math.max(8, Math.round(11 * s));
    ctx.font = `600 ${fontPx}px "DM Sans", sans-serif`;
    ctx.fillText(label, radius - 18 * s, 4 * s);
    ctx.restore();
  }

  function drawInnerRings() {
    const c = getTotemChrome();
    ctx.save();
    ctx.translate(center, center);
    ctx.beginPath();
    ctx.arc(0, 0, 62 * s, 0, Math.PI * 2);
    ctx.strokeStyle = c.ring1;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 78 * s, 0, Math.PI * 2);
    ctx.strokeStyle = c.ring2;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const a = (Math.PI * 2 / 20) * i;
      const x = Math.cos(a) * 70 * s;
      const y = Math.sin(a) * 70 * s;
      ctx.beginPath();
      ctx.arc(x, y, 1.8 * s, 0, Math.PI * 2);
      ctx.fillStyle = c.innerDot;
      ctx.fill();
    }
    ctx.restore();
  }

  drawOuterOrnament();
  for (let i = 0; i < sectorCount; i++) {
    const startAngle = i * arc - Math.PI / 2;
    const endAngle = startAngle + arc;
    const label = TOTEM_SECTOR_LABELS[i];
    const colors = pal[label] || pal.Украшения;
    drawSector(startAngle, endAngle, colors.base);
    drawSectorCarving(startAngle, endAngle, colors.line, colors.dot);
    drawSectorText(startAngle, label);
  }
  drawInnerRings();
}

function setupTotemCanvas() {
  const canvas = document.getElementById('totemWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rawDpr = window.devicePixelRatio || 1;
  const capDpr = PERF.lowEnd ? 1.25 : Math.min(rawDpr, 2.5);
  const DPR = Math.max(1, Math.min(rawDpr, capDpr));
  const cap = window.innerWidth >= 720 ? 420 : 360;
  const gutter = window.innerWidth <= 420 ? 32 : 48;
  const size = Math.min(cap, Math.max(260, window.innerWidth - gutter));

  totemLogicalSize = size;

  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = Math.round(size * DPR);
  canvas.height = Math.round(size * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const stage = document.querySelector('.totem-wheel-stage');
  if (stage) stage.style.setProperty('--totem-shell', `${size}px`);

  canvas.style.transform = `rotate(${totemCurrentRotationDeg}deg)`;
}

/* ─────────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────────── */
(function initTheme() {
  const buttons = document.querySelectorAll('.js-theme-toggle');
  const html = document.documentElement;
  const STORAGE_KEY = 'guild-theme';

  // Restore saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    html.setAttribute('data-theme', 'light');
    currentTheme = 'light';
  }

  if (!buttons.length) return;

  function applyThemeToggle() {
    if (currentTheme === 'dark') {
      html.setAttribute('data-theme', 'light');
      currentTheme = 'light';
    } else {
      html.removeAttribute('data-theme');
      currentTheme = 'dark';
    }
    localStorage.setItem(STORAGE_KEY, currentTheme);
    drawTotemWheel();
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', applyThemeToggle);
  });
})();


/* ─────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────── */
(function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');
  if (!nav || !burger || !mobile) return;

  const menuLabel = burger.querySelector('.nav__burger-label');

  function setMenuOpen(isOpen) {
    mobile.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    if (menuLabel) menuLabel.textContent = isOpen ? 'Закрыть' : 'Меню';
  }

  let navScrollTick = false;
  window.addEventListener('scroll', () => {
    if (navScrollTick) return;
    navScrollTick = true;
    requestAnimationFrame(() => {
      navScrollTick = false;
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    });
  }, { passive: true });

  burger.addEventListener('click', () => {
    setMenuOpen(!mobile.classList.contains('is-open'));
  });

  mobile.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  function closeMenuIfDesktop() {
    if (window.innerWidth > 680 && mobile.classList.contains('is-open')) {
      setMenuOpen(false);
    }
  }
  window.addEventListener('resize', closeMenuIfDesktop, { passive: true });
  closeMenuIfDesktop();
})();


/* ─────────────────────────────────────────────────────────
   VIDEO BEAR
───────────────────────────────────────────────────────── */
(function initVideo() {
  const btn   = document.getElementById('soundBtn');
  const video = document.getElementById('totemVideo');
  const wrap  = document.getElementById('guardianVideo');
  const cta   = document.getElementById('heroVideoCta');
  if (!btn || !video || !wrap) return;

  if (PERF.lowEnd || PERF.saveData) {
    video.preload = 'none';
    video.setAttribute('preload', 'none');
  }

  btn.addEventListener('click', () => {
    wrap.classList.add('hero__video-wrap--awake');
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
    if (cta && cta.parentNode) {
      cta.parentNode.removeChild(cta);
    }
  });
})();


/* ─────────────────────────────────────────────────────────
   TOTEM WHEEL — инициализация и вращение (как 1index.html, CSS transform)
───────────────────────────────────────────────────────── */
(function initTotem() {
  const canvas = document.getElementById('totemWheelCanvas');
  if (!canvas || !canvas.getContext) return;

  let isSpinning = false;

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!document.documentElement.getAttribute('data-theme')) {
      drawTotemWheel();
    }
  });

  setupTotemCanvas();
  drawTotemWheel();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupTotemCanvas();
      drawTotemWheel();
      canvas.style.transform = `rotate(${totemCurrentRotationDeg}deg)`;
    }, 120);
  }, { passive: true });

  const spinBtn = document.getElementById('totemSpinBtn');
  const resultBox = document.getElementById('totemResultBox');
  const resultText = document.getElementById('totemResultText');
  const followBtn = document.getElementById('followBtn');
  const chooseBtn = document.getElementById('chooseBtn');

  if (!spinBtn) return;

  spinBtn.addEventListener('click', spinTotem);

  function spinTotem() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    resultBox.hidden = true;
    resultBox.setAttribute('hidden', '');

    const sectorCount = TOTEM_SECTOR_LABELS.length;
    const winnerIndex = totemPickWinnerIndex();
    const sectorAngle = 360 / sectorCount;
    const targetAngle = 360 - (winnerIndex * sectorAngle + sectorAngle / 2);
    const currentNormalized = ((totemCurrentRotationDeg % 360) + 360) % 360;
    const deltaToTarget = ((targetAngle - currentNormalized) + 360) % 360;
    const extraSpins = 360 * (6 + Math.floor(Math.random() * 3));
    const totalRotation = extraSpins + deltaToTarget;
    totemCurrentRotationDeg += totalRotation;
    canvas.style.transform = `rotate(${totemCurrentRotationDeg}deg)`;

    const wait = totemSpinWaitMs();
    window.setTimeout(() => {
      const winner = TOTEM_SECTOR_LABELS[winnerIndex];
      const winnerDat = totemCategoryDative[winner] || winner;
      resultText.textContent = 'Хранитель ведёт к: ' + winnerDat;
      if (followBtn) followBtn.href = totemCategoryLink(winner);
      if (chooseBtn) chooseBtn.href = '#choose-path';

      resultBox.hidden = false;
      resultBox.removeAttribute('hidden');

      isSpinning = false;
      spinBtn.disabled = false;

      setTimeout(() => {
        resultBox.scrollIntoView({
          behavior: PERF.lowEnd || PERF.reducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }, 150);

      const med = document.getElementById('totemMedallion');
      if (med && window.gsap) {
        if (PERF.lowEnd) {
          gsap.fromTo(med, { scale: 0.96 }, { scale: 1, duration: 0.25, ease: 'power2.out' });
        } else {
          gsap.fromTo(med, { scale: 0.85 }, {
            scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)',
          });
        }
      }
    }, wait);
  }
})();

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
        setTimeout(() => {
          panel.scrollIntoView({
            behavior: PERF.lowEnd || PERF.reducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
          });
        }, 120);
      }
    });
  });
})();


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
    ScrollTrigger.config({
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
      ignoreMobileResize: true,
    });
    if (PERF.lowEnd && typeof gsap.ticker !== 'undefined' && typeof gsap.ticker.fps === 'function') {
      gsap.ticker.fps(30);
    }

    if (PERF.reducedMotion) {
      gsap.set('.gs-reveal', { opacity: 1, y: 0 });
      return;
    }

    const dFast = PERF.lowEnd ? 0.45 : 0.75;
    const stFast = PERF.lowEnd ? 0.04 : 0.1;

    ScrollTrigger.batch('.gs-reveal', {
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, duration: dFast, stagger: stFast, ease: 'power3.out',
      }),
      start: 'top 90%',
      once:  true,
    });

    gsap.to('.hero__intro .gs-reveal', {
      opacity: 1, y: 0,
      duration: PERF.lowEnd ? 0.55 : 0.9,
      stagger: PERF.lowEnd ? 0.1 : 0.18,
      ease: 'power3.out',
      delay: PERF.lowEnd ? 0.15 : 0.3,
    });

    gsap.from('.about__deco-ring', {
      scale: 0, opacity: 0,
      duration: PERF.lowEnd ? 0.55 : 1,
      stagger: PERF.lowEnd ? 0.08 : 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.about', start: 'top 72%', once: true },
    });

    gsap.from('.nav', {
      y: -24, opacity: 0,
      duration: PERF.lowEnd ? 0.35 : 0.5,
      ease: 'power2.out',
      delay: 0.1,
    });
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
    const smooth = !PERF.lowEnd && !PERF.reducedMotion;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  });
});
