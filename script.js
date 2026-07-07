/* ============================================================
   画像処理同好会 — script.js v2
   主な機能:
   1. 次回例会日（偶数月・第1土曜・14時）の自動計算とカウントダウン
   2. 年間スケジュール表示
   3. スクロール出現アニメーション / 数字カウントアップ
   4. ビフォー/アフター比較スライダー
   5. ギャラリーのライトボックス
   6. ヒーローの粒子アニメーション（マウス連動）
   7. ヘッダー演出・スクロール進捗・ナビ現在地ハイライト
   8. カードのマウス追従グロー
   9. モバイルメニュー / トップへ戻る
   ============================================================ */

"use strict";

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. 例会日の計算 ---------- */

// 指定した年・月（0始まり）の第1土曜日を返す
function firstSaturday(year, month) {
  const d = new Date(year, month, 1);
  const offset = (6 - d.getDay() + 7) % 7; // 土曜=6
  return new Date(year, month, 1 + offset, 14, 0, 0); // 14:00開始
}

// 今日以降で最も近い「偶数月の第1土曜14時」を返す
function nextMeeting(from = new Date()) {
  for (let i = 0; i < 14; i++) {
    const base = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const m = base.getMonth(); // 0始まり: 偶数月(2,4,6...)は m が奇数
    if ((m + 1) % 2 === 0) {
      const mt = firstSaturday(base.getFullYear(), m);
      // 例会終了を16時と見なし、それまでは「次回」として表示
      const end = new Date(mt.getTime() + 2 * 60 * 60 * 1000);
      if (end > from) return mt;
    }
  }
  return null;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateJa(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

const meetingDate = nextMeeting();
const dateEl = document.getElementById("nextMeetingDate");
if (dateEl && meetingDate) dateEl.textContent = formatDateJa(meetingDate);

/* ---------- カウントダウン ---------- */
function updateCountdown() {
  if (!meetingDate) return;
  const diff = meetingDate - new Date();
  const days = Math.max(0, Math.floor(diff / 86400000));
  const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  };
  if (diff <= 0) {
    set("cdDays", 0); set("cdHours", 0); set("cdMins", 0);
    const label = document.querySelector(".meeting-label");
    if (label) label.textContent = "本日開催！";
    return;
  }
  set("cdDays", days); set("cdHours", hours); set("cdMins", mins);
}
updateCountdown();
setInterval(updateCountdown, 30000);

/* ---------- 2. 年間スケジュール（偶数月6回） ---------- */
(function buildSchedule() {
  const strip = document.getElementById("scheduleStrip");
  if (!strip) return;
  const now = new Date();
  const year = now.getFullYear();
  const evenMonths = [1, 3, 5, 7, 9, 11]; // 0始まり → 2,4,6,8,10,12月
  evenMonths.forEach((m) => {
    const d = firstSaturday(year, m);
    const isNext = meetingDate &&
      d.getFullYear() === meetingDate.getFullYear() &&
      d.getMonth() === meetingDate.getMonth();
    const isPast = new Date(d.getTime() + 2 * 3600000) < now && !isNext;
    const div = document.createElement("div");
    div.className = "schedule-item" + (isNext ? " next" : "") + (isPast ? " past" : "");
    div.innerHTML =
      `<span class="month">${m + 1}月</span>` +
      `<span class="day">${d.getDate()}日（土）14:00</span>` +
      (isNext ? `<span class="badge">次回</span>` : "");
    strip.appendChild(div);
  });
})();

/* ---------- 3. スクロール出現アニメーション ---------- */

// グリッド内の要素に時間差をつけて、順番にふわっと現れるようにする
document.querySelectorAll(".cards-grid, .stats, .gallery-grid, .compare-grid, .voices-grid").forEach((grid) => {
  Array.from(grid.children).forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 0.1, 0.5)}s`;
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* ---------- 数字カウントアップ ---------- */
const counters = document.querySelectorAll(".stat-number[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const start = performance.now();
      const dur = 1400;
      (function tick(t) {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
counters.forEach((el) => counterObserver.observe(el));

/* ---------- 4. ビフォー/アフター比較スライダー ---------- */
document.querySelectorAll(".compare").forEach((box) => {
  const range = box.querySelector(".compare-range");
  if (!range) return;
  let interacted = false;

  const setPos = (v) => box.style.setProperty("--pos", `${v}%`);
  range.addEventListener("input", () => {
    interacted = true;
    setPos(range.value);
  });
  setPos(range.value);

  // 初回表示時にハンドルを軽く往復させて操作できることを示す
  if (!REDUCED_MOTION) {
    const demoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        demoObserver.unobserve(box);
        const start = performance.now();
        const dur = 1800;
        (function swing(t) {
          if (interacted) return;
          const p = Math.min((t - start) / dur, 1);
          const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
          range.value = String(v);
          setPos(v);
          if (p < 1) requestAnimationFrame(swing);
        })(start);
      });
    }, { threshold: 0.6 });
    demoObserver.observe(box);
  }
});

/* ---------- 5. ギャラリー ライトボックス ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxBody = document.getElementById("lightboxBody");
const lightboxCaption = document.getElementById("lightboxCaption");

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    const visual = item.querySelector("img");
    if (!visual || !lightbox) return;
    lightboxBody.innerHTML = "";
    const clone = visual.cloneNode(true);
    clone.style.transform = "";
    lightboxBody.appendChild(clone);
    lightboxCaption.textContent = item.dataset.title || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}
document.getElementById("lightboxClose")?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

/* ---------- 6. ヒーロー粒子アニメーション（マウス連動） ---------- */
(function heroParticles() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const COLORS = ["56,189,248", "167,139,250", "244,114,182"];
  const COUNT = Math.min(70, Math.floor(window.innerWidth / 18));
  const LINK_DIST = 130;
  const MOUSE_DIST = 170;

  particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 1,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  // マウス位置（ヒーロー外に出たら遠くへ）
  const mouse = { x: -9999, y: -9999 };
  const hero = canvas.closest(".hero");
  hero?.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero?.addEventListener("pointerleave", () => {
    mouse.x = -9999; mouse.y = -9999;
  });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // 接続線
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = `rgba(${a.c},${(1 - dist / LINK_DIST) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    // 粒子（マウスに近いものは軽く反発し、線でつながる）
    particles.forEach((p) => {
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const mdist = Math.hypot(mdx, mdy);
      if (mdist < MOUSE_DIST) {
        ctx.strokeStyle = `rgba(${p.c},${(1 - mdist / MOUSE_DIST) * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        if (mdist > 0.001) {
          p.vx += (mdx / mdist) * 0.05;
          p.vy += (mdy / mdist) * 0.05;
        }
      }
      // 速度が上がりすぎないよう抑える
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 0.9) {
        p.vx = (p.vx / speed) * 0.9;
        p.vy = (p.vy / speed) * 0.9;
      }
      ctx.fillStyle = `rgba(${p.c},0.8)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
    if (!REDUCED_MOTION) requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- 7. ヘッダー演出・スクロール進捗・ナビ現在地 ---------- */
const siteHeader = document.getElementById("siteHeader");
const scrollProgress = document.getElementById("scrollProgress");
const toTop = document.getElementById("toTop");

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  siteHeader?.classList.toggle("scrolled", y > 30);
  toTop?.classList.toggle("show", y > 600);
  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = max > 0 ? `${(y / max) * 100}%` : "0";
  }
}, { passive: true });

// 表示中のセクションに対応するナビリンクを強調
(function scrollSpy() {
  const links = document.querySelectorAll(".global-nav a[href^='#']");
  if (!links.length) return;
  const map = new Map();
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute("href"));
    if (sec) map.set(sec, a);
  });
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.remove("active"));
      map.get(entry.target)?.classList.add("active");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  map.forEach((_, sec) => spy.observe(sec));
})();

/* ---------- 8. カードのマウス追従グロー ---------- */
document.querySelectorAll(".card, .stat-card, .voice-card").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  });
});

/* ---------- 9. モバイルメニュー / トップへ戻る / 年表示 ---------- */
const navToggle = document.getElementById("navToggle");
const globalNav = document.getElementById("globalNav");
navToggle?.addEventListener("click", () => {
  const open = globalNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
globalNav?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => globalNav.classList.remove("open"))
);

toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
