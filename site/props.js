// Detailed models: rocket, astronaut, base camp, drone, plus the reflection environment.
// Smooth shading, rounded edges and small canvas textures, so nothing reads as a plain box.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { COLORS, groundHeight } from "./world.js?v=dev";

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, ...o });
const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color: "#000", emissive: color, emissiveIntensity: intensity });
const rbox = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
const shadows = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });

// A cylinder running from point a to point b (struts, braces, arms).
function beamBetween(a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

/* ---------- Reflection environment ---------- */

// A tiny scene with the sky gradient, the ground colour and a sun, rendered into an environment map.
// Metal and glass then reflect the actual world instead of looking flat.
export function makeEnvironment(pmrem, t) {
  const env = new THREE.Scene();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(t.skyTop) }, mid: { value: new THREE.Color(t.skyMid) }, hor: { value: new THREE.Color(t.skyHorizon) }, ground: { value: new THREE.Color(t.groundHigh) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top, mid, hor, ground; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, mix(mid, top, smoothstep(0.2, 0.8, h)), smoothstep(0.0, 0.2, h)) : mix(hor, ground * 0.6, smoothstep(0.0, -0.3, h));
      gl_FragColor = vec4(c * 1.4, 1.0); }`,
  }));
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(t.sun).multiplyScalar(6) }));
  sunDisc.position.set(-25, 30, 15);
  env.add(sphere, sunDisc);
  const tex = pmrem.fromScene(env, 0.03).texture;
  sphere.geometry.dispose(); sphere.material.dispose(); sunDisc.geometry.dispose();
  return tex;
}

export function makeSpaceEnvironment(pmrem) {
  return makeEnvironment(pmrem, { skyTop: "#05060f", skyMid: "#2a1f5a", skyHorizon: "#5a2a6a", groundHigh: "#101830", sun: "#ffe2c8" });
}

/* ---------- Engine plume ---------- */

// Rocket exhaust. Every layer's geometry starts at y = 0 (the nozzle) and extends down, so
// scaling the group in y only makes the plume longer: it can never detach from the engine.
// The shader fades along the length and towards the silhouette edges, with flowing noise and
// shock diamonds in the core.
const FLAME_VS = `
  uniform float uTime; uniform float uWobble;
  varying float vY; varying vec3 vN; varying vec3 vV;
  void main() {
    vec3 p = position;
    vY = -p.y; // 0 at the nozzle, 1 at the tail (geometry is unit length)
    float w = 1.0 + uWobble * sin(vY * 18.0 - uTime * 40.0) * 0.06 * vY + uWobble * sin(vY * 7.0 - uTime * 23.0 + p.x * 3.0) * 0.05 * vY;
    p.xz *= w;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const FLAME_FS = `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uAlpha; uniform float uDiamonds;
  varying float vY; varying vec3 vN; varying vec3 vV;
  float h(float n){ return fract(sin(n) * 43758.5453); }
  float noise(float x){ float i = floor(x); float f = fract(x); return mix(h(i), h(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  void main() {
    float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
    float len = pow(1.0 - clamp(vY, 0.0, 1.0), 1.4);
    float flow = 0.75 + 0.5 * noise(vY * 9.0 - uTime * 14.0);
    float diamonds = uDiamonds * smoothstep(0.55, 1.0, sin(vY * 34.0)) * (1.0 - vY) * 0.9;
    vec3 col = mix(uA, uB, smoothstep(0.0, 0.35, vY));
    col = mix(col, uC, smoothstep(0.35, 1.0, vY));
    float a = edge * len * flow * uAlpha + diamonds * edge;
    gl_FragColor = vec4(col * a, a);
  }`;

function makeFlame() {
  const g = new THREE.Group();
  const layers = [];
  const layer = (radiusTop, radiusTail, colors, alpha, diamonds, wobble) => {
    const geo = new THREE.CylinderGeometry(radiusTop, radiusTail, 1, 40, 24, true);
    geo.translate(0, -0.5, 0);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }, uAlpha: { value: alpha }, uDiamonds: { value: diamonds }, uWobble: { value: wobble },
        uA: { value: new THREE.Color(colors[0]) }, uB: { value: new THREE.Color(colors[1]) }, uC: { value: new THREE.Color(colors[2]) },
      },
      vertexShader: FLAME_VS, fragmentShader: FLAME_FS,
    }));
    m.renderOrder = 5;
    g.add(m);
    layers.push(m);
    return m;
  };
  // outer plume (orange to red), mid body (yellow), white-blue core with shock diamonds
  const outer = layer(1.8, 0.7, ["#ffb35a", "#ff6a1f", "#6a1408"], 0.95, 0, 1);
  const mid = layer(1.35, 0.2, ["#ffe7a8", "#ff9a3a", "#ff4a12"], 0.6, 0, 0.7);
  const core = layer(0.85, 0.02, ["#ffffff", "#cfe6ff", "#ffcf7a"], 0.85, 1, 0.3);
  outer.scale.set(1, 9, 1);
  mid.scale.set(1, 6.5, 1);
  core.scale.set(1, 4, 1);

  // hot glow inside the nozzle and a flickering light that lights up the ground and the pad
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32), new THREE.MeshBasicMaterial({ color: "#fff1c9", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowDisc.rotation.x = Math.PI / 2;
  glowDisc.position.y = 0.05;
  const light = new THREE.PointLight("#ff9a4a", 0, 60, 1.6);
  light.position.y = -2.5;
  g.add(glowDisc, light);

  g.visible = false;
  g.userData.update = (t, power = 1) => {
    layers.forEach((m, i) => (m.material.uniforms.uTime.value = t + i * 0.37));
    glowDisc.material.opacity = 0.6 + 0.3 * Math.random();
    light.intensity = (180 + Math.random() * 90) * power;
  };
  return g;
}

/* ---------- Rocket ---------- */

const burnTex = canvasTex(128, 128, (x, w, h) => {
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(20,14,18,1)"); g.addColorStop(0.45, "rgba(40,28,30,.85)"); g.addColorStop(1, "rgba(60,40,40,0)");
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,${120 + Math.random() * 80},60,${Math.random() * 0.5})`; x.fillRect(40 + Math.random() * 48, 40 + Math.random() * 48, 2, 2); }
});

const decalTex = canvasTex(512, 128, (x, w, h) => {
  x.clearRect(0, 0, w, h);
  x.fillStyle = "#1f2433";
  x.font = "bold 92px 'IBM Plex Mono', Consolas, monospace";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("MZ-01", w / 2, h / 2 + 4);
});

export function makeShip() {
  const ship = new THREE.Group();
  const P = {};
  const hull = mat("#e6e9f0", { metalness: 0.45, roughness: 0.3 });
  const accent = mat(COLORS.accent, { metalness: 0.25, roughness: 0.4 });
  const dark = mat("#3a3f4f", { metalness: 0.7, roughness: 0.35 });

  const prof = [[0.01, 2.2], [2.15, 2.3], [2.6, 3.0], [2.82, 4.2], [2.86, 6], [2.86, 12], [2.78, 13.3], [2.55, 14.6], [2.2, 15.9], [1.7, 17.1], [1.1, 18.3], [0.5, 19.2], [0.01, 19.6]];
  const radiusAt = (y) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0; };
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48), hull);
  ship.add(body);

  // panel seams
  for (const y of [4.6, 7.6, 12.5, 15.2]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(y) + 0.01, 0.025, 6, 64), dark);
    seam.rotation.x = Math.PI / 2; seam.position.y = y;
    ship.add(seam);
  }
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.7, 48), accent);
  band.position.y = 9.2;
  ship.add(band);
  const decal = new THREE.Mesh(new THREE.CylinderGeometry(2.875, 2.875, 1.1, 24, 1, true, -0.55, 1.1), new THREE.MeshStandardMaterial({ map: decalTex, transparent: true, roughness: 0.6, depthWrite: false }));
  decal.position.y = 11;
  ship.add(decal);

  // cockpit window
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#123a52", emissive: COLORS.cyan, emissiveIntensity: 0.25, metalness: 0.9, roughness: 0.05 }));
  glass.rotation.x = Math.PI / 2 - 0.12; glass.scale.z = 0.35;
  glass.position.set(0, 14.2, radiusAt(14.2) - 0.08);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.1, 10, 32), dark);
  frame.position.copy(glass.position); frame.rotation.x = -0.12;
  ship.add(glass, frame);
  P.window = glass;

  // engine bell
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[1.1, 2.3], [1.25, 1.8], [1.6, 1.0], [2.05, 0.15], [2.1, 0.05]].map(([r, y]) => new THREE.Vector2(r, y)), 32), new THREE.MeshStandardMaterial({ color: "#2b2f3a", metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide }));
  ship.add(bell);
  const core = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), glow(COLORS.accent, 0));
  core.rotation.x = Math.PI / 2; core.position.y = 1.0;
  ship.add(core);
  P.core = core;

  const flame = makeFlame();
  flame.position.y = 0.35; // inside the bell mouth: the plume always starts in the nozzle
  ship.add(flame);
  P.flame = flame;

  // fins with bevelled edges
  const fs = new THREE.Shape();
  fs.moveTo(0, 0); fs.quadraticCurveTo(1.6, -0.6, 2.6, -2.4); fs.lineTo(2.7, -5.2); fs.quadraticCurveTo(1.2, -4.4, 0, -3.6); fs.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(fs, { depth: 0.18, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.07, bevelSegments: 3, curveSegments: 12 });
  finGeo.translate(0, 0, -0.09);
  P.legs = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
    const fin = new THREE.Mesh(finGeo, accent);
    fin.position.set(Math.sin(a) * 2.6, 7.6, Math.cos(a) * 2.6);
    fin.rotation.y = a - Math.PI / 2;
    ship.add(fin);

    // Landing leg hinged on the hull at y = 4.3. Everything below the hinge is in the leg group,
    // so folding is one rotation about the hinge: the leg swings out, then up against the hull.
    // legs at 30°, 150° and 270°: clear of the door and ramp (0°) and of the fins (60°, 180°, 300°)
    const b = Math.PI / 6 + (i * 2 * Math.PI) / 3;
    const hinge = new THREE.Mesh(rbox(0.5, 0.42, 0.34, 0.06), dark);
    hinge.position.set(Math.sin(b) * 2.78, 4.3, Math.cos(b) * 2.78);
    hinge.rotation.y = b;
    ship.add(hinge);
    const leg = new THREE.Group();
    leg.rotation.order = "YXZ";
    const footAt = new THREE.Vector3(0, -4.08, 1.75);
    const strut = beamBetween(new THREE.Vector3(0, 0, 0), footAt.clone().lerp(new THREE.Vector3(), 0.45), 0.16, dark);
    const piston = beamBetween(footAt.clone().lerp(new THREE.Vector3(), 0.5), footAt, 0.1, hull);
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), dark);
    knuckle.position.copy(footAt);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.82, 0.2, 24), dark);
    foot.position.copy(footAt).add(new THREE.Vector3(0, -0.12, 0));
    leg.add(strut, piston, knuckle, foot);
    leg.position.set(Math.sin(b) * 2.78, 4.3, Math.cos(b) * 2.78);
    leg.rotation.y = b;
    ship.add(leg);
    P.legs.push(leg);
  }

  // scorch marks, faded out on repair
  P.damage = [];
  for (const [a, y, s] of [[-0.6, 6.2, 1.5], [-1.4, 10.6, 1.3], [0.9, 12.4, 1.2], [2.3, 5.8, 1.7], [-2.4, 13.4, 1.1], [1.9, 9.9, 1.0]]) {
    const r = radiusAt(y) + 0.02;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, s, 16, 1, true, a - s / (2 * r), s / r), new THREE.MeshStandardMaterial({ map: burnTex, transparent: true, depthWrite: false, roughness: 1 }));
    m.position.y = y;
    m.userData.fix = (k) => (m.material.opacity = 1 - k);
    ship.add(m);
    P.damage.push(m);
  }

  // airlock: sliding door, frame, light and ramp with rails
  const doorFrame = new THREE.Mesh(rbox(1.9, 2.9, 0.25, 0.1), dark);
  doorFrame.position.set(0, 4.3, 2.78);
  const door = new THREE.Mesh(rbox(1.5, 2.5, 0.2, 0.08), mat("#c9ced9", { metalness: 0.5, roughness: 0.35 }));
  door.position.set(0, 4.3, 2.9);
  const doorLight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), glow(COLORS.accent, 3));
  doorLight.position.set(1.12, 5.5, 2.95);
  // Ramp hinged just under the door. Deployed it slopes down to the ground (rotation.x = 0.68);
  // retracted it folds up flat against the hull over the door (rotation.x = -1.5).
  const metalTread = mat("#8a90a3", { metalness: 0.6, roughness: 0.35 });
  const ramp = new THREE.Group();
  ramp.position.set(0, 2.85, 3.0);
  const plate = new THREE.Mesh(rbox(1.5, 0.14, 4.3, 0.05), dark);
  plate.position.set(0, -0.07, 2.15);
  ramp.add(plate);
  for (let i = 0; i < 6; i++) {
    const tread = new THREE.Mesh(rbox(1.3, 0.04, 0.12, 0.02), metalTread);
    tread.position.set(0, 0.02, 0.5 + i * 0.68);
    ramp.add(tread);
  }
  for (const x of [-0.74, 0.74]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.1, 8), hull);
    rail.rotation.x = Math.PI / 2; rail.position.set(x, 0.55, 2.15);
    ramp.add(rail);
    for (const z of [0.4, 2.15, 3.9]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), hull); post.position.set(x, 0.28, z); ramp.add(post); }
  }
  const hingeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.7, 12), dark);
  hingeBar.rotation.z = Math.PI / 2;
  ramp.add(hingeBar);
  ramp.rotation.x = 0.68;
  ship.add(doorFrame, door, doorLight, ramp);
  Object.assign(P, { door, doorLight, ramp });

  // sensor mast
  const mastPivot = new THREE.Group();
  mastPivot.position.set(2.45, 14.6, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 10), dark);
  mast.position.y = 1.6;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), glow(COLORS.red, 0));
  tip.position.y = 3.3;
  const fins2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 24), dark);
  fins2.rotation.x = Math.PI / 2; fins2.position.y = 2.6;
  mastPivot.add(mast, tip, fins2);
  mastPivot.rotation.z = -1.25;
  ship.add(mastPivot);
  Object.assign(P, { mastPivot, tip });

  // shield emitters and ring
  P.emitters = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.3, 16), dark);
    housing.position.set(Math.sin(a) * 2.95, 10.6, Math.cos(a) * 2.95);
    housing.rotation.set(Math.PI / 2, 0, -a); housing.lookAt(0, 10.6, 0); housing.rotateX(Math.PI / 2);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), glow(COLORS.cyan, 0));
    e.position.set(Math.sin(a) * 3.12, 10.6, Math.cos(a) * 3.12);
    ship.add(housing, e);
    P.emitters.push(e);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.045, 8, 64), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 10.6;
  ship.add(ring);
  P.shieldRing = ring;

  // Navigation antenna (in progress), bolted to the left side of the hull.
  // The group origin sits on the hull surface, so when it scales up on repair it grows out of the
  // hull. A mounting nPlate, a horizontal nBoom and an nElbow carry a nPan joint; only the dish head
  // turns (a small sweep around the nBoom tip), the nBoom never moves.
  const dish = new THREE.Group();
  const nHullR = radiusAt(12.8);
  dish.position.set(-nHullR + 0.02, 12.8, 0);
  const nPlate = new THREE.Mesh(rbox(0.12, 0.9, 0.9, 0.04), dark);
  nPlate.position.x = -0.04;
  const nBoom = beamBetween(new THREE.Vector3(-0.05, 0, 0), new THREE.Vector3(-1.1, 0, 0), 0.09, dark);
  const nElbow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), dark);
  nElbow.position.x = -1.1;
  const nRiser = beamBetween(new THREE.Vector3(-1.1, 0, 0), new THREE.Vector3(-1.1, 0.55, 0), 0.08, dark);
  const nPan = new THREE.Group();
  nPan.position.set(-1.1, 0.6, 0);
  const nR = 0.95, nCap = Math.PI / 4.4;
  const nBowl = new THREE.Mesh(new THREE.SphereGeometry(nR, 32, 10, 0, Math.PI * 2, 0, nCap), new THREE.MeshStandardMaterial({ color: "#e6e9f0", emissive: COLORS.amber, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide }));
  // nCap opens toward -x (away from the hull) and slightly up
  nBowl.rotation.z = -Math.PI / 2; // sphere pole (+y) now points +x, so the hollow faces -x
  nBowl.position.x = -nR; // back of the bowl sits on the hub
  const nTilt = new THREE.Group();
  nTilt.rotation.z = -0.5;
  const nHub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 16), dark);
  nHub.rotation.z = Math.PI / 2;
  const nFeed = beamBetween(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.75, 0, 0), 0.025, dark);
  const nHorn = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glow(COLORS.amber, 1.5));
  nHorn.position.x = -0.78;
  nTilt.add(nBowl, nHub, nFeed, nHorn);
  nPan.add(nTilt);
  dish.add(nPlate, nBoom, nElbow, nRiser, nPan);
  dish.scale.setScalar(0.001);
  ship.add(dish);
  P.dish = dish;
  P.dishPan = nPan;
  P.dishBowl = nBowl;

  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true }));
  bubble.scale.set(5, 12.5, 5); bubble.position.y = 10;
  ship.add(bubble);
  P.bubble = bubble;

  shadows(ship);
  [decal, ring, bubble, core, ...P.damage].forEach((m) => { m.castShadow = false; });
  flame.traverse((m) => { m.castShadow = false; m.receiveShadow = false; });
  ship.userData.parts = P;
  return ship;
}

/* ---------- Ground console ---------- */

export function makeConsole() {
  const g = new THREE.Group();
  const shell = mat("#454b5c", { metalness: 0.5, roughness: 0.4 });
  const base = new THREE.Mesh(rbox(1.2, 1.1, 0.8, 0.12), shell);
  base.position.y = 0.55;
  const head = new THREE.Mesh(rbox(1.55, 0.95, 0.24, 0.08), shell);
  head.position.set(0, 1.38, 0.1); head.rotation.x = -0.5;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.68), new THREE.MeshStandardMaterial({ color: "#000", emissive: "#2b6b4e", emissiveIntensity: 0.3 }));
  screen.position.set(0, 1.44, 0.235); screen.rotation.x = -0.5;
  const keys = new THREE.Mesh(rbox(0.9, 0.06, 0.3, 0.02), mat("#2a2e3a"));
  keys.position.set(0, 1.12, 0.42); keys.rotation.x = -0.2;
  g.add(base, head, screen, keys);
  shadows(g);
  g.userData.screen = screen;
  return g;
}

/* ---------- Astronaut ---------- */

export function makeAstronaut() {
  const a = new THREE.Group();
  const suit = mat("#f3f3f5", { roughness: 0.65 });
  const trim = mat("#c9ccd6", { roughness: 0.6 });
  const accent = mat(COLORS.accent, { roughness: 0.5 });
  const darkM = mat("#3a3f4f", { roughness: 0.6, metalness: 0.3 });

  const torso = new THREE.Group();
  torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.42, 8, 16), suit);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 8, 24), trim);
  belt.rotation.x = Math.PI / 2; belt.position.y = -0.25;
  const panel = new THREE.Mesh(rbox(0.3, 0.22, 0.08, 0.03), trim);
  panel.position.set(0, 0.1, 0.32);
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glow(COLORS.green, 3)); b1.position.set(-0.07, 0.12, 0.37);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glow(COLORS.red, 2)); b2.position.set(0.07, 0.12, 0.37);
  torso.add(chest, belt, panel, b1, b2);

  // life support pack with two tanks and an antenna
  const pack = new THREE.Mesh(rbox(0.56, 0.66, 0.26, 0.07), trim);
  pack.position.set(0, 0.08, -0.36);
  for (const x of [-0.14, 0.14]) {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 6, 12), mat("#e2e4ea", { metalness: 0.4, roughness: 0.3 }));
    tank.position.set(x, 0.08, -0.52);
    torso.add(tank);
  }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4), darkM);
  ant.position.set(0.2, 0.6, -0.42);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), glow(COLORS.green, 3));
  antTip.position.set(0.2, 0.8, -0.42);
  torso.add(pack, ant, antTip);
  a.add(torso);

  // helmet with a reflective gold visor
  const head = new THREE.Group();
  head.position.y = 1.62;
  // One closed helmet shell; the visor is a patch of a slightly larger sphere with the same
  // centre, so it sits flush on the front of the helmet and covers the whole face.
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), suit);
  const visorGeo = new THREE.SphereGeometry(0.432, 32, 20, Math.PI / 2 - 0.95, 1.9, 0.75, 1.15);
  const visor = new THREE.Mesh(visorGeo, new THREE.MeshStandardMaterial({ color: "#ffb36b", metalness: 1, roughness: 0.08, emissive: "#ff7a45", emissiveIntensity: 0.12 }));
  // a thin frame just around the visor edge
  const frameGeo = new THREE.SphereGeometry(0.427, 32, 20, Math.PI / 2 - 1.02, 2.04, 0.68, 1.29);
  const frame = new THREE.Mesh(frameGeo, trim);
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.06, 10, 28), trim);
  neck.rotation.x = Math.PI / 2; neck.position.y = -0.36;
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), glow("#fff1c9", 2.5));
  lamp.rotation.x = Math.PI / 2; lamp.position.set(0.3, 0.22, 0.22);
  head.add(helmet, frame, visor, neck, lamp);
  a.add(head);

  const limb = (x, y, upperLen, r, endGeo, endMat, stripe) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const seg = new THREE.Mesh(new THREE.CapsuleGeometry(r, upperLen, 6, 12), suit);
    seg.position.y = -upperLen / 2 - r * 0.4;
    pivot.add(seg);
    if (stripe) { const s = new THREE.Mesh(new THREE.TorusGeometry(r + 0.005, 0.025, 6, 16), accent); s.rotation.x = Math.PI / 2; s.position.y = -0.08; pivot.add(s); }
    const end = new THREE.Mesh(endGeo, endMat);
    end.position.y = -upperLen - r * 1.2;
    pivot.add(end);
    a.add(pivot);
    return pivot;
  };
  const glove = new THREE.SphereGeometry(0.105, 12, 8);
  const boot = rbox(0.24, 0.16, 0.36, 0.06);
  const L = {
    armL: limb(-0.46, 1.32, 0.4, 0.105, glove, trim, true),
    armR: limb(0.46, 1.32, 0.4, 0.105, glove, trim, true),
    legL: limb(-0.17, 0.66, 0.38, 0.13, boot, darkM),
    legR: limb(0.17, 0.66, 0.38, 0.13, boot, darkM),
  };
  [L.legL, L.legR].forEach((leg) => (leg.children[leg.children.length - 1].position.z = 0.06));

  // welding torch in the right hand, shown while repairing
  const torch = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.32, 8), darkM);
  grip.rotation.x = Math.PI / 2;
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.12, 8), mat("#b8bcc8", { metalness: 0.8, roughness: 0.3 }));
  nozzle.rotation.x = Math.PI / 2; nozzle.position.z = 0.21;
  const fire = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: "#bfe8ff", blending: THREE.AdditiveBlending, transparent: true }));
  fire.position.z = 0.3;
  torch.add(grip, nozzle, fire);
  torch.position.set(0, -0.62, 0.12);
  torch.visible = false;
  L.armR.add(torch);

  shadows(a);
  a.userData = { limbs: L, torso, head, torch, fire, antTip };
  return a;
}

/* ---------- Base camp ---------- */

const padTex = canvasTex(512, 512, (x, w, h) => {
  x.fillStyle = "#2b2e38"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); }
  x.strokeStyle = "rgba(255,200,87,.8)"; x.lineWidth = 10;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.stroke();
  x.fillStyle = "rgba(255,200,87,.85)"; x.font = "bold 120px 'IBM Plex Mono', monospace"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("H", 256, 262);
});

const crateTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = "#6f6458"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#5c5348";
  for (let i = 0; i < 4; i++) x.fillRect(0, 20 + i * 64, w, 10);
  x.strokeStyle = "#3e372f"; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  x.fillStyle = "#ff7a45"; x.font = "bold 40px 'IBM Plex Mono', monospace"; x.textAlign = "center";
  x.fillText("MZ-01", w / 2, h / 2 + 4);
  x.fillStyle = "#e9e3d7"; x.font = "22px 'IBM Plex Mono', monospace"; x.fillText("CARGO · FRAGILE", w / 2, h / 2 + 40);
});

const solarTex = canvasTex(256, 128, (x, w, h) => {
  x.fillStyle = "#14204a"; x.fillRect(0, 0, w, h);
  x.strokeStyle = "#7f93d8"; x.lineWidth = 1.5;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); }
  for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * 32); x.lineTo(w, j * 32); x.stroke(); }
});

export function makeBase() {
  const group = new THREE.Group();
  const colliders = [];
  const metal = mat("#7b8194", { metalness: 0.6, roughness: 0.35 });
  const dark = mat("#353a48", { metalness: 0.5, roughness: 0.45 });
  const white = mat("#e6e9f0", { metalness: 0.3, roughness: 0.4 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); group.add(m); return m; };

  // landing pad
  const padMats = [mat("#2b2e38", { roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.85, metalness: 0.1 }), mat("#2b2e38", { roughness: 0.9 })];
  const pad = add(new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.8, 0.18, 6), padMats), 0, 0.02, 0);
  pad.receiveShadow = true;
  const edge = add(new THREE.Mesh(new THREE.RingGeometry(8.7, 9.1, 6, 1), new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 0.12, side: THREE.DoubleSide })), 0, 0.125, 0);
  edge.rotation.x = -Math.PI / 2;

  // Flood lights. Each lamp head is aimed at a point on the pad; the spotlight, the glowing lens
  // and the light beam all start at the lens and point at that same spot, so they line up.
  const lamps = [];
  const coneMat = new THREE.MeshBasicMaterial({ color: "#ffe2b0", transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2, x = Math.sin(a) * 11, z = Math.cos(a) * 11;
    const inward = new THREE.Vector3(-x, 0, -z).normalize();
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.25, 16), dark), x, 0.12, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.5, 12), metal), x, 2.35, z);
    const top = new THREE.Vector3(x, 4.6, z);
    const lensPos = top.clone().addScaledVector(inward, 0.45);
    group.add(beamBetween(top, lensPos.clone().addScaledVector(inward, -0.15), 0.05, metal));
    const aim = new THREE.Vector3(x * 0.35, 0, z * 0.35);

    const head = new THREE.Group();
    head.position.copy(lensPos);
    group.add(head);
    head.lookAt(aim);
    const housing = new THREE.Mesh(rbox(0.8, 0.36, 0.5, 0.08), dark);
    housing.position.z = -0.12;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), glow("#fff1c9", 5));
    lens.position.z = 0.135;
    const len = lensPos.distanceTo(aim) * 0.92;
    const beamGeo = new THREE.ConeGeometry(Math.tan(0.42) * len, len, 32, 1, true);
    beamGeo.translate(0, -len / 2, 0);
    beamGeo.rotateX(-Math.PI / 2);
    const beam = new THREE.Mesh(beamGeo, coneMat);
    beam.position.z = 0.14;
    beam.castShadow = false;
    head.add(housing, lens, beam);

    const light = new THREE.SpotLight("#ffd9a0", 70, 26, 0.5, 0.55, 1.6);
    light.position.copy(lensPos);
    light.target.position.copy(aim);
    group.add(light, light.target);
    lamps.push(light);
    colliders.push({ x, z, r: 0.45 });
  }

  // cargo crates
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.75, metalness: 0.15 });
  for (const [x, z, s, rot, y] of [[-11.5, 6, 1.3, 0.3, 0], [-12.7, 7.5, 1.1, 0.9, 0], [-11.8, 6.3, 0.9, 0.1, 1.3]]) {
    const c = new THREE.Mesh(rbox(s, s, s, 0.08), crateMat);
    c.position.set(x, y + s / 2, z); c.rotation.y = rot;
    group.add(c);
  }
  colliders.push({ x: -12, z: 6.8, r: 1.9 });

  // solar array
  const solarMat = [dark, dark, new THREE.MeshStandardMaterial({ map: solarTex, metalness: 0.7, roughness: 0.2 }), dark, dark, dark];
  for (let i = 0; i < 3; i++) {
    const x = 12 + i * 2.6, z = 9 - i * 1.2;
    const stand = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.4, 10), metal); pole.position.y = 0.7;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 1.5), solarMat); panel.position.y = 1.45; panel.rotation.x = -0.5;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.08), metal); frame.position.set(0, 1.43, 0.72); frame.rotation.x = -0.5;
    stand.add(pole, panel, frame);
    stand.position.set(x, 0, z); stand.rotation.y = 0.4;
    group.add(stand);
    colliders.push({ x, z, r: 1.2 });
  }

  // rover with a scanning camera head
  const rover = new THREE.Group();
  const chassis = new THREE.Mesh(rbox(2.7, 0.75, 1.7, 0.2), white); chassis.position.y = 1.1;
  const cabin = new THREE.Mesh(rbox(1.2, 0.65, 1.3, 0.18), mat(COLORS.accent, { roughness: 0.4 })); cabin.position.set(0.55, 1.75, 0);
  const glass = new THREE.Mesh(rbox(0.1, 0.4, 1.1, 0.04), new THREE.MeshStandardMaterial({ color: "#123a52", metalness: 0.9, roughness: 0.05 })); glass.position.set(1.16, 1.8, 0);
  const mastR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), metal); mastR.position.set(-0.8, 1.9, 0);
  const headR = new THREE.Group(); headR.position.set(-0.8, 2.4, 0);
  const camBox = new THREE.Mesh(rbox(0.36, 0.22, 0.24, 0.05), dark);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glow(COLORS.cyan, 2.5)); lens.position.x = 0.19;
  headR.add(camBox, lens);
  for (const z of [-0.45, 0.45]) { const hl = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), glow("#fff1c9", 3)); hl.position.set(1.36, 1.1, z); hl.rotation.y = Math.PI / 2; rover.add(hl); }
  rover.add(chassis, cabin, glass, mastR, headR);
  for (const [x, z] of [[-0.95, 0.98], [0.95, 0.98], [-0.95, -0.98], [0.95, -0.98]]) {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.15, 10, 20), mat("#24262e", { roughness: 0.95 }));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16), metal); hub.rotation.x = Math.PI / 2;
    wheel.add(tire, hub);
    wheel.position.set(x, 0.48, z);
    rover.add(wheel);
  }
  rover.position.set(-12, 0, -8); rover.rotation.y = 0.7;
  group.add(rover);
  colliders.push({ x: -12, z: -8, r: 1.9 });

  // Comms tower: a braced three-leg lattice, a platform, a motor, and a dish on a yoke that
  // slowly sweeps the horizon (azimuth scan), with an aviation light on its own mast.
  const tx = -14.5, tz = 1.5, TOP = 6.6;
  const legAt = (k, y) => {
    const ang = (k / 3) * Math.PI * 2 + 0.3, spread = 1.3 - (y / TOP) * 0.9;
    return new THREE.Vector3(tx + Math.cos(ang) * spread, y, tz + Math.sin(ang) * spread);
  };
  for (let k = 0; k < 3; k++) {
    group.add(beamBetween(legAt(k, 0), legAt(k, TOP), 0.11, metal));
    for (const y of [1.4, 2.9, 4.3, 5.6]) {
      group.add(beamBetween(legAt(k, y), legAt((k + 1) % 3, y), 0.04, metal));
      group.add(beamBetween(legAt(k, y - 1.4 < 0 ? 0 : y - 1.4), legAt((k + 1) % 3, y), 0.03, metal));
    }
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.2, 12), dark), legAt(k, 0).x, 0.1, legAt(k, 0).z);
  }
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 24), dark), tx, TOP + 0.08, tz);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 20), dark), tx, TOP + 0.4, tz);
  const towerDish = new THREE.Group();
  towerDish.position.set(tx, TOP + 0.7, tz);
  const yokeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16), metal);
  const tilt = new THREE.Group();
  tilt.position.y = 0.55;
  for (const sx of [-0.55, 0.55]) {
    const arm = new THREE.Mesh(rbox(0.1, 0.7, 0.16, 0.03), metal);
    arm.position.set(sx, 0.25, 0);
    towerDish.add(arm);
  }
  // the bowl is a cap of a sphere turned so its hollow side faces forward (+z)
  const R = 1.35, cap = Math.PI / 4.2;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 10, 0, Math.PI * 2, 0, cap), new THREE.MeshStandardMaterial({ color: "#e6e9f0", metalness: 0.45, roughness: 0.3, side: THREE.DoubleSide }));
  bowl.rotation.x = -Math.PI / 2;
  bowl.position.z = R;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.25, 16), dark);
  back.rotation.x = Math.PI / 2; back.position.z = R * (1 - Math.cos(cap)) * -0.1;
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8), metal);
  feed.rotation.x = Math.PI / 2; feed.position.z = 0.45;
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 12), dark);
  horn.rotation.x = -Math.PI / 2; horn.position.z = 0.95;
  tilt.add(bowl, back, feed, horn);
  tilt.rotation.x = -0.45; // looks up at the sky
  towerDish.add(yokeBase, tilt);
  group.add(towerDish);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), metal), tx + 0.6, TOP + 0.85, tz - 0.3);
  const blinker = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), glow(COLORS.red, 3)), tx + 0.6, TOP + 1.6, tz - 0.3);
  colliders.push({ x: tx, z: tz, r: 1.5 });

  // flag with a waving cloth
  const fx = 9.5, fz = 10.5;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.4, 10), metal), fx, 1.7, fz);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), metal), fx, 3.42, fz);
  const clothGeo = new THREE.PlaneGeometry(1.4, 0.85, 14, 4);
  clothGeo.translate(0.7, 0, 0);
  const cloth = add(new THREE.Mesh(clothGeo, mat(COLORS.accent, { side: THREE.DoubleSide, roughness: 0.8 })), fx + 0.03, 2.95, fz);
  const clothBase = clothGeo.attributes.position.array.slice();
  colliders.push({ x: fx, z: fz, r: 0.35 });

  shadows(group);
  pad.castShadow = false; edge.castShadow = false;
  group.traverse((o) => { if (o.material === coneMat) o.castShadow = false; });

  group.userData = {
    colliders, lamps,
    // daylight: lamps dimmer and beams almost invisible
    setDay(day) {
      lamps.forEach((l) => (l.intensity = day ? 18 : 70));
      coneMat.opacity = day ? 0.01 : 0.035;
    },
    animate(t, dt) {
      towerDish.rotation.y = Math.sin(t * 0.25) * 1.4;
      blinker.material.emissiveIntensity = Math.sin(t * 3) > 0.6 ? 4 : 0.2;
      headR.rotation.y = Math.sin(t * 0.5) * 1.2;
      lens.material.emissiveIntensity = 1.5 + Math.sin(t * 6) * 1;
      const p = clothGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = clothBase[i * 3];
        p.setZ(i, Math.sin(x * 4 - t * 5) * 0.12 * x);
        p.setY(i, clothBase[i * 3 + 1] - x * 0.05);
      }
      p.needsUpdate = true;
      clothGeo.computeVertexNormals();
    },
  };
  return group;
}

/* ---------- Drone ---------- */

// A small helper drone circling the landing site with a searchlight.
export function makeDrone() {
  const d = new THREE.Group();
  const white = mat("#e6e9f0", { metalness: 0.4, roughness: 0.35 });
  const dark = mat("#353a48", { metalness: 0.5, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 12), white);
  body.scale.y = 0.55;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), glow(COLORS.cyan, 3));
  eye.position.set(0, -0.12, 0.33);
  d.add(body, eye);
  const rotors = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const tipPos = new THREE.Vector3(Math.cos(a) * 0.8, 0.02, Math.sin(a) * 0.8);
    const arm = beamBetween(new THREE.Vector3(Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3), tipPos, 0.035, dark);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 12), dark);
    motor.position.copy(tipPos).add(new THREE.Vector3(0, 0.06, 0));
    // two-blade propeller plus a faint motion-blur disc
    const prop = new THREE.Group();
    prop.position.copy(tipPos).add(new THREE.Vector3(0, 0.14, 0));
    const blade = new THREE.Mesh(rbox(0.62, 0.015, 0.07, 0.007), mat("#2a2e3a"));
    const blur = new THREE.Mesh(new THREE.CircleGeometry(0.31, 24), new THREE.MeshBasicMaterial({ color: "#c9ccd6", transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    blur.rotation.x = -Math.PI / 2;
    prop.add(blade, blur);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glow(i < 2 ? COLORS.green : COLORS.red, 4));
    light.position.copy(tipPos).add(new THREE.Vector3(0, -0.04, 0));
    d.add(arm, motor, prop, light);
    rotors.push(prop);
  }
  const spot = new THREE.SpotLight("#cfefff", 30, 18, 0.45, 0.6, 1.5);
  spot.position.set(0, -0.2, 0);
  d.add(spot, spot.target);
  spot.target.position.set(0, -10, 2);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: "#cfefff", transparent: true, opacity: 0.025, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, -3.6, 0.6);
  beam.rotation.x = -0.1;
  d.add(beam);
  shadows(d);
  beam.castShadow = false;
  d.userData.setDay = (day) => { beam.material.opacity = day ? 0.008 : 0.025; spot.intensity = day ? 10 : 30; };
  d.userData.animate = (t) => {
    const a = t * 0.22;
    const x = Math.cos(a) * 12, z = Math.sin(a) * 12;
    d.position.set(x, 8 + Math.sin(t * 1.3) * 0.5 + groundHeight(x, z) * 0, z);
    d.rotation.y = -a;
    d.rotation.z = Math.sin(t * 1.1) * 0.08;
    rotors.forEach((r, i) => (r.rotation.y = t * 45 * (i % 2 ? 1 : -1)));
  };
  return d;
}
