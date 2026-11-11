/* ===== โมดูล 7 ตรวจรับเครื่อง และโมดูล 8 PM ตามแผน (ไฟล์เดียวกันทั้งแอปปั๊มและตู้อบ) =====
   ข้อมูลอยู่ใน data/svc.js (window.SVC) ของแต่ละแอป
   โมดูล 7: บทเรียน + ใบตรวจรับจำลอง 4 กรณี × 5 ข้อ = 20 คะแนน → key "accept"
   โมดูล 8: บทเรียน + ก. วางแผน PM (ตัดสินทีละเครื่อง) + ข. ทำ PM จำลอง (ตัดสินทีละรายการ + สรุปผล) = 20 คะแนน → key "pmplan"
   นับคะแนนจากคำตอบแรกของแต่ละข้อ เกณฑ์ผ่าน ≥ 80% (ตาม criteria.acceptPct / pmPct)
   ส่งคะแนนครั้งเดียวเมื่อทำครบทั้งโมดูล (ระหว่างทำเก็บผลไว้ในเครื่อง) */
(function(){
  const S=window.SVC, C=window.APP_CONFIG||{}, CR=C.criteria||{};
  if(!S) return;
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ST=(C.store||"app")+"-svc-part";
  const sid=()=>{ const p=window.Score&&Score.profile(); return p?p.sid:""; };
  const loadP=()=>{ try{ const o=JSON.parse(localStorage.getItem(ST)); return o&&o.sid===sid()?o:{sid:sid()}; }catch(e){ return {sid:sid()}; } };
  const saveP=o=>{ try{ localStorage.setItem(ST,JSON.stringify(o)); }catch(e){} };

  function block([t,c]){
    if(t==="p") return `<p>${c}</p>`;
    if(t==="h") return `<h3>${c}</h3>`;
    if(t==="ul") return `<ul>${c.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    if(t==="ol") return `<ol>${c.map(x=>`<li>${x}</li>`).join("")}</ol>`;
    if(t==="tbl") return `<div class="tblwrap"><table class="ltbl"><thead><tr>${c.h.map(h=>`<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${c.r.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if(t==="tip") return `<div class="hint">💡 ${c}</div>`;
    if(t==="warn") return `<div class="msg bad">⚠️ ${c}</div>`;
    if(t==="note") return `<div class="note small">${c}</div>`;
    return "";
  }
  const best=k=>{ const b=window.Score&&Score.bestOf(k); return b?Math.round(b.v*100):null; };
  function statusBar(key, pct){
    const b=best(key);
    return `<div class="tstat"><b>คะแนนโมดูลนี้</b>${b===null?`<span class="tp">○ ยังไม่ได้ทำแบบฝึก</span>`:`<span class="tp ${b>=pct?"ok":""}">${b>=pct?"✓":"○"} ดีที่สุด ${b}%</span>`}<span class="muted small">เกณฑ์ผ่าน ≥ ${pct}%</span></div>`;
  }
  /* ข้อเลือกตอบแบบมีคำอธิบาย: opts[0] คือข้อที่ถูก */
  function mcq(box, q, onDone, nextLabel){
    const ord=shuffle(q.opts.map((o,k)=>k));
    box.innerHTML=`<h3>${esc(q.q)}</h3><div class="lopts">${ord.map(k=>`<button class="lopt" data-k="${k}">${esc(q.opts[k][0])}</button>`).join("")}</div><div class="sv-f"></div>`;
    box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k, good=k===0;
      box.querySelectorAll("[data-k]").forEach(x=>{ x.disabled=true; if(x.dataset.k==="0") x.classList.add("good"); else if(x===b) x.classList.add("bad"); });
      const f=box.querySelector(".sv-f");
      f.innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง +1":"✗ ยังไม่ถูก"}</b><p>${esc(q.opts[k][1])}</p>${good?"":`<p><b>ที่ถูกคือ:</b> ${esc(q.opts[0][0])} · ${esc(q.opts[0][1])}</p>`}<button class="primary sv-n">${nextLabel}</button></div>`;
      f.querySelector(".sv-n").onclick=()=>onDone(good?1:0);
      if(window.innerWidth<900) f.scrollIntoView({behavior:"smooth",block:"start"});
    });
  }

  /* ================= โมดูล 7 ตรวจรับเครื่อง ================= */
  (function(){
    const D=S.accept, root=document.getElementById("accept"); if(!D||!root) return;
    const PCT=CR.acceptPct||80, MOD="7-ตรวจรับเครื่อง";
    let tab="learn", run=null;
    const MAX=D.cases.reduce((a,c)=>a+c.qs.length,0);
    function frame(body){
      root.innerHTML=`<h1>ตรวจรับเครื่อง (acceptance testing)</h1>
        <p class="muted">${esc(D.intro)}</p>
        ${statusBar("accept",PCT)}
        <div class="chips pmtabs"><button data-t="learn" data-seen="accept|accept-learn" class="${tab==="learn"?"on":""}">บทเรียน</button><button data-t="ex" class="${tab==="ex"?"on":""}">ใบตรวจรับจำลอง</button></div>
        <div id="ac-body">${body}</div>`;
      root.querySelectorAll(".pmtabs [data-t]").forEach(b=>b.onclick=()=>{ tab=b.dataset.t; render(); window.scrollTo(0,0); });
    }
    function learn(){ if(window.Seen) Seen.mark("accept","accept-learn", root); frame(`<article class="lesson">${D.learn.map(block).join("")}
      <div class="srcs"><b>แหล่งอ้างอิง</b><ul>${D.src.map(([n,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("")}</ul></div>
      <div class="tools"><button class="primary" id="ac-go">ไปใบตรวจรับจำลอง ▶</button></div></article>`);
      root.querySelector("#ac-go").onclick=()=>{ tab="ex"; render(); window.scrollTo(0,0); }; }
    function intro(){
      frame(`<p>รับเครื่องจำลอง ${D.cases.length} กรณี แต่ละกรณีมีข้อมูลเครื่องและผลการตรวจ ตอบทีละข้อ ${D.cases[0].qs.length} ข้อ รวม ${MAX} คะแนน นับจากคำตอบแรก ต้องได้ ≥ ${PCT}%</p>
        <ol class="recap">${D.cases.map(c=>`<li><b>${esc(c.n)}</b><span>${esc(c.story)}</span></li>`).join("")}</ol>
        <div class="tools"><button class="primary" id="ac-s">เริ่ม</button></div>`);
      root.querySelector("#ac-s").onclick=()=>{ run={ci:0,qi:0,pts:D.cases.map(()=>[])}; step(); };
    }
    function step(){
      const c=D.cases[run.ci], q=c.qs[run.qi], lastQ=run.qi===c.qs.length-1, lastC=run.ci===D.cases.length-1;
      frame(`<div class="simtop"><span class="kicker">กรณี ${run.ci+1} / ${D.cases.length} · ข้อ ${run.qi+1} / ${c.qs.length}</span></div>
        <h2>${esc(c.n)}</h2>
        <div class="pmgrid"><div><div class="order"><div class="tk-h"><span>📦 ข้อมูลที่ได้รับ</span></div><p>${esc(c.story)}</p></div>
          <div class="svinfo">${c.info.map(block).join("")}</div></div>
          <div id="ac-q"></div></div>`);
      mcq(root.querySelector("#ac-q"), q, pt=>{
        run.pts[run.ci][run.qi]=pt;
        if(!lastQ) run.qi++; else if(!lastC){ run.ci++; run.qi=0; } else return done();
        step(); window.scrollTo(0,0);
      }, !lastQ?"ข้อถัดไป →":!lastC?"กรณีถัดไป →":"ดูผลรวม");
    }
    function done(){
      const tot=run.pts.flat().reduce((a,b)=>a+b,0), pct=Math.round(tot/MAX*100);
      if(!run.saved){ run.saved=true; window.Score&&Score.record({key:"accept", mod:MOD, item:`ใบตรวจรับจำลอง ${D.cases.length} กรณี`, score:tot, max:MAX,
        detail:D.cases.map((c,i)=>c.id+" "+run.pts[i].reduce((a,b)=>a+b,0)+"/"+c.qs.length).join(", ")}); }
      frame(`<div class="score ${pct>=PCT?"ok":pct>=60?"mid":"bad"}"><div class="big">${tot}/${MAX}</div><div>${pct}% ${pct>=PCT?"· ผ่านเกณฑ์":"· เกณฑ์ผ่าน "+PCT+"%"}</div></div>
        <ol class="recap">${D.cases.map((c,i)=>`<li><b>${run.pts[i].reduce((a,b)=>a+b,0)}/${c.qs.length} · ${esc(c.n)}</b><span>ผลที่ถูก: ${esc(c.verdict)}</span></li>`).join("")}</ol>
        <div class="tools"><button class="primary" id="ac-a">ทำใหม่</button><a class="btn" href="#pmplan">ไปโมดูล 8 PM ▶</a></div>`);
      root.querySelector("#ac-a").onclick=()=>{ run={ci:0,qi:0,pts:D.cases.map(()=>[])}; step(); };
    }
    function render(){ if(tab==="learn") return learn(); if(run&&!run.saved) return step(); intro(); }
    window.Views=window.Views||{}; window.Views.accept={show:()=>{ if(!root.innerHTML) render(); }};
  })();

  /* ================= โมดูล 8 PM ตามแผน ================= */
  (function(){
    const D=S.pm, root=document.getElementById("pmplan"); if(!D||!root) return;
    const PCT=CR.pmPct||80, MOD="8-PM ตามแผน";
    const NP=D.plan.devices.length, NS=D.sim.items.length+1, MAX=NP+NS;
    let tab="learn", sim=null;
    function partBar(){
      const o=loadP(), one=(k,n,m)=>o[k]?`<span class="tp ok">✓ ${n} ${o[k].score}/${m}</span>`:`<span class="tp">○ ${n}</span>`;
      return `<div class="tstat small" style="margin-top:-4px">${one("plan","ก. วางแผน",NP)}${one("sim","ข. ทำ PM",NS)}<span class="muted">ทำครบทั้งสองส่วนแล้วระบบจึงส่งคะแนน</span></div>`;
    }
    function savePart(name, score){
      const o=loadP(); o[name]={score, t:Date.now()};
      if(o.plan&&o.sim){
        const sc=o.plan.score+o.sim.score;
        window.Score&&Score.record({key:"pmplan", mod:MOD, item:"วางแผน PM และทำ PM จำลอง", score:sc, max:MAX, detail:`วางแผน ${o.plan.score}/${NP} · ทำ PM ${o.sim.score}/${NS}`});
        try{ localStorage.removeItem(ST); }catch(e){}
        return {done:true, score:sc};
      }
      saveP(o); return {done:false};
    }
    function frame(body){
      root.innerHTML=`<h1>PM ตามแผน (inspection and preventive maintenance)</h1>
        <p class="muted">${esc(D.intro)}</p>
        ${statusBar("pmplan",PCT)}${partBar()}
        <div class="chips pmtabs"><button data-t="learn" data-seen="pmplan|pm-learn" class="${tab==="learn"?"on":""}">บทเรียน</button><button data-t="plan" class="${tab==="plan"?"on":""}">ก. วางแผน PM</button><button data-t="sim" class="${tab==="sim"?"on":""}">ข. ทำ PM จำลอง</button></div>
        <div id="pm9-body">${body}</div>`;
      root.querySelectorAll(".pmtabs [data-t]").forEach(b=>b.onclick=()=>{ tab=b.dataset.t; render(); window.scrollTo(0,0); });
    }
    function learn(){ if(window.Seen) Seen.mark("pmplan","pm-learn", root); frame(`<article class="lesson">${D.learn.map(block).join("")}
      <div class="srcs"><b>แหล่งอ้างอิง</b><ul>${D.src.map(([n,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("")}</ul></div>
      <div class="tools"><button class="primary" id="pm-go">ไป ก. วางแผน PM ▶</button></div></article>`);
      root.querySelector("#pm-go").onclick=()=>{ tab="plan"; render(); window.scrollTo(0,0); }; }

    /* ก. วางแผน: ตัดสินทีละเครื่องว่าต้องทำ PM เดือนนี้หรือไม่ แล้วตรวจพร้อมกัน */
    function plan(){
      const P=D.plan;
      frame(`<div class="order"><div class="tk-h"><span>🗓 โจทย์</span></div><p>${esc(P.task)}</p></div>
        <div class="tblwrap"><table class="ltbl svplan"><thead><tr><th>เครื่อง</th><th>ข้อมูล</th><th>เดือนนี้ต้องทำ PM?</th></tr></thead><tbody>
        ${P.devices.map((d,i)=>`<tr data-i="${i}"><td><b>${esc(d.id)}</b><br><span class="small muted">${esc(d.loc)}</span></td><td class="small">${d.info}</td>
          <td><div class="seg2"><button data-v="1">ต้องทำ</button><button data-v="0">ยังไม่ต้อง</button></div><div class="svwhy small"></div></td></tr>`).join("")}
        </tbody></table></div>
        <div class="tools"><button class="primary" id="pl-c" disabled>ตรวจคำตอบ</button></div><div id="pl-f"></div>`);
      const ans={};
      root.querySelectorAll(".svplan tr[data-i]").forEach(tr=>tr.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{
        if(tr.dataset.locked) return;
        ans[tr.dataset.i]=b.dataset.v==="1"; tr.querySelectorAll("[data-v]").forEach(x=>x.classList.toggle("on",x===b));
        root.querySelector("#pl-c").disabled=Object.keys(ans).length<NP;
      }));
      root.querySelector("#pl-c").onclick=()=>{
        let ok=0;
        root.querySelectorAll(".svplan tr[data-i]").forEach(tr=>{ const d=P.devices[tr.dataset.i], good=ans[tr.dataset.i]===d.due; if(good) ok++;
          tr.dataset.locked=1; tr.classList.add(good?"good":"bad");
          tr.querySelector(".svwhy").innerHTML=`${good?"✓":"✗"} ${d.due?"ต้องทำ":"ยังไม่ต้อง"} · ${esc(d.why)}`; });
        root.querySelector("#pl-c").remove();
        const r=savePart("plan", ok);
        root.querySelector("#pl-f").innerHTML=`<div class="fb ${ok>=NP*0.8?"good":"bad"}"><b>ได้ ${ok}/${NP}</b><p>${esc(P.lesson)}</p>
          ${r.done?`<p><b>ส่งคะแนนโมดูล 8 แล้ว: ${r.score}/${MAX}</b></p>`:""}
          <div class="tools"><button id="pl-a">ทำใหม่</button><button class="primary" id="pl-n">ไป ข. ทำ PM จำลอง ▶</button></div></div>`;
        root.querySelector("#pl-a").onclick=plan;
        root.querySelector("#pl-n").onclick=()=>{ tab="sim"; render(); window.scrollTo(0,0); };
      };
    }

    /* ข. ทำ PM จำลอง: ตัดสินทีละรายการว่าผ่านหรือต้องแก้ แล้วสรุปผลเครื่อง */
    function simView(){
      const X=D.sim;
      if(!sim) sim={i:0, pts:[]};
      if(sim.i<X.items.length){
        const it=X.items[sim.i];
        frame(`<div class="simtop"><span class="kicker">ข. ทำ PM จำลอง · รายการ ${sim.i+1} / ${X.items.length}</span><div class="simdots">${X.items.map((_,k)=>`<i class="${sim.pts[k]===1?"ok":sim.pts[k]===0?"bad":k===sim.i?"on":""}"></i>`).join("")}<i class="${sim.i>=X.items.length?"on":""}"></i></div></div>
          <h2>${esc(X.n)}</h2>
          <div class="pmgrid"><div><div class="order"><div class="tk-h"><span>🔧 ใบงาน PM</span></div><p>${esc(X.story)}</p></div>
            <div class="svitem"><div class="small muted">${esc(it.cat)}</div><h3>${esc(it.item)}</h3><div class="svval">${it.val}</div>${it.ref?`<div class="small muted">เกณฑ์: ${it.ref}</div>`:""}</div></div>
            <div><h3>รายการนี้ผลเป็นอย่างไร</h3><div class="lopts"><button class="lopt" data-v="1">✓ ผ่าน ไม่ต้องทำอะไรเพิ่ม</button><button class="lopt" data-v="0">✗ ไม่ผ่าน หรือต้องแก้ไข / ตรวจเพิ่ม</button></div><div id="ps-f"></div></div></div>`);
        root.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{
          const good=(b.dataset.v==="1")===it.ok; sim.pts[sim.i]=good?1:0;
          root.querySelectorAll("[data-v]").forEach(x=>{ x.disabled=true; if((x.dataset.v==="1")===it.ok) x.classList.add("good"); else if(x===b) x.classList.add("bad"); });
          const f=root.querySelector("#ps-f");
          f.innerHTML=`<div class="fb ${good?"good":"bad"}"><b>${good?"✓ ถูกต้อง +1":"✗ ยังไม่ถูก"} · ${it.ok?"ผ่าน":"ต้องแก้ไข"}</b><p>${esc(it.why)}</p><button class="primary" id="ps-n">${sim.i+1<X.items.length?"รายการถัดไป →":"สรุปผลเครื่อง →"}</button></div>`;
          f.querySelector("#ps-n").onclick=()=>{ sim.i++; simView(); window.scrollTo(0,0); };
          if(window.innerWidth<900) f.scrollIntoView({behavior:"smooth",block:"start"});
        });
        return;
      }
      if(sim.final==null){
        frame(`<div class="simtop"><span class="kicker">ข. ทำ PM จำลอง · สรุปผลเครื่อง</span></div><h2>${esc(X.n)}</h2><div id="ps-q"></div>`);
        mcq(root.querySelector("#ps-q"), X.final, pt=>{ sim.final=pt; simView(); window.scrollTo(0,0); }, "ดูผล");
        return;
      }
      const sc=sim.pts.reduce((a,b)=>a+b,0)+sim.final;
      if(!sim.saved){ sim.saved=true; sim.res=savePart("sim", sc); }
      frame(`<div class="score ${sc>=NS*0.8?"ok":"bad"}"><div class="big">${sc}/${NS}</div><div>ข. ทำ PM จำลอง</div></div>
        ${sim.res.done?`<p class="hint">ส่งคะแนนโมดูล 8 แล้ว: ${sim.res.score}/${MAX} (${Math.round(sim.res.score/MAX*100)}%)</p>`:`<p class="hint">ทำ ก. วางแผน PM ให้ครบ ระบบจึงส่งคะแนนโมดูล 8</p>`}
        <ol class="recap">${X.items.map((it,k)=>`<li><b>${sim.pts[k]?"✓":"✗"} ${esc(it.item)}</b><span>${it.ok?"ผ่าน":"ต้องแก้ไข"} · ${esc(it.why)}</span></li>`).join("")}</ol>
        <div class="tools"><button class="primary" id="ps-a">ทำใหม่</button>${sim.res.done?"":`<button id="ps-p">ไป ก. วางแผน PM</button>`}</div>`);
      root.querySelector("#ps-a").onclick=()=>{ sim=null; simView(); };
      const pp=root.querySelector("#ps-p"); if(pp) pp.onclick=()=>{ tab="plan"; render(); };
    }
    function render(){ if(tab==="learn") return learn(); if(tab==="plan") return plan(); simView(); }
    window.Views=window.Views||{}; window.Views.pmplan={show:()=>{ if(!root.innerHTML) render(); }};
  })();
})();
