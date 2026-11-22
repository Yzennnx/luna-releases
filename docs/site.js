// Luna site: shows the right download for the visitor, runs the hero timer, answers the Plus button.
// The pure functions are exported so tests can import this file without a DOM.

export const SESSION_SECONDS = 3000; // the hero session: 50 minutes
export const START_LEFT = 1453; // where the hero timer starts
export const SPEED = 1; // timer seconds per real second
export const APK_URL = 'https://github.com/Yzennnx/luna-releases/releases/latest/download/Luna.apk';
export const EXE_URL = 'https://github.com/Yzennnx/luna-releases/releases/latest/download/Luna-Setup.exe';
export const EXT_URL = 'https://github.com/Yzennnx/luna-releases/releases/latest/download/Luna-Extension.zip';

export const COUNTER_URL = 'https://luna-api-fdcr.onrender.com';
export const COUNTER_URL_LOCAL = 'http://localhost:3210';

// Where the Plus tap is counted: the local server when the page is served from this PC (site:serve), else the hosted one.
export function counterUrl(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' ? COUNTER_URL_LOCAL : COUNTER_URL;
}

export function visitorFrom(ua) {
  return /Android/i.test(ua || '') ? 'android' : 'pc';
}

// Next value of the countdown; loops back to a fresh 50 minutes.
export function nextLeft(left, step = SPEED) {
  const s = Math.max(1, step);
  return left - s <= 0 ? SESSION_SECONDS : left - s;
}

// What the hero shows for `left` seconds remaining.
export function renderVals(left) {
  return {
    mm: String(Math.floor(left / 60)).padStart(2, '0'),
    ss: String(left % 60).padStart(2, '0'),
    petLeft: ((1 - left / SESSION_SECONDS) * 88).toFixed(2) + '%',
  };
}

// Returns true when a clicked link navigates to another page on the same site (eligible for exit transition fallback).
export function isInternalPageLink(href, baseUrl) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
  try {
    const base = new URL(baseUrl);
    const dest = new URL(href, base);
    if (dest.origin !== base.origin) return false;
    if (dest.pathname === base.pathname && dest.search === base.search) return false;
    return /\.html$/i.test(dest.pathname) || dest.pathname.endsWith('/');
  } catch {
    return false;
  }
}

if (typeof document !== 'undefined') {
  const visitor = visitorFrom(navigator.userAgent);
  for (const el of document.querySelectorAll('[data-visitor]')) {
    el.hidden = el.dataset.visitor !== visitor;
  }

  const lp = document.querySelector('.lp');

  // Pause non-essential ambient loops & timer ticks when the tab is hidden.
  const syncVisibility = () => {
    if (lp) lp.classList.toggle('lp-paused', document.hidden);
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  // Fallback page-exit transition for browsers without cross-document @view-transition (e.g. Firefox).
  const hasNativeVT = typeof window !== 'undefined' && 'onpageswap' in window && typeof CSS !== 'undefined' && CSS.supports?.('view-transition-name', 'luna-header');
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (lp && !hasNativeVT && !reducedMotion) {
    window.addEventListener('pageshow', () => lp.classList.remove('lp-leaving'));
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      if (!isInternalPageLink(a.getAttribute('href'), location.href)) return;
      e.preventDefault();
      lp.classList.add('lp-leaving');
      setTimeout(() => { location.href = a.href; }, 170);
    });
  }

  const paint = (left) => {
    const v = renderVals(left);
    document.querySelectorAll('[data-mm]').forEach((e) => (e.textContent = v.mm));
    document.querySelectorAll('[data-ss]').forEach((e) => (e.textContent = v.ss));
    document.querySelectorAll('[data-pet="width"]').forEach((e) => (e.style.width = v.petLeft));
    document.querySelectorAll('[data-pet="left"]').forEach((e) => (e.style.left = v.petLeft));
  };
  const timer = document.querySelector('[data-mm]');
  if (timer) {
    let left = START_LEFT;
    paint(left);
    setInterval(() => {
      if (!document.hidden) paint((left = nextLeft(left)));
    }, 1000);
  }

  // Luna Plus: one anonymous tap is counted (no id, no cookie). The reply is ignored, so the button says thanks either way.
  const plus = document.getElementById('plus-btn');
  if (plus) {
    plus.addEventListener('click', () => {
      try {
        fetch(counterUrl(location.hostname) + '/plus-tap', { method: 'POST', keepalive: true }).catch(() => {});
      } catch {}
      plus.textContent = 'Thanks, noted';
      plus.disabled = true;
    });
  }

  // Scroll reveal: uses IntersectionObserver + bottom-of-page fallback so elements near the bottom never stall at low opacity.
  const targets = [...document.querySelectorAll('.lp .reveal > *, .lp .reveal-self')];
  if (lp && targets.length && typeof IntersectionObserver !== 'undefined') {
    const show = (el) => el.classList.add('is-shown');
    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.96) show(el);
    }
    lp.classList.add('lp-anim');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 40px 0px' },
    );
    for (const el of targets) {
      if (!el.classList.contains('is-shown')) io.observe(el);
    }
    const revealAtBottom = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
        for (const el of targets) show(el);
        window.removeEventListener('scroll', revealAtBottom);
      }
    };
    window.addEventListener('scroll', revealAtBottom, { passive: true });
  }

  // thanks.html: the Windows installer starts downloading as the page opens.
  if (document.body.dataset.autodownload !== undefined) {
    const a = document.createElement('a');
    a.href = EXE_URL;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
