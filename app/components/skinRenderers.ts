export const WATERMELON_SEED = 13371337;

function createLCG(seed: number) {
  let s = seed >>> 0;
  return () => {
    // Numerical Recipes LCG
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function drawWatermelon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  seed: number = WATERMELON_SEED
) {
  const rand = createLCG(seed);
  // outer rind base with radial gradient
  const rindGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
  rindGrad.addColorStop(0, '#3DDB84');
  rindGrad.addColorStop(0.6, '#2ECC71');
  rindGrad.addColorStop(1, '#1E8449');
  ctx.fillStyle = rindGrad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // darker organic stripes on rind
  ctx.save();
  ctx.strokeStyle = 'rgba(0,80,0,0.45)';
  for (let i = 0; i < 9; i++) {
    const width = Math.max(1, r * (0.06 + (i % 2) * 0.03));
    ctx.lineWidth = width;
    const ang = (i / 9) * Math.PI * 2 + 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, ang - 0.18, ang + 0.18);
    ctx.stroke();
  }
  ctx.restore();

  // white pith ring
  ctx.fillStyle = '#F7F9F9';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2); ctx.fill();

  // inner flesh (slight gradient)
  const fleshGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r * 0.82);
  fleshGrad.addColorStop(0, '#FF758C');
  fleshGrad.addColorStop(1, '#FF5E7A');
  ctx.fillStyle = fleshGrad;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill();

  // seeds randomized but deterministic within flesh only
  const count = 16;
  for (let i = 0; i < count; i++) {
    const minRad = 0.12; // off center
    const maxRad = 0.8 - 0.08; // inside flesh boundary with margin
    const radial = minRad + rand() * (maxRad - minRad);
    const angle = rand() * Math.PI * 2;
    const rot = rand() * Math.PI * 2;
    const dist = r * radial;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const sw = Math.max(2, r * 0.11);
    const sh = Math.max(2, r * 0.2);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.5, sh * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(-sw * 0.15, -sh * 0.15, sw * 0.12, sh * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // soft glossy highlight on top-left
  const gloss = ctx.createRadialGradient(cx - r * 0.5, cy - r * 0.6, 0, cx - r * 0.5, cy - r * 0.6, r);
  gloss.addColorStop(0, 'rgba(255,255,255,0.25)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}


