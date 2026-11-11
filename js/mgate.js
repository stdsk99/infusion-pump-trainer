/* ===== เรียนตามลำดับ + สอบท้ายโมดูล (ไฟล์เดียวกันทุกวิชา ทั้งวิชาซ่อมและวิชาคลินิก) =====
   ข้อมูล: window.MQUIZ = { take:5, pass:4, final:"quiz", after:["sim"], label:"โมดูล", mods:[{id, v, n, qs:[{q, o:[ถูก, ผิด...], e}]}] }
     id  = รหัสโมดูล (บันทึกคะแนนเป็น key "mq:<id>")
     v   = ชื่อหน้าที่ใช้ใน #nav (วิชาซ่อม) หรือรหัสบทเรียน (วิชาคลินิก)
     final/after = หน้าที่เปิดได้เมื่อผ่านครบทุกโมดูล · done = {href, t} ปุ่มไปต่อหลังผ่านโมดูลสุดท้าย · lessonMode = วิชาคลินิก (โมดูลคือบทเรียนในหน้าเดียว)
   กติกา: โมดูลถัดไปเปิดเมื่อสอบท้ายโมดูลก่อนหน้าได้อย่างน้อย pass/take (โมดูลใดกำหนด pass ของตัวเอง เช่น ด่านความปลอดภัย pass:5 ใช้ค่านั้นแทน) · สุ่ม take ข้อจากคลังทุกครั้ง · สอบซ้ำได้ไม่จำกัด
   โหมดดูตัวอย่าง (?preview) ไม่ล็อก เพื่อให้ผู้สอนตรวจเนื้อหาได้ทุกหน้า
   ต้องเปิดดูเนื้อหาครบทุกหัวข้อก่อนเริ่มสอบ: ใช้ js/seen.js (Seen.define(<id โมดูล>, …)) ถ้าโมดูลไม่ได้กำหนดหัวข้อไว้ เริ่มสอบได้ทันที */
(function(){
  const Q=window.MQUIZ; if(!Q||!Q.mods||!Q.mods.length) return;
  const take=Q.take||5, need=Q.pass||4, label=Q.label||"โมดูล";
  const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const free=()=>!!window.PREVIEW;
  const best=id=>{ const b=window.Score&&Score.bestOf("mq:"+id); return b?b.score:0; };
  const needOf=id=>{ const m=Q.mods[idx(id)]; return (m&&m.pass)||need; };
  const passed=id=>best(id)>=needOf(id);
  const idx=id=>Q.mods.findIndex(m=>m.id===id||m.v===id);
  /* โมดูลแรกที่ยังไม่ผ่าน (= ทำได้ถึงโมดูลนี้) */
  function frontier(){ const i=Q.mods.findIndex(m=>!passed(m.id)); return i<0?Q.mods.length:i; }
  /* ยังซิงก์ประวัติจากระบบไม่เสร็จ (เปิดแอปครั้งแรกบนเครื่องนี้): ยังไม่ล็อก รอ auth.js โหลดประวัติแล้วสั่ง route ใหม่ */
  function ready(){
    try{ const m=JSON.parse(localStorage.getItem("mtc-session")||"null"), s=window.Score&&Score.session&&Score.session();
      return !!(m && s && s.tk===m.tk); }catch(e){ return false; }
  }
  function locked(v){
    if(free() || !ready()) return false;
    const f=frontier();
    if(v===Q.final || (Q.after||[]).includes(v)) return f<Q.mods.length;
    const i=idx(v); return i>=0 && i>f;
  }
  function lockMsg(v){
    const f=frontier(), m=Q.mods[Math.min(f,Q.mods.length-1)];
    return `ต้องผ่านสอบท้าย${label} "${m.n}" ก่อน (ได้อย่างน้อย ${needOf(m.id)} จาก ${take} ข้อ)`;
  }
  /* วิชาซ่อม: ใช้ใน route() ถ้าหน้าที่จะเปิดยังล็อก ให้พาไปหน้าที่ต้องทำต่อ */
  function guard(v){
    if(!locked(v)) return v;
    toast(lockMsg(v));
    return Q.mods[frontier()].v;
  }
  function toast(msg){
    let t=document.getElementById("gtoast");
    if(!t){ t=document.createElement("div"); t.id="gtoast"; t.className="toast"; t.setAttribute("role","status"); document.body.appendChild(t); }
    t.textContent=msg; t.className="toast on"; clearTimeout(t._t); t._t=setTimeout(()=>t.className="toast",3600);
  }
  /* ใส่สัญลักษณ์ 🔒 / ✓ ที่เมนูและการ์ดหน้าแรก */
  function decorate(){
    const mark=(el,v)=>{
      if(!el) return;
      const i=idx(v), isFinal=v===Q.final||(Q.after||[]).includes(v);
      if(i<0 && !isFinal) return;
      el.classList.toggle("mlock", locked(v));
      el.classList.toggle("mdone", i>=0 && passed(Q.mods[i].id));
    };
    document.querySelectorAll("#nav a[data-v]").forEach(a=>mark(a,a.dataset.v));
    document.querySelectorAll("#v-home a.card[href^='#']").forEach(a=>mark(a,a.getAttribute("href").slice(1)));
    const st=document.getElementById("mq-strip");
    if(st){ const f=frontier(), n=Q.mods.length;
      st.innerHTML=free()?`<b>โหมดดูตัวอย่าง:</b> ไม่ล็อก${label} เปิดดูได้ทุกหน้า`
        : f>=n?`<b>✓ ผ่านสอบท้าย${label}ครบ ${n} ${label}แล้ว</b> ทำกิจกรรมที่เหลือและสอบรวมให้ผ่านเกณฑ์ใบรับรอง`
        : `<b>เรียนตามลำดับ:</b> ผ่านแล้ว ${f}/${n} ${label} · ต่อไป <a href="#${esc(Q.mods[f].v)}">${esc(Q.mods[f].n)}</a> (สอบท้าย${label} ${take} ข้อ ${needOf(Q.mods[f].id)>=take?"ต้องถูกครบทุกข้อ":"ผ่านเมื่อได้ "+needOf(Q.mods[f].id)+" ข้อขึ้นไป"})`; }
  }

  /* ---------- กล่องสอบท้ายโมดูล ---------- */
  const state={};   // id -> {qs:[{q,ord}], ans:{}, res}
  function boxHTML(id){ return `<div class="mq" data-mq="${esc(id)}"></div>`; }
  function render(el){
    const id=el.dataset.mq, M=Q.mods[idx(id)]; if(!M) return;
    const S=state[id]||(state[id]={});
    const i=idx(id), next=Q.mods[i+1], b=best(id), ok=passed(id);
    const head=`<div class="mq-h"><b>📝 สอบท้าย${label}: ${esc(M.n)}</b><span class="${ok?"ok":""}">${ok?`✓ ผ่านแล้ว (ดีที่สุด ${b}/${take})`:b?`ดีที่สุด ${b}/${take} · ยังไม่ผ่าน`:`ยังไม่ได้สอบ`}</span></div>`;
    if(!S.qs){
      const sn=window.Seen?Seen.status(id):{ok:true};
      if(!sn.ok){ el.innerHTML=head+Seen.gateHTML(id); return; }
      el.innerHTML=head+`<p class="small muted">สุ่ม ${take} ข้อจากคลัง ${M.qs.length} ข้อ ต้องได้อย่างน้อย ${needOf(id)} ข้อ${needOf(id)>=take?" (ถูกทุกข้อ)":""}จึงผ่าน${next?` และเปิด${label}ถัดไป`:""} สอบซ้ำได้ไม่จำกัด แต่ละรอบได้ข้อไม่เหมือนกัน</p>
        <div class="tools"><button class="primary mq-go">${b?"สอบอีกครั้ง":"เริ่มสอบ"}</button>${ok&&next?`<a class="btn" href="${nextHref(next)}">ไป${label}ถัดไป →</a>`:""}</div>`;
      el.querySelector(".mq-go").onclick=()=>{ S.qs=(window.QPick?QPick.pick("mq:"+id,M.qs,take):shuffle(M.qs).slice(0,take)).map(q=>({q,ord:shuffle(q.o.map((x,k)=>k))})); S.ans={}; S.res=null; render(el); };
      wireNext(el); return;
    }
    const done=!!S.res;
    el.innerHTML=head+`<ol class="mq-qs">${S.qs.map((x,k)=>{ const a=S.ans[k];
        return `<li><p>${esc(x.q.q)}</p><div class="lopts">${x.ord.map(j=>{
          const cls=done?(j===0?"good":a===j?"bad":""):(a===j?"on":"");
          return `<button class="lopt ${cls}" data-k="${k}" data-j="${j}" ${done?"disabled":""}>${esc(x.q.o[j])}</button>`; }).join("")}</div>
          ${done?`<div class="fb ${a===0?"good":"bad"}"><b>${a===0?"✓ ถูก":"✗ ไม่ถูก"}</b> ${esc(x.q.e||"")}</div>`:""}</li>`; }).join("")}</ol>
      ${done?resultHTML(S, ok, next, needOf(id)):`<div class="tools"><button class="primary mq-send" ${Object.keys(S.ans).length<S.qs.length?"disabled":""}>ส่งคำตอบ</button><span class="small muted">ตอบแล้ว ${Object.keys(S.ans).length}/${S.qs.length}</span></div>`}`;
    el.querySelectorAll("[data-j]").forEach(bn=>bn.onclick=()=>{ S.ans[+bn.dataset.k]=+bn.dataset.j; const y=window.scrollY; render(el); window.scrollTo(0,y); });
    const send=el.querySelector(".mq-send");
    if(send) send.onclick=async()=>{
      send.disabled=true; send.textContent="กำลังบันทึก…";
      const sc=S.qs.filter((x,k)=>S.ans[k]===0).length; S.res={sc};
      if(window.Score) await Score.record({key:"mq:"+id, mod:"สอบท้าย"+label, item:M.n, score:sc, max:take, detail:sc>=needOf(id)?"ผ่าน":"ไม่ผ่าน", q:window.QPick?QPick.ids(S.qs.map(x=>x.q)):""});
      render(el); decorate(); if(window.MGate.onChange) window.MGate.onChange(id);
      el.scrollIntoView({behavior:"smooth",block:"start"});
    };
    const again=el.querySelector(".mq-again"); if(again) again.onclick=()=>{ S.qs=null; render(el); };
    wireNext(el);
  }
  function resultHTML(S, ok, next, need){
    const p=S.res.sc>=need;
    const nx=next?`<a class="btn primary" href="${nextHref(next)}">ไป${label}ถัดไป: ${esc(next.n)} →</a>`
      : `<a class="btn primary" href="${esc(Q.done?Q.done.href:"#"+Q.final)}">ผ่านครบทุก${label}แล้ว ${esc(Q.done?Q.done.t:"ไปสอบรวม")} →</a>`;
    return `<div class="score ${p?"ok":"bad"}"><div class="big">${S.res.sc}/${take}</div><div>${p?"ผ่าน":"ยังไม่ผ่าน ต้องได้อย่างน้อย "+need+" ข้อ ทบทวนเนื้อหาแล้วสอบใหม่"}</div></div>
      <div class="tools">${p||ok?nx:""}<button class="mq-again">${p?"สอบอีกรอบ (ฝึกเพิ่ม)":"สอบใหม่ (สุ่มข้อใหม่)"}</button></div>`;
  }
  function nextHref(m){ return Q.lessonMode ? "#lessons" : "#"+m.v; }
  function wireNext(el){
    if(!Q.lessonMode) return;
    el.querySelectorAll("a[href='#lessons']").forEach(a=>a.onclick=e=>{ e.preventDefault(); const i=idx(el.dataset.mq); if(window.MGate.goLesson) window.MGate.goLesson(Q.mods[i+1]?Q.mods[i+1].v:null); });
  }
  /* วาดกล่องสอบทุกกล่องที่อยู่ใน root */
  function mount(root){ (root||document).querySelectorAll(".mq[data-mq]").forEach(el=>{ if(!el.dataset.on){ el.dataset.on=1; } render(el); }); }
  /* ดูหัวข้อครบแล้ว: วาดกล่องสอบของโมดูลนั้นใหม่ (ถ้ายังไม่ได้เริ่มสอบ) */
  document.addEventListener("seen-change", e=>{ const sc=e.detail&&e.detail.scope;
    document.querySelectorAll(".mq[data-mq]").forEach(el=>{ if(el.dataset.mq===sc && !(state[sc]&&state[sc].qs)) render(el); }); });

  window.MGate={ locked, guard, decorate, mount, boxHTML, passed, frontier, lockMsg, toast, mods:Q.mods, label };
})();
