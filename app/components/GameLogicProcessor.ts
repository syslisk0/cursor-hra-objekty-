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
  SHIELD_SIZE,
  KNOCKBACK_FORCE,
  BOMB_EXPLOSION_RADIUS,
  TIME_SLOW_DURATION,
  TIME_SLOW_FACTOR
} from './constants';
import { createExplosion } from './gameLogic';

export function processGameLogic(
  mousePos: { x: number; y: number },
  objects: GameObject[],
  shields: Shield[],
  bombCollectibles: BombCollectible[],
  hourglassCollectibles: HourglassCollectible[],
  activeExplosions: ActiveExplosion[],
  pendingShieldSpawns: PendingShieldSpawn[],
  playerHasShield: boolean,
  currentSlowFactor: number,
  canvas: HTMLCanvasElement,
  now: number,
  setPlayerHasShield: (value: boolean) => void,
  setTimeSlowEffect: (value: TimeSlowEffect) => void,
  endGame: () => void
): {
  newShields: Shield[];
  removedShieldIds: string[];
  newExplosions: ActiveExplosion[];
  removedBombIds: string[];
  removedHourglassIds: string[];
  destroyedObjectCount: number;
  gameEnded: boolean;
} {
  const result = {
    newShields: [] as Shield[],
    removedShieldIds: [] as string[],
    newExplosions: [] as ActiveExplosion[],
    removedBombIds: [] as string[],
    removedHourglassIds: [] as string[],
    destroyedObjectCount: 0,
    gameEnded: false
  };

  // Process pending shield spawns
  pendingShieldSpawns.forEach(pss => {
    if (now >= pss.spawnTime) {
      result.newShields.push({
        id: 'shield-' + Date.now() + Math.random(),
        x: pss.x,
        y: pss.y,
        size: SHIELD_SIZE,
      });
    }
  });

  // Process shield pickups
  shields.forEach(shield => {
    const distPlayerShield = Math.sqrt(Math.pow(shield.x - mousePos.x, 2) + Math.pow(shield.y - mousePos.y, 2));
    if (distPlayerShield < shield.size + PLAYER_RADIUS) {
      setPlayerHasShield(true);
      result.removedShieldIds.push(shield.id);
    }
  });

  // Process bomb interactions
  bombCollectibles.forEach(bomb => {
    const distPlayerBomb = Math.sqrt(Math.pow(bomb.x - mousePos.x, 2) + Math.pow(bomb.y - mousePos.y, 2));
    if (distPlayerBomb < bomb.size + PLAYER_RADIUS) {
      result.newExplosions.push(createExplosion(bomb.x, bomb.y));
      const initialObjectCount = objects.length;
      const destroyedCount = objects.filter(obj => {
        const distToExplosion = Math.sqrt(Math.pow(obj.x - bomb.x, 2) + Math.pow(obj.y - bomb.y, 2));
        return distToExplosion < BOMB_EXPLOSION_RADIUS;
      }).length;
      result.destroyedObjectCount = destroyedCount;
      result.removedBombIds.push(bomb.id);
    }
  });

  // Process hourglass interactions
  hourglassCollectibles.forEach(hourglass => {
    const distPlayerHourglass = Math.sqrt(Math.pow(hourglass.x - mousePos.x, 2) + Math.pow(hourglass.y - mousePos.y, 2));
    if (distPlayerHourglass < hourglass.size + PLAYER_RADIUS) {
      setTimeSlowEffect({
        isActive: true,
        startTime: Date.now(),
        duration: TIME_SLOW_DURATION,
        slowFactor: TIME_SLOW_FACTOR
      });
      result.removedHourglassIds.push(hourglass.id);
    }
  });

  // Process object movement and collisions
  objects.forEach(obj => {
    // Yellow object collision avoidance
    if (obj.type === 'yellow') {
      objects.forEach(otherObj => {
        if (otherObj.type === 'yellow' && obj.id !== otherObj.id) {
          const distVec = { x: otherObj.x - obj.x, y: otherObj.y - obj.y };
          const distance = Math.sqrt(distVec.x * distVec.x + distVec.y * distVec.y);
          const minDistance = obj.size + otherObj.size;
          if (distance < minDistance && distance !== 0) {
            const overlap = minDistance - distance;
            const pushX = (distVec.x / distance) * overlap * 0.5;
            const pushY = (distVec.y / distance) * overlap * 0.5;
            obj.x -= pushX; obj.y -= pushY;
            otherObj.x += pushX; otherObj.y += pushY;
          }
        }
      });
    }

    // Object movement
    if (obj.type === 'yellow') {
      const dirX = mousePos.x - obj.x;
      const dirY = mousePos.y - obj.y;
      const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
      if (magnitude > 0) { obj.dx = (dirX / magnitude); obj.dy = (dirY / magnitude); }
      obj.x += obj.dx * obj.speed * currentSlowFactor;
      obj.y += obj.dy * obj.speed * currentSlowFactor;
    } else {
      obj.x += obj.dx * obj.speed * currentSlowFactor;
      obj.y += obj.dy * obj.speed * currentSlowFactor;
      if (obj.x - obj.size < 0 || obj.x + obj.size > canvas.width) {
        obj.dx = -obj.dx;
        obj.x = Math.max(obj.size, Math.min(obj.x, canvas.width - obj.size));
      }
      if (obj.y - obj.size < 0 || obj.y + obj.size > canvas.height) {
        obj.dy = -obj.dy;
        obj.y = Math.max(obj.size, Math.min(obj.y, canvas.height - obj.size));
      }
    }

    // Player collision
    const distancePlayer = Math.sqrt(Math.pow(obj.x - mousePos.x, 2) + Math.pow(obj.y - mousePos.y, 2));
    if (distancePlayer < obj.size + PLAYER_RADIUS) {
      if (playerHasShield) {
        setPlayerHasShield(false);
        objects.forEach(o => {
          const knockbackDirX = o.x - mousePos.x;
          const knockbackDirY = o.y - mousePos.y;
          const magnitude = Math.sqrt(knockbackDirX * knockbackDirX + knockbackDirY * knockbackDirY);
          if (magnitude > 0) {
            o.dx = (knockbackDirX / magnitude);
            o.dy = (knockbackDirY / magnitude);
            o.x += o.dx * KNOCKBACK_FORCE;
            o.y += o.dy * KNOCKBACK_FORCE;
          }
        });
      } else {
        result.gameEnded = true;
        endGame();
      }
    }
  });

  return result;
}


