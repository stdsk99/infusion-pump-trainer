/* ===== โหมดฝึกถอดประกอบ 3D (ไฟล์เดียวกันทั้งปั๊มและตู้อบ) =====
   ข้อมูลใบงานอยู่ใน data.js (window.TASKS3D) · main.js เรียก Task3D.init(api) และ Task3D.onToggle(k, on)
   คะแนนเริ่ม 100: ถอดชิ้นที่ไม่จำเป็น −5/ชิ้น · ข้ามขั้นความปลอดภัย −10 · ประกอบกลับไม่ครบ −20 · คำใบ้ −5/ครั้ง · เลือกการทดสอบหลังซ่อมผิด −10
   บันทึกเป็นประวัติ key "3d:<id>" (ไม่นับเกณฑ์) ถ้ามี Score และเข้าสู่ระบบอยู่ */
(function(){
  const T = window.TASKS3D; if (!T) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let api = null, box = null, btn = null, run = null, open = false, folded = false;
  const list = () => T.tasks.filter(t => (t.modes || ["tech"]).includes(api.MODE));
  const anyOn = () => Object.keys(api.A).some(k => api.A[k].t);
  const norm = k => /^ph\d$/.test(k) ? "ph" : k;

  function init(a) {
    api = a; box = document.getElementById("task"); btn = document.getElementById("b-task");
    if (!box || !btn) return;
    if (!list().length) { btn.remove(); return; }
    btn.onclick = () => { if (run && !run.done && !confirm("ยกเลิกใบงานที่ทำอยู่?")) return; open = !open || !!run; run = null; draw(); };
  }
  const active = () => !!(run && !run.done);

  /* เรียกจาก main.js ทุกครั้งที่ชิ้นส่วนขยับสำเร็จ */
  function onToggle(k, on) {
    if (!active() || run.test) return;
    k = norm(k);
    const t = run.t, free = (T.free || []).concat(t.free || []);
    if (on) {
      run.log.push(k);
      if (!free.includes(k)) {
        if (!run.firstDis) { run.firstDis = true; if (t.safe.some(s => !run.safe[s])) run.safeLate = true; }
        if (!t.need.includes(k) && !run.extra.includes(k)) { run.extra.push(k); api.toast("ใบงานนี้ไม่ต้อง" + api.A[k].on + " (−5)"); }
      }
    }
    draw();
  }

  function start(t) {
    for (const k in api.A) api.A[k].t = 0;
    api.reset();
    run = { t, safe: {}, log: [], extra: [], hints: 0, safeLate: false, firstDis: false, target: false, test: null, done: false };
    folded = false; draw();
  }
  const reachable = () => run.t.need.every(k => api.A[k] && api.A[k].t);

  function score() {
    const t = run.t, d = [];
    run.extra.forEach(k => d.push([5, "ถอดชิ้นที่ไม่จำเป็น: " + api.A[k].on]));
    const miss = t.safe.filter(s => !run.safe[s]);
    if (miss.length || run.safeLate) d.push([10, miss.length ? "ข้ามขั้นความปลอดภัย: " + miss.map(s => T.safe[s]).join(", ") : "ทำขั้นความปลอดภัยหลังเริ่มถอดแล้ว"]);
    if (run.left.length) d.push([20, "ประกอบกลับไม่ครบ: ยังค้าง " + run.left.map(k => api.A[k].on).join(", ")]);
    if (run.hints) d.push([5 * run.hints, "ใช้คำใบ้ " + run.hints + " ครั้ง"]);
    if (run.testOk === false) d.push([10, "เลือกการทดสอบหลังงานไม่ถูก"]);
    return { d, s: Math.max(0, 100 - d.reduce((a, x) => a + x[0], 0)) };
  }

  function draw() {
    if (!box) return;
    box.hidden = !open && !run;
    if (box.hidden) { btn.classList.remove("on"); return; }
    btn.classList.add("on");
    const head = (title) => `<div class="tk-top"><b>🎯 ${esc(title)}</b><span><button class="tk-fold" aria-expanded="${!folded}">${folded ? "▾ แสดง" : "▴ ย่อ"}</button><button class="tk-x" aria-label="ปิดโหมดฝึก">✕</button></span></div>`;
    if (!run) {
      box.innerHTML = head("โหมดฝึกถอดประกอบ") + `<div class="tk-body"><p class="small">เลือกใบงาน แล้วลงมือถอด เปลี่ยนหรือตรวจ และประกอบกลับเองบนโมเดล คะแนนเริ่ม 100 หักเมื่อถอดชิ้นที่ไม่จำเป็น (−5) ข้ามขั้นความปลอดภัย (−10) ประกอบกลับไม่ครบ (−20) ขอคำใบ้ (−5) หรือเลือกการทดสอบหลังงานผิด (−10) · ไม่นับเกณฑ์ผ่าน</p>
        <div class="tk-list">${list().map(t => `<button data-t="${t.id}"><b>${esc(t.n)}</b><small>${esc(t.goal)}</small></button>`).join("")}</div></div>`;
    } else if (run.done) {
      const { d, s } = score(), t = run.t;
      box.innerHTML = head(t.n) + `<div class="tk-body"><div class="tk-score ${s >= 80 ? "ok" : s >= 60 ? "mid" : "bad"}"><b>${s}</b>/100</div>
        ${d.length ? `<ul class="tk-ded">${d.map(x => `<li>−${x[0]} ${esc(x[1])}</li>`).join("")}</ul>` : `<p class="small">ไม่ถูกหักคะแนน ทำครบตามลำดับ</p>`}
        <h4>ลำดับที่ถูก</h4><ol class="tk-path"><li>${esc(t.safe.map(x => T.safe[x]).join(" · "))}</li>${t.need.map(k => `<li>${esc(api.A[k].on)}</li>`).join("")}<li><b>${esc(t.verb)}</b></li><li>ประกอบกลับย้อนลำดับ</li><li>${esc(t.test.o[0])}</li></ol>
        <p class="small">${esc(t.why)}</p>${run.saved ? `<p class="small muted">${esc(run.saved)}</p>` : ""}
        <div class="tk-btns"><button class="pri" data-t="${t.id}">ทำใบงานนี้อีกครั้ง</button><button class="tk-list-b">เลือกใบงานอื่น</button></div></div>`;
    } else if (run.test) {
      const t = run.t;
      box.innerHTML = head(t.n) + `<div class="tk-body"><p><b>ขั้นสุดท้าย: ${esc(t.test.q)}</b></p><div class="tk-opts">${run.test.map(j => `<button data-o="${j}">${esc(t.test.o[j])}</button>`).join("")}</div></div>`;
    } else {
      const t = run.t, can = reachable(), sdone = t.safe.every(s => run.safe[s]);
      box.innerHTML = head(t.n) + `<div class="tk-body"><p class="small">${esc(t.story)}</p>
        <div class="tk-sec">1. เตรียมความปลอดภัย (เลือกเฉพาะที่งานนี้ต้องใช้)</div>
        <div class="tk-safe">${Object.keys(T.safe).map(s => `<button data-s="${s}" class="${run.safe[s] ? "on" : ""}" ${run.safe[s] ? "disabled" : ""}>${run.safe[s] ? "✓ " : ""}${esc(T.safe[s])}</button>`).join("")}</div>
        <div class="tk-sec">2. ถอดบนโมเดลให้ถึงชิ้นที่ต้องการ (แตะชิ้นส่วนแล้วสั่งให้ขยับ)</div>
        <button class="tk-do ${run.target ? "done" : can ? "" : "lock"}" ${run.target ? "disabled" : ""}>${run.target ? "✓ " : "🔧 "}${esc(t.verb)}</button>
        <div class="tk-sec">3. ประกอบกลับให้ครบ แล้วส่งงาน</div>
        <p class="small muted">ถอดชิ้นที่ไม่จำเป็น ${run.extra.length} ชิ้น · คำใบ้ ${run.hints}/2${run.hintTxt ? `<br>💡 ${esc(run.hintTxt)}` : ""}</p>
        <div class="tk-btns"><button class="pri tk-send" ${run.target ? "" : "disabled"}>ส่งงาน</button><button class="tk-hint" ${run.hints >= 2 ? "disabled" : ""}>คำใบ้ (−5)</button><button class="tk-quit">ยกเลิก</button></div></div>`;
    }
    box.classList.toggle("fold", folded);
    const q = s => box.querySelector(s), on = (s, f) => box.querySelectorAll(s).forEach(b => b.onclick = f);
    q(".tk-fold").onclick = () => { folded = !folded; draw(); };
    q(".tk-x").onclick = () => { if (active() && !confirm("ยกเลิกใบงานที่ทำอยู่?")) return; run = null; open = false; draw(); };
    on("[data-t]", e => start(T.tasks.find(t => t.id === e.currentTarget.dataset.t)));
    on(".tk-list-b", () => { run = null; open = true; draw(); });
    on("[data-s]", e => { const s = e.currentTarget.dataset.s; run.safe[s] = true; if (run.firstDis && run.t.safe.includes(s)) run.safeLate = true; draw(); });
    on(".tk-do", () => {
      if (!reachable()) { api.toast("ยังเข้าไม่ถึงชิ้นนี้ ถอดชิ้นที่บังอยู่ก่อน"); return; }
      run.target = true; api.toast("✓ " + run.t.verb + " แล้ว ต่อไปประกอบกลับทีละชิ้น", true); draw();
    });
    on(".tk-hint", () => {
      run.hints++; const t = run.t;
      run.hintTxt = run.hints === 1 ? "ขั้นความปลอดภัยของงานนี้: " + t.safe.map(s => T.safe[s]).join(" · ") : "ลำดับการถอด: " + t.need.map(k => api.A[k].on).join(" → ");
      draw();
    });
    on(".tk-quit", () => { if (!confirm("ยกเลิกใบงานนี้?")) return; run = null; open = true; draw(); });
    on(".tk-send", () => {
      run.left = Object.keys(api.A).filter(k => api.A[k].t).map(norm).filter((k, i, a) => a.indexOf(k) === i);
      if (run.left.length && !confirm("ยังมีชิ้นที่ยังไม่ประกอบกลับ " + run.left.length + " รายการ ส่งงานเลยไหม (−20)")) return;
      run.test = shuffle(run.t.test.o.map((x, j) => j)); draw();
    });
    on("[data-o]", e => { run.testOk = e.currentTarget.dataset.o === "0"; run.done = true; save(); draw(); });
  }

  function save() {
    const { s, d } = score(), t = run.t;
    const S = window.Score;
    if (S && S.profile && S.profile()) {
      S.record({ key: "3d:" + t.id, mod: "3D-ฝึกถอดประกอบ", item: t.n, score: s, max: 100, detail: d.map(x => "−" + x[0] + " " + x[1]).join(" · ") });
      run.saved = "บันทึกเป็นประวัติใน \"ผลของฉัน\" แล้ว (ไม่นับเกณฑ์ผ่าน)";
    } else run.saved = "ยังไม่ได้บันทึกประวัติ: เปิดหน้าวิชาและเข้าสู่ระบบก่อน แล้วกลับมาที่หน้านี้";
  }

  window.Task3D = { init, onToggle, active };
})();
