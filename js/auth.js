/* ===== ลงทะเบียน / เข้าสู่ระบบ ===== */
(function(){
  const C = window.APP_CONFIG || {};
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const K_LU="ipt-local-users";   // ใช้เมื่อยังไม่ได้เชื่อม Google Sheets เท่านั้น
  const PDPA = C.pdpa || "ข้าพเจ้ายินยอมให้เก็บชื่อ รหัสหรืออีเมล หน่วยงาน และผลการเรียนในระบบนี้ เพื่อใช้บันทึกผลการเรียน ติดตามความก้าวหน้า และออกใบรับรองเท่านั้น ข้อมูลจะไม่ถูกเปิดเผยต่อบุคคลภายนอก และขอให้ลบข้อมูลได้โดยติดต่อผู้ดูแลระบบ";
  let mode="login", type="st";

  async function hashPin(uid,pin){
    const data=new TextEncoder().encode(`ipt|${uid}|${pin}`);
    const buf=await crypto.subtle.digest("SHA-256",data);
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  const norm = (t,u)=> t==="gp" ? u.trim().toLowerCase() : u.trim().replace(/\s+/g,"");
  const lu = ()=>{ try{ return JSON.parse(localStorage.getItem(K_LU))||{}; }catch(e){ return {}; } };
  const luSave = o=>{ try{ localStorage.setItem(K_LU,JSON.stringify(o)); }catch(e){} };

  function gate(){
    let g=document.getElementById("auth");
    if(!g){ g=document.createElement("div"); g.id="auth"; document.body.appendChild(g); }
    document.body.classList.add("locked");
    render(g);
  }

  function render(g){
    const st=type==="st";
    g.innerHTML=`<div class="abox">
      <div class="abrand"><div class="logo">IP</div><div><b>Infusion Pump Repair Trainer</b><small>${esc((C.cert&&C.cert.org||[]).join(" "))}</small></div></div>
      <div class="seg atabs"><button data-m="login" class="${mode==="login"?"on":""}">เข้าสู่ระบบ</button><button data-m="reg" class="${mode==="reg"?"on":""}">ลงทะเบียน</button></div>
      <form id="af" novalidate>
        <div class="seg mp-type"><button type="button" data-t="st" class="${st?"on":""}">นักศึกษา</button><button type="button" data-t="gp" class="${st?"":"on"}">บุคลากร / บุคคลทั่วไป</button></div>
        ${mode==="reg"?`<label>ชื่อ-สกุล (พร้อมคำนำหน้า)<input id="a-n" autocomplete="name" required></label>`:""}
        <label>${st?"รหัสนักศึกษา":"อีเมล"}<input id="a-u" ${st?'inputmode="numeric" autocomplete="username"':'type="email" autocomplete="email"'} required></label>
        ${mode==="reg"?(st?`<label>กลุ่มเรียน (ถ้ามี)<input id="a-g"></label>`
          :`<label>หน่วยงาน / สังกัด<input id="a-o" placeholder="เช่น งานเครื่องมือแพทย์ โรงพยาบาล…" required></label><label>ตำแหน่ง (ถ้ามี)<input id="a-r" placeholder="เช่น ช่างเทคนิค พยาบาล นักวิชาการ"></label>`):""}
        <label>PIN (ตัวเลข 4–6 หลัก)<input id="a-p" type="password" inputmode="numeric" maxlength="6" autocomplete="${mode==="reg"?"new-password":"current-password"}" required></label>
        ${mode==="reg"?`<label>ยืนยัน PIN<input id="a-p2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" required></label>
          <label class="pdpa"><input type="checkbox" id="a-c"><span>${esc(PDPA)}</span></label>
          <p class="muted small">PIN ใช้กันไม่ให้ผู้อื่นเข้าบัญชีของคุณ ไม่ควรใช้ซ้ำกับรหัสผ่านของบัญชีสำคัญอื่น</p>`:""}
        <div class="msg bad" id="a-e" hidden></div>
        <button class="primary wide" type="submit" id="a-go">${mode==="reg"?"ลงทะเบียนและเริ่มเรียน":"เข้าสู่ระบบ"}</button>
      </form>
      <p class="muted small acenter">${mode==="login"?"ยังไม่มีบัญชี? <a href=\"#\" data-sw=\"reg\">ลงทะเบียน</a> · ลืม PIN ติดต่อผู้ดูแลระบบเพื่อตั้งใหม่":"มีบัญชีแล้ว? <a href=\"#\" data-sw=\"login\">เข้าสู่ระบบ</a>"}</p>
      ${C.sheetUrl?"":`<p class="msg small">โหมดทดสอบ: ยังไม่ได้เชื่อม Google Sheets บัญชีจะเก็บไว้ในเครื่องนี้เท่านั้น</p>`}
    </div>`;
    g.querySelectorAll(".atabs button,[data-sw]").forEach(b=>b.onclick=e=>{ e.preventDefault(); mode=b.dataset.m||b.dataset.sw; render(g); });
    g.querySelectorAll(".mp-type button").forEach(b=>b.onclick=()=>{ type=b.dataset.t; render(g); });
    g.querySelector("#af").onsubmit=e=>{ e.preventDefault(); submit(g); };
    const f=g.querySelector(mode==="reg"?"#a-n":"#a-u"); if(f) f.focus();
  }

  async function submit(g){
    const v=id=>{ const e=g.querySelector(id); return e?e.value.trim():""; };
    const err=m=>{ const e=g.querySelector("#a-e"); e.textContent=m; e.hidden=false; };
    const uid=norm(type,v("#a-u")), pin=v("#a-p");
    if(!uid) return err(type==="st"?"กรุณากรอกรหัสนักศึกษา":"กรุณากรอกอีเมล");
    if(type==="gp" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uid)) return err("รูปแบบอีเมลไม่ถูกต้อง");
    if(!/^\d{4,6}$/.test(pin)) return err("PIN ต้องเป็นตัวเลข 4–6 หลัก");
    let profile=null;
    if(mode==="reg"){
      if(!v("#a-n")) return err("กรุณากรอกชื่อ-สกุล");
      if(type==="gp" && !v("#a-o")) return err("กรุณากรอกหน่วยงาน");
      if(pin!==v("#a-p2")) return err("PIN ทั้งสองช่องไม่ตรงกัน");
      if(!g.querySelector("#a-c").checked) return err("กรุณาอ่านและกดยินยอมการเก็บข้อมูลก่อนลงทะเบียน");
      profile = type==="st" ? {type:"st", sid:uid, name:v("#a-n"), sec:v("#a-g")} : {type:"gp", sid:uid, name:v("#a-n"), org:v("#a-o"), role:v("#a-r"), sec:""};
    }
    let h;
    try{ h=await hashPin(uid,pin); }catch(e){ return err("เบราว์เซอร์นี้ไม่รองรับการเข้ารหัส กรุณาเปิดผ่าน https หรือใช้ Chrome รุ่นใหม่"); }
    const go=g.querySelector("#a-go"); go.disabled=true; go.textContent="กำลังเชื่อมต่อ…";
    const done=()=>{ go.disabled=false; go.textContent=mode==="reg"?"ลงทะเบียนและเริ่มเรียน":"เข้าสู่ระบบ"; };
    const S=window.Score;

    if(!C.sheetUrl){                       // โหมดทดสอบในเครื่อง
      const U=lu();
      if(mode==="reg"){ if(U[uid]){ done(); return err("ชื่อผู้ใช้นี้ลงทะเบียนแล้ว ให้เข้าสู่ระบบแทน"); } U[uid]={profile,pin:h}; luSave(U); S.setSession({profile,pin:h},[]); }
      else { const u=U[uid]; if(!u){ done(); return err("ไม่พบบัญชีนี้ กรุณาลงทะเบียน"); } if(u.pin!==h){ done(); return err("PIN ไม่ถูกต้อง"); } S.setSession({profile:u.profile,pin:h}, null); }
      return enter();
    }

    const r = mode==="reg" ? await S.api("register",{sid:uid, pin:h, profile, consent:PDPA}) : await S.api("login",{sid:uid, pin:h});
    done();
    if(!r.ok){
      const M={exists:"ชื่อผู้ใช้นี้ลงทะเบียนแล้ว ให้เข้าสู่ระบบแทน", nouser:"ไม่พบบัญชีนี้ กรุณาตรวจสอบหรือลงทะเบียน", badpin:"PIN ไม่ถูกต้อง", net:"เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่", token:"ระบบตั้งค่าไม่ถูกต้อง กรุณาแจ้งอาจารย์ผู้สอน"};
      return err(M[r.err]||"เกิดข้อผิดพลาด ("+(r.err||"unknown")+")");
    }
    S.setSession({profile:r.profile, pin:h}, r.hist||[]);
    if(r.reset) S.toast("ตั้ง PIN ใหม่เรียบร้อยแล้ว");
    enter();
  }

  function enter(){
    document.body.classList.remove("locked");
    const g=document.getElementById("auth"); if(g) g.remove();
    userBox();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  function userBox(){
    const bar=document.querySelector("header .bar"); if(!bar) return;
    let b=document.getElementById("userbox");
    if(!b){ b=document.createElement("div"); b.id="userbox"; bar.appendChild(b); }
    const p=window.Score.profile();
    b.innerHTML = p ? `${PORTAL?`<a href="${esc(PORTAL)}my.html" class="uname" title="กลับศูนย์การเรียนรู้">← วิชาของฉัน</a> `:""}<a href="#scores" class="uname" title="ผลของฉัน">👤 ${esc(p.name.split(" ")[0])}</a>` : "";
  }

  function signOut(){
    const d=document.createElement("div"); d.className="modal";
    d.innerHTML=`<div class="mbox" role="dialog" aria-modal="true"><h2>ออกจากระบบ?</h2><p class="muted small">คะแนนที่บันทึกเข้าระบบแล้วจะไม่หาย เข้าสู่ระบบใหม่ได้ทุกเมื่อ</p>
      <div class="tools"><button class="ghost" id="so-n">ยกเลิก</button><button class="primary" id="so-y">ออกจากระบบ</button></div></div>`;
    document.body.appendChild(d);
    d.querySelector("#so-n").onclick=()=>d.remove();
    d.querySelector("#so-y").onclick=()=>{ d.remove(); window.Score.logout(); try{ localStorage.removeItem(K_M); }catch(e){} userBox(); if(PORTAL){ location.href=PORTAL; return; } mode="login"; location.hash="#home"; gate(); };
  }

  /* ===== เชื่อมกับเว็บหลัก (ศูนย์การเรียนรู้) =====
     เว็บหลักเก็บ session ร่วมไว้ที่ "mtc-session" ในโดเมนเดียวกัน
     - มี session ร่วม และลงทะเบียนวิชานี้แล้ว → เข้าแอปได้เลย ไม่ต้องล็อกอินซ้ำ
     - ยังไม่ได้ล็อกอินหรือยังไม่ลงทะเบียน → ส่งไปหน้าวิชาบนเว็บหลัก
     ถ้าไม่ได้ตั้ง C.portal แอปจะใช้หน้าล็อกอินของตัวเองเหมือนเดิม */
  const APP = C.app || "pump", PORTAL = C.portal || "";
  const K_M = "mtc-session";
  const portalSess = ()=>{ try{ const m=JSON.parse(localStorage.getItem(K_M)); return m&&m.profile&&m.pin?m:null; }catch(e){ return null; } };
  const toPortal = page=>{ location.replace(PORTAL + page); };

  function waitBox(msg){
    let g=document.getElementById("auth");
    if(!g){ g=document.createElement("div"); g.id="auth"; document.body.appendChild(g); }
    document.body.classList.add("locked");
    g.innerHTML=`<div class="abox"><p class="acenter">${esc(msg)}</p></div>`;
  }
  async function adopt(m){
    if(!(m.enrolled||[]).includes(APP)) return toPortal("course.html?c="+APP);
    waitBox("กำลังเข้าสู่ระบบจากศูนย์การเรียนรู้…");
    const S=window.Score;
    if(!C.sheetUrl){ S.setSession({profile:m.profile, pin:m.pin}, []); return enter(); }
    const r = await S.api("login",{sid:m.profile.sid, pin:m.pin});
    if(r.ok){ S.setSession({profile:r.profile, pin:m.pin}, r.hist||[]); return enter(); }
    if(r.err==="net"){ S.setSession({profile:m.profile, pin:m.pin}, null); return enter(); }
    try{ localStorage.removeItem(K_M); }catch(e){}
    toPortal("login.html?next="+encodeURIComponent("course.html?c="+APP));
  }

  function init(){
    const own = window.Score.session(), m = PORTAL ? portalSess() : null;
    if(m && (!own || own.profile.sid !== m.profile.sid || own.pin !== m.pin)){ if(own) window.Score.logout(); return adopt(m); }
    if(own) return userBox();
    if(PORTAL) return toPortal("course.html?c="+APP);
    gate();
  }
  window.Auth={init, signOut};
  document.addEventListener("DOMContentLoaded", init);
})();
