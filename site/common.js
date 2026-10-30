// Shared by both pages: language, theme, starfield and the clock.

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const EMAIL = "mehdiziadi.mzd@gmail.com";
const LINKS = { linkedin: "https://linkedin.com/in/mehdi-ziadi", github: "https://github.com/Schorakbi" };
const CV_PDF = { en: "cv/Mehdi_Ziadi_Resume_EN.pdf", fr: "cv/Mehdi_Ziadi_CV_FR.pdf" };
const LAUNCH = new Date("2025-09-01T09:00:00+01:00"); // first day at SEQUESTO

const COMMON = {
  en: { met: "MET", metTitle: "Time since my first day in production", theme: "Switch light / dark", footNote: "No cookies, no trackers." },
  fr: { met: "MET", metTitle: "Temps écoulé depuis mon premier jour en production", theme: "Basculer clair / sombre", footNote: "Ni cookies, ni traceurs." },
};

function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "fr") return q;
  const saved = store.get("lang");
  if (saved === "en" || saved === "fr") return saved;
  return (navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en";
}

let lang = initialLang();
const langListeners = [];
const t = (dict, key) => dict[lang][key] ?? dict.en[key] ?? key;

// Fills every [data-i18n] element from the page dictionary merged with COMMON.
function applyLang(dict) {
  root.lang = lang;
  const merged = { en: { ...COMMON.en, ...dict.en }, fr: { ...COMMON.fr, ...dict.fr } };
  document.querySelectorAll("[data-i18n]").forEach((n) => (n.innerHTML = t(merged, n.dataset.i18n)));
  document.querySelectorAll("[data-i18n-title]").forEach((n) => (n.title = t(merged, n.dataset.i18nTitle)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((n) => (n.placeholder = t(merged, n.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-label]").forEach((n) => n.setAttribute("aria-label", t(merged, n.dataset.i18nLabel)));
  document.querySelectorAll(".seg [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  if (dict.title) document.title = dict.title[lang];
  langListeners.forEach((f) => f(lang));
}

function initControls(dict) {
  document.querySelectorAll(".seg [data-lang]").forEach((b) => (b.onclick = () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    store.set("lang", lang);
    applyLang(dict);
  }));
  document.getElementById("theme").onclick = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store.set("theme", next);
    sky.toggle();
  };
  applyLang(dict);
  startClock();
  sky.toggle();
}

function startClock() {
  const el = document.getElementById("met");
  if (!el) return;
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    let s = Math.max(0, Math.floor((Date.now() - LAUNCH) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    el.textContent = `T+ ${d}d ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  };
  tick();
  setInterval(tick, 1000);
}

// Starfield, drawn only in dark mode. Static when the visitor prefers reduced motion.
const sky = (() => {
  const c = document.getElementById("sky");
  if (!c) return { toggle() {} };
  const ctx = c.getContext("2d");
  let stars = [], shooting = null, raf = 0, w = 0, h = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 4200) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() ** 3 * 1.3 + 0.25,
      p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
      warm: Math.random() < 0.12,
    }));
  }

  function frame(time) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = reduceMotion ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(s.p + time / 1000 * s.s * 0.6));
      ctx.fillStyle = s.warm ? `rgba(255,200,160,${a})` : `rgba(225,232,255,${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) {
      if (!shooting && Math.random() < 0.0025) shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.4, life: 0 };
      if (shooting) {
        const { x, y, life } = shooting, len = 90, k = life * 9;
        const g = ctx.createLinearGradient(x + k, y + k * 0.45, x + k - len, y + k * 0.45 - len * 0.45);
        g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x + k, y + k * 0.45); ctx.lineTo(x + k - len, y + k * 0.45 - len * 0.45); ctx.stroke();
        if (++shooting.life > 60) shooting = null;
      }
      raf = requestAnimationFrame(frame);
    }
  }

  addEventListener("resize", () => { if (root.dataset.theme === "dark") { resize(); if (reduceMotion) frame(0); } });
  return {
    toggle() {
      cancelAnimationFrame(raf);
      if (root.dataset.theme !== "dark") { ctx.clearRect(0, 0, w, h); return; }
      resize();
      raf = requestAnimationFrame(frame);
    },
  };
})();
