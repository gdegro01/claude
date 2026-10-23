"use strict";

const state = {
  runs: [],
  runId: null,
  manifest: null,
  plan: null,
  ratings: {},
  evals: {},
  metrics: {},
  version: "fps30",
  speed: 1,
  loop: true,
  players: [],
  active: null,
  align: null,
};

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl = (n, d = 2) => Number(n).toLocaleString("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d });
const url = (p) => (p ? "/" + p.split("/").map(encodeURIComponent).join("/") : "");
const FINAL = new Set(["klaar", "fout"]);

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

/* ---------- runs ---------- */

async function loadRuns() {
  state.runs = await api("/api/runs");
  const best = await api("/api/run/__best__").catch(() => ({}));
  const hasBest = Boolean(best.manifest);
  const sel = $("#run");
  sel.innerHTML = (hasBest ? `<option value="__best__">★ Beste voorbeelden (${best.manifest.clips.length})</option>` : "") +
    state.runs
      .map((r) => `<option value="${esc(r.run_id)}">${esc(r.run_id)} · ${esc(r.persons.join(", "))}</option>`)
      .join("");
  const wanted = new URLSearchParams(location.search).get("run");
  const first = (wanted === "__best__" && hasBest) ? { run_id: "__best__" }
    : state.runs.find((r) => r.run_id === wanted) || (hasBest ? { run_id: "__best__" } : null) ||
      state.runs.find((r) => r.has_manifest) || state.runs[0];
  if (first) {
    sel.value = first.run_id;
    await loadRun(first.run_id);
  } else {
    $("#cards").innerHTML = `<p class="empty">Nog geen runs. Start met <code>python tools/run_test.py plan</code>.</p>`;
  }
}

async function loadRun(runId, keepPlayback = false) {
  const data = await api(`/api/run/${encodeURIComponent(runId)}`);
  const changed = JSON.stringify(data.manifest?.clips?.map((c) => c.status)) !==
    JSON.stringify(state.manifest?.clips?.map((c) => c.status));
  state.runId = runId;
  state.manifest = data.manifest;
  state.plan = data.plan;
  state.ratings = data.ratings || {};
  state.evals = data.evals || {};
  state.metrics = data.metrics || {};
  if (!keepPlayback || changed) renderVideos();
  renderSummary();
  if (!$("#videos").hidden) history.replaceState(null, "", `?tab=videos&run=${encodeURIComponent(runId)}`);
}

setInterval(() => {
  const m = state.manifest;
  if (state.runId && m && m.clips.some((c) => !FINAL.has(c.status))) loadRun(state.runId, true).catch(() => {});
}, 10000);

/* ---------- summary ---------- */

function renderSummary() {
  const m = state.manifest;
  const el = $("#summary");
  if (!m) { el.innerHTML = ""; return; }
  const models = [...new Set(m.clips.map((c) => c.model))];
  const cost = m.clips.filter((c) => c.status !== "gepland").reduce((s, c) => s + (c.cost_estimate || 0), 0);
  el.innerHTML = models.map((model) => {
    const clips = m.clips.filter((c) => c.model === model);
    const n = (r) => clips.filter((c) => (state.ratings[c.id]?.rating || "") === r).length;
    return `<div class="sum"><h3>${esc(clips[0].model_label)}</h3><div class="counts">
      <span class="c-good"><b>${n("goed")}</b>goed</span>
      <span class="c-doubt"><b>${n("twijfel")}</b>twijfel</span>
      <span class="c-bad"><b>${n("onvoldoende")}</b>onvoldoende</span>
      <span class="c-open"><b>${n("")}</b>open</span></div></div>`;
  }).join("") + `<div class="sum"><h3>Run ${esc(m.run_id)}</h3><div class="counts">
      <span><b>${m.persons.length}</b>personen</span><span><b>$${nl(cost)}</b>geschat</span></div></div>`;
}

/* ---------- video cards ---------- */

function srcFor(clip) {
  const f = clip.files || {};
  return { fps30: f.fps30, master: f.master, raw: f.raw }[state.version] || f.fps30 || f.raw;
}

function fpsFor(clip) {
  const p = clip.probe || {};
  return { fps30: 30, master: p.master?.fps || 120, raw: p.raw?.fps || 24 }[state.version] || 30;
}

function clipHtml(clip) {
  const r = state.ratings[clip.id] || {};
  const src = srcFor(clip);
  let media;
  if (clip.status === "fout") {
    media = `<div class="placeholder err">Mislukt\n${esc(clip.error || "")}</div>`;
  } else if (!src) {
    const msg = { gepland: "Nog niet gestart", ingediend: "Wordt gemaakt…", nabewerken: "Wordt nabewerkt…" }[clip.status] || clip.status;
    media = `<div class="placeholder">${esc(msg)}</div>`;
  } else {
    const poster = clip.files?.poster_first ? `poster="${url(clip.files.poster_first)}"` : "";
    media = `<video muted playsinline preload="auto" ${poster} src="${url(src)}"></video>`;
  }
  const p = clip.probe?.[state.version] || clip.probe?.fps30;
  const a = clip.aansluiting || {};
  const info = [
    p ? `${nl(p.fps, 0)} fps · ${p.frames} frames · ${nl(p.duration)} s` : "",
    a.begin_mae != null ? `aansluiting begin ${nl(a.begin_mae, 1)} · eind ${nl(a.eind_mae, 1)}` : "",
  ].filter(Boolean).join("<br>");
  const btn = (k, label) => `<button data-r="${k}" class="${r.rating === k ? "on" : ""}">${label}</button>`;
  return `<div class="clip" data-clip="${esc(clip.id)}">
    <h3>${esc(clip.model_label)}<span class="meta">≈ $${nl(clip.cost_estimate || 0)}</span></h3>
    ${media}
    <div class="info">${info || "&nbsp;"}</div>
    ${claudeHtml(clip)}
    <div class="rate">${btn("goed", "Goed")}${btn("twijfel", "Twijfel")}${btn("onvoldoende", "Onvoldoende")}</div>
    <textarea placeholder="Notitie (wat ging goed of mis?)">${esc(r.note || "")}</textarea>
  </div>`;
}

function claudeHtml(clip) {
  const ev = state.evals[clip.id];
  const me = state.metrics[clip.id];
  if (!ev && !me) return "";
  const parts = [];
  if (me && !me.error) {
    parts.push(`onthulling ${me.reveal_s == null ? "–" : nl(me.reveal_s, 1) + " s"} · verborgen ${nl(me.hidden_s, 1)} s · ` +
      `fade ${nl(me.fade_score, 2)} · sprong ×${nl(me.jump_ratio, 1)}`);
    if (me.flags?.length) parts.push(`<span class="flags">${esc(me.flags.join(" · "))}</span>`);
  }
  const verdict = ev ? `<span class="badge v-${esc(ev.verdict)}">Claude: ${esc(ev.verdict)}${ev.best ? " ★" : ""}</span>` : "";
  const sheet = (me?.sheet ? ` <a href="${url(me.sheet)}" target="_blank" rel="noopener">contactblad</a>` : "") +
    (me?.detail ? ` <a href="${url(me.detail)}" target="_blank" rel="noopener">detail</a>` : "");
  return `<div class="claude">${verdict}${sheet}${ev?.note ? `<p>${esc(ev.note)}</p>` : ""}
    ${parts.length ? `<div class="metrics">${parts.join("<br>")}</div>` : ""}</div>`;
}

function renderVideos() {
  state.players.forEach((pl) => pl.destroy());
  state.players = [];
  const cards = $("#cards");
  const m = state.manifest;
  if (!m) {
    const persons = state.plan?.persons || [];
    cards.innerHTML = `<p class="empty">Deze run heeft nog geen video's (alleen een plan voor ${esc(persons.map((p) => p.name).join(", "))}).<br>
      Start met <code>python tools/run_test.py go ${esc(state.runId)} --yes</code>.</p>`;
    return;
  }
  cards.innerHTML = m.persons.map((person) => {
    const clips = m.clips.filter((c) => c.person === person.slug);
    return `<article class="card" data-person="${esc(person.slug)}">
      <div class="card-head">
        <h2>${esc(person.name)}</h2>
        <span class="chip">${esc(person.variant)} · ${esc(person.variant_naam || "")}</span>
        ${person.run_id ? `<span class="chip">run ${esc(person.run_id)}</span>` : ""}
        ${person.kostuum ? `<span class="chip">kostuum: ${esc(person.kostuum)}</span>` : ""}
        <details><summary>Prompt</summary><p>${esc(person.prompt || "")}</p></details>
      </div>
      <div class="card-body">
        <div class="frames">
          <figure><img src="${url(m.start.file)}" alt="startframe"><figcaption>start</figcaption></figure>
          <figure><img src="${url(person.end_file)}" alt="eindframe"><figcaption>eind</figcaption></figure>
        </div>
        <div class="clips">${clips.map(clipHtml).join("")}</div>
      </div>
      <div class="transport">
        <button class="play" title="Afspelen (spatie)">▶</button>
        <button class="ghost back" title="Frame terug (←)">‹</button>
        <button class="ghost fwd" title="Frame vooruit (→)">›</button>
        <div class="track"><input type="range" min="0" max="5" step="0.001" value="0"><div class="mark" hidden><span>3 s</span></div></div>
        <span class="time">0,00 s · frame 0</span>
      </div>
    </article>`;
  }).join("");

  cards.querySelectorAll(".card").forEach((card) => {
    const person = card.dataset.person;
    const clips = m.clips.filter((c) => c.person === person);
    state.players.push(new Player(card, clips));
    card.querySelectorAll(".clip").forEach((el) => bindRating(el));
  });
}

function bindRating(el) {
  const clipId = el.dataset.clip;
  const save = async (rating) => {
    const note = $("textarea", el).value;
    try {
      const res = await api("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: state.runId, clip_id: clipId, rating, note }),
      });
      state.ratings = res.ratings;
      el.querySelectorAll(".rate button").forEach((b) => b.classList.toggle("on", b.dataset.r === rating && rating !== ""));
      renderSummary();
    } catch (e) {
      alert("Opslaan mislukt: " + e.message);
    }
  };
  el.querySelectorAll(".rate button").forEach((b) => b.addEventListener("click", () => {
    const current = state.ratings[clipId]?.rating || "";
    save(current === b.dataset.r ? "" : b.dataset.r);
  }));
  $("textarea", el).addEventListener("change", () => save(state.ratings[clipId]?.rating || ""));
}

/* ---------- synced playback per card ---------- */

class Player {
  constructor(card, clips) {
    this.card = card;
    this.clips = clips;
    this.videos = [...card.querySelectorAll("video")];
    this.slider = $(".track input", card);
    this.mark = $(".mark", card);
    this.time = $(".time", card);
    this.playBtn = $(".play", card);
    this.playing = false;
    this.raf = null;
    this.fps = Math.max(...clips.filter((c) => srcFor(c)).map(fpsFor), 30);
    card.addEventListener("pointerdown", () => setActive(this));
    this.playBtn.addEventListener("click", () => this.toggle());
    $(".back", card).addEventListener("click", () => this.step(-1));
    $(".fwd", card).addEventListener("click", () => this.step(1));
    this.slider.addEventListener("input", () => {
      const t = Number(this.slider.value);
      this.pause();
      this.seek(t);
    });
    this.videos.forEach((v) => {
      v.playbackRate = state.speed;
      v.addEventListener("loadedmetadata", () => this.layout());
      v.addEventListener("click", () => { setActive(this); this.toggle(); });
    });
    if (!this.videos.length) { this.playBtn.disabled = true; this.slider.disabled = true; }
  }
  get duration() {
    const d = this.videos.map((v) => v.duration).filter((x) => isFinite(x) && x > 0);
    return d.length ? Math.min(...d) : 5;
  }
  get leader() { return this.videos[0]; }
  layout() {
    const d = this.duration;
    this.slider.max = d;
    if (d > 3) {
      this.mark.hidden = false;
      this.mark.style.left = `${(3 / d) * 100}%`;
    }
    this.update();
  }
  update() {
    const t = this.leader ? this.leader.currentTime : 0;
    this.slider.value = t;
    this.time.textContent = `${nl(t)} s · frame ${Math.floor(t * this.fps + 1e-3)}`;
  }
  seek(t) {
    t = Math.max(0, Math.min(t, this.duration));
    this.videos.forEach((v) => { v.currentTime = t; });
    this.update();
  }
  async play() {
    if (!this.videos.length) return;
    if (this.leader.currentTime >= this.duration - 0.02) this.seek(0);
    const t = this.leader.currentTime;
    this.videos.forEach((v) => { v.currentTime = t; v.playbackRate = state.speed; });
    this.playing = true;
    this.playBtn.textContent = "❚❚";
    await Promise.allSettled(this.videos.map((v) => v.play()));
    this.tick();
  }
  pause() {
    this.playing = false;
    this.playBtn.textContent = "▶";
    this.videos.forEach((v) => v.pause());
    cancelAnimationFrame(this.raf);
    this.update();
  }
  toggle() { this.playing ? this.pause() : this.play(); }
  step(dir) {
    this.pause();
    const frame = Math.round(this.leader.currentTime * this.fps) + dir;
    this.seek(Math.max(0, frame) / this.fps + 0.0005);
  }
  tick() {
    if (!this.playing) return;
    const t = this.leader.currentTime;
    for (const v of this.videos.slice(1)) {
      if (Math.abs(v.currentTime - t) > 0.05) v.currentTime = t;
    }
    if (this.leader.ended || t >= this.duration - 0.005) {
      if (state.loop) {
        this.seek(0);
        Promise.allSettled(this.videos.map((v) => v.play()));
      } else {
        this.pause();
        return;
      }
    }
    this.update();
    this.raf = requestAnimationFrame(() => this.tick());
  }
  setSpeed(s) { this.videos.forEach((v) => { v.playbackRate = s; }); }
  destroy() { this.pause(); }
}

function setActive(player) {
  if (state.active === player) return;
  state.active?.card.classList.remove("active");
  state.active = player;
  player.card.classList.add("active");
}

document.addEventListener("keydown", (e) => {
  if (e.target.closest("textarea, input, select")) return;
  if (!$("#modal").hidden || $("#videos").hidden) return;
  const pl = state.active || state.players[0];
  if (!pl) return;
  if (e.code === "Space") { e.preventDefault(); setActive(pl); pl.toggle(); }
  if (e.code === "ArrowLeft") { e.preventDefault(); pl.step(-1); }
  if (e.code === "ArrowRight") { e.preventDefault(); pl.step(1); }
});

/* ---------- toolbar ---------- */

$("#version").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  state.version = b.dataset.v;
  $("#version").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  renderVideos();
});
$("#speed").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  state.speed = Number(b.dataset.s);
  $("#speed").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  state.players.forEach((p) => p.setSpeed(state.speed));
});
$("#loop").addEventListener("change", (e) => { state.loop = e.target.checked; });
$("#run").addEventListener("change", (e) => loadRun(e.target.value));

function showTab(name) {
  if (!["overview", "videos", "align"].includes(name)) name = "overview";
  if (name !== "videos") history.replaceState(null, "", name === "overview" ? location.pathname : `?tab=${name}`);
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== name; });
  $(".run-select").hidden = name !== "videos";
  if (name !== "videos") state.players.forEach((p) => p.pause());
  if (name === "align") renderAlign();
  if (name === "overview") loadOverview();
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => showTab(tab.dataset.tab)));

/* ---------- alignment view ---------- */

async function renderAlign() {
  state.players.forEach((p) => p.pause());
  if (!state.align) state.align = await api("/api/align");
  const rep = state.align;
  const box = $("#align-cards");
  if (!rep || !rep.persons) {
    box.innerHTML = `<p class="empty">Nog niet uitgelijnd. Start met <code>python tools/align_frames.py</code>.</p>`;
    return;
  }
  $("#align-info").textContent =
    `Startframe ${rep.start.size.join("×")} · ${rep.aspect.note} · uitvoer ${rep.aspect.size.join("×")}`;
  const onlyIssues = $("#only-issues").checked;
  box.innerHTML = rep.persons
    .filter((p) => !onlyIssues || p.status !== "ok")
    .map((p) => {
      const cls = (p.status || "").split(" ")[0];
      const notes = (p.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
      const src = p.source ? p.source.split("/").pop() : "";
      const cmp = p.file ? `<div class="cmp"><img src="${url(rep.start.file)}" alt="start"><img class="top" src="${url(p.file)}" alt="eind" style="opacity:.5"></div>
        <div class="cmp-ctl"><span>start</span><input type="range" min="0" max="100" value="50"><span>eind</span><button class="blink">Knipper</button></div>` : "";
      return `<div class="acard"><h2>${esc(p.name)}<span class="badge ${esc(cls)}">${esc(p.status)}</span></h2>
        <div class="src">${esc(src)}${p.method ? ` · methode: ${esc(p.method)}` : ""}${p.alternatives?.length ? ` · ${p.alternatives.length} andere versie(s)` : ""}</div>
        ${cmp}${notes ? `<ul>${notes}</ul>` : ""}</div>`;
    }).join("");
  box.querySelectorAll(".acard").forEach((card) => {
    const top = $(".cmp img.top", card);
    const range = $(".cmp-ctl input", card);
    const blink = $(".blink", card);
    if (!top) return;
    let timer = null;
    range.addEventListener("input", () => { top.style.opacity = range.value / 100; });
    blink.addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; blink.classList.remove("on"); top.style.opacity = range.value / 100; return; }
      blink.classList.add("on");
      let on = false;
      timer = setInterval(() => { on = !on; top.style.opacity = on ? 1 : 0; }, 450);
    });
  });
}
$("#only-issues").addEventListener("change", renderAlign);

/* ---------- overview: sessions, gallery, player ---------- */

const ov = { data: null, filter: "all", model: "", run: "", list: [], index: -1, speed: 1 };
const VERDICT_LABEL = { goed: "Goed", twijfel: "Twijfel", onvoldoende: "Onvoldoende" };

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

async function loadOverview() {
  try {
    ov.data = await api("/api/overview");
  } catch (e) {
    $("#ov-runs").innerHTML = `<p class="empty">Kan overzicht niet laden: ${esc(e.message)}</p>`;
    return;
  }
  renderStats();
  renderRunCards();
  renderFilters();
  renderGallery();
}

function renderStats() {
  const d = ov.data;
  const n = (f) => d.clips.filter(f).length;
  const done = n((c) => c.status === "klaar");
  const busy = n((c) => ["gepland", "ingediend", "nabewerken"].includes(c.status));
  const fail = n((c) => c.status === "fout");
  const v = (k) => n((c) => c.eval?.verdict === k);
  const best = n((c) => c.eval?.best);
  const pct = d.budget ? Math.min(100, (d.spent / d.budget) * 100) : 0;
  $("#ov-stats").innerHTML = `
    <div class="stat"><b>${d.runs.length}</b><span>sessies</span></div>
    <div class="stat"><b>${done}</b><span>filmpjes klaar${busy ? ` · ${busy} bezig` : ""}${fail ? ` · ${fail} fout` : ""}</span></div>
    <div class="stat"><b class="c-good">${v("goed")}</b><span>goed volgens Claude · <span class="c-doubt">${v("twijfel")} twijfel</span> · <span class="c-bad">${v("onvoldoende")} onvoldoende</span></span></div>
    <div class="stat"><b>★ ${best}</b><span>beste voorbeelden</span></div>
    <div class="stat wide"><b>$${nl(d.spent)}</b><span>van $${nl(d.budget)} uitgegeven</span>
      <div class="bar"><i style="width:${pct}%"></i></div></div>
    <div class="stat muted"><span>bijgewerkt ${esc(fmtTime(d.now))} · ververst elke 15 s</span></div>`;
}

function renderRunCards() {
  const d = ov.data;
  if (!d.runs.length) {
    $("#ov-runs").innerHTML = `<p class="empty">Nog geen sessies. Zodra de sessie op je Mac de eerste run start, verschijnt die hier.</p>`;
    return;
  }
  $("#ov-runs").innerHTML = d.runs.map((r) => {
    const st = Object.entries(r.states).map(([k, v]) => `<span class="pill s-${esc(k)}">${v} ${esc(k)}</span>`).join("");
    const vd = ["goed", "twijfel", "onvoldoende"].filter((k) => r.verdicts[k])
      .map((k) => `<span class="pill v-${k}">${r.verdicts[k]} ${k}</span>`).join("");
    return `<article class="run-card" data-run="${esc(r.run_id)}">
      <div class="run-top"><h3>${esc(r.run_id)}</h3><span class="muted">${esc(fmtTime(r.created))}</span></div>
      ${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}
      <p class="muted small">${esc(r.persons.join(", "))}</p>
      <p class="muted small">${esc(r.models.join(" · "))}</p>
      <div class="pills">${st || `<span class="pill">alleen plan</span>`}${vd}</div>
      <div class="run-foot"><span>$${nl(r.spent)}</span>
        <span class="links"><button class="link" data-act="gallery">filmpjes</button>
        <button class="link" data-act="compare">vergelijken ›</button></span></div>
    </article>`;
  }).join("");
  $("#ov-runs").querySelectorAll(".run-card").forEach((card) => {
    card.querySelector('[data-act="compare"]').addEventListener("click", async () => {
      $("#run").value = card.dataset.run;
      showTab("videos");
      await loadRun(card.dataset.run);
    });
    card.querySelector('[data-act="gallery"]').addEventListener("click", () => {
      ov.run = card.dataset.run;
      $("#f-run").value = ov.run;
      renderGallery();
      $("#ov-gallery").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderFilters() {
  const d = ov.data;
  const models = [...new Map(d.clips.map((c) => [c.model, c.model_label])).entries()];
  $("#f-model").innerHTML = `<option value="">Alle modellen</option>` +
    models.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join("");
  $("#f-model").value = ov.model;
  $("#f-run").innerHTML = `<option value="">Alle sessies</option>` +
    d.runs.map((r) => `<option value="${esc(r.run_id)}">${esc(r.run_id)}</option>`).join("");
  $("#f-run").value = ov.run;
}

function filtered() {
  const f = ov.filter;
  return ov.data.clips.filter((c) => {
    if (ov.model && c.model !== ov.model) return false;
    if (ov.run && c.run_id !== ov.run) return false;
    if (f === "all") return true;
    if (f === "best") return c.eval?.best;
    if (f === "open") return c.status === "klaar" && !c.eval?.verdict;
    if (f === "busy") return c.status !== "klaar";
    return c.eval?.verdict === f;
  });
}

function badges(c) {
  const out = [];
  if (c.eval?.verdict) out.push(`<span class="badge v-${esc(c.eval.verdict)}">Claude: ${esc(c.eval.verdict)}${c.eval.best ? " ★" : ""}</span>`);
  if (c.rating?.rating) out.push(`<span class="badge g-${esc(c.rating.rating)}">jij: ${esc(c.rating.rating)}</span>`);
  if (c.metrics?.flags?.length) out.push(`<span class="badge flag" title="${esc(c.metrics.flags.join(" · "))}">${c.metrics.flags.length} signaal${c.metrics.flags.length > 1 ? "en" : ""}</span>`);
  return out.join("");
}

function renderGallery() {
  ov.list = filtered();
  const box = $("#ov-gallery");
  if (!ov.list.length) {
    box.innerHTML = `<p class="empty">Geen filmpjes bij dit filter.</p>`;
    return;
  }
  box.innerHTML = ov.list.map((c, i) => {
    const poster = c.files?.poster_first ? url(c.files.poster_first) : "";
    const media = c.status === "klaar" && c.files?.fps30
      ? `<video muted loop playsinline preload="none" ${poster ? `poster="${poster}"` : ""} data-src="${url(c.files.fps30)}"></video>`
      : `<div class="tile-ph ${c.status === "fout" ? "err" : ""}">${esc(c.status === "fout" ? "mislukt" : c.status)}</div>`;
    return `<figure class="tile" data-i="${i}">${media}
      <figcaption><b>${esc(c.person)}</b><span>${esc(c.model_label)}</span>
        <span class="muted small">${esc(c.variant)} ${esc(c.variant_naam)} · ${esc(c.run_id)}</span>
        <span class="tile-badges">${badges(c)}</span></figcaption></figure>`;
  }).join("");
  box.querySelectorAll(".tile").forEach((tile) => {
    const v = tile.querySelector("video");
    if (v) {
      tile.addEventListener("mouseenter", () => { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); });
      tile.addEventListener("mouseleave", () => { v.pause(); });
    }
    tile.addEventListener("click", () => openModal(Number(tile.dataset.i)));
  });
}

$("#f-verdict").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  ov.filter = b.dataset.f;
  $("#f-verdict").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  renderGallery();
});
$("#f-model").addEventListener("change", (e) => { ov.model = e.target.value; renderGallery(); });
$("#f-run").addEventListener("change", (e) => { ov.run = e.target.value; renderGallery(); });

function openModal(i) {
  if (i < 0 || i >= ov.list.length) return;
  ov.index = i;
  const c = ov.list[i];
  const v = $("#m-video");
  if (c.status === "klaar" && c.files?.fps30) {
    v.hidden = false;
    v.src = url(c.files.fps30);
    if (c.files.poster_first) v.poster = url(c.files.poster_first);
    v.playbackRate = ov.speed;
    v.play().catch(() => {});
  } else {
    v.pause();
    v.removeAttribute("src");
    v.hidden = true;
  }
  const me = c.metrics || {};
  const r = c.rating || {};
  const btn = (k) => `<button data-r="${k}" class="${r.rating === k ? "on" : ""}">${VERDICT_LABEL[k]}</button>`;
  const links = [me.sheet ? `<a href="${url(me.sheet)}" target="_blank" rel="noopener">contactblad</a>` : "",
    me.detail ? `<a href="${url(me.detail)}" target="_blank" rel="noopener">detail rond onthulling</a>` : ""].filter(Boolean).join(" · ");
  $("#m-info").innerHTML = `
    <h2>${esc(c.person)}</h2>
    <p class="muted">${esc(c.model_label)} · ${esc(c.variant)} ${esc(c.variant_naam)}<br>sessie ${esc(c.run_id)} · ≈ $${nl(c.cost || 0)} · ${i + 1} van ${ov.list.length}</p>
    <div class="tile-badges">${badges(c)}</div>
    ${c.eval?.note ? `<p class="claude-note">${esc(c.eval.note)}</p>` : ""}
    ${me.reveal_s !== undefined ? `<p class="muted small">onthulling ${me.reveal_s == null ? "–" : nl(me.reveal_s, 1) + " s"} · verborgen ${nl(me.hidden_s || 0, 1)} s · fade ${nl(me.fade_score || 0, 2)} · sprong ×${nl(me.jump_ratio || 0, 1)}</p>` : ""}
    ${me.flags?.length ? `<p class="flags small">${esc(me.flags.join(" · "))}</p>` : ""}
    ${c.error ? `<p class="flags small">${esc(c.error)}</p>` : ""}
    ${links ? `<p class="small">${links}</p>` : ""}
    <div class="m-frames">
      ${c.start_file ? `<figure><img src="${url(c.start_file)}" alt=""><figcaption>start</figcaption></figure>` : ""}
      ${c.end_file ? `<figure><img src="${url(c.end_file)}" alt=""><figcaption>eind</figcaption></figure>` : ""}
    </div>
    <div class="rate">${btn("goed")}${btn("twijfel")}${btn("onvoldoende")}</div>
    <textarea id="m-note" placeholder="Jouw notitie">${esc(r.note || "")}</textarea>
    <details><summary>Prompt</summary><p class="small">${esc(c.prompt)}</p></details>`;
  const save = async (rating) => {
    const res = await api("/api/rating", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: c.run_id, clip_id: c.clip_id, rating, note: $("#m-note").value }),
    });
    c.rating = res.ratings[c.clip_id] || {};
    $("#m-info").querySelectorAll(".rate button").forEach((b) => b.classList.toggle("on", b.dataset.r === c.rating.rating));
    $("#m-info .tile-badges").innerHTML = badges(c);
  };
  $("#m-info").querySelectorAll(".rate button").forEach((b) => b.addEventListener("click", () =>
    save((c.rating?.rating || "") === b.dataset.r ? "" : b.dataset.r).catch((e) => alert("Opslaan mislukt: " + e.message))));
  $("#m-note").addEventListener("change", () => save(c.rating?.rating || "").catch(() => {}));
  $("#modal").hidden = false;
}

function closeModal() {
  $("#m-video").pause();
  $("#modal").hidden = true;
  renderGallery();
}

$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
$(".modal-close").addEventListener("click", closeModal);
document.querySelectorAll(".modal-ctl .nav").forEach((b) => b.addEventListener("click", () => openModal(ov.index + Number(b.dataset.d))));
$("#m-speed").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  ov.speed = Number(b.dataset.s);
  $("#m-video").playbackRate = ov.speed;
  $("#m-speed").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
});
document.addEventListener("keydown", (e) => {
  if ($("#modal").hidden || e.target.closest("textarea, input, select")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") openModal(ov.index - 1);
  if (e.key === "ArrowRight") openModal(ov.index + 1);
  if (e.code === "Space") { e.preventDefault(); const v = $("#m-video"); v.paused ? v.play() : v.pause(); }
});

setInterval(() => {
  if (!$("#overview").hidden && $("#modal").hidden && document.visibilityState === "visible") loadOverview();
}, 15000);

loadRuns().catch((e) => { $("#cards").innerHTML = `<p class="empty">Kan runs niet laden: ${esc(e.message)}</p>`; });
showTab(new URLSearchParams(location.search).get("tab") || "overview");
