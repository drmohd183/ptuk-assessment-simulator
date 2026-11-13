/* محاكي القياس والتقويم — المنطق الرئيس */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CFG = window.SIM_CONFIG || {};
const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e) { return false; } },
  del(k){ try { localStorage.removeItem(k); } catch(e) {} }
};
const BANKS = {ar: window.BANK_AR || [], en: window.BANK_EN || []};
const LETTERS = {ar: ["أ","ب","ج","د","هـ","و"], en: ["a","b","c","d","e","f"]};
const ETYPE = {midterm: "نصفي", final: "نهائي"};
const LANG = {ar: "العربية", en: "الإنجليزية"};
const normName = s => String(s || "").trim().replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة\b/g, "ه").replace(/ى\b/g, "ي").toLowerCase();

function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function semesterOf(d){
  d = new Date(d); const m = d.getMonth() + 1, y = d.getFullYear();
  if (m >= 9) return `الفصل الأول ${y}/${y+1}`;
  if (m === 1) return `الفصل الأول ${y-1}/${y}`;
  if (m <= 6) return `الفصل الثاني ${y-1}/${y}`;
  return `الفصل الصيفي ${y-1}/${y}`;
}
const fmtDate = d => new Date(d).toLocaleString("ar-EG", {year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit"});

/* ================= navigation ================= */
function showView(v){
  $$("nav.tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === v)));
  $$("section.view").forEach(s => s.classList.toggle("on", s.id === "view-" + v));
  if (v === "history") renderHistory();
  if (v === "home") refreshHome();
  window.scrollTo({top: 0});
}
$$("nav.tabs button").forEach(b => b.onclick = () => {
  if (b.dataset.view === "home" && CUR && CUR.phase !== "done") { showView("train"); $$("nav.tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b))); return; }
  showView(b.dataset.view);
});

/* ================= handbook & policy ================= */
function buildDoc(html, docSel, tocSel, prefix, unitTrack){
  const doc = $(docSel), toc = $(tocSel); doc.innerHTML = html;
  let u = 0; const links = [];
  doc.querySelectorAll("h1,h2,h3,h4").forEach(h => {
    const t = h.textContent.trim(); const m = t.match(/^(\d+(?:\.\d+)*)\s/);
    if (h.tagName === "H2") { u++; h.id = prefix + "-u" + u; if (m) h.dataset.num = m[1]; }
    if (m && h.tagName !== "H2") h.id = prefix + "-" + m[1].replace(/\./g, "-");
    else if (m && h.tagName === "H2") { h.id = prefix + "-" + m[1].replace(/\./g, "-"); }
    if (!h.id) h.id = prefix + "-h" + links.length;
    if (h.tagName === "H2" || h.tagName === "H3") links.push({id: h.id, t, lvl: h.tagName === "H2" ? 2 : 3, unit: u});
  });
  if (unitTrack) {
    const done = LS.get("sim_units", {});
    doc.querySelectorAll("h2").forEach((h, i) => {
      if (!/الوحدة/.test(h.textContent)) return;
      let end = h.nextElementSibling; let last = h;
      while (end && end.tagName !== "H2") { last = end; end = end.nextElementSibling; }
      const box = document.createElement("div"); box.className = "unit-done";
      const key = h.textContent.trim().split(":")[0];
      box.innerHTML = `<label class="choice" style="display:inline-flex"><input type="checkbox" ${done[key] ? "checked" : ""}> أنهيت قراءة ${esc(key)}</label>`;
      box.querySelector("input").onchange = e => { const d = LS.get("sim_units", {}); if (e.target.checked) d[key] = new Date().toISOString(); else delete d[key]; LS.set("sim_units", d); renderToc(); };
      last.after(box);
    });
  }
  function renderToc(filter){
    const done = LS.get("sim_units", {});
    const f = (filter || "").trim();
    let shown = links;
    if (f) { shown = links.filter(l => { const el = document.getElementById(l.id); let txt = el.textContent; let n = el.nextElementSibling; while (n && !/^H[23]$/.test(n.tagName)) { txt += " " + n.textContent; n = n.nextElementSibling; } return txt.includes(f); }); }
    toc.innerHTML = `<input type="search" placeholder="ابحث في ${prefix === "hb" ? "الدليل" : "السياسة"}…" value="${esc(f)}">` +
      shown.map(l => `<a href="#${l.id}" class="l${l.lvl}" data-id="${l.id}">${esc(l.t)}${unitTrack && l.lvl === 2 && done[l.t.split(":")[0]] ? ' <span class="done">✓</span>' : ""}</a>`).join("") + (shown.length ? "" : '<div class="muted">لا نتائج.</div>');
    const inp = toc.querySelector("input"); inp.oninput = () => { renderToc(inp.value); const i2 = toc.querySelector("input"); i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); };
    toc.querySelectorAll("a").forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.dataset.id).scrollIntoView({behavior: "smooth", block: "start"}); });
  }
  renderToc();
}
buildDoc(window.HANDBOOK_HTML || "<p>الدليل غير متوفر.</p>", "#hb-doc", "#hb-toc", "hb", true);
buildDoc(window.POLICY_HTML || "<p>السياسة غير متوفرة.</p>", "#po-doc", "#po-toc", "po", false);
function openRef(doc, num){
  showView(doc === "po" ? "policy" : "handbook");
  const el = document.getElementById(doc + "-" + String(num).replace(/\./g, "-"));
  if (el) setTimeout(() => el.scrollIntoView({behavior: "smooth", block: "start"}), 50);
}
document.addEventListener("click", e => { const a = e.target.closest("a[data-ref]"); if (!a) return; e.preventDefault(); const [d, n] = a.dataset.ref.split(":"); openRef(d, n); });
const refLink = (num, label) => `<a href="#" data-ref="hb:${num}">${esc(label || ("الدليل " + num))}</a>`;

/* ================= setup ================= */
const dl = $("#depts"); (CFG.DEPARTMENTS || []).forEach(d => { const o = document.createElement("option"); o.value = d; dl.appendChild(o); });
const PROFILE_KEY = "sim_profile";
(function fillProfile(){ const p = LS.get(PROFILE_KEY, null); if (!p) return;
  $("#f-name").value = p.name || ""; $("#f-dept").value = p.dept || ""; $("#f-course").value = p.course || ""; $("#f-level").value = p.level || "L2";
  if (p.lang) { const r = document.querySelector(`input[name=lang][value=${p.lang}]`); if (r) r.checked = true; }
  if (p.etype) { const r = document.querySelector(`input[name=etype][value=${p.etype}]`); if (r) r.checked = true; }
  if (p.field) { const r = document.querySelector(`input[name=field][value=${p.field}]`); if (r) r.checked = true; }
})();
function attemptsThisSemester(name){ const sem = semesterOf(new Date()); const n = normName(name); return LS.get("sim_hist", []).filter(h => normName(h.name) === n && h.semester === sem).length; }
function refreshHome(){
  const nm = $("#f-name").value.trim();
  $("#attempt-count").textContent = nm ? `محاولاتك المكتملة على هذا الجهاز في ${semesterOf(new Date())}: ${attemptsThisSemester(nm)}. عدد المحاولات غير محدود.` : "";
  const cur = LS.get("sim_cur", null);
  $("#resume-card").hidden = !(cur && cur.phase !== "done");
  if (cur && cur.phase !== "done") $("#resume-info").textContent = `${cur.profile.name} · ${cur.profile.course} · بدأت ${fmtDate(cur.startedAt)}`;
}
$("#f-name").addEventListener("input", refreshHome);
$("#setup").addEventListener("submit", e => {
  e.preventDefault();
  const p = {name: $("#f-name").value.trim().replace(/\s+/g, " "), dept: $("#f-dept").value.trim(), course: $("#f-course").value.trim(), level: $("#f-level").value,
    lang: (document.querySelector("input[name=lang]:checked") || {}).value, etype: (document.querySelector("input[name=etype]:checked") || {}).value, field: (document.querySelector("input[name=field]:checked") || {}).value, size: 10};
  const errs = [];
  if (p.name.length < 5 || p.name.split(" ").length < 2) errs.push("اكتب اسم المحاضر الكامل (الاسم الأول واسم العائلة على الأقل).");
  if (!p.dept) errs.push("اكتب اسم القسم.");
  if (!p.course) errs.push("اكتب اسم المساق.");
  if (!p.lang) errs.push("اختر لغة الامتحان.");
  if (!p.etype) errs.push("اختر نوع الامتحان (نصفي أو نهائي).");
  if (!p.field) errs.push("اختر مجال تخصص المساق (علمي أو إنساني).");
  if (p.lang && !BANKS[p.lang].length) errs.push("بنك الأمثلة لهذه اللغة غير محمّل.");
  const box = $("#setup-err"); box.hidden = !errs.length; box.innerHTML = errs.map(esc).join("<br>");
  if (errs.length) return;
  LS.set(PROFILE_KEY, p);
  startAttempt(p);
});
$("#btn-resume").onclick = () => { CUR = LS.get("sim_cur", null); if (CUR) { showView("train"); render(); } };
$("#btn-discard").onclick = () => { LS.del("sim_cur"); refreshHome(); };

/* ================= attempt construction ================= */
let CUR = null;
const save = () => LS.set("sim_cur", CUR);
const byId = id => { for (const l of ["ar","en"]) { const it = BANKS[l].find(x => x.id === id); if (it) return it; } return null; };

function pickItems(p){
  /* 10 items, all from the lecturer's field (scientific or humanities), least-seen first, with a varied mix of types */
  const pool = BANKS[p.lang].filter(x => x.f === p.field);
  const seen = LS.get("sim_seen_" + normName(p.name), {});
  const CAP = {mcq: 3, tf: 2, matching: 1, completion: 2, context: 1, short: 1, restricted: 1, extended: 1, problem: 1};
  const order = shuffle(pool).sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
  const out = [], cnt = {}; let sound = 0;
  for (const pass of [0, 1]) {               /* pass 1 relaxes the caps if the pool is short */
    for (const it of order) {
      if (out.length >= 10) break;
      if (out.includes(it)) continue;
      if (!pass && ((cnt[it.t] || 0) >= (CAP[it.t] || 1) || (it.ok && sound >= 5))) continue;
      out.push(it); cnt[it.t] = (cnt[it.t] || 0) + 1; if (it.ok) sound++;
    }
  }
  return shuffle(out).map(x => x.id);
}
function startAttempt(p){
  const ids = pickItems(p);
  const scen = SIM.SCENARIOS[p.etype][Math.floor(Math.random() * SIM.SCENARIOS[p.etype].length)];
  const pq = SIM.POLICY_Q.map((q, i) => ({q, i}));
  const own = shuffle(pq.filter(x => x.q.t === p.etype)).slice(0, 2), both = shuffle(pq.filter(x => x.q.t === "both")).slice(0, 2);
  CUR = {v: 1, profile: p, startedAt: new Date().toISOString(), phase: "items", idx: 0, ids,
    ans: {}, scenario: scen, bp: null, policy: shuffle([...own, ...both]).map(x => ({i: x.i, order: shuffle([0,1,2,3]), sel: null}))};
  save(); showView("train"); render();
}

/* ================= rendering ================= */
function progress(){
  const n = CUR.ids.length, steps = n + 2;
  let done = CUR.phase === "items" ? CUR.idx : CUR.phase === "blueprint" ? n : CUR.phase === "policy" ? n + 1 : steps;
  $("#pg-bar").style.width = (100 * done / steps) + "%";
  $("#pg-label").textContent = CUR.phase === "items" ? `السؤال ${CUR.idx + 1} من ${n}` : CUR.phase === "blueprint" ? "مهمة مخطط الامتحان" : CUR.phase === "policy" ? "أسئلة السياسة" : "اكتملت المحاولة";
  const p = CUR.profile; $("#pg-meta").textContent = `${p.name} · ${p.course} · امتحان ${ETYPE[p.etype]} باللغة ${LANG[p.lang]}`;
}
function render(){
  progress();
  if (CUR.phase === "items") return renderItem();
  if (CUR.phase === "blueprint") return renderBlueprint();
  if (CUR.phase === "policy") return renderPolicy();
  if (CUR.phase === "done") return finish();
}

function itemDisplay(it){
  const lang = it.id.startsWith("en") ? "en" : "ar"; const L = LETTERS[lang];
  let body = esc(it.s);
  if (it.o && it.o.length) body += `<div class="opts">${it.o.map((o, i) => `${L[i]}) ${esc(o)}`).join("<br>")}</div>`;
  return `<div class="item-box" dir="${lang === "en" ? "ltr" : "rtl"}">${body}</div>`;
}
function revDisplay(txt, lang){ return `<span dir="${lang === "en" ? "ltr" : "rtl"}" style="display:block">${esc(txt)}</span>`; }

function renderItem(){
  const id = CUR.ids[CUR.idx], it = byId(id), a = CUR.ans[id] || (CUR.ans[id] = {stage: "diag"});
  const lang = id.startsWith("en") ? "en" : "ar", T = SIM.TYPES[it.t];
  const rules = SIM.rulesFor(it.t);
  if (!a.ruleOrder) { a.ruleOrder = shuffle(rules); save(); }
  const st = $("#stage");
  const head = `<div class="item-head"><div class="row"><span class="pill brand">${esc(T.ar)}</span><span class="pill">${it.f === "s" ? "تخصص علمي" : "تخصص إنساني"}: ${esc(it.d)}</span>${it.m ? `<span class="pill">${esc(it.m)}</span>` : ""}</div><span class="muted small">${esc(id)}</span></div>`;
  let html = `<div class="card">${head}${itemDisplay(it)}`;
  const locked = a.stage !== "diag";
  html += `<div class="q">1. ما حكمك على هذا السؤال؟</div>
    <div class="seg" id="q-judge">${[["ok","سليم ويتوافق مع قواعد الدليل"],["flawed","يحتاج تعديلاً"]].map(([v,t]) => `<label><input type="radio" name="judge" value="${v}" ${a.judge === v ? "checked" : ""} ${locked ? "disabled" : ""}> ${t}</label>`).join("")}</div>
    <div class="q">2. إذا كان يحتاج تعديلاً، فأيّ القواعد يخالف؟ <span class="muted small">(اختر كل ما ينطبق)</span></div>
    <div class="choices" id="q-rules">${a.ruleOrder.map(c => {
      let cls = ""; if (locked && a.stage === "feedback") { const inC = it.fl.includes(c), inS = (a.rules || []).includes(c); cls = inC ? "correct" : inS ? "wrong" : ""; }
      return `<label class="choice ${cls}"><input type="checkbox" value="${c}" ${(a.rules || []).includes(c) ? "checked" : ""} ${locked ? "disabled" : ""}><span><span class="code">${c}</span>${esc(SIM.RULES[c].ar)}</span></label>`; }).join("")}</div>
    <div class="q">3. ما المستوى المعرفي الذي يقيسه السؤال فعلاً؟</div>
    <div class="seg bloom-row" id="q-bloom">${Object.entries(SIM.BLOOM).map(([k, b]) => `<label><input type="radio" name="bloom" value="${k}" ${a.bloom === k ? "checked" : ""} ${locked ? "disabled" : ""}> ${b.ar}</label>`).join("")}</div>`;
  if (a.stage === "diag") html += `<div class="err" id="item-err" hidden></div><div class="actions"><span class="muted small">مرجع القواعد: ${refLink(T.unit === "2" ? "2.2" : T.unit === "3" ? T.ref.match(/\d\.\d/)[0] : T.unit === "4" ? "4.1" : "5.2", "اقرأ قواعد هذا النوع في الدليل")}</span><button class="btn primary" id="btn-check">تحقق</button></div>`;
  if (a.stage === "rev" || (a.stage === "feedback" && !it.ok)) {
    if (!a.revOrder) { a.revOrder = shuffle(it.rv.map((_, i) => i)); save(); }
    html += `<div class="q" style="margin-top:22px">4. هذا السؤال يحتاج تعديلاً فعلاً. أيّ الصيغ الآتية هي النسخة المحسّنة التي تعالج عيوبه دون أن تُحدث عيباً جديداً؟</div>
    <div class="choices" id="q-rev">${a.revOrder.map((ri, n) => { const r = it.rv[ri]; let cls = "";
      if (a.stage === "feedback") cls = r[1] ? "correct" : (a.rev === ri ? "wrong" : "");
      return `<label class="choice revtext ${cls}"><input type="radio" name="rev" value="${ri}" ${a.rev === ri ? "checked" : ""} ${a.stage === "feedback" ? "disabled" : ""}><span style="flex:1">${revDisplay(r[0], lang)}${a.stage === "feedback" && !r[1] && r[2] ? `<span class="muted small" style="display:block;margin-top:4px">✗ ${esc(r[2])}</span>` : ""}</span></label>`; }).join("")}</div>`;
    if (a.stage === "rev") html += `<div class="err" id="item-err" hidden></div><div class="actions"><span></span><button class="btn primary" id="btn-rev">تأكيد الاختيار</button></div>`;
  }
  if (a.stage === "feedback") html += feedbackHTML(it, a);
  html += `</div>`;
  st.innerHTML = html;
  const chk = $("#btn-check");
  if (chk) chk.onclick = () => {
    a.judge = (document.querySelector("input[name=judge]:checked") || {}).value;
    a.rules = $$("#q-rules input:checked").map(x => x.value);
    a.bloom = (document.querySelector("input[name=bloom]:checked") || {}).value;
    const e = []; if (!a.judge) e.push("حدد حكمك على السؤال."); if (a.judge === "flawed" && !a.rules.length) e.push("اختر قاعدة واحدة على الأقل، لأنك حكمت بأن السؤال يحتاج تعديلاً."); if (!a.bloom) e.push("حدد المستوى المعرفي.");
    if (a.judge === "ok") a.rules = [];
    if (e.length) { const b = $("#item-err"); b.hidden = false; b.innerHTML = e.join("<br>"); return; }
    a.stage = it.ok ? "feedback" : "rev"; if (it.ok) scoreItem(it, a); save(); renderItem();
    if (!it.ok) setTimeout(() => $("#q-rev") && $("#q-rev").scrollIntoView({behavior: "smooth", block: "center"}), 50);
  };
  const rb = $("#btn-rev");
  if (rb) rb.onclick = () => {
    const v = document.querySelector("input[name=rev]:checked"); if (!v) { const b = $("#item-err"); b.hidden = false; b.textContent = "اختر صيغة."; return; }
    a.rev = +v.value; a.stage = "feedback"; scoreItem(it, a); save(); renderItem();
    setTimeout(() => $(".feedback") && $(".feedback").scrollIntoView({behavior: "smooth", block: "center"}), 50);
  };
  const nx = $("#btn-next");
  if (nx) nx.onclick = () => { CUR.idx++; if (CUR.idx >= CUR.ids.length) CUR.phase = "blueprint"; save(); render(); window.scrollTo({top: 0}); };
}

function scoreItem(it, a){
  const C = it.fl || [], S = a.rules || [];
  const b1 = SIM.BLOOM[a.bloom]?.i, b2 = SIM.BLOOM[it.bl]?.i;
  const bloomPts = b1 === b2 ? 2 : Math.abs(b1 - b2) === 1 ? 1 : 0;
  let judgePts, rulesPts, revPts = null;
  if (it.ok) {
    judgePts = a.judge === "ok" ? 5 : 0;
    rulesPts = a.judge === "ok" ? 3 : 0;
  } else {
    judgePts = a.judge === "flawed" ? 2 : 0;
    const hits = S.filter(x => C.includes(x)).length, fp = S.filter(x => !C.includes(x)).length;
    rulesPts = C.length ? Math.max(0, Math.min(3, 3 * hits / C.length - 0.75 * fp)) : 0;
    revPts = it.rv[a.rev] && it.rv[a.rev][1] ? 3 : 0;
  }
  a.pts = {judge: judgePts, rules: Math.round(rulesPts * 100) / 100, bloom: bloomPts, rev: revPts};
  a.score = Math.round((judgePts + rulesPts + bloomPts + (revPts || 0)) * 10) / 10;
}

function feedbackHTML(it, a){
  const p = a.pts, lang = it.id.startsWith("en") ? "en" : "ar";
  const T = SIM.TYPES[it.t];
  const verdict = it.ok ? `<span class="pill ok">السؤال سليم</span>` : `<span class="pill bad">السؤال يحتاج تعديلاً</span>`;
  const rulesTxt = it.ok ? "لا توجد مخالفة" : it.fl.map(c => `<span class="code" style="font-family:monospace">${c}</span> ${esc(SIM.RULES[c].ar)}`).join("<br>");
  const keyTxt = it.k != null && it.k !== "" ? (typeof it.k === "number" && it.o ? `${LETTERS[lang][it.k]}) ${it.o[it.k]}` : String(it.k)) : "";
  return `<div class="feedback">
    <div class="row between"><h4>التغذية الراجعة ${verdict}</h4><div class="score">${a.score} من 10</div></div>
    <div class="fb-grid">
      <div>الحكم<b>${it.ok ? p.judge + " من 5" : p.judge + " من 2"}</b></div>
      <div>القواعد<b>${p.rules} من 3</b></div>
      <div>المستوى المعرفي<b>${p.bloom} من 2</b><span class="muted">الصحيح: ${SIM.BLOOM[it.bl].ar}${a.bloom !== it.bl ? ` · اخترت: ${SIM.BLOOM[a.bloom].ar}` : ""}</span></div>
      <div>${it.ok ? "—" : "الصياغة المحسّنة"}<b>${it.ok ? "" : p.rev + " من 3"}</b></div>
    </div>
    <div class="small"><b>القواعد المخالَفة:</b><br>${rulesTxt}</div>
    ${keyTxt ? `<div class="small" style="margin-top:6px"><b>الإجابة الصحيحة للسؤال${it.ok ? "" : " الأصلي"}:</b> <span dir="${lang === "en" ? "ltr" : "rtl"}">${esc(keyTxt)}</span></div>` : ""}
    <p style="margin:8px 0 0">${esc(it.ex)}</p>
    <div class="actions"><span class="muted small">للمراجعة: ${refLink(T.unit === "2" ? "2.2" : T.unit === "4" ? "4.1" : (T.ref.match(/\d\.\d/) || ["5.2"])[0], T.ref)} · ${refLink("1.2", "مستويات بلوم 1.2")}</span><button class="btn primary" id="btn-next">${CUR.idx + 1 < CUR.ids.length ? "السؤال التالي" : "إلى مهمة مخطط الامتحان"}</button></div>
  </div>`;
}

/* ================= blueprint task ================= */
function bpEval(sc, v, level){
  const T = sc.total, L = SIM.LEVELS[level], checks = [];
  const n = x => Number.isFinite(+x) && x !== "" ? +x : NaN;
  const topicMarks = sc.topics.map((_, i) => n(v.topics?.[i]));
  const hrs = sc.topics.reduce((s, t) => s + t[1], 0);
  const tsum = topicMarks.reduce((s, x) => s + (x || 0), 0);
  const tol = Math.max(1, Math.round(T * 0.04));
  const off = sc.topics.map((t, i) => ({name: t[0], want: T * t[1] / hrs, got: topicMarks[i]})).filter(x => !(Math.abs(x.got - x.want) <= tol));
  checks.push({k: "topics", ok: tsum === T && !off.length && topicMarks.every(Number.isFinite),
    label: "أوزان الموضوعات تتبع ساعات التدريس، ومجموعها يساوي علامة الامتحان",
    detail: tsum !== T ? `مجموع علامات الموضوعات ${tsum || 0} والمطلوب ${T}.` : off.length ? off.map(x => `${x.name}: ${Number.isFinite(x.got) ? x.got : "—"} والمتوقع نحو ${x.want.toFixed(1)}`).join("؛ ") : "متوافقة مع ساعات التدريس."});
  const bl = ["remember","understand","apply","higher"].map(k => n(v.bloom?.[k])); const bsum = bl.reduce((s, x) => s + (x || 0), 0);
  const pct = x => 100 * x / T;
  const inR = (x, r) => Number.isFinite(x) && pct(x) >= r[0] - 100 * 0.5 / T && pct(x) <= r[1] + 100 * 0.5 / T;
  const names = {remember: "التذكر", understand: "الفهم", apply: "التطبيق", higher: "التحليل والتقييم والإبداع"};
  ["remember","understand","apply","higher"].forEach((k, i) => {
    const r = L[k], x = bl[i];
    const rangeTxt = k === "remember" ? `لا يزيد عن ${r[1]}%` : r[1] >= 100 ? `${r[0]}% فأكثر` : `${r[0]}% – ${r[1]}%`;
    checks.push({k: "bloom-" + k, ok: bsum === T && inR(x, r), label: `${names[k]}: ${rangeTxt} (${L.ar})`,
      detail: bsum !== T ? `مجموع علامات المستويات ${bsum || 0} والمطلوب ${T}.` : `أدخلت ${Number.isFinite(x) ? x : "—"} علامة = ${Number.isFinite(x) ? pct(x).toFixed(0) : "—"}%.`});
  });
  const mcq = n(v.mcq), tf = n(v.tf), ess = n(v.essay); const qsum = (mcq || 0) + (tf || 0) + (ess || 0);
  const obj = (mcq || 0) + (tf || 0);
  checks.push({k: "obj", ok: qsum === T && pct(obj) >= 40 && pct(obj) <= 70, label: "الأسئلة الموضوعية بين 40% و70% من العلامة (السياسة 3.2)",
    detail: qsum !== T ? `مجموع علامات الأنواع ${qsum} والمطلوب ${T}.` : `الموضوعية ${obj} علامة = ${pct(obj).toFixed(0)}%.`});
  checks.push({k: "tf", ok: qsum === T && Number.isFinite(tf) && pct(tf) <= 10, label: "الصواب والخطأ لا يزيد على 10% من العلامة (السياسة 3.1)",
    detail: `الصواب والخطأ ${Number.isFinite(tf) ? tf : "—"} علامة = ${Number.isFinite(tf) ? pct(tf).toFixed(0) : "—"}%.`});
  const minutes = (mcq || 0) * 1.25 + (tf || 0) * 0.5 + (ess || 0) * 2.5;
  checks.push({k: "time", ok: qsum === T && minutes <= sc.minutes && minutes >= sc.minutes * 0.5, label: `الزمن المقدّر يتسع له الامتحان (${sc.minutes} دقيقة) دون أن يكون قصيراً جداً (السياسة 3.4-5)`,
    detail: `الزمن المقدّر ${Math.round(minutes)} دقيقة (1.25 دقيقة لكل اختيار من متعدد، ونصف دقيقة لكل صواب وخطأ، و2.5 دقيقة لكل علامة إنشائية).`});
  const passed = checks.filter(c => c.ok).length;
  return {checks, passed, total: checks.length, score: Math.round(15 * passed / checks.length * 10) / 10};
}
function renderBlueprint(){
  const sc = CUR.scenario, p = CUR.profile, v = CUR.bp?.v || {topics: [], bloom: {}}, done = !!CUR.bp?.result;
  const hrs = sc.topics.reduce((s, t) => s + t[1], 0);
  const inp = (path, val) => `<input type="number" min="0" step="1" data-path="${path}" value="${val ?? ""}" ${done ? "disabled" : ""}>`;
  let html = `<div class="card"><h3>مهمة مخطط الامتحان</h3>
  <p>أنت تعد مخطط <b>الامتحان ${ETYPE[p.etype]}</b> لمساق «${esc(p.course)}»، وهو من ${esc(SIM.LEVELS[p.level].ar)}. علامة الامتحان <b>${sc.total}</b> وزمنه <b>${sc.minutes} دقيقة</b>. ${p.etype === "midterm" ? "يغطي الامتحان النصفي الموضوعات التي دُرّست حتى موعده." : "يغطي الامتحان النهائي جميع موضوعات المساق."} وزّع العلامات وفق السياسة، وكل الأعداد صحيحة. اعتبر كل سؤال اختيار من متعدد أو صواب وخطأ بعلامة واحدة.</p>
  <h4>أ) توزيع العلامات على الموضوعات</h4>
  <table class="bp"><tr><th>الموضوع</th><th>ساعات التدريس</th><th>العلامة</th></tr>${sc.topics.map((t, i) => `<tr><td>${esc(t[0])}</td><td>${t[1]}</td><td>${inp("topics." + i, v.topics?.[i])}</td></tr>`).join("")}<tr><th>المجموع</th><th>${hrs}</th><th id="sum-topics"></th></tr></table>
  <h4>ب) توزيع العلامات على مستويات التفكير</h4>
  <table class="bp"><tr><th>التذكر</th><th>الفهم</th><th>التطبيق</th><th>التحليل والتقييم والإبداع</th><th>المجموع</th></tr><tr>${["remember","understand","apply","higher"].map(k => `<td>${inp("bloom." + k, v.bloom?.[k])}</td>`).join("")}<td id="sum-bloom"></td></tr></table>
  <h4>ج) توزيع العلامات على أنواع الأسئلة</h4>
  <table class="bp"><tr><th>اختيار من متعدد (عدد = علامات)</th><th>صواب وخطأ (عدد = علامات)</th><th>أسئلة إنشائية (علامات)</th><th>المجموع</th></tr><tr><td>${inp("mcq", v.mcq)}</td><td>${inp("tf", v.tf)}</td><td>${inp("essay", v.essay)}</td><td id="sum-types"></td></tr></table>
  <p class="muted small">مرجع: ${refLink("1.3", "مثال المخطط المحلول 1.3")} و${refLink("1.4", "1.4")}، و<a href="#" data-ref="po:3-3">السياسة 3.3</a>.</p>`;
  if (done) {
    const r = CUR.bp.result;
    html += `<div class="feedback"><div class="row between"><h4>نتيجة المخطط</h4><div class="score">${r.passed} من ${r.total} شروط · ${r.score} من 15</div></div><ul class="check-list">${r.checks.map(c => `<li class="${c.ok ? "ok" : "bad"}">${c.ok ? "✓" : "✗"} <b>${esc(c.label)}</b><br><span class="small">${esc(c.detail)}</span></li>`).join("")}</ul>
    <div class="actions"><span></span><button class="btn primary" id="btn-bp-next">إلى أسئلة السياسة</button></div></div>`;
  } else html += `<div class="err" id="bp-err" hidden></div><div class="actions"><span class="muted small">يمكنك تعديل الأرقام قبل التحقق؛ يُحتسب التحقق مرة واحدة.</span><button class="btn primary" id="btn-bp">تحقق من المخطط</button></div>`;
  html += `</div>`;
  $("#stage").innerHTML = html;
  const read = () => { const o = {topics: [], bloom: {}}; $$("#stage input[data-path]").forEach(i => { const [a, b] = i.dataset.path.split("."); const val = i.value === "" ? "" : +i.value; if (b !== undefined) { if (a === "topics") o.topics[+b] = val; else o.bloom[b] = val; } else o[a] = val; }); return o; };
  const sums = () => { const o = read(); const s = a => a.reduce((x, y) => x + (+y || 0), 0);
    $("#sum-topics").textContent = s(o.topics) + " من " + sc.total; $("#sum-bloom").textContent = s(Object.values(o.bloom)) + " من " + sc.total; $("#sum-types").textContent = s([o.mcq, o.tf, o.essay]) + " من " + sc.total; };
  sums(); $$("#stage input[data-path]").forEach(i => i.addEventListener("input", () => { sums(); CUR.bp = {v: read()}; save(); }));
  const b = $("#btn-bp");
  if (b) b.onclick = () => { const o = read(); const all = [...o.topics.slice(0, sc.topics.length), ...["remember","understand","apply","higher"].map(k => o.bloom[k]), o.mcq, o.tf, o.essay];
    if (all.some(x => x === "" || x == null) || o.topics.length < sc.topics.length) { const e = $("#bp-err"); e.hidden = false; e.textContent = "املأ جميع الخانات (اكتب 0 حيث لا توجد علامات)."; return; }
    CUR.bp = {v: o, result: bpEval(sc, o, p.level)}; save(); renderBlueprint(); };
  const nx = $("#btn-bp-next"); if (nx) nx.onclick = () => { CUR.phase = "policy"; save(); render(); window.scrollTo({top: 0}); };
}

/* ================= policy questions ================= */
function renderPolicy(){
  const done = CUR.policy.every(x => x.sel != null) && CUR.policyDone;
  let html = `<div class="card"><h3>أسئلة السياسة: الامتحان ${ETYPE[CUR.profile.etype]}</h3>`;
  CUR.policy.forEach((x, n) => { const q = SIM.POLICY_Q[x.i];
    html += `<div class="q">${n + 1}. ${esc(q.q)}</div><div class="choices">${x.order.map(oi => { let cls = ""; if (done) cls = oi === q.k ? "correct" : (x.sel === oi ? "wrong" : "");
      return `<label class="choice ${cls}"><input type="radio" name="pq${n}" value="${oi}" ${x.sel === oi ? "checked" : ""} ${done ? "disabled" : ""}> ${esc(q.o[oi])}</label>`; }).join("")}</div>${done ? `<p class="small muted" style="margin:4px 0 10px">${esc(q.ex)}</p>` : ""}`; });
  if (!done) html += `<div class="err" id="pq-err" hidden></div><div class="actions"><span></span><button class="btn primary" id="btn-pq">تحقق</button></div>`;
  else html += `<div class="actions"><span>صحيح: ${CUR.policy.filter(x => x.sel === SIM.POLICY_Q[x.i].k).length} من ${CUR.policy.length}</span><button class="btn primary" id="btn-finish">إنهاء المحاولة وعرض التقرير</button></div>`;
  html += `</div>`; $("#stage").innerHTML = html;
  const b = $("#btn-pq"); if (b) b.onclick = () => { let miss = false; CUR.policy.forEach((x, n) => { const r = document.querySelector(`input[name=pq${n}]:checked`); if (r) x.sel = +r.value; else miss = true; });
    if (miss) { const e = $("#pq-err"); e.hidden = false; e.textContent = "أجب عن جميع الأسئلة."; return; } CUR.policyDone = true; save(); renderPolicy(); };
  const f = $("#btn-finish"); if (f) f.onclick = () => { CUR.phase = "done"; CUR.finishedAt = new Date().toISOString(); save(); render(); };
}

/* ================= finish & report ================= */
function computeReport(){
  const p = CUR.profile; const items = CUR.ids.map(id => ({it: byId(id), a: CUR.ans[id]})).filter(x => x.it && x.a && x.a.pts);
  const sk = {judge: [0,0], rules: [0,0], bloom: [0,0], revision: [0,0]};
  const byType = {}, byField = {s: [0,0], h: [0,0]};
  items.forEach(({it, a}) => {
    const P = a.pts;
    sk.judge[0] += it.ok ? P.judge / 5 * 2 : P.judge; sk.judge[1] += 2;
    sk.rules[0] += P.rules; sk.rules[1] += 3;
    sk.bloom[0] += P.bloom; sk.bloom[1] += 2;
    if (!it.ok) { sk.revision[0] += P.rev; sk.revision[1] += 3; }
    (byType[it.t] = byType[it.t] || [0,0]); byType[it.t][0] += a.score; byType[it.t][1] += 10;
    byField[it.f][0] += a.score; byField[it.f][1] += 10;
  });
  const pc = x => x[1] ? Math.round(100 * x[0] / x[1]) : null;
  const itemsPct = items.length ? items.reduce((s, x) => s + x.a.score, 0) / (items.length * 10) : 0;
  const bp = CUR.bp?.result || {score: 0, passed: 0, total: 8, checks: []};
  const pol = CUR.policy.map(x => { const q = SIM.POLICY_Q[x.i]; return {q: q.q, sel: q.o[x.sel], correct: q.o[q.k], ok: x.sel === q.k, ex: q.ex}; });
  const polScore = Math.round(10 * pol.filter(x => x.ok).length / pol.length * 10) / 10;
  const overall = Math.round(itemsPct * 75 + bp.score + polScore);
  const skills = {judge: pc(sk.judge), rules: pc(sk.rules), bloom: pc(sk.bloom), revision: pc(sk.revision), blueprint: Math.round(100 * bp.passed / bp.total), policy: Math.round(100 * pol.filter(x => x.ok).length / pol.length)};
  const strengths = [], weak = [];
  Object.entries(skills).forEach(([k, v]) => { if (v == null) return; if (v >= 85) strengths.push(`${SIM.SKILL[k].ar} (${v}%)`); else if (v < 70) weak.push({k, v}); });
  Object.entries(byType).forEach(([t, x]) => { const v = pc(x); if (v < 65) weak.push({t, v}); });
  const recs = weak.map(w => w.k ? `${SIM.SKILL[w.k].ar} (${w.v}%): راجع ${SIM.SKILL[w.k].unit} في الدليل.` : `أسئلة ${SIM.TYPES[w.t].ar} (${w.v}%): راجع ${SIM.TYPES[w.t].ref}.`);
  /* most frequently missed rules */
  const missed = {}; items.forEach(({it, a}) => { if (!it.ok) it.fl.forEach(c => { if (!(a.rules || []).includes(c)) missed[c] = (missed[c] || 0) + 1; }); });
  const topMissed = Object.entries(missed).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, n]) => ({code: c, n, ar: SIM.RULES[c].ar}));
  const units = LS.get("sim_units", {});
  const sem = semesterOf(CUR.startedAt);
  const localN = attemptsThisSemester(p.name) + 1;
  return {meta: {...p, startedAt: CUR.startedAt, finishedAt: CUR.finishedAt, semester: sem, attemptLocal: localN, durationMin: Math.max(1, Math.round((new Date(CUR.finishedAt) - new Date(CUR.startedAt)) / 60000)), bank: p.lang === "ar" ? "العربية" : "الإنجليزية", unitsRead: Object.keys(units)},
    score: {overall, items: Math.round(itemsPct * 75 * 10) / 10, itemsPct: Math.round(itemsPct * 100), blueprint: bp.score, policy: polScore},
    skills, byType: Object.fromEntries(Object.entries(byType).map(([t, x]) => [t, {pct: pc(x), n: x[1] / 10}])), byField: {s: pc(byField.s), h: pc(byField.h)},
    items: items.map(({it, a}, n) => ({n: n + 1, id: it.id, type: it.t, field: it.f, disc: it.d, text: it.s + (it.o ? "\n" + it.o.map((o, i) => LETTERS[it.id.startsWith("en") ? "en" : "ar"][i] + ") " + o).join("  ") : ""), sound: it.ok,
      judge: a.judge, judgeOk: it.ok ? a.judge === "ok" : a.judge === "flawed", rulesSel: a.rules || [], rulesCorrect: it.fl || [], bloomSel: a.bloom, bloomCorrect: it.bl, revOk: it.ok ? null : !!(it.rv[a.rev] && it.rv[a.rev][1]), score: a.score})),
    blueprint: {scenario: CUR.scenario, inputs: CUR.bp?.v, checks: bp.checks, passed: bp.passed, total: bp.total, score: bp.score},
    policy: pol, strengths, recs, topMissed};
}
function band(s){ return s >= 90 ? ["متقن", "ok"] : s >= 75 ? ["متمكن", "ok"] : s >= 60 ? ["نامٍ", "warn"] : ["يحتاج تدريباً إضافياً", "bad"]; }

let LAST = null;
function finish(){
  const r = computeReport(); LAST = r;
  /* record history, seen items */
  const seen = LS.get("sim_seen_" + normName(r.meta.name), {}); r.items.forEach(x => seen[x.id] = (seen[x.id] || 0) + 1); LS.set("sim_seen_" + normName(r.meta.name), seen);
  const html = SIM_REPORT.html(r);
  const hist = LS.get("sim_hist", []);
  const entry = {key: r.meta.startedAt, name: r.meta.name, dept: r.meta.dept, course: r.meta.course, lang: r.meta.lang, etype: r.meta.etype, semester: r.meta.semester, date: r.meta.finishedAt, overall: r.score.overall, attempt: r.meta.attemptLocal, sent: false};
  hist.unshift(entry); while (hist.length > 60) hist.pop();
  LS.set("sim_hist", hist); LS.set("sim_rep_" + entry.key, html);
  /* keep only the last 25 stored reports */
  hist.slice(25).forEach(h => LS.del("sim_rep_" + h.key));
  LS.del("sim_cur"); CUR = null;
  showReport(html, r, entry.key);
  send(r, html, entry.key);
}
function showReport(html, r, key){
  showView("report");
  $("#report-root").innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe id="rep-frame" title="تقرير المحاولة" style="width:100%;border:0;min-height:1200px"></iframe></div>`;
  const f = $("#rep-frame"); f.srcdoc = html; f.onload = () => { try { f.style.height = (f.contentDocument.documentElement.scrollHeight + 30) + "px"; } catch(e) {} };
  $("#btn-dl").onclick = () => { const b = new Blob([html], {type: "text/html;charset=utf-8"}); const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = `تقرير-${(r ? r.meta.name : "محاولة").replace(/\s+/g, "-")}-${new Date(r ? r.meta.finishedAt : Date.now()).toISOString().slice(0, 10)}.html`; document.body.appendChild(a); a.click(); a.remove(); };
  $("#btn-print").onclick = () => { try { f.contentWindow.print(); } catch(e) { window.print(); } };
  $("#btn-new").onclick = () => showView("home");
  $("#btn-resend").onclick = () => r && send(r, html, key);
}

async function send(r, html, key){
  const st = $("#send-status"), rs = $("#btn-resend");
  if (!CFG.SUBMIT_URL) { st.innerHTML = `<span class="pill warn">لم يُضبط إرسال التقارير بعد</span> نزّل التقرير وأرسله إلى إدارة الكلية.`; rs.hidden = true; return; }
  st.innerHTML = `<span class="pill">جارٍ إرسال التقرير إلى إدارة الكلية…</span>`; rs.hidden = true;
  const payload = JSON.stringify({token: CFG.SUBMIT_TOKEN || "", rid: key + "|" + r.meta.name, meta: {name: r.meta.name, dept: r.meta.dept, course: r.meta.course, level: r.meta.level, lang: r.meta.lang, etype: r.meta.etype, field: r.meta.field, semester: r.meta.semester, startedAt: r.meta.startedAt, finishedAt: r.meta.finishedAt, size: r.meta.size, attemptLocal: r.meta.attemptLocal},
    score: r.score, skills: r.skills, html});
  const mark = ok => { const h = LS.get("sim_hist", []); const e = h.find(x => x.key === key); if (e) { e.sent = ok; LS.set("sim_hist", h); } };
  try {
    const res = await fetch(CFG.SUBMIT_URL, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: payload, redirect: "follow"});
    let j = null; try { j = await res.json(); } catch(e) {}
    if (j && j.ok) { st.innerHTML = `<span class="pill ok">أُرسل التقرير إلى إدارة الكلية</span>${j.attempt ? ` رقم المحاولة المسجّل في هذا الفصل: ${j.attempt}` : ""}`; mark(true); return; }
    if (j && j.error) throw new Error(j.error);
    throw new Error("bad response");
  } catch(e) {
    /* fallback: fire-and-forget without reading the response */
    try { await fetch(CFG.SUBMIT_URL, {method: "POST", mode: "no-cors", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: payload});
      st.innerHTML = `<span class="pill ok">أُرسل التقرير</span> <span class="muted">(لم يصل تأكيد الاستلام؛ إن لم يظهر في البريد فنزّل التقرير وأرسله يدوياً)</span>`; mark(true); rs.hidden = false; return; }
    catch(e2) { st.innerHTML = `<span class="pill bad">تعذّر إرسال التقرير</span> تحقق من الاتصال ثم اضغط «إعادة الإرسال»، أو نزّل التقرير وأرسله يدوياً.`; mark(false); rs.hidden = false; }
  }
}

/* ================= history ================= */
function renderHistory(){
  const hist = LS.get("sim_hist", []);
  if (!hist.length) { $("#history-root").innerHTML = `<p class="muted">لا توجد محاولات مكتملة على هذا الجهاز بعد.</p>`; return; }
  const groups = {}; hist.forEach(h => (groups[h.name] = groups[h.name] || []).push(h));
  $("#history-root").innerHTML = Object.keys(groups).sort((a, b) => a.localeCompare(b, "ar")).map(nm => `<h4 style="margin-top:12px">${esc(nm)}</h4><div class="hist"><table><tr><th>التاريخ</th><th>الفصل</th><th>المساق</th><th>الامتحان</th><th>الدرجة</th><th>الإرسال</th><th></th></tr>${groups[nm].sort((a, b) => b.date.localeCompare(a.date)).map(h => { const [bt, bc] = band(h.overall);
    return `<tr><td>${esc(fmtDate(h.date))}</td><td>${esc(h.semester)}</td><td>${esc(h.course)}</td><td>${ETYPE[h.etype]} · ${LANG[h.lang]}</td><td><b>${h.overall}</b> <span class="pill ${bc}">${bt}</span></td><td>${h.sent ? "✓" : "—"}</td><td>${LS.get("sim_rep_" + h.key, null) ? `<button class="btn small" data-open="${esc(h.key)}">عرض</button>` : ""}</td></tr>`; }).join("")}</table></div>`).join("");
  $$("#history-root [data-open]").forEach(b => b.onclick = () => { const html = LS.get("sim_rep_" + b.dataset.open, null); if (html) { showReport(html, null, b.dataset.open); $("#send-status").textContent = ""; } });
}

/* ================= boot ================= */
(function boot(){
  refreshHome();
  const counts = ["ar","en"].map(l => BANKS[l].length);
  if (!counts[0] || !counts[1]) console.warn("bank sizes", counts);
})();
window.__SIM = {computeReport: () => computeReport(), get CUR(){ return CUR; }, bpEval, scoreItem};
})();
