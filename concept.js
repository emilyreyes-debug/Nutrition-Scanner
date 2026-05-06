// Replaces the static concept image with an interactive, canvas-based concept graph.
// No external dependencies.

const palette = {
  bg: "rgba(255,255,255,0)",
  node: "rgba(210, 190, 160, 0.92)",
  nodeStroke: "rgba(255,255,255,0.55)",
  text: "#0c3544",
  edge: "rgba(210, 0, 60, 0.35)",
  edgeStrong: "rgba(50, 89, 92, 0.35)",
  glow: "rgba(255, 255, 255, 0.35)",
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function setupConcept() {
  const wrap = document.getElementById("logo-image-wrap");
  if (!wrap) return;

  // If canvas already exists, do nothing.
  if (wrap.querySelector("canvas")) return;

  const oldImg = wrap.querySelector("img#concept-img");
  if (oldImg) oldImg.style.display = "none";

  const canvas = document.createElement("canvas");
  canvas.id = "concept-canvas";
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Interactive nutrition concept graph");

  // Make the canvas a fixed aspect ratio container so it looks consistent.
  canvas.style.aspectRatio = "16 / 9";

  wrap.innerHTML = "";
  wrap.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const nodes = [
    { id: "root", label: "Nutrition Scanner", group: "core", x: 0.5, y: 0.28, r: 46 },
    { id: "scan", label: "Your Data", group: "inputs", x: 0.18, y: 0.62, r: 34 },
    { id: "bmi", label: "BMI & Needs", group: "analysis", x: 0.38, y: 0.62, r: 34 },
    { id: "goal", label: "Goal", group: "analysis", x: 0.62, y: 0.62, r: 34 },
    { id: "plan", label: "Personal Plan", group: "output", x: 0.82, y: 0.62, r: 34 },
    { id: "tips", label: "Tips & Meals", group: "output", x: 0.50, y: 0.90, r: 34 },
  ];

  const edges = [
    ["root", "scan"],
    ["root", "bmi"],
    ["root", "goal"],
    ["scan", "plan"],
    ["bmi", "plan"],
    ["goal", "plan"],
    ["plan", "tips"],
  ];

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  let pointer = { x: 0, y: 0, down: false };
  let hoverId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(200, Math.floor(rect.height));

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Position nodes in pixel space
    for (const n of nodes) {
      n.px = n.x * w;
      n.py = n.y * h;
      n.rpx = n.r * (w / 900);
    }
  }

  function drawEdge(a, b, active) {
    ctx.beginPath();
    const midX = (a.px + b.px) / 2;

    // Slight curve
    const c1x = lerp(a.px, midX, 0.5);
    const c1y = lerp(a.py, b.py, 0.35) - 20;
    const c2x = lerp(midX, b.px, 0.5);
    const c2y = lerp(a.py, b.py, 0.65) - 20;

    ctx.moveTo(a.px, a.py);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, b.px, b.py);

    ctx.strokeStyle = active ? palette.edgeStrong : palette.edge;
    ctx.lineWidth = active ? 2.2 : 1.4;
    ctx.stroke();
  }

  function drawNode(n, active) {
    const glow = active ? 1 : 0.55;

    // Soft glow
    ctx.save();
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = active ? 22 : 12;
    ctx.beginPath();
    ctx.arc(n.px, n.py, n.rpx, 0, Math.PI * 2);
    ctx.fillStyle = palette.node;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.nodeStroke;
    ctx.stroke();
    ctx.restore();

    // Title text
    ctx.save();
    ctx.fillStyle = palette.text;
    ctx.font = `${clamp(n.rpx / 2.7, 12, 18)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = active ? 1 : 0.95;

    const words = n.label.split(" ");
    // Wrap to max 2 lines
    let line1 = words[0];
    let line2 = words.slice(1).join(" ");
    if (words.length > 3) {
      line1 = words.slice(0, 2).join(" ");
      line2 = words.slice(2).join(" ");
    }

    if (line2) {
      ctx.fillText(line1, n.px, n.py - 8 * glow);
      ctx.fillText(line2, n.px, n.py + 12 * glow);
    } else {
      ctx.fillText(line1, n.px, n.py);
    }
    ctx.restore();
  }

  function hitTest(x, y) {
    // x/y are canvas pixel coords in CSS pixels.
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (dist({ x, y }, n) <= n.rpx) return n.id;
    }
    return null;
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Back glow
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.35, Math.max(w, h));
    g.addColorStop(0, "rgba(255, 255, 255, 0.20)");
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Edges
    for (const [aId, bId] of edges) {
      const a = nodeById[aId];
      const b = nodeById[bId];
      const active = hoverId && (hoverId === aId || hoverId === bId);
      drawEdge(a, b, !!active);
    }

    // Nodes
    for (const n of nodes) {
      const active = hoverId === n.id;
      drawNode(n, active);
    }
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;

    hoverId = hitTest(pointer.x, pointer.y);

    // Small parallax / spring effect
    if (hoverId) {
      const target = nodeById[hoverId];
      for (const n of nodes) {
        const k = n.id === hoverId ? 1 : 0.35;
        n.px = lerp(n.px, n.x * rect.width + (pointer.x - rect.width / 2) * 0.03 * k, 0.08);
        n.py = lerp(n.py, n.y * rect.height + (pointer.y - rect.height / 2) * 0.03 * k, 0.08);
      }
    }

    render();
  }

  function onLeave() {
    hoverId = null;
    // reset positions
    const rect = canvas.getBoundingClientRect();
    for (const n of nodes) {
      n.px = n.x * rect.width;
      n.py = n.y * rect.height;
    }
    render();
  }

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  window.addEventListener("resize", () => {
    resize();
    render();
  });

  resize();
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupConcept);
} else {
  setupConcept();
}

