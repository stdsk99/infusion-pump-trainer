/* ===== โมดูล 6: แบบทดสอบ ===== */
(function(){
  const Q=window.QUIZ, root=document.getElementById("quiz");
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const L="กขคง";

  function intro(){
    const n=Math.min(Q.perTest,Q.bank.length), cats=[...new Set(Q.bank.map(b=>b.t))];
    root.innerHTML=`<h1>แบบทดสอบ</h1>
      <p class="muted">สุ่ม ${n} ข้อจากคลัง ${Q.bank.length} ข้อ ครอบคลุม ${cats.join(" · ")} ตอบให้ครบทุกข้อแล้วกดส่ง จึงจะเห็นคะแนนและเฉลย</p>
      ${(()=>{const b=window.Score&&Score.bestOf("quiz");return b?`<p class="hint">คะแนนดีที่สุดของคุณ: ${b.score}/${b.max} (${Math.round(b.v*100)}%)</p>`:"";})()}<div class="tools"><button class="primary" id="qz-go">เริ่มทำแบบทดสอบ</button></div>`;
    root.querySelector("#qz-go").onclick=start;
  }

  function start(){
    const qs=(window.QPick?QPick.pick("quiz",Q.bank,Q.perTest):shuffle(Q.bank).slice(0,Math.min(Q.perTest,Q.bank.length))).map(b=>{
      const ord=shuffle(b.o.map((t,k)=>k)); return {...b, ord, ans:ord.indexOf(0), pick:null};});
    let i=0;
    function draw(){
      const q=qs[i], done=qs.filter(x=>x.pick!==null).length;
      root.innerHTML=`<div class="simhead"><span class="muted">ตอบแล้ว ${done} / ${qs.length}</span><button class="ghost" id="qz-x">ยกเลิก</button></div>
        <div class="qnav">${qs.map((x,k)=>`<button class="${k===i?"on":""} ${x.pick!==null?"dn":""}" data-k="${k}">${k+1}</button>`).join("")}</div>
        <div class="kicker">ข้อ ${i+1} · ${esc(q.t)}</div><h2>${esc(q.q)}</h2>
        <div class="lopts">${q.ord.map((k,j)=>`<button class="lopt ${q.pick===j?"picked":""}" data-j="${j}"><b>${L[j]}.</b>&nbsp;${esc(q.o[k])}</button>`).join("")}</div>
        <div class="tools"><button id="qz-p" ${i===0?"disabled":""}>← ก่อนหน้า</button>${i<qs.length-1?`<button class="primary" id="qz-n">ถัดไป →</button>`:`<button class="primary" id="qz-s">ส่งคำตอบ</button>`}</div>
        <div id="qz-m"></div>`;
      root.querySelectorAll(".qnav button").forEach(b=>b.onclick=()=>{i=+b.dataset.k;draw();});
      root.querySelectorAll(".lopt").forEach(b=>b.onclick=()=>{q.pick=+b.dataset.j; if(i<qs.length-1){i++;} draw();});
      root.querySelector("#qz-x").onclick=intro;
      const p=root.querySelector("#qz-p"); if(p) p.onclick=()=>{i--;draw();};
      const n=root.querySelector("#qz-n"); if(n) n.onclick=()=>{i++;draw();};
      const s=root.querySelector("#qz-s"); if(s) s.onclick=()=>{
        const left=qs.map((x,k)=>x.pick===null?k+1:null).filter(Boolean);
        if(left.length){ root.querySelector("#qz-m").innerHTML=`<div class="msg bad">ยังไม่ได้ตอบข้อ ${left.join(", ")}</div>`; return; }
        result(qs); };
    }
    draw(); window.scrollTo(0,0);
  }

  function result(qs){
    const ok=qs.filter(q=>q.pick===q.ans).length, n=qs.length, pct=Math.round(ok/n*100);
    const byCat={}; qs.forEach(q=>{byCat[q.t]=byCat[q.t]||[0,0]; byCat[q.t][1]++; if(q.pick===q.ans) byCat[q.t][0]++;});
    window.Score&&Score.record({key:"quiz", mod:(window.APP_CONFIG||{}).quizMod||"9-สอบรวม", item:"แบบทดสอบ "+n+" ข้อ", score:ok, max:n, detail:Object.entries(byCat).map(([k,v])=>k+" "+v[0]+"/"+v[1]).join(", "), q:window.QPick?QPick.ids(qs):""});
    root.innerHTML=`<h1>ผลแบบทดสอบ</h1>
      <div class="score ${pct>=80?"ok":pct>=60?"mid":"bad"}"><div class="big">${ok}/${n}</div><div>${pct}%</div></div>
      <div class="sumrow">${Object.entries(byCat).map(([k,v])=>`<div><small>${esc(k)}</small><b>${v[0]}/${v[1]}</b></div>`).join("")}</div>
      <h2>เฉลย</h2>
      ${qs.map((q,k)=>{const good=q.pick===q.ans; return `<div class="alarm"><div class="qr ${good?"good":"bad"}">
        <b>${k+1}. ${esc(q.q)}</b>
        <div>${good?"✓":"✗"} คำตอบของคุณ: ${L[q.pick]}. ${esc(q.o[q.ord[q.pick]])}</div>
        ${good?"":`<div class="okans">คำตอบที่ถูก: ${L[q.ans]}. ${esc(q.o[0])}</div>`}
        <div class="muted small">${esc(q.e)}</div></div></div>`;}).join("")}
      <div class="tools"><button class="primary" id="qz-r">ทำชุดใหม่</button></div>`;
    root.querySelector("#qz-r").onclick=start; window.scrollTo(0,0);
  }

  window.Views=window.Views||{}; window.Views.quiz={show:()=>{ if(!root.innerHTML||root.querySelector('#qz-go')) intro(); }};
})();
