/* ===== วิชาคลินิก: การใช้เครื่องควบคุมการให้สารละลายอย่างปลอดภัย =====
   หน้าแรก · บทเรียน (บันทึก read:<id>) · ฝึกคำนวณ (calc ไม่นับเกณฑ์) · เครื่องจำลอง (csim) · แบบทดสอบ (../js/quiz.js) · ผลของฉัน (../js/score.js)
   เกณฑ์ผ่าน: อ่านครบ 9 บท + เครื่องจำลอง ≥ 80% + แบบทดสอบ ≥ 80% */
(function(){
  const C=window.APP_CONFIG||{}, CR=C.criteria||{}, L=window.LESSONS, S=window.CSIM;
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const pick=a=>a[Math.floor(Math.random()*a.length)], r1=x=>Math.round(x*10)/10, fmt=n=>n.toLocaleString("th-TH",{maximumFractionDigits:2});
  const has=k=>!!(window.Score&&Score.has(k));
  const bestPct=k=>{ const b=window.Score&&Score.bestOf(k); return b?Math.round(b.v*100):0; };
  const readCount=()=>L.filter(x=>has("read:"+x.id)).length;
  const NO=S.orders.length, NS=S.scenarios.length, MAX=NO+NS*3;

  /* ---------- เกณฑ์สำหรับใบรับรองในแอป (../js/cert.js เรียกใช้) ---------- */
  window.CertProgress=function(hist){
    const read=new Set(); let sim=0, quiz=0;
    hist.forEach(h=>{ const k=h.key||"", p=h.max?Math.round(h.score/h.max*100):0;
      if(k.startsWith("read:")) read.add(k); if(k==="csim") sim=Math.max(sim,p); if(k==="quiz") quiz=Math.max(quiz,p); });
    const items=[
      {n:`อ่านบทเรียนครบ ${CR.readLessons} บท`, v:`${read.size}/${CR.readLessons}`, ok:read.size>=CR.readLessons},
      {n:`เครื่องจำลอง ≥ ${CR.simPct}%`, v:`ดีที่สุด ${sim}%`, ok:sim>=CR.simPct},
      {n:`แบบทดสอบ ≥ ${CR.quizPct}%`, v:`ดีที่สุด ${quiz}%`, ok:quiz>=CR.quizPct}];
    return {items, pass:items.every(i=>i.ok), line:`บทเรียน ${read.size} บท  ·  เครื่องจำลอง ${sim}%  ·  แบบทดสอบ ${quiz}%`};
  };

  /* ---------- หน้าแรก ---------- */
  function home(){
    const r=readCount(), s=bestPct("csim"), q=bestPct("quiz");
    const st=(ok,t)=>`<span class="tp ${ok?"ok":""}">${ok?"✓":"○"} ${t}</span>`;
    document.getElementById("home-prog").innerHTML=`<div class="tstat"><b>ความคืบหน้า</b>${st(r>=CR.readLessons,`บทเรียน ${r}/${CR.readLessons}`)}${st(s>=CR.simPct,`เครื่องจำลอง ${s}%`)}${st(q>=CR.quizPct,`แบบทดสอบ ${q}%`)}</div>`;
  }

  /* ---------- บทเรียน ---------- */
  let cur=L[0].id;
  function block([t,c]){
    if(t==="p") return `<p>${c}</p>`;
    if(t==="ul") return `<ul>${c.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    if(t==="ol") return `<ol>${c.map(x=>`<li>${x}</li>`).join("")}</ol>`;
    if(t==="tbl") return `<div class="tblwrap"><table class="ltbl"><thead><tr>${c.h.map(h=>`<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${c.r.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if(t==="f") return `<div class="formula">${esc(c).replace(/\n/g,"<br>")}</div>`;
    if(t==="ex") return `<div class="exbox"><b>ตัวอย่าง</b><br>${esc(c).replace(/\n/g,"<br>")}</div>`;
    if(t==="path") return `<div class="lpath" aria-label="เส้นทางของสารละลาย">${c.map((x,i)=>`${i?'<span aria-hidden="true">→</span>':""}<b class="${i===0||i===c.length-1?"end":""}">${esc(x)}</b>`).join("")}</div>`;
    if(t==="basic") return `<div class="box basic"><b>พื้นฐาน</b><p>${c}</p></div>`;
    if(t==="field") return `<div class="box field"><b>หน้างาน</b><p>${c}</p></div>`;
    if(t==="tip") return `<div class="hint">💡 ${c}</div>`;
    if(t==="warn") return `<div class="msg bad">⚠️ ${c}</div>`;
    return "";
  }
  function lessons(){
    const root=document.getElementById("lessons"), X=L.find(x=>x.id===cur), i=L.indexOf(X), done=has("read:"+X.id);
    root.innerHTML=`<h1>บทเรียน</h1>
      <p class="muted">อ่านแต่ละบทจนจบ แล้วกด "อ่านจบแล้ว" ต้องอ่านครบ ${CR.readLessons} บทจึงผ่านเกณฑ์ (อ่านแล้ว ${readCount()}/${L.length})</p>
      <div class="clgrid">
        <nav class="clnav" aria-label="รายการบทเรียน">${L.map(x=>`<button data-l="${x.id}" class="${x.id===cur?"on":""}">${has("read:"+x.id)?"✓ ":""}${esc(x.n)}</button>`).join("")}</nav>
        <article class="lesson"><h2>${esc(X.n)}</h2>${X.b.map(block).join("")}
          <div class="srcs"><b>แหล่งอ้างอิง</b><ul>${X.src.map(([n,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("")}</ul></div>
          <div class="tools">${done?`<span class="tp ok">✓ อ่านจบแล้ว</span>`:`<button class="primary" id="ls-done">อ่านจบแล้ว</button>`}
            ${i<L.length-1?`<button data-go="${L[i+1].id}">${esc(L[i+1].n)} ▶</button>`:`<a class="btn" href="#sim">ไปเครื่องจำลอง ▶</a>`}</div>
        </article></div>`;
    root.querySelectorAll("[data-l],[data-go]").forEach(b=>b.onclick=()=>{ cur=b.dataset.l||b.dataset.go; lessons(); (window.innerWidth<900?root.querySelector(".lesson"):root).scrollIntoView({behavior:"smooth"}); });
    const d=root.querySelector("#ls-done");
    if(d) d.onclick=async()=>{ d.disabled=true; await Score.record({key:"read:"+X.id, mod:"บทเรียน", item:X.n, score:1, max:1}); lessons(); };
  }

  /* ---------- ฝึกคำนวณ (สุ่มโจทย์ ไม่นับเกณฑ์) ---------- */
  const GEN=[
    ()=>{ const v=pick([500,1000,250,100]), h=pick([4,5,6,8,10,12,24]); const a=r1(v/h);
      return {q:`สารน้ำ ${fmt(v)} mL ให้ใน ${h} ชั่วโมง ตั้ง RATE กี่ mL/h`, a, ex:`${fmt(v)} ÷ ${h} = ${a} mL/h`}; },
    ()=>{ const kg=pick([0.8,1.2,2.5,3,3.5,4]), d=pick([2,3,4,5,6]); const a=r1(kg*d);
      return {q:`ทารก ${kg} kg สารน้ำ ${d} mL/kg/h ตั้ง RATE กี่ mL/h`, a, ex:`${d} × ${kg} = ${a} mL/h`}; },
    ()=>{ const mg=pick([50,100,200]), vol=pick([50,100,250]), dose=pick([1,2,3,5,8,10]); const c=mg/vol, a=r1(dose/c);
      return {q:`ยา ${mg} mg ใน ${vol} mL สั่ง ${dose} mg/h ตั้ง RATE กี่ mL/h`, a, ex:`ความเข้มข้น ${mg} ÷ ${vol} = ${fmt(c)} mg/mL · ${dose} ÷ ${fmt(c)} = ${a} mL/h`}; },
    ()=>{ const u=pick([10000,25000,50000]), vol=pick([250,500]), dose=pick([500,800,1000,1200,1500]); const c=u/vol, a=r1(dose/c);
      return {q:`ยา ${fmt(u)} units ใน ${vol} mL สั่ง ${fmt(dose)} units/h ตั้ง RATE กี่ mL/h`, a, ex:`ความเข้มข้น ${fmt(u)} ÷ ${vol} = ${fmt(c)} units/mL · ${fmt(dose)} ÷ ${fmt(c)} = ${a} mL/h`}; },
    ()=>{ const mg=pick([200,400,800]), vol=pick([250,500]), kg=pick([50,60,70,80]), d=pick([2,3,5,8,10]); const mcg=mg*1000/vol, a=r1(d*kg*60/mcg);
      return {q:`ผู้ป่วย ${kg} kg ยา ${mg} mg ใน ${vol} mL สั่ง ${d} mcg/kg/min ตั้ง RATE กี่ mL/h (ทศนิยม 1 ตำแหน่ง)`, a, ex:`ความเข้มข้น ${mg} × 1,000 ÷ ${vol} = ${fmt(mcg)} mcg/mL · ${d} × ${kg} × 60 ÷ ${fmt(mcg)} = ${a} mL/h`}; },
    ()=>{ const v=pick([250,500,1000]), r=pick([40,50,60,80,100,125]); const h=v/r, a=r1(h);
      return {q:`ตั้ง VTBI ${fmt(v)} mL ที่ RATE ${r} mL/h จะใช้เวลากี่ชั่วโมง (ทศนิยม 1 ตำแหน่ง)`, a, ex:`${fmt(v)} ÷ ${r} = ${fmt(h)} ชม. ≈ ${a} ชม.`, unit:"ชม."}; }
  ];
  function calc(){
    const root=document.getElementById("calc"), calcL=L.find(x=>x.id==="calc"), f=calcL&&calcL.b.find(b=>b[0]==="f");
    root.innerHTML=`<h1>ฝึกคำนวณ</h1>
      <div class="pmgrid"><div><p class="muted">โจทย์สุ่ม 6 ข้อ ครอบคลุมสูตรในบทที่ 3 ตอบเป็นทศนิยม 1 ตำแหน่ง ยอมรับคลาดเคลื่อน ±0.1 ฝึกซ้ำได้ไม่จำกัด ไม่นับเป็นเกณฑ์ผ่าน</p><div id="cc"></div></div>
      <aside class="logbox"><h2>สูตร</h2>${f?block(f):""}</aside></div>`;
    const box=root.querySelector("#cc"), N=6, qs=shuffle(GEN).map(g=>g()); let i=0, ok=0;
    function draw(){
      if(i>=N){ box.innerHTML=`<div class="score ${ok>=5?"ok":ok>=4?"mid":"bad"}"><div class="big">${ok}/${N}</div><div>ตอบถูก</div></div><div class="tools"><button class="primary" id="cc-a">ฝึกอีกชุด</button></div>`;
        window.Score&&Score.record({key:"calc", mod:"ฝึกคำนวณ", item:"ฝึกคำนวณอัตราไหล", score:ok, max:N});
        box.querySelector("#cc-a").onclick=calc; return; }
      const q=qs[i];
      box.innerHTML=`<div class="kicker">ข้อ ${i+1} / ${N}</div><p class="pq">${esc(q.q)}</p>
        <label class="nlab">คำตอบ (${q.unit||"mL/h"})<input id="cc-v" type="number" step="0.1" inputmode="decimal"></label>
        <div class="tools"><button class="primary" id="cc-c">ตรวจคำตอบ</button></div><div id="cc-f"></div>`;
      const inp=box.querySelector("#cc-v");
      const check=()=>{ const v=parseFloat(inp.value); if(isNaN(v)) return;
        const good=Math.abs(v-q.a)<=0.1001; if(good) ok++;
        const ten = !good && (Math.abs(v-q.a*10)<0.2 || Math.abs(v*10-q.a)<0.2);
        inp.disabled=true; box.querySelector("#cc-c").remove();
        box.querySelector("#cc-f").innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง":"✗ ยังไม่ถูก คำตอบคือ "+q.a}</b>
          <p>${esc(q.ex)}</p>${ten?`<p><b>ระวัง:</b> คำตอบของคุณต่างจากคำตอบที่ถูก 10 เท่า เป็นความผิดพลาดแบบทศนิยมผิดตำแหน่ง ซึ่งอันตรายมากในงานจริง</p>`:""}
          <button class="primary" id="cc-n">${i+1<N?"ข้อต่อไป →":"ดูผล"}</button></div>`;
        box.querySelector("#cc-n").onclick=()=>{i++;draw();}; };
      box.querySelector("#cc-c").onclick=check;
      inp.onkeydown=e=>{ if(e.key==="Enter") check(); };
    }
    draw();
  }

  /* ---------- เครื่องจำลอง ---------- */
  let run=null;   // {part:"o"|"s", oi, ores:[], si, step, pts:[[...]], saved}
  const dots=()=>`<div class="simdots">${S.orders.map((o,k)=>`<i class="${run.ores[k]===true?"ok":run.ores[k]===false?"bad":run.part==="o"&&k===run.oi?"on":""}"></i>`).join("")}<span class="dsep"></span>${S.scenarios.map((s,k)=>{ const p=run.pts[k], sum=p.reduce((a,b)=>a+b,0), done=p.length===3; return `<i class="${done?(sum===3?"ok":"bad"):run.part==="s"&&k===run.si?"on":""}"></i>`; }).join("")}</div>`;
  function simIntro(){
    const root=document.getElementById("sim"), b=bestPct("csim");
    root.innerHTML=`<h1>เครื่องจำลอง</h1>
      <p class="muted">มี 2 ส่วน รวม ${MAX} คะแนน ต้องได้ ≥ ${CR.simPct}%</p>
      <div class="note small" style="margin:0 0 12px">⚠️ ${esc(S.disclaimer)}</div>
      ${b?`<p class="hint">คะแนนดีที่สุดของคุณ: ${b}%</p>`:""}
      <h3>ส่วน ก · ตั้งเครื่องตามคำสั่ง (${NO} ข้อ ข้อละ 1 คะแนน)</h3>
      <p class="small muted">คำนวณแล้วกดตั้ง RATE, VTBI และระดับ occlusion บนแผงปุ่มจำลอง นับคะแนนจากครั้งแรกที่กดยืนยัน</p>
      <ol class="recap">${S.orders.map(o=>`<li><b>${esc(o.n)}</b><span>${esc(o.order)}</span></li>`).join("")}</ol>
      <h3>ส่วน ข · สถานการณ์ (${NS} เรื่อง เรื่องละ 3 ขั้น ขั้นละ 1 คะแนน)</h3>
      <ol class="recap">${S.scenarios.map(s=>`<li><b>${esc(s.n)}</b><span>ทบทวน: ${esc(s.lessons)}</span></li>`).join("")}</ol>
      <div class="tools"><button class="primary" id="sm-go">เริ่มเครื่องจำลอง</button></div>`;
    root.querySelector("#sm-go").onclick=()=>{ run={part:"o", oi:0, ores:[], si:0, step:0, pts:S.scenarios.map(()=>[])}; orderStep(); window.scrollTo(0,0); };
  }

  /* ส่วน ก: แผงปุ่มจำลอง */
  function orderStep(){
    const root=document.getElementById("sim"), O=S.orders[run.oi];
    const st={field:"rate", buf:"", rate:null, vtbi:null, occ:"M"};
    root.innerHTML=`<div class="simtop"><span class="kicker">ส่วน ก · ข้อ ${run.oi+1} / ${NO} · ${esc(O.n)}</span>${dots()}</div>
      <div class="pmgrid">
        <div>
          <div class="order"><div class="tk-h"><span>📋 คำสั่งการรักษา</span>${O.ha?`<span class="lv lv3">ยาความเสี่ยงสูง</span>`:""}</div><p>${esc(O.order)}</p></div>
          <div class="pumpface">
            <div class="lcd" id="lcd"></div>
            <div class="pkeys">
              <div class="fkeys"><button data-f="rate">RATE</button><button data-f="vtbi">VTBI</button><button data-f="occ">OCCL</button></div>
              <div class="numpad">${["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k=>`<button data-k="${k}">${k}</button>`).join("")}</div>
              <div class="ckeys"><button data-c="up">▲</button><button data-c="down">▼</button><button data-c="clr">CLR</button><button class="startk" data-c="start">START</button></div>
            </div>
          </div>
          <p class="muted small">วิธีใช้: กด RATE หรือ VTBI เพื่อเลือกช่อง แล้วกดตัวเลข · กด OCCL แล้วใช้ ▲▼ เปลี่ยนระดับ · CLR ล้างช่องที่เลือก · ตั้งครบแล้วกด START</p>
        </div>
        <aside class="logbox" id="sim-side"><h2>ช่วยคิด</h2>
          <p class="small muted">จดการคำนวณได้ที่นี่ก่อนกดเครื่อง (ไม่บันทึก)</p><textarea id="scratch" rows="5" placeholder="เช่น 1000 ÷ 8 = ..."></textarea>
          <div class="hint small">ตรวจหน่วยและตำแหน่งทศนิยมทุกครั้ง · ทารกและอัตราต่ำใช้ occlusion ต่ำ</div></aside>
      </div>`;
    const lcd=root.querySelector("#lcd");
    const val=f=> st.field===f && st.buf!=="" ? st.buf : (st[f]===null?"---":String(st[f]));
    const time=()=>{ if(!st.rate||!st.vtbi) return "--:--"; const m=Math.round(st.vtbi/st.rate*60); return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`; };
    function paint(){
      lcd.innerHTML=`<div class="lrow ${st.field==="rate"?"sel":""}"><span>RATE</span><b>${val("rate")}</b><small>mL/h</small></div>
        <div class="lrow ${st.field==="vtbi"?"sel":""}"><span>VTBI</span><b>${val("vtbi")}</b><small>mL</small></div>
        <div class="lrow"><span>TIME</span><b>${time()}</b><small>h:min</small></div>
        <div class="lrow ${st.field==="occ"?"sel":""}"><span>OCCL</span><b>${st.occ}</b><small>${{L:"ต่ำ",M:"กลาง",H:"สูง"}[st.occ]}</small></div>`;
    }
    function commit(){ if(st.field!=="occ" && st.buf!==""){ const v=parseFloat(st.buf); st[st.field]=isNaN(v)?null:v; } st.buf=""; }
    root.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{ commit(); st.field=b.dataset.f; paint(); });
    root.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
      if(st.field==="occ") return;
      const k=b.dataset.k;
      if(k==="⌫"){ st.buf=st.buf.slice(0,-1); paint(); return; }
      if(k==="." && (st.buf.includes(".")||st.field==="vtbi")) return;
      if(st.buf.includes(".") && st.buf.split(".")[1].length>=1) return;
      if(st.buf.replace(".","").length>=4) return;
      st.buf += (k==="." && st.buf==="") ? "0." : k; paint();
    });
    root.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{
      const c=b.dataset.c, lv=["L","M","H"];
      if(c==="up"||c==="down"){ if(st.field==="occ"){ const i=lv.indexOf(st.occ); st.occ=lv[Math.max(0,Math.min(2,i+(c==="up"?1:-1)))]; paint(); } return; }
      if(c==="clr"){ if(st.field!=="occ"){ st.buf=""; st[st.field]=null; } paint(); return; }
      if(c==="start"){ commit(); paint(); confirmBox(); }
    });
    function confirmBox(){
      if(st.rate===null||st.vtbi===null){ window.Score&&Score.toast("ตั้ง RATE และ VTBI ให้ครบก่อน"); return; }
      const d=document.createElement("div"); d.className="modal";
      d.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><h2>ตรวจทานก่อนเริ่ม</h2>
        <p class="muted small">เครื่องจริงจะแสดงหน้านี้ให้อ่านทวนทุกค่าเทียบกับคำสั่งการรักษา${O.ha?" · <b>ยาความเสี่ยงสูง: ให้อีกคนตรวจซ้ำอย่างอิสระ</b>":""}</p>
        <div class="lcd small-lcd"><div class="lrow"><span>RATE</span><b>${st.rate}</b><small>mL/h</small></div><div class="lrow"><span>VTBI</span><b>${st.vtbi}</b><small>mL</small></div><div class="lrow"><span>TIME</span><b>${time()}</b><small>h:min</small></div><div class="lrow"><span>OCCL</span><b>${st.occ}</b><small></small></div></div>
        <p class="small">${esc(O.order)}</p>
        <div class="tools"><button class="ghost" id="cf-n">กลับไปแก้</button><button class="primary" id="cf-y">ยืนยันและเริ่ม</button></div></div>`;
      document.body.appendChild(d);
      d.querySelector("#cf-n").onclick=()=>d.remove();
      d.querySelector("#cf-y").onclick=()=>{ d.remove(); grade(); };
    }
    function grade(){
      const okR=Math.abs(st.rate-O.rate)<=O.tol+1e-9, okV=Math.abs(st.vtbi-O.vtbi)<0.5, okO=O.occ.includes(st.occ), all=okR&&okV&&okO;
      const ten=!okR && (Math.abs(st.rate-O.rate*10)<1 || Math.abs(st.rate*10-O.rate)<1);
      if(run.ores[run.oi]===undefined) run.ores[run.oi]=all;
      const side=root.querySelector("#sim-side"), last=run.oi===NO-1;
      side.innerHTML=`<h2>${all?"✓ ตั้งค่าถูกต้อง":"✗ ยังมีค่าที่ไม่ถูก"}</h2>
        <ul class="gl"><li class="${okR?"ok":"bad"}">RATE ${st.rate} mL/h ${okR?"✓":"✗ ควรเป็น "+O.rate}</li>
        <li class="${okV?"ok":"bad"}">VTBI ${st.vtbi} mL ${okV?"✓":"✗ ควรเป็น "+O.vtbi}</li>
        <li class="${okO?"ok":"bad"}">OCCL ${st.occ} ${okO?"✓":"✗ ควรเป็น "+O.occ.join(" หรือ ")}</li></ul>
        ${ten?`<div class="msg bad">RATE ต่างจากค่าที่ถูก 10 เท่า: ความผิดพลาดแบบทศนิยมผิดตำแหน่ง ในงานจริงผู้ป่วยจะได้ยามากหรือน้อยเกินไป 10 เท่า</div>`:""}
        <div class="exbox"><b>เฉลย</b><br>${esc(O.why)}</div>
        <p class="small muted">นับคะแนนจากครั้งแรกที่กดยืนยัน (${run.ores[run.oi]?"ได้ 1 คะแนน":"ได้ 0 คะแนน"}) ลองตั้งใหม่ได้เพื่อฝึก</p>
        <div class="tools"><button id="sm-re">ลองตั้งใหม่</button><button class="primary" id="sm-nx">${last?"ไปส่วน ข →":"ข้อถัดไป →"}</button></div>`;
      side.querySelector("#sm-re").onclick=orderStep;
      side.querySelector("#sm-nx").onclick=()=>{ if(last){ run.part="s"; run.si=0; run.step=0; scenStep(); } else { run.oi++; orderStep(); } window.scrollTo(0,0); };
      if(window.innerWidth<900) side.scrollIntoView({behavior:"smooth"});
    }
    paint();
  }

  /* ส่วน ข: จอเครื่อง + ตัดสินใจทีละขั้น */
  function monitor(st){
    const v=x=>x==null?"---":x;
    return `<div class="pmon ${st.alarm?"alm":""}">
      <div class="pm-top"><span>${esc(st.drug||"")}</span><span class="pm-lib">${st.lib?"DRUG LIBRARY":"BASIC"}</span></div>
      <div class="pm-tiles"><div><span>RATE</span><b>${v(st.rate)}</b><small>mL/h</small></div><div><span>VTBI</span><b>${v(st.vtbi)}</b><small>mL</small></div><div><span>ให้แล้ว</span><b>${v(st.vi)}</b><small>mL</small></div></div>
      <div class="pm-msg" role="status">${st.alarm?"⚠ ALARM: "+esc(st.alarm):"● "+(st.rate?"RUNNING":"กำลังตั้งค่า")}</div>
      ${st.note?`<div class="pm-note">${esc(st.note)}</div>`:""}
    </div>`;
  }
  function scenStep(){
    const root=document.getElementById("sim"), sc=S.scenarios[run.si], stp=sc.steps[run.step];
    const ord=shuffle(stp.opts.map((o,k)=>k));
    root.innerHTML=`<div class="simtop"><span class="kicker">ส่วน ข · สถานการณ์ ${run.si+1} / ${NS} · ขั้นที่ ${run.step+1} / 3</span>${dots()}</div>
      <h2>${esc(sc.n)}</h2>
      <div class="pmgrid"><div>
          <div class="order"><div class="tk-h"><span>📋 สถานการณ์</span></div><p>${esc(sc.story)}</p></div>
          ${monitor(stp.st)}
        </div>
        <div><h3>${esc(stp.q)}</h3><div class="lopts">${ord.map(k=>`<button class="lopt" data-k="${k}">${esc(stp.opts[k][0])}</button>`).join("")}</div><div id="sm-f"></div></div>
      </div>`;
    root.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k, good=k===0;
      run.pts[run.si][run.step]=good?1:0;
      root.querySelectorAll("[data-k]").forEach(x=>{ x.disabled=true; if(x.dataset.k==="0") x.classList.add("good"); else if(x===b) x.classList.add("bad"); });
      const f=root.querySelector("#sm-f"), lastStep=run.step===2, lastSc=run.si===NS-1;
      f.innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง +1":"✗ ยังไม่เหมาะ"}</b><p>${esc(stp.opts[k][1])}</p>
        ${good?"":`<p><b>ที่ควรทำ:</b> ${esc(stp.opts[0][0])} · ${esc(stp.opts[0][1])}</p>`}
        <button class="primary" id="sm-n">${!lastStep?"ขั้นถัดไป →":lastSc?"ดูผลรวม":"สถานการณ์ถัดไป →"}</button></div>`;
      f.querySelector("#sm-n").onclick=()=>{ if(!lastStep){ run.step++; scenStep(); } else if(!lastSc){ run.si++; run.step=0; scenStep(); } else simSummary(); window.scrollTo(0,0); };
      if(window.innerWidth<900) f.scrollIntoView({behavior:"smooth",block:"start"});
    });
  }
  function simSummary(){
    const root=document.getElementById("sim");
    const oSum=run.ores.filter(Boolean).length, sSum=run.pts.flat().reduce((a,b)=>a+b,0), tot=oSum+sSum, pct=Math.round(tot/MAX*100);
    if(!run.saved){ run.saved=true;
      Score.record({key:"csim", mod:"เครื่องจำลอง", item:`เครื่องจำลอง (ตั้งเครื่อง ${NO} ข้อ + ${NS} สถานการณ์)`, score:tot, max:MAX,
        detail:S.orders.map((o,k)=>o.id+(run.ores[k]?"✓":"✗")).join(" ")+" | "+S.scenarios.map((s,k)=>s.id+" "+run.pts[k].reduce((a,b)=>a+b,0)+"/3").join(", ")}); }
    root.innerHTML=`<h1>ผลเครื่องจำลอง</h1>
      <div class="score ${pct>=CR.simPct?"ok":pct>=60?"mid":"bad"}"><div class="big">${tot}/${MAX}</div><div>${pct}% ${pct>=CR.simPct?"· ผ่านเกณฑ์":"· เกณฑ์ผ่าน "+CR.simPct+"%"}</div></div>
      <h3>ส่วน ก · ตั้งเครื่อง ${oSum}/${NO}</h3>
      <ol class="recap">${S.orders.map((o,k)=>`<li><b>${run.ores[k]?"✓":"✗"} ${esc(o.n)}</b><span>${esc(o.why)}</span></li>`).join("")}</ol>
      <h3>ส่วน ข · สถานการณ์ ${sSum}/${NS*3}</h3>
      <ol class="recap">${S.scenarios.map((s,k)=>`<li><b>${run.pts[k].reduce((a,b)=>a+b,0)}/3 · ${esc(s.n)}</b><span>ทบทวน: ${esc(s.lessons)}</span></li>`).join("")}</ol>
      <div class="tools"><button class="primary" id="sm-again">ทำใหม่ทั้งชุด</button><a class="btn" href="#quiz">ไปแบบทดสอบ ▶</a></div>`;
    root.querySelector("#sm-again").onclick=()=>{ run={part:"o", oi:0, ores:[], si:0, step:0, pts:S.scenarios.map(()=>[])}; orderStep(); window.scrollTo(0,0); };
  }

  /* ---------- นำทาง ---------- */
  function route(){
    const v=(location.hash||"#home").slice(1), names=[...document.querySelectorAll("#nav a")].map(a=>a.dataset.v), name=names.includes(v)?v:"home";
    document.querySelectorAll(".view").forEach(s=>s.classList.toggle("on",s.id==="v-"+name));
    document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.v===name));
    if(name==="home") home();
    if(name==="lessons") lessons();
    if(name==="calc" && !document.getElementById("calc").innerHTML) calc();
    if(name==="sim" && !run) simIntro();
    if(window.Views && window.Views[name]) window.Views[name].show();
    window.scrollTo(0,0);
  }
  window.addEventListener("hashchange",route);
  window.addEventListener("DOMContentLoaded",()=>{
    const e=document.getElementById("report"); if(e&&C.reportEmail) e.innerHTML=`พบข้อผิดพลาดในเนื้อหา แจ้งได้ที่ <a href="mailto:${esc(C.reportEmail)}">${esc(C.reportEmail)}</a>`;
    route();
  });
})();
