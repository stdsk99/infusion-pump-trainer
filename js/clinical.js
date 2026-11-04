/* ===== โมดูล 7: การตั้งค่าใช้งานทางคลินิก ===== */
(function(){
  const D=window.CLIN, root=document.getElementById("clin");
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const pick=a=>a[Math.floor(Math.random()*a.length)], rnd=(a,b)=>a+Math.random()*(b-a);
  const r1=x=>Math.round(x*10)/10, fmt=n=>n.toLocaleString("th-TH",{maximumFractionDigits:2});
  const TABS=[["learn","บทเรียน"],["calc","ฝึกคำนวณ"],["sim","เครื่องจำลอง"],["tech","มุมช่าง"]];
  let tab="learn", lesson=D.lessons[0].id;

  function frame(body){
    root.innerHTML=`<h1>การตั้งค่าใช้งานทางคลินิก</h1>
      <p class="muted">เรียนวิธีตั้งเครื่องให้ถูกต้องตามคำสั่งการรักษาและกลุ่มผู้ป่วย ฝึกคำนวณ ฝึกกดตั้งค่าบนเครื่องจำลอง และฝึกแยกปัญหาการตั้งค่าออกจากเครื่องเสีย</p>
      <div class="note small" style="margin:0 0 10px">⚠️ ${esc(D.disclaimer)}</div>
      <div class="chips pmtabs">${TABS.map(([id,n])=>`<button data-t="${id}" class="${tab===id?"on":""}">${n}</button>`).join("")}</div>
      <div id="cl-body">${body}</div>`;
    root.querySelectorAll(".pmtabs [data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render();window.scrollTo(0,0);});
  }

  /* ---------- บทเรียน ---------- */
  function block([t,c]){
    if(t==="p") return `<p>${c}</p>`;
    if(t==="ul") return `<ul>${c.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    if(t==="ol") return `<ol>${c.map(x=>`<li>${x}</li>`).join("")}</ol>`;
    if(t==="f") return `<div class="formula">${esc(c).replace(/\n/g,"<br>")}</div>`;
    if(t==="ex") return `<div class="exbox"><b>ตัวอย่าง</b><br>${esc(c).replace(/\n/g,"<br>")}</div>`;
    if(t==="tip") return `<div class="hint">💡 ${c}</div>`;
    if(t==="warn") return `<div class="msg bad">⚠️ ${c}</div>`;
    return "";
  }
  function viewLearn(){
    const L=D.lessons.find(x=>x.id===lesson), i=D.lessons.indexOf(L);
    frame(`<div class="clgrid">
      <nav class="clnav">${D.lessons.map(x=>`<button data-l="${x.id}" class="${x.id===lesson?"on":""}">${esc(x.n)}</button>`).join("")}</nav>
      <article class="lesson"><h2>${esc(L.n)}</h2>${L.b.map(block).join("")}
        <div class="tools">${i>0?`<button data-go="${D.lessons[i-1].id}">◀ ${esc(D.lessons[i-1].n)}</button>`:""}
        ${i<D.lessons.length-1?`<button class="primary" data-go="${D.lessons[i+1].id}">${esc(D.lessons[i+1].n)} ▶</button>`:`<button class="primary" data-tab="calc">ไปฝึกคำนวณ ▶</button>`}</div>
      </article></div>`);
    root.querySelectorAll("[data-l],[data-go]").forEach(b=>b.onclick=()=>{lesson=b.dataset.l||b.dataset.go;render();if(window.innerWidth<900)root.querySelector(".lesson").scrollIntoView({behavior:"smooth"});});
    const t=root.querySelector("[data-tab]"); if(t) t.onclick=()=>{tab="calc";render();window.scrollTo(0,0);};
  }

  /* ---------- ฝึกคำนวณ (สุ่มโจทย์) ---------- */
  const GEN=[
    ()=>{ const v=pick([500,1000,250,100]), h=pick([4,5,6,8,10,12,24]); const a=r1(v/h);
      return {q:`สารน้ำ ${fmt(v)} mL ให้ใน ${h} ชั่วโมง ตั้ง RATE กี่ mL/h`, a, ex:`${fmt(v)} ÷ ${h} = ${a} mL/h`}; },
    ()=>{ const kg=r1(pick([0.8,1.2,2.5,3,3.5,4])), d=pick([2,3,4,5,6]); const a=r1(kg*d);
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
  function viewCalc(){
    frame(`<div class="pmgrid"><div><h2>ฝึกคำนวณ</h2><p class="muted">โจทย์สุ่ม 6 ข้อ ครอบคลุมสูตรในบทที่ 2 ตอบเป็นทศนิยม 1 ตำแหน่ง ยอมรับคลาดเคลื่อน ±0.1</p><div id="cl-calc"></div></div>
      <aside class="logbox"><h2>สูตร</h2>${block(D.lessons[1].b[1])}</aside></div>`);
    const box=root.querySelector("#cl-calc"), N=6, qs=[...GEN].sort(()=>Math.random()-.5).map(g=>g()); let i=0, ok=0;
    function draw(){
      if(i>=N){ box.innerHTML=`<div class="score ${ok>=5?"ok":ok>=4?"mid":"bad"}"><div class="big">${ok}/${N}</div><div>ตอบถูก</div></div><div class="tools"><button class="primary" id="cc-a">ฝึกอีกชุด</button></div>`;
        window.Score&&Score.record({key:"clin:calc", mod:"7-ตั้งค่าทางคลินิก", item:"ฝึกคำนวณอัตราไหล", score:ok, max:N});
        box.querySelector("#cc-a").onclick=viewCalc; return; }
      const q=qs[i];
      box.innerHTML=`<div class="kicker">ข้อ ${i+1} / ${N}</div><p class="pq">${esc(q.q)}</p>
        <label class="nlab">คำตอบ (${q.unit||"mL/h"})<input id="cc-v" type="number" step="0.1" inputmode="decimal"></label>
        <div class="tools"><button class="primary" id="cc-c">ตรวจคำตอบ</button></div><div id="cc-f"></div>`;
      const inp=box.querySelector("#cc-v"); inp.focus();
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
  let simIdx=0, simRes=[];
  function viewSim(){
    const S=D.sims[simIdx];
    const st={field:"rate", buf:"", rate:null, vtbi:null, occ:"M"};
    frame(`<div class="simtop"><span class="kicker">สถานการณ์ ${simIdx+1} / ${D.sims.length} · ${esc(S.n)}</span>
        <div class="simdots">${D.sims.map((s,k)=>`<i class="${simRes[k]===true?"ok":simRes[k]===false?"bad":k===simIdx?"on":""}"></i>`).join("")}</div></div>
      <div class="pmgrid">
        <div>
          <div class="order"><div class="tk-h"><span>📋 คำสั่งการรักษา</span>${S.ha?`<span class="lv lv3">ยาความเสี่ยงสูง</span>`:""}</div><p>${esc(S.order)}</p></div>
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
      </div>`);
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
        <p class="muted small">เครื่องจริงจะแสดงหน้านี้ให้อ่านทวนทุกค่าเทียบกับคำสั่งการรักษา${S.ha?" · <b>ยาความเสี่ยงสูง: ให้อีกคนตรวจซ้ำ</b>":""}</p>
        <div class="lcd small-lcd"><div class="lrow"><span>RATE</span><b>${st.rate}</b><small>mL/h</small></div><div class="lrow"><span>VTBI</span><b>${st.vtbi}</b><small>mL</small></div><div class="lrow"><span>TIME</span><b>${time()}</b><small>h:min</small></div><div class="lrow"><span>OCCL</span><b>${st.occ}</b><small></small></div></div>
        <p class="small">${esc(S.order)}</p>
        <div class="tools"><button class="ghost" id="cf-n">กลับไปแก้</button><button class="primary" id="cf-y">ยืนยันและเริ่ม</button></div></div>`;
      document.body.appendChild(d);
      d.querySelector("#cf-n").onclick=()=>d.remove();
      d.querySelector("#cf-y").onclick=()=>{ d.remove(); grade(); };
    }
    function grade(){
      const okR=Math.abs(st.rate-S.rate)<=S.tol+1e-9, okV=Math.abs(st.vtbi-S.vtbi)<0.5, okO=S.occ.includes(st.occ), all=okR&&okV&&okO;
      const ten=!okR && (Math.abs(st.rate-S.rate*10)<1 || Math.abs(st.rate*10-S.rate)<1);
      if(simRes[simIdx]===undefined) simRes[simIdx]=all;
      const side=root.querySelector("#sim-side"), last=simIdx===D.sims.length-1;
      side.innerHTML=`<h2>${all?"✓ ตั้งค่าถูกต้อง":"✗ ยังมีค่าที่ไม่ถูก"}</h2>
        <ul class="gl"><li class="${okR?"ok":"bad"}">RATE ${st.rate} mL/h ${okR?"✓":"✗ ควรเป็น "+S.rate}</li>
        <li class="${okV?"ok":"bad"}">VTBI ${st.vtbi} mL ${okV?"✓":"✗ ควรเป็น "+S.vtbi}</li>
        <li class="${okO?"ok":"bad"}">OCCL ${st.occ} ${okO?"✓":"✗ ควรเป็น "+S.occ.join(" หรือ ")}</li></ul>
        ${ten?`<div class="msg bad">RATE ต่างจากค่าที่ถูก 10 เท่า: ความผิดพลาดแบบทศนิยมผิดตำแหน่ง ในงานจริงผู้ป่วยจะได้ยามากหรือน้อยเกินไป 10 เท่า</div>`:""}
        <div class="exbox"><b>เฉลย</b><br>${esc(S.why)}</div>
        <p class="small muted">นับคะแนนจากครั้งแรกที่กดยืนยันของแต่ละสถานการณ์</p>
        <div class="tools"><button id="sm-re">ลองตั้งใหม่</button>${last?`<button class="primary" id="sm-end">ดูผลรวม</button>`:`<button class="primary" id="sm-nx">สถานการณ์ถัดไป →</button>`}</div>`;
      side.querySelector("#sm-re").onclick=viewSim;
      const nx=side.querySelector("#sm-nx"); if(nx) nx.onclick=()=>{simIdx++;viewSim();window.scrollTo(0,0);};
      const en=side.querySelector("#sm-end"); if(en) en.onclick=simSummary;
      if(window.innerWidth<900) side.scrollIntoView({behavior:"smooth"});
    }
    paint();
  }
  function simSummary(){
    const n=D.sims.length, ok=simRes.filter(x=>x===true).length;
    window.Score&&Score.record({key:"clin:sim", mod:"7-ตั้งค่าทางคลินิก", item:"เครื่องจำลองการตั้งค่า", score:ok, max:n, detail:simRes.map((x,k)=>D.sims[k].id+(x?"✓":"✗")).join(" ")});
    frame(`<h2>ผลเครื่องจำลอง</h2><div class="score ${ok>=5?"ok":ok>=4?"mid":"bad"}"><div class="big">${ok}/${n}</div><div>ตั้งถูกในครั้งแรก</div></div>
      <ol class="recap">${D.sims.map((s,k)=>`<li><b>${simRes[k]?"✓":"✗"} ${esc(s.n)}</b><span>${esc(s.why)}</span></li>`).join("")}</ol>
      <div class="tools"><button class="primary" id="sm-again">ทำใหม่ทั้งชุด</button><button id="sm-tech">ไปมุมช่าง ▶</button></div>`);
    root.querySelector("#sm-again").onclick=()=>{simIdx=0;simRes=[];viewSim();};
    root.querySelector("#sm-tech").onclick=()=>{tab="tech";render();};
    window.scrollTo(0,0);
  }

  /* ---------- มุมช่าง ---------- */
  function viewTech(){
    const qs=[...D.cases].sort(()=>Math.random()-.5); let i=0, ok=0;
    frame(`<h2>มุมช่าง: แยกสาเหตุ</h2><p class="muted">อ่านเหตุการณ์จากใบแจ้งซ่อม แล้วตัดสินว่าเกิดจากอะไร</p><div id="cl-tech"></div>`);
    const box=root.querySelector("#cl-tech");
    function draw(){
      if(i>=qs.length){ box.innerHTML=`<div class="score ${ok>=6?"ok":ok>=5?"mid":"bad"}"><div class="big">${ok}/${qs.length}</div><div>ตอบถูก</div></div><div class="tools"><button class="primary" id="tc-a">ทำอีกครั้ง</button></div>`;
        window.Score&&Score.record({key:"clin:tech", mod:"7-ตั้งค่าทางคลินิก", item:"มุมช่าง: ตั้งค่าผิดหรือเครื่องเสีย", score:ok, max:qs.length});
        box.querySelector("#tc-a").onclick=viewTech; return; }
      const q=qs[i];
      box.innerHTML=`<div class="kicker">ข้อ ${i+1} / ${qs.length}</div><div class="ticket"><div class="tk-h"><span>ใบแจ้งซ่อม</span></div><p>${esc(q.q)}</p></div>
        <div class="lopts">${Object.entries(D.causes).map(([k,n])=>`<button class="lopt" data-a="${k}">${esc(n)}</button>`).join("")}</div><div id="tc-f"></div>`;
      box.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{
        const good=b.dataset.a===q.a; if(good) ok++;
        box.querySelectorAll("[data-a]").forEach(x=>{ x.disabled=true; if(x.dataset.a===q.a) x.classList.add("good"); else if(x===b) x.classList.add("bad"); });
        box.querySelector("#tc-f").innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง":"✗ คำตอบคือ: "+esc(D.causes[q.a])}</b><p>${esc(q.e)}</p><button class="primary" id="tc-n">${i+1<qs.length?"ข้อต่อไป →":"ดูผล"}</button></div>`;
        box.querySelector("#tc-n").onclick=()=>{i++;draw();};
      });
    }
    draw();
  }

  function render(){ ({learn:viewLearn, calc:viewCalc, sim:viewSim, tech:viewTech})[tab](); }
  window.Views=window.Views||{}; window.Views.clin={show:()=>{ if(!root.innerHTML) render(); }};
})();
