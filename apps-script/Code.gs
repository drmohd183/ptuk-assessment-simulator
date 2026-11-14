/**
 * محاكي القياس والتقويم — استقبال تقارير المحاولات
 * كلية تكنولوجيا المعلومات والذكاء الاصطناعي – جامعة فلسطين التقنية خضوري
 *
 * ما يفعله عند وصول تقرير:
 *  1. يتحقق من الرمز السري (TOKEN).
 *  2. يحسب رقم المحاولة للمحاضر في الفصل الدراسي من سجل الجدول.
 *  3. يضيف صفاً إلى ورقة «المحاولات» ويرتبها حسب اسم المحاضر ثم التاريخ.
 *  4. يحفظ التقرير ملف HTML في Google Drive داخل مجلد باسم المحاضر.
 *  5. يرسل التقرير بالبريد، ويضع الرسالة تحت تصنيف Gmail باسم المحاضر.
 *
 * يُنشأ هذا السكربت من داخل جدول Google Sheets (الإضافات ← Apps Script)، انظر README.md.
 */

// ===== الإعدادات =====
const TOKEN = "ptu-itai-2026";        // يجب أن يطابق SUBMIT_TOKEN في config.js
const RECIPIENT = "";                 // اتركه فارغاً لإرسال التقارير إلى بريد صاحب السكربت، أو اكتب بريداً آخر
const DRIVE_FOLDER = "تقارير محاكي القياس والتقويم";
const LABEL_ROOT = "محاكي التقييم";
const SHEET_NAME = "المحاولات";
const SHEET_FILE = "سجل محاولات محاكي القياس والتقويم"; // يُنشأ تلقائياً في Drive إذا كان السكربت مستقلاً

const HEADERS = ["تاريخ المحاولة", "اسم المحاضر", "القسم", "المساق", "مستوى المساق", "لغة الامتحان", "نوع الامتحان", "مجال التخصص",
  "الفصل الدراسي", "رقم المحاولة في الفصل", "عدد الأسئلة", "الدرجة الكلية /100", "تحليل الأسئلة /75", "مخطط الامتحان /15",
  "السياسة /10", "الحكم على السؤال %", "تحديد القاعدة %", "تصنيف بلوم %", "الصياغة المحسّنة %", "رابط التقرير"];

function doGet() {
  return json_({ok: true, service: "PTU assessment simulator receiver"});
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ok: false, error: "bad json"}); }
  if (data.token !== TOKEN) return json_({ok: false, error: "bad token"});
  const m = data.meta || {}, s = data.score || {}, k = data.skills || {};
  const name = clean_(m.name, 80);
  if (!name || !data.html) return json_({ok: false, error: "missing data"});
  // the same report may arrive twice (automatic retry or the "resend" button): record it once
  const cache = CacheService.getScriptCache();
  const rid = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(data.rid || (m.startedAt + "|" + name))));
  const when = m.finishedAt ? new Date(m.finishedAt) : new Date();

  // 1) short locked section: count the attempt, save the file, add the row (a few seconds)
  let attempt, fileUrl, html;
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const seen = cache.get(rid);
    if (seen) return json_({ok: true, attempt: Number(seen), duplicate: true});
    let sheet = null; attempt = Number(m.attemptLocal) || 1;
    try { sheet = sheet_(); attempt = countAttempts_(sheet, name, m.semester) + 1; } catch (err) { console.error("sheet: " + err); }
    const stamp = Utilities.formatDate(when, "Asia/Jerusalem", "yyyy-MM-dd HH-mm");
    const banner = '<div dir="rtl" style="font-family:Tahoma,Arial;background:#fff6db;border:1px solid #f0d68a;border-radius:8px;padding:8px 12px;margin:10px auto;max-width:900px">رقم المحاولة المسجّل لدى الكلية لهذا المحاضر في ' + esc_(m.semester) + ': <b>' + attempt + '</b></div>';
    html = String(data.html).replace(/<body>/i, "<body>" + banner);
    fileUrl = subfolder_(rootFolder_(), name).createFile(Utilities.newBlob(html, "text/html", stamp + " – محاولة " + attempt + ".html")).getUrl();
    if (sheet) {
      try {
        sheet.appendRow([when, name, clean_(m.dept, 80), clean_(m.course, 120), lvl_(m.level), m.lang === "en" ? "الإنجليزية" : "العربية",
          m.etype === "final" ? "نهائي" : "نصفي", m.field === "h" ? "إنساني" : m.field === "s" ? "علمي" : "", clean_(m.semester, 40), attempt, m.size || "", s.overall, s.items, s.blueprint, s.policy,
          k.judge, k.rules, k.bloom, k.revision, fileUrl]);
        sortSheet_(sheet);
      } catch (err) { console.error("row: " + err); }
    }
    cache.put(rid, String(attempt), 21600);
  } catch (err) {
    return json_({ok: false, error: String(err)});
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }

  // 2) outside the lock: email and Gmail label (several submissions can do this at the same time)
  let emailed = true;
  try {
    const to = RECIPIENT || Session.getEffectiveUser().getEmail();
    const subject = "تقرير محاكي القياس والتقويم | " + name + " | " + (m.etype === "final" ? "نهائي" : "نصفي") + (m.field ? " | " + (m.field === "h" ? "إنساني" : "علمي") : "") + " | " +
      Utilities.formatDate(when, "Asia/Jerusalem", "yyyy-MM-dd HH:mm") + " | الدرجة " + s.overall + " | المحاولة " + attempt;
    GmailApp.sendEmail(to, subject, "تقرير محاولة تدريب. افتح الرسالة بصيغة HTML أو الملف: " + fileUrl,
      {htmlBody: html, name: "محاكي القياس والتقويم – كلية تكنولوجيا المعلومات والذكاء الاصطناعي"});
    labelMessage_(subject, name);
  } catch (err) {
    emailed = false; console.error("email: " + err); // e.g. daily Gmail quota reached: the report is still saved in the sheet and Drive
  }
  return json_({ok: true, attempt: attempt, emailed: emailed});
}

// ===== helpers =====
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean_(v, n) { return String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n); }
function esc_(v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function(c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
function norm_(v) { return clean_(v, 80).replace(/[أإآ]/g, "ا").replace(/ة(?=\s|$)/g, "ه").replace(/ى(?=\s|$)/g, "ي").toLowerCase(); }
function lvl_(l) { return {L1: "السنة الأولى", L2: "السنة الثانية والثالثة", L3: "السنة الرابعة والدراسات العليا"}[l] || ""; }

function spreadsheet_() {
  // works whether the script is bound to a sheet or standalone (created from script.google.com)
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("SHEET_ID");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const it = DriveApp.getFilesByName(SHEET_FILE);
  const ss = it.hasNext() ? SpreadsheetApp.open(it.next()) : SpreadsheetApp.create(SHEET_FILE);
  props.setProperty("SHEET_ID", ss.getId());
  return ss;
}
function sheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#e6f2ee");
  }
  return sh;
}
function countAttempts_(sh, name, semester) {
  const n = sh.getLastRow(); if (n < 2) return 0;
  const vals = sh.getRange(2, 2, n - 1, 8).getValues(); // name … semester (columns B..I)
  const key = norm_(name); let c = 0;
  vals.forEach(function(r) { if (norm_(r[0]) === key && String(r[7]) === String(semester)) c++; });
  return c;
}
function sortSheet_(sh) {
  const n = sh.getLastRow(); if (n < 3) return;
  sh.getRange(2, 1, n - 1, HEADERS.length).sort([{column: 2, ascending: true}, {column: 1, ascending: false}]);
}
function rootFolder_() {
  const it = DriveApp.getFoldersByName(DRIVE_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER);
}
function subfolder_(root, name) {
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}
function labelMessage_(subject, name) {
  try {
    const labelName = LABEL_ROOT + "/" + name.replace(/\//g, "-");
    const label = GmailApp.getUserLabelByName(labelName) || (GmailApp.getUserLabelByName(LABEL_ROOT) || GmailApp.createLabel(LABEL_ROOT), GmailApp.createLabel(labelName));
    for (let i = 0; i < 5; i++) {
      Utilities.sleep(1500);
      const threads = GmailApp.search('subject:"' + subject.replace(/"/g, "") + '" newer_than:1d', 0, 3);
      if (threads.length) { threads.forEach(function(t) { t.addLabel(label); }); return; }
    }
  } catch (e) { /* labelling is optional */ }
}

/** شغّل هذه الدالة مرة واحدة من المحرر لمنح الصلاحيات واختبار الإرسال. */
function testSetup() {
  const fake = {postData: {contents: JSON.stringify({token: TOKEN, meta: {name: "محاضر تجريبي", dept: "قسم تجريبي", course: "مساق تجريبي", level: "L2", lang: "ar", etype: "midterm",
    semester: "تجربة", finishedAt: new Date().toISOString(), size: 10}, score: {overall: 80, items: 60, blueprint: 12, policy: 8},
    skills: {judge: 80, rules: 70, bloom: 75, revision: 85}, html: "<!DOCTYPE html><html><body><p dir='rtl'>تقرير تجريبي من محاكي القياس والتقويم.</p></body></html>"})}};
  Logger.log(doPost(fake).getContent());
  Logger.log("جدول السجل: " + spreadsheet_().getUrl());
}
