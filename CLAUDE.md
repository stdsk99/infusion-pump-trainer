# CLAUDE.md: วิชาเครื่องควบคุมการให้สารละลาย (Infusion Pump)

ก่อนเริ่มงานทุกครั้ง อ่าน `STANDARDS.md` (มาตรฐานกลางของศูนย์ฯ) แล้วอ่าน `MEMORY.md` (สิ่งที่เจ้าของงานเคยสั่งแก้ในวิชานี้)
เมื่อเจ้าของงานสั่งแก้หรือตัดสินใจเรื่องใหม่ ให้จดลง `MEMORY.md` ถ้ากฎนั้นใช้กับทุกวิชา ให้เสนอย้ายเข้า `STANDARDS.md` ที่ medtechcenter
ระบบทั้งหมดและ Code.gs ดูได้ที่ `HANDOFF.md` ใน stdsk99/medtechcenter

## วิชาใน repo นี้

| ที่อยู่ | วิชา | รหัสแอป | store | เลขที่ |
|---|---|---|---|---|
| `/` | วิชาช่าง: ซ่อมและบำรุงรักษา volumetric infusion pump | `pump` | `ipt` | `IPT-` |
| `/clinical/` | วิชาคลินิก: การใช้ปั๊มอย่างปลอดภัย (พยาบาล/นักศึกษาพยาบาล) | `pump-clin` | `ipc` | `IPC-` |
| `/3d/` | หน้า 3 มิติ | – | – | – |

## ขอบเขตเนื้อหา

- เครื่องจำลอง: volumetric infusion pump ทั่วไป กลไก peristaltic (ภาควิชาไม่มีเครื่องรุ่นอ้างอิง)
- วิชาช่าง: alarm 15 รายการ · โจทย์ซ่อม 8 เคส · ทดสอบ flow, occlusion และ IEC 62353 · ตรวจรับ · PM ตามแผน
- วิชาคลินิก: RATE/VTBI/KVO · การคำนวณอัตราไหล · ยาความเสี่ยงสูงและ drug library (soft/hard limit) · safety mode · ประวัติ alarm · สายที่สอง

## ไฟล์สำคัญ

- `data/` เนื้อหาวิชาช่าง (`mquiz.js` สอบท้ายโมดูล · `qbank.js` คลังแบบทดสอบ · `cases.js` โจทย์ซ่อม)
- `clinical/data/` เนื้อหาวิชาคลินิก (`lessons.js` · `mquiz.js` · `qbank.js` · `sim.js`)
