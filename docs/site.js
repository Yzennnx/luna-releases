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

if (typeof document !== 'undefined') {
  const visitor = visitorFrom(navigator.userAgent);
  for (const el of document.querySelectorAll('[data-visitor]')) {
    el.hidden = el.dataset.visitor !== visitor;
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
    setInterval(() => paint((left = nextLeft(left))), 1000);
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
