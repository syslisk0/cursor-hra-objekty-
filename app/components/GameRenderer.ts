import {
  GameObject,
  PendingSpawn,
  PendingShieldSpawn,
  Shield,
  BombCollectible,
  ActiveExplosion,
  HourglassCollectible,
  TimeSlowEffect
} from './types';
import {
  PLAYER_RADIUS,
  SPAWN_WARNING_PULSE_SPEED,
  SPAWN_WARNING_MIN_RADIUS,
  SPAWN_WARNING_MAX_RADIUS,
  SHIELD_SIZE,
  SHIELD_PICKUP_COLOR,
  SHIELD_SPAWN_WARNING_PULSE_SPEED,
  SHIELD_SPAWN_WARNING_MIN_RADIUS,
  SHIELD_SPAWN_WARNING_MAX_RADIUS,
  BOMB_COLLECTIBLE_COLOR,
  BOMB_EXPLOSION_RADIUS,
  HOURGLASS_COLLECTIBLE_COLOR,
  HOURGLASS_COLLECTIBLE_SIZE,
  PLAYER_WITH_SHIELD_COLOR,
  PLAYER_DEFAULT_COLOR,
  KNOCKBACK_FORCE
} from './constants';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mousePos: { x: number; y: number },
  playerHasShield: boolean,
  pendingShieldSpawns: PendingShieldSpawn[],
  shields: Shield[],
  bombCollectibles: BombCollectible[],
  hourglassCollectibles: HourglassCollectible[],
  activeExplosions: ActiveExplosion[],
  pendingSpawns: PendingSpawn[],
  objects: GameObject[],
  timeSlowEffect: TimeSlowEffect,
  setPlayerHasShield: (value: boolean) => void,
  setTimeSlowEffect: (value: TimeSlowEffect) => void,
  endGame: () => void,
  currentSlowFactor: number,
  now: number
): { redCount: number; yellowCount: number; objectsToRemove: string[] } {
  // Clear screen and draw player
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = playerHasShield ? PLAYER_WITH_SHIELD_COLOR : PLAYER_DEFAULT_COLOR;
  ctx.beginPath();
  ctx.arc(mousePos.x, mousePos.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Render pending shield spawns
  pendingShieldSpawns.forEach(pss => {
    ctx.beginPath();
    ctx.arc(pss.x, pss.y, pss.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = pss.color;
    ctx.fill();
    pss.currentRadius += pss.pulseDirection * SHIELD_SPAWN_WARNING_PULSE_SPEED;
    if (pss.currentRadius <= SHIELD_SPAWN_WARNING_MIN_RADIUS || pss.currentRadius >= SHIELD_SPAWN_WARNING_MAX_RADIUS) {
      pss.pulseDirection *= -1;
      pss.currentRadius = Math.max(SHIELD_SPAWN_WARNING_MIN_RADIUS, Math.min(pss.currentRadius, SHIELD_SPAWN_WARNING_MAX_RADIUS));
    }
  });

  // Render shields
  shields.forEach(shield => {
    const sX = shield.x;
    const sY = shield.y;
    const sSize = shield.size;
    ctx.beginPath();
    ctx.moveTo(sX, sY - sSize);
    ctx.quadraticCurveTo(sX - sSize * 0.8, sY - sSize * 0.7, sX - sSize * 0.8, sY);
    ctx.quadraticCurveTo(sX - sSize * 0.8, sY + sSize * 0.7, sX, sY + sSize);
    ctx.quadraticCurveTo(sX + sSize * 0.8, sY + sSize * 0.7, sX + sSize * 0.8, sY);
    ctx.quadraticCurveTo(sX + sSize * 0.8, sY - sSize * 0.7, sX, sY - sSize);
    ctx.closePath();
    ctx.fillStyle = '#CCCCCC'; ctx.fill();
    ctx.strokeStyle = '#555555'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = SHIELD_PICKUP_COLOR;
    ctx.fillRect(sX - sSize * 0.15, sY - sSize * 0.8, sSize * 0.3, sSize * 1.6);
  });

  // Render bombs
  bombCollectibles.forEach(bomb => {
    ctx.fillStyle = BOMB_COLLECTIBLE_COLOR;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, bomb.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Render hourglass
  hourglassCollectibles.forEach(hourglass => {
    ctx.fillStyle = HOURGLASS_COLLECTIBLE_COLOR;
    const hx = hourglass.x;
    const hy = hourglass.y;
    const hs = hourglass.size;
    
    // Vrchní část přesýpacích hodin
    ctx.beginPath();
    ctx.moveTo(hx - hs * 0.6, hy - hs);
    ctx.lineTo(hx + hs * 0.6, hy - hs);
    ctx.lineTo(hx + hs * 0.2, hy - hs * 0.3);
    ctx.lineTo(hx - hs * 0.2, hy - hs * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Dolní část přesýpacích hodin
    ctx.beginPath();
    ctx.moveTo(hx - hs * 0.6, hy + hs);
    ctx.lineTo(hx + hs * 0.6, hy + hs);
    ctx.lineTo(hx + hs * 0.2, hy + hs * 0.3);
    ctx.lineTo(hx - hs * 0.2, hy + hs * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Střední část (úzké hrdlo)
    ctx.fillRect(hx - hs * 0.1, hy - hs * 0.3, hs * 0.2, hs * 0.6);
  });

  // Render explosions
  activeExplosions.forEach(exp => {
    const elapsedTime = now - exp.startTime;
    exp.currentRadius = (elapsedTime / exp.duration) * exp.maxRadius;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = exp.color;
    ctx.fill();
  });

  // Render pending spawns
  pendingSpawns.forEach(ps => {
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = ps.color;
    ctx.fill();
    ps.currentRadius += ps.pulseDirection * SPAWN_WARNING_PULSE_SPEED;
    if (ps.currentRadius <= SPAWN_WARNING_MIN_RADIUS || ps.currentRadius >= SPAWN_WARNING_MAX_RADIUS) {
      ps.pulseDirection *= -1;
      ps.currentRadius = Math.max(SPAWN_WARNING_MIN_RADIUS, Math.min(ps.currentRadius, SPAWN_WARNING_MAX_RADIUS));
    }
  });

  // Count and render objects
  let currentRedCount = 0;
  let currentYellowCount = 0;
  const objectsToRemove: string[] = [];

  objects.forEach(obj => {
    if (obj.type === 'red') currentRedCount++;
    else if (obj.type === 'yellow') currentYellowCount++;
    
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
    ctx.fill();
  });

  return { redCount: currentRedCount, yellowCount: currentYellowCount, objectsToRemove };
}


