/* ===== โมดูล 1: แอนิเมชันเส้นทางสัญญาณ ===== */
(function(){
  const D = window.FLOW;
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const NS = "http://www.w3.org/2000/svg";
  const TYPES = {cmd:"คำสั่ง", fb:"สัญญาณย้อนกลับ", mon:"เฝ้าระวัง", out:"แสดงผล", alarm:"ผิดปกติ", stop:"ตัดคำสั่ง"};

  /* ---------- แผนผังสัญญาณ ---------- */
  const L = [["key","ปุ่มกด"],["drop","Drop sensor"],["occu","Occlusion ↑"],["occd","Occlusion ↓"],["air","Air sensor"],["door","Door sensor"]];
  const R = [["drv","Motor driver"],["mot","Stepper motor"],["enc","Encoder"],["mech","กลไกบีบสาย"],["disp","จอแสดงผล"],["buz","Buzzer · Nurse call"]];
  const RY = {drv:20, mot:72, enc:124, mech:176, disp:236, buz:288};
  /* เส้นทาง: id → [d, จาก, ไป] */
  const P = {};
  L.forEach(([id],i)=>{ const cy=20+i*52+18, ey=120+i*30; P[id]=[`M110 ${cy} C127 ${cy} 123 ${ey} 140 ${ey}`, id, "mcu"]; });
  Object.assign(P,{
    drv:  ["M220 118 C236 118 234 38 250 38", "mcu","drv"],
    mot:  ["M298 56 L298 72", "drv","mot"],
    link: ["M298 108 L298 124", "mot","enc"],
    mech: ["M346 90 H354 V194 H346", "mot","mech"],
    enc:  ["M250 142 C236 142 234 168 220 168", "enc","mcu"],
    disp: ["M220 236 C236 236 234 254 250 254", "mcu","disp"],
    buz:  ["M220 278 C236 278 234 306 250 306", "mcu","buz"],
    pwr:  ["M180 344 L180 300", "pwr","mcu"]
  });
  /* เส้นทางขาเข้าใช้ id ซ้ำกับโหนด จึงแยก map โหนดเอง */
  function blockSVG(){
    const node=(id,x,y,w,h,label,cls)=>`<g class="fn ${cls||""}" data-n="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle">${label}</text></g>`;
    let s=`<svg class="flsvg" viewBox="0 0 360 384" role="img" aria-label="แผนผังเส้นทางสัญญาณระหว่าง sensor, MCU, motor driver, มอเตอร์ และส่วนแสดงผล">`;
    s+=`<text class="fh" x="60" y="12" text-anchor="middle">INPUT</text><text class="fh" x="298" y="12" text-anchor="middle">OUTPUT</text>`;
    Object.entries(P).forEach(([id,[d]])=>{ s+=`<path class="fp" data-p="${id}" d="${d}"/>`; });
    L.forEach(([id,lb],i)=>{ s+=node(id,10,20+i*52,100,36,lb); });
    s+=node("mcu",140,100,80,200,"","mcu");
    s+=`<text class="mcut" x="180" y="196" text-anchor="middle">MCU</text><text class="fsub" x="180" y="214" text-anchor="middle">+ watchdog</text>`;
    R.forEach(([id,lb])=>{ s+=node(id,250,RY[id],96,36,lb); });
    s+=node("pwr",60,344,240,32,"ภาคจ่ายไฟ + แบตเตอรี่","pwr");
    s+=`<g class="fdots"></g><g class="fmarks"></g></svg>`;
    return s;
  }

  /* ---------- ภาพตัดภายใน (คัดลอกจากภาพในโมดูล 1) ---------- */
  function cutClone(){
    const src=document.getElementById("svg-cut"); if(!src) return null;
    const c=src.cloneNode(true);
    c.removeAttribute("id"); c.querySelectorAll("[id]").forEach(e=>e.removeAttribute("id"));
    c.classList.add("flcut"); c.classList.remove("run");
    c.setAttribute("aria-label","ภาพตัดภายในเครื่อง เคลื่อนไหวตามขั้นตอนของสัญญาณ");
    const ov=document.createElementNS(NS,"g"); ov.setAttribute("class","fl-ov"); c.appendChild(ov);
    return c;
  }

  /* ---------- สถานะ ---------- */
  let root=null, blk=null, cut=null, raf=0, timers=[], flows=[], dots=[];
  let sc=D.scenarios[0], mode="step", k=0, auto=false, mobView="blk";

  function clearTimers(){ timers.forEach(t=>clearTimeout(t)); timers=[]; }

  function setFlows(list){
    flows=list.map(([id,type])=>({id,type,el:blk.querySelector(`.fp[data-p="${id}"]`),next:0}));
    blk.querySelectorAll(".fp").forEach(p=>p.setAttribute("class","fp"));
    blk.querySelectorAll(".fn").forEach(n=>n.classList.remove("on","bad"));
    blk.querySelector(".fdots").innerHTML=""; blk.querySelector(".fmarks").innerHTML=""; dots=[];
    flows.forEach(f=>{
      if(!f.el) return;
      f.el.setAttribute("class","fp on t-"+f.type);
      const [,a,b]=P[f.id];
      [a,b].forEach(n=>{ const g=blk.querySelector(`.fn[data-n="${n}"]`); if(g){ g.classList.add("on"); if(f.type==="alarm"||f.type==="stop") g.classList.add("bad"); } });
      if(f.type==="stop"){ const L=f.el.getTotalLength(), pt=f.el.getPointAtLength(L/2);
        blk.querySelector(".fmarks").insertAdjacentHTML("beforeend",`<g class="fx" transform="translate(${pt.x} ${pt.y})"><circle r="8"/><path d="M-4 -4 L4 4 M4 -4 L-4 4"/></g>`); }
    });
  }

  function tick(now){
    const g=blk.querySelector(".fdots");
    flows.forEach((f,i)=>{
      if(!f.el || f.type==="stop") return;
      const gap = f.type==="pwr"?1600:f.type==="mon"?1100:850;
      if(now>=f.next){
        f.next=now+gap;
        const c=document.createElementNS(NS,"circle"); c.setAttribute("r",f.type==="pwr"?2.5:3.6); c.setAttribute("class","fd t-"+f.type);
        g.appendChild(c); dots.push({c,f,t0:now,dur:f.type==="pwr"?1500:1050});
      }
    });
    dots=dots.filter(d=>{
      const u=(now-d.t0)/d.dur;
      if(u>=1 || !d.f.el.isConnected){ d.c.remove(); return false; }
      const L=d.f.el.getTotalLength(), pt=d.f.el.getPointAtLength(L*u);
      d.c.setAttribute("cx",pt.x); d.c.setAttribute("cy",pt.y);
      d.c.setAttribute("opacity", u<.1?u*10:u>.9?(1-u)*10:1);
      return true;
    });
    raf=requestAnimationFrame(tick);
  }

  function applyCut(s){
    if(!cut) return; s=s||{};
    cut.classList.toggle("run",!!s.run);
    cut.querySelectorAll(".part").forEach(p=>p.classList.toggle("fl-hi",(s.hi||[]).includes(p.dataset.id)));
    const tx=cut.querySelectorAll('[data-id="display"] text');
    if(tx[0]){ tx[0].textContent=s.screen||"RATE 100 mL/h"; tx[1].textContent=(s.screen||"").startsWith("⚠")?"":"VTBI 500 mL"; }
    cut.querySelector('[data-id="display"]').classList.toggle("fl-alarm",(s.screen||"").startsWith("⚠"));
    cut.querySelector('[data-id="buzzer"]').classList.toggle("fl-blink",!!s.buzzer);
    cut.querySelector('[data-id="door"]').classList.toggle("fl-open",!!s.door);
    const ov=cut.querySelector(".fl-ov");
    ov.innerHTML = (s.bubble?`<circle class="fl-bub" cx="100" cy="150" r="5"/>`:"")
      + (s.pinch?`<g class="fl-pinch"><rect x="86" y="560" width="28" height="7" rx="2"/><text x="120" y="568">สายถูกหนีบ</text></g>`:"")
      + (s.door?`<g class="fl-doortag"><rect x="18" y="300" width="50" height="20" rx="4"/><text x="43" y="314" text-anchor="middle">ฝาเปิด</text></g>`:"");
  }

  /* ---------- แสดงผลตามโหมด ---------- */
  function showStep(){
    clearTimers();
    const st=sc.steps[k];
    setFlows(st.normal?D.normalLoop:st.f);
    applyCut(st.cut);
    root.querySelector(".fl-cap").innerHTML=`<div class="kicker">ขั้นที่ ${k+1} / ${sc.steps.length}</div><p>${esc(st.t)}</p>`;
    root.querySelector("#fl-prev").disabled=k===0;
    root.querySelector("#fl-next").disabled=k===sc.steps.length-1 && !auto;
    root.querySelector("#fl-next").textContent=k===sc.steps.length-1?"จบ":"ถัดไป ▶";
    if(auto) timers.push(setTimeout(()=>{ if(k<sc.steps.length-1){k++;showStep();} else { auto=false; syncAuto(); } }, 5200));
  }
  function syncAuto(){ const b=root.querySelector("#fl-auto"); if(b){ b.classList.toggle("on",auto); b.textContent=auto?"■ หยุดเล่นอัตโนมัติ":"▶ เล่นอัตโนมัติ"; } }

  function showCont(){
    clearTimers();
    const cap=root.querySelector(".fl-cap");
    setFlows(D.normalLoop); applyCut({run:true, screen:"RATE 100 mL/h"});
    if(sc.id==="normal"){
      cap.innerHTML=`<p>สัญญาณทุกเส้นทำงานพร้อมกัน: <b class="c-cmd">คำสั่ง</b>วิ่งจาก MCU ไปมอเตอร์ <b class="c-fb">สัญญาณย้อนกลับ</b>จาก encoder ยืนยันการหมุน <b class="c-mon">การเฝ้าระวัง</b>จาก sensor ทุกตัวเข้า MCU ตลอดเวลา และ<b class="c-out">แสดงผล</b>บนจอ</p>`;
      return;
    }
    let n=5; cap.innerHTML=`<p>เครื่องทำงานปกติ… อีก <b id="fl-cd">${n}</b> วินาทีจะเกิดเหตุ</p>`;
    const cd=()=>{ n--; const e=root.querySelector("#fl-cd"); if(n>0){ if(e) e.textContent=n; timers.push(setTimeout(cd,1000)); } else fire(); };
    timers.push(setTimeout(cd,1000));
    function fire(){
      const all=[]; const seen={};
      sc.steps.slice(1).forEach(s=>(s.f||[]).forEach(([id,t])=>{ const key=id; if(t==="stop"||!seen[key]){ seen[key]=t; } }));
      Object.entries(seen).forEach(([id,t])=>all.push([id,t]));
      setFlows(all); applyCut(sc.steps[sc.steps.length-1].cut);
      if(sc.id==="air") applyCut(Object.assign({},sc.steps[sc.steps.length-1].cut,{bubble:true}));
      cap.innerHTML=`<p><b class="c-alarm">เกิดเหตุ!</b> ${esc(sc.steps[1].t)}</p><p>MCU ตัดคำสั่งไปที่มอเตอร์ทันที แล้วสั่ง buzzer และจอให้เตือนผู้ใช้ ภายในเวลาไม่ถึงวินาที</p><div class="tools"><button id="fl-re">เล่นใหม่</button></div>`;
      root.querySelector("#fl-re").onclick=showCont;
    }
  }

  function render(){
    root.innerHTML=`
      <div class="fl-bar">
        <div class="seg fl-top">${["step","cont"].map(m=>`<button data-m="${m}" class="${mode===m?"on":""}">${m==="step"?"ทีละขั้น":"ต่อเนื่อง"}</button>`).join("")}</div>
        <div class="chips fl-sc">${D.scenarios.map(s=>`<button data-s="${s.id}" class="${s.id===sc.id?"on":""} ${s.id!=="normal"?"al":""}">${esc(s.n)}</button>`).join("")}</div>
      </div>
      <div class="fl-legend">${["cmd","fb","mon","out","alarm"].map(t=>`<span><i class="lg-${t}"></i>${TYPES[t]}</span>`).join("")}</div>
      <div class="seg fl-mob"><button data-v="blk" class="${mobView==="blk"?"on":""}">แผนผังสัญญาณ</button><button data-v="cut" class="${mobView==="cut"?"on":""}">ภาพในเครื่อง</button></div>
      <div class="fl-grid fl-show-${mobView}">
        <figure class="fl-b">${blockSVG()}<figcaption>เส้นทางสัญญาณระหว่างชิ้นส่วน</figcaption></figure>
        <div class="fl-side">
          <figure class="fl-c"><div class="fl-cutbox"></div><figcaption>สิ่งที่เกิดขึ้นในตัวเครื่อง</figcaption></figure>
          <div class="fl-cap"></div>
          ${mode==="step"?`<div class="tools fl-ctl"><button id="fl-prev">◀ ก่อนหน้า</button><button class="primary" id="fl-next">ถัดไป ▶</button><button id="fl-auto">▶ เล่นอัตโนมัติ</button></div>`:""}
        </div>
      </div>`;
    blk=root.querySelector(".flsvg");
    cut=cutClone(); if(cut) root.querySelector(".fl-cutbox").appendChild(cut);
    root.querySelectorAll(".fl-top [data-m]").forEach(b=>b.onclick=()=>{ mode=b.dataset.m; k=0; auto=false; render(); });
    root.querySelectorAll(".fl-sc [data-s]").forEach(b=>b.onclick=()=>{ sc=D.scenarios.find(x=>x.id===b.dataset.s); k=0; auto=false; render(); });
    root.querySelectorAll(".fl-mob [data-v]").forEach(b=>b.onclick=()=>{ mobView=b.dataset.v;
      root.querySelectorAll(".fl-mob button").forEach(x=>x.classList.toggle("on",x===b));
      const g=root.querySelector(".fl-grid"); g.className="fl-grid fl-show-"+mobView; });
    if(mode==="step"){
      root.querySelector("#fl-prev").onclick=()=>{ if(k>0){k--;showStep();} };
      root.querySelector("#fl-next").onclick=()=>{ if(k<sc.steps.length-1){k++;showStep();} };
      root.querySelector("#fl-auto").onclick=()=>{ auto=!auto; syncAuto(); showStep(); };
      showStep(); syncAuto();
    } else showCont();
    if(!raf) raf=requestAnimationFrame(tick);
  }

  function start(el){ root=el; render(); }
  function stop(){ clearTimers(); auto=false; if(raf) cancelAnimationFrame(raf); raf=0; }

  window.Flow={start, stop};
})();
