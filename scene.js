// One object, lit properly: a coffee cup on a cork coaster.
// Scroll orbits the camera through the shots declared in each section's data-shot attribute.
// If this file (or WebGL) fails, the page is still complete — all content is plain HTML.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = 0x1a1411, FOV = 35;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
scene.fog = new THREE.Fog(INK, 7, 19);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);

// ---------- lights ----------
const key = new THREE.DirectionalLight(0xfff1dd, 2.6);
key.position.set(3, 6, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 16 });
key.shadow.radius = 6;
key.shadow.bias = -0.0005;
const rim = new THREE.PointLight(0xe8478a, 40, 14); // the Moodaeng pink
rim.position.set(-3, 1.6, -2.5);
scene.add(key, rim);

// ---------- canvas textures ----------
function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const latte = canvasTexture(512, (g, s) => {
  const h = s / 2;
  const crema = g.createRadialGradient(h, h, 0, h, h, h);
  crema.addColorStop(0, '#c08a55');
  crema.addColorStop(0.7, '#8a5633');
  crema.addColorStop(1, '#3d2416');
  g.fillStyle = crema;
  g.fillRect(0, 0, s, s);
  // latte-art heart
  g.translate(h, h * 0.92);
  g.shadowColor = '#f7efe6';
  g.shadowBlur = 14;
  g.fillStyle = '#f7efe6';
  g.beginPath();
  g.moveTo(0, 120);
  g.bezierCurveTo(-170, 10, -110, -130, 0, -50);
  g.bezierCurveTo(110, -130, 170, 10, 0, 120);
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(138,86,51,.55)';
  g.lineWidth = 7;
  for (const r of [0.55, 0.3]) { // rings inside the heart, like a poured rosetta
    g.beginPath();
    g.moveTo(0, 120 * r + 20);
    g.bezierCurveTo(-170 * r, 10, -110 * r, -130 * r, 0, -50 * r + 12);
    g.bezierCurveTo(110 * r, -130 * r, 170 * r, 10, 0, 120 * r + 20);
    g.stroke();
  }
});

const cork = canvasTexture(512, (g, s) => {
  g.fillStyle = '#b98b5e';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#8a5c3c', '#d3aa7c', '#6e4630', '#c79a6b'][i % 4];
    g.globalAlpha = 0.25 + Math.random() * 0.5;
    g.beginPath();
    g.ellipse(Math.random() * s, Math.random() * s, 1 + Math.random() * 5, 1 + Math.random() * 3, Math.random() * 3, 0, 7);
    g.fill();
  }
});

const puff = canvasTexture(128, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
});

// ---------- the cup ----------
const lathe = (pts, seg = 96) =>
  new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(90), seg);

const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf7efe6, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });

const body = new THREE.Mesh(lathe([
  [0, 0], [0.3, 0], [0.335, 0.03], [0.345, 0.08],                              // foot
  [0.42, 0.14], [0.52, 0.32], [0.58, 0.55], [0.61, 0.78], [0.62, 0.95],        // outer wall
  [0.605, 0.975], [0.585, 0.95],                                               // rim
  [0.57, 0.78], [0.54, 0.55], [0.48, 0.34], [0.38, 0.18], [0, 0.14],           // inner wall
]), ceramic);

const ARC = Math.PI * 1.1;
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 20, 48, ARC), ceramic);
handle.position.set(0.53, 0.5, 0);
handle.rotation.z = -ARC / 2;

const coffee = new THREE.Mesh(
  new THREE.CircleGeometry(0.572, 64),
  new THREE.MeshStandardMaterial({ map: latte, roughness: 0.4, envMapIntensity: 0.35 }),
);
coffee.rotation.x = -Math.PI / 2;
coffee.position.y = 0.82;

const cup = new THREE.Group().add(body, handle, coffee);
cup.position.y = 0.05;

const saucer = new THREE.Mesh(lathe([
  [0, 0], [0.45, 0], [0.5, 0.02], [0.95, 0.1], [1.0, 0.13], [0.97, 0.145], [0.5, 0.06], [0.36, 0.05], [0, 0.05],
]), new THREE.MeshPhysicalMaterial({ color: 0xb92f66, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }));

const coaster = new THREE.Mesh(
  new THREE.CylinderGeometry(1.28, 1.28, 0.07, 96),
  new THREE.MeshStandardMaterial({ map: cork, roughness: 0.95 }),
);
coaster.position.y = -0.035;

// `set` is what spins with scroll inertia
const set = new THREE.Group().add(cup, saucer, coaster);
set.traverse((o) => { o.castShadow = o.receiveShadow = true; });
coffee.castShadow = false;

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(30, 64),
  new THREE.MeshStandardMaterial({ color: 0x120d0b, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.07;
ground.receiveShadow = true;
scene.add(set, ground);

// ---------- steam ----------
const steam = Array.from({ length: 12 }, (_, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0 }));
  s.userData.phase = i / 12 + Math.random() * 0.05;
  scene.add(s);
  return s;
});

// ---------- floating beans: depth cues the camera flies past ----------
const beanGeo = new THREE.SphereGeometry(0.09, 20, 14);
beanGeo.scale(1.4, 0.7, 1);
{ // press the groove in
  const p = beanGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) p.setY(i, p.getY(i) - 0.035 * Math.exp(-(p.getZ(i) ** 2) / 0.0005));
  }
  beanGeo.computeVertexNormals();
}
const BEANS = 70;
const beans = new THREE.InstancedMesh(beanGeo, new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.45 }), BEANS);
const beanData = Array.from({ length: BEANS }, () => {
  const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 7;
  return {
    pos: new THREE.Vector3(Math.cos(a) * r, 0.3 + Math.random() * 4.2, Math.sin(a) * r),
    rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    spin: 0.15 + Math.random() * 0.5,
    bob: Math.random() * 6,
  };
});
const dummy = new THREE.Object3D();
function placeBeans(t) {
  beanData.forEach((b, i) => {
    dummy.position.copy(b.pos);
    dummy.position.y += Math.sin(t * 0.5 + b.bob) * 0.12;
    dummy.rotation.set(b.rot.x + t * b.spin, b.rot.y + t * b.spin * 0.7, b.rot.z);
    dummy.updateMatrix();
    beans.setMatrixAt(i, dummy.matrix);
  });
  beans.instanceMatrix.needsUpdate = true;
}
scene.add(beans);

// ---------- camera rig ----------
// shot = [azimuth, elevation, distance, shift]; shift = where the cup sits on screen,
// as a fraction of half the screen width (+ right, − left)
const sections = [...document.querySelectorAll('[data-shot]')];
const shots = sections.map((s) => s.dataset.shot.split(' ').map(Number));
let stops = [];   // document-space centre of each section
let narrow = 0;   // 1 on phone-shaped screens: cup centred and raised, further away

function measure() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  narrow = 1 - THREE.MathUtils.clamp((camera.aspect - 0.9) / 0.6, 0, 1);
  stops = sections.map((s) => {
    const r = s.getBoundingClientRect();
    return r.top + scrollY + r.height / 2;
  });
}

function shotAt(y) {
  const i = stops.findIndex((c) => c > y);
  if (i === 0) return shots[0];
  if (i < 0) return shots.at(-1);
  const t = THREE.MathUtils.smootherstep(y, stops[i - 1], stops[i]);
  return shots[i - 1].map((v, k) => v + (shots[i][k] - v) * t);
}

const TARGET = new THREE.Vector3(0, 0.55, 0);
const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const cur = [shots[0][0] - 1.6, 1.2, shots[0][2] + 7, 0]; // start far away: the intro is just the rig catching up
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
let spin = 0, lastScroll = scrollY, last = performance.now();

addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
});
addEventListener('resize', measure);
new ResizeObserver(measure).observe(document.body); // <details> opening, fonts loading, images arriving

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05), t = now / 1000;
  last = now;

  const max = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--p', max > 0 ? scrollY / max : 0);

  // camera eases toward the shot for the current scroll position
  const want = shotAt(scrollY + innerHeight / 2);
  const ease = reduce ? 1 : 1 - Math.exp(-dt * 3.2);
  for (let k = 0; k < 4; k++) cur[k] += (want[k] - cur[k]) * ease;
  pointer.sx += (pointer.x - pointer.sx) * ease;
  pointer.sy += (pointer.y - pointer.sy) * ease;

  const az = cur[0] + pointer.sx * 0.12;
  const el = THREE.MathUtils.clamp(cur[1] - pointer.sy * 0.06, 0.05, 1.5);
  const dist = cur[2] * (1 + narrow * 0.45);
  camera.position.set(
    TARGET.x + dist * Math.cos(el) * Math.sin(az),
    TARGET.y + dist * Math.sin(el),
    TARGET.z + dist * Math.cos(el) * Math.cos(az),
  );
  camera.lookAt(TARGET);
  // slide the camera sideways (not turn it) so the cup lands beside the text, undistorted
  camera.translateX(-cur[3] * (1 - narrow) * dist * tanHalf * camera.aspect);
  camera.translateY(-narrow * 0.42 * dist * tanHalf);

  // scrolling flicks the set like a turntable; it coasts back down to a slow idle
  if (!reduce) {
    spin += (scrollY - lastScroll) * 0.0009;
    spin *= Math.exp(-dt * 2.2);
    set.rotation.y += (0.12 + spin) * dt;
    placeBeans(t);
    for (const s of steam) {
      const u = (t * 0.16 + s.userData.phase) % 1;
      s.position.set(Math.sin(u * 5 + s.userData.phase * 40) * 0.1 * (1 + u), 1.0 + u * 1.5, Math.cos(u * 4 + s.userData.phase * 23) * 0.08);
      s.scale.setScalar(0.3 + u * 0.7);
      s.material.opacity = Math.sin(Math.PI * u) * 0.11;
    }
  }
  lastScroll = scrollY;

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

measure();
placeBeans(0);
requestAnimationFrame(frame);
