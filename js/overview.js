/* ===== โมดูล 1: แท็บ "ภาพรวม" (ใช้ร่วมกันทั้งแอปปั๊มและตู้อบ) =====
   อ่านข้อมูลจาก window.OVERVIEW แล้วแสดงในแผง #ov-panel
   กดกล่องเส้นทาง แถว sensor หรือขั้นตอน เพื่อไฮไลต์ชิ้นส่วนบนภาพตัด #svg-cut */
(function(){
  const O = window.OVERVIEW, box = document.getElementById("ov-panel");
  if(!O || !box) return;
  const esc = s => String(s).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

  function hi(ids){
    document.querySelectorAll("#svg-cut .part").forEach(p=>p.classList.toggle("sel", (ids||[]).includes(p.dataset.id)));
  }
  const sec = (title, body, open) => `<details class="ov-sec"${open?" open":""}><summary>${esc(title)}</summary><div class="ov-body">${body}</div></details>`;

  const path = `<div class="ov-path">${O.path.map((n,i)=>
    `${i?'<span class="ov-arr" aria-hidden="true">→</span>':""}<button type="button" class="ov-node${n.ids.length?"":" end"}" data-ids="${n.ids.join(" ")}"${n.ids.length?"":" disabled"}>${esc(n.t)}</button>`).join("")}</div>
    <p class="muted small">กดที่กล่องเพื่อดูตำแหน่งบนภาพตัด</p>`;

  const sens = `<div class="ov-tbl"><table><thead><tr><th>Sensor</th><th>วัดอย่างไร</th><th>เตือนเมื่อ</th></tr></thead><tbody>
    ${O.sensors.map(s=>`<tr data-ids="${s.ids.join(" ")}" tabindex="0"><td><b>${esc(s.n)}</b></td><td>${esc(s.how)}</td><td>${esc(s.when)}</td></tr>`).join("")}
    </tbody></table></div><p class="muted small">แตะแถวเพื่อดูตำแหน่งบนภาพตัด</p>`;

  const steps = `<div class="ov-steps">
    <div class="ov-dots">${O.steps.map((s,i)=>`<button type="button" data-i="${i}" aria-label="ขั้นที่ ${i+1} ${esc(s.t)}">${i+1}</button>`).join("")}</div>
    <div class="ov-step" aria-live="polite"></div>
    <div class="ov-nav"><button type="button" class="ov-prev">◀ ก่อนหน้า</button><button type="button" class="ov-next">ถัดไป ▶</button></div></div>`;

  const extra = (O.extra||[]).map(x=>sec(x.title, `<ul>${x.items.map(t=>`<li>${t}</li>`).join("")}</ul>`)).join("");

  const check = `<ol class="ov-check">${O.check.map(c=>`<li><p>${esc(c.q)}</p><details><summary>ดูแนวคำตอบ</summary><p>${esc(c.a)}</p></details></li>`).join("")}</ol>
    <p class="muted small">ไม่นับคะแนน ทำเสร็จแล้วลองไปแท็บ “ภาพตัดภายใน” เพื่อดูรายละเอียดทีละชิ้น</p>`;

  box.innerHTML = `<div class="en">ภาพรวม</div><h2>เครื่องทำงานอย่างไร</h2>
    ${sec("เครื่องนี้ทำหน้าที่อะไร", `<p>${esc(O.what)}</p>`, true)}
    ${sec(O.mechTitle, O.mech.map(p=>`<p>${esc(p)}</p>`).join("") + `<button type="button" class="pill ov-show" data-ids="${O.mechIds.join(" ")}">ดูบนภาพตัด</button>`, true)}
    ${sec(O.pathTitle, path)}
    ${sec(O.sensTitle, sens)}
    ${sec(O.stepsTitle, steps)}
    ${extra}
    ${sec("เชื่อมกับงานซ่อม", `<p>${O.repair}</p>`)}
    ${sec("ทบทวนตัวเอง", check)}`;

  /* ไฮไลต์จากกล่อง แถว และปุ่ม */
  box.querySelectorAll("[data-ids]").forEach(el=>{
    const go = ()=>{
      box.querySelectorAll(".on-hi").forEach(x=>x.classList.remove("on-hi"));
      el.classList.add("on-hi"); hi(el.dataset.ids.split(" ").filter(Boolean));
    };
    el.addEventListener("click", go);
    el.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } });
  });

  /* ขั้นตอน 5 ขั้น */
  let cur = 0;
  const stepBox = box.querySelector(".ov-step"), dots = box.querySelectorAll(".ov-dots button");
  const prev = box.querySelector(".ov-prev"), next = box.querySelector(".ov-next");
  function show(i){
    cur = Math.max(0, Math.min(O.steps.length-1, i));
    const s = O.steps[cur];
    stepBox.innerHTML = `<b>ขั้นที่ ${cur+1} · ${esc(s.t)}</b><p>${esc(s.d)}</p>`;
    dots.forEach((d,k)=>d.classList.toggle("on", k===cur));
    prev.disabled = cur===0; next.disabled = cur===O.steps.length-1;
    box.querySelectorAll(".on-hi").forEach(x=>x.classList.remove("on-hi"));
    hi(s.ids);
  }
  dots.forEach(d=>d.onclick=()=>show(+d.dataset.i));
  prev.onclick=()=>show(cur-1); next.onclick=()=>show(cur+1);
  /* เปิดหัวข้อ 5 ขั้นแล้วไฮไลต์ขั้นปัจจุบันทันที */
  const stepSec = stepBox.closest("details");
  stepSec.addEventListener("toggle", ()=>{ if(stepSec.open) show(cur); });
  stepBox.innerHTML = `<b>ขั้นที่ 1 · ${esc(O.steps[0].t)}</b><p>${esc(O.steps[0].d)}</p>`;
  dots[0].classList.add("on"); prev.disabled = true;

  window.Overview = {clear:()=>{ hi([]); box.querySelectorAll(".on-hi").forEach(x=>x.classList.remove("on-hi")); }};
})();
