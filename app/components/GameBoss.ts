'use client';

import { GameObject } from './types';

export type BossPhase =
  | 'idle'
  | 'intro'
  | 'wave_attacks'
  | 'charge_attacks'
  | 'final_burst'
  | 'done';

export interface BossState {
  isActive: boolean;
  phase: BossPhase;
  startedAt: number;
  centerX: number;
  centerY: number;
  dx: number;
  dy: number;
  speed: number;
  // waves
  waveCount: number; // how many 16-projectile waves already performed
  waitingForProjectilesToDie: boolean;
  // charge
  chargeCount: number; // how many charges already performed
  chargeWaiting: boolean; // waiting for projectile to die and 1s confusion
  chargeActive: boolean; // is boss currently charging (moving)
  // control
  nextActionAt: number; // timestamp when next action can happen
  // visuals
  laughUntil: number;
}

export function createInitialBossState(): BossState {
  return {
    isActive: false,
    phase: 'idle',
    startedAt: 0,
    centerX: 0,
    centerY: 0,
    dx: 0,
    dy: 0,
    speed: 0,
    waveCount: 0,
    waitingForProjectilesToDie: false,
    chargeCount: 0,
    chargeWaiting: false,
    chargeActive: false,
    nextActionAt: 0,
    laughUntil: 0,
  };
}

export function startBoss(state: BossState, centerX: number, centerY: number, now: number) {
  state.isActive = true;
  state.phase = 'intro';
  state.centerX = centerX;
  state.centerY = centerY;
  state.startedAt = now;
  state.nextActionAt = now + 3000; // 3s intro pause
  state.laughUntil = 0; // will set when appearing
  state.waveCount = 0;
  state.chargeCount = 0;
  state.waitingForProjectilesToDie = false;
  state.chargeActive = false;
  state.chargeWaiting = false;
  state.dx = 0; state.dy = 0; state.speed = 0;
}

export function spawnRadialProjectiles(
  createObject: (x: number, y: number, dx: number, dy: number, speed: number, color: string) => GameObject,
  container: GameObject[],
  cx: number,
  cy: number,
  count: number,
  speed: number,
  color: string
) {
  // Slightly vary wave directions each time
  const baseOffset = (Math.random() * 2 - 1) * (Math.PI / 8); // up to ±22.5°
  for (let i = 0; i < count; i++) {
    const jitter = (Math.random() * 2 - 1) * (Math.PI / 24); // up to ±7.5° per projectile
    const angle = (i / count) * Math.PI * 2 + baseOffset + jitter;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const obj = createObject(cx, cy, dx, dy, speed, color);
    obj.isBossProjectile = true;
    obj.bossProjectileKind = 'wave';
    container.push(obj);
  }
}

export function updateBoss(
  state: BossState,
  now: number,
  objects: GameObject[],
  createObject: (x: number, y: number, dx: number, dy: number, speed: number, color: string) => GameObject,
  playerPos: { x: number; y: number },
  canvas: HTMLCanvasElement
): BossPhase {
  if (!state.isActive) return 'idle';
  switch (state.phase) {
    case 'intro': {
      if (now >= state.nextActionAt) {
        state.phase = 'wave_attacks';
        state.laughUntil = now + 1500; // laugh after appearing
        state.nextActionAt = 0;
      }
      return state.phase;
    }
    case 'wave_attacks': {
      // if not waiting, spawn next wave of 16 projectiles at 5.23 speed
      const aliveBossProjectiles = objects.filter(o => o.isBossProjectile).length;
      if (!state.waitingForProjectilesToDie && state.waveCount < 3) {
        spawnRadialProjectiles(createObject, objects, state.centerX, state.centerY, 16, 5.23, '#ff0000');
        state.waitingForProjectilesToDie = true;
      } else if (state.waitingForProjectilesToDie && aliveBossProjectiles === 0) {
        state.waveCount += 1;
        state.waitingForProjectilesToDie = false;
      }
      if (state.waveCount >= 3) {
        state.phase = 'charge_attacks';
        state.nextActionAt = 0;
      }
      return state.phase;
    }
    case 'charge_attacks': {
      // boss charges itself towards player's last position with speed 7, direction fixed until wall
      if (state.chargeCount >= 4) {
        state.phase = 'final_burst';
        return state.phase;
      }
      if (state.chargeWaiting) {
        // confused pause after wall hit
        if (state.nextActionAt === 0) state.nextActionAt = now + 1000;
        if (now >= state.nextActionAt) {
          state.chargeWaiting = false;
          state.nextActionAt = 0;
        }
      } else if (!state.chargeActive) {
        // start a new charge
        const mag = Math.max(1e-6, Math.hypot(playerPos.x - state.centerX, playerPos.y - state.centerY));
        state.dx = (playerPos.x - state.centerX) / mag;
        state.dy = (playerPos.y - state.centerY) / mag;
        state.speed = 7;
        state.chargeActive = true;
      } else {
        // move boss forward smoothly (use fractional step)
        const step = 1; // smaller multipliers for smoother motion, actual render runs at ~60fps
        state.centerX += state.dx * state.speed * step;
        state.centerY += state.dy * state.speed * step;
        // wall collision -> clamp, stop, confusion 1s, increment count
        const r = 18; // boss radius must match renderer
        const hitWall = (state.centerX - r < 0) || (state.centerX + r > canvas.width) || (state.centerY - r < 0) || (state.centerY + r > canvas.height);
        if (hitWall) {
          state.centerX = Math.max(r, Math.min(state.centerX, canvas.width - r));
          state.centerY = Math.max(r, Math.min(state.centerY, canvas.height - r));
          state.chargeActive = false;
          state.chargeWaiting = true;
          state.nextActionAt = now + 1000;
          state.chargeCount += 1;
        }
      }
      return state.phase;
    }
    case 'final_burst': {
      const alive = objects.filter(o => o.isBossProjectile).length;
      if (alive === 0) {
        spawnRadialProjectiles(createObject, objects, state.centerX, state.centerY, 16, 5.23, '#ff0000');
        state.phase = 'done';
        state.nextActionAt = now + 3000; // 3s afterburst until normal resumes
      }
      return state.phase;
    }
    case 'done': {
      if (now >= state.nextActionAt) {
        state.isActive = false;
        state.phase = 'idle';
      }
      return state.phase;
    }
    default:
      return state.phase;
  }
}


