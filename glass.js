import { createGlassScene } from "https://esm.sh/@glass-sdk/liquid-glass@0.0.2/dom";

const CHROME = "header, #day-tabs, nav.fixed, #floating-rest-pill > div, #vacuum-modal > div, #weight-modal > div, #program-modal > div";
const PANELS = "main .rounded-3xl.border-borderWarm";

const registered = new Map();
let scene = null;
let warned = false;

function shown(el) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (node.classList.contains("hidden")) return false;
  }
  const box = el.getBoundingClientRect();
  return box.width >= 2 && box.height >= 2;
}

function radiusFor(el) {
  const box = el.getBoundingClientRect();
  const curve = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24;
  if (curve >= box.height / 2) return "capsule";
  return Math.max(12, Math.round(curve));
}

function optionsFor(el) {
  const pill = el.parentElement && el.parentElement.id === "floating-rest-pill";
  return {
    material: pill || el.id === "day-tabs" ? "clear" : "regular",
    appearance: "light",
    radius: radiusFor(el),
    refraction: pill ? 48 : 60,
  };
}

function candidates() {
  const found = [];
  document.querySelectorAll(CHROME).forEach((el) => found.push(el));
  document.querySelectorAll(PANELS).forEach((el) => {
    if (found.some((parent) => parent !== el && parent.contains(el))) return;
    found.push(el);
  });
  return found.filter(shown);
}

function syncSurfaces() {
  if (!scene) return;
  const live = new Set(candidates());
  for (const [el, remove] of registered) {
    if (live.has(el)) continue;
    remove();
    el.classList.remove("glass-target");
    registered.delete(el);
  }
  for (const el of live) {
    if (registered.has(el)) continue;
    if (registered.size >= 64) {
      if (!warned) console.warn("Liquid glass surface limit reached");
      warned = true;
      break;
    }
    try {
      el.classList.add("glass-target");
      registered.set(el, scene.addSurface(el, optionsFor(el)));
    } catch (error) {
      el.classList.remove("glass-target");
      console.warn(error);
    }
  }
}

let frame = 0;
function scheduleSync() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    syncSurfaces();
  });
}

try {
  scene = createGlassScene(document.body, {
    maxSurfaces: 64,
    onDiagnostic(detail) {
      if (detail.error) console.warn(detail.error);
    },
  });
  scene.setContent(document.getElementById("lg-content"));
  new MutationObserver(scheduleSync).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  scheduleSync();
} catch (error) {
  console.warn("Liquid glass did not start", error);
}
