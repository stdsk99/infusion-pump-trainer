/* ===== โมดูล 5: เรียงลำดับขั้นตอน (แตะเพื่อเรียง) ===== */
(function(){
  const D=window.ORDER, root=document.getElementById("order");
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const LV={1:"ง่าย",2:"กลาง",3:"ยาก"};

  function list(){
    root.innerHTML=`<h1>ลำดับขั้นตอน</h1>
      <p class="muted">คะแนนนับจากจำนวนขั้นตอนที่อยู่ในลำดับก่อน-หลังถูกต้อง แตะขั้นตอนทีละข้อตามลำดับที่ควรทำ ถ้าแตะผิดก็แตะขั้นตอนนั้นในรายการที่เรียงแล้วเพื่อเอาออกได้ เรียงครบแล้วกดตรวจคำตอบ</p>
      <div class="cases">${D.map((o,i)=>`<button class="case" data-i="${i}"><span class="lv lv${o.lv}">${LV[o.lv]}</span><span class="ct">${esc(o.n)}</span><span class="cm">${o.steps.length} ขั้นตอน</span><span class="cb">${(()=>{const b=window.Score&&Score.bestOf("order:"+o.id);return b?`✓ ทำแล้ว · ดีที่สุด ${b.score}/${b.max}`:"ยังไม่ได้ทำ";})()}</span></button>`).join("")}</div>`;
    root.querySelectorAll(".case").forEach(b=>b.onclick=()=>play(+b.dataset.i));
  }

  /* ขั้นตอนที่อยู่ในลำดับสัมพัทธ์ที่ถูก = longest increasing subsequence */
  function lisMask(a){
    const n=a.length, len=Array(n).fill(1), prev=Array(n).fill(-1);
    for(let i=0;i<n;i++) for(let j=0;j<i;j++) if(a[j]<a[i]&&len[j]+1>len[i]){len[i]=len[j]+1;prev[i]=j;}
    let best=0; for(let i=1;i<n;i++) if(len[i]>len[best]) best=i;
    const m=Array(n).fill(false); for(let i=n?best:-1;i>=0;i=prev[i]) m[i]=true; return m;
  }
  function play(i){
    const o=D[i], n=o.steps.length;
    let pool=shuffle(o.steps.map((s,k)=>k)), seq=[], checked=false, tries=0;
    function draw(){
      const res = checked ? lisMask(seq) : [];
      const right = res.filter(Boolean).length;
      root.innerHTML=`<div class="simhead"><button class="ghost" id="od-back">← รายการ</button><div class="meta"><span>เรียงแล้ว <b>${seq.length}</b> / ${n}</span></div></div>
        <h1>${esc(o.n)}</h1><p class="muted">${esc(o.intro)}</p>
        <div class="odgrid">
          <div><h2>ลำดับของฉัน</h2>
            <ol class="seq">${seq.map((k,p)=>`<li class="${checked?(res[p]?"good":"bad"):""}"><button class="sq" data-p="${p}" ${checked?"disabled":""}><span class="sn">${p+1}</span><span>${esc(o.steps[k].t)}</span></button>
              ${checked&&!res[p]?`<div class="why">ควรเป็นขั้นที่ ${k+1} · ${esc(o.steps[k].why)}</div>`:checked?`<div class="why ok">${esc(o.steps[k].why)}</div>`:""}</li>`).join("")}
              ${!seq.length?`<li class="ph">แตะขั้นตอนจากรายการเพื่อเริ่มเรียง</li>`:""}</ol></div>
          <div><h2>ขั้นตอนที่ยังไม่ได้เรียง</h2>
            <div class="pool">${pool.map(k=>`<button class="pl" data-k="${k}">${esc(o.steps[k].t)}</button>`).join("")||`<p class="muted small">เรียงครบแล้ว</p>`}</div></div>
        </div>
        ${checked?`<div class="score ${right===n?"ok":right>=n*0.7?"mid":"bad"}"><div class="big">${right}/${n}</div><div>ขั้นตอนที่อยู่ในลำดับถูกต้อง</div></div>`:""}
        <div class="tools">${!checked?`<button class="primary" id="od-chk" ${seq.length<n?"disabled":""}>ตรวจคำตอบ</button><button class="ghost" id="od-rs">เริ่มใหม่</button>`
          :`${right<n?`<button class="primary" id="od-fix">เก็บข้อที่ถูกตั้งแต่ข้อแรกไว้ แล้วเรียงต่อ</button>`:""}<button id="od-new">สุ่มลำดับใหม่</button><button class="ghost" id="od-ans">ดูลำดับที่ถูกต้อง</button>`}</div>
        <div id="od-sol"></div>`;
      root.querySelector("#od-back").onclick=list;
      root.querySelectorAll(".pl").forEach(b=>b.onclick=()=>{const k=+b.dataset.k; pool=pool.filter(x=>x!==k); seq.push(k); draw();});
      root.querySelectorAll(".sq").forEach(b=>b.onclick=()=>{const p=+b.dataset.p; pool.push(seq[p]); seq.splice(p,1); draw();});
      const $=s=>root.querySelector(s);
      if($("#od-chk")) $("#od-chk").onclick=()=>{ checked=true; tries++;
        const r=lisMask(seq).filter(Boolean).length;
        if(tries===1) window.Score&&Score.record({key:"order:"+o.id, mod:"5-ลำดับขั้นตอน", item:o.n, score:r, max:n});
        draw(); };
      if($("#od-rs")) $("#od-rs").onclick=()=>{pool=shuffle(o.steps.map((s,k)=>k));seq=[];draw();};
      if($("#od-fix")) $("#od-fix").onclick=()=>{ let L=0; while(L<seq.length&&seq[L]===L) L++;
        pool=shuffle(seq.slice(L)); seq=seq.slice(0,L); checked=false; draw(); };
      if($("#od-new")) $("#od-new").onclick=()=>play(i);
      if($("#od-ans")) $("#od-ans").onclick=()=>{ $("#od-sol").innerHTML=`<h2>ลำดับที่ถูกต้อง</h2><ol class="recap">${o.steps.map(s=>`<li><b>${esc(s.t)}</b><span>${esc(s.why)}</span></li>`).join("")}</ol>`; };
    }
    draw(); window.scrollTo(0,0);
  }

  window.Views=window.Views||{}; window.Views.order={show:()=>{ if(!root.innerHTML||root.querySelector('.cases')) list(); }};
})();
