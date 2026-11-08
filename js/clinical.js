/* ===== โมดูล 7: การใช้งานสำหรับช่าง (Infusion Pump) =====
   แท็บ: บทเรียน · ฝึกคำนวณ · ฝึกตั้งค่า · ตรวจก่อนใช้งาน · มุมช่าง
   คะแนน clin:sim = ฝึกตั้งค่า (ใบสั่งทดสอบ 5 + เมนูช่าง 5 = 10) + มุมช่าง (8 โจทย์ × 2 = 16) รวม 26 คะแนน
   ระบบส่งคะแนนครั้งเดียวเมื่อทำครบทั้งสองส่วน (เก็บผลส่วนที่ทำแล้วไว้ในเครื่องระหว่างรอ)
   ฝึกคำนวณ (clin:calc) และตรวจก่อนใช้งาน ไม่นับเกณฑ์ */
(function(){
  const D=window.CLIN, root=document.getElementById("clin");
  if(!D||!root) return;
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const r1=x=>Math.round(x*10)/10, fmt=n=>n.toLocaleString("th-TH",{maximumFractionDigits:2});
  const TABS=[["learn","บทเรียน"],["calc","ฝึกคำนวณ"],["set","ฝึกตั้งค่า"],["check","ตรวจก่อนใช้งาน"],["tech","มุมช่าง"]];
  const MOD="6-การใช้งานสำหรับช่าง";
  let tab="learn", lesson=D.lessons[0].id;

  /* ---------- คะแนนรวม 2 ส่วน ---------- */
  const K_P=((window.APP_CONFIG||{}).store||"ipt")+"-clin-part";
  const sid=()=>{ const p=window.Score&&Score.profile(); return p?p.sid:""; };
  function parts(){ try{ const o=JSON.parse(localStorage.getItem(K_P)); return o&&o.sid===sid()?o:{sid:sid()}; }catch(e){ return {sid:sid()}; } }
  function savePart(name, score, max){
    const o=parts(); o[name]={score, max, t:Date.now()};
    if(o.set && o.tech){
      const sc=o.set.score+o.tech.score, mx=o.set.max+o.tech.max;
      window.Score&&Score.record({key:"clin:sim", mod:MOD, item:"ฝึกตั้งค่าและมุมช่าง", score:sc, max:mx,
        detail:`ฝึกตั้งค่า ${o.set.score}/${o.set.max} · มุมช่าง ${o.tech.score}/${o.tech.max}`});
      try{ localStorage.removeItem(K_P); }catch(e){}
      return {done:true, score:sc, max:mx};
    }
    try{ localStorage.setItem(K_P, JSON.stringify(o)); }catch(e){}
    return {done:false};
  }
  function statusBar(){
    const o=parts(), b=window.Score&&Score.bestOf("clin:sim");
    const one=(k,n)=>o[k]?`<span class="tp ok">✓ ${n} ${o[k].score}/${o[k].max}</span>`:`<span class="tp">○ ${n}</span>`;
    return `<div class="tstat"><b>คะแนนโมดูลนี้</b>${one("set","ฝึกตั้งค่า")}${one("tech","มุมช่าง")}
      <span class="muted small">${b?`ดีที่สุด ${Math.round(b.v*100)}% (${b.score}/${b.max})`:"ทำครบทั้งสองส่วนแล้วระบบจึงส่งคะแนน"} · เกณฑ์ผ่าน ≥ 80%</span></div>`;
  }
  function frame(body){
    root.innerHTML=`<h1>การใช้งานสำหรับช่าง</h1>
      <p class="muted">ตั้งเครื่องได้คล่องเหมือนผู้ใช้ เข้าใจเมนูช่างและระบบป้องกันของเครื่อง ฝึกตั้งค่าเพื่อทดสอบและตั้งค่าตั้งต้นของหน่วยงาน ตรวจเครื่องก่อนใช้ และแยกให้ออกว่าปัญหาที่ได้รับแจ้งเกิดจากการตั้งค่าหรือเครื่องเสีย</p>
      <div class="note small" style="margin:0 0 10px">⚠️ ${esc(D.disclaimer)}</div>
      ${statusBar()}
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
        ${i<D.lessons.length-1?`<button class="primary" data-go="${D.lessons[i+1].id}">${esc(D.lessons[i+1].n)} ▶</button>`:`<button class="primary" data-tab="set">ไปฝึกตั้งค่า ▶</button>`}</div>
      </article></div>`);
    root.querySelectorAll("[data-l],[data-go]").forEach(b=>b.onclick=()=>{lesson=b.dataset.l||b.dataset.go;render();if(window.innerWidth<900)root.querySelector(".lesson").scrollIntoView({behavior:"smooth"});});
    const t=root.querySelector("[data-tab]"); if(t) t.onclick=()=>{tab="set";render();window.scrollTo(0,0);};
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
    ,()=>{ const r=pick([60,90,100,120,150]), df=pick([15,20,60]); const a=r1(r*df/60);
      return {q:`RATE ${r} mL/h ชุดสาย ${df} หยด/mL จะเห็นหยดใน drip chamber กี่หยด/นาที`, a, ex:`${r} × ${df} ÷ 60 = ${a} หยด/นาที`, unit:"หยด/นาที"}; }
  ];
  function viewCalc(){
    frame(`<div class="pmgrid"><div><h2>ฝึกคำนวณ</h2><p class="muted">โจทย์สุ่ม 6 ข้อ ครอบคลุมสูตรในบท 7.2 ตอบเป็นทศนิยม 1 ตำแหน่ง ยอมรับคลาดเคลื่อน ±0.1</p><div id="cl-calc"></div></div>
      <aside class="logbox"><h2>สูตร</h2>${block(D.lessons.find(x=>x.id===D.calcLesson).b[1])}</aside></div>`);
    const box=root.querySelector("#cl-calc"), N=6, qs=shuffle(GEN).slice(0,6).map(g=>g()); let i=0, ok=0;
    function draw(){
      if(i>=N){ box.innerHTML=`<div class="score ${ok>=5?"ok":ok>=4?"mid":"bad"}"><div class="big">${ok}/${N}</div><div>ตอบถูก</div></div><div class="tools"><button class="primary" id="cc-a">ฝึกอีกชุด</button></div>`;
        window.Score&&Score.record({key:"clin:calc", mod:MOD, item:"ฝึกคำนวณอัตราไหล", score:ok, max:N});
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

  /* ---------- ฝึกตั้งค่า: เครื่องจำลองที่มีหน้าจอใช้งานและเมนูช่าง ---------- */
  const today=(()=>{ const d=new Date(), p=n=>String(n).padStart(2,"0"); return {t:`${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()+543}`, s:`${p(d.getMonth()+1)}/${p(d.getDate())}/${d.getFullYear()+543}`}; })();
  const optsOf=m=> m.opts==="date" ? ["01/01/2543", today.s===today.t?"01/"+today.t.slice(3):today.s, today.t] : m.opts;
  const want=(k,v)=> k==="date"&&v==="today"?today.t:v;
  const descVal=(k,v)=> k==="date"&&v==="today"?`วันนี้ (${today.t})`:v;
  let setRound=null;
  function newSetRound(){
    const t=shuffle(D.testOrders).slice(0,5).map(o=>({...o, kind:"run"}));
    const m=shuffle(D.menuTasks).slice(0,5).map(o=>({...o, kind:"menu"}));
    setRound={orders:[...t,...m], i:0, res:[]};
  }
  function leftover(O){
    const cfg={}; D.menu.forEach(m=>{ const op=optsOf(m); cfg[m.k]=pick(op); });
    if(O.kind==="menu") Object.entries(O.set).forEach(([k,v])=>{ const w=want(k,v), op=optsOf(D.menu.find(m=>m.k===k)).filter(x=>x!==w); cfg[k]=pick(op); });
    return {scr:"run", field:"rate", buf:"", rate:pick([null,80,12.5,100]), vtbi:pick([null,500,1000,250]), occ:pick(["L","M","H"]), cfg, cfg0:{...cfg}, sel:D.menu[0].k};
  }
  function viewSet(){
    if(!setRound) newSetRound();
    const R=setRound;
    if(R.i>=R.orders.length) return setSummary();
    const O=R.orders[R.i], st=leftover(O);
    frame(`<div class="simtop"><span class="kicker">ใบสั่งที่ ${R.i+1} / ${R.orders.length} · ${O.kind==="run"?"ก. ตั้งเพื่อทดสอบ":"ข. เมนูช่าง"}</span>
        <div class="simdots">${R.orders.map((x,k)=>`<i class="${R.res[k]===true?"ok":R.res[k]===false?"bad":k===R.i?"on":""}"></i>`).join("")}</div></div>
      <div class="pmgrid">
        <div>
          <div class="order"><div class="tk-h"><span>📋 ใบสั่งงาน · ${esc(O.who)}</span></div><p>${esc(O.text)}</p></div>
          <div class="pumpface">
            <div class="lcd" id="lcd"></div>
            <div class="pkeys" id="pkeys"></div>
          </div>
          <p class="muted small" id="howto"></p>
          <p class="muted small">เครื่องอาจมีค่าจากงานก่อนหน้าค้างอยู่ ตรวจทุกค่า และไม่เปลี่ยนค่าที่ใบสั่งไม่ได้ให้เปลี่ยน</p>
        </div>
        <aside class="logbox" id="set-side"><h2>ตรวจทานก่อนส่ง</h2>
          <p class="small muted">${O.kind==="run"?"เทียบ RATE · VTBI · OCCL บนจอกับใบสั่งทีละค่า":"เข้าเมนูช่าง เปลี่ยนเฉพาะค่าที่ใบสั่งระบุ แล้วออกจากเมนูช่างก่อนส่งงาน"}</p>
          <div class="hint small">กด MENU เพื่อสลับหน้าจอใช้งานกับเมนูช่าง (เครื่องจริงต้องใส่รหัสช่าง)</div>
          <div class="tools"><button class="primary" id="set-go">ส่งงาน</button></div></aside>
      </div>`);
    const lcd=root.querySelector("#lcd"), keys=root.querySelector("#pkeys"), how=root.querySelector("#howto");
    const val=f=> st.field===f && st.buf!=="" ? st.buf : (st[f]===null?"---":String(st[f]));
    const time=()=>{ if(!st.rate||!st.vtbi) return "--:--"; const m=Math.round(st.vtbi/st.rate*60); return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`; };
    function paint(){
      if(st.scr==="run"){
        lcd.innerHTML=`<div class="lrow ${st.field==="rate"?"sel":""}"><span>RATE</span><b>${val("rate")}</b><small>mL/h</small></div>
          <div class="lrow ${st.field==="vtbi"?"sel":""}"><span>VTBI</span><b>${val("vtbi")}</b><small>mL</small></div>
          <div class="lrow"><span>TIME</span><b>${time()}</b><small>h:min</small></div>
          <div class="lrow ${st.field==="occ"?"sel":""}"><span>OCCL</span><b>${st.occ}</b><small>${{L:"ต่ำ",M:"กลาง",H:"สูง"}[st.occ]}</small></div>`;
        keys.innerHTML=`<div class="fkeys"><button data-f="rate">RATE</button><button data-f="vtbi">VTBI</button><button data-f="occ">OCCL</button><button data-c="menu">MENU</button></div>
          <div class="numpad">${["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k=>`<button data-k="${k}">${k}</button>`).join("")}</div>
          <div class="ckeys"><button data-c="up">▲</button><button data-c="down">▼</button><button data-c="clr">CLR</button></div>`;
        how.textContent="หน้าจอใช้งาน: กด RATE หรือ VTBI แล้วกดตัวเลข · OCCL แล้ว ▲▼ เปลี่ยนระดับ · CLR ล้างช่องที่เลือก";
      } else {
        lcd.innerHTML=`<div class="svch">SERVICE › CONFIGURATION</div>${D.menu.map(m=>`<button class="lrow svrow ${st.sel===m.k?"sel":""}" data-m="${m.k}"><span>${esc(m.n)}</span><b>${esc(st.cfg[m.k])}</b></button>`).join("")}`;
        keys.innerHTML=`<div class="fkeys"><button data-c="menu">MENU (ออก)</button></div>
          <div class="ckeys"><button data-c="up">▲</button><button data-c="down">▼</button></div>`;
        how.textContent="เมนูช่าง: แตะรายการเพื่อเลือก แล้วใช้ ▲▼ เปลี่ยนค่า · กด MENU เพื่อออก";
      }
      lcd.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ st.sel=b.dataset.m; paint(); });
      keys.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{ commit(); st.field=b.dataset.f; paint(); });
      keys.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ num(b.dataset.k); paint(); });
      keys.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ ctl(b.dataset.c); paint(); });
    }
    function commit(){ if(st.field!=="occ" && st.buf!==""){ const v=parseFloat(st.buf); st[st.field]=isNaN(v)?null:v; } st.buf=""; }
    function num(k){
      if(st.field==="occ") return;
      if(k==="⌫"){ st.buf=st.buf.slice(0,-1); return; }
      if(k==="." && (st.buf.includes(".")||st.field==="vtbi")) return;
      if(st.buf.includes(".") && st.buf.split(".")[1].length>=1) return;
      if(st.buf.replace(".","").length>=4) return;
      st.buf += (k==="." && st.buf==="") ? "0." : k;
    }
    function ctl(c){
      if(c==="menu"){ commit(); st.scr=st.scr==="run"?"svc":"run"; return; }
      const dir=c==="up"?1:c==="down"?-1:0;
      if(st.scr==="svc"){ if(!dir) return; const m=D.menu.find(x=>x.k===st.sel), op=optsOf(m), i=op.indexOf(st.cfg[m.k]);
        st.cfg[m.k]=op[Math.max(0,Math.min(op.length-1,(i<0?0:i)+dir))]; return; }
      if(dir){ if(st.field==="occ"){ const lv=["L","M","H"], i=lv.indexOf(st.occ); st.occ=lv[Math.max(0,Math.min(2,i+dir))]; } return; }
      if(c==="clr" && st.field!=="occ"){ st.buf=""; st[st.field]=null; }
    }
    root.querySelector("#set-go").onclick=()=>{
      commit();
      const rows=[];
      if(O.kind==="run"){
        rows.push(["RATE", st.rate, O.rate, Math.abs((st.rate||0)-O.rate)<0.05 && st.rate!==null, " mL/h"]);
        rows.push(["VTBI", st.vtbi, O.vtbi, st.vtbi===O.vtbi, " mL"]);
        rows.push(["OCCL", st.occ, O.occ, st.occ===O.occ, ""]);
      } else {
        Object.entries(O.set).forEach(([k,v])=>{ const m=D.menu.find(x=>x.k===k); rows.push([m.n, st.cfg[k], descVal(k,v), st.cfg[k]===want(k,v), ""]); });
      }
      const changed=D.menu.filter(m=>!(O.kind==="menu"&&m.k in O.set) && st.cfg[m.k]!==st.cfg0[m.k]);
      const left=st.scr==="svc";
      const all=rows.every(r=>r[3]) && !changed.length && !left;
      R.res[R.i]=all;
      const side=root.querySelector("#set-side"), last=R.i===R.orders.length-1;
      keys.querySelectorAll("button").forEach(b=>b.disabled=true); lcd.querySelectorAll("button").forEach(b=>b.disabled=true);
      const ten=O.kind==="run" && st.rate && !rows[0][3] && (Math.abs(st.rate-O.rate*10)<0.5||Math.abs(st.rate*10-O.rate)<0.5);
      side.innerHTML=`<h2>${all?"✓ ตั้งค่าถูกต้อง +1":"✗ ยังไม่ถูก +0"}</h2>
        <ul class="gl">${rows.map(r=>`<li class="${r[3]?"ok":"bad"}">${esc(r[0])} ${r[1]===null?"---":esc(r[1])}${r[4]} ${r[3]?"✓":"✗ ควรเป็น "+esc(r[2])+r[4]}</li>`).join("")}
        ${changed.map(m=>`<li class="bad">${esc(m.n)} ถูกเปลี่ยนจาก ${esc(st.cfg0[m.k])} เป็น ${esc(st.cfg[m.k])} ✗ ใบสั่งไม่ได้ให้เปลี่ยน</li>`).join("")}
        ${left?`<li class="bad">ยังค้างอยู่ในเมนูช่าง ✗ ต้องออกก่อนส่งงาน</li>`:""}</ul>
        ${ten?`<div class="msg bad">RATE ต่างจากที่ถูก 10 เท่า: ทศนิยมผิดตำแหน่ง</div>`:""}
        <div class="tools">${last?`<button class="primary" id="set-end">ดูผลรวม</button>`:`<button class="primary" id="set-nx">ใบสั่งถัดไป →</button>`}</div>`;
      side.querySelector("#set-nx,#set-end").onclick=()=>{R.i++;viewSet();window.scrollTo(0,0);};
      if(window.innerWidth<900) side.scrollIntoView({behavior:"smooth"});
    };
    paint();
  }
  function setSummary(){
    const R=setRound, ok=R.res.filter(Boolean).length, mx=R.orders.length;
    const s=R.saved||(R.saved=savePart("set", ok, mx));
    frame(`<h2>ผลฝึกตั้งค่า</h2><div class="score ${ok>=8?"ok":ok>=6?"mid":"bad"}"><div class="big">${ok}/${mx}</div><div>ตั้งถูก ${ok} จาก ${mx} ใบสั่ง</div></div>
      ${s.done?`<div class="msg ok">ทำครบทั้งสองส่วนแล้ว ส่งคะแนนโมดูลนี้ ${s.score}/${s.max} (${Math.round(s.score/s.max*100)}%)</div>`:`<p class="muted">ทำมุมช่างต่อให้ครบ ระบบจึงจะรวมคะแนนและส่ง</p>`}
      <ol class="recap">${R.orders.map((o,k)=>`<li><b>${R.res[k]?"✓":"✗"} ${esc(o.who)}</b><span>${esc(o.text)}</span></li>`).join("")}</ol>
      <div class="tools"><button id="set-again">ฝึกอีกชุด</button>${s.done?"":`<button class="primary" id="go-tech">ไปมุมช่าง ▶</button>`}</div>`);
    root.querySelector("#set-again").onclick=()=>{ newSetRound(); viewSet(); };
    const g=root.querySelector("#go-tech"); if(g) g.onclick=()=>{ tab="tech"; techRound=null; render(); };
    window.scrollTo(0,0);
  }

  /* ---------- ตรวจก่อนใช้งาน (ไม่เก็บคะแนน) ---------- */
  function viewCheck(){
    const items=D.checklist, bad=new Set(shuffle(items.map((x,k)=>k)).slice(0,D.checkBad)), ans={}; let checked=false;
    function draw(){
      const done=Object.keys(ans).length===items.length;
      frame(`<h2>ตรวจเครื่องก่อนใช้งาน</h2>
        <p class="muted">รายการที่ผู้ใช้ตรวจก่อนต่อเข้าผู้ป่วย ช่างใช้รายการเดียวกันนี้ตรวจตอนรับแจ้งซ่อมและก่อนส่งคืน อ่านผลที่พบแล้วตัดสินว่าผ่านหรือไม่ผ่าน (ไม่เก็บคะแนน)</p>
        <div class="chk">${items.map((x,k)=>{ const isBad=bad.has(k), a=ans[k];
          const res=checked?((a==="bad")===isBad?"good":"bad"):"";
          return `<div class="chkrow ${res}"><div><b>${k+1}. ${esc(x.n)}</b><p>${esc(isBad?x.bad:x.ok)}</p>
            ${checked&&isBad?`<p class="chact">→ ${esc(x.act)}</p>`:""}${checked&&res==="bad"&&!isBad?`<p class="chact">รายการนี้ปกติ ใช้งานได้</p>`:""}</div>
            <div class="seg"><button data-k="${k}" data-a="ok" class="${a==="ok"?"on":""}" ${checked?"disabled":""}>ผ่าน</button><button data-k="${k}" data-a="bad" class="${a==="bad"?"on":""}" ${checked?"disabled":""}>ไม่ผ่าน</button></div></div>`; }).join("")}</div>
        ${checked?(()=>{ const right=items.filter((x,k)=>(ans[k]==="bad")===bad.has(k)).length;
            return `<div class="score ${right===items.length?"ok":right>=8?"mid":"bad"}"><div class="big">${right}/${items.length}</div><div>ตัดสินถูก · เครื่องนี้${bad.size?"ยังไม่พร้อมใช้":"พร้อมใช้"}</div></div>`; })():""}
        <div class="tools">${checked?`<button class="primary" id="ck-new">สุ่มเครื่องใหม่</button>`:`<button class="primary" id="ck-go" ${done?"":"disabled"}>ตรวจคำตอบ</button><span class="muted small">ตัดสินแล้ว ${Object.keys(ans).length}/${items.length}</span>`}</div>`);
      root.querySelectorAll(".chk [data-k]").forEach(b=>b.onclick=()=>{ ans[b.dataset.k]=b.dataset.a; const y=window.scrollY; draw(); window.scrollTo(0,y); });
      const g=root.querySelector("#ck-go"); if(g) g.onclick=()=>{ checked=true; draw(); };
      const n=root.querySelector("#ck-new"); if(n) n.onclick=()=>{ viewCheck(); window.scrollTo(0,0); };
    }
    draw();
  }

  /* ---------- มุมช่าง ---------- */
  let techRound=null;
  function viewTech(){
    if(!techRound) techRound={qs:shuffle(D.cases).slice(0,D.techPerRound).map(c=>({...c, ord:shuffle(c.act.map((t,k)=>k))})), i:0, sc:0, pts:[]};
    const T=techRound;
    if(T.i>=T.qs.length) return techSummary();
    const q=T.qs[T.i];
    frame(`<h2>มุมช่าง: ตั้งค่าผิด หรือเครื่องเสีย</h2><p class="muted">อ่านใบแจ้งซ่อม ตัดสินสาเหตุ (1 คะแนน) แล้วเลือกสิ่งที่ควรทำต่อ (1 คะแนน)</p>
      <div class="simtop"><span class="kicker">โจทย์ ${T.i+1} / ${T.qs.length}</span><div class="simdots">${T.qs.map((x,k)=>`<i class="${k<T.i?(T.pts[k]===2?"ok":"bad"):k===T.i?"on":""}"></i>`).join("")}</div></div>
      <div class="ticket"><div class="tk-h"><span>ใบแจ้งซ่อม</span></div><p>${esc(q.q)}</p></div>
      <h3>1) สาเหตุน่าจะเป็นแบบไหน</h3>
      <div class="lopts">${Object.entries(D.causes).map(([k,n])=>`<button class="lopt" data-c="${k}">${esc(n)}</button>`).join("")}</div>
      <div id="tc-2"></div>`);
    let p=0;
    root.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{
      const good=b.dataset.c===q.a; if(good) p++;
      root.querySelectorAll("[data-c]").forEach(x=>{ x.disabled=true; if(x.dataset.c===q.a) x.classList.add("good"); else if(x===b) x.classList.add("bad"); });
      const box=root.querySelector("#tc-2");
      box.innerHTML=`<p class="small ${good?"":"bad-t"}">${good?"✓ ถูกต้อง":"✗ คำตอบคือ: "+esc(D.causes[q.a])}</p>
        <h3>2) ควรทำอะไรต่อ</h3><div class="lopts">${q.ord.map(k=>`<button class="lopt" data-x="${k}">${esc(q.act[k])}</button>`).join("")}</div><div id="tc-f"></div>`;
      box.querySelectorAll("[data-x]").forEach(y=>y.onclick=()=>{
        const g2=y.dataset.x==="0"; if(g2) p++;
        box.querySelectorAll("[data-x]").forEach(z=>{ z.disabled=true; if(z.dataset.x==="0") z.classList.add("good"); else if(z===y) z.classList.add("bad"); });
        T.sc+=p; T.pts[T.i]=p;
        box.querySelector("#tc-f").innerHTML=`<div class="fb ${p===2?"good":"bad"}"><b>ได้ ${p}/2 คะแนน</b><p>${esc(q.e)}</p><button class="primary" id="tc-n">${T.i+1<T.qs.length?"โจทย์ถัดไป →":"ดูผล"}</button></div>`;
        box.querySelector("#tc-n").onclick=()=>{ T.i++; viewTech(); window.scrollTo(0,0); };
      });
      if(window.innerWidth<900) box.scrollIntoView({behavior:"smooth",block:"start"});
    });
  }
  function techSummary(){
    const T=techRound, mx=T.qs.length*2, s=T.saved||(T.saved=savePart("tech", T.sc, mx));
    frame(`<h2>ผลมุมช่าง</h2><div class="score ${T.sc>=13?"ok":T.sc>=10?"mid":"bad"}"><div class="big">${T.sc}/${mx}</div><div>คะแนน</div></div>
      ${s.done?`<div class="msg ok">ทำครบทั้งสองส่วนแล้ว ส่งคะแนนโมดูลนี้ ${s.score}/${s.max} (${Math.round(s.score/s.max*100)}%)</div>`:`<p class="muted">ทำฝึกตั้งค่าต่อให้ครบ ระบบจึงจะรวมคะแนนและส่ง</p>`}
      <ol class="recap">${T.qs.map((q,k)=>`<li><b>${T.pts[k]}/2 · ${esc(D.causes[q.a].split(" (")[0])}</b><span>${esc(q.q)}</span></li>`).join("")}</ol>
      <div class="tools"><button id="tc-again">ทำอีกชุด</button>${s.done?"":`<button class="primary" id="go-set">ไปฝึกตั้งค่า ▶</button>`}</div>`);
    root.querySelector("#tc-again").onclick=()=>{ techRound=null; viewTech(); };
    const g=root.querySelector("#go-set"); if(g) g.onclick=()=>{ tab="set"; setRound=null; render(); };
    window.scrollTo(0,0);
  }

  function render(){ ({learn:viewLearn, calc:viewCalc, set:viewSet, check:viewCheck, tech:viewTech})[tab](); }
  window.Views=window.Views||{}; window.Views.clin={show:()=>{ if(!root.innerHTML) render(); }};
})();
