const P = window.PARTS;
const A = window.ALARMS;
const AN = Object.fromEntries(A.map(a=>[a.id,a]));
const priTh = {h:"สูง",m:"กลาง",l:"ต่ำ"};

/* block diagram nodes */
(function(){
  const ins=[["keypad","Keypad"],["dropsensor","Drop sensor"],["occ_up","Occlusion ↑"],["occ_down","Occlusion ↓"],["air","Air-in-line"],["door","Door sensor"],["motor","Encoder"]];
  const outs=[["motor","Motor + Driver"],["display","Display"],["buzzer","Buzzer / LED"],["buzzer","Nurse call"]];
  const NS="http://www.w3.org/2000/svg";
  const mk=(tag,at)=>{const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);return e;};
  const gi=document.getElementById("blk-in"), go=document.getElementById("blk-out");
  ins.forEach(([id,t],i)=>{
    const y=30+i*48, g=mk("g",{class:"part","data-id":id});
    g.append(mk("rect",{class:"hit",x:6,y:y-2,width:112,height:40,rx:7}));
    g.append(mk("rect",{x:10,y:y+2,width:104,height:32,rx:6,class:"fill-card",stroke:"currentColor","stroke-width":".9"}));
    const tx=mk("text",{class:"lbl",x:62,y:y+22,"text-anchor":"middle"});tx.textContent=t;g.append(tx);
    gi.append(g);
    gi.append(mk("line",{x1:114,y1:y+18,x2:131,y2:Math.min(Math.max(y+18,130),230),stroke:"currentColor","stroke-width":".8","marker-end":"url(#ar)",opacity:".7"}));
  });
  outs.forEach(([id,t],i)=>{
    const y=90+i*56, g=mk("g",{class:"part","data-id":id});
    g.append(mk("rect",{class:"hit",x:242,y:y-2,width:114,height:44,rx:7}));
    g.append(mk("rect",{x:246,y:y+2,width:106,height:36,rx:6,class:"fill-card",stroke:"currentColor","stroke-width":".9"}));
    const tx=mk("text",{class:"lbl",x:299,y:y+24,"text-anchor":"middle"});tx.textContent=t;if(t.length>14)tx.setAttribute("font-size","9.5");g.append(tx);
    go.append(g);
    go.append(mk("line",{x1:229,y1:Math.min(Math.max(y+20,135),225),x2:245,y2:y+20,stroke:"currentColor","stroke-width":".8","marker-end":"url(#ar)",opacity:".7"}));
  });
})();

/* component panel */
const panel=document.getElementById("panel");
const chips=document.getElementById("chips");
Object.entries(P).forEach(([id,o])=>{const b=document.createElement("button");b.textContent=o.n;b.onclick=()=>select(id,true);chips.append(b);});
const chipHTML=chips.outerHTML;
function esc(s){return s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function select(id,scroll){
  document.querySelectorAll(".part").forEach(p=>p.classList.toggle("sel",p.dataset.id===id));
  const o=P[id]; if(!o) return;
  const al=o.a.map(a=>`<a class="pill" href="#alarms" data-al="${a}">${esc(AN[a].n)}</a>`).join("");
  panel.innerHTML=`<div class="en">${esc(o.n)}</div><h2>${esc(o.th)}</h2>
    <h3>หน้าที่</h3><p>${esc(o.f)}</p>
    <h3>หลักการทำงาน</h3><p>${esc(o.h)}</p>
    <h3>อาการเสียที่พบบ่อย</h3><ul>${o.x.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
    <h3>วิธีตรวจเบื้องต้น</h3><ol>${o.c.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
    ${al?`<h3>Alarm ที่เกี่ยวข้อง</h3><div>${al}</div>`:""}
    <h3 style="margin-top:18px">ชิ้นส่วนอื่น</h3>${chipHTML}`;
  panel.querySelectorAll("#chips button").forEach((b,i)=>b.onclick=()=>select(Object.keys(P)[i],true));
  panel.querySelectorAll("[data-al]").forEach(a=>a.onclick=()=>{openAlarm=a.dataset.al;});
  if(scroll && window.innerWidth<900) panel.scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll("svg.dia").forEach(svg=>svg.addEventListener("click",e=>{
  const p=e.target.closest(".part"); if(p){ if(curFig==="ov") fig("cut"); select(p.dataset.id,true); }
}));

/* toggles */
const btOv=document.getElementById("bt-ov"),btCut=document.getElementById("bt-cut"),btBlk=document.getElementById("bt-blk"),btFlow=document.getElementById("bt-flow"),btRun=document.getElementById("bt-run");
let curFig="ov";
btOv.onclick=()=>fig("ov");
btCut.onclick=()=>fig("cut");
btBlk.onclick=()=>fig("blk");
btFlow.onclick=()=>fig("flow");
function fig(w){
  curFig=w;
  [btOv,btCut,btBlk,btFlow].forEach(b=>b.classList.toggle("on",b.id==="bt-"+w));
  document.getElementById("fig-cut").style.display=(w==="cut"||w==="ov")?"":"none";
  document.getElementById("panel").hidden=w==="ov";
  document.getElementById("ov-panel").hidden=w!=="ov";
  if(w!=="ov" && window.Overview) Overview.clear();
  if(w==="ov") document.querySelectorAll("#svg-cut .part.sel").forEach(p=>p.classList.remove("sel"));
  document.getElementById("fig-blk").style.display=w==="blk"?"":"none";
  btRun.style.display=(w==="cut"||w==="ov")?"":"none";
  document.querySelector("#v-principle .layout").style.display=w==="flow"?"none":"";
  const fl=document.getElementById("flow"); fl.hidden=w!=="flow";
  if(w==="flow" && window.Flow) Flow.start(fl); else if(window.Flow) Flow.stop();
}
btRun.onclick=()=>{const s=document.getElementById("svg-cut");const on=s.classList.toggle("run");btRun.classList.toggle("on",on);btRun.textContent=on?"■ หยุด":"▶ เดินเครื่อง";};

/* alarms */
let pf="all", openAlarm=null;
const alist=document.getElementById("alist");
function li(arr){return arr.map(s=>`<li>${esc(s)}</li>`).join("");}
function renderAlarms(){
  const q=document.getElementById("q").value.trim().toLowerCase();
  let n=0;
  alist.innerHTML=A.filter(a=>(pf==="all"||a.p===pf)&&(!q||(a.n+a.th+a.u.join()+a.t.join()+(a.r?P[a.r].n:"")).toLowerCase().includes(q))).map(a=>{n++;
    return `<details class="alarm" id="al-${a.id}"${openAlarm===a.id?" open":""}><summary><span class="pri ${a.p}">${priTh[a.p]}</span><span class="t">${esc(a.n)}<small>${esc(a.th)}</small></span></summary>
    <div class="body">
      ${a.u.length?`<h4>สาเหตุจากการใช้งาน</h4><ul>${li(a.u)}</ul>`:""}
      ${a.t.length?`<h4>สาเหตุทางเทคนิค</h4><ul>${li(a.t)}</ul>`:""}
      <h4>ลำดับการตรวจ</h4><ol>${li(a.s)}</ol>
      ${a.r?`<a class="pill" href="#principle" data-c="${a.r}">ดูชิ้นส่วน: ${esc(P[a.r].n)}</a>`:""}
    </div></details>`}).join("");
  document.getElementById("aempty").style.display=n?"none":"block";
  alist.querySelectorAll("[data-c]").forEach(a=>a.onclick=()=>{pendingPart=a.dataset.c;});
  if(openAlarm){const el=document.getElementById("al-"+openAlarm);if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"center"}),50);openAlarm=null;}
}
document.getElementById("q").addEventListener("input",renderAlarms);
document.querySelectorAll("#pf button").forEach(b=>b.onclick=()=>{pf=b.dataset.p;document.querySelectorAll("#pf button").forEach(x=>x.classList.toggle("on",x===b));renderAlarms();});

/* routing */
let pendingPart=null;
function route(){
  const v=(location.hash||"#home").slice(1);
  const names=[...document.querySelectorAll("#nav a")].map(x=>x.dataset.v);
  const name=names.includes(v)?v:"home";
  if(window.MGate){ const g=MGate.guard(name); if(g!==name){ location.replace("#"+g); return; } }
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("on",s.id==="v-"+name));
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.v===name));
  const na=document.querySelector("#nav a.on"); if(na){const nv=document.getElementById("nav"); nv.scrollLeft=na.offsetLeft-nv.clientWidth/2+na.offsetWidth/2;}
  if(name==="alarms") renderAlarms();
  if(name==="repair" && window.Sim) window.Sim.show();
  if(window.Views && window.Views[name]) window.Views[name].show();
  if(name!=="principle" && window.Flow) Flow.stop();
  if(name==="principle" && curFig==="flow" && !pendingPart && window.Flow) Flow.start(document.getElementById("flow"));
  if(name==="principle" && pendingPart){btCut.click();select(pendingPart,false);pendingPart=null;}
  if(window.MGate){ MGate.decorate(); MGate.mount(document.getElementById("v-"+name)); }
  if(!openAlarm) window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);
window.addEventListener("DOMContentLoaded",route);
