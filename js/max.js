'use strict';

const MAX = (() => {
  const WA = window.WebApp;
  const PLATFORMS = ['ios', 'android', 'desktop', 'web'];
  const isInMax = !!WA && PLATFORMS.includes(WA.platform);

  // startapp-параметр → якорь на странице
  const DEEP_LINK_MAP = {
    hero:       '#hero',
    creator:    '#creator',
    jewelry:    '#jewelry',
    decor:      '#decor',
    sweet:      '#sweet',
    food:       '#food',
    excursion:  '#yaroslavl-excursion',
  };

  function init() {
    if (!isInMax) return;

    document.documentElement.classList.add('in-max');

    handleStartParam();
    setupBackButton();
    revealShareButtons();
  }

  function handleStartParam() {
    const param = WA.initDataUnsafe?.start_param;
    if (!param) return;
    const target = DEEP_LINK_MAP[param];
    if (!target) return;
    setTimeout(() => {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }

  function setupBackButton() {
    const btn = WA.BackButton;
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) btn.show();
      else btn.hide();
    }, { passive: true });

    btn.onClick(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function revealShareButtons() {
    document.querySelectorAll('[data-max-share]').forEach(el => {
      el.hidden = false;
      el.addEventListener('click', share);
    });
  }

  function share() {
    if (!isInMax || !WA.shareMaxContent) return;
    WA.shareMaxContent({
      type: 'text',
      text: 'Медведь-Хранитель ждёт тебя — сувенир с душой ярославских мастеров: https://ilyayar1986.github.io/sait_bear/',
    });
  }

  return { init, isInMax };
})();

document.addEventListener('DOMContentLoaded', () => MAX.init());
