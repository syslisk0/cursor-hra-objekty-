export interface GameObject {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  color: string;
  size: number;
  type: 'red' | 'yellow';
  isBossProjectile?: boolean;
  bossProjectileKind?: 'wave' | 'charge';
  bouncesRemaining?: number;
}

export interface PendingSpawn {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
  type: 'red' | 'yellow';
  color: string;
  currentRadius: number;
  pulseDirection: number;
}

export interface PendingShieldSpawn {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
  color: string;
  currentRadius: number;
  pulseDirection: number;
}

export interface Shield {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface BombCollectible {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface HourglassCollectible {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface TimeSlowEffect {
  isActive: boolean;
  startTime: number;
  duration: number;
  slowFactor: number;
}

export interface ActiveExplosion {
  id: string;
  x: number;
  y: number;
  startTime: number;
  currentRadius: number;
  maxRadius: number;
  duration: number;
  color: string;
}

export type GameState = 'menu' | 'playing' | 'gameOver';
