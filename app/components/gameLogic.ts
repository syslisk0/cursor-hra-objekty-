import {
  GameObject,
  PendingSpawn,
  PendingShieldSpawn,
  Shield,
  BombCollectible,
  ActiveExplosion,
  HourglassCollectible
} from './types';
import {
  PLAYER_RADIUS,
  OBJECT_SIZE,
  SPAWN_WARNING_DURATION,
  SPAWN_WARNING_MIN_RADIUS,
  SPAWN_WARNING_MAX_RADIUS,
  YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE,
  YELLOW_OBJECT_SPAWN_CHANCE,
  SHIELD_SIZE,
  SHIELD_PICKUP_COLOR,
  SHIELD_SPAWN_WARNING_DURATION,
  SHIELD_SPAWN_WARNING_COLOR,
  SHIELD_SPAWN_WARNING_MAX_RADIUS,
  BOMB_COLLECTIBLE_SIZE,
  BOMB_COLLECTIBLE_COLOR,
  BOMB_EXPLOSION_RADIUS,
  BOMB_EXPLOSION_DURATION,
  BOMB_EXPLOSION_COLOR,
  HOURGLASS_COLLECTIBLE_SIZE
} from './constants';

export function createRandomDirection() {
  const angle = Math.random() * Math.PI * 2;
  return { dx: Math.cos(angle), dy: Math.sin(angle) };
}

export function createNewGameObject(x: number, y: number, type: 'red' | 'yellow', speed: number, color: string, scale: number = 1): GameObject {
  const { dx, dy } = createRandomDirection();
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    x, y, dx: type === 'red' ? dx : 0, dy: type === 'red' ? dy : 0,
    speed, color, size: OBJECT_SIZE * scale, type,
  };
}

export function addPendingSpawn(canvas: HTMLCanvasElement, currentScoreVal: number, pendingSpawns: PendingSpawn[], scale: number = 1) {
  let type: 'red' | 'yellow' = 'red';
  let warningColor = 'rgba(255, 100, 100, 0.5)';
  if (currentScoreVal >= YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE && Math.random() < YELLOW_OBJECT_SPAWN_CHANCE) {
    type = 'yellow';
    warningColor = 'rgba(255, 255, 100, 0.5)';
  }
  const margin = OBJECT_SIZE * scale;
  const pendingX = Math.random() * (canvas.width - margin * 2) + margin;
  const pendingY = Math.random() * (canvas.height - margin * 2) + margin;
  pendingSpawns.push({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    x: pendingX, y: pendingY, spawnTime: Date.now() + SPAWN_WARNING_DURATION,
    type, color: warningColor, currentRadius: SPAWN_WARNING_MAX_RADIUS * scale, pulseDirection: -1 
  });
}

export function addPendingShieldSpawn(canvas: HTMLCanvasElement, pendingShieldSpawns: PendingShieldSpawn[], scale: number = 1) {
  const margin = SHIELD_SIZE * scale;
  const shieldX = Math.random() * (canvas.width - margin * 2) + margin;
  const shieldY = Math.random() * (canvas.height - margin * 2) + margin;
  pendingShieldSpawns.push({
    id: 'pending-shield-' + Date.now() + Math.random(),
    x: shieldX,
    y: shieldY,
    spawnTime: Date.now() + SHIELD_SPAWN_WARNING_DURATION,
    color: SHIELD_SPAWN_WARNING_COLOR,
    currentRadius: SHIELD_SPAWN_WARNING_MAX_RADIUS * scale,
    pulseDirection: -1,
  });
}

export function addBombCollectible(canvas: HTMLCanvasElement, bombCollectibles: BombCollectible[], scale: number = 1) {
  const size = BOMB_COLLECTIBLE_SIZE * scale;
  const bombX = Math.random() * (canvas.width - size * 2) + size;
  const bombY = Math.random() * (canvas.height - size * 2) + size;
  bombCollectibles.push({
    id: 'bomb-' + Date.now(),
    x: bombX,
    y: bombY,
    size,
  });
}

export function createExplosion(x: number, y: number, scale: number = 1): ActiveExplosion {
  return {
    id: 'explosion-' + Date.now(),
    x: x,
    y: y,
    startTime: Date.now(),
    currentRadius: 0,
    maxRadius: BOMB_EXPLOSION_RADIUS * scale,
    duration: BOMB_EXPLOSION_DURATION,
    color: BOMB_EXPLOSION_COLOR,
  };
}

export function addHourglassCollectible(canvas: HTMLCanvasElement, hourglassCollectibles: HourglassCollectible[], scale: number = 1) {
  const size = HOURGLASS_COLLECTIBLE_SIZE * scale;
  const hourglassX = Math.random() * (canvas.width - size * 2) + size;
  const hourglassY = Math.random() * (canvas.height - size * 2) + size;
  hourglassCollectibles.push({
    id: 'hourglass-' + Date.now(),
    x: hourglassX,
    y: hourglassY,
    size,
  });
}
