/* ===== รายการหัวข้อที่ต้องเปิดดูก่อนสอบท้ายโมดูล (แอปซ่อมรุ่นแรก: ปั๊ม ตู้อบ) =====
   โหลดหลัง js/app.js และก่อน js/mgate.js · ไม่นับเครื่องจำลองการซ่อมและแบบฝึกสั่งซื้อ นับเฉพาะเนื้อหาที่ต้องอ่าน */
(function(){
  if(!window.Seen) return;
  const later=f=>setTimeout(f,60);
  const toView=v=>{ if(location.hash!=="#"+v) location.hash="#"+v; };
  const near=el=>{ if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); };
  const txt=el=>(el?el.textContent:"").trim().replace(/\s*✓$/,"");

  /* โมดูล 1 หลักการทำงาน: หัวข้อในแผงภาพรวม + Block diagram + เส้นทางสัญญาณ + ชิ้นส่วนทุกชิ้น */
  Seen.define("principle", ()=>{
    const out=[];
    document.querySelectorAll('#ov-panel details[data-seen^="principle|"]').forEach(d=>out.push({id:d.dataset.seen.split("|")[1], n:txt(d.querySelector("summary"))}));
    out.push({id:"fig-blk", n:"Block diagram"},{id:"fig-flow", n:txt(document.getElementById("bt-flow"))||"เส้นทางสัญญาณ"});
    Object.entries(window.PARTS||{}).forEach(([id,o])=>out.push({id:"p-"+id, n:o.n||id}));
    return out;
  }, id=>{ toView("principle"); later(()=>{
    if(id.startsWith("fig-")){ fig(id.slice(4)); near(document.querySelector("#v-principle .tools")); return; }
    if(id.startsWith("p-")){ fig("cut"); select(id.slice(2),true); near(document.getElementById("panel")); return; }
    fig("ov"); const d=document.querySelector(`#ov-panel details[data-seen="principle|${id}"]`); if(d){ d.open=true; near(d); } }); });

  /* โมดูล 2 รหัส Alarm: เปิดอ่านทุกรายการ */
  if(window.ALARMS) Seen.define("alarms", ()=>ALARMS.map(a=>({id:a.id, n:a.n})),
    id=>{ toView("alarms"); later(()=>{ try{ pf="all"; document.querySelectorAll("#pf button").forEach(x=>x.classList.toggle("on",x.dataset.p==="all"));
      const q=document.getElementById("q"); if(q) q.value=""; openAlarm=id; renderAlarms(); }catch(e){} }); });

  /* PM / ทดสอบหลังซ่อม: ทุกหัวข้อ */
  if(window.PM) Seen.define("pm", ()=>PM.map(x=>({id:x.id, n:x.n||x.id})),
    id=>{ toView("pm"); later(()=>{ const b=document.querySelector(`#pm .pmtabs [data-id="${id}"]`); if(b) b.click(); near(document.getElementById("pm")); }); });

  /* การใช้งาน (ปั๊ม: clin · ตู้อบ: tech): บทเรียนทุกบท */
  const LS=window.CLIN?["clin","clin",CLIN]:window.TECHUSE?["tech","tech",TECHUSE]:null;
  if(LS && LS[2].lessons) Seen.define(LS[0], ()=>LS[2].lessons.map(l=>({id:l.id, n:l.n||l.id})),
    id=>{ toView(LS[1]); later(()=>{ const root=document.getElementById(LS[1]); const t=root.querySelector('.pmtabs [data-t="learn"]'); if(t && !t.classList.contains("on")) t.click();
      later(()=>{ const b=root.querySelector(`[data-l="${id}"]`); if(b) b.click(); near(root); }); }); });

  /* ตรวจรับ และ PM ตามแผน: บทเรียน */
  const learnTab=v=>()=>{ toView(v); later(()=>{ const b=document.querySelector(`#${v} .pmtabs [data-t="learn"]`); if(b) b.click(); near(document.getElementById(v)); }); };
  if(window.SVC && SVC.accept) Seen.define("accept", ()=>[{id:"accept-learn", n:"บทเรียนตรวจรับเครื่อง"}], learnTab("accept"));
  if(window.SVC && SVC.pm) Seen.define("pmplan", ()=>[{id:"pm-learn", n:"บทเรียน PM ตามแผน"}], learnTab("pmplan"));
})();
