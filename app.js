// ============================================================
// VIBE CODING BOOTCAMP - app
// ============================================================

const $ = (sel, el = document) => el.querySelector(sel);
const app = $("#app");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- progress (localStorage) ----------
const PROG_KEY = "vcb_progress";
const getProgress = () => { try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch { return {}; } };
const setProgress = (p) => localStorage.setItem(PROG_KEY, JSON.stringify(p));
const toggleDone = (id) => { const p = getProgress(); p[id] = !p[id]; setProgress(p); render(); };

// ---------- 開催日ロック ----------
// 各EPは data.js の date（開催日）の前日 0:00 に解禁される。
const INSTRUCTOR_KEY = "vcb_instructor";
const isInstructorMode = () => localStorage.getItem(INSTRUCTOR_KEY) === "on";
const WD = ["日", "月", "火", "水", "木", "金", "土"];
const fmtD = (d) => `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
const fmtDateJP = (iso) => fmtD(new Date(iso + "T00:00:00"));
function unlockDate(s) {
  const d = new Date(s.date + "T00:00:00");
  d.setDate(d.getDate() - 1); // 前日0:00
  return d;
}
const isLocked = (s) => !!s.date && !isInstructorMode() && new Date() < unlockDate(s);

// 講師モード：ロゴを素早く7回クリックで全ロック解除（READMEに記載・受講者には内緒）
let logoTaps = 0, logoTapTimer = null;
function logoTap() {
  clearTimeout(logoTapTimer);
  logoTaps++;
  logoTapTimer = setTimeout(() => { logoTaps = 0; }, 2500);
  if (logoTaps >= 7) {
    logoTaps = 0;
    const on = !isInstructorMode();
    localStorage.setItem(INSTRUCTOR_KEY, on ? "on" : "off");
    alert(on ? "🎓 講師モード ON ─ 全EPのロックを解除しました" : "🔒 講師モード OFF ─ 開催日ロックが有効になりました");
    render();
  }
}

// ============================================================
// ROUTER
// ============================================================
function render() {
  const hash = location.hash || "#/";
  const m = hash.match(/^#\/session\/(\d+)/);
  if (m) renderSession(parseInt(m[1], 10));
  else if (hash.startsWith("#/gacha")) renderGacha();
  else renderTop();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);

// ============================================================
// TOP PAGE
// ============================================================
function renderTop() {
  const prog = getProgress();
  const doneCount = SESSIONS.filter((s) => prog[s.id]).length;

  app.innerHTML = `
    ${headerHTML()}
    <section class="hero">
      <div class="tagline">AIと汗を流せ。コードは、バイブで書け。</div>
      <h1>VIBE CODING<br><span class="green">BOOTCAMP</span></h1>
      <div class="sub">AIドリブンのシステム開発集中プログラム ─ 全8回 × 60分</div>
      <div class="promise">
        8回参加しても、秒速で1億円は稼げません。<br>
        <b>だが、秒で開発できるようになります。</b>
      </div>
      <div class="pipeline">
        <span>1. VIBE ON</span><span class="arrow">▶</span>
        <span>2. PROMPT</span><span class="arrow">▶</span>
        <span>3. BUILD</span><span class="arrow">▶</span>
        <span>4. VERIFY</span><span class="arrow">▶</span>
        <span>5. SHIP</span><span class="arrow">▶</span>
        <span>6. EVOLVE</span>
      </div>
    </section>

    <h2 class="section-title">MISSION SELECT <span style="font-family:var(--mono);font-size:.75rem;color:var(--dim)">修了 ${doneCount}/8</span></h2>
    <div class="session-grid">
      ${SESSIONS.map((s) => {
        const locked = isLocked(s);
        return `
        <div class="session-card${locked ? " locked" : ""}" style="--card-color:${s.color}" onclick="location.hash='#/session/${s.id}'">
          <div class="code"><span>${s.code}</span><span>${s.date ? fmtDateJP(s.date) : "60 MIN"}</span></div>
          <div class="phase">${esc(s.phase)}</div>
          <h3>${locked ? "？？？" : esc(s.title)}</h3>
          <div class="theme">${locked ? "─ CLASSIFIED ─" : esc(s.theme)}</div>
          ${prog[s.id] ? `<div class="done-stamp">MISSION CLEAR</div>` : ""}
          ${locked ? `<div class="lock-overlay">🔒<small>${fmtD(unlockDate(s))} 0:00 解禁</small></div>` : ""}
        </div>`; }).join("")}
    </div>

    <h2 class="section-title">HAT SYSTEM</h2>
    <div class="panel-row">
      <div class="info-panel">
        <h3>🎩 3つのハット</h3>
        <ul>
          ${Object.values(HATS).map((h) => `
            <li><div class="hat-line"><span class="hat-emoji">${h.emoji}</span>
              <span><b style="color:${h.color}">${h.name}</b><br><span style="color:var(--dim);font-size:.8rem">${esc(h.desc)}</span></span>
            </div></li>`).join("")}
        </ul>
      </div>
      <div class="info-panel">
        <h3>📜 ハットの掟</h3>
        <ul>${HAT_RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      </div>
      <div class="info-panel">
        <h3>🔥 バイブコーディングの心得</h3>
        <ul>${KOKOROE.map((k) => `<li><span class="kokoroe-t">${esc(k.t)}</span><span class="kokoroe-d">${esc(k.d)}</span></li>`).join("")}</ul>
      </div>
    </div>

    <h2 class="section-title">ARMORY</h2>
    <div class="panel-row">
      <div class="info-panel">
        <h3>🎰 お題ガチャ</h3>
        <p style="font-size:.85rem;color:var(--dim);line-height:1.7;margin-bottom:12px">
          AI駆動開発100本ノックから、ビルドスプリントのお題をランダム支給。迷う時間も、もったいない。</p>
        <button class="btn primary" onclick="location.hash='#/gacha'">ガチャを回す ▶</button>
      </div>
      <div class="info-panel">
        <h3>⏱ フリータイマー</h3>
        <p style="font-size:.85rem;color:var(--dim);line-height:1.7;margin-bottom:12px">
          アクティブラーニングは時間が命。任意の時間でカウントダウンを起動。</p>
        <button class="btn primary" onclick="openTimer({title:'FREE TIMER', phase:'ACTIVE LEARNING', minutes:25})">タイマー起動 ▶</button>
      </div>
      <div class="info-panel">
        <h3>📦 事前装備（受講者向け）</h3>
        <ul>
          <li><b>Claude Code</b> セットアップ済みであること</li>
          <li><b>やる気</b>（最重要装備）</li>
          <li>第7回までに <b>GitHubアカウント</b> を用意</li>
        </ul>
      </div>
    </div>

    <div style="text-align:center;margin-top:48px;font-family:var(--stencil);color:var(--dim);letter-spacing:3px">
      NO EXCUSES. JUST BUILD.
    </div>
  `;
}

function headerHTML() {
  return `
    <header class="site-header">
      <a class="site-logo" href="#/" onclick="logoTap()">VIBE CODING BOOTCAMP<small>AI DRIVEN SYSTEM DEVELOPMENT</small></a>
      <div class="header-actions">
        ${isInstructorMode() ? `<span class="auto-badge">🎓 講師モード（全EP解禁中）</span>` : ""}
        <button class="btn" onclick="location.hash='#/gacha'">🎰 お題ガチャ</button>
        <button class="btn" onclick="openTimer({title:'FREE TIMER', phase:'ACTIVE LEARNING', minutes:25})">⏱ タイマー</button>
        <button class="btn bgmBtn" onclick="toggleBgm()">${SOUND.bgm ? "🎵 BGM ON" : "🎵 BGM OFF"}</button>
        <button class="btn sfxBtn" onclick="toggleSfx()">${SOUND.sfx ? "💥 SFX ON" : "💥 SFX OFF"}</button>
      </div>
    </header>`;
}

// ============================================================
// SESSION DETAIL
// ============================================================
function renderSession(id) {
  const s = SESSIONS.find((x) => x.id === id);
  if (!s) { location.hash = "#/"; return; }
  if (isLocked(s)) { renderLockedSession(s); return; } // 解禁前は中身を見せない
  const prog = getProgress();
  let clock = 0;

  const agendaHTML = s.agenda.map((a, i) => {
    const start = clock; clock += a.dur;
    const tm = TYPE_META[a.type]; const hat = HATS[a.hat];
    return `
      <div class="agenda-item">
        <div class="timebox">
          <div class="clock">${fmtClock(start)}〜</div>
          <div class="mins">${a.dur}<small> MIN</small></div>
        </div>
        <div class="body">
          <h4>
            <span class="tag" style="color:${tm.color}">${tm.icon} ${tm.label}</span>
            <span class="hat-chip" title="${esc(hat.desc)}">${hat.emoji} ${hat.name}ハット</span>
            ${esc(a.title)}
          </h4>
          <p>${esc(a.desc)}</p>
        </div>
        <button class="timer-launch" onclick="openBriefing(${s.id}, ${i})">
          ▶ START<br><small>${a.type === "lecture" ? "講義スライド" : `解説 → ⏱ ${a.dur}分`}</small>
        </button>
      </div>`;
  }).join("");

  const prev = SESSIONS.find((x) => x.id === id - 1);
  const next = SESSIONS.find((x) => x.id === id + 1);

  app.innerHTML = `
    ${headerHTML()}
    <div class="breadcrumb"><a href="#/">⬅ MISSION SELECT</a> / ${s.code}</div>
    <section class="session-hero" style="--accent:${s.color}">
      <div class="code-line">${s.code} ─ 60 MIN OPERATION</div>
      <div class="phase-tag">PHASE: ${esc(s.phase)}</div>
      <h2>${esc(s.title)}</h2>
      <div class="subtitle">${esc(s.theme)} ─ ${esc(s.subtitle)}</div>
      <div class="goal-box">
        <div class="goal-item"><b>🎯 MISSION GOAL</b>${esc(s.goal)}</div>
        <div class="goal-item"><b>🏆 持ち帰るもの</b>${esc(s.outcome)}</div>
      </div>
      <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap">
        <button class="btn primary big" onclick="startAutoRun(${s.id})">🔁 FULL AUTO RUN（60分まるごと自動進行）</button>
        <button class="btn big" onclick="openBriefing(${s.id}, -1)">📋 概要ブリーフィングのみ</button>
      </div>
      <p style="margin-top:10px;font-size:.78rem;color:var(--dim);line-height:1.6">
        🔁 FULL AUTO RUN ＝ 概要 → 各パートの解説 → タイマー → 次のパート…と最後まで自動進行（講師不在でも回る）。<br>
        ▶ 各パートのSTART ＝ そのパートだけ解説＋タイマーを起動（途中から再開したいとき用）。</p>
    </section>

    <h2 class="section-title">OPERATION TIMELINE</h2>
    <div class="agenda">${agendaHTML}</div>

    <div class="tips-box"><b>⚠ 講師メモ：</b> ${esc(s.tips)}</div>

    <div class="complete-row">
      <button class="btn big ${prog[s.id] ? "" : "primary"}" onclick="toggleDone(${s.id})">
        ${prog[s.id] ? "✅ MISSION CLEAR 済（取り消す）" : "🏁 この回を MISSION CLEAR にする"}
      </button>
    </div>

    <div class="session-nav">
      ${prev ? `<button class="btn" onclick="location.hash='#/session/${prev.id}'">◀ ${prev.code} ${esc(prev.phase)}</button>` : "<span></span>"}
      ${next ? `<button class="btn" onclick="location.hash='#/session/${next.id}'">${next.code} ${esc(next.phase)} ▶</button>` : `<button class="btn primary" onclick="location.hash='#/'">🎓 全ミッション一覧へ</button>`}
    </div>
  `;
}

const fmtClock = (min) => `${String(Math.floor(min / 60)).padStart(1, "0")}:${String(min % 60).padStart(2, "0")}`;

// 解禁前のEPページ
function renderLockedSession(s) {
  app.innerHTML = `
    ${headerHTML()}
    <div class="breadcrumb"><a href="#/">⬅ MISSION SELECT</a> / ${s.code}</div>
    <section class="locked-hero">
      <div class="lock-big">🔒</div>
      <h2>${s.code} ─ CLASSIFIED</h2>
      <p class="lock-line">この回は、まだ解禁されていない。</p>
      <p class="lock-date">解禁：${fmtD(unlockDate(s))} 0:00（開催前日）<br>開催：${fmtDateJP(s.date)}</p>
      <p class="lock-note">焦るな。その日まで、前回の作品を磨いておけ。</p>
      <button class="btn primary big" onclick="location.hash='#/'">⬅ MISSION SELECT へ戻る</button>
    </section>`;
}

// ============================================================
// BRIEFING (FDE風 自動解説プレゼン)
// ============================================================
const brief = { slides: [], i: 0, auto: true, advTimer: null, open: false, speakToken: 0 };

// ---- FULL AUTO RUN：概要→解説→タイマー→解説→…→MISSION CLEAR まで自動進行 ----
const autopilot = { active: false, sessionId: null, idx: -1, timer: null };

function startAutoRun(sessionId) {
  autopilot.active = true;
  autopilot.sessionId = sessionId;
  autopilot.idx = -1;          // -1 = 概要ブリーフィングから
  brief.auto = true;           // 音声＋自動進行ON
  openBriefing(sessionId, -1, true);
}

function cancelAutopilot() {
  autopilot.active = false;
  clearTimeout(autopilot.timer);
}

// goスライドの実行：タイマーへ突入 or（AUTO中）次のパートへ
function briefGoAction() {
  const sl = brief.slides[brief.i];
  if (!sl) return;
  if (sl.kind !== "go") { briefNext(); return; }
  if (sl.timer) {
    closeBriefing(true);
    openTimer(sl.timer);
    if (autopilot.active) timerStart(); // AUTO中はタイマーも自動スタート
  } else if (autopilot.active) {
    if (autopilot.idx === -1) {
      // 概要ブリーフィング終了 → 最初のパートへ
      autopilot.idx = 0;
      openBriefing(autopilot.sessionId, 0, true);
    } else {
      // 講義パート終了（タイマーなし）→ 次のパートへ
      autopilotNextActivity();
    }
  } else {
    closeBriefing();
  }
}

// タイマー終了後（AUTO中）：次のアクティビティの解説へ
function autopilotNextActivity() {
  if (!autopilot.active) return;
  const s = SESSIONS.find((x) => x.id === autopilot.sessionId);
  if (!s) { cancelAutopilot(); return; }
  closeTimer(true);
  autopilot.idx++;
  if (autopilot.idx < s.agenda.length) {
    openBriefing(s.id, autopilot.idx, true);
  } else {
    missionComplete(s);
  }
}

function missionComplete(s) {
  cancelAutopilot();
  const p = getProgress(); p[s.id] = true; setProgress(p); // 自動でMISSION CLEAR
  brief.slides = [
    { kind: "title", phase: `${s.code} ─ OPERATION COMPLETE`, h: "MISSION CLEAR",
      meta: `${s.theme} ─ 全行程完了。よくやった。`,
      say: `ミッション、クリア。${s.theme}、全行程完了。よくやった。……解散！` },
  ];
  brief.i = 0;
  brief.open = true;
  $("#briefOverlay").classList.add("open");
  startBgm();
  renderBriefSlide();
  render(); // 背後のページにCLEARスタンプを反映
}

// agendaIdx = -1 → セッション全体のミッションブリーフィング
function openBriefing(sessionId, agendaIdx, isAuto = false) {
  if (!isAuto) cancelAutopilot(); // 手動起動はAUTO RUNを解除
  const s = SESSIONS.find((x) => x.id === sessionId);
  if (!s) return;

  if (agendaIdx === -1) {
    brief.slides = buildMissionSlides(s);
  } else {
    const a = s.agenda[agendaIdx];
    if (a.hat) setHat(a.hat);
    brief.slides = buildActivitySlides(s, a);
  }
  brief.i = 0;
  brief.open = true;
  const badge = $("#briefAutoBadge");
  if (badge) badge.style.display = autopilot.active ? "" : "none";
  $("#briefOverlay").classList.add("open");
  startBgm(); // 説明中はサスペンスBGM
  renderBriefSlide();
}

function buildActivitySlides(s, a) {
  const tm = TYPE_META[a.type];
  const hat = HATS[a.hat];
  const slides = [];

  // 表紙（自動生成）
  slides.push({
    kind: "title",
    phase: `${s.code} ─ ${tm.icon} ${tm.label}`,
    h: a.title,
    meta: `${hat.emoji} ${hat.name}ハット ／ ⏱ ${a.dur}分`,
    say: `ミッション。${a.title}。所要時間、${a.dur}分。私のハットは、${hat.name}だ。`,
  });

  // 解説スライド（data.jsで定義）
  (a.slides || [{ h: a.title, b: [a.desc], say: a.desc }]).forEach((sl) => {
    slides.push({ kind: "content", phase: `${s.code} ─ ${a.title}`, h: sl.h, b: sl.b, code: sl.code, say: sl.say });
  });

  // GOスライド（自動生成）
  // 講義タイプ：スライド解説そのものが講義 → タイマー不要、そのまま終了/次へ
  if (a.type === "lecture") {
    slides.push({
      kind: "go",
      phase: `${s.code} ─ ${a.title}`,
      h: "以上。",
      minutes: null,
      goLabel: "次のパートへ ▶",
      say: "講義は以上だ。",
    });
  } else {
    // ワーク等：タイマーへ突入（clientEventsがあれば つぶやき演出も引き継ぐ）
    slides.push({
      kind: "go",
      phase: `${s.code} ─ ${a.title}`,
      h: "READY?",
      minutes: a.dur,
      timer: { title: a.title, phase: `${s.code} / ${tm.label}`, minutes: a.dur, hat: a.hat, events: a.clientEvents },
      say: `準備はいいか。ボタンを押して、${a.dur}分のタイマーを開始しろ。`,
    });
  }
  return slides;
}

function buildMissionSlides(s) {
  const total = s.agenda.reduce((x, a) => x + a.dur, 0);
  return [
    { kind: "title", phase: `${s.code} ─ PHASE: ${s.phase}`, h: s.title,
      meta: `${s.theme} ─ ${s.subtitle}`,
      say: `${s.code.replace("EP.", "エピソード")}。${s.theme}。${s.title}` },
    { kind: "content", phase: `${s.code} ─ MISSION GOAL`, h: "🎯 今日のゴール",
      b: [s.goal, `🏆 持ち帰るもの：${s.outcome}`],
      say: `今日のゴール。${s.goal}。持ち帰るものは、こうだ。${s.outcome}` },
    { kind: "content", phase: `${s.code} ─ OPERATION TIMELINE`, h: `📋 作戦行動（全${total}分）`,
      b: s.agenda.map((a) => `${TYPE_META[a.type].icon} ${a.title} ─ ${a.dur}分`),
      say: `本日の作戦行動は全${s.agenda.length}項目、${total}分だ。` + s.agenda.map((a) => `${a.title}、${a.dur}分。`).join("") },
    { kind: "go", phase: s.code, h: "LET'S BUILD.", minutes: null, goLabel: "作戦開始 ▶",
      say: "以上、ブリーフィング終了。作戦を開始する。" },
  ];
}

// タイトル文字を1字ずつ「刻印」するためのスパン分割
function charSpans(t) {
  return [...String(t)].map((ch, i) =>
    `<span class="ch" style="animation-delay:${(0.25 + i * 0.055).toFixed(3)}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
}

function renderBriefSlide() {
  const sl = brief.slides[brief.i];
  if (!sl) return;
  const stage = $("#briefStage");

  let inner = `<div class="b-sweep"></div><div class="b-phase">${esc(sl.phase || "")}</div>`;
  if (sl.kind === "title") {
    inner += `<div class="b-title">${charSpans(sl.h)}</div><div class="b-meta">${esc(sl.meta || "")}</div>`;
  } else if (sl.kind === "go") {
    inner += `<div class="b-ring"></div><div class="b-ring r2"></div>`;
    inner += `<div class="b-title go">${charSpans(sl.h)}</div>`;
    const goLabel = sl.timer ? `⏱ ${sl.minutes}分タイマー START` : (autopilot.active ? (sl.goLabel || "次へ ▶") : "閉じる ▶");
    inner += `<button class="btn primary big b-go-btn" onclick="event.stopPropagation(); briefGoAction()">${goLabel}</button>`;
    if (autopilot.active) inner += `<div class="b-meta" style="font-size:.85rem;color:var(--dim)">🔁 AUTO RUN中 ─ ナレーション後に自動で進みます</div>`;
  } else {
    inner += `<div class="b-heading">${esc(sl.h)}</div>`;
    if (sl.code) inner += `<pre class="b-code">${esc(sl.code)}</pre>`;
    if (sl.b && sl.b.length) inner += `<ul class="b-bullets">${sl.b.map((b, i) => `<li style="animation-delay:${(0.35 + i * 0.55).toFixed(2)}s">${esc(b)}</li>`).join("")}</ul>`;
  }
  stage.innerHTML = inner;
  slideSound(sl.kind); // シネマティック効果音

  // progress dots
  $("#briefDots").innerHTML = brief.slides.map((_, i) =>
    `<span class="b-dot ${i === brief.i ? "on" : i < brief.i ? "past" : ""}"></span>`).join("");
  $("#briefAutoBtn").textContent = brief.auto ? "🔊 自動再生 ON" : "🔇 自動再生 OFF";

  // narration / auto-advance
  stopNarration();
  if (brief.auto) narrate(sl);
}

// ---- 高品質事前生成音声（audio/manifest.json があれば最優先で使用）----
// generate_voice.py で全ナレーションをニューラル音声MP3に変換しておく方式。
// 無い環境では自動でブラウザTTSにフォールバックする。
let AUDIO_MANIFEST = null;
fetch("audio/manifest.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((m) => { AUDIO_MANIFEST = m; })
  .catch(() => {});
const narratorPlayer = new Audio();
const clientPlayer = new Audio();

// ---- ナレーター設定（フォールバックTTS用：低音・文間にタメ）----
// 好みに合わせてここを調整：pitch 0.5〜0.8 が低音域、gapMs が「タメ」の長さ
const NARRATOR = { pitch: 0.62, rate: 1.7, gapMs: 300 };

function pickNarratorVoice() {
  const ja = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace("_", "-").startsWith("ja"));
  return ja.find((v) => /ichiro/i.test(v.name))          // Windows標準の男性ボイス
      || ja.find((v) => /keita|otoya|male|男/i.test(v.name)) // その他の男性ボイス
      || ja[0] || null;
}

function narrate(sl) {
  const text = sl.say || "";
  const isLast = brief.i >= brief.slides.length - 1;
  const fallbackMs = Math.max(4000, text.length * 240);
  const advance = () => {
    if (!brief.open || !brief.auto) return;
    if (!isLast) briefNext();
    else if (autopilot.active) briefGoAction(); // AUTO RUN中は最終スライドも自動実行
  };

  // 1) 事前生成のニューラル音声があれば最優先で再生
  const pregen = AUDIO_MANIFEST?.narrator?.[text];
  if (pregen && text) {
    const token = ++brief.speakToken;
    narratorPlayer.src = "audio/" + pregen;
    narratorPlayer.onended = () => { if (token === brief.speakToken) brief.advTimer = setTimeout(advance, 700); };
    narratorPlayer.onerror = () => { if (token === brief.speakToken) brief.advTimer = setTimeout(advance, fallbackMs); };
    narratorPlayer.play().catch(() => { brief.advTimer = setTimeout(advance, fallbackMs); });
    return;
  }

  // 2) フォールバック：ブラウザTTS
  if (!("speechSynthesis" in window) || !text) {
    brief.advTimer = setTimeout(advance, fallbackMs);
    return;
  }

  // 文ごとに区切って読む。文間に gapMs の「タメ」を入れて重厚に
  const parts = text.split(/(?<=[。！？!?])/).map((t) => t.trim()).filter(Boolean);
  const token = ++brief.speakToken;
  let idx = 0;

  const speakNext = () => {
    if (token !== brief.speakToken || !brief.open) return;
    if (idx >= parts.length) { brief.advTimer = setTimeout(advance, 900); return; }
    const u = new SpeechSynthesisUtterance(parts[idx++]);
    u.lang = "ja-JP";
    u.rate = NARRATOR.rate;
    u.pitch = NARRATOR.pitch;
    const v = pickNarratorVoice();
    if (v) u.voice = v;
    u.onend = () => { brief.advTimer = setTimeout(speakNext, NARRATOR.gapMs); };
    u.onerror = () => { brief.advTimer = setTimeout(speakNext, 800); };
    speechSynthesis.speak(u);
  };
  speakNext();
}

function stopNarration() {
  brief.speakToken = (brief.speakToken || 0) + 1; // 読み上げチェーンを無効化
  narratorPlayer.onended = null;
  narratorPlayer.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  clearTimeout(brief.advTimer);
}

function briefNext() {
  if (brief.i < brief.slides.length - 1) { brief.i++; renderBriefSlide(); }
}
function briefPrev() {
  if (brief.i > 0) { brief.i--; renderBriefSlide(); }
}
function briefToggleAuto() {
  brief.auto = !brief.auto;
  $("#briefAutoBtn").textContent = brief.auto ? "🔊 自動再生 ON" : "🔇 自動再生 OFF";
  if (brief.auto) narrate(brief.slides[brief.i]);
  else stopNarration();
}
function briefSkipToEnd() {
  brief.i = brief.slides.length - 1;
  renderBriefSlide();
}
function closeBriefing(keepAuto = false) {
  if (!keepAuto) cancelAutopilot(); // 手動で閉じたらAUTO RUNも解除
  brief.open = false;
  stopNarration();
  stopBgm();
  $("#briefOverlay").classList.remove("open");
}

// ---- サウンド設定（ON/OFF・localStorageに保存）----
const SOUND = {
  bgm: localStorage.getItem("vcb_bgm") !== "off",
  sfx: localStorage.getItem("vcb_sfx") !== "off",
};
function toggleBgm() {
  SOUND.bgm = !SOUND.bgm;
  localStorage.setItem("vcb_bgm", SOUND.bgm ? "on" : "off");
  if (SOUND.bgm && brief.open) startBgm(); else stopBgm();
  updateSoundButtons();
}
function toggleSfx() {
  SOUND.sfx = !SOUND.sfx;
  localStorage.setItem("vcb_sfx", SOUND.sfx ? "on" : "off");
  updateSoundButtons();
}
function updateSoundButtons() {
  document.querySelectorAll(".bgmBtn").forEach((b) => { b.textContent = SOUND.bgm ? "🎵 BGM ON" : "🎵 BGM OFF"; b.classList.toggle("off", !SOUND.bgm); });
  document.querySelectorAll(".sfxBtn").forEach((b) => { b.textContent = SOUND.sfx ? "💥 SFX ON" : "💥 SFX OFF"; b.classList.toggle("off", !SOUND.sfx); });
}

// ---- WebAudio 基盤 ----
let fxCtx = null;
function fxAudio() {
  fxCtx = fxCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (fxCtx.state === "suspended") fxCtx.resume();
  return fxCtx;
}

// ---- BGM：プロシージャル・サスペンスループ（ファイル不要）----
// 低音ドローン＋鼓動＋まばらな時計の金属音 ＝ LIAR GAMEの緊張感
const bgm = { on: false, master: null, nodes: [], timers: [] };

function startBgm() {
  if (!SOUND.bgm || bgm.on) return;
  try {
    const ctx = fxAudio();
    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.13, t0 + 2.5); // フェードイン
    master.connect(ctx.destination);

    // 1) 低音ドローン（Aマイナーの持続音、フィルタがゆっくり開閉して不穏に揺れる）
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240; lp.Q.value = 0.8;
    lp.connect(master);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 115;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency); lfo.start();
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.55; droneGain.connect(lp);
    [[55, "sawtooth", -6, 0.16], [55, "sawtooth", 7, 0.16], [82.41, "sawtooth", 3, 0.10], [27.5, "sine", 0, 0.5]]
      .forEach(([f, type, det, vol]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const g = ctx.createGain(); g.gain.value = vol;
        o.connect(g); g.connect(droneGain); o.start();
        bgm.nodes.push(o);
      });
    bgm.nodes.push(lfo);

    // 2) 鼓動（ドッ…ドッ…の二連）
    const heartbeat = () => {
      if (!bgm.on) return;
      const t = ctx.currentTime;
      [[0, 1.0], [0.34, 0.55]].forEach(([dt, vol]) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(64, t + dt);
        o.frequency.exponentialRampToValueAtTime(36, t + dt + 0.22);
        g.gain.setValueAtTime(0.0001, t + dt);
        g.gain.exponentialRampToValueAtTime(0.5 * vol, t + dt + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.3);
        o.connect(g); g.connect(master); o.start(t + dt); o.stop(t + dt + 0.33);
      });
    };
    bgm.timers.push(setInterval(heartbeat, 2400));
    heartbeat();

    // 3) 時計の針（まばらに鳴る高い金属音）
    const tick = () => {
      if (!bgm.on || Math.random() < 0.35) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = [1568, 2093, 2637][Math.floor(Math.random() * 3)];
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.0);
    };
    bgm.timers.push(setInterval(tick, 3400));

    bgm.master = master;
    bgm.on = true;
  } catch { /* no audio */ }
}

function stopBgm() {
  if (!bgm.on) return;
  bgm.on = false;
  bgm.timers.forEach(clearInterval);
  bgm.timers = [];
  try {
    const ctx = fxCtx;
    const m = bgm.master; const nodes = bgm.nodes;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(Math.max(m.gain.value, 0.0001), ctx.currentTime);
    m.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0); // フェードアウト
    setTimeout(() => {
      nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
      try { m.disconnect(); } catch { /* noop */ }
    }, 1200);
  } catch { /* noop */ }
  bgm.nodes = [];
  bgm.master = null;
}

// ---- シネマティック効果音（映画版ゲーム説明VTR風・強化版）----
function slideSound(kind) {
  if (!SOUND.sfx) return;
  try {
    const ctx = fxAudio();
    const t = ctx.currentTime;
    if (kind === "title" || kind === "go") {
      // ① サブベースの衝撃（体に響くドーン）
      const sub = ctx.createOscillator(); const sg = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(105, t);
      sub.frequency.exponentialRampToValueAtTime(26, t + 0.85);
      sg.gain.setValueAtTime(0.34, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      sub.connect(sg); sg.connect(ctx.destination); sub.start(t); sub.stop(t + 1.15);
      // ② アタックの打撃（短いノイズトランジェント）
      const clen = Math.floor(ctx.sampleRate * 0.05);
      const cbuf = ctx.createBuffer(1, clen, ctx.sampleRate); const cd = cbuf.getChannelData(0);
      for (let i = 0; i < clen; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / clen);
      const click = ctx.createBufferSource(); click.buffer = cbuf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
      const cg = ctx.createGain(); cg.gain.value = 0.16;
      click.connect(hp); hp.connect(cg); cg.connect(ctx.destination); click.start(t);
      // ③ 金属ベルの余韻（デチューンした倍音がうなりながら消える）
      [[3136, 0.035], [3151, 0.03], [4699, 0.018]].forEach(([f, vol]) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g); g.connect(ctx.destination); o.start(t + 0.02); o.stop(t + 1.6);
      });
    } else {
      // ページ送り：上昇するライザー・ウーシュ
      const len = Math.floor(ctx.sampleRate * 0.42);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const e = i / len; d[i] = (Math.random() * 2 - 1) * e * e; }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(260, t);
      bp.frequency.exponentialRampToValueAtTime(2900, t + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.16, t);
      g.gain.setValueAtTime(0.16, t + 0.36);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t);
    }
  } catch { /* no audio */ }
}

// ---- 金粒子（背景に浮遊する塵）----
function buildParticles() {
  const c = $("#bParticles");
  if (!c) return;
  c.innerHTML = Array.from({ length: 28 }, () => {
    const left = (Math.random() * 100).toFixed(1);
    const size = (Math.random() * 3 + 1.4).toFixed(1);
    const dur = (Math.random() * 16 + 10).toFixed(1);
    const delay = (-Math.random() * 26).toFixed(1);
    const drift = (Math.random() * 70 - 35).toFixed(0);
    const op = (Math.random() * 0.45 + 0.2).toFixed(2);
    return `<span style="left:${left}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;--drift:${drift}px;--op:${op}"></span>`;
  }).join("");
}

function briefOverlayHTML() {
  return `
    <div class="brief-overlay" id="briefOverlay">
      <div class="b-fx"><div class="b-glow"></div><div class="b-particles" id="bParticles"></div></div>
      <div class="brief-topbar">
        <span class="auto-badge" id="briefAutoBadge" style="display:none">🔁 FULL AUTO RUN</span>
        <button class="btn bgmBtn" onclick="event.stopPropagation(); toggleBgm()">🎵 BGM ON</button>
        <button class="btn sfxBtn" onclick="event.stopPropagation(); toggleSfx()">💥 SFX ON</button>
        <button class="btn" id="briefAutoBtn" onclick="event.stopPropagation(); briefToggleAuto()">🔊 自動再生 ON</button>
        <button class="btn" onclick="event.stopPropagation(); briefSkipToEnd()">⏭ スキップ</button>
        <button class="btn danger" onclick="event.stopPropagation(); closeBriefing()">✕ 閉じる</button>
      </div>
      <div class="brief-stage" id="briefStage" onclick="briefNext()"></div>
      <div class="brief-bottombar">
        <div class="brief-dots" id="briefDots"></div>
        <div class="brief-hint">クリック / Space / → で進む ・ ← で戻る ・ Esc で閉じる</div>
      </div>
    </div>`;
}

// ============================================================
// GACHA
// ============================================================
let gachaRolling = false;
function renderGacha() {
  app.innerHTML = `
    ${headerHTML()}
    <div class="breadcrumb"><a href="#/">⬅ MISSION SELECT</a> / お題ガチャ</div>
    <section class="gacha-panel">
      <h2 class="section-title" style="justify-content:center">🎰 お題ガチャ</h2>
      <p style="color:var(--dim);font-size:.9rem;line-height:1.8">
        出典：AI駆動開発100本ノック（第一弾・第二弾）。<br>引いたお題は拒否権なし。それがブートキャンプだ。</p>
      <div class="gacha-levels">
        ${Object.entries(GACHA).map(([k, lv]) => `
          <button class="gacha-level-btn" style="--lv-color:${lv.color}" onclick="rollGacha('${k}')">${lv.label}</button>`).join("")}
      </div>
      <div class="gacha-result" id="gachaResult">
        <div class="note">↑ 難易度を選んでガチャを回せ</div>
      </div>
      <div id="gachaActions" style="margin-top:14px"></div>
    </section>`;
}

function rollGacha(level) {
  if (gachaRolling) return;
  const lv = GACHA[level];
  const box = $("#gachaResult");
  const actions = $("#gachaActions");
  gachaRolling = true;
  box.classList.add("rolling");
  actions.innerHTML = "";

  let ticks = 0;
  const iv = setInterval(() => {
    const pick = lv.items[Math.floor(Math.random() * lv.items.length)];
    box.innerHTML = `
      <div class="lv" style="color:${lv.color}">LEVEL: ${lv.label}</div>
      <div class="odai">${esc(pick)}</div>`;
    if (++ticks >= 14) {
      clearInterval(iv);
      gachaRolling = false;
      box.classList.remove("rolling");
      const final = lv.items[Math.floor(Math.random() * lv.items.length)];
      box.innerHTML = `
        <div class="lv" style="color:${lv.color}">LEVEL: ${lv.label}</div>
        <div class="odai">⚡ ${esc(final)} ⚡</div>
        <div class="note">${esc(lv.note)}</div>`;
      box.style.borderColor = lv.color;
      actions.innerHTML = `
        <button class="btn primary big" onclick='openTimer({title:${JSON.stringify("お題：" + final)}, phase:"BUILD SPRINT", minutes:25})'>⏱ このお題で25分スプリント開始</button>
        <button class="btn" onclick="rollGacha('${level}')">🎰 もう一回</button>`;
    }
  }, 90);
}

// ============================================================
// TIMER (overlay)
// ============================================================
const timerState = { total: 0, remain: 0, running: false, iv: null, finished: false };

function timerDockHTML() {
  return `
    <div class="timer-overlay" id="timerOverlay">
      <button class="timer-close" onclick="closeTimer()">✕</button>
      <div class="auto-badge" id="timerAutoBadge" style="display:none">🔁 AUTO RUN ─ タイマー終了後、自動で次のパートへ</div>
      <div class="client-murmur" id="clientMurmur"></div>
      <div class="t-phase" id="tPhase"></div>
      <div class="t-title" id="tTitle"></div>
      <div class="timer-display" id="tDisplay">25:00</div>
      <div class="timer-bar-wrap"><div class="timer-bar" id="tBar"></div></div>
      <div class="timeup-msg">⏰ TIME UP ─ 手を止めろ！</div>
      <div class="timer-controls">
        <button class="btn primary big" id="tStartPause" onclick="timerToggle()">▶ START</button>
        <button class="btn big" onclick="timerAdd(60)">＋1分</button>
        <button class="btn big" onclick="timerAdd(-60)">−1分</button>
        <button class="btn big danger" onclick="timerReset()">RESET</button>
      </div>
      <div class="timer-presets">
        ${[1, 2, 3, 5, 10, 15, 17, 20, 25, 30, 35].map((m) => `<button class="btn" onclick="timerSet(${m * 60})">${m}分</button>`).join("")}
      </div>
    </div>`;
}

function openTimer({ title, phase, minutes, hat, events }) {
  const ov = $("#timerOverlay");
  $("#tTitle").textContent = title;
  $("#tPhase").textContent = (phase || "ACTIVE LEARNING") + (hat ? `  ${HATS[hat].emoji} ${HATS[hat].name}ハット` : "");
  if (hat) setHat(hat);
  $("#timerAutoBadge").style.display = autopilot.active ? "" : "none";
  timerState.events = (events || []).map((e) => ({ ...e, fired: false })); // クライアントのつぶやき台本
  ov.classList.add("open");
  timerSet(minutes * 60);
}

function closeTimer(keepAuto = false) {
  if (!keepAuto) cancelAutopilot(); // 手動で閉じたらAUTO RUNも解除
  timerPause();
  hideMurmur();
  $("#timerOverlay").classList.remove("open", "finished");
}

function timerSet(sec) {
  timerPause();
  timerState.total = sec;
  timerState.remain = sec;
  timerState.finished = false;
  (timerState.events || []).forEach((e) => { e.fired = false; }); // つぶやきを再アーム
  hideMurmur();
  $("#timerOverlay").classList.remove("finished");
  timerDraw();
}

function timerToggle() { timerState.running ? timerPause() : timerStart(); }

function timerStart() {
  if (timerState.remain <= 0) return;
  timerState.running = true;
  $("#tStartPause").textContent = "⏸ PAUSE";
  timerState.iv = setInterval(() => {
    timerState.remain--;
    // クライアントのつぶやき：経過分数が台本の at に達したら発動
    const elapsedMin = (timerState.total - timerState.remain) / 60;
    (timerState.events || []).forEach((ev) => {
      if (!ev.fired && elapsedMin >= ev.at) { ev.fired = true; showClientMurmur(ev); }
    });
    if (timerState.remain <= 0) {
      timerState.remain = 0;
      timerPause();
      timerState.finished = true;
      $("#timerOverlay").classList.add("finished");
      timeUpSound();
      // AUTO RUN中：ビープ後、自動で次のパートの解説へ
      if (autopilot.active) autopilot.timer = setTimeout(autopilotNextActivity, 6000);
    }
    timerDraw();
  }, 1000);
}

function timerPause() {
  timerState.running = false;
  clearInterval(timerState.iv);
  const b = $("#tStartPause");
  if (b) b.textContent = "▶ START";
}

function timerAdd(sec) {
  timerState.remain = Math.max(0, timerState.remain + sec);
  timerState.total = Math.max(timerState.total, timerState.remain);
  if (timerState.remain > 0) { timerState.finished = false; $("#timerOverlay").classList.remove("finished"); }
  timerDraw();
}

function timerReset() { timerSet(timerState.total); }

function timerDraw() {
  const d = $("#tDisplay");
  const m = Math.floor(timerState.remain / 60);
  const s = timerState.remain % 60;
  d.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  d.className = "timer-display" +
    (timerState.finished ? " timeup" :
     timerState.remain <= 60 && timerState.remain > 0 ? " danger" :
     timerState.remain <= 180 ? " warn" : "");
  $("#tBar").style.width = timerState.total ? `${(timerState.remain / timerState.total) * 100}%` : "0%";
  document.title = timerState.running ? `[${d.textContent}] VIBE CODING BOOTCAMP` : "VIBE CODING BOOTCAMP";
}

// ---- クライアントのつぶやき（タイマー中の自動イベント）----
function showClientMurmur(ev) {
  const el = $("#clientMurmur");
  if (!el) return;
  el.innerHTML = `
    <span class="cm-label">💼 クライアントの独り言（聞くかどうかは君の自由だ）</span>
    <div class="cm-text">${esc(ev.text)}</div>`;
  el.classList.add("show");
  murmurChime();
  clientSpeak(ev.say || ev.text);
  clearTimeout(showClientMurmur._t);
  showClientMurmur._t = setTimeout(hideMurmur, 35000); // 35秒で消える＝聞き逃しもあり得る
}

function hideMurmur() {
  const el = $("#clientMurmur");
  if (el) el.classList.remove("show");
}

// クライアント用ボイス：ナレーターと別の声・軽い調子で
function clientSpeak(text) {
  // 事前生成のニューラル音声があれば最優先
  const pregen = AUDIO_MANIFEST?.client?.[text];
  if (pregen && text) {
    clientPlayer.src = "audio/" + pregen;
    clientPlayer.play().catch(() => {});
    return;
  }
  if (!("speechSynthesis" in window) || !text) return;
  const ja = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace("_", "-").startsWith("ja"));
  const narrator = pickNarratorVoice();
  const v = ja.find((x) => x !== narrator) || narrator;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.pitch = 1.05;
  u.rate = 1.25;
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// 控えめなチャイム（つぶやきの予兆音）
function murmurChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[660, 0], [880, 0.18]].forEach(([f, t]) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.08, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
    });
  } catch { /* no audio */ }
}

// beep ×3 (WebAudio, no asset files)
function timeUpSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7, 1.05].forEach((t, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square";
      o.frequency.value = i === 3 ? 1320 : 880;
      g.gain.setValueAtTime(0.18, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + (i === 3 ? 0.6 : 0.25));
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + (i === 3 ? 0.6 : 0.25));
    });
  } catch { /* audio unavailable — flash only */ }
}

// ============================================================
// HAT DOCK
// ============================================================
let currentHat = localStorage.getItem("vcb_hat") || "instructor";

function hatDockHTML() {
  return `
    <div class="hat-dock">
      <div class="hat-menu" id="hatMenu">
        ${Object.values(HATS).map((h) => `
          <button class="hat-option" style="--opt-color:${h.color}" data-hat="${h.id}" onclick="setHat('${h.id}');toggleHatMenu(false)">
            <span class="emoji">${h.emoji}</span>
            <span><b>${h.name}</b><small>${esc(h.desc)}</small></span>
          </button>`).join("")}
        <div class="rule-note">⚠ 受講者から指名できるのは 🧢メンター / 💼クライアント のみ。🎓講師は指名不可。</div>
      </div>
      <div class="hat-current" id="hatCurrent" onclick="toggleHatMenu()">
        <span class="emoji" id="hatEmoji"></span>
        <span class="label"><small>NOW WEARING</small><b id="hatName"></b></span>
      </div>
    </div>`;
}

function setHat(id) {
  currentHat = id;
  localStorage.setItem("vcb_hat", id);
  const h = HATS[id];
  $("#hatEmoji").textContent = h.emoji;
  $("#hatName").textContent = h.name + "ハット";
  $("#hatCurrent").style.setProperty("--hat-color", h.color);
  document.querySelectorAll(".hat-option").forEach((b) => b.classList.toggle("active", b.dataset.hat === id));
}

function toggleHatMenu(force) {
  const menu = $("#hatMenu");
  menu.classList.toggle("open", force !== undefined ? force : !menu.classList.contains("open"));
}

// ============================================================
// BOOT
// ============================================================
document.body.insertAdjacentHTML("beforeend", timerDockHTML() + briefOverlayHTML() + hatDockHTML());
setHat(currentHat);
buildParticles();
updateSoundButtons();
render();

// 音声リストの先読み（ブラウザによっては非同期ロード）
if ("speechSynthesis" in window) speechSynthesis.getVoices();

// keyboard: briefing優先 → timer
document.addEventListener("keydown", (e) => {
  if (brief.open) {
    if (e.code === "Space" || e.code === "ArrowRight") { e.preventDefault(); briefNext(); }
    if (e.code === "ArrowLeft") { e.preventDefault(); briefPrev(); }
    if (e.code === "Escape") closeBriefing();
    return;
  }
  const ovOpen = $("#timerOverlay").classList.contains("open");
  if (!ovOpen) return;
  if (e.code === "Space") { e.preventDefault(); timerToggle(); }
  if (e.code === "Escape") closeTimer();
});
