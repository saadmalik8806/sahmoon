/* =========================================
   WEDDING INVITATION – main.js
   ========================================= */

const weddingDate = new Date("2026-11-23T00:00:00");

/* ─────────────────────────────────────────
   VOLUME BUTTON
───────────────────────────────────────── */
const volumeBtn = document.getElementById("volumeBtn");
const bgMusic   = document.getElementById("backgroundMusic");
const iconMute  = volumeBtn ? volumeBtn.querySelector(".volume-icon-mute") : null;
const iconOn    = volumeBtn ? volumeBtn.querySelector(".volume-icon-on")   : null;
let musicPlaying = false;

if (volumeBtn && bgMusic) {
  volumeBtn.addEventListener("click", () => {
    musicPlaying = !musicPlaying;
    if (musicPlaying) {
      bgMusic.play().catch(() => { musicPlaying = false; });
      if (iconMute) iconMute.style.display = "none";
      if (iconOn)   iconOn.style.display   = "block";
    } else {
      bgMusic.pause();
      if (iconMute) iconMute.style.display = "block";
      if (iconOn)   iconOn.style.display   = "none";
    }
  });
}

/* ─────────────────────────────────────────
   SCROLL LOCK  +  HERO TAP-TO-OPEN
   Page is locked on hero until user taps.
───────────────────────────────────────── */
const heroSection       = document.getElementById("hero");
const tapOverlay        = document.getElementById("tapOverlay");
const heroTextContainer = document.getElementById("heroTextContainer");
const video1            = document.getElementById("video1");
const video2            = document.getElementById("video2");

let heroOpened = false;

/* Prevent all scroll methods while locked */
function blockScroll(e) { e.preventDefault(); }

function lockScroll() {
  /* Force page to start at the top on reload */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  
  document.addEventListener("wheel",     blockScroll, { passive: false });
  document.addEventListener("touchmove", blockScroll, { passive: false });
}

function unlockScroll() {
  document.body.classList.remove("scroll-locked");
  document.removeEventListener("wheel",     blockScroll);
  document.removeEventListener("touchmove", blockScroll);
}

function showHeroText() {
  if (heroTextContainer) heroTextContainer.classList.add("visible");
  /* Unlock scroll shortly after text appears */
  setTimeout(unlockScroll, 1000);
}

function transitionToVideo2() {
  if (video1) {
    video1.classList.add("hero-video--hidden");
  }
  if (video2) {
    video2.classList.remove("hero-video--hidden");
    video2.play().catch(() => {});
  }
  showHeroText();
}

/* When intro video finishes, switch to wedding video and show text */
if (video1) {
  video1.addEventListener("ended", transitionToVideo2);
}

function openHero() {
  if (heroOpened) return;
  heroOpened = true;

  if (tapOverlay) tapOverlay.classList.add("hidden");

  /* Play first intro video */
  if (video1) {
    video1.currentTime = 0;
    video1.play().catch(() => {
      /* If video1 fails to play, transition immediately */
      transitionToVideo2();
    });
  } else {
    transitionToVideo2();
  }

  /* Start music */
  if (!musicPlaying && bgMusic) {
    bgMusic.play().then(() => {
      musicPlaying = true;
      if (iconMute) iconMute.style.display = "none";
      if (iconOn)   iconOn.style.display   = "block";
    }).catch(() => {});
  }
}

/* Listen on entire hero section (tap or click anywhere) */
if (heroSection) {
  heroSection.addEventListener("click",      openHero);
  heroSection.addEventListener("touchstart", openHero, { passive: true });
}

/* Apply scroll lock immediately when script runs */
lockScroll();

/* ─────────────────────────────────────────
   SCRATCH HEART CANVAS
   Parametric heart: x = 16 sin³t
                     y = 13 cos t – 5 cos 2t – 2 cos 3t – cos 4t
───────────────────────────────────────── */
const scratchCanvas = document.getElementById("scratchCanvas");
const revealContent = document.getElementById("heartRevealContent");
const saveDateBtn   = document.getElementById("saveDateBtn");
const scratchTitle  = document.getElementById("scratchTitle");
const confettiEl    = document.getElementById("confettiContainer");

let ctx        = null;
let maskCanvas = null;
let maskCtx    = null;
let isDrawing  = false;
let revealed   = false;
let HCX = 0, HCY = 0, HSCALE = 0;

/* One point on parametric heart at angle t */
function hpt(t, cx, cy, sc) {
  return {
    x: cx + sc * 16 * Math.pow(Math.sin(t), 3),
    y: cy - sc * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t))
  };
}

/* Trace the complete heart path into any 2d context */
function tracePath(c, cx, cy, sc) {
  c.beginPath();
  const p0 = hpt(0, cx, cy, sc);
  c.moveTo(p0.x, p0.y);
  for (let i = 1; i <= 200; i++) {
    const p = hpt((i / 200) * Math.PI * 2, cx, cy, sc);
    c.lineTo(p.x, p.y);
  }
  c.closePath();
}

/* Seeded PRNG (Mulberry32) — sparkles look the same every time */
function seededRng(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initScratch() {
  if (!scratchCanvas) return;

  const wrapper = scratchCanvas.closest(".scratch-heart-wrapper");
  const W = wrapper ? wrapper.offsetWidth  : 300;
  const H = wrapper ? wrapper.offsetHeight : 300;

  scratchCanvas.width  = W;
  scratchCanvas.height = H;

  ctx = scratchCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  /* Heart geometry */
  HCX    = W * 0.50;
  HCY    = H * 0.46;
  HSCALE = (Math.min(W, H) * 0.92) / (2 * 16);

  /* Offscreen mask: filled white = inside heart */
  maskCanvas = document.createElement("canvas");
  maskCanvas.width  = W;
  maskCanvas.height = H;
  maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  tracePath(maskCtx, HCX, HCY, HSCALE);
  maskCtx.fillStyle = "#fff";
  maskCtx.fill();

  paintHeart(W, H);
  applyRevealClip(W, H);
}

function paintHeart(W, H) {
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  tracePath(ctx, HCX, HCY, HSCALE);
  ctx.clip();

  /* 1. Deep-to-light radial gradient */
  const g = ctx.createRadialGradient(HCX * 0.80, HCY * 0.68, 0, HCX, HCY, HSCALE * 14);
  g.addColorStop(0.00, "#fce2eb");
  g.addColorStop(0.16, "#f4a2bc");
  g.addColorStop(0.40, "#db6586");
  g.addColorStop(0.68, "#bf3d60");
  g.addColorStop(1.00, "#902040");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  /* 2. Bright shimmer highlight */
  const sh = ctx.createRadialGradient(HCX * 0.76, HCY * 0.63, 0, HCX * 0.76, HCY * 0.63, HSCALE * 8);
  sh.addColorStop(0.00, "rgba(255,255,255,0.62)");
  sh.addColorStop(0.45, "rgba(255,230,242,0.20)");
  sh.addColorStop(1.00, "rgba(255,255,255,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);

  /* 3. Glitter dots */
  const rng1  = seededRng(42);
  const maskD = maskCtx.getImageData(0, 0, W, H).data;
  for (let i = 0; i < 550; i++) {
    const x = rng1() * W;
    const y = rng1() * H;
    const ix = Math.round(x) | 0;
    const iy = Math.round(y) | 0;
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
    if (maskD[(iy * W + ix) * 4 + 3] === 0) continue;
    const r = rng1() * 2.0 + 0.3;
    const a = rng1() * 0.80 + 0.20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,246,251," + a.toFixed(2) + ")";
    ctx.fill();
    if (rng1() > 0.58) {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }
  }

  /* 4. Star-cross flares */
  const rng2 = seededRng(17);
  for (let i = 0; i < 24; i++) {
    const x   = rng2() * W;
    const y   = rng2() * H;
    const ix  = Math.round(x) | 0;
    const iy  = Math.round(y) | 0;
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
    if (maskD[(iy * W + ix) * 4 + 3] === 0) continue;
    const len = rng2() * 10 + 3;
    ctx.save();
    ctx.globalAlpha   = rng2() * 0.65 + 0.25;
    ctx.strokeStyle   = "rgba(255,255,255,0.88)";
    ctx.lineWidth     = 0.8;
    ctx.lineCap       = "round";
    ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x + len, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - len); ctx.lineTo(x, y + len); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  /* 5. Thin border */
  ctx.save();
  tracePath(ctx, HCX, HCY, HSCALE);
  ctx.strokeStyle = "rgba(155, 45, 75, 0.18)";
  ctx.lineWidth   = 3;
  ctx.stroke();
  ctx.restore();
}

/* CSS polygon clip-path for reveal div */
function applyRevealClip(W, H) {
  if (!revealContent) return;
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const p = hpt(t, HCX, HCY, HSCALE);
    pts.push(((p.x / W) * 100).toFixed(2) + "% " + ((p.y / H) * 100).toFixed(2) + "%");
  }
  const cp = "polygon(" + pts.join(",") + ")";
  revealContent.style.clipPath        = cp;
  revealContent.style.webkitClipPath  = cp;
}

/* ── Erase on scratch ── */
function scratch(px, py) {
  if (!ctx || revealed) return;

  const ix = Math.round(px) | 0;
  const iy = Math.round(py) | 0;
  if (maskCtx && ix >= 0 && iy >= 0 && ix < maskCanvas.width && iy < maskCanvas.height) {
    if (maskCtx.getImageData(ix, iy, 1, 1).data[3] === 0) return;
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(px, py, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  checkRevealPct();
}

function checkRevealPct() {
  if (revealed) return;
  const W = scratchCanvas.width, H = scratchCanvas.height;
  const px = ctx.getImageData(0, 0, W, H).data;
  const mk = maskCtx.getImageData(0, 0, W, H).data;
  let inside = 0, erased = 0;
  for (let i = 0; i < px.length; i += 16) {
    if (mk[i + 3] > 0) { inside++; if (px[i + 3] < 40) erased++; }
  }
  if (inside > 0 && erased / inside > 0.45) triggerReveal();
}

function triggerReveal() {
  if (revealed) return;
  revealed = true;
  scratchCanvas.style.transition    = "opacity 0.8s ease";
  scratchCanvas.style.opacity       = "0";
  setTimeout(() => { scratchCanvas.style.pointerEvents = "none"; }, 800);

  revealContent && revealContent.querySelectorAll(
    ".heart-greeting,.heart-date,.heart-day,.heart-time"
  ).forEach(el => { el.style.opacity = "1"; el.style.transform = "scale(1)"; });

  if (scratchTitle) scratchTitle.textContent = "Our forever begins";
  if (saveDateBtn)  saveDateBtn.classList.add("visible");
  launchConfetti();
}

/* ── Pointer / Touch input ── */
function cvPos(e) {
  const r  = scratchCanvas.getBoundingClientRect();
  const sx = scratchCanvas.width  / r.width;
  const sy = scratchCanvas.height / r.height;
  const s  = e.touches ? e.touches[0] : e;
  return { x: (s.clientX - r.left) * sx, y: (s.clientY - r.top) * sy };
}

if (scratchCanvas) {
  scratchCanvas.addEventListener("mousedown",  e => { isDrawing = true;  const p = cvPos(e); scratch(p.x, p.y); });
  scratchCanvas.addEventListener("mousemove",  e => { if (!isDrawing) return; const p = cvPos(e); scratch(p.x, p.y); });
  scratchCanvas.addEventListener("mouseup",    () => { isDrawing = false; });
  scratchCanvas.addEventListener("mouseleave", () => { isDrawing = false; });
  scratchCanvas.addEventListener("touchstart", e => { e.stopPropagation(); e.preventDefault(); isDrawing = true;  const p = cvPos(e); scratch(p.x, p.y); }, { passive: false });
  scratchCanvas.addEventListener("touchmove",  e => { e.stopPropagation(); e.preventDefault(); if (!isDrawing) return; const p = cvPos(e); scratch(p.x, p.y); }, { passive: false });
  scratchCanvas.addEventListener("touchend",   e => { e.stopPropagation(); isDrawing = false; });
}

/* ─────────────────────────────────────────
   CONFETTI BURST
───────────────────────────────────────── */
function launchConfetti() {
  if (!confettiEl) return;
  const colors = ["#ffb6c1","#ff69b4","#db7093","#ffc0cb","#c9506a","#f4a8c0","#e07090","#fff0f5","#8b2342","#d4526a"];
  for (let i = 0; i < 65; i++) {
    const piece  = document.createElement("div");
    piece.className = "confetti-piece";
    const size   = Math.random() * 10 + 5;
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const left   = Math.random() * 100;
    const dur    = Math.random() * 2.0 + 2.5;
    const delay  = Math.random() * 1.0;
    piece.style.cssText = "left:" + left + "%;width:" + size + "px;height:" + size + "px;background:" + color + ";animation-duration:" + dur + "s;animation-delay:" + delay + "s;border-radius:" + (Math.random() > 0.5 ? "50%" : "2px") + ";";
    confettiEl.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + delay + 0.5) * 1000);
  }
}

/* ─────────────────────────────────────────
   COUNTDOWN TIMER
───────────────────────────────────────── */
function updateCountdown() {
  const dEl = document.getElementById("days");
  const hEl = document.getElementById("hours");
  const mEl = document.getElementById("minutes");
  const sEl = document.getElementById("seconds");
  if (!dEl) return;
  const now  = new Date();
  const dist = weddingDate - now;
  if (dist <= 0) {
    [dEl, hEl, mEl, sEl].forEach(el => { if (el) el.textContent = "00"; });
    return;
  }
  const tot = Math.floor(dist / 1000);
  const d = Math.floor(tot / 86400);
  const h = Math.floor((tot % 86400) / 3600);
  const m = Math.floor((tot % 3600) / 60);
  const s = tot % 60;
  if (dEl) dEl.textContent = String(d).padStart(2, "0");
  if (hEl) hEl.textContent = String(h).padStart(2, "0");
  if (mEl) mEl.textContent = String(m).padStart(2, "0");
  if (sEl) sEl.textContent = String(s).padStart(2, "0");
}

/* ─────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────── */
const revealEls = document.querySelectorAll(".reveal-up");
if ("IntersectionObserver" in window && revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0) scale(1)";
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => {
    el.style.opacity   = "0";
    el.style.transform = "translateY(50px) scale(0.98)";
    el.style.transition = "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
    obs.observe(el);
  });
}

/* ─────────────────────────────────────────
   RSVP FORM
───────────────────────────────────────── */
const rsvpForm = document.getElementById("rsvpForm");
if (rsvpForm) {
  rsvpForm.addEventListener("submit", e => {
    e.preventDefault();
    const btn = rsvpForm.querySelector('button[type="submit"]');
    const msg = document.getElementById("formSuccess");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "Sent \u2713";
      btn.disabled = true;
      if (msg) msg.classList.remove("hidden");
      setTimeout(() => {
        rsvpForm.reset();
        btn.textContent = orig;
        btn.disabled = false;
        if (msg) msg.classList.add("hidden");
      }, 2000);
    }
  });
}

/* ─────────────────────────────────────────
   IMAGE SLIDER
───────────────────────────────────────── */
function initSlider() {
  const track = document.getElementById("sliderTrack");
  const dots = document.querySelectorAll(".slider-dots .dot");
  if (!track || dots.length === 0) return;

  let currentIndex = 0;
  const totalSlides = dots.length;

  function goToSlide(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  /* Manual click on dots */
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goToSlide(i));
  });

  /* Auto slide every 3 seconds */
  setInterval(() => {
    let nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  }, 3000);
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
window.addEventListener("load", () => {
  initScratch();
  initSlider();
  updateCountdown();
  setInterval(updateCountdown, 1000);
});
