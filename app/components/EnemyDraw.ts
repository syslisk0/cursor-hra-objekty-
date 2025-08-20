import { GameObject } from './types';

function hashToUnit(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // Map to [0,1)
  return (h >>> 0) / 0xffffffff;
}

function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation: number
) {
  if (sides < 3) return;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number
) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = rotation + (i * Math.PI) / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawYellowWithEyes(
  ctx: CanvasRenderingContext2D,
  obj: GameObject,
  playerPos: { x: number; y: number }
) {
  const bodyRadius = obj.size;
  ctx.fillStyle = obj.color;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, bodyRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const eyeRadius = bodyRadius * 0.28;
  const eyeOffsetX = bodyRadius * 0.35;
  const eyeOffsetY = bodyRadius * -0.15;

  const leftEyeCenter = { x: obj.x - eyeOffsetX, y: obj.y + eyeOffsetY };
  const rightEyeCenter = { x: obj.x + eyeOffsetX, y: obj.y + eyeOffsetY };

  // Whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeCenter.x, leftEyeCenter.y, eyeRadius, 0, Math.PI * 2);
  ctx.arc(rightEyeCenter.x, rightEyeCenter.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupils looking towards player
  const drawPupil = (center: { x: number; y: number }) => {
    const dirX = playerPos.x - center.x;
    const dirY = playerPos.y - center.y;
    const mag = Math.hypot(dirX, dirY) || 1;
    const px = center.x + (dirX / mag) * eyeRadius * 0.45;
    const py = center.y + (dirY / mag) * eyeRadius * 0.45;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(px, py, eyeRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  };
  drawPupil(leftEyeCenter);
  drawPupil(rightEyeCenter);
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  obj: GameObject,
  playerPos: { x: number; y: number }
) {
  ctx.fillStyle = obj.color;

  if (obj.type === 'yellow') {
    drawYellowWithEyes(ctx, obj, playerPos);
    return;
  }

  // Red variants: diamond, triangle, hexagon
  const seed = hashToUnit(obj.id);
  const angle = Math.atan2(obj.dy, obj.dx);
  const radius = obj.size;

  if (seed < 1 / 3) {
    drawDiamond(ctx, obj.x, obj.y, radius, angle + Math.PI / 4);
  } else if (seed < 2 / 3) {
    drawRegularPolygon(ctx, obj.x, obj.y, radius, 3, angle - Math.PI / 2);
  } else {
    drawRegularPolygon(ctx, obj.x, obj.y, radius, 6, angle);
  }
}








