// "Repair & Liftoff" in 3D. Autopilot plays the story by default, any control hands it to the visitor.
// CAPCOM (the dashboard screen) narrates and answers questions. Facts come from the CV (build/content.js).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import * as W from "./world.js";
import * as P from "./props.js";

/* ---------- Text ---------- */

const TXT = {
  en: {
    academy: "Flight academy complete. IPEIN 2020, ENIT 2022 (ICT, Telecommunications).",
    training: "Training missions logged. SMZ 07/2024 (AI), MASS Analytics 02/2025 (DevOps).",
    landing: "09/2025. Landed for repairs. The ship flies, but every system is wired by hand. Rebuilding them properly.",
    manual: "Manual control. Walk to an amber marker and press E.",
    repaired: "repaired", inProgress: "in progress",
    allGo: "All systems go. Boarding.", allGoManual: "All systems go. Walk to the ramp and press E.",
    liftoff: "Liftoff.", liftoffBig: "LIFTOFF", course: "Course set: your company. Asteroid field ahead, shields up.", shields: "Shields held.",
    arrive: "Destination reached: your company. Root cause found: your team hasn't hired Mehdi Ziadi yet.",
    endK: "Destination reached", endH: "Your company.", endP: "One DevOps & cloud infrastructure engineer, ready to land.", replay: "Replay ↺",
    distance: "Distance to your company",
    standby: "Stand by for the landing report", repairObj: "Repair the {x}", boardObj: "Board the ship", launchObj: "Launch sequence",
    spaceObj: "Fly to your company", doneObj: "Mission complete",
    hAuto: "Autopilot on · press any arrow key to take over", hFollow: "Follow the amber beacon", hNear: "Press E to repair",
    hRepairing: "Repairing…", hRamp: "Walk to the ramp and press E", hBoard: "Boarding…", hLaunch: "Hold on",
    hSpaceAuto: "Autopilot is dodging · arrows to take over", hSpaceManual: "Arrows steer · dodge the asteroids", hDone: "Pick an action to close the incident",
    incoming: "Incoming transmission", sysRepaired: "System repaired", sysWip: "Work in progress",
  },
  fr: {
    academy: "École de pilotage terminée. IPEIN 2020, ENIT 2022 (TIC, Télécommunications).",
    training: "Missions d'entraînement enregistrées. SMZ 07/2024 (IA), MASS Analytics 02/2025 (DevOps).",
    landing: "09/2025. Atterrissage pour réparations. Le vaisseau vole, mais chaque système est câblé à la main. On les reconstruit proprement.",
    manual: "Pilotage manuel. Allez vers un marqueur orange et appuyez sur E.",
    repaired: "réparé", inProgress: "en cours",
    allGo: "Tous les systèmes sont go. Embarquement.", allGoManual: "Tous les systèmes sont go. Allez à la rampe et appuyez sur E.",
    liftoff: "Décollage.", liftoffBig: "DÉCOLLAGE", course: "Cap sur votre entreprise. Champ d'astéroïdes en vue, boucliers activés.", shields: "Boucliers OK.",
    arrive: "Destination atteinte : votre entreprise. Cause racine trouvée : votre équipe n'a pas encore recruté Mehdi Ziadi.",
    endK: "Destination atteinte", endH: "Votre entreprise.", endP: "Un ingénieur DevOps & infrastructure cloud, prêt à atterrir.", replay: "Rejouer ↺",
    distance: "Distance jusqu'à votre entreprise",
    standby: "En attente du rapport d'atterrissage", repairObj: "Réparer : {x}", boardObj: "Embarquer dans le vaisseau", launchObj: "Séquence de lancement",
    spaceObj: "Rejoindre votre entreprise", doneObj: "Mission accomplie",
    hAuto: "Pilote auto · une flèche pour prendre la main", hFollow: "Suivez la balise orange", hNear: "Appuyez sur E pour réparer",
    hRepairing: "Réparation…", hRamp: "Allez à la rampe et appuyez sur E", hBoard: "Embarquement…", hLaunch: "Accrochez-vous",
    hSpaceAuto: "Le pilote auto évite les astéroïdes · les flèches pour piloter", hSpaceManual: "Flèches pour piloter · évitez les astéroïdes", hDone: "Choisissez une action pour clore l'incident",
    incoming: "Transmission entrante", sysRepaired: "Système réparé", sysWip: "En cours",
  },
};
const tx = (k) => nb(TXT[lang][k]);

// Repair order follows the story. pos is where the astronaut stands, focus is the ship part the camera frames.
const STATIONS = [
  { id: "hull", pos: [-5, 4.6], focus: [-1.6, 8.5, 1.8], name: { en: "Hull", fr: "Coque" },
    fact: { en: "Terraform: 1,625 production resources imported, across 7 roots and 3 AWS accounts.", fr: "Terraform : 1 625 ressources de production importées, sur 7 roots et 3 comptes AWS." } },
  { id: "engines", pos: [4.8, 4.6], focus: [0, 2, 0], name: { en: "Engines", fr: "Moteurs" },
    fact: { en: "Keyless CI/CD on GitHub Actions. Merge to prod 91h → 29h, failed deploys 18% → 3%, with the team.", fr: "CI/CD sans clés sur GitHub Actions. Merge → prod 91 h → 29 h, déploiements en échec 18 % → 3 %, en équipe." } },
  { id: "sensors", pos: [7.4, 0.6], focus: [3, 15.5, 0], name: { en: "Sensors", fr: "Capteurs" },
    fact: { en: "Prometheus, Grafana, OpenTelemetry and CloudWatch. 21 production alarms.", fr: "Prometheus, Grafana, OpenTelemetry et CloudWatch. 21 alarmes de production." } },
  { id: "airlocks", pos: [0, 8.2], focus: [0, 4.3, 2.9], name: { en: "Airlocks", fr: "Sas" },
    fact: { en: "James, a multi-tenant AI agent platform: cgroup v2, user namespaces, per-tenant FUSE, seccomp and Landlock.", fr: "James, plateforme d'agents IA multi-tenant : cgroup v2, user namespaces, FUSE par client, seccomp et Landlock." } },
  { id: "shields", pos: [1.6, -7.4], focus: [0.8, 10.6, -2.6], name: { en: "Shields", fr: "Boucliers" },
    fact: { en: "ISO 27001 audit: time-boxed IAM access, CloudTrail, GuardDuty, WAF.", fr: "Audit ISO 27001 : accès IAM temporaires, CloudTrail, GuardDuty, WAF." } },
  { id: "computer", pos: [6.1, -4.1], focus: [7.4, 1.2, -5.5], name: { en: "Computer", fr: "Ordinateur" },
    fact: { en: "seqctl, a Go CLI that automates daily infrastructure work. And an AI incident investigator (Go, Lambda, Claude API).", fr: "seqctl, un CLI Go qui automatise l'exploitation. Et un investigateur d'incidents IA (Go, Lambda, API Claude)." } },
  { id: "navigation", pos: [-7.2, -2.6], focus: [-3.4, 12.8, 0], wip: true, name: { en: "Navigation", fr: "Navigation" },
    fact: { en: "Moving the platform to a self-hosted HashiCorp Nomad stack, so it no longer depends on one cloud. Step 1 of 15 delivered.", fr: "Migration vers une pile HashiCorp Nomad auto-hébergée, pour ne plus dépendre d'un seul cloud. Étape 1 sur 15 livrée." } },
];
// boarding point: just past the foot of the ramp, outside its collision zone
const RAMP = new THREE.Vector3(0, 0, 7.8);

/* ---------- Renderer, scenes, post-processing ---------- */

const params = new URLSearchParams(location.search);
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);
const ground = new THREE.Scene();
const space = new THREE.Scene();
space.background = new THREE.Color("#03040a");

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(ground, camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.45, 0.82);
composer.addPass(renderPass);
composer.addPass(bloom);
// Soft vignette: darkens the corners by multiplying, never shifts colours.
const vignette = new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: "uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float d = length((vUv - 0.5) * vec2(1.0, 0.8)); c.rgb *= mix(1.0, 0.55, smoothstep(0.35, 0.8, d)); gl_FragColor = c; }",
});
composer.addPass(vignette);
composer.addPass(new OutputPass());
const pmrem = new THREE.PMREMGenerator(renderer);

// ground scene
const sky = W.makeSky(), stars = W.makeStars(), terrain = W.makeTerrain(), rocks = W.makeRocks(), moon = W.makeMoon();
ground.add(sky, stars, terrain, rocks, moon);
const landscape = W.makeLandscape(), crystals = W.makeCrystals(), base = P.makeBase(), dust = W.makeDust(), drone = P.makeDrone();
ground.add(landscape, crystals, base, dust, drone);
ground.fog = new THREE.Fog("#000", 60, 330);
const hemi = new THREE.HemisphereLight("#fff", "#000", 1);
const sun = new THREE.DirectionalLight("#fff", 2);
sun.position.set(-40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 });
const fill = new THREE.DirectionalLight("#a9b6ff", 0.9);
fill.position.set(50, 25, 45);
ground.add(hemi, sun, sun.target, fill);

const ship = P.makeShip();
const parts = ship.userData.parts;
ground.add(ship);
const consoleUnit = P.makeConsole();
consoleUnit.position.set(7.4, 0, -5.5);
consoleUnit.rotation.y = -2.2;
ground.add(consoleUnit);
const astro = P.makeAstronaut();
ground.add(astro);
const weld = new THREE.PointLight("#bfe8ff", 0, 8, 2);
ground.add(weld);

// Ground colliders: circles { x, z, r } and boxes { box: [minX, maxX, minZ, maxZ] }.
const feet = [0, 1, 2].map((i) => { const b = Math.PI / 6 + (i * 2 * Math.PI) / 3; return { x: Math.sin(b) * 4.53, z: Math.cos(b) * 4.53, r: 0.9 }; });
const COLLIDERS = [
  ...rocks.userData.colliders, ...crystals.userData.colliders, ...base.userData.colliders, ...feet,
  { x: 7.4, z: -5.5, r: 0.9 },
  { box: [-0.8, 0.8, 2.6, 6.9] }, // boarding ramp
];

// Footprints left in the dust, recycled from a small pool.
const prints = Array.from({ length: 70 }, () => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(1, 1.7, 1);
  ground.add(m);
  return m;
});
let printIdx = 0, printT = 0, printSide = 1;

const markers = STATIONS.map((st) => {
  const m = W.makeMarker();
  m.position.set(st.pos[0], 0, st.pos[1]);
  ground.add(m);
  return m;
});

const sparks = new W.Particles(600, true, 0.32);
const smoke = new W.Particles(500, false, 3.4);
ground.add(sparks.points, smoke.points);

// space scene
space.add(new THREE.AmbientLight("#8090c0", 0.6));
const spaceSun = new THREE.DirectionalLight("#ffe2c8", 2.4);
spaceSun.position.set(30, 40, 20);
space.add(spaceSun, W.makeNebula());
const warpStars = (() => {
  const n = 1600, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 500, (Math.random() - 0.5) * 300, -Math.random() * 1000 + 60], i * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: "#dfe6ff", size: 1.6, sizeAttenuation: false }));
})();
const holder = new THREE.Group();
const destination = W.makeDestination();
const debris = new W.Particles(400, true, 1);
space.add(warpStars, holder, destination, debris.points);
destination.visible = false;

/* ---------- Theme ---------- */

function applyTheme() {
  const t = W.THEMES[root.dataset.theme === "light" ? "light" : "dark"];
  [sky, terrain, rocks, stars, landscape].forEach((o) => o.userData.paint(t));
  ground.fog.color.set(t.fog);
  ground.fog.near = t.fogNear;
  ground.fog.far = t.fogFar;
  hemi.color.set(t.hemiSky);
  hemi.groundColor.set(t.hemiGround);
  hemi.intensity = t.hemi;
  sun.color.set(t.sun);
  sun.intensity = t.sunI;
  const day = root.dataset.theme === "light";
  base.userData.setDay(day);
  drone.userData.setDay(day);
  // reflections now add light, so the flat hemisphere fill is lowered
  hemi.intensity = t.hemi * 0.55;
  ground.environment?.dispose();
  ground.environment = P.makeEnvironment(pmrem, t);
}
space.environment = P.makeSpaceEnvironment(pmrem);
new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------- State ---------- */

const S = {
  phase: "intro", t: 0, pt: 0, auto: true, fixed: new Set(),
  pos: new THREE.Vector3(0, 0, 9.5), heading: 0, moving: false, repairing: null, rt: 0, visible: true,
  shipY: 0, shipV: 0, shake: 0, said: new Set(),
  sx: 0, sy: 0, asteroids: [], spawn: 0, shield: 0, lastHit: -10,
};
const camPos = new THREE.Vector3(70, 34, 95), camLook = new THREE.Vector3(0, 8, 0);
const keys = { left: false, right: false, up: false, down: false };
let act = false;
const fixed = (id) => S.fixed.has(id);
const nextStation = () => STATIONS.find((s) => !fixed(s.id));

/* ---------- Dashboard hooks ---------- */

const $ = (id) => document.getElementById(id);
const narrate = (html) => say("CAPCOM", `<p>${html}</p>`);
function once(key, fn) { if (!S.said.has(key)) { S.said.add(key); fn(); } }

function renderDash() {
  $("sys").replaceChildren(...STATIONS.map((st) => {
    const li = el("li", fixed(st.id) ? (st.wip ? "wip" : "ok") : "", `<i></i>${nb(st.name[lang])}`);
    return li;
  }));
  $("sysCount").textContent = `${S.fixed.size}/${STATIONS.length}`;
  $("pilot").setAttribute("aria-pressed", String(S.auto));
  $("progLabel").textContent = tx("distance");
  if (!$("end").hidden) showEnd();
}
function setAuto(on) {
  S.auto = on;
  renderDash();
  if (!on && S.phase === "ground" && nextStation()) once("manual", () => narrate(tx("manual")));
  if (on && S.phase === "intro") return;
}
function takeOver() {
  if (!S.auto || S.phase === "end") return;
  if (S.phase === "intro") { S.phase = "ground"; S.pt = 0; once("landing", () => transmit(tx("landing"))); }
  setAuto(false);
}
function setProgress(p) {
  $("prog").hidden = p == null;
  if (p != null) $("progBar").style.width = `${Math.round(p * 100)}%`;
}
/* ---------- On-screen card and mission tracker ---------- */

// Story messages go to CAPCOM and also pop up in the scene as a card the astronaut reads.
// Cards queue up so none is skipped; each stays at least a few seconds.
// A newer card replaces the current one once it has been readable for 2 s, so cards never lag
// behind the story; at most one card waits in line.
const holoQueue = [];
let holoT = 0, holoAge = 0;
function showHolo(kicker, title, body, kind = "") {
  holoQueue.length = 0;
  holoQueue.push({ kicker, title, body, kind });
  if (holoT <= 0 || holoAge > 2) nextHolo();
}
function nextHolo() {
  const h = holoQueue.shift();
  const box = $("holo");
  if (!h || !$("end").hidden) { box.hidden = true; holoT = 0; return; }
  box.className = "holo " + h.kind;
  box.innerHTML = `<p class="h-k mono">${h.kicker}</p>${h.title ? `<h3>${h.title}</h3>` : ""}<p class="h-b">${h.body}</p>`;
  box.hidden = false;
  box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
  holoT = h.title ? 6 : 4.5;
  holoAge = 0;
}
function updateHolo(dt) {
  holoAge += dt;
  if (holoT > 0 && (holoT -= dt) <= 0) nextHolo();
  else if (holoQueue.length && holoAge > 2) nextHolo();
}
function transmit(text) {
  narrate(text);
  showHolo("CAPCOM · " + tx("incoming"), "", text);
}

const missionEls = { step: $("mStep"), obj: $("mObj"), hint: $("mHint") };
const setText = (node, s) => { if (node.textContent !== s) node.textContent = s; };
function nearStation() {
  return STATIONS.find((s) => !fixed(s.id) && Math.hypot(S.pos.x - s.pos[0], S.pos.z - s.pos[1]) < 2.2);
}
function updateMission() {
  let obj, hint, step = "";
  const st = nextStation();
  if (S.phase === "intro") { obj = tx("standby"); hint = tx("hAuto"); }
  else if (S.phase === "ground") {
    step = `${S.fixed.size}/${STATIONS.length}`;
    if (st) {
      obj = tx("repairObj").replace("{x}", nb(st.name[lang]).toLowerCase());
      hint = S.repairing ? tx("hRepairing") : S.auto ? tx("hAuto") : nearStation() ? tx("hNear") : tx("hFollow");
    } else {
      obj = tx("boardObj");
      hint = S.auto ? tx("hAuto") : tx("hRamp");
    }
  } else if (S.phase === "board") { obj = tx("boardObj"); hint = tx("hBoard"); }
  else if (S.phase === "countdown" || S.phase === "liftoff") { obj = tx("launchObj"); hint = tx("hLaunch"); }
  else if (S.phase === "space" || S.phase === "arrive") { obj = tx("spaceObj"); hint = S.auto ? tx("hSpaceAuto") : tx("hSpaceManual"); }
  else { obj = tx("doneObj"); hint = tx("hDone"); }
  setText(missionEls.obj, obj);
  setText(missionEls.hint, hint);
  setText(missionEls.step, step);
  $("mission").classList.toggle("near", !S.auto && S.phase === "ground" && !!nearStation() && !S.repairing);
}

// A tall light column over the current objective, visible from anywhere on the plain.
const beacon = (() => {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 128;
  const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,1)");
  x.fillStyle = g; x.fillRect(0, 0, 4, 128);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 26, 20, 1, true), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(c), color: W.COLORS.amber, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  }));
  m.geometry.translate(0, 13, 0);
  return m;
})();
ground.add(beacon);
function updateBeacon() {
  const st = nextStation();
  const show = S.phase === "ground" && !S.repairing;
  beacon.visible = show;
  if (!show) return;
  if (st) beacon.position.set(st.pos[0], 0, st.pos[1]);
  else beacon.position.set(RAMP.x, 0, RAMP.z);
  beacon.material.color.set(!st ? W.COLORS.green : W.COLORS.amber);
  beacon.material.opacity = 0.22 + Math.sin(S.t * 3) * 0.08;
}

function showEnd() {
  $("holo").hidden = true;
  holoQueue.length = 0;
  const e = $("end");
  e.innerHTML = `<p class="kicker mono">${tx("endK")}</p><h2>${tx("endH")}</h2><p class="end-p">${tx("endP")}</p>${actions()}
    <button class="btn line replay" type="button" id="replay">${tx("replay")}</button>`;
  e.hidden = false;
  $("replay").onclick = () => location.reload();
}

/* ---------- Repairs: visual changes per part ---------- */

const tweens = [];
const tween = (dur, fn) => tweens.push({ t: 0, dur, fn });
const hullColor = new THREE.Color(W.COLORS.hull);

function applyRepair(id) {
  if (id === "hull") parts.damage.forEach((m) => tween(1.2, (k) => m.userData.fix(k)));
  if (id === "engines") tween(1, (k) => (parts.core.material.emissiveIntensity = k * 1.4));
  if (id === "sensors") tween(1.2, (k) => (parts.mastPivot.rotation.z = -1.25 * (1 - k)));
  if (id === "airlocks") parts.doorLight.material.emissive.set(W.COLORS.green);
  if (id === "shields") tween(1, (k) => { parts.emitters.forEach((e) => (e.material.emissiveIntensity = k * 2.6)); parts.shieldRing.material.opacity = k * 0.55; });
  if (id === "computer") tween(1, (k) => {
    consoleUnit.userData.screen.material.emissive.set("#59f0a8");
    consoleUnit.userData.screen.material.emissiveIntensity = 0.3 + k * 1.8;
    parts.window.material.emissiveIntensity = 0.4 + k * 1.8;
  });
  if (id === "navigation") tween(1.4, (k) => parts.dish.scale.setScalar(Math.max(0.001, k)));
}

/* ---------- Update ---------- */

const REPAIR_TIME = 2.2, WALK = 4.4;
const tmp = new THREE.Vector3();

function update(dt) {
  S.t += dt;
  S.pt += dt;
  for (const tw of tweens) { tw.t = Math.min(tw.dur, tw.t + dt); tw.fn(tw.t / tw.dur); }
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].t >= tweens[i].dur) tweens.splice(i, 1);
  sparks.update(dt); smoke.update(dt); debris.update(dt);
  animateParts(dt);

  if (S.phase === "intro") updateIntro();
  else if (S.phase === "ground") updateGround(dt);
  else if (S.phase === "board") updateBoard(dt);
  else if (S.phase === "countdown") updateCountdown();
  else if (S.phase === "liftoff") updateLiftoff(dt);
  else if (S.phase === "space") updateSpace(dt);
  else if (S.phase === "arrive") updateArrive(dt);
  else if (S.phase === "end") { destination.rotation.y += dt * 0.05; scrollStars(dt, 20); parts.flame.userData.update(S.t, 0); }

  updateAstronaut(dt);
  updateHolo(dt);
  updateBeacon();
  updateMission();
  updateCamera(dt);
  act = false;
}

function animateParts(dt) {
  dust.userData.update(dt, S.t);
  base.userData.animate(S.t, dt);
  drone.userData.animate(S.t);
  markers.forEach((m, i) => {
    const st = STATIONS[i], U = m.userData;
    // a repaired spot fades out on the ground over half a second
    const target = S.phase === "ground" && !fixed(st.id) ? 1 : 0;
    U.setFade(target ? Math.min(1, U.fade + dt * 3) : Math.max(0, U.fade - dt * 2));
    m.visible = U.fade > 0.01;
    if (!m.visible) return;
    const near = !S.auto && Math.hypot(S.pos.x - st.pos[0], S.pos.z - st.pos[1]) < 2.2;
    U.setColor(near || fixed(st.id) ? W.COLORS.green : W.COLORS.amber);
    U.setProgress(fixed(st.id) ? 1 : S.repairing === st ? S.rt / REPAIR_TIME : 0);
    U.ring.scale.setScalar(1 + Math.sin(S.t * 3 + i) * 0.05);
    U.ticks.rotation.z += dt * 0.4;
  });
  if (fixed("sensors")) parts.tip.material.emissiveIntensity = Math.sin(S.t * 5) > 0 ? 3 : 0.2;
  // the boom stays fixed to the hull; only the dish head sweeps slowly, its amber light blinks (in progress)
  if (fixed("navigation")) { parts.dishPan.rotation.y = Math.sin(S.t * 0.5) * 0.55; parts.dishBowl.material.emissiveIntensity = Math.sin(S.t * 4) > 0 ? 0.9 : 0.2; }
  if (!fixed("airlocks")) parts.doorLight.material.emissiveIntensity = Math.sin(S.t * 9) > 0 ? 3 : 0.4;
  if (!fixed("engines") && S.phase !== "space" && Math.random() < 0.35) {
    smoke.emit(tmp.set((Math.random() - 0.5) * 1.5, ship.position.y + 0.4, (Math.random() - 0.5) * 1.5), new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.4 + Math.random(), (Math.random() - 0.5) * 0.4), "#6d6a78", 2.5, -0.2, 0.3);
  }
}

function updateIntro() {
  if (S.pt > 0.6) once("academy", () => transmit(tx("academy")));
  if (S.pt > 2.8) once("training", () => transmit(tx("training")));
  if (S.pt > 5) once("landing", () => transmit(tx("landing")));
  if (S.pt > 7.5) { S.phase = "ground"; S.pt = 0; }
}

// Walk toward a point, going around the rocket instead of through it.
// The boarding ramp sticks out in front, so paths that cross it go around its far end.
const RAMP_ZONE = [-1.3, 1.3, 2.2, 7.4];
function crossesRamp(ax, az, bx, bz) {
  const [x0, x1, z0, z1] = RAMP_ZONE;
  for (let i = 0; i <= 24; i++) {
    const x = ax + ((bx - ax) * i) / 24, z = az + ((bz - az) * i) / 24;
    if (x > x0 && x < x1 && z > z0 && z < z1) return true;
  }
  return false;
}
function walkToward(target, dt) {
  if (S.phase === "ground" && crossesRamp(S.pos.x, S.pos.z, target.x, target.z)) {
    // first reach the lane in front of the ramp on our own side, then walk along it to the target's side
    const inLane = S.pos.z > 7.5 && Math.abs(S.pos.x) < 2.2;
    const side = inLane ? Math.sign(target.x) || 1 : S.pos.x < 0 ? -1 : 1;
    const wp = new THREE.Vector3(1.9 * side, 0, 8);
    target = wp;
    target.detour = true;
  }
  const to = tmp.set(target.x - S.pos.x, 0, target.z - S.pos.z);
  const dist = to.length();
  if (dist < 0.15) return !target.detour;
  to.normalize();
  // closest approach of the straight path to the rocket axis
  const tClosest = Math.max(0, Math.min(dist, -(S.pos.x * to.x + S.pos.z * to.z)));
  const cx = S.pos.x + to.x * tClosest, cz = S.pos.z + to.z * tClosest;
  if (Math.hypot(cx, cz) < 4.6 && Math.hypot(S.pos.x, S.pos.z) < 9) {
    const r = Math.hypot(S.pos.x, S.pos.z) || 1;
    const side = Math.sign(S.pos.x * target.z - S.pos.z * target.x) || 1;
    const tang = new THREE.Vector3(-S.pos.z / r * side, 0, S.pos.x / r * side);
    const out = new THREE.Vector3(S.pos.x / r, 0, S.pos.z / r).multiplyScalar(r < 5.6 ? 0.6 : 0);
    to.copy(tang.add(out).normalize());
  }
  moveAstro(to, dt);
  return false;
}
function moveAstro(dir, dt) {
  S.pos.addScaledVector(dir, WALK * dt);
  const r = Math.hypot(S.pos.x, S.pos.z);
  if (r < 4.4) S.pos.multiplyScalar(4.4 / r);
  if (r > 60) S.pos.multiplyScalar(60 / r);
  // slide around rocks, crystals and base equipment instead of walking through them
  for (const c of COLLIDERS) {
    if (c.box) {
      // push out of the box through its nearest side
      const [x0, x1, z0, z1] = c.box, pad = 0.4;
      if (S.pos.x > x0 - pad && S.pos.x < x1 + pad && S.pos.z > z0 - pad && S.pos.z < z1 + pad) {
        const opts = [[S.pos.x - (x0 - pad), "x", x0 - pad], [(x1 + pad) - S.pos.x, "x", x1 + pad], [S.pos.z - (z0 - pad), "z", z0 - pad], [(z1 + pad) - S.pos.z, "z", z1 + pad]];
        const [, axis, v] = opts.sort((p, q) => p[0] - q[0])[0];
        S.pos[axis] = v;
      }
      continue;
    }
    const dx = S.pos.x - c.x, dz = S.pos.z - c.z, d = Math.hypot(dx, dz), min = c.r + 0.45;
    if (d < min && d > 0.0001) { S.pos.x = c.x + (dx / d) * min; S.pos.z = c.z + (dz / d) * min; }
  }
  S.heading = Math.atan2(dir.x, dir.z);
  S.moving = true;
}

function updateGround(dt) {
  S.moving = false;
  if (S.repairing) {
    S.rt += dt;
    const st = S.repairing;
    const f = new THREE.Vector3(...st.focus);
    if (Math.random() < 0.8) {
      for (let i = 0; i < 3; i++) sparks.emit(f, new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6), Math.random() < 0.5 ? "#ffd27a" : "#ffffff", 0.5 + Math.random() * 0.4, 9);
    }
    weld.position.copy(f);
    weld.intensity = 6 + Math.random() * 10;
    if (S.rt >= REPAIR_TIME) finishRepair(st);
    return;
  }
  weld.intensity = 0;

  if (S.auto) {
    const st = nextStation();
    const target = st ? new THREE.Vector3(st.pos[0], 0, st.pos[1]) : RAMP;
    if (walkToward(target, dt)) {
      if (st) startRepair(st);
      else startBoarding();
    }
    return;
  }

  const fwd = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const dir = new THREE.Vector3()
    .addScaledVector(fwd, (keys.up ? 1 : 0) - (keys.down ? 1 : 0))
    .addScaledVector(right, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
  if (dir.lengthSq() > 0) moveAstro(dir.normalize(), dt);
  if (act) {
    const near = STATIONS.filter((s) => !fixed(s.id)).find((s) => Math.hypot(S.pos.x - s.pos[0], S.pos.z - s.pos[1]) < 2.2);
    if (near) startRepair(near);
    else if (!nextStation() && S.pos.distanceTo(RAMP) < 2.6) startBoarding();
  }
}

function startRepair(st) {
  S.repairing = st;
  S.rt = 0;
  S.heading = Math.atan2(st.focus[0] - S.pos.x, st.focus[2] - S.pos.z);
}
function finishRepair(st) {
  S.fixed.add(st.id);
  S.repairing = null;
  weld.intensity = 0;
  const f = new THREE.Vector3(...st.focus);
  for (let i = 0; i < 40; i++) sparks.emit(f, new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 8, (Math.random() - 0.5) * 9), st.wip ? "#ffc857" : i % 2 ? "#7fe0a7" : "#6fd6ff", 0.9, 6);
  applyRepair(st.id);
  narrate(`<b class="${st.wip ? "wip" : "ok"}">${nb(st.name[lang]).toUpperCase()}</b> ${st.wip ? tx("inProgress") : tx("repaired")}. ${nb(st.fact[lang])}`);
  showHolo(`${st.wip ? "◔ " + tx("sysWip") : "✓ " + tx("sysRepaired")} · ${S.fixed.size}/${STATIONS.length}`, nb(st.name[lang]), nb(st.fact[lang]), st.wip ? "wip" : "ok");
  renderDash();
  if (!nextStation()) transmit(S.auto ? tx("allGo") : tx("allGoManual"));
}

function startBoarding() {
  S.phase = "board"; S.pt = 0;
  // the door slides up to let the astronaut in, then closes behind
  tween(0.8, (k) => (parts.door.position.y = 4.3 + k * 2.4));
}

function updateBoard(dt) {
  if (!S.visible && S.pt > 1.2 && !S.doorClosing) {
    S.doorClosing = true;
    tween(0.8, (k) => (parts.door.position.y = 6.7 - k * 2.4));
  }
  // straight up the ramp to the door, no detour around the hull
  if (S.visible) {
    S.pos.x *= 0.85;
    S.pos.z -= dt * 2.6;
    S.heading = Math.PI;
    S.moving = true;
    S.pos.y = Math.min(2.75, Math.max(0, (6.4 - S.pos.z) * 0.81)); // follows the ramp slope
    if (S.pos.z < 3.4) S.visible = false;
  } else if (S.pt > 2.2) {
    // the ramp swings up on its hinge and closes flat over the door
    tween(2, (k) => (parts.ramp.rotation.x = 0.68 - 2.18 * k * k * (3 - 2 * k)));
    S.phase = "countdown"; S.pt = 0;
  }
}

// Big 3 · 2 · 1 · LIFTOFF in the middle of the screen. Each number pops in, then fades.
$("count").addEventListener("animationend", (e) => (e.currentTarget.hidden = true));
function showCount(text, big) {
  const c = $("count");
  c.textContent = text;
  c.classList.toggle("go", !big);
  c.hidden = false;
  c.style.animation = "none"; void c.offsetWidth; c.style.animation = "";
}

function updateCountdown() {
  for (const n of [3, 2, 1]) if (S.pt > 3 - n + 0.2) once("t" + n, () => { transmit(`T-${n}`); showCount(String(n), true); });
  // engine pre-ignition during the last second: a small flame and the nozzle heating up
  if (S.pt > 2.4) {
    const k = Math.min(1, (S.pt - 2.4) / 1);
    parts.flame.visible = true;
    parts.flame.scale.set(0.55 + k * 0.25, 0.15 + k * 0.25, 0.55 + k * 0.25);
    parts.flame.userData.update(S.t, 0.3 + k * 0.4);
  }
  if (S.pt > 3.4) {
    once("liftoff", () => { transmit(tx("liftoff")); showCount(tx("liftoffBig"), false); });
    S.phase = "liftoff"; S.pt = 0;
  }
}

function updateLiftoff(dt) {
  const ignite = Math.min(1, S.pt / 1.2);
  // width capped so the plume stays inside the bell; only the length grows
  parts.flame.scale.set(0.8 + ignite * 0.25, 0.4 + ignite * 0.9 + Math.random() * 0.12, 0.8 + ignite * 0.25);
  parts.flame.userData.update(S.t, 1);
  parts.core.material.emissiveIntensity = 3;
  S.shake = Math.max(S.shake, 0.35 * ignite);
  if (S.pt > 1) { S.shipV += dt * (6 + S.pt * 6); S.shipY += S.shipV * dt; }
  ship.position.y = S.shipY;
  // once clear of the ground, the legs swing out and fold up against the hull
  const fold = Math.min(1, Math.max(0, (S.pt - 1.8) / 1.9));
  parts.legs.forEach((l) => (l.rotation.x = -2.6 * fold * fold * (3 - 2 * fold)));
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    smoke.emit(tmp.set(Math.cos(a) * 1.5, Math.max(0.3, S.shipY - 2), Math.sin(a) * 1.5), new THREE.Vector3(Math.cos(a) * (6 + Math.random() * 6), 0.6 + Math.random(), Math.sin(a) * (6 + Math.random() * 6)), "#9a93a6", 3, -0.1, 0.8);
  }
  const fade = $("fade");
  fade.style.opacity = String(Math.max(0, Math.min(1, (S.pt - 4.6) / 0.9)));
  if (S.pt > 5.6) enterSpace();
}

function enterSpace() {
  $("count").hidden = true;
  S.phase = "space"; S.pt = 0;
  holder.add(ship);
  ship.position.set(0, -10, 0);
  holder.rotation.set(-Math.PI / 2, 0, 0);
  holder.position.set(0, 0, 0);
  parts.legs.forEach((l) => (l.rotation.x = -2.6)); // stay folded in flight
  parts.ramp.rotation.x = -1.5;
  parts.door.position.y = 4.3;
  parts.shieldRing.visible = false;
  renderPass.scene = space;
  camPos.set(0, 6, 34);
  camLook.set(0, 0, -30);
  $("fade").style.opacity = "0";
  S.shake = 0;
  narrate(tx("course"));
}

function scrollStars(dt, speed) {
  const p = warpStars.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let z = p.getZ(i) + speed * dt;
    if (z > 60) z -= 1000;
    p.setZ(i, z);
  }
  p.needsUpdate = true;
}

const SPACE_TIME = 16;
function updateSpace(dt) {
  setProgress(Math.min(1, S.pt / SPACE_TIME));
  scrollStars(dt, 260);
  parts.flame.scale.set(1.05, 1.5 + Math.random() * 0.2, 1.05);
  parts.flame.userData.update(S.t, 0);

  if (S.pt < SPACE_TIME - 3 && (S.spawn -= dt) <= 0) {
    S.spawn = 0.45 + Math.random() * 0.45;
    const a = W.makeAsteroid();
    a.position.set((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 20, -420);
    a.userData.v = 70 + Math.random() * 50;
    space.add(a);
    S.asteroids.push(a);
  }
  for (const a of S.asteroids) {
    a.position.z += a.userData.v * dt;
    a.rotation.x += a.userData.spin.x * dt; a.rotation.y += a.userData.spin.y * dt;
  }

  let dx = 0, dy = 0;
  if (S.auto) {
    const threat = S.asteroids.filter((a) => a.position.z > -160 && a.position.z < 12 && Math.hypot(a.position.x - S.sx, a.position.y - S.sy) < a.userData.r + 4.5)
      .sort((p, q) => q.position.z - p.position.z)[0];
    if (threat) {
      dx = Math.sign(S.sx - threat.position.x) || 1;
      dy = Math.sign(S.sy - threat.position.y) * 0.6;
    } else { dx = -Math.sign(S.sx) * Math.min(1, Math.abs(S.sx) / 3); dy = -Math.sign(S.sy) * Math.min(1, Math.abs(S.sy) / 3); }
  } else {
    dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    dy = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  }
  S.sx = Math.max(-13, Math.min(13, S.sx + dx * 14 * dt));
  S.sy = Math.max(-7, Math.min(7, S.sy + dy * 11 * dt));
  holder.position.set(S.sx, S.sy, 0);
  holder.rotation.z = THREE.MathUtils.lerp(holder.rotation.z, -dx * 0.35, 1 - Math.exp(-dt * 6));

  S.shield = Math.max(0, S.shield - dt * 1.6);
  parts.bubble.material.opacity = S.shield * 0.55;
  for (const a of S.asteroids) {
    if (a.position.z > -12 && a.position.z < 12 && Math.hypot(a.position.x - S.sx, a.position.y - S.sy) < a.userData.r + 2.6) {
      a.userData.hit = true;
      S.shield = 1;
      S.shake = 0.5;
      for (let i = 0; i < 40; i++) debris.emit(a.position, new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30), i % 3 ? "#9a90a8" : "#6fd6ff", 0.8);
      if (S.t - S.lastHit > 3) { S.lastHit = S.t; narrate(tx("shields")); }
    }
  }
  S.asteroids = S.asteroids.filter((a) => {
    const keep = !a.userData.hit && a.position.z < 60;
    if (!keep) space.remove(a); // geometry is shared between asteroids, never disposed here
    return keep;
  });

  if (S.pt >= SPACE_TIME) {
    S.phase = "arrive"; S.pt = 0;
    destination.visible = true;
    destination.position.set(40, -10, -1400);
    S.asteroids.forEach((a) => (a.userData.fly = true));
    setProgress(null);
  }
}

function updateArrive(dt) {
  // leftover asteroids keep drifting past the camera, then disappear
  S.asteroids = S.asteroids.filter((a) => { a.position.z += a.userData.v * dt; if (a.position.z > 60) { space.remove(a); return false; } return true; });
  const k = Math.min(1, S.pt / 5);
  const e = 1 - (1 - k) ** 3;
  scrollStars(dt, 260 * (1 - e) + 20);
  destination.position.set(70 - e * 15, -10 + e * 6, -1400 + e * 1130);
  destination.rotation.y += dt * 0.05;
  S.sx = THREE.MathUtils.lerp(S.sx, 9, dt * 0.8);
  S.sy = THREE.MathUtils.lerp(S.sy, -3, dt * 0.8);
  holder.position.set(S.sx, S.sy, 0);
  holder.rotation.z *= 0.95;
  parts.flame.scale.set(1, 0.7 + (1 - e) * 0.8, 1);
  parts.flame.userData.update(S.t, 0);
  if (S.pt > 2.4) once("arrive", () => narrate(tx("arrive")));
  if (S.pt > 5.2) { S.phase = "end"; showEnd(); }
}

/* ---------- Astronaut & camera ---------- */

function updateAstronaut(dt) {
  astro.visible = S.visible && renderPass.scene === ground;
  // stand on the pad near the rocket, on the terrain everywhere else
  const r = Math.hypot(S.pos.x, S.pos.z);
  const floor = r < 9.6 ? 0.11 : W.groundHeight(S.pos.x, S.pos.z);
  const U = astro.userData, L = U.limbs;
  const crouch = S.repairing && S.repairing.focus[1] < 3 ? 1 : 0;
  U.crouch = THREE.MathUtils.lerp(U.crouch || 0, crouch, 1 - Math.exp(-dt * 8));
  astro.position.set(S.pos.x, S.pos.y + floor - U.crouch * 0.32, S.pos.z);
  // turn along the shortest way
  let dh = S.heading - astro.rotation.y;
  dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  astro.rotation.y += dh * (1 - Math.exp(-dt * 10));

  const ph = S.t * 9, sw = S.moving ? Math.sin(ph) * 0.65 : 0;
  L.legL.rotation.x = sw - U.crouch * 1.1;
  L.legR.rotation.x = -sw - U.crouch * 0.4;
  U.torso.rotation.x = U.crouch * 0.35 + (S.moving ? 0.08 : 0);
  U.torso.scale.y = 1 + Math.sin(S.t * 2.2) * 0.012; // breathing
  U.head.rotation.y = S.moving || S.repairing ? 0 : Math.sin(S.t * 0.6) * 0.5; // looks around when idle
  U.head.rotation.x = S.repairing ? 0.25 : 0;
  U.torch.visible = !!S.repairing;
  if (S.repairing) {
    L.armR.rotation.x = -1.35 + Math.sin(S.t * 18) * 0.08;
    L.armL.rotation.x = -0.9;
    U.fire.scale.setScalar(0.7 + Math.random() * 0.9);
  } else {
    L.armL.rotation.x = -sw * 0.8; L.armR.rotation.x = sw * 0.8;
  }
  L.armL.rotation.z = -0.12; L.armR.rotation.z = 0.12;
  U.antTip.material.emissiveIntensity = Math.sin(S.t * 4) > 0 ? 3 : 0.3;
  if (S.moving) astro.position.y += Math.abs(Math.sin(ph)) * 0.05;

  // footprints and little dust puffs while walking on the ground
  if (S.moving && S.phase === "ground") {
    printT -= dt;
    if (printT <= 0) {
      printT = 0.33;
      printSide *= -1;
      const fp = prints[printIdx++ % prints.length];
      const side = new THREE.Vector3(Math.cos(astro.rotation.y), 0, -Math.sin(astro.rotation.y)).multiplyScalar(0.15 * printSide);
      fp.position.set(S.pos.x + side.x, floor + 0.02, S.pos.z + side.z);
      fp.rotation.z = -astro.rotation.y;
      fp.material.opacity = r < 9.6 ? 0.18 : 0.35;
      fp.userData.age = 0;
      if (r >= 9.6) smoke.emit(tmp.set(S.pos.x + side.x, floor + 0.1, S.pos.z + side.z), new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6), "#8a6a62", 0.9, 0, 1.5);
    }
  }
  for (const fp of prints) if (fp.material.opacity > 0) fp.material.opacity = Math.max(0, fp.material.opacity - dt * 0.012);
}

const damp = (k, dt) => 1 - Math.exp(-k * dt);
function updateCamera(dt) {
  // ?cam=x,y,z,lx,ly,lz: fixed test camera, used to check models from a chosen angle
  if (params.has("cam")) {
    const [x, y, z, lx, ly, lz] = params.get("cam").split(",").map(Number);
    camera.position.set(x, y, z); camera.lookAt(lx, ly, lz);
    return;
  }
  // ?closeup: test view of the astronaut's helmet, used to check the model
  if (params.has("closeup")) {
    const p = astro.position, h = astro.rotation.y + Number(params.get("closeup") || 0);
    camera.position.set(p.x + Math.sin(h) * 2.2, p.y + 1.75, p.z + Math.cos(h) * 2.2);
    camera.lookAt(p.x, p.y + 1.45, p.z);
    return;
  }
  const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
  if (S.phase === "intro") {
    const k = Math.min(1, S.pt / 7.5), e = k * k * (3 - 2 * k);
    wantPos.set(70 - 52 * e, 34 - 24 * e, 95 - 70 * e);
    wantLook.set(0, 8 - 3 * e, 0);
    camPos.lerp(wantPos, damp(3, dt));
    camLook.lerp(wantLook, damp(3, dt));
  } else if (S.phase === "ground" || S.phase === "board") {
    const out = new THREE.Vector3(S.pos.x, 0, S.pos.z).normalize();
    const me = astro.position;
    const far = Math.hypot(S.pos.x, S.pos.z) > 20;
    if (S.repairing) {
      const f = new THREE.Vector3(...S.repairing.focus);
      wantPos.copy(me).addScaledVector(out, 15).add(new THREE.Vector3(out.z * 5, 4 + f.y * 0.5, -out.x * 5));
      wantLook.copy(f).lerp(me, 0.25);
    } else if (far) {
      // out on the plain: a normal follow camera behind the astronaut
      const back = new THREE.Vector3(-Math.sin(astro.rotation.y), 0, -Math.cos(astro.rotation.y));
      wantPos.copy(me).addScaledVector(back, 12).add(new THREE.Vector3(0, 6, 0));
      wantLook.copy(me).add(new THREE.Vector3(0, 1.5, 0));
    } else {
      wantPos.copy(me).addScaledVector(out, 23).add(new THREE.Vector3(out.z * 5, 9.5, -out.x * 5));
      wantLook.copy(me).lerp(new THREE.Vector3(0, 10, 0), 0.62);
    }
    camPos.lerp(wantPos, damp(2.2, dt));
    camLook.lerp(wantLook, damp(3, dt));
  } else if (S.phase === "countdown" || S.phase === "liftoff") {
    wantPos.set(20, 4 + S.shipY * 0.15, 30);
    wantLook.set(0, 9 + S.shipY * 0.9, 0);
    camPos.lerp(wantPos, damp(1.5, dt));
    camLook.lerp(wantLook, damp(S.phase === "liftoff" ? 4 : 2, dt));
  } else {
    wantPos.set(S.sx * 0.65, S.sy * 0.6 + 6.5, 34);
    wantLook.set(S.sx * 0.5, S.sy * 0.5, -40);
    if (S.phase === "arrive" || S.phase === "end") { wantPos.set(-14, 4, 40); wantLook.set(2, 2, -200); }
    camPos.lerp(wantPos, damp(2.5, dt));
    camLook.lerp(wantLook, damp(2.5, dt));
  }
  S.shake = Math.max(0, S.shake - dt * 0.6);
  camera.position.copy(camPos).add(new THREE.Vector3((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake, 0));
  // never let the camera dip under the hills
  if (renderPass.scene === ground) camera.position.y = Math.max(camera.position.y, W.groundHeight(camera.position.x, camera.position.z) + 2);
  camera.lookAt(camLook);
}

/* ---------- Skip ---------- */

function skipToEnd() {
  if (S.phase === "end") return;
  STATIONS.forEach((st) => { if (!fixed(st.id)) { S.fixed.add(st.id); applyRepair(st.id); } });
  for (let i = 0; i < 120; i++) for (const tw of tweens) tw.fn(1);
  tweens.length = 0;
  S.repairing = null; S.visible = false; weld.intensity = 0;
  if (renderPass.scene !== space) enterSpace();
  S.asteroids.forEach((a) => space.remove(a));
  S.asteroids = [];
  parts.flame.visible = true;
  destination.visible = true;
  destination.position.set(55, -4, -270);
  S.sx = 9; S.sy = -3;
  holder.position.set(S.sx, S.sy, 0);
  camPos.set(-14, 4, 40); camLook.set(2, 2, -200);
  setProgress(null);
  S.phase = "end";
  renderDash();
  showEnd();
}

/* ---------- Input ---------- */

const KEYMAP = { arrowleft: "left", a: "left", q: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", z: "up", arrowdown: "down", s: "down" };
const typing = () => /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "");
addEventListener("keydown", (e) => {
  if (typing()) return;
  const k = KEYMAP[e.key.toLowerCase()];
  if (k) { keys[k] = true; takeOver(); e.preventDefault(); }
  else if (["e", "enter", " "].includes(e.key.toLowerCase()) && !e.target.closest?.("button, a")) { act = true; takeOver(); e.preventDefault(); }
});
addEventListener("keyup", (e) => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys[k] = false; });
addEventListener("blur", () => Object.keys(keys).forEach((k) => (keys[k] = false)));
document.querySelectorAll("[data-k]").forEach((b) => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); takeOver(); if (k === "act") act = true; else keys[k] = true; });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => { if (k !== "act") keys[k] = false; }));
});
$("pilot").onclick = () => setAuto(!S.auto);
$("skip").onclick = skipToEnd;

// Hide or show the dashboard (button or H key). Remembered for the next visit.
function setDash(on) {
  document.body.classList.toggle("dash-off", !on);
  $("dashToggle").setAttribute("aria-pressed", String(on));
  try { localStorage.setItem("dash", on ? "on" : "off"); } catch {}
}
$("dashToggle").onclick = () => setDash(document.body.classList.contains("dash-off"));
try { if (localStorage.getItem("dash") === "off") setDash(false); } catch {}
addEventListener("keydown", (e) => { if (!typing() && e.key.toLowerCase() === "h") setDash(document.body.classList.contains("dash-off")); });
document.querySelectorAll(".dash-tabs [data-tab]").forEach((b) => (b.onclick = () => {
  $("dash").dataset.tab = b.dataset.tab;
  document.querySelectorAll(".dash-tabs [data-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));

/* ---------- Loop ---------- */

// Quality: 2 = bloom and soft shadows, 1 = shadows only, 0 = neither at lower resolution.
// Phones and small CPUs start at 1, and the level drops by itself when frames are slow. ?q= forces one.
const forcedQ = params.get("q");
let quality = forcedQ != null ? Number(forcedQ) : (innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2);
function applyQuality() {
  bloom.enabled = quality >= 2;
  renderer.shadowMap.enabled = quality >= 1;
  [ground, space].forEach((sc) => sc.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); }));
  resize();
}
let perfFrames = -90, perfSlow = 0; // skip the first frames, shaders are still compiling
function watchPerf(ms) {
  if (forcedQ != null || quality === 0 || document.hidden) return;
  if (++perfFrames <= 0) return;
  if (ms > 1000 / 38) perfSlow++;
  if (perfFrames < 120) return;
  if (perfSlow > 60) { quality--; applyQuality(); perfFrames = -30; }
  else perfFrames = 0;
  perfSlow = 0;
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const mobile = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 0 ? 1 : mobile ? 1.5 : 1.75));
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 62 : 50;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  watchPerf(now - last);
  last = now;
  if (!document.hidden) { update(dt); composer.render(); }
  requestAnimationFrame(frame);
}

langListeners.push(renderDash);
applyTheme();
initCapcom();
initControls({
  title: { en: "Mission · Mehdi Ziadi", fr: "Mission · Mehdi Ziadi" },
  en: {
    missionK: "Mission", dashHide: "Hide dashboard", dashShow: "Show dashboard", footRole: "DevOps & Cloud Infrastructure Engineer", sys: "Systems", ctl: "Controls", pilot: "Autopilot", skip: "Skip to the end", cvPlain: "← Home", tabCtl: "Controls",
    askLabel: "Your question", askPh: "Ask CAPCOM anything… e.g. “tell me about James”", send: "Send", loading: "Booting systems…",
    keysHint: "Arrows / WASD move · E repair · H hide panel",
  },
  fr: {
    missionK: "Mission", dashHide: "Masquer le tableau de bord", dashShow: "Afficher le tableau de bord", footRole: "Ingénieur DevOps & Infrastructure Cloud", sys: "Systèmes", ctl: "Commandes", pilot: "Pilote auto", skip: "Aller à la fin", cvPlain: "← Accueil", tabCtl: "Commandes",
    askLabel: "Votre question", askPh: "Demandez à CAPCOM… ex. « parle-moi de James »", send: "Envoyer", loading: "Démarrage des systèmes…",
    keysHint: "Flèches / ZQSD · E réparer · H masquer le panneau",
  },
});
applyQuality();

// Screenshots and tests: ?shot=SECONDS runs the story forward without waiting.
const shot = Number(params.get("shot") || 0);
if (shot) for (let i = 0; i < shot * 30; i++) update(1 / 30);
if (reduceMotion && !shot) skipToEnd();
composer.render();
$("boot").hidden = true;
requestAnimationFrame(frame);
