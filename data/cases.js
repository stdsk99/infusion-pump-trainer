/* ===== ข้อมูลโมดูลจำลองการซ่อม =====
   แก้ไข/เพิ่มเคสได้ที่ไฟล์นี้ โดยไม่ต้องแก้โค้ด

   ACTIONS   = รายการสิ่งที่นักศึกษาตรวจได้ (ใช้ร่วมกันทุกเคส)
               g=กลุ่ม  min=เวลาที่ใช้ (นาที)  open=ต้องเปิดฝาเครื่องก่อน  esd=ควรสวม ESD  ok=ผลปกติ (ใช้เมื่อเคสไม่ได้กำหนดผลไว้)
   FAULTS    = ตัวเลือกการวินิจฉัย
   REPAIRS   = ตัวเลือกการซ่อม  cost=ราคาอะไหล่ (บาท, ค่าสมมติ)
   TESTS     = การทดสอบหลังซ่อม
   CASES     = เคส  r=ผลการตรวจเฉพาะเคส {id:{t:"ข้อความ", v:"ค่าที่วัด", bad:true}}
               fix=ตัวเลือกซ่อมที่แก้ได้ตรงจุด  costly=ตัวเลือกที่แก้ได้แต่เกินจำเป็น
               need=การทดสอบหลังซ่อมที่ต้องทำ  key=การตรวจสำคัญที่ควรทำก่อนสรุป
*/
var SIM = window.SIM = {};

SIM.ACTIONS = [
  {id:"interview", g:"ภายนอก", n:"สอบถามผู้แจ้งซ่อม", min:5, ok:"ผู้แจ้งยืนยันอาการตามใบแจ้งซ่อม"},
  {id:"inspect_ext", g:"ภายนอก", n:"ตรวจสภาพภายนอก", min:5, ok:"ตัวเครื่องไม่มีรอยแตก ไม่มีคราบสารละลาย ฝาและขาล็อกปกติ"},
  {id:"check_set", g:"ภายนอก", n:"ตรวจชุดสายที่หน่วยงานใช้", min:5, ok:"เป็นชุดสายรุ่นที่ผู้ผลิตกำหนด สภาพดี"},
  {id:"check_power", g:"ภายนอก", n:"ตรวจปลั๊ก สายไฟ และไฟแสดง AC", min:5, ok:"สายไฟปกติ เสียบแล้วไฟแสดง AC ติด"},
  {id:"reproduce", g:"ภายนอก", n:"ทดลองเดินเครื่องด้วยน้ำ 30 นาที", min:30, ok:"เครื่องทำงานปกติตลอด 30 นาที ไม่มี alarm"},

  {id:"log", g:"Service mode", n:"ดาวน์โหลด event log", min:10, ok:"ไม่พบ error ผิดปกติในช่วง 30 วันที่ผ่านมา"},
  {id:"svc_occ", g:"Service mode", n:"อ่านค่า raw occlusion sensor", min:10, ok:"Upstream และ downstream อยู่ในเกณฑ์อ้างอิง", v:"UP 102 / DN 98 counts (ref 100±10)"},
  {id:"svc_air", g:"Service mode", n:"อ่านค่าสัญญาณ air sensor", min:5, ok:"สัญญาณขณะสายเต็มน้ำอยู่ในเกณฑ์", v:"92% (เกณฑ์ ≥ 70%)"},
  {id:"svc_drop", g:"Service mode", n:"ทดสอบ drop sensor", min:5, ok:"นับหยดได้ตรงกับที่ปล่อยทดสอบ"},
  {id:"svc_door", g:"Service mode", n:"ดูสถานะ door sensor", min:3, ok:"เปิดฝาแสดง OPEN ปิดฝาแสดง CLOSED ถูกต้อง"},
  {id:"svc_keys", g:"Service mode", n:"ทดสอบปุ่มกดทุกปุ่ม", min:5, ok:"ปุ่มทุกปุ่มตอบสนองปกติ"},
  {id:"svc_batt", g:"Service mode", n:"ดูข้อมูลแบตเตอรี่", min:3, ok:"อายุแบต 8 เดือน แรงดันและสถานะการชาร์จปกติ", v:"12.5 V · charging OK"},

  {id:"open_case", g:"เปิดเครื่อง", n:"เปิดฝาเครื่อง", min:10, ok:"เปิดฝาเครื่องเรียบร้อย ตรวจภายในได้"},
  {id:"inspect_int", g:"ตรวจภายใน", n:"ตรวจด้วยตา: บอร์ด สายแพ คราบ การกัดกร่อน", min:10, open:true, esd:true, ok:"ไม่พบคราบ การกัดกร่อน หรือขั้วต่อหลวม"},
  {id:"inspect_mech", g:"ตรวจภายใน", n:"ตรวจกลไกนิ้วกด / หมุนเพลาด้วยมือ", min:10, open:true, ok:"นิ้วกดเคลื่อนที่ลื่น เพลาหมุนสม่ำเสมอ ไม่ฝืด"},
  {id:"m_fuse", g:"ตรวจภายใน", n:"วัดความต่อเนื่องของ fuse", min:5, open:true, ok:"fuse ต่อเนื่อง", v:"0.1 Ω"},
  {id:"m_psu", g:"ตรวจภายใน", n:"วัดแรงดันขาออก power supply", min:10, open:true, ok:"แรงดันขาออกตามกำหนด", v:"15.1 V DC"},
  {id:"m_rails", g:"ตรวจภายใน", n:"วัดไฟเลี้ยงบนบอร์ด (5 V / 3.3 V)", min:10, open:true, esd:true, ok:"ไฟเลี้ยงปกติ", v:"5.02 V / 3.31 V"},
  {id:"m_motor", g:"ตรวจภายใน", n:"วัดความต้านทานขดลวดมอเตอร์", min:10, open:true, ok:"ขดลวดทั้ง 2 เฟสมีค่าใกล้เคียงกัน", v:"A 32.4 Ω · B 32.1 Ω"},
  {id:"m_enc", g:"ตรวจภายใน", n:"ดูสัญญาณ encoder ด้วยออสซิลโลสโคป", min:15, open:true, esd:true, ok:"พัลส์สม่ำเสมอ ไม่มีพัลส์ขาดหาย"},

  {id:"m_flow", g:"ทดสอบเครื่อง", n:"Flow accuracy test (ชั่งน้ำหนัก)", min:60, ok:"ค่าคลาดเคลื่อนอยู่ในเกณฑ์", v:"−1.6% (เกณฑ์ ±5%)"},
  {id:"m_occ_press", g:"ทดสอบเครื่อง", n:"Occlusion pressure test", min:20, ok:"alarm ดังที่แรงดันตรงตามระดับที่ตั้ง", v:"alarm ที่ 730 mmHg (ตั้งระดับ H ≈ 750)"},
  {id:"m_batt_run", g:"ทดสอบเครื่อง", n:"ทดสอบเวลาสำรองไฟจากแบต", min:120, ok:"เครื่องทำงานด้วยแบตได้นานกว่าเกณฑ์", v:"> 4 ชม. (เกณฑ์ ≥ 3 ชม.)"}
];

SIM.FAULTS = [
  {id:"air_dirty", n:"Air sensor สกปรก"},
  {id:"air_fail", n:"Air sensor เสื่อม"},
  {id:"door_magnet", n:"แม่เหล็กบนฝาหลุดหรือหาย"},
  {id:"door_hall", n:"Hall sensor ของฝาเสีย"},
  {id:"occ_drift", n:"ค่าสอบเทียบ occlusion sensor เลื่อน"},
  {id:"occ_fail", n:"Occlusion sensor เสีย"},
  {id:"drop_dirty", n:"Drop sensor สกปรก"},
  {id:"wrong_set", n:"ใช้ชุดสายไม่ตรงตามที่ผู้ผลิตกำหนด"},
  {id:"fingers_worn", n:"นิ้วกดหรือ platen สึก"},
  {id:"aff_clamp", n:"Anti-free-flow clamp ชำรุด"},
  {id:"encoder_dirty", n:"Encoder สกปรก"},
  {id:"motor_fail", n:"ขดลวดมอเตอร์เสีย"},
  {id:"driver_fail", n:"Motor driver เสีย"},
  {id:"mainboard", n:"บอร์ดหลักเสีย"},
  {id:"batt_aged", n:"แบตเตอรี่เสื่อมตามอายุ"},
  {id:"charger_fail", n:"วงจรชาร์จเสีย"},
  {id:"fuse_blown", n:"Fuse ขาด"},
  {id:"psu_fail", n:"Power supply เสีย"}
];

SIM.REPAIRS = [
  {id:"clean_air", n:"ทำความสะอาด air sensor", cost:0},
  {id:"replace_air", n:"เปลี่ยน air sensor", cost:6500},
  {id:"replace_magnet", n:"เปลี่ยนแม่เหล็กบนฝา", cost:250},
  {id:"replace_hall", n:"เปลี่ยน Hall sensor", cost:900},
  {id:"recal_occ", n:"สอบเทียบ occlusion sensor ใหม่", cost:0},
  {id:"replace_occ", n:"เปลี่ยน occlusion sensor", cost:4800},
  {id:"user_set", n:"แจ้งหน่วยงานให้ใช้ชุดสายที่กำหนด (ไม่เปลี่ยนอะไหล่)", cost:0},
  {id:"replace_fingers", n:"เปลี่ยนชุดนิ้วกดและ platen", cost:7200},
  {id:"replace_aff", n:"เปลี่ยนชุด anti-free-flow clamp", cost:1500},
  {id:"clean_encoder", n:"ทำความสะอาด encoder และกลไก", cost:0},
  {id:"replace_motor", n:"เปลี่ยนมอเตอร์", cost:5500},
  {id:"replace_board", n:"เปลี่ยนบอร์ดหลัก", cost:18000},
  {id:"replace_batt", n:"เปลี่ยนแบตเตอรี่", cost:2800},
  {id:"replace_fuse", n:"เปลี่ยน fuse ขนาดเดิม", cost:30},
  {id:"replace_psu", n:"เปลี่ยน power supply", cost:4200}
];

SIM.TESTS = [
  {id:"t_func", n:"ทดสอบการทำงานทั่วไปและ alarm ทุกชนิด", min:20},
  {id:"t_flow", n:"Flow accuracy test", min:60},
  {id:"t_occ", n:"Occlusion pressure test", min:20},
  {id:"t_air", n:"Air detection test", min:15},
  {id:"t_batt", n:"ทดสอบเวลาสำรองไฟ", min:120},
  {id:"t_esafety", n:"Electrical safety test (IEC 60601)", min:20}
];

SIM.CASES = [
  {id:"c1", block:{t:"Air in line ดังขัดจังหวะทุกไม่กี่นาที ทดสอบไม่จบ", ids:["m_flow","m_batt_run"]},
   lv:1, n:"Air alarm ดังทั้งที่ไม่มีฟอง",
   ward:"หอผู้ป่วยอายุรกรรมหญิง", alarm:"AIR IN LINE",
   note:"เครื่องขึ้น Air in line บ่อยมาก ไล่ฟองแล้วไม่เห็นฟองอากาศ แต่ผ่านไปไม่กี่นาทีก็ดังอีก ใช้กับ D5W",
   budget:100,
   r:{
     interview:{t:"พยาบาลบอกว่าเมื่อสัปดาห์ก่อนมีสาร D5W หกใส่เครื่อง แล้วเช็ดด้วยผ้าเปียก"},
     inspect_ext:{t:"พบคราบน้ำตาลแห้งเป็นฟิล์มเหนียวในร่อง air sensor", bad:true},
     reproduce:{t:"Air in line ดังหลังเดินเครื่อง 4 นาที ในสายไม่มีฟองอากาศ", bad:true},
     svc_air:{t:"สัญญาณขณะสายเต็มน้ำต่ำกว่าเกณฑ์", v:"41% (เกณฑ์ ≥ 70%)", bad:true}
   },
   key:["inspect_ext","svc_air"], ans:"air_dirty", fix:["clean_air"], costly:["replace_air"], need:["t_func","t_air"],
   learn:"น้ำตาลจาก D5W ที่แห้งเป็นฟิล์มทำให้หน้า sensor แนบกับผนังสายได้ไม่ดี คลื่น ultrasonic จึงส่งผ่านเข้าผนังสายได้น้อยลง สัญญาณอ่อนลงจนเครื่องเข้าใจว่ามีฟองอากาศ แค่ทำความสะอาดก็แก้ได้ การเปลี่ยน sensor จึงสิ้นเปลืองโดยไม่จำเป็น และควรแนะนำหน่วยงานเรื่องวิธีเช็ดทำความสะอาดเครื่องด้วย"},

  {id:"c2", block:{t:"เดินเครื่องไม่ได้ เพราะขึ้น Door open ตลอด", ids:["m_flow","m_occ_press","m_batt_run","m_enc"]},
   lv:1, n:"ขึ้น Door open ตลอดเวลา",
   ward:"หอผู้ป่วยศัลยกรรมชาย", alarm:"DOOR OPEN",
   note:"ปิดฝาแน่นแล้วแต่เครื่องยังขึ้น Door open เริ่มงานไม่ได้เลย เครื่องเคยตกจากเสาน้ำเกลือ",
   budget:80,
   r:{
     interview:{t:"เครื่องตกจากเสาน้ำเกลือเมื่อ 2 วันก่อน หลังจากนั้นก็ขึ้น Door open"},
     inspect_ext:{t:"ตำแหน่งที่ฝังแม่เหล็กบนฝาว่างเปล่า แม่เหล็กหลุดหายไป ขาล็อกฝาปกติ", bad:true},
     svc_door:{t:"สถานะเป็น OPEN ตลอด ทั้งตอนเปิดและปิดฝา แต่เมื่อนำแม่เหล็กอีกชิ้นมาจ่อ สถานะเปลี่ยนเป็น CLOSED", bad:true},
     reproduce:{t:"เริ่มเดินเครื่องไม่ได้ ขึ้น Door open ทันที", bad:true}
   },
   key:["inspect_ext","svc_door"], ans:"door_magnet", fix:["replace_magnet"], costly:[], need:["t_func"],
   learn:"การนำแม่เหล็กอีกชิ้นมาจ่อแล้วสถานะเปลี่ยน พิสูจน์ได้ว่า Hall sensor ยังดีอยู่ ปัญหาจึงอยู่ที่แม่เหล็กบนฝา เครื่องที่ตกกระแทกควรตรวจรอยร้าวของตัวเครื่องและทำ functional test ให้ครบด้วย"},

  {id:"c3", lv:2, n:"Occlusion alarm ดังทั้งที่สายโล่ง",
   ward:"หอผู้ป่วยเด็ก", alarm:"DOWNSTREAM OCCLUSION",
   note:"ขึ้น Occlusion บ่อย ตรวจสายแล้วไม่หักพับ clamp เปิดหมด เปลี่ยนเข็มให้ผู้ป่วยไปแล้วก็ยังดัง",
   budget:210,
   r:{
     reproduce:{t:"เดินเครื่องโดยปลายสายเปิดลงบีกเกอร์ ผ่านไป 12 นาทีขึ้น Downstream occlusion", bad:true},
     svc_occ:{t:"ค่า downstream ขณะไม่ใส่สายสูงกว่าเกณฑ์มาก ส่วน upstream ปกติ", v:"UP 101 / DN 176 counts (ref 100±10)", bad:true},
     m_occ_press:{t:"alarm ดังที่แรงดันต่ำกว่าระดับที่ตั้งไว้มาก", v:"alarm ที่ 160 mmHg (ตั้งระดับ H ≈ 750)", bad:true},
     inspect_ext:{t:"หน้า sensor สะอาด ไม่มีคราบ"},
     log:{t:"พบ Downstream occlusion 47 ครั้งใน 2 สัปดาห์ ไม่มี error อื่น"}
   },
   key:["svc_occ","m_occ_press"], ans:"occ_drift", fix:["recal_occ"], costly:["replace_occ"], need:["t_occ","t_flow","t_func"],
   learn:"ค่า zero ของ sensor ที่เลื่อนขึ้น ทำให้เครื่องเข้าใจว่ามีแรงดันค้างอยู่แล้ว alarm จึงดังเร็วกว่าที่ตั้งไว้ ให้สอบเทียบใหม่ก่อน ถ้าสอบเทียบแล้วค่ายังไม่นิ่งหรือสอบเทียบไม่ผ่าน จึงค่อยเปลี่ยน sensor"},

  {id:"c4", lv:2, n:"แบตหมดเร็วผิดปกติ",
   ward:"ห้องฉุกเฉิน", alarm:"LOW BATTERY",
   note:"ถอดปลั๊กเคลื่อนย้ายผู้ป่วยไปห้อง CT ได้ไม่ถึงครึ่งชั่วโมงก็ขึ้น Low battery ชาร์จทิ้งไว้ทั้งคืนแล้ว",
   budget:380,
   r:{
     svc_batt:{t:"แบตอายุ 3 ปี 2 เดือน ผ่านการชาร์จมาแล้ว 640 รอบ วงจรชาร์จจ่ายกระแสปกติ", v:"12.6 V (ไม่มีโหลด) · charging OK", bad:true},
     m_batt_run:{t:"เวลาสำรองไฟสั้นกว่าเกณฑ์มาก", v:"27 นาที (เกณฑ์ ≥ 3 ชม.)", bad:true},
     check_power:{t:"สายไฟปกติ ไฟแสดงการชาร์จติด"},
     m_psu:{t:"แรงดันขาออกปกติ", v:"15.0 V DC"}
   },
   key:["svc_batt","m_batt_run"], ans:"batt_aged", fix:["replace_batt"], costly:[], need:["t_batt","t_func"],
   learn:"แรงดันขณะไม่มีโหลดดูปกติได้แม้แบตจะเสื่อมแล้ว ต้องทดสอบเวลาสำรองไฟจริงจึงจะเห็นปัญหา อายุแบตกว่า 3 ปีและเวลาสำรองที่สั้นลงมาก ยืนยันว่าแบตเสื่อมตามอายุ ส่วนวงจรชาร์จยังปกติ"},

  {id:"c5", lv:2, n:"ให้สารละลายได้น้อยกว่าที่ตั้ง",
   ward:"หอผู้ป่วยอายุรกรรมชาย", alarm:"ไม่มี alarm",
   note:"ตั้ง 100 mL/h ครบ 10 ชม. ควรหมด 1,000 mL แต่ยังเหลือในถุงประมาณ 150 mL เป็นกับเครื่องหลายเครื่องในหอนี้",
   budget:200,
   r:{
     interview:{t:"ปัญหาเริ่มเมื่อเดือนที่แล้ว และเกิดกับเครื่องเกือบทุกเครื่องในหอผู้ป่วย"},
     check_set:{t:"หน่วยงานเปลี่ยนไปใช้ชุดสายราคาถูกจากผู้จำหน่ายรายอื่นตั้งแต่เดือนที่แล้ว ขนาดในของสายไม่ตรงกับที่ผู้ผลิตเครื่องกำหนด", bad:true},
     m_flow:{t:"ทดสอบด้วยชุดสายของหน่วยงานได้ −14.2% แต่ทดสอบซ้ำด้วยชุดสายรุ่นที่ผู้ผลิตกำหนดได้ −1.8%", v:"−14.2% → −1.8%", bad:true},
     inspect_mech:{t:"นิ้วกดและ platen สภาพดี ไม่สึก"}
   },
   key:["check_set","m_flow"], ans:"wrong_set", fix:["user_set"], costly:["replace_fingers"], need:["t_flow"],
   learn:"ปริมาตรที่เครื่องดันได้ต่อรอบขึ้นกับขนาดในของสาย เมื่อเปลี่ยนไปใช้ชุดสายที่ไม่ได้กำหนด ความแม่นยำจึงคลาดไป ปัญหาที่เกิดกับหลายเครื่องพร้อมกันมักมาจากวัสดุสิ้นเปลืองหรือวิธีใช้งาน ไม่ใช่ตัวเครื่อง ช่างต้องแจ้งหน่วยงานเป็นลายลักษณ์อักษรด้วย เพราะผู้ป่วยอาจได้รับยาไม่ครบตามแผนการรักษา"},

  {id:"c6", block:{t:"Motor error ขึ้นกลางคัน ทดสอบไม่จบ", ids:["m_flow","m_batt_run"]},
   lv:3, n:"Motor error เป็นๆ หายๆ",
   ward:"หอผู้ป่วยวิกฤต (ICU)", alarm:"MOTOR ERROR",
   note:"เครื่องขึ้น Motor error แล้วหยุดเอง บางวันเป็น 2–3 ครั้ง บางวันไม่เป็นเลย ปิดเปิดใหม่ก็ใช้ได้ต่อ",
   budget:220,
   r:{
     interview:{t:"เครื่องเคยโดนน้ำเกลือจากถุงรั่วหยดใส่ด้านบนเมื่อเดือนก่อน"},
     log:{t:"พบ Motor error 11 ครั้ง เริ่มเกิดหลังเหตุการณ์ fluid ingress ที่บันทึกไว้", bad:true},
     reproduce:{t:"ขึ้น Motor error ที่นาทีที่ 22", bad:true},
     inspect_int:{t:"พบคราบเกลือแห้งเป็นจุดๆ บนจาน encoder บอร์ดไม่มีการกัดกร่อน", bad:true},
     inspect_mech:{t:"เพลาหมุนลื่น ไม่ฝืด แต่มีคราบเกลือแห้งบริเวณจาน encoder"},
     m_enc:{t:"พัลส์ขาดหายเป็นช่วงๆ ทุกครั้งที่ส่วนที่มีคราบหมุนผ่านตัวอ่าน", v:"missing pulses ~ 3/รอบ", bad:true},
     m_motor:{t:"ขดลวดทั้ง 2 เฟสปกติ", v:"A 32.3 Ω · B 32.2 Ω"}
   },
   key:["m_enc","m_motor"], ans:"encoder_dirty", fix:["clean_encoder"], costly:["replace_motor"], need:["t_func","t_flow","t_esafety"],
   learn:"เมื่อ encoder อ่านพัลส์ได้ไม่ครบ MCU จะเห็นว่ามอเตอร์หมุนไม่ครบตามที่สั่ง จึงขึ้น Motor error ทั้งที่มอเตอร์ยังดีอยู่ ค่าความต้านทานขดลวดที่ปกติช่วยตัดมอเตอร์ออกไปจากสาเหตุได้ เครื่องที่เคยโดนของเหลวต้องทำ electrical safety test ก่อนส่งคืนทุกครั้ง"},

  {id:"c7", block:{t:"เครื่องเปิดไม่ติด ทำการตรวจนี้ไม่ได้", ids:["reproduce","svc_occ","svc_air","svc_drop","svc_door","svc_keys","m_flow","m_occ_press","m_batt_run","m_rails","m_enc"]},
   lv:3, n:"เสียบไฟแล้วเครื่องไม่ติด",
   ward:"หอผู้ป่วยหลังคลอด", alarm:"ไม่มี (จอดับ)",
   note:"ใช้ด้วยแบตจนหมด เสียบปลั๊กแล้วเครื่องไม่ติด ไฟ AC ไม่ขึ้น ลองเปลี่ยนเต้ารับแล้วก็ไม่ติด",
   budget:120,
   r:{
     check_power:{t:"สายไฟต่อเนื่องดี (ลองกับเครื่องอื่นแล้วใช้ได้) แต่เสียบกับเครื่องนี้ไฟแสดง AC ไม่ติด", bad:true},
     inspect_ext:{t:"ไม่มีรอยไหม้หรือกลิ่นไหม้"},
     m_fuse:{t:"fuse ขาด", v:"OL (open)", bad:true},
     m_psu:{t:"ไม่มีแรงดันขาออก เพราะ fuse ขาด", v:"0.0 V DC", bad:true},
     inspect_int:{t:"ไม่พบอุปกรณ์ไหม้ ตัวเก็บประจุไม่บวม ไม่พบจุดลัดวงจร"},
     svc_batt:{t:"เปิดเครื่องไม่ได้ จึงเข้า service mode ไม่ได้"},
     log:{t:"เปิดเครื่องไม่ได้ จึงดาวน์โหลด log ไม่ได้"}
   },
   key:["m_fuse","inspect_int"], ans:"fuse_blown", fix:["replace_fuse"], costly:["replace_psu"], need:["t_esafety","t_func"],
   learn:"ต้องเปลี่ยน fuse ด้วยพิกัดกระแสและชนิดเดิมเท่านั้น และต้องตรวจหาสาเหตุที่ทำให้ fuse ขาดก่อน ถ้า fuse ใหม่ขาดซ้ำ แสดงว่ามีจุดลัดวงจรใน power supply งานที่แตะภาคจ่ายไฟ AC ต้องทำ electrical safety test ทุกครั้ง"},

  {id:"c8", lv:3, n:"สารละลายไหลเร็วผิดปกติ (free flow)",
   ward:"หอผู้ป่วยอายุรกรรมหญิง", alarm:"ไม่มี alarm",
   note:"ระหว่างเปลี่ยนถุง เปิดฝาเครื่องแล้วน้ำเกลือไหลลงไปหาผู้ป่วยเองเร็วมาก โชคดีที่เห็นทัน",
   budget:210,
   r:{
     interview:{t:"พยาบาลเปิดฝาโดยไม่ได้ปิด roller clamp ก่อน เคยทำแบบนี้มาตลอดโดยไม่มีปัญหา"},
     reproduce:{t:"ขณะปิดฝาเครื่องควบคุมอัตราไหลได้ปกติ แต่เมื่อเปิดฝา น้ำไหลผ่านสายได้อย่างอิสระ", bad:true},
     inspect_ext:{t:"ตัวหนีบ anti-free-flow ไม่ดีดกลับมาปิดสายเมื่อเปิดฝา", bad:true},
     inspect_mech:{t:"สปริงของชุด anti-free-flow clamp หัก นิ้วกดปกติ", bad:true},
     m_flow:{t:"ขณะปิดฝา อัตราไหลอยู่ในเกณฑ์", v:"−2.1% (เกณฑ์ ±5%)"}
   },
   key:["reproduce","inspect_mech"], ans:"aff_clamp", fix:["replace_aff"], costly:[], need:["t_func","t_flow"],
   learn:"Anti-free-flow clamp เป็นด่านป้องกันสุดท้ายเมื่อผู้ใช้ลืมปิด roller clamp ถ้าชำรุด ผู้ป่วยอาจได้รับยาเกินขนาดอย่างรุนแรง ต้องนำเครื่องออกจากการใช้งานทันที รายงานอุบัติการณ์ และทบทวนวิธีเปลี่ยนถุงกับหน่วยงาน"}
];
