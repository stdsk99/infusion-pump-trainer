/* ===== โหมดเรียนรู้: ฉากแอนิเมชันทีละขั้น ===== */
(function(){
  const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const STAGES = ["อาการ","ตรวจ","วินิจฉัย","ซ่อม","ทดสอบ","สรุป"];
  let muted = false;
  try{ muted = localStorage.getItem("ipt-mute")==="1"; }catch(e){}

  /* ---------- ภาพเครื่อง (ใช้ร่วมกับโหมดสอบ) ---------- */
  function pumpSVG(){
    let fingers="";
    for(let i=0;i<6;i++) fingers+=`<rect class="lp-f" x="${112+i*16}" y="180" width="12" height="20" rx="2" style="animation-delay:${(i*0.2).toFixed(1)}s"/>`;
    return `<svg class="lp" viewBox="0 0 360 252" role="img" aria-label="ภาพเครื่อง infusion pump จำลอง แสดงสถานะการทำงาน">
      <text class="lp-t" x="36" y="10" text-anchor="middle">ถุงสารละลาย</text>
      <rect x="14" y="14" width="44" height="54" rx="8" class="lp-bag"/>
      <g class="lp-part" data-p="drop">
        <rect class="lp-hit" x="12" y="68" width="48" height="36" rx="6"/>
        <rect x="28" y="72" width="16" height="28" rx="4" class="lp-st"/>
        <rect x="18" y="80" width="8" height="12" rx="2" class="lp-acc"/><rect x="46" y="80" width="8" height="12" rx="2" class="lp-acc"/>
        <circle class="lp-drop" cx="36" cy="77" r="2.5"/>
      </g>
      <path class="lp-tube" d="M36 100 V196 Q36 206 46 206 H344 Q352 206 352 214 V252"/>
      <path class="lp-flow" d="M36 100 V196 Q36 206 46 206 H344 Q352 206 352 214 V252"/>
      <text class="lp-t" x="346" y="250" text-anchor="end">ผู้ป่วย</text>
      <rect x="64" y="112" width="272" height="128" rx="14" class="lp-body"/>
      <rect x="80" y="124" width="150" height="40" rx="6" class="lp-scr"/>
      <text class="lp-scrt" x="92" y="149">RATE 100 mL/h</text>
      <circle class="lp-led" cx="248" cy="136" r="6"/>
      <g class="lp-snd"><path d="M262 130 q5 6 0 12"/><path d="M268 126 q9 10 0 20"/></g>
      <g class="lp-batt"><rect x="238" y="150" width="22" height="10" rx="2" class="lp-st"/><rect x="260" y="153" width="2" height="4" class="lp-bt"/><rect class="lp-bl" x="240" y="152" width="18" height="6" rx="1"/></g>
      <circle class="lp-ac" cx="270" cy="155" r="3"/><text class="lp-t" x="275" y="158">AC</text>
      <g class="lp-keys"><rect x="288" y="124" width="14" height="10" rx="2"/><rect x="306" y="124" width="14" height="10" rx="2"/><rect x="288" y="138" width="14" height="10" rx="2"/><rect x="306" y="138" width="14" height="10" rx="2"/><rect x="288" y="152" width="14" height="10" rx="2"/><rect x="306" y="152" width="14" height="10" rx="2"/></g>
      <rect x="64" y="212" width="272" height="6" class="lp-platen"/>
      <g class="lp-part" data-p="door"><rect class="lp-hit" x="66" y="166" width="16" height="18" rx="3"/><rect x="70" y="171" width="8" height="8" rx="1" class="lp-hall"/></g>
      <g class="lp-part" data-p="occ_up"><rect class="lp-hit" x="80" y="186" width="22" height="34" rx="4"/><rect x="84" y="190" width="14" height="12" rx="2" class="lp-low"/></g>
      <g class="lp-part" data-p="fingers"><rect class="lp-hit" x="106" y="168" width="100" height="52" rx="4"/><rect x="108" y="172" width="98" height="6" rx="2" class="lp-cam"/>${fingers}</g>
      <g class="lp-part" data-p="motor"><rect class="lp-hit" x="206" y="166" width="16" height="18" rx="3"/><circle class="lp-enc" cx="214" cy="175" r="5"/></g>
      <g class="lp-part" data-p="occ_down"><rect class="lp-hit" x="214" y="186" width="22" height="34" rx="4"/><rect x="218" y="190" width="14" height="12" rx="2" class="lp-low"/></g>
      <g class="lp-part" data-p="air"><rect class="lp-hit" x="246" y="182" width="38" height="54" rx="5"/><rect x="252" y="188" width="26" height="12" rx="2" class="lp-hi"/><rect x="252" y="220" width="26" height="12" rx="2" class="lp-hi"/></g>
      <g class="lp-dooropen"><rect x="120" y="214" width="86" height="16" rx="4"/><text x="163" y="226" text-anchor="middle">ฝาเปิด</text></g>
      <circle class="lp-bub" cx="64" cy="206" r="4.5"/>
      <g class="lp-syr"><rect x="40" y="226" width="20" height="8" rx="2"/><line x1="60" y1="230" x2="66" y2="212"/></g>
      <text class="lp-t lp-lbl" x="91" y="232" text-anchor="middle">occ↑</text>
      <text class="lp-t lp-lbl" x="158" y="232" text-anchor="middle">กลไกบีบสาย</text>
      <text class="lp-t lp-lbl" x="225" y="232" text-anchor="middle">occ↓</text>
      <text class="lp-t" x="265" y="246" text-anchor="middle">air sensor</text>
    </svg>`;
  }

  /* ภาพขยายชิ้นส่วน: ชื่อ "ชนิด_สถานะ" */
  const ZT = {air:"ภาพขยายร่อง air sensor", door:"ภาพขยายฝาและ Hall sensor", enc:"ภาพขยายจาน encoder", set:"ภาพตัดขวางชุดสาย", fuse:"ภาพขยาย fuse", aff:"ภาพขยาย anti-free-flow clamp"};
  function zoomSVG(kind){
    const swab=`<g class="zm-swab"><rect x="0" y="40" width="70" height="5" rx="2"/><ellipse cx="74" cy="42" rx="10" ry="7"/></g>`;
    const tool=`<g class="zm-tool"><circle cx="150" cy="22" r="14"/><path d="M143 22 h14 M150 15 v14"/></g>`;
    const k=kind.split("_")[0];
    let b="";
    if(k==="air") b=`<rect x="20" y="8" width="140" height="20" rx="3" class="lp-hi"/><rect x="20" y="76" width="140" height="20" rx="3" class="lp-hi"/>
      <rect x="10" y="34" width="160" height="36" rx="18" class="zm-tube"/>
      <g class="zm-res"><path d="M30 28 q8 7 16 1 q10 6 18 0 q6 5 14 0 v3 h-48z"/><path d="M96 28 q8 6 15 0 q9 7 20 1 q6 4 12 -1 v3 h-47z"/><path d="M34 76 q9 -7 18 -1 q8 -6 17 0 v-2 h-35z"/><path d="M104 76 q8 -6 18 0 q10 -7 22 -1 v-2 h-40z"/></g>
      ${swab}<text x="90" y="56" text-anchor="middle" class="zm-t">สายเต็มน้ำ</text>`;
    if(k==="door") b=`<rect x="10" y="10" width="160" height="34" rx="4" class="zm-panel"/><text x="18" y="24" class="zm-t">ฝา</text>
      <circle cx="90" cy="34" r="11" class="zm-hole"/><circle cx="90" cy="34" r="9" class="zm-mag"/>
      <rect x="10" y="62" width="160" height="34" rx="4" class="zm-body"/><text x="18" y="90" class="zm-t">ตัวเครื่อง</text>
      <rect x="82" y="64" width="16" height="10" rx="2" class="lp-hall"/><text x="104" y="73" class="zm-t">Hall sensor</text>
      <g class="zm-ext"><rect x="76" y="-30" width="28" height="18" rx="3"/><text x="90" y="-17" text-anchor="middle">N S</text></g>`;
    if(k==="enc"){ let sl=""; for(let i=0;i<16;i++){const a=i*Math.PI/8; sl+=`<line x1="${90+20*Math.cos(a)}" y1="${52+20*Math.sin(a)}" x2="${90+34*Math.cos(a)}" y2="${52+34*Math.sin(a)}"/>`;}
      b=`<circle cx="90" cy="52" r="38" class="zm-disc"/><g class="zm-slot">${sl}</g><circle cx="90" cy="52" r="6" class="zm-hub"/>
      <rect x="128" y="38" width="22" height="28" rx="3" class="zm-fork"/><text x="139" y="80" text-anchor="middle" class="zm-t">ตัวอ่าน</text>
      <g class="zm-res"><circle cx="112" cy="40" r="5"/><circle cx="118" cy="58" r="4"/><circle cx="106" cy="70" r="5"/><circle cx="70" cy="30" r="4"/></g>${swab}`; }
    if(k==="set") b=`<circle cx="48" cy="46" r="30" class="zm-wall"/><circle cx="48" cy="46" r="20" class="zm-lumen"/>
      <circle cx="132" cy="46" r="30" class="zm-wall"/><circle cx="132" cy="46" r="15" class="zm-lumen"/>
      <text x="48" y="92" text-anchor="middle" class="zm-t">ที่กำหนด · ID 3.0</text><text x="132" y="92" text-anchor="middle" class="zm-t zm-bad">ที่หน่วยงานใช้ · ID 2.7</text>`;
    if(k==="fuse") b=`<rect x="30" y="36" width="120" height="32" rx="14" class="zm-glass"/><rect x="18" y="34" width="22" height="36" rx="3" class="zm-cap"/><rect x="140" y="34" width="22" height="36" rx="3" class="zm-cap"/>
      <path class="zm-wire ok" d="M40 52 H140"/><path class="zm-wire br" d="M40 52 H84 M98 52 H140"/><circle class="zm-burn" cx="91" cy="52" r="8"/>
      <text x="90" y="90" text-anchor="middle" class="zm-t">fuse ขนาดเดิม (เช่น T2A)</text>${tool}`;
    if(k==="aff") b=`<rect x="10" y="62" width="160" height="12" rx="6" class="zm-tube zm-tb"/><ellipse cx="90" cy="68" rx="20" ry="6" class="zm-tube zm-tf"/>
      <rect x="70" y="40" width="40" height="18" rx="3" class="zm-lever"/>
      <path class="zm-spring ok" d="M90 8 l8 4 l-16 6 l16 6 l-16 6 l8 4 v6"/>
      <path class="zm-spring br" d="M90 8 l8 4 l-16 6 l6 3 M86 27 l-4 3 l8 4 v6"/>
      <text x="124" y="20" class="zm-t">สปริง</text><text x="118" y="52" class="zm-t">ตัวหนีบ</text><text x="14" y="90" class="zm-t">สาย</text>${tool}`;
    return `<svg class="zm zm-${k} ${kind}" viewBox="${k==="door"?"0 -34 180 138":"0 0 180 104"}" role="img" aria-label="${ZT[k]}">${b}</svg>`;
  }

  function scopeSVG(miss){
    let d="M0 50", x=0;
    for(let i=0;i<40;i++){ const skip = miss && (i%5===2); d+= skip?` H${x+20}`:` H${x+5} V20 H${x+15} V50 H${x+20}`; x+=20; }
    let grid=""; for(let i=1;i<10;i++) grid+=`<line x1="${i*20}" y1="0" x2="${i*20}" y2="70"/>`; for(let j=1;j<4;j++) grid+=`<line x1="0" y1="${j*17.5}" x2="200" y2="${j*17.5}"/>`;
    return `<svg class="scope" viewBox="0 0 200 70" role="img" aria-label="สัญญาณ encoder บนออสซิลโลสโคป"><rect width="200" height="70" class="sc-bg"/><g class="sc-grid">${grid}</g><g class="sc-tr"><path d="${d}"/></g></svg>`;
  }

  /* ---------- ใช้สถานะกับภาพ ---------- */
  function applyVis(box, v){
    v = v||{};
    const svg = box.querySelector("svg.lp"); if(!svg) return;
    clearTimeout(box._t1);
    const scr = svg.querySelector(".lp-scrt");
    svg.classList.toggle("run", !!v.run);
    svg.classList.toggle("alarm", !!v.alarm && !v.alarmDelay);
    svg.classList.toggle("off", v.screen==="off");
    svg.classList.toggle("dopen", v.door==="open");
    svg.classList.toggle("fast", !!v.fast);
    svg.classList.toggle("noac", v.ac===false || v.screen==="off");
    const lvl = v.batt===undefined ? 100 : v.batt, bl=svg.querySelector(".lp-bl");
    bl.setAttribute("width", Math.max(0,18*lvl/100)); bl.classList.toggle("low", lvl<25);
    scr.textContent = v.alarm && !v.alarmDelay ? "⚠ "+v.alarm : (v.screen && v.screen!=="off" ? v.screen : (v.screen==="off"?"":"RATE 100 mL/h"));
    svg.querySelectorAll(".lp-part").forEach(p=>p.classList.toggle("hl", p.dataset.p===v.hi));
    svg.classList.remove("inject");
    box.classList.remove("working");
    if(v.alarm && v.alarmDelay){
      svg.classList.add("run");
      box._t1 = setTimeout(()=>{ svg.classList.remove("run"); svg.classList.add("alarm"); scr.textContent="⚠ "+v.alarm; beep(); }, v.alarmDelay);
    }
    const ins = box.querySelector(".ins"); if(!ins) return;
    let h="";
    if(v.gauge){ const g=v.gauge, mx=g.max||100;
      h+=`<div class="inst"><div class="inst-n">${esc(g.n)}</div>
      <div class="gauge"><div class="g-fill"></div>${g.th!==undefined?`<div class="g-th" style="left:${Math.min(100,g.th/mx*100)}%"><span>${esc(g.thl||"เกณฑ์ "+g.th+(g.unit||""))}</span></div>`:""}</div>
      <div class="g-v">0${esc(g.unit||"")}</div></div>`; }
    if(v.meter) h+=`<div class="inst"><div class="inst-n">${esc(v.meter.n)}</div><div class="meter big">${esc(v.meter.v)}</div></div>`;
    if(v.scope) h+=`<div class="inst"><div class="inst-n">${esc(v.scope.n)}</div>${scopeSVG(v.scope.miss)}<div class="small muted">${esc(v.scope.cap||"")}</div></div>`;
    if(v.zoom){ const z = v.zoom==="dirty"?"air_dirty":v.zoom==="clean"?"air_clean":v.zoom;
      h+=`<div class="inst"><div class="inst-n">${ZT[z.split("_")[0]]}</div>${zoomSVG(z)}</div>`; }
    ins.innerHTML=h;
    if(v.gauge) animGauge(ins, v.gauge);
  }
  function animGauge(ins,g){
    const f=ins.querySelector(".g-fill"), t=ins.querySelector(".g-v"), mx=g.max||100, u=g.unit||"";
    const bad = g.bad==="below" ? (x=>x<g.th) : g.bad==="above" ? (x=>x>g.th) : (()=>false);
    const pct = x=>Math.min(100,Math.max(0,x/mx*100))+"%";
    const from = g.still ? g.v : (g.from||0);
    f.style.transition="none"; f.style.width=pct(from);
    f.classList.toggle("bad",bad(from)); t.textContent=from+u;
    if(g.still){ f.classList.toggle("bad",bad(g.v)); return; }
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      f.style.transition="width 1.6s cubic-bezier(.3,.7,.3,1), background .3s"; f.style.width=pct(g.v);
      const t0=performance.now();
      (function tick(now){ const k=Math.min(1,(now-t0)/1600), e=1-Math.pow(1-k,3), x=Math.round(from+(g.v-from)*e);
        t.textContent=x+u; f.classList.toggle("bad",bad(x)); if(k<1) requestAnimationFrame(tick); })(t0);
    }));
  }

  /* แอนิเมชันพิเศษ แล้วเรียก done เมื่อจบ */
  function runAnim(box, name, done){
    const svg = box.querySelector("svg.lp");
    if(name==="inject"){
      svg.classList.remove("inject"); void svg.getBoundingClientRect(); svg.classList.add("inject");
      box._t1=setTimeout(done, 2300);
    }else if(name==="wipe"){
      const zm=box.querySelector(".zm"); if(zm){ zm.classList.add("wiping"); }
      box._t1=setTimeout(()=>{ if(zm){zm.classList.add("clean");} setTimeout(done,500); }, 1800);
    }else if(name==="magnet"){
      const zm=box.querySelector(".zm"); if(zm) zm.classList.add("magin");
      box._t1=setTimeout(done, 1800);
    }else if(name==="work"){
      box.classList.add("working");
      box._t1=setTimeout(()=>{ box.classList.remove("working"); done(); }, 1800);
    }else if(name==="rerun"){
      box._t1=setTimeout(done, 2400);
    }else done();
  }

  let actx=null;
  function beep(){
    if(muted) return;
    try{
      actx = actx || new (window.AudioContext||window.webkitAudioContext)();
      [0,0.28,0.56].forEach(d=>{
        const o=actx.createOscillator(), g=actx.createGain();
        o.type="square"; o.frequency.value=880; g.gain.value=0.04;
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime+d); o.stop(actx.currentTime+d+0.16);
      });
    }catch(e){}
  }

  /* ---------- ภาพอาการสำหรับโหมดสอบ (ไม่เน้นชิ้นส่วน เพื่อไม่บอกใบ้) ---------- */
  function mini(el, c){
    el.innerHTML = `<div class="lpbox mini">${pumpSVG()}</div>`;
    const a=c.alarm||"";
    const v = a.includes("จอดับ") ? {screen:"off", ac:false} : a.startsWith("ไม่มี") ? {run:true} : {alarm:a};
    if(/BATTERY/.test(a)){ v.batt=12; v.ac=false; }
    applyVis(el.querySelector(".lpbox"), v);
  }

  /* ---------- ตัวเล่นฉาก ---------- */
  function start(id, root, hooks){
    const L = window.LEARN.find(x=>x.id===id); if(!L) return;
    const st = {k:0, tries:0, firstOk:0, picked:null, answered:false, log:[]};
    const qs = L.scenes.filter(s=>s.opts).length;

    function stageBar(stage){
      const si=STAGES.indexOf(stage);
      return `<ol class="stepper">${STAGES.map((s,i)=>`<li class="${i<si?"ok":i===si?"on":""}"><span>${i+1}</span>${s}</li>`).join("")}</ol>`;
    }

    function render(){
      const sc = L.scenes[st.k];
      if(!sc){ return summary(); }
      root.innerHTML = `
        <div class="simhead"><button class="ghost" id="ln-back">← รายการเคส</button>
          <div class="meta"><button class="ghost" id="ln-mute" aria-label="เปิด/ปิดเสียง">${muted?"🔇 ปิดเสียง":"🔊 เปิดเสียง"}</button></div></div>
        <h1>${esc(L.n)} <span class="tag">โหมดเรียนรู้</span></h1>
        ${stageBar(sc.stage)}
        <div class="lgrid">
          <div class="lpbox" id="lpbox">${pumpSVG()}<div class="wrk">🔧 กำลังดำเนินการ…</div><div class="ins"></div></div>
          <div class="lstory">
            <div class="kicker">ขั้นที่ ${st.k+1} / ${L.scenes.length} · ${esc(sc.stage)}</div>
            <h2>${esc(sc.title)}</h2>
            <p>${esc(sc.text)}</p>
            ${sc.opts?`<div class="lopts">${sc.opts.map((o,i)=>`<button class="lopt" data-i="${i}">${esc(o.t)}</button>`).join("")}</div>
              <div id="fb"></div>`
            :`<div class="tools"><button class="primary" id="ln-next">${esc(sc.next||"ต่อไป")} →</button></div>`}
          </div>
        </div>`;
      const box=root.querySelector("#lpbox");
      applyVis(box, sc.vis);
      if(sc.vis && sc.vis.alarm && !sc.vis.alarmDelay) beep();
      root.querySelector("#ln-back").onclick=()=>{clearTimeout(box._t1);hooks.onBack();};
      root.querySelector("#ln-mute").onclick=e=>{muted=!muted;try{localStorage.setItem("ipt-mute",muted?"1":"0")}catch(_){}
        e.currentTarget.textContent=muted?"🔇 ปิดเสียง":"🔊 เปิดเสียง";};
      const nx=root.querySelector("#ln-next"); if(nx) nx.onclick=()=>{st.k++;st.answered=false;st.tries=0;render();window.scrollTo(0,0);};
      root.querySelectorAll(".lopt").forEach(b=>b.onclick=()=>pick(+b.dataset.i));
    }

    function pick(i){
      const sc=L.scenes[st.k], o=sc.opts[i], box=root.querySelector("#lpbox");
      if(st.answered) return;
      const btns=[...root.querySelectorAll(".lopt")];
      btns.forEach(b=>b.disabled=true);
      btns[i].classList.add("picked");
      const fb=root.querySelector("#fb");
      fb.innerHTML=`<div class="fb wait">กำลังดำเนินการ… ดูภาพเครื่อง</div>`;
      const mob = window.innerWidth<900;
      if(mob) box.scrollIntoView({behavior:"smooth",block:"start"});
      if(o.vis) applyVis(box, o.vis); else applyVis(box, sc.vis);
      if(o.vis && o.vis.alarm) beep();
      runAnim(box, o.anim, ()=>{
        if(o.after){ applyVis(box, o.after); if(o.after.alarm) beep(); }
        const good = o.ok===true, mid=o.ok==="costly";
        if(good||mid){ st.answered=true; if(st.tries===0&&good) st.firstOk++; st.log.push({t:sc.title, a:(sc.opts.find(x=>x.ok===true)||o).t}); }
        else st.tries++;
        btns[i].classList.add(good?"good":mid?"mid":"bad");
        const last = st.k===L.scenes.length-1;
        fb.innerHTML=`<div class="fb ${good?"good":mid?"mid":"bad"}">
          <b>${good?"✓ ถูกต้อง":mid?"△ ได้ผล แต่ยังไม่ใช่วิธีที่ดีที่สุด":"✗ ยังไม่ใช่"}</b><p>${esc(o.fb)}</p>
          ${good||mid?`<button class="primary" id="ln-go">${last?"ดูสรุป":"ขั้นต่อไป"} →</button>`:`<button id="ln-retry">ลองตัวเลือกอื่น</button>`}</div>`;
        const go=root.querySelector("#ln-go"); if(go) go.onclick=()=>{st.k++;st.answered=false;st.tries=0;render();window.scrollTo(0,0);};
        const rt=root.querySelector("#ln-retry"); if(rt) rt.onclick=()=>{
          applyVis(box, sc.vis); fb.innerHTML="";
          btns.forEach((b,j)=>{ if(!b.classList.contains("bad")) b.disabled=false; b.classList.remove("picked"); });
        };
        if(mob) setTimeout(()=>fb.scrollIntoView({behavior:"smooth",block:"center"}), o.anim||o.vis?900:0);
      });
    }

    function summary(){
      const C = window.SIM.CASES.find(c=>c.id===id);
      window.Score&&Score.record({key:"learn:"+id, mod:"3-จำลองซ่อม (เรียนรู้)", item:L.n, score:st.firstOk, max:qs, detail:"ตอบถูกในครั้งแรก"});
      root.innerHTML = `
        <div class="simhead"><button class="ghost" id="ln-back">← รายการเคส</button></div>
        <h1>${esc(L.n)} <span class="tag">โหมดเรียนรู้</span></h1>
        ${stageBar("สรุป")}
        <div class="score ${st.firstOk===qs?"ok":st.firstOk>=qs-2?"mid":"bad"}"><div class="big">${st.firstOk}/${qs}</div><div>ข้อที่ตอบถูกในครั้งแรก</div></div>
        <h2>ลำดับการทำงานที่ถูกต้อง</h2>
        <ol class="recap">${st.log.map(l=>`<li><b>${esc(l.t)}</b><span>${esc(l.a)}</span></li>`).join("")}</ol>
        ${C?`<h2>ข้อคิด</h2><div class="learn"><p>${esc(C.learn)}</p></div>`:""}
        <div class="tools"><button id="ln-again">เรียนเคสนี้ใหม่</button>${C?`<button class="primary" id="ln-exam">ลองทำเคสนี้ในโหมดสอบ →</button>`:""}<button class="ghost" id="ln-list">รายการเคส</button></div>`;
      root.querySelector("#ln-back").onclick=hooks.onBack;
      root.querySelector("#ln-list").onclick=hooks.onBack;
      root.querySelector("#ln-again").onclick=()=>start(id,root,hooks);
      const ex=root.querySelector("#ln-exam"); if(ex) ex.onclick=()=>hooks.onExam(id);
      window.scrollTo(0,0);
    }
    render(); window.scrollTo(0,0);
  }

  window.Learn = {start, mini, has:id=>window.LEARN.some(x=>x.id===id)};
})();
