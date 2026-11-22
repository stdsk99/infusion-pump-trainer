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

## Token Efficiency & Development Rules

1. Search before reading. Use grep or targeted inspection instead of reading entire files.
2. For large or unfamiliar parts of the repo, delegate exploration to a subagent and return a concise summary.
3. Show diffs instead of repeating entire files.
4. Reuse established project decisions. Never ask for information already provided.
5. When switching tasks, suggest /compact or /clear.
6. Keep responses concise by default. Expand only when requested.
7. Never modify unrelated files or refactor outside the requested scope.
8. Before editing, inspect the existing implementation and reuse existing functions, APIs and data structures.
9. After editing, run relevant tests and report actual results. If no tests exist, say so and describe how to verify manually. Never claim success without checking.
10. For database or data-file changes, inspect the existing schema first. Never create duplicate tables, columns or fields.
11. Never overwrite data or run destructive operations without explicit approval. Show the command and a backup step first.
12. Discuss the plan first. Start implementing only after I reply "ทำได้".
    After "ทำได้", work on a new branch, open a Pull Request, and merge it yourself once checks pass. Then report what changed.
13. Reply in Thai.
