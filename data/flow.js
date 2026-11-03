/* ===== ข้อมูลแอนิเมชันเส้นทางสัญญาณ (โมดูล 1) =====
   ชื่อเส้นทาง (ใช้ใน f):
     key, drop, occu, occd, air, door   = จากปุ่มกด/sensor เข้า MCU
     drv  = MCU → motor driver        mot  = driver → มอเตอร์
     mech = มอเตอร์ → กลไกบีบสาย       link = มอเตอร์ → encoder (บนเพลาเดียวกัน)
     enc  = encoder → MCU             disp = MCU → จอ       buz = MCU → buzzer / nurse call
     pwr  = ภาคจ่ายไฟ → MCU
   ชนิดสัญญาณ: cmd=คำสั่ง  fb=สัญญาณย้อนกลับ  mon=เฝ้าระวัง  out=แสดงผล  alarm=ผิดปกติ  stop=ตัดคำสั่ง
   cut = สถานะภาพตัดภายใน: run, hi (ชิ้นส่วนที่เน้น), screen, bubble, pinch, door, buzzer
*/
window.FLOW = {
  normalLoop: [["key","cmd"],["drv","cmd"],["mot","cmd"],["mech","cmd"],["link","fb"],["enc","fb"],["drop","mon"],["occu","mon"],["occd","mon"],["air","mon"],["door","mon"],["disp","out"],["pwr","pwr"]],
  scenarios: [
   {id:"normal", n:"ทำงานปกติ",
    steps:[
     {t:"ผู้ใช้ตั้งอัตรา 100 mL/h และปริมาตรที่จะให้ (VTBI) ผ่านปุ่มกด แล้วกด Start คำสั่งวิ่งเข้า MCU",
      f:[["key","cmd"]], cut:{hi:["keypad"], screen:"RATE 100 mL/h"}},
     {t:"ก่อนเริ่มดัน MCU ตรวจความพร้อมทุกจุด: ฝาปิดสนิทไหม มีฟองอากาศไหม สายอุดตันไหม ถ้าไม่พร้อม เครื่องจะไม่ยอมเริ่ม",
      f:[["door","mon"],["air","mon"],["occu","mon"],["occd","mon"]], cut:{hi:["door","air","occ_up","occ_down"], screen:"CHECKING…"}},
     {t:"MCU คำนวณว่ามอเตอร์ต้องหมุนกี่ก้าวต่อวินาที จึงจะได้ 100 mL/h แล้วส่งพัลส์สั่งงานไปที่ motor driver",
      f:[["drv","cmd"]], cut:{hi:["mcu"], screen:"RATE 100 mL/h"}},
     {t:"Motor driver แปลงพัลส์เป็นกระแสจ่ายให้ขดลวด stepper motor มอเตอร์หมุนทีละก้าวตามจำนวนพัลส์",
      f:[["mot","cmd"]], cut:{hi:["motor"], run:true, screen:"RUNNING"}},
     {t:"เพลาลูกเบี้ยวดันนิ้วกดบีบสายไล่จากบนลงล่าง สารละลายถูกดันไปหาผู้ป่วยด้วยปริมาตรที่แน่นอนในแต่ละรอบ",
      f:[["mech","cmd"]], cut:{hi:["fingers"], run:true, screen:"RUNNING"}},
     {t:"Encoder บนเพลามอเตอร์ส่งพัลส์กลับให้ MCU ใช้ตรวจว่ามอเตอร์หมุนครบตามที่สั่ง ถ้าไม่ครบจะขึ้น Motor error",
      f:[["link","fb"],["enc","fb"]], cut:{hi:["motor"], run:true, screen:"RUNNING"}},
     {t:"ระหว่างให้สารละลาย sensor ทุกตัวส่งค่าเข้า MCU ตลอดเวลา MCU เปรียบเทียบกับเกณฑ์อยู่ตลอดเวลา",
      f:[["drop","mon"],["occu","mon"],["occd","mon"],["air","mon"],["door","mon"]], cut:{hi:["dropsensor","occ_up","occ_down","air","door"], run:true, screen:"RUNNING"}},
     {t:"MCU แสดงอัตรา ปริมาตรที่ให้ไปแล้ว และสถานะบนจอ ส่วนภาคจ่ายไฟเลี้ยงทุกวงจร และชาร์จแบตไปพร้อมกัน",
      f:[["disp","out"],["pwr","pwr"]], cut:{hi:["display","psu","battery"], run:true, screen:"100 mL/h · 35 mL"}}
    ]},
   {id:"air", n:"Alarm: ฟองอากาศ",
    steps:[
     {t:"เครื่องกำลังทำงานปกติ คำสั่ง สัญญาณย้อนกลับ และการเฝ้าระวังวิ่งพร้อมกันตลอดเวลา",
      normal:true, cut:{run:true, screen:"RUNNING"}},
     {t:"ฟองอากาศหลุดเข้ามาในสายและไหลลงมาถึง air sensor สัญญาณ ultrasonic ที่ตัวรับลดลงทันที เพราะคลื่นผ่านอากาศได้น้อย",
      f:[["air","alarm"]], cut:{run:true, hi:["air"], bubble:true, screen:"RUNNING"}},
     {t:"MCU คำนวณขนาดฟองจากช่วงเวลาที่สัญญาณลดลงเทียบกับอัตราไหล เมื่อเกินเกณฑ์ จะหยุดส่งพัลส์ให้ driver ทันที มอเตอร์หยุด ฟองจึงไม่ไปถึงผู้ป่วย",
      f:[["air","alarm"],["drv","stop"]], cut:{hi:["air","mcu"], bubble:true, screen:"STOP"}},
     {t:"MCU สั่ง buzzer ดัง ไฟเตือนกะพริบ และส่งสัญญาณ nurse call (ถ้าต่อไว้)",
      f:[["buz","alarm"]], cut:{hi:["buzzer"], bubble:true, buzzer:true, screen:"STOP"}},
     {t:"จอแสดง AIR IN LINE เครื่องจะไม่ยอมเดินต่อจนกว่าผู้ใช้จะไล่ฟองออกและกดเริ่มใหม่",
      f:[["disp","alarm"],["buz","alarm"]], cut:{hi:["display"], bubble:true, buzzer:true, screen:"⚠ AIR IN LINE"}}
    ]},
   {id:"occ", n:"Alarm: อุดตัน",
    steps:[
     {t:"เครื่องกำลังทำงานปกติ",
      normal:true, cut:{run:true, screen:"RUNNING"}},
     {t:"สายด้านผู้ป่วยถูกหนีบหรือหักพับ นิ้วกดยังดันต่อ แรงดันในสายจึงสูงขึ้นเรื่อยๆ จนผนังสายพองดัน downstream sensor",
      f:[["occd","alarm"],["mot","cmd"]], cut:{run:true, hi:["occ_down"], pinch:true, screen:"RUNNING"}},
     {t:"เมื่อแรงดันเกินระดับที่ตั้งไว้ MCU หยุดส่งพัลส์ให้ driver มอเตอร์หยุด เครื่องหลายรุ่นถอยมอเตอร์กลับเล็กน้อยเพื่อลดแรงดันที่ค้างในสาย (bolus reduction)",
      f:[["occd","alarm"],["drv","stop"]], cut:{hi:["occ_down","mcu"], pinch:true, screen:"STOP"}},
     {t:"MCU สั่ง buzzer ดัง ไฟเตือนกะพริบ และส่งสัญญาณ nurse call",
      f:[["buz","alarm"]], cut:{hi:["buzzer"], pinch:true, buzzer:true, screen:"STOP"}},
     {t:"จอแสดง OCCLUSION ผู้ใช้ต้องหาจุดที่อุดตันและแก้ไขก่อน แล้วจึงกดเริ่มใหม่",
      f:[["disp","alarm"],["buz","alarm"]], cut:{hi:["display"], pinch:true, buzzer:true, screen:"⚠ OCCLUSION ↓"}}
    ]},
   {id:"door", n:"Alarm: ฝาเปิด",
    steps:[
     {t:"เครื่องกำลังทำงานปกติ",
      normal:true, cut:{run:true, screen:"RUNNING"}},
     {t:"ผู้ใช้เปิดฝาระหว่างที่เครื่องกำลังทำงาน แม่เหล็กบนฝาเคลื่อนออกห่าง Hall sensor สถานะเปลี่ยนเป็น OPEN ทันที",
      f:[["door","alarm"]], cut:{run:true, hi:["door"], door:true, screen:"RUNNING"}},
     {t:"MCU หยุดส่งพัลส์ให้ driver มอเตอร์หยุด ส่วน anti-free-flow clamp หนีบสายปิดด้วยกลไกสปริงทันทีที่เปิดฝา ซึ่งทำงานเองโดยไม่ต้องรอคำสั่งจาก MCU",
      f:[["door","alarm"],["drv","stop"]], cut:{hi:["door","mcu"], door:true, screen:"STOP"}},
     {t:"MCU สั่ง buzzer ดังและไฟเตือนกะพริบ",
      f:[["buz","alarm"]], cut:{hi:["buzzer"], door:true, buzzer:true, screen:"STOP"}},
     {t:"จอแสดง DOOR OPEN เครื่องจะเริ่มใหม่ได้เมื่อปิดฝาสนิทและผู้ใช้กดยืนยัน",
      f:[["disp","alarm"],["buz","alarm"]], cut:{hi:["display"], door:true, buzzer:true, screen:"⚠ DOOR OPEN"}}
    ]}
  ]
};
