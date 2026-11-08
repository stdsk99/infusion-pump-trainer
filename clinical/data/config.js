/* ===== ตั้งค่าแอป วิชาคลินิก: การใช้เครื่องควบคุมการให้สารละลายอย่างปลอดภัย =====
   แอปนี้ใช้ไฟล์ร่วมกับแอปฝึกซ่อมปั๊ม (../css/style.css, ../js/score.js, ../js/auth.js, ../js/quiz.js, ../js/cert.js)
   app   : ต้องตรงกับ APPS ใน apps-script/Code.gs (repo infant-incubator-trainer) และ courses.js ของเว็บหลัก
   store : คำนำหน้าคีย์ localStorage ของแอปนี้ (แยกจากแอปซ่อม) */
window.APP_CONFIG = {
  app: "pump-clin",
  store: "ipc",
  appName: "Infusion Pump Clinical Use",
  portal: "/medtechcenter/",
  sheetUrl: "https://script.google.com/macros/s/AKfycbzLcs08L6W0fnHHZ5tCq8JjkXFPcux3G3_WT1t3vUC8zSo-oQKoACC3xHc67-h-yy6KTw/exec",
  token: "pump-2569",
  course: "ศูนย์การเรียนรู้เทคโนโลยีทางการแพทย์",
  quizMod: "แบบทดสอบ",
  emptyHint: "ยังไม่มีคะแนน เริ่มจากอ่านบทเรียน แล้วลองเครื่องจำลองและแบบทดสอบ",
  reportEmail: "theptharo2019@gmail.com",   // ช่องทางแจ้งข้อผิดพลาดของเนื้อหา

  cert: {
    org: ["ศูนย์การเรียนรู้เทคโนโลยีทางการแพทย์"],
    title: "การใช้เครื่องควบคุมการให้สารละลายอย่างปลอดภัย (Infusion Pump Clinical Use)",
    subject: "ของศูนย์การเรียนรู้เทคโนโลยีทางการแพทย์",
    signer: "รศ.ดร.ณัฐดนัย สิงห์คลีวรรณ",
    signerPos: "ผู้จัดทำสื่อการเรียนรู้",
    ref: "IPC"
  },

  /* เกณฑ์ผ่าน (ต้องตรงกับ APPS['pump-clin'].crit ใน Code.gs) */
  criteria: { readLessons: 9, simPct: 80, quizPct: 80, modTests: 9 }
};
