/* تقرير المحاولة — مستند HTML مستقل باللغة العربية (يُعرض ويُنزَّل ويُرسل بالبريد) */
window.SIM_REPORT = (function(){
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ETYPE = {midterm: "نصفي", final: "نهائي"}, LANG = {ar: "العربية", en: "الإنجليزية"};
  const fmt = d => new Date(d).toLocaleString("ar-EG", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"});
  const band = s => s >= 90 ? ["متقن", "#1f7a3f", "#e5f4ea"] : s >= 75 ? ["متمكن", "#1f7a3f", "#e5f4ea"] : s >= 60 ? ["نامٍ", "#9a6700", "#fff6db"] : ["يحتاج تدريباً إضافياً", "#b42318", "#fdecea"];
  const color = v => v == null ? "#667085" : v >= 85 ? "#1f7a3f" : v >= 70 ? "#127a63" : v >= 55 ? "#9a6700" : "#b42318";
  const bar = v => v == null ? "—" : `<div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:8px;background:#e3e7ec;border-radius:6px;overflow:hidden"><div style="height:8px;width:${v}%;background:${color(v)}"></div></div><b style="color:${color(v)};min-width:42px">${v}%</b></div>`;
  const TD = 'style="border:1px solid #e2e6ec;padding:6px 8px;vertical-align:top"';
  const TH = 'style="border:1px solid #e2e6ec;padding:6px 8px;background:#f2f5f8;text-align:right"';
  const H = t => `<h2 style="font-size:17px;color:#0f5a4a;margin:22px 0 8px;border-bottom:2px solid #e6f2ee;padding-bottom:4px">${t}</h2>`;
  const yes = '<span style="color:#1f7a3f;font-weight:700">✓</span>', no = '<span style="color:#b42318;font-weight:700">✗</span>';

  function html(r){
    const m = r.meta, s = r.score, [bt, bc, bb] = band(s.overall);
    const kv = (k, v) => `<tr><td style="padding:3px 10px 3px 0;color:#5f6b7d;white-space:nowrap">${k}</td><td style="padding:3px 0"><b>${v}</b></td></tr>`;
    let out = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>تقرير محاولة تدريب – ${esc(m.name)} – ${esc(new Date(m.finishedAt).toISOString().slice(0,10))}</title>
<style>body{font-family:"IBM Plex Sans Arabic",Tahoma,Arial,sans-serif;color:#1d2433;background:#fff;margin:0;line-height:1.7}.wrap{max-width:900px;margin:0 auto;padding:22px}table{border-collapse:collapse;width:100%;font-size:13.5px}@media print{.wrap{padding:0}}</style></head>
<body><div class="wrap">
<div style="background:#0f5a4a;color:#fff;border-radius:12px;padding:16px 20px">
  <div style="font-size:13px;opacity:.9">جامعة فلسطين التقنية – خضوري · كلية تكنولوجيا المعلومات والذكاء الاصطناعي</div>
  <div style="font-size:21px;font-weight:700">تقرير محاولة تدريب على القياس والتقويم وبناء الاختبارات</div>
  <div style="font-size:13px;opacity:.9">محاكي القياس والتقويم · وفق سياسة تطوير أساليب التقييم والامتحانات والدليل التدريبي</div>
</div>
<table style="margin-top:14px;font-size:14px;width:auto"><tbody>
${kv("اسم المحاضر", esc(m.name))}${kv("القسم", esc(m.dept))}${kv("المساق", esc(m.course))}${kv("مستوى المساق", esc(SIM_LEVEL(m.level)))}
${kv("مجال التخصص", m.field === "h" ? "إنساني" : "علمي")}${kv("لغة الامتحان", LANG[m.lang])}${kv("نوع الامتحان", ETYPE[m.etype])}${kv("عدد أسئلة المحاولة", r.items.length)}
${kv("تاريخ المحاولة", esc(fmt(m.finishedAt)))}${kv("مدة المحاولة", m.durationMin + " دقيقة")}${kv("الفصل الدراسي", esc(m.semester))}${kv("رقم المحاولة في الفصل (على جهاز المحاضر)", m.attemptLocal)}
</tbody></table>

<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px">
  <div style="flex:1;min-width:180px;border:1px solid #e2e6ec;border-radius:12px;padding:12px 14px;background:${bb}">
    <div style="color:#5f6b7d;font-size:13px">الدرجة الكلية</div><div style="font-size:34px;font-weight:700;color:${bc}">${s.overall} <span style="font-size:16px">من 100</span></div><div style="font-weight:600;color:${bc}">${bt}</div></div>
  <div style="flex:2;min-width:260px;border:1px solid #e2e6ec;border-radius:12px;padding:12px 14px;font-size:14px">
    <div>تحليل الأسئلة: <b>${s.items}</b> من 75 <span style="color:#5f6b7d">(${s.itemsPct}%)</span></div>
    <div>مخطط الامتحان: <b>${s.blueprint}</b> من 15</div>
    <div>المعرفة بالسياسة: <b>${s.policy}</b> من 10</div>
    <div style="color:#5f6b7d;font-size:12.5px;margin-top:4px">مستويات الأداء: متقن 90 فأكثر · متمكن 75–89 · نامٍ 60–74 · يحتاج تدريباً إضافياً أقل من 60</div></div>
</div>

${H("الأداء حسب المهارة")}
<table><tbody>${Object.entries({judge: "الحكم على سلامة السؤال", rules: "تحديد القاعدة المخالَفة", bloom: "تصنيف المستوى المعرفي (بلوم)", revision: "اختيار الصياغة المحسّنة", blueprint: "بناء مخطط الاختبار", policy: "المعرفة بالسياسة"}).map(([k, t]) => `<tr><td style="border:1px solid #e2e6ec;padding:6px 8px;vertical-align:top;width:42%;border:1px solid #e2e6ec;padding:6px 8px">${t}</td><td ${TD}>${bar(r.skills[k])}</td></tr>`).join("")}</tbody></table>

${H("الأداء حسب نوع السؤال")}
<table><thead><tr><th ${TH}>نوع السؤال</th><th ${TH}>عدد الأسئلة</th><th ${TH}>النسبة</th></tr></thead><tbody>
${Object.entries(r.byType).map(([t, x]) => `<tr><td ${TD}>${esc(SIM.TYPES[t].ar)}</td><td ${TD}>${x.n}</td><td ${TD}>${bar(x.pct)}</td></tr>`).join("")}

</tbody></table>

${H("نقاط القوة والتوصيات")}
<div style="font-size:14px">
<div><b>نقاط القوة:</b> ${r.strengths.length ? esc(r.strengths.join("؛ ")) : "لا توجد مهارة بلغت 85% في هذه المحاولة."}</div>
<div style="margin-top:6px"><b>أولويات التطوير:</b>${r.recs.length ? `<ul style="margin:4px 0">${r.recs.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : " لا توجد مهارة أو نوع أسئلة دون الحد المطلوب."}</div>
${r.topMissed.length ? `<div style="margin-top:6px"><b>القواعد الأكثر إغفالاً:</b><ul style="margin:4px 0">${r.topMissed.map(x => `<li><code>${x.code}</code> ${esc(x.ar)} (${x.n} ${x.n > 2 ? "مرات" : "مرة"})</li>`).join("")}</ul></div>` : ""}
<div style="margin-top:6px;color:#5f6b7d">وحدات الدليل التي أشار المحاضر إلى إنهاء قراءتها على جهازه: ${m.unitsRead && m.unitsRead.length ? esc(m.unitsRead.join("، ")) : "لا شيء بعد"}.</div>
</div>

${H("تفاصيل الأسئلة")}
<table><thead><tr><th ${TH}>#</th><th ${TH}>السؤال</th><th ${TH}>الحكم</th><th ${TH}>القواعد (اختياره / الصحيح)</th><th ${TH}>بلوم (اختياره / الصحيح)</th><th ${TH}>الصياغة</th><th ${TH}>الدرجة</th></tr></thead><tbody>
${r.items.map(i => { const lang = i.id.startsWith("en") ? "ltr" : "rtl"; const t = i.text.length > 230 ? i.text.slice(0, 230) + "…" : i.text;
  return `<tr><td ${TD}>${i.n}</td><td ${TD}><div style="font-size:12px;color:#5f6b7d">${esc(SIM.TYPES[i.type].ar)} · ${i.field === "s" ? "علمي" : "إنساني"}: ${esc(i.disc)} · ${esc(i.id)} · ${i.sound ? "سليم" : "يحتاج تعديلاً"}</div><div dir="${lang}" style="white-space:pre-wrap;font-size:12.5px;${lang === "ltr" ? "text-align:left" : ""}">${esc(t)}</div></td>
  <td ${TD}>${i.judgeOk ? yes : no}</td>
  <td style="border:1px solid #e2e6ec;padding:6px 8px;vertical-align:top;font-family:monospace;font-size:12px">${esc(i.rulesSel.join(" ") || "—")}<br><span style="color:#1f7a3f">${esc(i.rulesCorrect.join(" ") || "سليم")}</span></td>
  <td ${TD}>${esc(SIM.BLOOM[i.bloomSel]?.ar || "—")}<br><span style="color:#1f7a3f">${esc(SIM.BLOOM[i.bloomCorrect].ar)}</span></td>
  <td ${TD}>${i.revOk == null ? "—" : i.revOk ? yes : no}</td><td ${TD}><b>${i.score}</b> من 10</td></tr>`; }).join("")}
</tbody></table>

${H(`مهمة مخطط الامتحان (${ETYPE[m.etype]}: ${r.blueprint.scenario.total} علامة في ${r.blueprint.scenario.minutes} دقيقة)`)}
<table><tbody>${r.blueprint.checks.map(c => `<tr><td style="border:1px solid #e2e6ec;padding:6px 8px;vertical-align:top;width:30px;border:1px solid #e2e6ec;padding:6px 8px">${c.ok ? yes : no}</td><td ${TD}><b>${esc(c.label)}</b><br><span style="font-size:12.5px;color:#5f6b7d">${esc(c.detail)}</span></td></tr>`).join("")}</tbody></table>
${(() => { const c = r.blueprint.inputs?.cells; if (!Array.isArray(c)) return ""; const K = ["remember","understand","apply","higher"], N = ["تذكر","فهم","تطبيق","تحليل وتقييم وإبداع"], S = "border:1px solid #e2e6ec;padding:5px 7px;text-align:center", sum = a => a.reduce((x, y) => x + (+y || 0), 0);
  return `<div style="font-size:13.5px;margin:8px 0 4px">مصفوفة المحاضر (العلامات):</div><table><tbody><tr><th style="${S};background:#f2f5f8">الموضوع</th><th style="${S};background:#f2f5f8">الساعات</th>${N.map(x => `<th style="${S};background:#f2f5f8">${x}</th>`).join("")}<th style="${S};background:#f2f5f8">المجموع</th></tr>${r.blueprint.scenario.topics.map((t, i) => `<tr><td style="${S}">${esc(t[0])}</td><td style="${S}">${t[1]}</td>${K.map(k => `<td style="${S}">${c[i]?.[k] ?? "—"}</td>`).join("")}<td style="${S};font-weight:600">${sum(K.map(k => c[i]?.[k]))}</td></tr>`).join("")}<tr><td style="${S};font-weight:600">المجموع</td><td style="${S}"></td>${K.map(k => `<td style="${S};font-weight:600">${sum(c.map(x => x?.[k]))}</td>`).join("")}<td style="${S};font-weight:600">${sum(c.flatMap(x => K.map(k => x?.[k])))}</td></tr></tbody></table>`; })()}
<div style="font-size:13.5px;margin-top:4px">الشروط المحققة: ${r.blueprint.passed} من ${r.blueprint.total} · الدرجة ${r.blueprint.score} من 15</div>

${H("أسئلة السياسة")}
<table><tbody>${r.policy.map(p => `<tr><td style="border:1px solid #e2e6ec;padding:6px 8px;vertical-align:top;width:30px;border:1px solid #e2e6ec;padding:6px 8px">${p.ok ? yes : no}</td><td ${TD}><b>${esc(p.q)}</b><br>إجابته: ${esc(p.sel)}${p.ok ? "" : ` · الصحيح: <span style="color:#1f7a3f">${esc(p.correct)}</span>`}<br><span style="font-size:12.5px;color:#5f6b7d">${esc(p.ex)}</span></td></tr>`).join("")}</tbody></table>

<p style="color:#5f6b7d;font-size:12px;margin-top:22px;border-top:1px solid #e2e6ec;padding-top:8px">أُنشئ هذا التقرير آلياً من محاكي القياس والتقويم في كلية تكنولوجيا المعلومات والذكاء الاصطناعي، جامعة فلسطين التقنية – خضوري. تُصحَّح الإجابات وفق مفاتيح معدّة مسبقاً من الدليل التدريبي وسياسة التقييم المعتمدة، وهو أداة تدريب ذاتي لا تقييم وظيفي.</p>
</div></body></html>`;
    return out;
  }
  function SIM_LEVEL(l){ return (SIM.LEVELS[l] || {}).ar || l; }
  return {html};
})();
