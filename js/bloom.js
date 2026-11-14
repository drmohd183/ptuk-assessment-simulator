/* صفحة «أفعال بلوم»: قاعدة القرار، جدول الأفعال، الأفعال المضللة، وتدريب سريع */
(function(){
"use strict";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const LV = [
  {k: "remember", ar: "التذكر", q: "يسترجع معلومة كما تعلّمها",
   arV: ["يذكر", "يعدّد", "يسمّي", "يعرّف", "يسترجع", "يتعرّف", "يكتب (نصاً محفوظاً)", "يرتّب (كما ورد)"],
   enV: ["list", "name", "define", "state", "recall", "recognize", "label", "memorize"],
   sci: "يذكر وحدة قياس المقاومة الكهربائية.", hum: "يذكر أركان الجملة الاسمية.",
   trap: "يبقى السؤال تذكراً مهما كان فعله إذا كانت إجابته جاهزة في المادة أو حُلّ أمام الطلبة."},
  {k: "understand", ar: "الفهم", q: "يعبّر عن المعنى بلغته أو يفسّره أو يصنّفه",
   arV: ["يفسّر", "يشرح بأسلوبه", "يلخّص", "يصنّف", "يقارن", "يعطي مثالاً", "يعيد الصياغة", "يوضّح"],
   enV: ["explain", "summarize", "classify", "compare", "give an example", "paraphrase", "interpret", "illustrate"],
   sci: "يفسّر سبب ارتفاع ملوحة التربة في المناطق الجافة.", hum: "يلخّص الفكرة الرئيسية لمقال نقدي.",
   trap: "«قارن» فهم إذا كانت المقارنة جديدة، وتذكر إذا كانت جدولاً جاهزاً في المحاضرة."},
  {k: "apply", ar: "التطبيق", q: "يستخدم قاعدة أو إجراء في موقف جديد",
   arV: ["يحسب", "يطبّق", "يستخدم", "يحلّ", "ينفّذ", "يُعرب", "يحوّل", "يتنبأ بالناتج"],
   enV: ["calculate", "apply", "use", "solve", "execute", "implement", "compute", "demonstrate"],
   sci: "يحسب التيار في دارة جديدة بقانون أوم.", hum: "يُعرب جملة غير مدروسة.",
   trap: "حلّ المسألة نفسها التي حُلّت في المحاضرة تذكر لا تطبيق."},
  {k: "analyze", ar: "التحليل", q: "يفكك موقفاً جديداً ويكشف العلاقات أو الأسباب أو الخطأ",
   arV: ["يحلّل", "يميّز", "يفكك", "يكتشف الخطأ", "يحدد السبب", "يستنتج العلاقة", "ينظّم", "يربط بين"],
   enV: ["analyze", "differentiate", "distinguish", "examine", "debug", "organize", "attribute", "deconstruct"],
   sci: "يحدد الخطأ المنطقي في مقطع برمجي جديد.", hum: "يميّز الحقائق من الآراء في نص صحفي جديد.",
   trap: "«حلّل: ما تعريف…؟» تذكر؛ الفعل لا يرفع المستوى."},
  {k: "evaluate", ar: "التقييم", q: "يصدر حكماً مبرراً وفق معايير أو يفاضل بين بدائل",
   arV: ["ينقد", "يحكم", "يبرّر", "يفاضل", "يقيّم", "يدافع عن", "يوصي", "يختار الأفضل مع التعليل"],
   enV: ["evaluate", "judge", "critique", "justify", "defend", "prioritize", "recommend", "assess"],
   sci: "يفاضل بين تصميمين وفق الكلفة والكفاءة.", hum: "يحكم على ملاءمة استراتيجية تدريس لموقف صفي.",
   trap: "سؤال «ما رأيك؟» بلا معايير ليس تقييماً، بل سؤال لا يمكن تصحيحه."},
  {k: "create", ar: "الإبداع", q: "ينتج شيئاً جديداً متكاملاً",
   arV: ["يصمّم", "يقترح", "يبني", "يؤلّف", "يخطط", "يطوّر", "يبتكر", "يركّب حلاً جديداً"],
   enV: ["design", "propose", "construct", "compose", "plan", "develop", "formulate", "produce"],
   sci: "يصمّم خوارزمية لتنظيم مواعيد مختبرات الكلية.", hum: "يقترح خطة تسويقية لمنتج زراعي محلي.",
   trap: "«صمّم» نسخة من تصميم عُرض كاملاً في المحاضرة تذكر لا إبداع."}
];
const AR = Object.fromEntries(LV.map(l => [l.k, l.ar]));

const STEPS = [
  ["هل الإجابة منصوص عليها في المادة، أو حُلّ السؤال نفسه أمام الطلبة؟", "remember"],
  ["هل يعبّر الطالب عن معنى ما درسه بلغته، أو يفسّره، أو يصنّفه، أو يعطي مثالاً، دون موقف جديد يحتاج إجراء؟", "understand"],
  ["هل يستخدم قاعدة أو قانوناً أو إجراء معروفاً في موقف جديد له إجابة صحيحة واحدة؟", "apply"],
  ["هل يفكك موقفاً أو بيانات جديدة ليكتشف العلاقات أو الأسباب أو الخطأ؟", "analyze"],
  ["هل يصدر حكماً مبرراً وفق معايير، أو يفاضل بين بدائل ويوصي بأحدها؟", "evaluate"],
  ["هل ينتج شيئاً جديداً: تصميماً أو خطة أو حلاً أصلياً؟", "create"]
];

const TRAPS = [
  ["حلّل: ما تعريف التضخم؟", "remember", "الفعل «حلّل» لا يغيّر شيئاً؛ المطلوب تعريف محفوظ."],
  ["قارن بين TCP وUDP (والمقارنة جدول عُرض في المحاضرة).", "remember", "المقارنة جاهزة فيسترجعها الطالب."],
  ["قارن بين نظامي ري لمزرعة بمعطيات جديدة من حيث الكلفة واستهلاك الماء.", "understand", "مقارنة جديدة لم تُعرض؛ وإذا طُلب إصدار حكم وتوصية تصبح تقييماً."],
  ["احسب العزم في الكمرة نفسها التي حُلّت في المحاضرة.", "remember", "إعادة حل مسألة محلولة استرجاع للخطوات."],
  ["اختر الإجابة الصحيحة: في الموقف الصفي الآتي (الجديد)، ما نوع التعزيز؟", "apply", "شكل السؤال (اختيار من متعدد) لا يحدد المستوى؛ الموقف الجديد يجعله تطبيقاً."],
  ["قيّم: ما رمز الانحراف المعياري للمجتمع؟", "remember", "«قيّم» فعل مضلل؛ المطلوب رمز."],
  ["ناقش أهمية الإحصاء.", "remember", "دون محاور أو موقف، يكتب الطالب ما حفظه؛ لذلك لا يُحسب مستوى عالياً في المخطط."]
];

const TASKS = [
  ["عدّد وظائف الإدارة الأربع.", "remember", "قائمة محفوظة."],
  ["اكتب تعريف الخوارزمية كما ورد في الكتاب.", "remember", "نص محفوظ."],
  ["رتّب خطوات المنهج العلمي كما وردت في الكتاب.", "remember", "ترتيب محفوظ."],
  ["حلّل: ما تعريف التضخم؟", "remember", "الفعل مضلل؛ المطلوب تعريف."],
  ["قيّم: ما رمز الانحراف المعياري؟", "remember", "الفعل مضلل؛ المطلوب رمز."],
  ["احسب العزم في الكمرة نفسها التي حُلّت في المحاضرة.", "remember", "مسألة محلولة أمام الطلبة."],
  ["قارن بين TCP وUDP كما وردت في جدول المحاضرة.", "remember", "مقارنة جاهزة."],
  ["اشرح بأسلوبك الفرق بين المتغير المحلي والمتغير العام.", "understand", "إعادة صياغة المعنى."],
  ["لخّص الفكرة الرئيسية لمقال لم يُقرأ في المحاضرة.", "understand", "تلخيص نص جديد."],
  ["صنّف الكائنات الآتية (غير المذكورة في الكتاب) إلى فقاريات ولافقاريات.", "understand", "تصنيف أمثلة جديدة ضمن فئات معروفة."],
  ["فسّر سبب ارتفاع ملوحة التربة في المناطق الجافة.", "understand", "تفسير سبب، ما لم يكن التفسير محفوظاً حرفياً."],
  ["أعطِ مثالاً جديداً من حياتك على التعزيز السلبي.", "understand", "إعطاء مثال يدل على فهم المفهوم."],
  ["احسب التيار في دارة فيها بطارية 12 فولت ومقاومة 4 أوم.", "apply", "استخدام قانون في موقف جديد."],
  ["أعرب جملة لم تُدرس: «لم يحضرْ الضيفُ».", "apply", "تطبيق القاعدة على جملة جديدة."],
  ["استخدم قانون نيوتن الثاني لإيجاد تسارع جسم كتلته 5 كغ تؤثر فيه قوة 20 نيوتن.", "apply", "تطبيق قانون معروف."],
  ["في الموقف الصفي الآتي (الجديد)، ما نوع جدول التعزيز الذي تستخدمه المعلمة؟", "apply", "تصنيف موقف جديد بإجراء معروف."],
  ["ما ناتج تنفيذ مقطع برمجي جديد من خمسة أسطر؟", "apply", "تتبع شيفرة جديدة."],
  ["اكتشف الخطأ المنطقي في المقطع البرمجي الآتي (غير المدروس).", "analyze", "تفكيك وكشف خطأ."],
  ["ميّز بين الحقائق والآراء في نص صحفي جديد.", "analyze", "تمييز عناصر نص جديد."],
  ["حدّد أسباب تعطل الشبكة من مخرجات أمري ping وtraceroute المعطاة.", "analyze", "استنتاج السبب من بيانات جديدة."],
  ["حلّل أثر ارتفاع سعر الفائدة على الطلب الاستثماري في بيانات اقتصاد افتراضي.", "analyze", "تفكيك علاقة في بيانات جديدة."],
  ["لماذا يختلف الوسط الحسابي عن الوسيط في البيانات الآتية؟", "analyze", "كشف أثر قيمة متطرفة في بيانات جديدة."],
  ["أيّ الخوارزميتين أنسب لفرز مليون سجل شبه مرتب؟ علّل اختيارك.", "evaluate", "مفاضلة مع تعليل."],
  ["احكم على ملاءمة استراتيجية تدريس لموقف صفي معطى وفق ثلاثة معايير.", "evaluate", "حكم وفق معايير."],
  ["برّر اختيارك لنوع الاختبار الإحصائي في الدراسة المعطاة.", "evaluate", "تبرير قرار."],
  ["فاضل بين تصميمين لجسر وفق الكلفة والأمان، وأوصِ بأحدهما.", "evaluate", "مفاضلة وتوصية."],
  ["انقد السؤال الآتي وفق قواعد بناء أسئلة الاختيار من متعدد.", "evaluate", "حكم على جودة وفق قواعد."],
  ["صمّم قاعدة بيانات لنظام إعارة في مكتبة الكلية.", "create", "إنتاج تصميم جديد."],
  ["اقترح خطة تسويقية لمنتج زراعي محلي.", "create", "إنتاج خطة جديدة."],
  ["ألّف قصة قصيرة توظف فيها ثلاث استعارات.", "create", "إنتاج نص أصلي."],
  ["طوّر نموذجاً أولياً لتطبيق يحل مشكلة مواصلات الطلبة.", "create", "بناء منتج جديد."],
  ["صمّم تجربة لاختبار أثر نوع السماد على نمو القمح.", "create", "تخطيط تجربة جديدة."]
];

function tableHTML(compact){
  return `<div class="tw"><table class="bl-table"><thead><tr><th>المستوى</th><th>ماذا يفعل الطالب؟</th><th>أفعال عربية</th><th>English verbs</th>${compact ? "" : "<th>مثال علمي</th><th>مثال إنساني</th>"}<th>الفخ الشائع</th></tr></thead><tbody>${
    LV.map((l, i) => `<tr class="lv${i}"><td><b>${i + 1}. ${l.ar}</b></td><td>${esc(l.q)}</td><td>${l.arV.map(esc).join("، ")}</td><td dir="ltr" style="text-align:left">${l.enV.map(esc).join(", ")}</td>${compact ? "" : `<td>${esc(l.sci)}</td><td>${esc(l.hum)}</td>`}<td class="small">${esc(l.trap)}</td></tr>`).join("")}</tbody></table></div>`;
}
function stepsHTML(){
  return `<ol class="bl-steps">${STEPS.map(([q, k]) => `<li><span>${esc(q)}</span> <b>← ${AR[k]}</b></li>`).join("")}</ol>
  <p class="small muted">ابدأ من الخطوة الأولى، وتوقف عند أول إجابة «نعم». الفعل المكتوب في السؤال مؤشر فقط، والحكم لما يفعله الطالب فعلاً في ضوء ما درسه.</p>`;
}

/* ---------- page ---------- */
function buildPage(){
  const root = document.getElementById("bloom-root"); if (!root) return;
  root.innerHTML = `
  <div class="card"><h3>القاعدة الذهبية: الفعل لا يحدد المستوى وحده</h3>
    <p>المستوى يتحدد بما يفعله الطالب فعلاً عند الإجابة، في ضوء ما درسه في المحاضرة. سؤال يبدأ بـ«حلّل» قد يكون تذكراً، وسؤال اختيار من متعدد قد يكون تطبيقاً أو تحليلاً. لتحديد المستوى اسأل نفسك بالترتيب:</p>
    ${stepsHTML()}</div>
  <div class="card"><h3>أفعال المستويات الستة</h3>${tableHTML(false)}
    <p class="small muted">المرجع: الدليل التدريبي 1.2. الأفعال إرشادية، ويُحسم المستوى بالقاعدة الذهبية.</p></div>
  <div class="card"><h3>أفعال مضللة: أمثلة يقع فيها كثيرون</h3>
    <div class="tw"><table class="bl-table"><thead><tr><th>السؤال</th><th>المستوى الفعلي</th><th>لماذا؟</th></tr></thead><tbody>${TRAPS.map(([q, k, w]) => `<tr><td>${esc(q)}</td><td><b>${AR[k]}</b></td><td class="small">${esc(w)}</td></tr>`).join("")}</tbody></table></div></div>
  <div class="card" id="bl-drill"><h3>تدريب سريع</h3>
    <p class="small muted">تدريب ذاتي غير محدود، لا تُحتسب نتيجته في المحاولات ولا تُرسل.</p>
    <div class="seg" id="bl-mode"><label><input type="radio" name="blmode" value="verb" checked> أ) الفعل ← المستوى (عربي وإنجليزي)</label><label><input type="radio" name="blmode" value="task"> ب) المهمة كاملة ← المستوى</label></div>
    <div id="bl-q" style="margin-top:14px"></div></div>`;
  root.querySelectorAll("input[name=blmode]").forEach(r => r.onchange = () => startDrill(r.value));
  startDrill("verb");
}

/* ---------- drill ---------- */
let D = null;
function makeVerbQs(){
  const all = []; LV.forEach(l => { l.arV.filter(v => !v.includes("(")).forEach(v => all.push([v, l.k, l.q, "rtl"])); l.enV.forEach(v => all.push([v, l.k, l.q, "ltr"])); });
  return shuffle(all).slice(0, 12).map(([t, k, why, dir]) => ({t, k, why: "يدل عادة على أن الطالب " + why + ".", dir}));
}
function makeTaskQs(){ return shuffle(TASKS).slice(0, 10).map(([t, k, why]) => ({t, k, why, dir: "rtl"})); }
function startDrill(mode){ D = {mode, qs: mode === "verb" ? makeVerbQs() : makeTaskQs(), i: 0, ok: 0, ans: null}; renderDrill(); }
function renderDrill(){
  const box = document.getElementById("bl-q"); if (!box || !D) return;
  if (D.i >= D.qs.length) {
    const pct = Math.round(100 * D.ok / D.qs.length);
    box.innerHTML = `<div class="feedback"><h4>النتيجة: ${D.ok} من ${D.qs.length} (${pct}%)</h4><p>${pct >= 85 ? "ممتاز، تصنيفك للمستويات دقيق." : pct >= 60 ? "جيد. راجع الجدول والأفعال المضللة ثم أعد التدريب." : "راجع القاعدة الذهبية والجدول أعلاه ثم أعد التدريب."}</p><div class="actions"><span></span><button class="btn primary" id="bl-again">تدريب جديد</button></div></div>`;
    document.getElementById("bl-again").onclick = () => startDrill(D.mode); return;
  }
  const q = D.qs[D.i], done = D.ans != null;
  box.innerHTML = `<div class="row between small muted"><span>${D.i + 1} من ${D.qs.length}</span><span>صحيح حتى الآن: ${D.ok}</span></div>
    <div class="item-box" dir="${q.dir}" style="margin:8px 0;font-size:${D.mode === "verb" ? "20px;text-align:center" : "15.5px"}">${esc(q.t)}</div>
    <div class="seg bloom-row">${LV.map(l => { let st = ""; if (done) st = l.k === q.k ? 'style="border-color:var(--ok);background:var(--ok-soft)"' : (l.k === D.ans ? 'style="border-color:var(--bad);background:var(--bad-soft)"' : "");
      return `<label ${st}><input type="radio" name="blans" value="${l.k}" ${done ? "disabled" : ""} ${D.ans === l.k ? "checked" : ""}> ${l.ar}</label>`; }).join("")}</div>
    ${done ? `<div class="feedback"><b>${D.ans === q.k ? "✓ صحيح" : "✗ المستوى الصحيح: " + AR[q.k]}</b> — ${esc(q.why)}<div class="actions"><span></span><button class="btn primary" id="bl-next">التالي</button></div></div>` : ""}`;
  if (!done) box.querySelectorAll("input[name=blans]").forEach(r => r.onchange = () => { D.ans = r.value; if (r.value === q.k) D.ok++; renderDrill(); });
  else document.getElementById("bl-next").onclick = () => { D.i++; D.ans = null; renderDrill(); };
}

/* ---------- quick-reference dialog (used inside attempt items) ---------- */
function openDialog(){
  let d = document.getElementById("bloom-dlg");
  if (!d) { d = document.createElement("dialog"); d.id = "bloom-dlg"; document.body.appendChild(d); }
  d.innerHTML = `<div class="row between"><h3 style="margin:0">دليل مختصر لمستويات بلوم</h3><button class="btn" id="bl-close">إغلاق</button></div>${stepsHTML()}${tableHTML(true)}`;
  d.querySelector("#bl-close").onclick = () => d.close();
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
  if (d.showModal) d.showModal(); else d.setAttribute("open", "");
}
document.addEventListener("click", e => { const a = e.target.closest("[data-bloom-help]"); if (!a) return; e.preventDefault(); openDialog(); });

window.SIM_BLOOM = {buildPage, openDialog};
buildPage();
})();
