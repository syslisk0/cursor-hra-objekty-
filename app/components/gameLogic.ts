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

export function createNewGameObject(x: number, y: number, type: 'red' | 'yellow', speed: number, color: string): GameObject {
  const { dx, dy } = createRandomDirection();
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    x, y, dx: type === 'red' ? dx : 0, dy: type === 'red' ? dy : 0,
    speed, color, size: OBJECT_SIZE, type,
  };
}

export function addPendingSpawn(canvas: HTMLCanvasElement, currentScoreVal: number, pendingSpawns: PendingSpawn[]) {
  let type: 'red' | 'yellow' = 'red';
  let warningColor = 'rgba(255, 100, 100, 0.5)';
  if (currentScoreVal >= YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE && Math.random() < YELLOW_OBJECT_SPAWN_CHANCE) {
    type = 'yellow';
    warningColor = 'rgba(255, 255, 100, 0.5)';
  }
  const pendingX = Math.random() * (canvas.width - OBJECT_SIZE * 2) + OBJECT_SIZE;
  const pendingY = Math.random() * (canvas.height - OBJECT_SIZE * 2) + OBJECT_SIZE;
  pendingSpawns.push({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    x: pendingX, y: pendingY, spawnTime: Date.now() + SPAWN_WARNING_DURATION,
    type, color: warningColor, currentRadius: SPAWN_WARNING_MAX_RADIUS, pulseDirection: -1 
  });
}

export function addPendingShieldSpawn(canvas: HTMLCanvasElement, pendingShieldSpawns: PendingShieldSpawn[]) {
  const shieldX = Math.random() * (canvas.width - SHIELD_SIZE * 2) + SHIELD_SIZE;
  const shieldY = Math.random() * (canvas.height - SHIELD_SIZE * 2) + SHIELD_SIZE;
  pendingShieldSpawns.push({
    id: 'pending-shield-' + Date.now() + Math.random(),
    x: shieldX,
    y: shieldY,
    spawnTime: Date.now() + SHIELD_SPAWN_WARNING_DURATION,
    color: SHIELD_SPAWN_WARNING_COLOR,
    currentRadius: SHIELD_SPAWN_WARNING_MAX_RADIUS,
    pulseDirection: -1,
  });
}

export function addBombCollectible(canvas: HTMLCanvasElement, bombCollectibles: BombCollectible[]) {
  const bombX = Math.random() * (canvas.width - BOMB_COLLECTIBLE_SIZE * 2) + BOMB_COLLECTIBLE_SIZE;
  const bombY = Math.random() * (canvas.height - BOMB_COLLECTIBLE_SIZE * 2) + BOMB_COLLECTIBLE_SIZE;
  bombCollectibles.push({
    id: 'bomb-' + Date.now(),
    x: bombX,
    y: bombY,
    size: BOMB_COLLECTIBLE_SIZE,
  });
}

export function createExplosion(x: number, y: number): ActiveExplosion {
  return {
    id: 'explosion-' + Date.now(),
    x: x,
    y: y,
    startTime: Date.now(),
    currentRadius: 0,
    maxRadius: BOMB_EXPLOSION_RADIUS,
    duration: BOMB_EXPLOSION_DURATION,
    color: BOMB_EXPLOSION_COLOR,
  };
}

export function addHourglassCollectible(canvas: HTMLCanvasElement, hourglassCollectibles: HourglassCollectible[]) {
  const hourglassX = Math.random() * (canvas.width - HOURGLASS_COLLECTIBLE_SIZE * 2) + HOURGLASS_COLLECTIBLE_SIZE;
  const hourglassY = Math.random() * (canvas.height - HOURGLASS_COLLECTIBLE_SIZE * 2) + HOURGLASS_COLLECTIBLE_SIZE;
  hourglassCollectibles.push({
    id: 'hourglass-' + Date.now(),
    x: hourglassX,
    y: hourglassY,
    size: HOURGLASS_COLLECTIBLE_SIZE,
  });
}
