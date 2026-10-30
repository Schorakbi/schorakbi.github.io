// Hero art: the repaired ship cruising past the destination planet, the same models as the mission.
// The page is readable before this loads. It pauses off screen and in hidden tabs, and if WebGL
// is missing the CSS planet behind it simply stays.
import * as THREE from "three";
import * as W from "./world.js";
import * as P from "./props.js";

const wrap = document.querySelector(".hero-art");
const canvas = document.getElementById("hero3d");

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2000);
  camera.position.set(0, 1, 58);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = P.makeSpaceEnvironment(pmrem);

  scene.add(new THREE.AmbientLight("#8090c0", 0.55));
  const sun = new THREE.DirectionalLight("#ffe2c8", 2.6);
  sun.position.set(-30, 30, 40);
  const rim = new THREE.DirectionalLight("#ff9a6e", 2.2);
  rim.position.set(40, 10, -30);
  scene.add(sun, rim);

  const planet = W.makeDestination();
  planet.position.set(60, -30, -320);
  planet.userData.beacon.visible = false;
  scene.add(planet);
  // On paper (light theme) the additive halo washes out, so the planet goes without it.
  const atmo = planet.children[1];
  const paint = () => {
    const light = document.documentElement.dataset.theme === "light";
    atmo.visible = !light;
    renderer.toneMappingExposure = light ? 0.95 : 1.1;
  };
  paint();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // The ship in its finished state: every system repaired, legs and ramp stowed for flight.
  const ship = P.makeShip();
  const parts = ship.userData.parts;
  parts.damage.forEach((m) => m.userData.fix(1));
  parts.core.material.emissiveIntensity = 1.4;
  parts.mastPivot.rotation.z = 0;
  parts.doorLight.material.emissive.set(W.COLORS.green);
  parts.emitters.forEach((e) => (e.material.emissiveIntensity = 2.6));
  parts.shieldRing.visible = false;
  parts.window.material.emissiveIntensity = 2.2;
  parts.dish.scale.setScalar(1);
  parts.legs.forEach((l) => (l.rotation.x = -2.6));
  parts.ramp.rotation.x = -1.5;
  parts.door.position.y = 4.3;
  parts.flame.visible = true;
  ship.position.y = -9;
  const holder = new THREE.Group();
  holder.add(ship);
  holder.rotation.set(0.12, 0, -0.62);
  scene.add(holder);

  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: pull back so the whole ship and its plume stay in frame
    camera.position.z = w / h < 1.1 ? 78 : 64;
    holder.position.set(w / h < 1.1 ? 0 : -3, 1, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(layout).observe(canvas);
  layout();

  const mouse = { x: 0, y: 0 }, look = new THREE.Vector3(0, 0, 0);
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const params = new URLSearchParams(location.search);
  let t = Number(params.get("heroT") || 0), last = performance.now(), visible = true, raf = 0;
  const draw = (dt) => {
    t += dt;
    holder.position.y = 1 + Math.sin(t * 0.8) * 0.6;
    holder.rotation.z = -0.62 + Math.sin(t * 0.5) * 0.04;
    ship.rotation.y = t * 0.25;
    planet.rotation.y = t * 0.02;
    parts.flame.scale.set(1.05, 1.7 + Math.sin(t * 9) * 0.08 + Math.random() * 0.1, 1.05);
    parts.flame.userData.update(t, 0);
    camera.position.x += (mouse.x * 5 - camera.position.x) * 0.04;
    camera.position.y += (1 - mouse.y * 3 - camera.position.y) * 0.04;
    camera.lookAt(look);
    renderer.render(scene, camera);
  };
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !document.hidden) draw(dt);
    raf = requestAnimationFrame(loop);
  };

  draw(0);
  canvas.classList.add("on");
  wrap.classList.add("ready");
  setTimeout(() => wrap.querySelector(".art-fallback")?.remove(), 1300);
  if (reduceMotion) return;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  raf = requestAnimationFrame(loop);
}

try { start(); } catch (e) { console.warn("Hero 3D skipped:", e); }
