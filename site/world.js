// Builds every 3D object in code: terrain, sky, rocket, astronaut, markers, asteroids, the destination planet.
// Low-poly on purpose: flat shading, few segments, light comes from the lighting and the bloom.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/* ---------- Noise ---------- */

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); a *= 0.5; f *= 2.1; }
  return s;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Height of the ground at (x, z). Flat around the landing site.
export function groundHeight(x, z) {
  const d = Math.hypot(x, z);
  return (fbm(x * 0.018 + 3, z * 0.018 + 7) - 0.45) * 26 * smooth(16, 60, d) + (fbm(x * 0.2, z * 0.2) - 0.5) * 0.35;
}

/* ---------- Palettes ---------- */

export const THEMES = {
  dark: {
    skyTop: "#04050c", skyMid: "#141a3c", skyHorizon: "#3a2a55", fog: "#1a1734", fogNear: 60, fogFar: 330,
    groundLow: "#3a2436", groundHigh: "#7a4a5a", rock: "#6a4652",
    hemiSky: "#9aa3d8", hemiGround: "#5a3440", hemi: 1.35, sun: "#ffd9bd", sunI: 2.6, stars: 1,
  },
  light: {
    skyTop: "#47507f", skyMid: "#c58e98", skyHorizon: "#f8c79a", fog: "#e9b495", fogNear: 70, fogFar: 380,
    groundLow: "#8a4f43", groundHigh: "#c27a5e", rock: "#6f3f37",
    hemiSky: "#ffe3c4", hemiGround: "#7a4a3e", hemi: 1.5, sun: "#fff1dc", sunI: 2.8, stars: 0.15,
  },
};

/* ---------- Materials ---------- */

const flat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.1, ...extra });
const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color: "#000000", emissive: color, emissiveIntensity: intensity, flatShading: true });
export const COLORS = { hull: "#d9dce6", hullDark: "#8a90a3", metal: "#3b3f4e", accent: "#ff7a45", cyan: "#6fd6ff", green: "#7fe0a7", amber: "#ffc857", red: "#ff4d4d", char: "#1c1a22" };

/* ---------- Terrain, sky, scenery ---------- */

export function makeTerrain() {
  const geo = new THREE.PlaneGeometry(700, 700, 140, 140);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  mesh.receiveShadow = true;
  mesh.userData.paint = (t) => {
    const lo = new THREE.Color(t.groundLow), hi = new THREE.Color(t.groundHigh), c = new THREE.Color(), col = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const k = Math.min(1, Math.max(0, (pos.getY(i) + 4) / 14)) * 0.8 + hash(pos.getX(i), pos.getZ(i)) * 0.2;
      c.copy(lo).lerp(hi, k);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  };
  return mesh;
}

// A closed low-poly boulder. The displacement depends only on the vertex position, so the
// duplicated vertices of neighbouring faces move together and no gaps open between faces.
function boulderGeometry(r, seed, detail = 1, squash = 0.7) {
  const geo = new THREE.IcosahedronGeometry(r, detail);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let j = 0; j < p.count; j++) {
    v.set(p.getX(j), p.getY(j), p.getZ(j));
    const n = v.clone().normalize();
    const k = 0.72 + fbm(n.x * 1.7 + seed, n.y * 1.7 + n.z * 1.3 + seed * 0.37) * 0.6;
    v.multiplyScalar(k);
    v.y *= v.y < 0 ? 0.45 : squash;
    p.setXYZ(j, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Colliders are circles on the ground: { x, z, r }.
export function makeRocks() {
  const group = new THREE.Group();
  const mat = flat("#3d2636", { roughness: 1 });
  const colliders = [];
  for (let i = 0; i < 90; i++) {
    const a = hash(i, 1) * Math.PI * 2, d = 17 + hash(i, 2) * 95;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, r = 0.5 + hash(i, 3) ** 2 * 2.8;
    const m = new THREE.Mesh(boulderGeometry(r, i * 1.37, r > 1.6 ? 1 : 0), mat);
    m.position.set(x, groundHeight(x, z) + r * 0.12, z);
    m.rotation.y = hash(i, 5) * 6.28;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    colliders.push({ x, z, r: r * 0.85 });
  }
  // small pebbles, one instanced mesh
  const pebbles = new THREE.InstancedMesh(boulderGeometry(0.25, 3, 0), mat, 260);
  const o = new THREE.Object3D();
  for (let i = 0; i < 260; i++) {
    const a = hash(i, 11) * 6.28, d = 6 + hash(i, 12) * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
    o.position.set(x, groundHeight(x, z), z);
    o.rotation.y = hash(i, 13) * 6.28;
    o.scale.setScalar(0.5 + hash(i, 14) * 1.6);
    o.updateMatrix();
    pebbles.setMatrixAt(i, o.matrix);
  }
  pebbles.receiveShadow = true;
  group.add(pebbles);
  group.userData.colliders = colliders;
  group.userData.paint = (t) => mat.color.set(t.rock);
  return group;
}

// Distant mesas on the horizon and a few craters, painted like the rocks.
export function makeLandscape() {
  const group = new THREE.Group();
  const mat = flat("#3d2636", { roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + hash(i, 21), d = 200 + hash(i, 22) * 90;
    const w = 25 + hash(i, 23) * 35, h = 18 + hash(i, 24) * 30;
    const geo = new THREE.CylinderGeometry(w * 0.75, w, h, 7, 2);
    const p = geo.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), z = p.getZ(j);
      const k = 0.85 + fbm(x * 0.08 + i, z * 0.08) * 0.3;
      p.setX(j, x * k); p.setZ(j, z * k);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    m.position.set(x, groundHeight(x, z) + h / 2 - 3, z);
    group.add(m);
  }
  const craters = [];
  for (const [x, z, r] of [[-38, 30, 7], [44, -36, 9], [30, 52, 5], [-60, -40, 11]]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.22, 5, 14), mat);
    rim.rotation.x = -Math.PI / 2;
    rim.scale.z = 0.35;
    rim.position.set(x, groundHeight(x, z) + 0.1, z);
    rim.receiveShadow = rim.castShadow = true;
    group.add(rim);
    craters.push({ x, z, r: r * 1.15 });
  }
  group.userData.colliders = [];
  group.userData.paint = (t) => mat.color.set(t.rock);
  return group;
}

// Glowing crystal clusters scattered around the plain.
export function makeCrystals() {
  const group = new THREE.Group();
  const colliders = [];
  const cols = ["#8f6bff", "#6fd6ff", "#c86bff"];
  for (let c = 0; c < 14; c++) {
    const a = hash(c, 31) * 6.28, d = 20 + hash(c, 32) * 55;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, y = groundHeight(x, z);
    const color = cols[c % cols.length];
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, flatShading: true, roughness: 0.3, transparent: true, opacity: 0.92 });
    const n = 3 + Math.floor(hash(c, 33) * 4);
    for (let i = 0; i < n; i++) {
      const h = 1.2 + hash(c, i + 40) * 2.6;
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.28 + h * 0.12, h, 5), mat);
      m.position.set(x + (hash(c, i + 50) - 0.5) * 1.4, y + h / 2 - 0.15, z + (hash(c, i + 60) - 0.5) * 1.4);
      m.rotation.set((hash(c, i + 70) - 0.5) * 0.8, hash(c, i + 80) * 6, (hash(c, i + 90) - 0.5) * 0.8);
      m.castShadow = true;
      group.add(m);
    }
    colliders.push({ x, z, r: 1.3 });
  }
  group.userData.colliders = colliders;
  return group;
}

// The landing site: pad, flood lights, crates, solar array, rover, comms tower, flag.
export function makeBase() {
  const group = new THREE.Group();
  const colliders = [];
  const metal = flat("#5a6072", { metalness: 0.25, roughness: 0.5 });
  const dark = flat("#2e3240", { roughness: 0.8 });
  const orange = flat(COLORS.accent, { roughness: 0.5 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; group.add(m); return m; };

  // hexagonal landing pad with hazard ring
  const pad = add(new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.8, 0.16, 6), dark), 0, 0.02, 0);
  pad.castShadow = false;
  const ring = add(new THREE.Mesh(new THREE.RingGeometry(8.6, 9.1, 6, 1), new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 0.12, side: THREE.DoubleSide })), 0, 0.12, 0);
  ring.rotation.x = -Math.PI / 2;
  ring.castShadow = false;

  // flood lights at the pad corners
  group.userData.lamps = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2, x = Math.sin(a) * 11, z = Math.cos(a) * 11;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.2, 6), metal), x, 2.1, z);
    const head = add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), metal), x, 4.3, z);
    head.lookAt(0, 0, 0);
    const bulb = add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), glow("#fff1c9", 3)), x * 0.97, 4.2, z * 0.97);
    bulb.castShadow = false;
    const light = new THREE.PointLight("#ffd9a0", 14, 22, 2);
    light.position.set(x * 0.9, 4, z * 0.9);
    group.add(light);
    group.userData.lamps.push(light);
    colliders.push({ x, z, r: 0.4 });
  }

  // cargo crates
  const crate = (x, z, s, rot, y = 0) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), flat("#7a6a58", { roughness: 0.9 })));
    const band = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 0.18, s * 1.02), orange);
    g.add(band);
    g.traverse((o) => (o.castShadow = o.receiveShadow = true));
    g.position.set(x, y + s / 2, z);
    g.rotation.y = rot;
    group.add(g);
  };
  crate(-11.5, 6, 1.3, 0.3); crate(-12.6, 7.4, 1.1, 0.9); crate(-11.9, 6.6, 0.9, 0.1, 1.3);
  colliders.push({ x: -12, z: 6.8, r: 1.9 });

  // solar array
  for (let i = 0; i < 3; i++) {
    const x = 12 + i * 2.6, z = 9 - i * 1.2;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), metal), x, 0.7, z);
    const panel = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.5), flat("#1d2a5a", { metalness: 0.4, roughness: 0.3, emissive: "#0d1a40", emissiveIntensity: 0.6 })), x, 1.45, z);
    panel.rotation.set(-0.5, 0.4, 0);
    colliders.push({ x, z, r: 1.2 });
  }

  // rover
  const rover = new THREE.Group();
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 1.6), flat("#d9dce6", { roughness: 0.6 }));
  chassis.position.set(0, 1.1, 0);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1.2), flat(COLORS.accent));
  cabin.position.set(0.6, 1.75, 0);
  rover.add(chassis, cabin);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glow(COLORS.cyan, 2));
  cam.position.set(1.3, 1.9, 0);
  rover.add(cam);
  for (const [x, z] of [[-0.9, 0.95], [0.9, 0.95], [-0.9, -0.95], [0.9, -0.95]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 10), dark);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.45, z);
    rover.add(w);
  }
  rover.traverse((o) => (o.castShadow = o.receiveShadow = true));
  rover.position.set(-12, 0, -8);
  rover.rotation.y = 0.7;
  group.add(rover);
  colliders.push({ x: -12, z: -8, r: 1.9 });

  // comms tower with a slowly turning dish
  const tx = -14.5, tz = 1.5;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0, 0.7]]) {
    const leg = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 7, 5), metal), tx + dx * 0.5, 3.5, tz + dz * 0.5);
    leg.rotation.set(dz * 0.08, 0, -dx * 0.08);
  }
  const towerDish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.8), flat("#d9dce6", { side: THREE.DoubleSide }));
  bowl.rotation.x = Math.PI / 2.4;
  towerDish.add(bowl);
  const blinker = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), glow(COLORS.red, 3));
  blinker.position.y = 0.9;
  towerDish.add(blinker);
  towerDish.position.set(tx, 7.4, tz);
  group.add(towerDish);
  group.userData.towerDish = towerDish;
  group.userData.blinker = blinker;
  colliders.push({ x: tx, z: tz, r: 1 });

  // flag
  const fx = 9.5, fz = 10.5;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 6), metal), fx, 1.7, fz);
  const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85, 6, 1), new THREE.MeshStandardMaterial({ color: COLORS.accent, side: THREE.DoubleSide, flatShading: true })), fx + 0.72, 2.95, fz);
  group.userData.flag = flag;
  colliders.push({ x: fx, z: fz, r: 0.35 });

  group.userData.colliders = colliders;
  return group;
}

// Dust motes drifting in the light around the landing site.
export function makeDust() {
  const n = 260, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 70, Math.random() * 12, (Math.random() - 0.5) * 70], i * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#ffd9b8", size: 0.09, transparent: true, opacity: 0.55, depthWrite: false }));
  pts.userData.update = (dt, t) => {
    const a = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      let x = a.getX(i) + Math.sin(t * 0.3 + i) * 0.02 + dt * 0.6, y = a.getY(i) + Math.sin(t * 0.7 + i * 1.3) * 0.01;
      if (x > 35) x -= 70;
      a.setXYZ(i, x, y, a.getZ(i));
    }
    a.needsUpdate = true;
  };
  return pts;
}

export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.7, h)) : mix(hor, mid, smoothstep(-0.05, 0.12, h));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), mat);
  sky.userData.paint = (t) => { mat.uniforms.top.value.set(t.skyTop); mat.uniforms.mid.value.set(t.skyMid); mat.uniforms.hor.value.set(t.skyHorizon); };
  return sky;
}

export function makeStars(count = 1800, radius = 1000, size = 1.6) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(count * 3), c = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set([Math.cos(th) * s * radius, Math.abs(u) * radius * (Math.random() < 0.85 ? 1 : -1), Math.sin(th) * s * radius], i * 3);
    const warm = Math.random() < 0.15, b = 0.55 + Math.random() * 0.45;
    c.set(warm ? [b, b * 0.82, b * 0.7] : [b * 0.88, b * 0.92, b], i * 3);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3));
  const mat = new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, fog: false, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.userData.paint = (t) => (mat.opacity = t.stars);
  return pts;
}

export function makeMoon() {
  const g = new THREE.Group();
  // smooth moon with soft crater blotches, a faint rim glow and a textured ring
  const moonTex = canvasTexture(512, 256, (x, w, h) => {
    x.fillStyle = "#7e8cc8"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = 4 + Math.random() ** 2 * 30;
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, "rgba(40,48,95,.45)"); gr.addColorStop(0.8, "rgba(60,70,120,.2)"); gr.addColorStop(1, "rgba(160,170,230,0)");
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95, fog: false, emissive: "#1e2650", emissiveIntensity: 0.5 }));
  g.add(atmosphere(60, "#9fb2ff", 0.8));
  const ring = new THREE.Mesh(new THREE.RingGeometry(80, 120, 96, 1), new THREE.MeshBasicMaterial({ map: ringTex(), color: "#c9cff0", side: THREE.DoubleSide, transparent: true, opacity: 0.8, fog: false, depthWrite: false }));
  ring.rotation.x = Math.PI / 2.4;
  g.add(body, ring);
  g.position.set(-380, 260, -760);
  g.rotation.z = 0.35;
  return g;
}

/* ---------- Rocket ---------- */

// The rocket stands on its legs. Its parts are named so repairs can change them.
export function makeShip() {
  const ship = new THREE.Group();
  const P = {};
  const hullMat = flat(COLORS.hull, { metalness: 0.08, roughness: 0.55 });
  const accentMat = flat(COLORS.accent, { roughness: 0.5 });
  const metalMat = flat("#5a6072", { metalness: 0.25, roughness: 0.5 });

  const profile = [[0.01, 2.2], [2.2, 2.4], [2.65, 3.2], [2.85, 5], [2.85, 12], [2.65, 14], [2.15, 16], [1.45, 17.6], [0.7, 18.8], [0.01, 19.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), hullMat);
  body.castShadow = body.receiveShadow = true;
  ship.add(body);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.7, 14), accentMat);
  band.position.y = 9.2;
  ship.add(band);

  // cockpit window on the front (+z)
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12), glow(COLORS.cyan, 0.4));
  win.position.set(0, 14.2, 2.62); win.rotation.x = -0.12;
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.13, 6, 14), metalMat);
  frame.position.copy(win.position); frame.rotation.x = -0.12;
  ship.add(win, frame);
  P.window = win;

  // engine nozzle and glow
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.1, 2.4, 14, 1, true), metalMat);
  nozzle.position.y = 1.4;
  const core = new THREE.Mesh(new THREE.CircleGeometry(1.4, 14), glow(COLORS.accent, 0));
  core.rotation.x = Math.PI / 2; core.position.y = 0.25;
  ship.add(nozzle, core);
  P.core = core;

  // flame for liftoff and flight
  const flameMat = new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 12, 1, true), flameMat);
  flame.rotation.x = Math.PI; flame.position.y = -3.2; flame.visible = false;
  const flameIn = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.5, 10, 1, true), new THREE.MeshBasicMaterial({ color: "#fff4d6", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  flameIn.rotation.x = Math.PI; flameIn.position.y = -1.9;
  flame.add(flameIn);
  flameIn.position.y = 1.2;
  ship.add(flame);
  P.flame = flame;

  // fins and legs
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(2.6, -2.2); finShape.lineTo(2.6, -5); finShape.lineTo(0, -3.4); finShape.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.3, bevelEnabled: false });
  finGeo.translate(0, 0, -0.15);
  P.legs = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
    const fin = new THREE.Mesh(finGeo, accentMat);
    fin.position.set(Math.sin(a) * 2.55, 7.4, Math.cos(a) * 2.55);
    fin.rotation.y = a - Math.PI / 2;
    fin.castShadow = true;
    ship.add(fin);

    const b = a + Math.PI / 3;
    const leg = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 6), metalMat);
    strut.position.set(0, 2.2, 0.9); strut.rotation.x = -0.42;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.25, 8), metalMat);
    foot.position.set(0, 0.12, 1.85);
    leg.add(strut, foot);
    leg.position.set(Math.sin(b) * 2.6, 0, Math.cos(b) * 2.6);
    leg.rotation.y = b;
    leg.traverse((o) => (o.castShadow = true));
    ship.add(leg);
    P.legs.push(leg);
  }

  // hull damage: dark scorched panels, cleaned on repair
  P.damage = [];
  const dmgMat = flat(COLORS.char, { roughness: 1 });
  for (const [a, y, w, h] of [[-0.6, 6.2, 1.3, 0.9], [-1.4, 10.6, 1.0, 1.4], [0.9, 12.4, 1.2, 0.8], [2.3, 5.8, 1.5, 1.0], [-2.4, 13.3, 0.9, 0.9], [1.9, 9.9, 0.8, 1.1]]) {
    const r = y < 12 ? 2.88 : 2.7;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), dmgMat.clone());
    m.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    m.rotation.y = a;
    ship.add(m);
    P.damage.push(m);
  }

  // airlock door with ramp and status light, on the front (+z)
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.3), flat(COLORS.metal, { metalness: 0.5 }));
  door.position.set(0, 4.3, 2.85);
  const doorLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glow(COLORS.accent, 3));
  doorLight.position.set(1.05, 5.4, 2.95);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 4.2), metalMat);
  ramp.position.set(0, 1.55, 4.6); ramp.rotation.x = 0.68;
  ramp.castShadow = true;
  ship.add(door, doorLight, ramp);
  Object.assign(P, { door, doorLight, ramp });

  // sensor mast on the right (+x)
  const mastPivot = new THREE.Group();
  mastPivot.position.set(2.5, 14.6, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), metalMat);
  mast.position.y = 1.6;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glow(COLORS.red, 0));
  tip.position.y = 3.3;
  mastPivot.add(mast, tip);
  mastPivot.rotation.z = -1.25;
  ship.add(mastPivot);
  Object.assign(P, { mastPivot, tip });

  // shield emitters around the waist, and the shield ring
  P.emitters = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glow(COLORS.cyan, 0));
    e.position.set(Math.sin(a) * 3.05, 10.6, Math.cos(a) * 3.05);
    ship.add(e);
    P.emitters.push(e);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.05, 6, 40), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 10.6;
  ship.add(ring);
  P.shieldRing = ring;

  // navigation dish on the left (-x), shown as "in progress"
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.6), glow(COLORS.amber, 0.25));
  bowl.material.side = THREE.DoubleSide;
  bowl.rotation.x = Math.PI / 2;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 6), metalMat);
  arm.rotation.z = Math.PI / 2; arm.position.x = 0.6;
  dish.add(bowl, arm);
  dish.position.set(-3.4, 12.8, 0);
  dish.rotation.y = -Math.PI / 2;
  dish.scale.setScalar(0.001);
  ship.add(dish);
  P.dish = dish;

  // shield bubble, used in space
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true }));
  bubble.scale.set(5, 12.5, 5); bubble.position.y = 10;
  ship.add(bubble);
  P.bubble = bubble;

  ship.userData.parts = P;
  return ship;
}

/* ---------- Ground console for the ship's computer ---------- */

export function makeConsole() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.8), flat(COLORS.metal, { metalness: 0.5 }));
  base.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.25), flat(COLORS.metal, { metalness: 0.5 }));
  head.position.set(0, 1.35, 0.1); head.rotation.x = -0.5;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.65), glow("#2b6b4e", 0.3));
  screen.position.set(0, 1.39, 0.24); screen.rotation.x = -0.5;
  g.add(base, head, screen);
  g.traverse((o) => (o.castShadow = true));
  g.userData.screen = screen;
  return g;
}

/* ---------- Astronaut ---------- */

export function makeAstronaut() {
  const a = new THREE.Group();
  const suit = flat("#f2f2f5", { roughness: 0.6 });
  const shade = flat("#b9bdc9", { roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.55, 3, 8), suit);
  body.position.y = 1.0;
  const helmet = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), suit);
  helmet.position.y = 1.62;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshStandardMaterial({ color: "#ff7a45", emissive: "#ff7a45", emissiveIntensity: 0.45, metalness: 0.8, roughness: 0.15 }));
  visor.scale.set(1, 0.72, 0.6); visor.position.set(0, 1.64, 0.2);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.28), shade);
  pack.position.set(0, 1.1, -0.36);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), glow(COLORS.green, 3));
  light.position.set(0.18, 1.3, -0.5);
  a.add(body, helmet, visor, pack, light);

  const limb = (r, len, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 2, 6), suit);
    m.position.y = -len / 2 - r * 0.5;
    pivot.add(m);
    a.add(pivot);
    return pivot;
  };
  a.userData.limbs = { armL: limb(0.11, 0.42, -0.46, 1.3), armR: limb(0.11, 0.42, 0.46, 1.3), legL: limb(0.13, 0.42, -0.17, 0.62), legR: limb(0.13, 0.42, 0.17, 0.62) };
  a.traverse((o) => (o.castShadow = true));
  return a;
}

/* ---------- Station marker ---------- */

// Repair spot on the ground: a soft glow, an outer ring, and a progress ring that fills in green
// while the astronaut repairs. Nothing floats in the air.
const MARKER_GLOW = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const PROGRESS_SEGMENTS = 64;

export function makeMarker() {
  const g = new THREE.Group();
  const flatMesh = (geo, color, opacity, y) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    g.add(m);
    return m;
  };
  const glowDisc = flatMesh(new THREE.CircleGeometry(1.5, 32), COLORS.amber, 0.6, 0.13);
  glowDisc.material.map = MARKER_GLOW;
  const ring = flatMesh(new THREE.RingGeometry(0.82, 0.95, 48), COLORS.amber, 0.9, 0.14);
  const ticks = flatMesh(new THREE.RingGeometry(1.05, 1.2, 12, 1, 0, Math.PI * 2), COLORS.amber, 0.35, 0.14);
  // progress arc: drawn up to the current fraction using the index draw range
  const progress = flatMesh(new THREE.RingGeometry(0.55, 0.78, PROGRESS_SEGMENTS, 1, Math.PI / 2, -Math.PI * 2), COLORS.green, 0.95, 0.15);
  progress.geometry.setDrawRange(0, 0);
  g.userData = {
    ring, ticks, glowDisc, fade: 1,
    setProgress(k) { progress.geometry.setDrawRange(0, 6 * Math.round(Math.max(0, Math.min(1, k)) * PROGRESS_SEGMENTS)); },
    setColor(c) { ring.material.color.set(c); ticks.material.color.set(c); glowDisc.material.color.set(c); },
    setFade(f) { g.userData.fade = f; for (const m of [ring, ticks, glowDisc, progress]) m.material.opacity = m.userData.base * f; },
  };
  for (const m of [ring, ticks, glowDisc, progress]) m.userData.base = m.material.opacity;
  return g;
}

/* ---------- Space ---------- */

// 3D value noise, so displacement on a sphere has no seams.
function noise3(x, y, z) {
  return (fbm(x + z * 0.71, y - z * 0.37) + fbm(y + 5.2 - x * 0.3, z + 1.7 + x * 0.45)) * 0.5;
}

// A smooth, lumpy rock: indexed sphere (shared vertices, so normals are smooth), displaced by
// large lumps plus a few crater dents. Built once per shape and reused by every asteroid.
function asteroidGeometry(seed) {
  let geo = new THREE.IcosahedronGeometry(1, 5);
  geo.deleteAttribute("normal"); geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  const p = geo.attributes.position, v = new THREE.Vector3();
  const craters = Array.from({ length: 5 }, () => new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
  const colors = new Float32Array(p.count * 3);
  for (let j = 0; j < p.count; j++) {
    v.set(p.getX(j), p.getY(j), p.getZ(j)).normalize();
    let h = 0.78 + noise3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3) * 0.42 + noise3(v.x * 5 + seed, v.y * 5, v.z * 5) * 0.06;
    let shade = 1;
    for (const c of craters) {
      const d = v.distanceTo(c);
      if (d < 0.38) { const k = 1 - d / 0.38; h -= k * k * 0.09; shade -= k * 0.25; }
      else if (d < 0.46) h += 0.012;
    }
    v.multiplyScalar(h);
    v.y *= 0.82;
    p.setXYZ(j, v.x, v.y, v.z);
    const g = 0.75 + noise3(v.x * 3 + seed, v.y * 3, v.z * 3) * 0.3;
    colors.set([g * shade, g * shade * 0.96, g * shade * 1.04], j * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}
let ASTEROID_SHAPES = null;
const asteroidMat = new THREE.MeshStandardMaterial({ color: "#8a8296", vertexColors: true, roughness: 0.95, metalness: 0.05 });

export function makeAsteroid() {
  ASTEROID_SHAPES ??= Array.from({ length: 6 }, (_, i) => asteroidGeometry(i * 3.7 + 1));
  const r = 1.2 + Math.random() * 2.6;
  const m = new THREE.Mesh(ASTEROID_SHAPES[Math.floor(Math.random() * ASTEROID_SHAPES.length)], asteroidMat);
  m.scale.set(r * (0.9 + Math.random() * 0.25), r, r * (0.9 + Math.random() * 0.25));
  m.userData.r = r;
  m.userData.shared = true;
  m.userData.spin = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.2);
  return m;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Gas giant surface: soft turbulent bands and one big storm.
const planetTex = () => canvasTexture(512, 256, (x, w, h) => {
  const bands = ["#ffd0a8", "#ff9a6b", "#e8693c", "#ffb48a", "#c4502f", "#ff8f5c", "#f2a27a", "#d45a33", "#ffc49c"];
  const img = x.createImageData(w, h), d = img.data;
  const col = bands.map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const warp = fbm(u * 6, v * 22) * 0.06 + Math.sin(u * Math.PI * 8 + v * 30) * 0.004;
      const t = (v + warp) * (bands.length - 1);
      const i = Math.max(0, Math.min(bands.length - 2, Math.floor(t)));
      tmp.copy(col[i]).lerp(col[i + 1], t - i);
      const k = 0.9 + fbm(u * 40, v * 80) * 0.2;
      const o = (py * w + px) * 4;
      d[o] = Math.min(255, tmp.r * 255 * k); d[o + 1] = Math.min(255, tmp.g * 255 * k); d[o + 2] = Math.min(255, tmp.b * 255 * k); d[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // the storm
  const g = x.createRadialGradient(320, 150, 2, 320, 150, 30);
  g.addColorStop(0, "rgba(255,240,220,.9)"); g.addColorStop(0.5, "rgba(214,90,50,.75)"); g.addColorStop(1, "rgba(214,90,50,0)");
  x.save(); x.translate(320, 150); x.scale(1.9, 1); x.translate(-320, -150); x.fillStyle = g; x.beginPath(); x.arc(320, 150, 30, 0, Math.PI * 2); x.fill(); x.restore();
});

// Ring texture: concentric bands drawn on a square, matching RingGeometry's planar UVs.
const ringTex = () => canvasTexture(512, 512, (x, w) => {
  const c = w / 2;
  for (let r = c; r > 0; r -= 1) {
    const t = r / c;
    if (t < 0.74) break;
    const a = (0.25 + fbm(t * 60, 1) * 0.6) * (t > 0.97 ? (1 - t) / 0.03 : 1) * (t < 0.77 ? (t - 0.74) / 0.03 : 1);
    const gap = t > 0.86 && t < 0.875 ? 0.15 : 1;
    x.strokeStyle = `rgba(255,${200 + Math.round(fbm(t * 30, 3) * 40)},${170 + Math.round(fbm(t * 20, 5) * 50)},${a * gap})`;
    x.beginPath(); x.arc(c, c, r, 0, Math.PI * 2); x.stroke();
  }
});

// Atmosphere for a planet of radius R: a thin rim light on the limb (front faces of a sphere just
// above the surface) plus a soft halo outside it (back faces of a larger sphere), brightest at the
// limb and fading to nothing at the halo edge, so there is no hard outline.
const ATMO_VS = "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }";
function atmosphere(R, color, strength = 1) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 96, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: c }, s: { value: strength } }, vertexShader: ATMO_VS,
    fragmentShader: "uniform vec3 c; uniform float s; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.5) * s; gl_FragColor = vec4(c * f, f); }",
  }));
  const k = 1.16, edge = Math.sqrt(1 - 1 / (k * k)).toFixed(4);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * k, 96, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { c: { value: c }, s: { value: strength } }, vertexShader: ATMO_VS,
    fragmentShader: `uniform vec3 c; uniform float s; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(-dot(vN, vV) / ${edge}, 0.0, 1.0), 2.4) * 0.55 * s; gl_FragColor = vec4(c * f, f); }`,
  }));
  g.add(rim, halo);
  return g;
}

// Round, soft-edged sprite for particles (smoke, sparks, debris) instead of square points.
const SOFT_DOT = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

export function makeDestination() {
  const g = new THREE.Group();
  const planet = new THREE.Mesh(new THREE.SphereGeometry(60, 96, 48), new THREE.MeshStandardMaterial({
    map: planetTex(), roughness: 0.85, metalness: 0, emissive: "#3a1206", emissiveIntensity: 0.25,
  }));
  const atmo = atmosphere(60, "#ffb08a", 1.1);
  const ring = new THREE.Mesh(new THREE.RingGeometry(76, 112, 128, 1), new THREE.MeshStandardMaterial({ map: ringTex(), side: THREE.DoubleSide, transparent: true, depthWrite: false, roughness: 1 }));
  ring.rotation.x = Math.PI / 2.3;
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), glow(COLORS.green, 4));
  beacon.position.set(0, 60.4, 0);
  g.add(planet, atmo, ring, beacon);
  g.rotation.z = -0.25;
  g.userData = { beacon, planet };
  return g;
}

export function makeNebula() {
  const g = new THREE.Group();
  const tex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  for (const [x, y, z, s, col] of [[-300, 120, -900, 900, "#3b2a7a"], [350, -80, -1000, 1100, "#1f3c7a"], [80, 260, -1100, 800, "#7a2a55"]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(x, y, z); sp.scale.setScalar(s);
    g.add(sp);
  }
  return g;
}

/* ---------- Particles ---------- */

// One pool of points for sparks, smoke and debris. Additive for sparks, normal for smoke.
export class Particles {
  constructor(max, additive, size) {
    this.max = max;
    this.items = [];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size, map: SOFT_DOT, vertexColors: true, transparent: true, depthWrite: false, opacity: additive ? 1 : 0.5,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
    }));
    this.points.frustumCulled = false;
  }
  emit(pos, vel, color, life, gravity = 0, drag = 0) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push({ p: pos.clone(), v: vel.clone(), c: new THREE.Color(color), life, max: life, g: gravity, drag });
  }
  update(dt) {
    const pos = this.points.geometry.attributes.position, col = this.points.geometry.attributes.color;
    this.items = this.items.filter((it) => (it.life -= dt) > 0);
    this.items.forEach((it, i) => {
      it.v.y -= it.g * dt;
      it.v.multiplyScalar(1 - it.drag * dt);
      it.p.addScaledVector(it.v, dt);
      const k = it.life / it.max;
      pos.setXYZ(i, it.p.x, it.p.y, it.p.z);
      col.setXYZ(i, it.c.r * k, it.c.g * k, it.c.b * k);
    });
    for (let i = this.items.length; i < this.max; i++) pos.setXYZ(i, 0, -9999, 0);
    pos.needsUpdate = col.needsUpdate = true;
  }
  clear() { this.items = []; }
}
