/* ===== เครื่องควบคุมการให้สารละลาย (volumetric infusion pump) แบบ 3 มิติ =====
   หน่วย = เซนติเมตร (ประมาณ) แกน Y ขึ้น ด้านหน้าเครื่องหันไป +Z
   โครงสร้างโค้ดเหมือนหน้าตู้อบ 3 มิติ (infant-incubator-trainer/3d) เพื่อให้ดูแลง่าย
   ทุกชิ้นสร้างจากรูปทรงพื้นฐาน ไม่ได้ใช้โมเดลของผู้ผลิต */
import * as THREE from "three";
import { OrbitControls } from "./lib/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "./lib/CSS2DRenderer.js";

const MODE = new URLSearchParams(location.search).get("mode") === "clin" ? "clin" : "tech";
const PARTS = Object.assign({}, window.PARTS || {}, window.EXTRA3D || {});
const CLIN = window.CLIN3D || {}, GROUPS = window.GROUPS3D || [];
/* โหมดจอแคบ: มือถือ แท็บเล็ตแนวตั้ง และมือถือที่เปิด "เว็บไซต์เดสก์ท็อป" (ต้องตรงกับ @media ใน style.css) */
const NARROW = matchMedia("(max-width:900px), (orientation:portrait) and (max-width:1200px)");
const MOBILE = NARROW.matches;

if (MODE === "clin") {
  const b = document.getElementById("back");
  b.href = "../clinical/#lessons"; b.textContent = "← กลับวิชาคลินิก";
}

/* ---------- renderer / scene ---------- */
const stage = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
stage.prepend(renderer.domElement);
const labelR = new CSS2DRenderer();
labelR.domElement.className = "labels";
stage.appendChild(labelR.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 1, 3000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.minDistance = 70; controls.maxDistance = 900;
controls.target.set(14, 112, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96a8, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(140, 260, 180); scene.add(sun);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6); fill.position.set(-160, 120, -120); scene.add(fill);

/* เงานุ่มใต้ตู้ (ภาพไล่สี ไม่ใช้ shadow map เพื่อให้มือถือลื่น) */
{
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(30,40,55,.35)"); gr.addColorStop(1, "rgba(30,40,55,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(190, 130), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.05; scene.add(m);
}


/* ---------- วัสดุ ---------- */
const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.05 }, o));
const M = {
  shell: mat(0xeef1f4, { transparent: true, opacity: 1 }), front: mat(0xffffff, { transparent: true, opacity: 1 }), accent: mat(0x0f7a6c),
  chan: mat(0xc9d1da), dark: mat(0x2f3742), black: mat(0x1d2229), steel: mat(0xb8c0c9, { metalness: 0.7, roughness: 0.3 }),
  pole: mat(0xc7ced6, { metalness: 0.75, roughness: 0.28 }), rubber: mat(0x2b3138, { roughness: 0.9 }),
  door: new THREE.MeshStandardMaterial({ color: 0x9fb3c4, transparent: true, opacity: 0.35, roughness: 0.15, depthWrite: false, side: THREE.DoubleSide }),
  bag: new THREE.MeshStandardMaterial({ color: 0xe8f3fb, transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide }),
  fluid: new THREE.MeshStandardMaterial({ color: 0x8cc4ec, transparent: true, opacity: 0.55, roughness: 0.15 }),
  chamber: new THREE.MeshStandardMaterial({ color: 0xf2f6fa, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false }),
  tube: new THREE.MeshStandardMaterial({ color: 0xdbeaf5, transparent: true, opacity: 0.85, roughness: 0.25 }),
  finger: mat(0x8d99a8, { metalness: 0.4 }), cam: mat(0x6b7684, { metalness: 0.6 }), motor: mat(0x3d4652, { metalness: 0.5 }),
  sensUp: mat(0x2f6fd6), sensDn: mat(0x2f6fd6), air: mat(0xe8590c), drop: mat(0x0f7a6c),
  pcb: mat(0x1f7a46), chip: mat(0x22262c), copper: mat(0xb87333, { metalness: 0.6, roughness: 0.35 }),
  psu: mat(0x9aa3ad, { metalness: 0.5 }), batt: mat(0x2b3a55), key: mat(0xe3e8ee), keyG: mat(0x2f9e5b), keyR: mat(0xd9480f),
  ledR: mat(0xff6b6b, { emissive: 0x661010 }), ledG: mat(0x51cf66, { emissive: 0x0f4d1a }), clampM: mat(0x56627a)
};
const glassMats = [M.door, M.bag, M.chamber];

/* ---------- ตัวช่วยสร้างรูปทรง ---------- */
function box(w, h, d, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z);
  if (parent) parent.add(o); return o;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, parent, seg = 24) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z);
  if (parent) parent.add(o); return o;
}
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function tag(obj, id) { obj.traverse(o => { if (o.isMesh) o.userData.part = id; }); }
const tubeMesh = (pts, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 48, r, 10), m);

const nodes = [];
function reg(node, explode = [0, 0, 0]) {
  node.userData.base = { p: node.position.clone(), r: node.rotation.clone() };
  node.userData.ex = new THREE.Vector3(...explode);
  node.userData.fx = [];
  nodes.push(node); return node;
}

/* ========== สร้างเครื่อง ========== */
const partRoot = {}, labelAt = {};
const PX = 14, PY = 96;          // ตำแหน่งตัวปั๊มบนเสา (มุมซ้ายล่างของตัวเครื่องอยู่ที่ PX-11, PY)
const CX = PX - 6.5, CZ = 6.6;   // แนวร่องสายในโลก (x, z)

/* --- เสาน้ำเกลือ --- */
const poleG = grp(scene); partRoot.pole = poleG;
for (let i = 0; i < 5; i++) {
  const a = i / 5 * Math.PI * 2 + 0.3, leg = box(28, 2.2, 3, M.pole, Math.cos(a) * 13, 5, Math.sin(a) * 13, poleG); leg.rotation.y = -a;
  const w = cyl(2.4, 2.4, 2, M.rubber, Math.cos(a) * 27, 2.4, Math.sin(a) * 27, poleG, 16); w.rotation.z = Math.PI / 2; w.rotation.y = -a;
}
cyl(3.2, 3.2, 4, M.pole, 0, 6, 0, poleG);
cyl(1.2, 1.2, 172, M.pole, 0, 90, 0, poleG, 16);
cyl(0.8, 0.8, 18, M.pole, 0, 174, 0, poleG, 12).rotation.z = Math.PI / 2;
[-8, 8].forEach(x => { const h = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.35, 8, 16, Math.PI * 1.4), M.pole); h.position.set(x, 172.6, 0); h.rotation.z = Math.PI * 0.8; poleG.add(h); });
tag(poleG, "pole"); labelAt.pole = [poleG, [-3, 82, 2]];

/* --- ถุงยา + drip chamber + ชุดสาย --- */
const tubingG = grp(scene); partRoot.tubing = tubingG;
const bagG = grp(scene, CX, 0, 0);
{
  const bag = box(11, 17, 2.6, M.bag, 0, 162, 0, bagG); bag.renderOrder = 2;
  box(10, 11, 2, M.fluid, 0, 159, 0, bagG);
  box(3, 1.2, 0.4, M.steel, 0, 171.6, 0, bagG);
  cyl(0.6, 0.6, 3, M.steel, 0, 152.5, 0, bagG, 10);                       // spike
  const ch = cyl(1.5, 1.5, 9, M.chamber, 0, 146, 0, bagG, 20); ch.renderOrder = 2;
  cyl(1.35, 1.35, 3.2, M.fluid, 0, 143.2, 0, bagG, 20);
  tag(bagG, "tubing");
}
const drop = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M.fluid); drop.position.set(CX, 149, 0); scene.add(drop); drop.visible = false;
/* สายช่วงบน (จาก chamber ลงเข้าร่องเครื่อง) ช่วงในเครื่อง และช่วงล่าง (ไปผู้ป่วย) */
const tubeSet = grp(tubingG); reg(tubeSet, [0, 0, 14]);
tubeSet.add(tubeMesh([[CX, 141.5, 0], [CX, 136, 1.5], [CX, 131, CZ - 1], [CX, PY + 32, CZ]], 0.42, M.tube));
const rc = box(2.6, 3, 2.2, mat(0x5aa9e6), CX, 135, 1.2, tubeSet);       // roller clamp
cyl(0.42, 0.42, 33, M.tube, CX, PY + 15.5, CZ, tubeSet, 12);
tubeSet.add(tubeMesh([[CX, PY - 1, CZ], [CX, PY - 8, CZ + 2], [CX + 6, PY - 20, CZ + 10], [CX + 20, PY - 28, CZ + 20], [CX + 34, PY - 30, CZ + 26]], 0.42, M.tube));
box(2, 2, 2, M.steel, CX + 34.5, PY - 30, CZ + 26.3, tubeSet);
tag(tubeSet, "tubing"); labelAt.tubing = [tubeSet, [CX + 5, PY - 12, CZ + 6]];

/* --- drop sensor (หนีบที่ drip chamber) --- */
const dropG = grp(scene, CX, 146, 0); partRoot.dropsensor = dropG; reg(dropG, [8, 0, 0]);
box(1.6, 3, 3.6, M.drop, -2.3, 0, 0, dropG); box(1.6, 3, 3.6, M.drop, 2.3, 0, 0, dropG); box(6.2, 1, 3.6, M.drop, 0, 1.7, 0, dropG);
dropG.add(tubeMesh([[2.4, -1.6, -1.6], [5, -8, -4], [8, -20, -6], [10, -30, -8], [11, -42.5, -7]], 0.3, M.black));
tag(dropG, "dropsensor"); labelAt.dropsensor = [dropG, [5, 3, 0]];

/* --- ตัวปั๊ม --- */
const pumpG = grp(scene, PX, PY, 0); reg(pumpG);
const shellMeshes = [];
const sh = (...a) => { const o = box(...a); shellMeshes.push(o); return o; };
sh(22, 1.6, 18, M.shell, 0, 29.2, 0, pumpG); sh(22, 1.6, 18, M.shell, 0, 0.8, 0, pumpG);
sh(1.6, 30, 18, M.shell, -10.2, 15, 0, pumpG); sh(1.6, 30, 18, M.shell, 10.2, 15, 0, pumpG);
sh(13.2, 30, 1.6, M.front, 4.4, 15, 8.2, pumpG);                                       // แผงหน้าด้านขวา
sh(9, 30, 1, M.chan, -6.4, 15, 3.4, pumpG);                                            // ผนังหลังร่องสาย
sh(0.8, 30, 6, M.front, -2.2, 15, 6.4, pumpG);                                          // ขอบร่องด้านขวา
box(22.2, 1, 0.4, M.accent, 0, 3, 9.05, pumpG);
[[-4, 30.2, 6, M.ledG], [-1, 30.2, 6, M.ledR]].forEach(([x, y, z, m]) => { const l = cyl(0.6, 0.6, 0.6, m, x, y, z, pumpG, 12); });
shellMeshes.forEach(o => o.userData.part = "cover");
/* ตัวยึดเสา (ด้านหลังซ้าย) */
const clampG = grp(pumpG, -13.3, 15, -3);
box(4.6, 9, 5.5, M.clampM, 0, 0, 0, clampG); box(3, 9, 1.2, M.clampM, -0.8, 0, 3.2, clampG);
{ const s = cyl(0.5, 0.5, 6, M.steel, 0, 0, -4, clampG, 10); s.rotation.x = Math.PI / 2; const k = cyl(1.6, 1.6, 1.2, M.dark, 0, 0, -7, clampG, 16); k.rotation.x = Math.PI / 2; }
tag(clampG, "pole");

/* จอ + แผงปุ่ม */
const dispG = grp(pumpG); partRoot.display = dispG; reg(dispG, [0, 3, 8]);
box(12.4, 7.6, 0.6, M.black, 4.4, 22.6, 9.2, dispG);
{
  const c = document.createElement("canvas"); c.width = 512; c.height = 300; const g = c.getContext("2d");
  g.fillStyle = "#0b1d1a"; g.fillRect(0, 0, 512, 300);
  g.fillStyle = "#cfe9e1"; g.font = "30px monospace"; g.fillText("RATE  mL/h", 22, 46); g.fillText("VTBI  mL", 22, 200);
  g.fillStyle = "#7df2c8"; g.font = "bold 92px monospace"; g.fillText("125.0", 22, 142);
  g.font = "bold 52px monospace"; g.fillText("1000", 22, 262);
  g.fillStyle = "#f4b740"; g.font = "28px monospace"; g.fillText("● RUN", 360, 46); g.fillStyle = "#cfe9e1"; g.fillText("VI 250", 330, 262);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(11.2, 6.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
  s.position.set(4.4, 22.6, 9.52); dispG.add(s);
}
tag(dispG, "display"); labelAt.display = [dispG, [4.4, 27.5, 9.5]];
const keyG = grp(pumpG); partRoot.keypad = keyG; reg(keyG, [0, -2, 8]);
box(12.4, 13, 0.4, mat(0xdfe5ec), 4.4, 10, 9.15, keyG);
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) box(2.6, 1.9, 0.6, M.key, 1 + c * 3.4, 14.6 - r * 2.7, 9.5, keyG);
box(5, 1.9, 0.6, M.keyG, 2.3, 4.4, 9.5, keyG); box(5, 1.9, 0.6, M.keyR, 7.6, 4.4, 9.5, keyG);
tag(keyG, "keypad"); labelAt.keypad = [keyG, [9, 6, 10]];

/* ในร่องสาย: เซนเซอร์และกลไกบีบสาย (พิกัดในตัวปั๊ม) */
const LX = -6.5, LZ = CZ;
const upG = grp(pumpG); partRoot.occ_up = upG; reg(upG, [0, 0, 6]);
box(3.4, 2.6, 2.2, M.sensUp, LX, 26, LZ - 1.6, upG); tag(upG, "occ_up"); labelAt.occ_up = [upG, [LX - 6, 26, LZ]];
const dnG = grp(pumpG); partRoot.occ_down = dnG; reg(dnG, [0, 0, 6]);
box(3.4, 2.6, 2.2, M.sensDn, LX, 8, LZ - 1.6, dnG); tag(dnG, "occ_down"); labelAt.occ_down = [dnG, [LX - 6, 8, LZ]];
const airG = grp(pumpG); partRoot.air = airG; reg(airG, [0, 0, 6]);
box(1.6, 2.6, 2.6, M.air, LX - 1.5, 4, LZ, airG); box(1.6, 2.6, 2.6, M.air, LX + 1.5, 4, LZ, airG);
tag(airG, "air"); labelAt.air = [airG, [LX - 6, 4, LZ]];
/* ชุดกลไก: นิ้วกด + แกนลูกเบี้ยว + มอเตอร์ (ยกออกเป็นชุดได้) */
const mechG = grp(pumpG); reg(mechG);
const fingG = grp(mechG); partRoot.fingers = fingG; reg(fingG, [0, 0, -4]);
const fingers = [];
for (let i = 0; i < 12; i++) { const f = box(3, 0.62, 2.2, M.finger, LX, 11 + i * 0.8, LZ - 1.9, fingG); fingers.push(f); }
cyl(0.65, 0.65, 11, M.cam, LX, 15.4, LZ - 4, fingG, 12);
tag(fingG, "fingers"); labelAt.fingers = [fingG, [LX - 7, 15.5, LZ]];
const motG = grp(mechG); partRoot.motor = motG; reg(motG, [0, 0, -12]);
{ const m = cyl(2.6, 2.6, 5, M.motor, LX, 15.4, LZ - 7.6, motG, 24); m.rotation.x = Math.PI / 2;
  const e = cyl(2.2, 2.2, 0.4, mat(0x222831), LX, 15.4, LZ - 10.4, motG, 24); e.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(0.4, 0.4, 0.5, M.steel, LX + Math.cos(a) * 1.7, 15.4 + Math.sin(a) * 1.7, LZ - 10.6, motG); } }
tag(motG, "motor"); labelAt.motor = [motG, [LX, 19.5, LZ - 8]];

/* ประตูร่องสาย: บานพับด้านซ้าย เปิดออกด้านหน้า (มีแผ่นรองบีบด้านใน) */
const doorPivot = grp(pumpG, -11, 0, 9.2); partRoot.door = doorPivot; reg(doorPivot, [-6, 0, 10]);
{ const d = box(9, 29, 0.8, M.door, 4.5, 15, 0.4, doorPivot); d.renderOrder = 2;
  box(3.6, 13, 0.8, mat(0xdde3ea), 4.5, 15.5, -0.5, doorPivot);              // platen
  box(1.2, 1.2, 0.8, M.black, 7.8, 27, -0.5, doorPivot);                      // แม่เหล็กเซนเซอร์ประตู
  box(1.2, 6, 1.4, M.dark, 8.6, 15, 1, doorPivot);                            // มือจับ
}
tag(doorPivot, "door"); doorPivot.traverse(o => { if (o.isMesh) o.userData.act = "door"; });
labelAt.door = [doorPivot, [4.5, 31, 1]];

/* ภายใน: บอร์ดหลัก ภาคจ่ายไฟ แบตเตอรี่ เสียงเตือน (เห็นเมื่อถอดฝาหลัง) */
const mcuG = grp(pumpG); partRoot.mcu = mcuG; reg(mcuG, [0, 0, -22]);
box(17, 18, 0.6, M.pcb, 1.5, 17.5, -5.6, mcuG);
box(3, 3, 0.6, M.chip, 0, 19, -5.1, mcuG); box(2, 1.4, 0.5, M.chip, 4, 22, -5.1, mcuG); box(2, 1.4, 0.5, M.chip, 6, 15, -5.1, mcuG);
for (let i = 0; i < 6; i++) box(0.5, 2, 0.6, M.copper, -5 + i * 1.2, 10, -5.1, mcuG);
tag(mcuG, "mcu"); labelAt.mcu = [mcuG, [2, 26, -6]];
const psuG = grp(pumpG); partRoot.psu = psuG; reg(psuG, [6, 0, -14]);
box(7, 6, 5, M.psu, 5.5, 23, -1, psuG); cyl(1.6, 1.6, 2.4, M.copper, 5.5, 26.5, -1, psuG, 16);
tag(psuG, "psu"); labelAt.psu = [psuG, [6, 28, -1]];
const battG = grp(pumpG); partRoot.battery = battG; reg(battG, [0, -6, -12]);
box(12, 4, 6, M.batt, 3, 3.6, -3.5, battG); box(2, 0.6, 1, M.keyR, -1.5, 5.9, -3.5, battG);
tag(battG, "battery"); labelAt.battery = [battG, [3, 6, -4]];
const buzG = grp(pumpG); partRoot.buzzer = buzG; reg(buzG, [0, 6, -16]);
{ const b = cyl(1.4, 1.4, 1, M.black, -4, 27.3, -4, buzG, 18); }
tag(buzG, "buzzer"); labelAt.buzzer = [buzG, [-4, 29, -4]];
/* ฝาหลัง (ถอดได้) พร้อมเต้ารับไฟ */
const coverG = grp(pumpG); partRoot.cover = coverG; reg(coverG, [0, 0, -34]);
{ const c = box(22, 30, 1.6, M.shell, 0, 15, -8.2, coverG); shellMeshes.push(c);
  box(4, 3, 1, M.black, 5, 6, -9.3, coverG); box(3, 2, 0.8, M.dark, -3, 6, -9.2, coverG); box(10, 1, 0.3, M.accent, 2, 27, -9.05, coverG); }
tag(coverG, "cover"); labelAt.cover = [coverG, [6, 16, -9.5]];
/* ป้ายตัวเครื่องอยู่ที่ฝาหลัง จึงชี้ไปตรงนั้น ส่วนผนังอื่นนับเป็นตัวเครื่องด้วย */

/* ---------- การกระทำ (สั่งให้ชิ้นส่วนขยับ) ---------- */
const A = {
  door:    { on: "เปิดประตูร่องสาย", off: "ปิดประตูร่องสาย", fx: [[doorPivot, null, [0, -1.9, 0]]] },
  tube:    { on: "ถอดสายออกจากร่องเครื่อง", off: "ใส่สายกลับเข้าร่อง", req: ["door"], fx: [[tubeSet, [0, 0, 10]]] },
  dsens:   { on: "ถอด drop sensor ออกจาก chamber", off: "หนีบ drop sensor กลับ", fx: [[dropG, [7, 0, 0]]] },
  unmount: { on: "ถอดเครื่องออกจากเสา (ไปโต๊ะซ่อม)", off: "ติดเครื่องกลับบนเสา", req: ["tube"], fx: [[pumpG, [26, -6, 14]]] },
  cover:   { on: "ถอดฝาหลัง", off: "ประกอบฝาหลังกลับ", req: ["unmount"], fx: [[coverG, [0, 0, -18]]] },
  boards:  { on: "เลื่อนบอร์ดหลักและภาคจ่ายไฟออก", off: "ใส่บอร์ดกลับ", req: ["cover"], fx: [[mcuG, [0, 0, -12]], [psuG, [6, 0, -16]], [buzG, [0, 4, -8]]] },
  battery: { on: "ถอดแบตเตอรี่", off: "ใส่แบตเตอรี่กลับ", req: ["cover"], fx: [[battG, [0, -4, -20]]] },
  mech:    { on: "ยกชุดนิ้วกดและมอเตอร์ออก", off: "ใส่ชุดกลไกกลับ", req: ["cover", "boards"], fx: [[mechG, [0, 0, -26]]] }
};
const PART_ACTIONS = {
  door: ["door"], tubing: ["door", "tube"], dropsensor: ["dsens"], pole: ["unmount"], cover: ["unmount", "cover"],
  mcu: ["cover", "boards"], psu: ["cover", "boards"], buzzer: ["cover", "boards"], battery: ["cover", "battery"],
  fingers: ["door", "mech"], motor: ["cover", "mech"], occ_up: ["door"], occ_down: ["door"], air: ["door"], display: [], keypad: []
};
for (const k in A) { const a = A[k]; a.t = 0; a.v = 0; (a.fx || []).forEach(([n, dp, dr]) => n.userData.fx.push([a, dp, dr])); }
function isOn(k) { return !!A[k].t; }
function toggle(k) {
  const turnOn = !isOn(k), a = A[k];
  if (turnOn) {
    const miss = (a.req || []).filter(r => !A[r].t);
    if (miss.length) { toast("ต้อง" + A[miss[0]].on + "ก่อน"); return; }
  } else {
    const dep = Object.keys(A).find(o => A[o].t && (A[o].req || []).includes(k));
    if (dep) { toast("ต้อง" + A[dep].off + "ก่อน"); return; }
  }
  a.t = turnOn ? 1 : 0; refresh();
  if (window.Task3D) Task3D.onToggle(k, turnOn);
}

/* ---------- เดินเครื่อง: นิ้วกดบีบสายเป็นคลื่น + หยดใน chamber ---------- */
let running = false, phase = 0, dropT = 0;
function stepRun(dt) {
  phase += dt * 5;
  fingers.forEach((f, i) => { f.position.z = LZ - 1.9 + Math.max(0, Math.sin(phase - i * 0.55)) * 0.75; });
  dropT += dt;
  const can = A.tube.v < 0.05 && A.dsens.v < 0.05;
  drop.visible = can;
  if (can) { const u = (dropT % 0.9) / 0.9; drop.position.y = 149.2 - u * 4.6; drop.scale.setScalar(u < 0.15 ? u / 0.15 : 1); }
}

/* ---------- ป้ายชื่อ ---------- */
const SHORT = { pole: "เสาและตัวยึด", tubing: "ชุดสายและถุงยา", dropsensor: "Drop sensor", occ_up: "แรงดันด้านบน", fingers: "นิ้วกดบีบสาย",
  motor: "มอเตอร์ + encoder", occ_down: "แรงดันด้านล่าง", air: "เซนเซอร์ฟองอากาศ", door: "ประตูร่องสาย", display: "จอแสดงผล",
  keypad: "แผงปุ่มกด", mcu: "บอร์ดหลัก", battery: "แบตเตอรี่", psu: "ภาคจ่ายไฟ", buzzer: "เสียงเตือน", cover: "ฝาหลัง" };
const labels = {}, labelObj = {};
for (const id in labelAt) {
  const [node, p] = labelAt[id];
  const el = document.createElement("div"); el.className = "lbl"; el.textContent = SHORT[id] || id;
  el.addEventListener("pointerdown", e => e.stopPropagation());
  el.addEventListener("click", e => { e.stopPropagation(); select(id); });
  const o = new CSS2DObject(el); o.position.set(...p); node.add(o); labels[id] = el; labelObj[id] = o;
}
/* ป้ายของชิ้นที่ซ่อนอยู่ในฐานตู้ แสดงเมื่อเปิดให้เห็นแล้วเท่านั้น */
/* ป้ายของชิ้นในร่องสาย: แสดงเมื่อเปิดประตู · ชิ้นภายในเครื่อง: แสดงเมื่อถอดฝาหลัง (หรือแยกชิ้นส่วน / เลือกชิ้นนั้น) */
const INSIDE = { fingers: "door", occ_up: "door", occ_down: "door", air: "door", motor: "cover", mcu: "cover", psu: "cover", battery: "cover", buzzer: "cover" };
function labelVis() {
  for (const id in INSIDE) labelObj[id].visible = selected === id || exV > 0.25 || A[INSIDE[id]].v > 0.5 || shellMode > 0;
}

/* ---------- เลือกชิ้นส่วน ---------- */
const selBox = new THREE.BoxHelper(undefined, 0xe8590c); selBox.visible = false; selBox.material.depthTest = false; selBox.renderOrder = 5; scene.add(selBox);
let selected = null;
function select(id) {
  selected = id;
  for (const k in labels) labels[k].classList.toggle("sel", k === id);
  if (id && partRoot[id]) { selBox.setFromObject(partRoot[id]); selBox.visible = true; } else selBox.visible = false;
  renderSide();
}

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; }
  down = null;
  const hit = pick(e);
  if (!hit) { select(null); return; }
  if (hit.object.userData.act) { select(hit.object.userData.part); toggle(hit.object.userData.act); return; }
  select(hit.object.userData.part);
});
renderer.domElement.addEventListener("pointermove", e => {
  if (e.buttons) return;
  const h = pick(e); renderer.domElement.style.cursor = h ? "pointer" : "grab";
});
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.isMesh && h.object.visible && h.object.userData.part);
  /* ชิ้นโปร่งแสง (ประตู ถุง chamber) ให้ทะลุไปเลือกชิ้นข้างหลังก่อน · ตัวเครื่องโหมดโปร่งก็ทะลุเช่นกัน */
  const solid = hits.find(h => !glassMats.includes(h.object.material) && !(shellMode > 0 && shellMeshes.includes(h.object)));
  return solid || hits[0] || null;
}

/* ---------- แผงด้านขวา ---------- */
const side = document.getElementById("side");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function groupOf(id) { const g = GROUPS.find(g => g.ids.includes(id)); return g ? g.t : ""; }
function renderSide() {
  side.parentElement.scrollTop = 0;
  if (!selected) {
    side.innerHTML = `<h2>ชิ้นส่วนทั้งหมด</h2>
      <p class="en">${MODE === "clin" ? "โหมดพยาบาล · เน้นสิ่งที่ผู้ใช้ต้องดูแล" : "โหมดช่าง · หน้าที่ หลักการ อาการเสีย และวิธีตรวจ"}</p>
      ${GROUPS.map(g => `<div class="grp">${esc(g.t)}</div><div class="plist">${g.ids.map(id => `<button data-id="${id}">${esc(SHORT[id] || id)}</button>`).join("")}</div>`).join("")}
      <p class="note">ลองทำตามลำดับงานซ่อมจริง: เปิดประตู → ถอดสาย → ถอดเครื่องออกจากเสา → ถอดฝาหลัง → เลื่อนบอร์ดออก → ยกชุดกลไกออก ถ้าข้ามขั้น ระบบจะบอกว่าต้องทำอะไรก่อน กด "▶ เดินเครื่อง" เพื่อดูนิ้วกดบีบสายและหยดใน chamber</p>`;
    side.querySelectorAll("[data-id]").forEach(b => b.onclick = () => select(b.dataset.id));
    return;
  }
  const P = PARTS[selected] || {}, C = CLIN[selected] || {};
  const acts = (PART_ACTIONS[selected] || []).map(k => {
    const on = isOn(k), a = A[k];
    const lock = !on && k !== "ph" && (a.req || []).some(r => !A[r].t);
    const need = lock ? `<small>ต้อง${esc(A[(a.req || []).find(r => !A[r].t)].on)}ก่อน</small>` : "";
    return `<button data-a="${k}" class="${on ? "on" : ""}${lock ? " lock" : ""}">${esc(on ? a.off : a.on)}${need}</button>`;
  }).join("");
  const tech = MODE !== "clin";
  side.innerHTML = `<button class="link" id="all">← รายการทั้งหมด</button><br>
    <span class="chip">${esc(groupOf(selected))}</span>
    <h2>${esc(P.th || SHORT[selected])}</h2><div class="en">${esc(P.n || "")}</div>
    <p>${esc(tech ? (P.f || "") : (C.f || P.f || ""))}</p>
    ${acts ? `<h3>สั่งให้ขยับ</h3><div class="acts">${acts}</div>` : ""}
    ${tech && P.h ? `<h3>หลักการทำงาน</h3><p>${esc(P.h)}</p>` : ""}
    ${tech && P.x ? `<h3>อาการเสียที่พบบ่อย</h3><ul>${P.x.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    ${tech && P.c ? `<h3>วิธีตรวจเบื้องต้น</h3><ol>${P.c.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}
    ${!tech && C.care ? `<div class="care"><h3>สิ่งที่พยาบาลต้องดู</h3><ul>${C.care.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}`;
  side.querySelector("#all").onclick = () => select(null);
  side.querySelectorAll("[data-a]").forEach(b => b.onclick = () => toggle(b.dataset.a));
}
function refresh() { if (selected) renderSide(); }

let toastT = 0;
function toast(msg, ok) {
  const t = document.getElementById("toast"); t.textContent = msg; t.className = "toast" + (ok ? " ok" : ""); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600);
}

/* ---------- แถบเครื่องมือ ---------- */
/* [ทิศกล้อง, จุดมอง, รัศมีที่ต้องเห็นครบ] */
const VIEWS = { iso: [[80, 160, 110], [11, 128, 2], 54], front: [[12, 128, 200], [12, 128, 0], 52], back: [[-40, 125, -160], [14, 112, 0], 30], all: [[150, 140, 220], [8, 92, 4], 98] };
let camAnim = null;
let curView = "iso";
/* ระยะกล้องให้ทั้งตู้พอดีจอทุกสัดส่วน (จอแนวตั้งจะถอยกล้องออกให้เห็นครบ) */
function fitPos(v) {
  const [p, t, R] = VIEWS[v], tv = new THREE.Vector3(...t), dir = new THREE.Vector3(...p).sub(tv).normalize();
  const h = stage.clientHeight || 1, k = Math.max(0.3, (h - barH) / h);          // สัดส่วนความสูงที่ไม่ถูกแถบบัง
  const vf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * k), hf = 2 * Math.atan(Math.tan(vf / 2) * stage.clientWidth / (h * k));
  const dist = R / Math.sin(Math.min(vf, hf) / 2) * 1.04;
  return [tv.clone().addScaledVector(dir, dist), tv];
}
function view(v, instant) {
  curView = v;
  const [p1, t1] = fitPos(v);
  if (instant) { camAnim = null; camera.position.copy(p1); controls.target.copy(t1); }
  else camAnim = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1, t1 };
  document.querySelectorAll("#views button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
}
document.querySelectorAll("#views button").forEach(b => b.onclick = () => view(b.dataset.v));
const bLbl = document.getElementById("b-lbl");
bLbl.onclick = () => { const on = bLbl.classList.toggle("on"); labelR.domElement.classList.toggle("off", !on); };
/* ตัวเครื่อง: ทึบ → โปร่ง (มองเห็นข้างใน) */
let shellMode = 0;
const bHood = document.getElementById("b-hood");
bHood.onclick = () => {
  shellMode = (shellMode + 1) % 2;
  M.shell.opacity = M.front.opacity = shellMode ? 0.18 : 1;
  M.shell.depthWrite = M.front.depthWrite = !shellMode;
  bHood.textContent = "ตัวเครื่อง: " + (shellMode ? "โปร่ง" : "ทึบ"); bHood.classList.toggle("on", shellMode > 0);
};
const bAir = document.getElementById("b-air");
bAir.onclick = () => {
  running = !running; bAir.classList.toggle("on", running);
  bAir.textContent = running ? "■ หยุดเครื่อง" : "▶ เดินเครื่อง";
  if (running) toast("นิ้วกดบีบสายทีละนิ้วเป็นคลื่น ไล่สารละลายลงไปยังผู้ป่วย และมีหยดใน drip chamber ให้ drop sensor นับ", true);
  else { drop.visible = false; fingers.forEach(f => f.position.z = LZ - 1.9); }
};
const exInput = document.getElementById("explode");
let exT = 0, exV = 0;
exInput.oninput = () => { if (window.Task3D && Task3D.active()) { exInput.value = 0; toast("โหมดฝึก: ปิดการแยกชิ้นส่วนอัตโนมัติ"); return; } exT = exInput.value / 100; };
document.getElementById("b-reset").onclick = () => {
  if (window.Task3D && Task3D.active()) { toast("โหมดฝึก: ประกอบกลับทีละชิ้นด้วยตัวเอง"); return; }
  for (const k in A) A[k].t = 0; exT = 0; exInput.value = 0; refresh();
};

/* ---------- วนเฟรม ---------- */
const tmpV = new THREE.Vector3();
function applyNodes() {
  for (const n of nodes) {
    const b = n.userData.base;
    n.position.copy(b.p).addScaledVector(n.userData.ex, exV);
    n.rotation.copy(b.r);
    for (const [a, dp, dr] of n.userData.fx) {
      if (!a.v) continue;
      if (dp) n.position.add(tmpV.set(dp[0], dp[1], dp[2]).multiplyScalar(a.v));
      if (dr) { n.rotation.x += dr[0] * a.v; n.rotation.y += dr[1] * a.v; n.rotation.z += dr[2] * a.v; }
    }
  }
}
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
/* แถบเครื่องมือที่ลอยทับด้านล่างภาพ (จอกว้าง): เลื่อนภาพขึ้นให้เครื่องอยู่กลางพื้นที่ที่เหลือ ไม่ถูกแถบบัง */
let barH = 0;
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); labelR.setSize(w, h);
  const tb = document.querySelector(".bar");
  barH = tb && tb.parentElement === stage ? Math.min(tb.offsetHeight + 24, h * 0.4) : 0;
  camera.aspect = w / Math.max(h, 1);
  if (barH) camera.setViewOffset(w, h, 0, barH / 2, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
/* เปลี่ยนขนาดจอหรือหมุนเครื่อง: จัดกล้องให้พอดีใหม่ */
let lastAspect = 0, refitT = 0;
new ResizeObserver(() => {
  resize();
  if (Math.abs(camera.aspect - lastAspect) > 0.15) { lastAspect = camera.aspect; clearTimeout(refitT); refitT = setTimeout(() => view(curView, true), 60); }
}).observe(stage);
resize(); lastAspect = camera.aspect;
view("iso", true);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  for (const k in A) { const a = A[k]; a.v += Math.sign(a.t - a.v) * Math.min(Math.abs(a.t - a.v), dt * 2.2); }
  exV += (exT - exV) * Math.min(1, dt * 6);
  applyNodes(); labelVis();
  if (running) stepRun(dt);
  if (camAnim) {
    camAnim.t = Math.min(1, camAnim.t + dt * 1.4); const e = ease(camAnim.t);
    camera.position.lerpVectors(camAnim.p0, camAnim.p1, e); controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
    if (camAnim.t >= 1) camAnim = null;
  }
  controls.update();
  if (selBox.visible && selected) selBox.setFromObject(partRoot[selected]);
  renderer.render(scene, camera); labelR.render(scene, camera);
});

/* จอแคบ: ย้ายแถบเครื่องมือมาไว้ใต้ภาพเป็นแถวเลื่อนซ้าย-ขวา และปิดป้ายชื่อไว้ก่อนเพื่อไม่ให้รก */
const bar = document.querySelector(".bar");
function layout(narrow) {
  if (narrow) document.querySelector(".main").insertBefore(bar, side.parentElement);
  else stage.appendChild(bar);
  resize(); view(curView, true);
}
layout(MOBILE);
if (MOBILE) { bLbl.classList.remove("on"); labelR.domElement.classList.add("off"); }
NARROW.addEventListener("change", e => layout(e.matches));
document.getElementById("loading").remove();
renderSide();
if (window.Task3D) Task3D.init({ A, MODE, toast, reset: () => { exT = 0; exInput.value = 0; select(null); } });
window.__pump3d = { A, toggle, select, view };   // ใช้ทดสอบ
