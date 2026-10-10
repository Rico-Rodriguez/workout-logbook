import { createGlassScene } from "https://esm.sh/@glass-sdk/liquid-glass@0.0.2/dom";

const CHROME = [
  ["#app-header", { material: "regular", appearance: "light", radius: 0, refraction: 18, tint: "#FAF7F2" }],
  ["#app-nav", { material: "regular", appearance: "light", radius: 0, refraction: 18, tint: "#FAF7F2" }],
];

function padForHeader() {
  const header = document.getElementById("app-header");
  const content = document.getElementById("lg-content");
  if (!header || !content) return;
  content.style.paddingTop = `${header.offsetHeight}px`;
}

try {
  const scene = createGlassScene(document.body, {
    maxSurfaces: 4,
    onDiagnostic(detail) {
      if (detail.error) console.warn(detail.error);
    },
  });
  const content = document.getElementById("lg-content");
  scene.setContent(content);
  padForHeader();
  const header = document.getElementById("app-header");
  if (header) new ResizeObserver(padForHeader).observe(header);
  for (const [selector, options] of CHROME) {
    const el = document.querySelector(selector);
    if (el) scene.addSurface(el, options);
  }
} catch (error) {
  console.warn("Liquid glass did not start", error);
}
