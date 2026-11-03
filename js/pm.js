/* ===== โมดูล 4: การทดสอบหลังซ่อม / PM ===== */
(function(){
  const D = window.PM;
  const root = document.getElementById("pm");
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const rnd = (a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
  const r1 = x=>Math.round(x*10)/10, r2=x=>Math.round(x*100)/100;
  let cur = "flow";

  /* ---------- โจทย์ฝึก: สร้างแบบสุ่ม ---------- */
  const GEN = {
    flow(){
      const rate=pick([25,50,100,125,200]), min=pick([30,60]), exp=rate*min/60, err=r1(rnd(-9,9));
      const mass=r2(exp*(1+err/100)), real=r1((mass-exp)/exp*100), pass=Math.abs(real)<=5;
      return {q:`ตั้งอัตรา ${rate} mL/h เดินเครื่อง ${min} นาที ชั่งน้ำได้ ${mass} g (น้ำ 1.00 g/mL) ค่าคลาดเคลื่อนกี่ % และผ่านเกณฑ์ ±5% หรือไม่`,
        num:{label:"ค่าคลาดเคลื่อน (%)", ans:real, tol:0.3}, pass,
        ex:`ปริมาตรที่ควรได้ = ${rate} × ${min} ÷ 60 = ${r1(exp)} mL · วัดได้ ${mass} mL · คลาดเคลื่อน = (${mass} − ${r1(exp)}) ÷ ${r1(exp)} × 100 = ${real}% → ${pass?"ผ่าน":"ไม่ผ่าน"}`};
    },
    occ(){
      const s=pick(D.find(x=>x.id==="occ").spec), inside=Math.random()<.55;
      const v=Math.round(inside?rnd(s.min+10,s.max-10):(Math.random()<.5?rnd(s.min-140,s.min-15):rnd(s.max+15,s.max+160)));
      const pass=v>=s.min&&v<=s.max;
      return {q:`ตั้งระดับ ${s.l} (สเปกตัวอย่าง ${s.min}–${s.max} mmHg) alarm ดังที่ ${v} mmHg ผ่านหรือไม่`, pass,
        ex:`${v} mmHg ${pass?"อยู่ใน":"อยู่นอก"}ช่วง ${s.min}–${s.max} mmHg → ${pass?"ผ่าน":"ไม่ผ่าน"}${!pass&&v<s.min?" (ดังเร็วเกินไป มักเกิดจากค่าสอบเทียบเลื่อน)":!pass?" (ดังช้าเกินไป อันตรายต่อผู้ป่วยมากกว่า)":""}`};
    },
    air(){
      const th=pick([30,50,75,100]), cases=[
        {s:`ฉีดฟอง ${th+20} µL (เกณฑ์ตรวจจับ ${th} µL) เครื่องหยุดและ alarm`, p:true},
        {s:`ฉีดฟอง ${th+20} µL (เกณฑ์ตรวจจับ ${th} µL) ฟองผ่าน sensor ไปโดยไม่มี alarm`, p:false},
        {s:`เดินเครื่องด้วยสายเต็มน้ำ 30 นาที ขึ้น Air in line 2 ครั้ง ทั้งที่ไม่มีฟอง`, p:false},
        {s:`เดินเครื่องด้วยสายเต็มน้ำ 30 นาที ไม่มี alarm และฉีดฟองถึงเกณฑ์แล้ว alarm ดังทุกครั้ง`, p:true}];
      const c=pick(cases);
      return {q:c.s+" ผลการทดสอบนี้ผ่านหรือไม่", pass:c.p,
        ex:c.p?"ผ่าน เครื่องตรวจจับฟองที่ถึงเกณฑ์ได้ และไม่มี alarm หลอก":"ไม่ผ่าน "+(c.s.includes("ไม่มี alarm")&&c.s.includes("ผ่าน sensor")?"ฟองที่ถึงเกณฑ์หลุดไปถึงผู้ป่วยได้ อันตรายมาก":"มี alarm หลอก ต้องหาสาเหตุ เช่น ทำความสะอาด sensor")};
    },
    esa(){
      const t=pick(["pe","eq","ap"]);
      if(t==="pe"){ const v=r2(pick([rnd(0.05,0.28),rnd(0.32,0.9)])), p=v<=0.3;
        return {q:`เครื่อง Class I ความต้านทานสายดิน (รวมสายไฟ) วัดได้ ${v} Ω ผ่านเกณฑ์ IEC 62353 หรือไม่`, pass:p, ex:`เกณฑ์ ≤ 0.3 Ω → ${p?"ผ่าน":"ไม่ผ่าน ตรวจสายไฟ ขาปลั๊ก และจุดต่อสายดินภายใน"}`}; }
      if(t==="eq"){ const m=pick(["direct","alternative"]), lim=m==="direct"?500:1000, v=Math.round(pick([rnd(40,lim*0.8),rnd(lim*1.05,lim*1.6)])), p=v<=lim;
        return {q:`เครื่อง Class I วัด equipment leakage ด้วยวิธี ${m} ได้ ${v} µA ผ่านหรือไม่`, pass:p, ex:`เกณฑ์วิธี ${m} = ≤ ${lim} µA → ${p?"ผ่าน":"ไม่ผ่าน"}`}; }
      const ty=pick(["BF","CF"]), lim=ty==="BF"?5000:50, v=Math.round(pick([rnd(lim*0.05,lim*0.8),rnd(lim*1.1,lim*1.8)])), p=v<=lim;
      return {q:`applied part ชนิด ${ty} วัด applied part leakage ได้ ${v} µA ผ่านหรือไม่`, pass:p, ex:`เกณฑ์ Type ${ty} = ≤ ${lim} µA → ${p?"ผ่าน":"ไม่ผ่าน"}${ty==="CF"?" (CF มีเกณฑ์เข้มที่สุด เพราะอาจสัมผัสหัวใจโดยตรง)":""}`};
    },
    func(){
      const c=pick([
        {s:"ทุก alarm ทำงาน แต่เสียง alarm เบามากจนแทบไม่ได้ยินในห้องผู้ป่วย",p:false,e:"ไม่ผ่าน alarm ที่ไม่ได้ยินเท่ากับไม่มี alarm"},
        {s:"ถอดปลั๊กแล้วเครื่องสลับไปใช้แบตและแจ้ง AC power lost ทุก alarm ดังชัดเจน",p:true,e:"ผ่าน"},
        {s:"ปุ่มลดอัตราไหลต้องกด 2–3 ครั้งจึงจะติด แต่ปุ่มอื่นปกติ",p:false,e:"ไม่ผ่าน ปุ่มที่ทำงานไม่แน่นอนทำให้ตั้งค่าผิดได้ ต้องซ่อมก่อน"},
        {s:"เปิดฝาระหว่างเดินเครื่อง เครื่องหยุดและขึ้น Door open ทันที",p:true,e:"ผ่าน"}]);
      return {q:c.s+" ผ่านหรือไม่", pass:c.p, ex:c.e};
    }
  };

  function practice(id){
    const box=root.querySelector("#pm-pr"), N=5; let i=0, ok=0, q=null, step=0;
    function next(){
      if(i>=N){ box.innerHTML=`<div class="score ${ok>=4?"ok":ok>=3?"mid":"bad"}"><div class="big">${ok}/${N}</div><div>ตอบถูก</div></div><div class="tools"><button class="primary" id="pr-again">ฝึกอีกชุด</button></div>`;
        window.Score&&Score.record({key:"pm:"+id, mod:"4-ทดสอบ/PM", item:"ฝึกตัดสินผล: "+D.find(x=>x.id===id).n, score:ok, max:N});
        box.querySelector("#pr-again").onclick=()=>practice(id); return; }
      q=GEN[id](); step=q.num?0:1; draw();
    }
    function draw(fb){
      box.innerHTML=`<div class="kicker">ข้อ ${i+1} / ${N}</div><p class="pq">${esc(q.q)}</p>
        ${q.num?`<label class="nlab">${esc(q.num.label)}<input id="pr-n" type="number" step="0.1" inputmode="decimal" ${step>0?"disabled":""}></label>`:""}
        ${step===0?`<div class="tools"><button class="primary" id="pr-c">ตรวจตัวเลข</button></div>`:
          `<div class="tools"><button class="pf" data-v="1">✓ ผ่าน</button><button class="pf" data-v="0">✗ ไม่ผ่าน</button></div>`}
        <div id="pr-fb">${fb||""}</div>`;
      const c=box.querySelector("#pr-c");
      if(c) c.onclick=()=>{ const v=parseFloat(box.querySelector("#pr-n").value);
        if(isNaN(v)){ box.querySelector("#pr-fb").innerHTML=`<div class="msg bad">กรอกตัวเลขก่อน</div>`; return; }
        q.numOk=Math.abs(v-q.num.ans)<=q.num.tol; step=1;
        draw(`<div class="msg ${q.numOk?"ok":"bad"}">${q.numOk?"ตัวเลขถูกต้อง":"ยังไม่ถูก คำตอบคือ "+q.num.ans+"%"} · ต่อไปตัดสินว่าผ่านหรือไม่</div>`);
        box.querySelector("#pr-n").value=v; };
      box.querySelectorAll(".pf").forEach(b=>b.onclick=()=>{
        const good=(b.dataset.v==="1")===q.pass && (q.num?q.numOk:true);
        if(good) ok++;
        box.querySelectorAll(".pf").forEach(x=>x.disabled=true);
        box.querySelector("#pr-fb").innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง":"✗ ยังไม่ถูก"}</b><p>${esc(q.ex)}</p><button class="primary" id="pr-nx">${i+1<N?"ข้อต่อไป →":"ดูผล"}</button></div>`;
        box.querySelector("#pr-nx").onclick=()=>{i++;next();};
      });
    }
    next();
  }

  /* ---------- เครื่องคำนวณ ---------- */
  function calc(id){
    if(id==="flow") return `<div class="calc"><h3>เครื่องคำนวณ</h3>
      <div class="cgrid"><label>อัตราที่ตั้ง (mL/h)<input id="c-r" type="number" value="100" inputmode="decimal"></label>
      <label>เวลา (นาที)<input id="c-t" type="number" value="60" inputmode="decimal"></label>
      <label>น้ำหนักที่ชั่งได้ (g)<input id="c-m" type="number" value="98.2" step="0.01" inputmode="decimal"></label>
      <label>ความหนาแน่น (g/mL)<input id="c-d" type="number" value="1.00" step="0.001" inputmode="decimal"></label>
      <label>เกณฑ์ ± (%)<input id="c-s" type="number" value="5" step="0.5" inputmode="decimal"></label></div><div id="c-o" class="cout"></div></div>`;
    if(id==="occ") return `<div class="calc"><h3>เครื่องตัดสินผล</h3>
      <div class="cgrid"><label>ค่าต่ำสุดตามสเปก (mmHg)<input id="c-a" type="number" value="600"></label>
      <label>ค่าสูงสุดตามสเปก (mmHg)<input id="c-b" type="number" value="900"></label>
      <label>แรงดันขณะ alarm (mmHg)<input id="c-v" type="number" value="735"></label></div><div id="c-o" class="cout"></div>
      <p class="muted small">${esc(D.find(x=>x.id==="occ").specNote)}: ${D.find(x=>x.id==="occ").spec.map(s=>`${s.l} ${s.min}–${s.max}`).join(" · ")} mmHg · 1 kPa ≈ 7.5 mmHg</p></div>`;
    return "";
  }
  function bindCalc(id){
    const $=s=>root.querySelector(s), o=$("#c-o"); if(!o) return;
    const run=()=>{
      if(id==="flow"){ const r=+$("#c-r").value,t=+$("#c-t").value,m=+$("#c-m").value,d=+$("#c-d").value||1,s=+$("#c-s").value;
        const e=r*t/60, v=m/d, er=e?(v-e)/e*100:0, p=Math.abs(er)<=s;
        o.innerHTML=`ควรได้ <b>${r2(e)} mL</b> · วัดได้ <b>${r2(v)} mL</b> · คลาดเคลื่อน <b>${er>=0?"+":""}${r2(er)}%</b> <span class="pfb ${p?"ok":"bad"}">${p?"ผ่าน":"ไม่ผ่าน"}</span>`; }
      if(id==="occ"){ const a=+$("#c-a").value,b=+$("#c-b").value,v=+$("#c-v").value,p=v>=a&&v<=b;
        o.innerHTML=`${v} mmHg (≈ ${r1(v/7.5)} kPa) <span class="pfb ${p?"ok":"bad"}">${p?"ผ่าน":"ไม่ผ่าน"}</span>${!p&&v<a?" ดังเร็วเกินไป":!p?" ดังช้าเกินไป":""}`; }
    };
    root.querySelectorAll(".calc input").forEach(i=>i.addEventListener("input",run)); run();
  }

  /* ---------- แบบบันทึกผล PM ---------- */
  function form(){
    return `<details class="grp"><summary>แบบบันทึกผลการทดสอบ (คัดลอกไปใช้ได้)</summary><div class="acts" style="display:block">
      <div class="cgrid"><label>เลขครุภัณฑ์<input id="f-id"></label><label>ยี่ห้อ/รุ่น<input id="f-md"></label><label>หน่วยงาน<input id="f-w"></label><label>ผู้ทดสอบ<input id="f-by"></label></div>
      ${D.map(t=>`<label class="fchk"><span>${esc(t.n)}</span><select data-t="${t.id}"><option value="">ไม่ได้ทำ</option><option>ผ่าน</option><option>ไม่ผ่าน</option></select><input data-v="${t.id}" placeholder="ค่าที่วัดได้"></label>`).join("")}
      <div class="tools"><button class="primary" id="f-cp">สร้างข้อความบันทึก</button></div><div id="f-o"></div></div></details>`;
  }
  function bindForm(){
    const b=root.querySelector("#f-cp"); if(!b) return;
    b.onclick=async()=>{
      const v=s=>root.querySelector(s).value.trim();
      const rows=D.map(t=>{const r=root.querySelector(`[data-t="${t.id}"]`).value, m=root.querySelector(`[data-v="${t.id}"]`).value.trim(); return r?`- ${t.n}: ${r}${m?" ("+m+")":""}`:null;}).filter(Boolean);
      const all=rows.length&&rows.every(r=>r.includes(": ผ่าน"));
      const txt=`บันทึกการทดสอบ Infusion pump\nวันที่: ${new Date().toLocaleDateString("th-TH")}\nเลขครุภัณฑ์: ${v("#f-id")||"-"} · รุ่น: ${v("#f-md")||"-"} · หน่วยงาน: ${v("#f-w")||"-"}\n${rows.join("\n")||"- ยังไม่ได้เลือกผล"}\nสรุป: ${all?"ผ่าน พร้อมใช้งาน":"ไม่ผ่าน/ไม่ครบ ห้ามใช้งาน"}\nผู้ทดสอบ: ${v("#f-by")||"-"}`;
      const ta=document.createElement("textarea"); ta.className="copybox"; ta.value=txt; root.querySelector("#f-o").replaceChildren(ta);
      try{ await navigator.clipboard.writeText(txt); b.textContent="คัดลอกแล้ว ✓"; }catch(e){ ta.select(); }
    };
  }

  function render(){
    const t=D.find(x=>x.id===cur);
    root.innerHTML=`<h1>การทดสอบหลังซ่อม / PM</h1>
      <p class="muted">ทุกงานซ่อมต้องจบด้วยการทดสอบที่ตรงกับสิ่งที่ซ่อม ก่อนส่งเครื่องกลับไปใช้กับผู้ป่วย เลือกหัวข้อการทดสอบ อ่านขั้นตอน แล้วฝึกตัดสินผลจากโจทย์สุ่ม</p>
      <div class="chips pmtabs">${D.map(x=>`<button data-id="${x.id}" class="${x.id===cur?"on":""}">${esc(x.n)}</button>`).join("")}</div>
      <div class="pmgrid">
        <div>
          <h2>${esc(t.th)}</h2><p>${esc(t.why)}</p>
          <h3>อุปกรณ์</h3><ul>${t.tools.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
          <h3>ขั้นตอน</h3><ol>${t.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
          ${t.limits?`<h3>เกณฑ์ IEC 62353 (ค่าสูงสุดที่ยอมรับ)</h3><table class="lim">${t.limits.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>`:""}
          <div class="formula">${esc(t.formula).replace(/\n/g,"<br>")}</div>
          <h3>ข้อควรระวัง</h3><ul>${t.tips.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
          ${calc(cur)}
        </div>
        <aside class="logbox"><h2>ฝึกตัดสินผล</h2><div id="pm-pr"></div></aside>
      </div>
      ${form()}`;
    root.querySelectorAll(".pmtabs button").forEach(b=>b.onclick=()=>{cur=b.dataset.id;render();});
    bindCalc(cur); bindForm(); practice(cur);
  }

  window.Views=window.Views||{}; window.Views.pm={show:()=>{ if(!root.innerHTML) render(); }};
})();
