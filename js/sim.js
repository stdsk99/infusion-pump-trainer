/* ===== โมดูล 3: จำลองการซ่อม ===== */
(function(){
  const S = window.SIM;
  const ACT = Object.fromEntries(S.ACTIONS.map(a=>[a.id,a]));
  const FLT = Object.fromEntries(S.FAULTS.map(a=>[a.id,a]));
  const REP = Object.fromEntries(S.REPAIRS.map(a=>[a.id,a]));
  const TST = Object.fromEntries(S.TESTS.map(a=>[a.id,a]));
  const LV = {1:"ง่าย",2:"กลาง",3:"ยาก"};
  const STEPS = ["ตรวจหาสาเหตุ","วินิจฉัย","ซ่อม","ทดสอบหลังซ่อม","ผลคะแนน"];
  const root = document.getElementById("sim");
  const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const baht = n => n.toLocaleString("th-TH");
  let st = null;

  /* คะแนนสูงสุดที่เคยได้ เก็บในเบราว์เซอร์ของผู้ใช้ */
  /* คะแนนดีที่สุดของเคส จากประวัติที่ซิงก์กับระบบ */
  function best(id){ const b=window.Score&&Score.bestOf("exam:"+id); return b?b.score:null; }

  let mode="learn";
  function list(){
    st=null;
    const L=window.Learn;
    const tabs=`<div class="seg modes"><button data-m="learn" class="${mode==="learn"?"on":""}">โหมดเรียนรู้</button><button data-m="exam" class="${mode==="exam"?"on":""}">โหมดสอบ</button></div>`;
    const intro = mode==="learn"
      ? `<p class="muted">ทำทีละขั้น พร้อมภาพเครื่องเคลื่อนไหวตามอาการ แต่ละขั้นมีตัวเลือก 3 ข้อ ถ้าเลือกผิดจะเห็นผลและคำอธิบาย แล้วเลือกใหม่ได้ <b>แนะนำให้เริ่มที่โหมดนี้</b></p>`
      : `<p class="muted">ตรวจได้อย่างอิสระเหมือนทำงานจริง คะแนนเริ่มที่ 100 และจะถูกหักเมื่อข้ามขั้นตอนความปลอดภัย วินิจฉัยผิด เปลี่ยนอะไหล่เกินจำเป็น ข้ามการทดสอบ หรือใช้เวลาเกินกำหนด</p>`;
    root.innerHTML = `
      <h1>จำลองการซ่อม</h1>${tabs}${intro}
      <div class="cases">${S.CASES.map((c,i)=>{
        const has = mode==="exam" || (L && L.has(c.id));
        const b=best(c.id);
        return `<button class="case ${has?"":"soon"}" data-i="${i}" ${has?"":"aria-disabled=\"true\""}>
          <span class="lv lv${c.lv}">${LV[c.lv]}</span>
          <span class="ct">เคส ${i+1} · ${esc(c.n)}</span>
          <span class="cm">${esc(c.ward)} · alarm: ${esc(c.alarm)}</span>
          <span class="cb">${mode==="learn"?(!has?"กำลังจัดทำ":(window.Score&&Score.has("learn:"+c.id)?"✓ เรียนแล้ว":"ยังไม่ได้เรียน")):(b!==null?`✓ คะแนนดีที่สุด ${b}`:"ยังไม่ได้ทำ")}</span>
        </button>`;}).join("")}</div>`;
    root.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{mode=b.dataset.m;list();});
    root.querySelectorAll(".case").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.i, c=S.CASES[i];
      if(mode==="exam") return start(i);
      if(L && L.has(c.id)) L.start(c.id, root, {onBack:list, onExam:id=>{mode="exam";start(S.CASES.findIndex(x=>x.id===id));}});
    });
  }

  function start(i){
    st = {i, c:S.CASES[i], step:0, done:new Set(), log:[], min:0, open:false,
          safe:{disinfect:false,unplug:false,esd:false}, pen:[], esdWarned:false,
          diagTry:0, diagMsg:"", repMsg:"", cost:0, used:[], testsDone:[], keyChecked:false, openG:new Set(["ภายนอก"])};
    render(); window.scrollTo(0,0);
  }
  function penalize(t,p){ st.pen.push({t,p}); }
  function flash(msg,kind){
    const el=document.getElementById("toast"); if(!el) return;
    el.textContent=msg; el.className="toast on "+(kind||"");
    clearTimeout(el._t); el._t=setTimeout(()=>el.className="toast",3200);
  }

  function result(id){
    const c=st.c, a=ACT[id];
    if(c.r[id]) return {t:c.r[id].t, v:c.r[id].v, bad:!!c.r[id].bad};
    if(c.block && c.block.ids.includes(id)) return {t:c.block.t, bad:true, na:true};
    return {t:a.ok, v:a.v, bad:false};
  }

  function doAction(id){
    const a=ACT[id];
    if(st.done.has(id)) return;
    if(a.open && !st.open){ flash("ต้องเปิดฝาเครื่องก่อน","warn"); return; }
    if(id==="open_case"){
      if(!st.safe.unplug){ penalize("เปิดฝาเครื่องขณะยังเสียบปลั๊กไฟ",-15); flash("อันตราย! เปิดฝาเครื่องขณะยังเสียบปลั๊ก −15","bad"); }
      if(!st.safe.disinfect){ penalize("เปิดเครื่องโดยไม่ทำความสะอาดฆ่าเชื้อก่อน",-5); }
      st.open=true;
    }
    if(a.esd && !st.safe.esd && !st.esdWarned){
      st.esdWarned=true; penalize("จับบอร์ดโดยไม่สวมสายรัดข้อมือ ESD",-5); flash("ยังไม่ได้สวมสายรัดข้อมือ ESD −5","bad");
    }
    st.done.add(id); st.min+=a.min;
    st.log.unshift({id, n:a.n, ...(id==="open_case"?{t:a.ok}:result(id))});
    render();
  }

  function setSafe(k){
    if(st.safe[k]) return;
    st.safe[k]=true; st.min+= (k==="disinfect"?5:1);
    render();
  }

  function goDiag(){
    if(!st.done.size){ flash("ยังไม่ได้ตรวจอะไรเลย","warn"); return; }
    st.step=1; render(); window.scrollTo(0,0);
  }

  function submitDiag(id){
    if(!id){ flash("เลือกสาเหตุก่อน","warn"); return; }
    if(id===st.c.ans){
      if(!st.keyChecked){
        st.keyChecked=true;
        st.c.key.filter(k=>!st.done.has(k)).forEach(k=>penalize(`สรุปโดยยังไม่ได้ตรวจยืนยัน: ${ACT[k].n}`,-5));
      }
      st.diagMsg=""; st.step=2; render(); window.scrollTo(0,0);
    }else{
      st.diagTry++; penalize(`วินิจฉัยผิดเป็น "${FLT[id].n}"`,-20);
      st.diagMsg=`“${FLT[id].n}” ยังไม่ตรงกับหลักฐานที่มี (−20) ลองทบทวนผลการตรวจ หรือกลับไปตรวจเพิ่ม`;
      render();
    }
  }

  function submitRepair(id){
    if(!id){ flash("เลือกวิธีซ่อมก่อน","warn"); return; }
    const r=REP[id], c=st.c;
    st.cost+=r.cost; st.used.push(r.n); st.min+=20;
    if(c.fix.includes(id)){
      st.repMsg=""; st.step=3;
    }else if(c.costly.includes(id)){
      penalize(`${r.n}: แก้ได้ แต่เกินความจำเป็น (เสียค่าอะไหล่ ${baht(r.cost)} บาท)`,-10);
      st.repMsg=""; st.step=3;
      flash("เครื่องหายแล้ว แต่เปลี่ยนอะไหล่เกินความจำเป็น −10","warn");
    }else{
      penalize(`${r.n}: ไม่ได้แก้ที่ต้นเหตุ`,-10);
      st.repMsg=`ทำ “${r.n}” แล้ว ทดลองเดินเครื่องอาการยังเหมือนเดิม (−10)`;
    }
    render(); if(st.step===3) window.scrollTo(0,0);
  }

  function submitTests(ids){
    const c=st.c;
    ids.forEach(id=>{ st.min+=TST[id].min; });
    st.testsDone=ids;
    c.need.filter(n=>!ids.includes(n)).forEach(n=>penalize(`ไม่ได้ทำ ${TST[n].n} ก่อนส่งคืน`,-10));
    const over=st.min-c.budget;
    if(over>0) penalize(`ใช้เวลาเกินกำหนด ${over} นาที`,-Math.min(15,Math.ceil(over/10)));
    st.step=4; render(); window.scrollTo(0,0);
  }

  function score(){ return Math.max(0,100+st.pen.reduce((s,p)=>s+p.p,0)); }

  /* ---------- แสดงผล ---------- */
  function stepper(){
    return `<ol class="stepper">${STEPS.map((s,i)=>`<li class="${i<st.step?"ok":i===st.step?"on":""}"><span>${i+1}</span>${s}</li>`).join("")}</ol>`;
  }
  function head(){
    const c=st.c, over=st.min>c.budget;
    return `<div class="simhead">
      <button class="ghost" id="sim-back">← รายการเคส</button>
      <div class="meta"><span>เวลา <b class="${over?"over":""}">${st.min}</b> / ${c.budget} นาที</span><span>คะแนน <b>${score()}</b></span></div>
    </div>
    <h1>เคส ${st.i+1} · ${esc(c.n)}</h1>${stepper()}`;
  }
  function ticket(){
    const c=st.c;
    return `<div class="ticket">
      <div class="tk-h"><span>ใบแจ้งซ่อม</span><span class="lv lv${c.lv}">${LV[c.lv]}</span></div>
      <dl><dt>หน่วยงาน</dt><dd>${esc(c.ward)}</dd><dt>Alarm</dt><dd><code>${esc(c.alarm)}</code></dd><dt>อาการ</dt><dd>${esc(c.note)}</dd></dl>
    </div>`;
  }
  function logHTML(){
    if(!st.log.length) return `<p class="muted small">ผลการตรวจจะแสดงที่นี่ (ใหม่สุดอยู่บน)</p>`;
    return st.log.map(l=>`<div class="lg ${l.bad?"bad":""} ${l.na?"na":""}">
      <div class="lg-n">${esc(l.n)}</div>
      ${l.v?`<div class="meter">${esc(l.v)}</div>`:""}
      <div>${esc(l.t)}</div></div>`).join("");
  }

  function hint(){
    const n=st.done.size, bad=st.log.filter(l=>l.bad&&!l.na).length;
    if(!n) return "อ่านใบแจ้งซ่อมและดูภาพอาการ แล้วเริ่มจากการตรวจที่ง่ายและไม่ต้องรื้อเครื่อง เช่น สอบถามผู้แจ้งหรือตรวจภายนอก";
    if(!st.open && bad<2 && n>=3) return "ถ้าตรวจภายนอกและ service mode แล้วยังไม่พบหลักฐานพอ อาจต้องเปิดเครื่อง อย่าลืมขั้นตอนความปลอดภัยก่อนเปิดฝา";
    if(bad>=2) return "มีหลักฐานผิดปกติหลายข้อแล้ว ลองดูว่าชี้ไปที่สาเหตุเดียวกันหรือไม่ ถ้าใช่ ให้ตรวจยืนยันอีกครั้งแล้วกดสรุปการวินิจฉัย";
    if(bad===1) return "พบสิ่งผิดปกติ 1 ข้อแล้ว หาหลักฐานอีกอย่างน้อย 1 ข้อเพื่อยืนยัน โดยเฉพาะหลักฐานที่วัดเป็นตัวเลขได้";
    return "ยังไม่พบสิ่งผิดปกติ ลองตรวจในส่วนที่เกี่ยวกับ alarm หรืออาการที่แจ้งมา";
  }
  function inlineRes(id){
    const l=st.log.find(x=>x.id===id); if(!l) return "";
    return `<div class="ares ${l.bad?"bad":""}">${l.v?`<span class="meter">${esc(l.v)}</span>`:""}<span>${esc(l.t)}</span></div>`;
  }
  function viewInvestigate(){
    const groups=[...new Set(S.ACTIONS.map(a=>a.g))];
    const safeBtn=(k,label)=>`<button class="sf ${st.safe[k]?"on":""}" data-s="${k}">${st.safe[k]?"✓ ":""}${label}</button>`;
    return `<div class="simgrid">
      <div>
        <div class="hint">💡 ${esc(hint())}</div>
        <div class="exam-top"><div id="mini"></div>${ticket()}</div>
        <h2>ความปลอดภัยก่อนเริ่มงาน</h2>
        <div class="tools">${safeBtn("disinfect","ทำความสะอาดฆ่าเชื้อเครื่อง")}${safeBtn("unplug","ถอดปลั๊กไฟ")}${safeBtn("esd","สวมสายรัดข้อมือ ESD")}</div>
        <p class="muted small">การตรวจใน service mode และการทดสอบเครื่อง ให้ถือว่าต่อไฟชั่วคราวระหว่างทดสอบ</p>
        <h2>การตรวจ</h2><p class="muted small">แตะชื่อกลุ่มเพื่อเปิดดูรายการตรวจ</p>
        ${groups.map(g=>`<details class="grp" data-g="${esc(g)}" ${st.openG.has(g)?"open":""}><summary>${esc(g)} <small>${S.ACTIONS.filter(a=>a.g===g&&st.done.has(a.id)).length}/${S.ACTIONS.filter(a=>a.g===g).length}</small></summary><div class="acts">${S.ACTIONS.filter(a=>a.g===g).map(a=>{
          const dis=a.open&&!st.open, done=st.done.has(a.id);
          return `<button class="act ${done?"done":""}" data-a="${a.id}" ${dis?"aria-disabled=\"true\"":""}>
            <span>${done?"✓ ":""}${esc(a.n)}</span><small>${a.min} นาที${dis?" · ต้องเปิดฝาก่อน":""}</small>${done?inlineRes(a.id):""}</button>`;}).join("")}</div></details>`).join("")}
      </div>
      <aside class="logbox">
        <h2>ผลการตรวจ</h2>
        <div id="log">${logHTML()}</div>
        <button class="primary wide" id="go-diag">สรุปการวินิจฉัย →</button>
      </aside>
    </div>`;
  }

  function viewDiag(){
    return `<div class="simgrid">
      <div>
        <h2>สาเหตุของอาการคืออะไร</h2>
        <p class="muted small">เลือกสาเหตุที่หลักฐานจากการตรวจสนับสนุนมากที่สุด ตอบผิดหักครั้งละ 20 คะแนน</p>
        ${st.diagMsg?`<div class="msg bad">${esc(st.diagMsg)}</div>`:""}
        <div class="opts">${S.FAULTS.map(f=>`<label class="opt"><input type="radio" name="dg" value="${f.id}"><span>${esc(f.n)}</span></label>`).join("")}</div>
        <div class="tools"><button class="ghost" id="back-inv">← กลับไปตรวจเพิ่ม</button><button class="primary" id="sub-diag">ยืนยันการวินิจฉัย</button></div>
      </div>
      <aside class="logbox"><h2>ผลการตรวจที่มี</h2>${logHTML()}</aside>
    </div>`;
  }

  function viewRepair(){
    return `<div class="msg ok">วินิจฉัยถูกต้อง: <b>${esc(FLT[st.c.ans].n)}</b></div>
      <h2>เลือกวิธีซ่อม</h2>
      <p class="muted small">ให้แก้ที่ต้นเหตุ ด้วยวิธีที่ประหยัดที่สุดและได้ผล ราคาอะไหล่เป็นค่าสมมติ</p>
      ${st.repMsg?`<div class="msg bad">${esc(st.repMsg)}</div>`:""}
      <div class="opts">${S.REPAIRS.map(r=>`<label class="opt"><input type="radio" name="rp" value="${r.id}"><span>${esc(r.n)}</span><em>${r.cost?baht(r.cost)+" บาท":"ไม่มีค่าอะไหล่"}</em></label>`).join("")}</div>
      <div class="tools"><button class="primary" id="sub-rep">ลงมือซ่อม</button></div>`;
  }

  function viewTests(){
    return `<div class="msg ok">ซ่อมเรียบร้อย ทดลองเดินเครื่องแล้วอาการหายไป</div>
      <h2>เลือกการทดสอบก่อนส่งเครื่องคืน</h2>
      <p class="muted small">เลือกให้ครบตามความเสี่ยงของงานที่ทำไป การทดสอบที่ไม่จำเป็นจะเสียเวลาเพิ่ม</p>
      <div class="opts">${S.TESTS.map(t=>`<label class="opt"><input type="checkbox" name="ts" value="${t.id}"><span>${esc(t.n)}</span><em>${t.min} นาที</em></label>`).join("")}</div>
      <div class="tools"><button class="primary" id="sub-test">ทดสอบและส่งคืนเครื่อง</button></div>`;
  }

  function viewResult(){
    const c=st.c, sc=score();
    if(!st.recorded){ st.recorded=true; window.Score&&Score.record({key:"exam:"+c.id, mod:"3-จำลองซ่อม (สอบ)", item:c.n, score:sc, max:100, detail:`เวลา ${st.min} นาที · อะไหล่ ${st.cost} บาท`}); }
    const grade= sc>=90?["ดีเยี่ยม","ok"]: sc>=75?["ดี","ok"]: sc>=60?["ผ่าน","mid"]:["ควรฝึกเพิ่ม","bad"];
    const next=st.i+1<S.CASES.length;
    return `<div class="score ${grade[1]}"><div class="big">${sc}</div><div>${grade[0]}</div></div>
      <div class="sumrow"><div><small>เวลาที่ใช้</small><b>${st.min} นาที</b><small>กำหนด ${c.budget} นาที</small></div>
        <div><small>ค่าอะไหล่</small><b>${baht(st.cost)} บาท</b></div>
        <div><small>ตรวจไป</small><b>${st.done.size} รายการ</b></div></div>
      <h2>รายการหักคะแนน</h2>
      ${st.pen.length?`<ul class="pen">${st.pen.map(p=>`<li><span>${esc(p.t)}</span><b>${p.p}</b></li>`).join("")}</ul>`:`<p>ไม่มีการหักคะแนน ทำได้ครบถ้วนทุกขั้นตอน</p>`}
      <h2>เฉลยและข้อคิด</h2>
      <div class="learn">
        <p><b>สาเหตุ:</b> ${esc(FLT[c.ans].n)}</p>
        <p><b>วิธีซ่อมที่เหมาะสม:</b> ${c.fix.map(f=>esc(REP[f].n)).join(", ")}</p>
        <p><b>การตรวจสำคัญ:</b> ${c.key.map(k=>esc(ACT[k].n)).join(", ")}</p>
        <p><b>การทดสอบที่ต้องทำ:</b> ${c.need.map(t=>esc(TST[t].n)).join(", ")}</p>
        <p>${esc(c.learn)}</p>
      </div>
      <div class="tools"><button id="again">ทำเคสนี้ใหม่</button>${next?`<button class="primary" id="next">เคสถัดไป →</button>`:""}<button class="ghost" id="tolist">รายการเคส</button></div>`;
  }

  function render(){
    if(!st){ list(); return; }
    const v=[viewInvestigate,viewDiag,viewRepair,viewTests,viewResult][st.step]();
    root.innerHTML = head()+v+`<div id="toast" class="toast"></div>`;
    const $=id=>document.getElementById(id);
    $("sim-back").onclick=list;
    if($("mini") && window.Learn) window.Learn.mini($("mini"), st.c);
    root.querySelectorAll("details.grp").forEach(d=>d.addEventListener("toggle",()=>{d.open?st.openG.add(d.dataset.g):st.openG.delete(d.dataset.g);}));
    root.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>doAction(b.dataset.a));
    root.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>setSafe(b.dataset.s));
    if($("go-diag")) $("go-diag").onclick=goDiag;
    if($("back-inv")) $("back-inv").onclick=()=>{st.step=0;render();};
    if($("sub-diag")) $("sub-diag").onclick=()=>{const r=root.querySelector('input[name=dg]:checked');submitDiag(r&&r.value);};
    if($("sub-rep")) $("sub-rep").onclick=()=>{const r=root.querySelector('input[name=rp]:checked');submitRepair(r&&r.value);};
    if($("sub-test")) $("sub-test").onclick=()=>submitTests([...root.querySelectorAll('input[name=ts]:checked')].map(x=>x.value));
    if($("again")) $("again").onclick=()=>start(st.i);
    if($("next")) $("next").onclick=()=>start(st.i+1);
    if($("tolist")) $("tolist").onclick=list;
  }

  window.Sim = { show(){ if(!st) list(); } };
  if(document.getElementById("v-repair").classList.contains("on")) list();
})();
