'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameObject,
  PendingSpawn,
  PendingShieldSpawn,
  Shield,
  BombCollectible,
  ActiveExplosion,
  HourglassCollectible,
  TimeSlowEffect,
  GameState
} from './types';
import {
  PLAYER_RADIUS,
  OBJECT_SIZE,
  INITIAL_RED_OBJECT_SPEED,
  OBJECT_SPEED_ACCELERATION_SCORE_THRESHOLD,
  OBJECT_SPEED_ACCELERATION_FACTOR,
  SPAWN_WARNING_DURATION,
  SPAWN_WARNING_MIN_RADIUS,
  SPAWN_WARNING_MAX_RADIUS,
  SPAWN_WARNING_PULSE_SPEED,
  INITIAL_SCORE_INTERVAL,
  MIN_SCORE_INTERVAL,
  SCORE_ACCELERATION_TIME_THRESHOLD,
  SCORE_ACCELERATION_FACTOR,
  YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE,
  YELLOW_OBJECT_SPAWN_CHANCE,
  SHIELD_SIZE,
  SHIELD_PICKUP_COLOR,
  PLAYER_DEFAULT_COLOR,
  KNOCKBACK_FORCE,
  SHIELD_SPAWN_INTERVAL_SCORE,
  SHIELD_SPAWN_WARNING_DURATION,
  SHIELD_SPAWN_WARNING_MIN_RADIUS,
  SHIELD_SPAWN_WARNING_MAX_RADIUS,
  SHIELD_SPAWN_WARNING_PULSE_SPEED,
  SHIELD_SPAWN_WARNING_COLOR,
  BOMB_COLLECTIBLE_SIZE,
  BOMB_COLLECTIBLE_COLOR,
  BOMB_FIRST_SPAWN_SCORE,
  BOMB_SECOND_SPAWN_SCORE,
  BOMB_SUBSEQUENT_SPAWN_INTERVAL,
  BOMB_EXPLOSION_RADIUS,
  BOMB_EXPLOSION_DURATION,
  BOMB_EXPLOSION_COLOR,
  HOURGLASS_COLLECTIBLE_SIZE,
  HOURGLASS_COLLECTIBLE_COLOR,
  HOURGLASS_FIRST_SPAWN_SCORE,
  HOURGLASS_SECOND_SPAWN_SCORE,
  HOURGLASS_SUBSEQUENT_SPAWN_INTERVAL,
  TIME_SLOW_DURATION,
  TIME_SLOW_FACTOR,
  DAMAGE_SLOW_DURATION,
  DAMAGE_SLOW_FACTOR,
  DAMAGE_PULSE_MAX_ALPHA,
  DAMAGE_PULSE_MIN_ALPHA,
  DAMAGE_PULSE_FREQUENCY,
  ENEMY_SPAWN_SCORE_INTERVAL,
  HEART_SPAWN_CHANCE,
  BOMB_SPAWN_CHANCE,
  HOURGLASS_SPAWN_CHANCE
} from './constants';
import {
  createNewGameObject,
  addPendingSpawn,
  addPendingShieldSpawn,
  addBombCollectible,
  createExplosion,
  addHourglassCollectible
} from './gameLogic';

export interface UseGameReturn {
  gameState: GameState;
  startGame: () => void;
  backToMenu: () => void;
  score: number;
  displayedScoreSpeed: number;
  displayedRedObjectSpeed: number;
  displayedYellowObjectSpeed: number;
  redObjectCount: number;
  yellowObjectCount: number;
  hearts: number;
  timeSlowActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useGame(): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const objectsRef = useRef<GameObject[]>([]);
  const pendingSpawnsRef = useRef<PendingSpawn[]>([]);
  const pendingShieldSpawnsRef = useRef<PendingShieldSpawn[]>([]);
  const shieldsRef = useRef<Shield[]>([]);
  const bombCollectiblesRef = useRef<BombCollectible[]>([]);
  const hourglassCollectiblesRef = useRef<HourglassCollectible[]>([]);
  const activeExplosionsRef = useRef<ActiveExplosion[]>([]);
  const gameLoopRef = useRef<number | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Reusable audio for health loss (initialized on user gesture when starting the game)
  const healthLoseAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentScoreIntervalMsRef = useRef<number>(INITIAL_SCORE_INTERVAL);
  const gameTimeStartRef = useRef<number>(0);
  const lastScoreAccelerationTimeRef = useRef<number>(0);
  const currentRedObjectSpeedRef = useRef<number>(INITIAL_RED_OBJECT_SPEED);
  const lastObjectSpeedIncreaseScoreRef = useRef<number>(0);
  const objectSpeedIncreaseCountRef = useRef<number>(0);
  const lastEnemySpawnScoreRef = useRef<number>(-ENEMY_SPAWN_SCORE_INTERVAL);
  const lastShieldSpawnScoreRef = useRef<number>(0);
  const lastBombSpawnScoreRef = useRef<number>(0);
  const lastHourglassSpawnScoreRef = useRef<number>(0);
  const destroyedByBombCountRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [hearts, setHearts] = useState<number>(1);
  const invulnerableUntilRef = useRef<number>(0);
  
  const [displayedScoreSpeed, setDisplayedScoreSpeed] = useState(1000 / INITIAL_SCORE_INTERVAL);
  const [displayedRedObjectSpeed, setDisplayedRedObjectSpeed] = useState(INITIAL_RED_OBJECT_SPEED);
  const [displayedYellowObjectSpeed, setDisplayedYellowObjectSpeed] = useState(INITIAL_RED_OBJECT_SPEED / 2);
  const [redObjectCount, setRedObjectCount] = useState(0);
  const [yellowObjectCount, setYellowObjectCount] = useState(0);
  const [timeSlowEffect, setTimeSlowEffect] = useState<TimeSlowEffect>({
    isActive: false,
    startTime: 0,
    duration: TIME_SLOW_DURATION,
    slowFactor: TIME_SLOW_FACTOR
  });
  const [damageSlowEffect, setDamageSlowEffect] = useState<TimeSlowEffect>({
    isActive: false,
    startTime: 0,
    duration: DAMAGE_SLOW_DURATION,
    slowFactor: DAMAGE_SLOW_FACTOR
  });

  const resetGameValues = useCallback(() => {
    setScore(0);
    objectsRef.current = [];
    pendingSpawnsRef.current = [];
    shieldsRef.current = [];
    pendingShieldSpawnsRef.current = [];
    bombCollectiblesRef.current = [];
    hourglassCollectiblesRef.current = [];
    activeExplosionsRef.current = [];
    setHearts(1);
    invulnerableUntilRef.current = 0;
    currentScoreIntervalMsRef.current = INITIAL_SCORE_INTERVAL;
    currentRedObjectSpeedRef.current = INITIAL_RED_OBJECT_SPEED;
    gameTimeStartRef.current = Date.now();
    lastScoreAccelerationTimeRef.current = 0;
    lastObjectSpeedIncreaseScoreRef.current = 0;
    objectSpeedIncreaseCountRef.current = 0;
    lastEnemySpawnScoreRef.current = -ENEMY_SPAWN_SCORE_INTERVAL;
    lastShieldSpawnScoreRef.current = 0;
    lastBombSpawnScoreRef.current = 0;
    lastHourglassSpawnScoreRef.current = 0;
    destroyedByBombCountRef.current = 0;
    setDisplayedScoreSpeed(1000 / INITIAL_SCORE_INTERVAL);
    setDisplayedRedObjectSpeed(INITIAL_RED_OBJECT_SPEED);
    setDisplayedYellowObjectSpeed(INITIAL_RED_OBJECT_SPEED / 2);
    setRedObjectCount(0);
    setYellowObjectCount(0);
    setTimeSlowEffect({
      isActive: false,
      startTime: 0,
      duration: TIME_SLOW_DURATION,
      slowFactor: TIME_SLOW_FACTOR
    });
    setDamageSlowEffect({
      isActive: false,
      startTime: 0,
      duration: DAMAGE_SLOW_DURATION,
      slowFactor: DAMAGE_SLOW_FACTOR
    });
    if (canvasRef.current) {
      setMousePos({ x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 });
    } else {
      setMousePos({ x: 400, y: 300 });
    }
  }, []);

  const startGame = useCallback(() => {
    resetGameValues();
    setGameState('playing');
  }, [resetGameValues]);

  const backToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({ 
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      });
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    const ctx = canvas.getContext('2d')!;
    if (canvas.width !== 800) canvas.width = 800;
    if (canvas.height !== 600) canvas.height = 600;

    const gameLoop = () => {
      const now = Date.now();
      
      // Active slow effects
      let currentSlowFactor = 1;
      const factors: number[] = [1];
      if (timeSlowEffect.isActive) {
        const elapsed = now - timeSlowEffect.startTime;
        if (elapsed >= timeSlowEffect.duration) {
          setTimeSlowEffect(prev => ({ ...prev, isActive: false }));
        } else {
          factors.push(timeSlowEffect.slowFactor);
        }
      }
      if (damageSlowEffect.isActive) {
        const elapsed = now - damageSlowEffect.startTime;
        if (elapsed >= damageSlowEffect.duration) {
          setDamageSlowEffect(prev => ({ ...prev, isActive: false }));
        } else {
          factors.push(damageSlowEffect.slowFactor);
        }
      }
      currentSlowFactor = Math.min(...factors);
      
      // Background and player
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (damageSlowEffect.isActive) {
        const t = (now - damageSlowEffect.startTime) / 1000;
        const alpha = DAMAGE_PULSE_MIN_ALPHA + (DAMAGE_PULSE_MAX_ALPHA - DAMAGE_PULSE_MIN_ALPHA) * (0.5 * (1 + Math.sin(t * DAMAGE_PULSE_FREQUENCY)));
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.fillStyle = PLAYER_DEFAULT_COLOR;
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Pending heart spawns indicator
      pendingShieldSpawnsRef.current.forEach(pss => {
        pss.currentRadius += pss.pulseDirection * SHIELD_SPAWN_WARNING_PULSE_SPEED;
        if (pss.currentRadius <= SHIELD_SPAWN_WARNING_MIN_RADIUS || pss.currentRadius >= SHIELD_SPAWN_WARNING_MAX_RADIUS) {
          pss.pulseDirection *= -1;
          pss.currentRadius = Math.max(SHIELD_SPAWN_WARNING_MIN_RADIUS, Math.min(pss.currentRadius, SHIELD_SPAWN_WARNING_MAX_RADIUS));
        }
        const safeRadius = Math.max(0, pss.currentRadius);
        ctx.beginPath();
        ctx.arc(pss.x, pss.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = pss.color;
        ctx.fill();
      });

      // Spawn hearts (was shields)
      const newShieldsFromPending: Shield[] = [];
      pendingShieldSpawnsRef.current = pendingShieldSpawnsRef.current.filter(pss => {
        if (now >= pss.spawnTime) {
          newShieldsFromPending.push({ id: 'shield-' + Date.now() + Math.random(), x: pss.x, y: pss.y, size: SHIELD_SIZE });
          return false;
        }
        return true;
      });
      if (newShieldsFromPending.length > 0) shieldsRef.current.push(...newShieldsFromPending);

      // Render hearts and pickups
      shieldsRef.current.forEach(shield => {
        const sX = shield.x;
        const sY = shield.y;
        const sSize = shield.size;
        const cell = Math.max(2, Math.floor(sSize / 3));
        const pattern: number[][] = [
          [0,1,1,0,1,1,0],
          [1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1],
          [0,1,1,1,1,1,0],
          [0,0,1,1,1,0,0],
          [0,0,0,1,0,0,0],
        ];
        ctx.fillStyle = SHIELD_PICKUP_COLOR;
        const startX = sX - (pattern[0].length * cell) / 2;
        const startY = sY - (pattern.length * cell) / 2;
        for (let r = 0; r < pattern.length; r++) {
          for (let c = 0; c < pattern[r].length; c++) {
            if (pattern[r][c] === 1) ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell);
          }
        }
        const dist = Math.hypot(shield.x - mousePos.x, shield.y - mousePos.y);
        if (dist < shield.size + PLAYER_RADIUS) {
          setHearts(prev => prev + 1);
          shieldsRef.current = shieldsRef.current.filter(s => s.id !== shield.id);
        }
      });

      // Bombs
      bombCollectiblesRef.current.forEach(bomb => {
        ctx.fillStyle = BOMB_COLLECTIBLE_COLOR;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bomb.size, 0, Math.PI * 2);
        ctx.fill();
        const d = Math.hypot(bomb.x - mousePos.x, bomb.y - mousePos.y);
        if (d < bomb.size + PLAYER_RADIUS) {
          activeExplosionsRef.current.push(createExplosion(bomb.x, bomb.y));
          // Determine destroyed enemies and play death sound for each
          const toDestroy = objectsRef.current.filter(obj => Math.hypot(obj.x - bomb.x, obj.y - bomb.y) < BOMB_EXPLOSION_RADIUS);
          toDestroy.forEach(() => {
            try {
              const el = new Audio();
              const can = el.canPlayType ? el.canPlayType('audio/mpeg') : '';
              if (!can) return;
              el.src = '/sounds/enemydeath.mp3';
              void el.play();
            } catch {}
          });
          objectsRef.current = objectsRef.current.filter(obj => Math.hypot(obj.x - bomb.x, obj.y - bomb.y) >= BOMB_EXPLOSION_RADIUS);
          destroyedByBombCountRef.current += toDestroy.length;
          bombCollectiblesRef.current = bombCollectiblesRef.current.filter(b => b.id !== bomb.id);
        }
      });

      // Hourglass
      hourglassCollectiblesRef.current.forEach(hourglass => {
        ctx.fillStyle = HOURGLASS_COLLECTIBLE_COLOR;
        const hx = hourglass.x, hy = hourglass.y, hs = hourglass.size;
        ctx.beginPath(); ctx.moveTo(hx - hs * 0.6, hy - hs); ctx.lineTo(hx + hs * 0.6, hy - hs); ctx.lineTo(hx + hs * 0.2, hy - hs * 0.3); ctx.lineTo(hx - hs * 0.2, hy - hs * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - hs * 0.6, hy + hs); ctx.lineTo(hx + hs * 0.6, hy + hs); ctx.lineTo(hx + hs * 0.2, hy + hs * 0.3); ctx.lineTo(hx - hs * 0.2, hy + hs * 0.3); ctx.closePath(); ctx.fill();
        ctx.fillRect(hx - hs * 0.1, hy - hs * 0.3, hs * 0.2, hs * 0.6);
        const dist = Math.hypot(hourglass.x - mousePos.x, hourglass.y - mousePos.y);
        if (dist < hourglass.size + PLAYER_RADIUS) {
          setTimeSlowEffect({ isActive: true, startTime: Date.now(), duration: TIME_SLOW_DURATION, slowFactor: TIME_SLOW_FACTOR });
          hourglassCollectiblesRef.current = hourglassCollectiblesRef.current.filter(h => h.id !== hourglass.id);
        }
      });

      // Explosions
      activeExplosionsRef.current = activeExplosionsRef.current.filter(exp => {
        const elapsedTime = now - exp.startTime;
        if (elapsedTime >= exp.duration) return false;
        exp.currentRadius = (elapsedTime / exp.duration) * exp.maxRadius;
        const safeRadius = Math.max(0, exp.currentRadius);
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = exp.color;
        ctx.fill();
        return true;
      });

      // Pending spawns indicators
      pendingSpawnsRef.current.forEach(ps => {
        ps.currentRadius += ps.pulseDirection * SPAWN_WARNING_PULSE_SPEED;
        if (ps.currentRadius <= SPAWN_WARNING_MIN_RADIUS || ps.currentRadius >= SPAWN_WARNING_MAX_RADIUS) {
          ps.pulseDirection *= -1;
          ps.currentRadius = Math.max(SPAWN_WARNING_MIN_RADIUS, Math.min(ps.currentRadius, SPAWN_WARNING_MAX_RADIUS));
        }
        const safeRadius = Math.max(0, ps.currentRadius);
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = ps.color;
        ctx.fill();
      });

      // Spawn actual objects
      const newObjectsFromPending: GameObject[] = [];
      pendingSpawnsRef.current = pendingSpawnsRef.current.filter(ps => {
        if (now >= ps.spawnTime) {
          const speed = ps.type === 'red' ? currentRedObjectSpeedRef.current : currentRedObjectSpeedRef.current / 2;
          const color = ps.type === 'red' ? '#ff0000' : '#ffff00';
          newObjectsFromPending.push(createNewGameObject(ps.x, ps.y, ps.type, speed, color));
          return false;
        }
        return true;
      });
      if (newObjectsFromPending.length > 0) objectsRef.current.push(...newObjectsFromPending);

      // Avoid overlap of yellows
      for (let i = 0; i < objectsRef.current.length; i++) {
        if (objectsRef.current[i].type === 'yellow') {
          for (let j = i + 1; j < objectsRef.current.length; j++) {
            if (objectsRef.current[j].type === 'yellow') {
              const obj1 = objectsRef.current[i];
              const obj2 = objectsRef.current[j];
              const distVec = { x: obj2.x - obj1.x, y: obj2.y - obj1.y };
              const distance = Math.hypot(distVec.x, distVec.y);
              const minDistance = obj1.size + obj2.size;
              if (distance < minDistance && distance !== 0) {
                const overlap = minDistance - distance;
                const pushX = (distVec.x / distance) * overlap * 0.5;
                const pushY = (distVec.y / distance) * overlap * 0.5;
                obj1.x -= pushX; obj1.y -= pushY;
                obj2.x += pushX; obj2.y += pushY;
              }
            }
          }
        }
      }

      // Move objects and handle collisions
      let currentRedCount = 0;
      let currentYellowCount = 0;
      objectsRef.current = objectsRef.current.filter(obj => {
        if (obj.type === 'yellow') {
          const dirX = mousePos.x - obj.x;
          const dirY = mousePos.y - obj.y;
          const magnitude = Math.hypot(dirX, dirY);
          if (magnitude > 0) { obj.dx = (dirX / magnitude); obj.dy = (dirY / magnitude); }
          obj.x += obj.dx * obj.speed * currentSlowFactor;
          obj.y += obj.dy * obj.speed * currentSlowFactor;
        } else {
          obj.x += obj.dx * obj.speed * currentSlowFactor;
          obj.y += obj.dy * obj.speed * currentSlowFactor;
          if (obj.x - obj.size < 0 || obj.x + obj.size > canvas.width) { obj.dx = -obj.dx; obj.x = Math.max(obj.size, Math.min(obj.x, canvas.width - obj.size)); }
          if (obj.y - obj.size < 0 || obj.y + obj.size > canvas.height) { obj.dy = -obj.dy; obj.y = Math.max(obj.size, Math.min(obj.y, canvas.height - obj.size)); }
        }
        if (obj.type === 'red') currentRedCount++; else if (obj.type === 'yellow') currentYellowCount++;
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
        const distancePlayer = Math.hypot(obj.x - mousePos.x, obj.y - mousePos.y);
        if (distancePlayer < obj.size + PLAYER_RADIUS) {
          if (Date.now() < invulnerableUntilRef.current) {
            return true;
          }
          if (hearts > 0) {
            const willBe = Math.max(0, hearts - 1);
            setHearts(prev => Math.max(0, prev - 1));
            // Only play sound on non-lethal hit
            if (willBe > 0) {
            try {
              const a = healthLoseAudioRef.current;
              if (a) { a.currentTime = 0; a.play(); }
              else {
                const el = new Audio();
                const can = el.canPlayType ? el.canPlayType('audio/mpeg') : '';
                if (!can) { /* unsupported codec */ }
                else { el.src = '/sounds/11L-health_lose_sound_ef-1755881941542.mp3'; void el.play(); }
              }
            } catch {}
          }
          setDamageSlowEffect({ isActive: true, startTime: Date.now(), duration: DAMAGE_SLOW_DURATION, slowFactor: DAMAGE_SLOW_FACTOR });
          invulnerableUntilRef.current = Date.now() + DAMAGE_SLOW_DURATION;
          objectsRef.current.forEach(o => {
              const kx = o.x - mousePos.x; const ky = o.y - mousePos.y; const mag = Math.hypot(kx, ky);
              if (mag > 0) { o.dx = (kx / mag); o.dy = (ky / mag); o.x += o.dx * KNOCKBACK_FORCE; o.y += o.dy * KNOCKBACK_FORCE; }
            });
            return true;
          } else {
            setGameState('gameOver');
            return false;
          }
        }
        return true;
      });
      setRedObjectCount(currentRedCount);
      setYellowObjectCount(currentYellowCount);

      if (gameState === 'playing') gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing' && !gameLoopRef.current) gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => { if (gameLoopRef.current) { cancelAnimationFrame(gameLoopRef.current); gameLoopRef.current = null; } };
  }, [gameState, mousePos, timeSlowEffect, damageSlowEffect, hearts]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      scoreIntervalRef.current = null;
      return;
    }
    const canvas = canvasRef.current; if (!canvas) return;

    const setupScoreInterval = () => {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      scoreIntervalRef.current = setInterval(() => {
        setScore(prev => prev + 1);
        const elapsedTime = Date.now() - gameTimeStartRef.current;
        if (elapsedTime - lastScoreAccelerationTimeRef.current >= SCORE_ACCELERATION_TIME_THRESHOLD) {
          const newInterval = Math.max(MIN_SCORE_INTERVAL, currentScoreIntervalMsRef.current * SCORE_ACCELERATION_FACTOR);
          if (newInterval !== currentScoreIntervalMsRef.current) {
            currentScoreIntervalMsRef.current = newInterval;
            setDisplayedScoreSpeed(1000 / newInterval);
            setupScoreInterval();
          }
          lastScoreAccelerationTimeRef.current = elapsedTime;
        }
      }, currentScoreIntervalMsRef.current);
    };

    setupScoreInterval();

    if (score - lastObjectSpeedIncreaseScoreRef.current >= OBJECT_SPEED_ACCELERATION_SCORE_THRESHOLD) {
      // Decaying acceleration: halve extra every 3 thresholds (n = number of past increases)
      // stepFactor = 1 + baseExtra / 2^{floor(n/3)}
      const baseExtra = OBJECT_SPEED_ACCELERATION_FACTOR - 1;
      const n = objectSpeedIncreaseCountRef.current;
      const stepFactor = 1 + baseExtra / Math.pow(2, Math.floor(n / 3));
      currentRedObjectSpeedRef.current *= stepFactor;
      const newYellowSpeed = currentRedObjectSpeedRef.current / 2;
      setDisplayedRedObjectSpeed(currentRedObjectSpeedRef.current);
      setDisplayedYellowObjectSpeed(newYellowSpeed);
      objectsRef.current.forEach(obj => { if (obj.type === 'red') obj.speed = currentRedObjectSpeedRef.current; else if (obj.type === 'yellow') obj.speed = newYellowSpeed; });
      lastObjectSpeedIncreaseScoreRef.current = score;
      objectSpeedIncreaseCountRef.current += 1;
    }

    // Initial spawn at score 0 if nothing pending/alive
    if (score === 0 && objectsRef.current.length === 0 && pendingSpawnsRef.current.length === 0) {
      addPendingSpawn(canvas, score, pendingSpawnsRef.current);
      lastEnemySpawnScoreRef.current = 0;
    }

    // Spawn exactly one enemy every ENEMY_SPAWN_SCORE_INTERVAL score (no replacement when killed)
    if (score > 0 && score % ENEMY_SPAWN_SCORE_INTERVAL === 0 && score !== lastEnemySpawnScoreRef.current) {
      addPendingSpawn(canvas, score, pendingSpawnsRef.current);
      lastEnemySpawnScoreRef.current = score;
    }

    // Hearts spawn (same cadence as shields)
    if (score > 0 && score % SHIELD_SPAWN_INTERVAL_SCORE === 0 && score !== lastShieldSpawnScoreRef.current && shieldsRef.current.length === 0 && pendingShieldSpawnsRef.current.length === 0) {
      if (Math.random() < HEART_SPAWN_CHANCE) {
        addPendingShieldSpawn(canvas, pendingShieldSpawnsRef.current);
        lastShieldSpawnScoreRef.current = score;
      } else {
        // Even if chance fails, ensure we don't repeatedly roll at the same score
        lastShieldSpawnScoreRef.current = score;
      }
    }

    // Bombs spawning
    const canSpawnBombConditions = bombCollectiblesRef.current.length === 0 && score !== lastBombSpawnScoreRef.current && score > 0;
    let shouldSpawnThisBomb = false;
    if (score === BOMB_FIRST_SPAWN_SCORE) shouldSpawnThisBomb = true;
    else if (score === BOMB_SECOND_SPAWN_SCORE) shouldSpawnThisBomb = true;
    else if (score > BOMB_SECOND_SPAWN_SCORE && (score - BOMB_SECOND_SPAWN_SCORE) % BOMB_SUBSEQUENT_SPAWN_INTERVAL === 0) shouldSpawnThisBomb = true;
    if (canSpawnBombConditions && shouldSpawnThisBomb) {
      if (Math.random() < BOMB_SPAWN_CHANCE) {
        addBombCollectible(canvas, bombCollectiblesRef.current);
      }
      // record attempt so we don't retry this exact score
      lastBombSpawnScoreRef.current = score;
    }

    // Hourglass spawning
    const canSpawnHourglassConditions = hourglassCollectiblesRef.current.length === 0 && score !== lastHourglassSpawnScoreRef.current && score > 0;
    let shouldSpawnThisHourglass = false;
    if (score === HOURGLASS_FIRST_SPAWN_SCORE) shouldSpawnThisHourglass = true;
    else if (score === HOURGLASS_SECOND_SPAWN_SCORE) shouldSpawnThisHourglass = true;
    else if (score > HOURGLASS_SECOND_SPAWN_SCORE && (score - HOURGLASS_SECOND_SPAWN_SCORE) % HOURGLASS_SUBSEQUENT_SPAWN_INTERVAL === 0) shouldSpawnThisHourglass = true;
    if (canSpawnHourglassConditions && shouldSpawnThisHourglass) {
      if (Math.random() < HOURGLASS_SPAWN_CHANCE) {
        addHourglassCollectible(canvas, hourglassCollectiblesRef.current);
      }
      // record attempt so we don't retry this exact score
      lastHourglassSpawnScoreRef.current = score;
    }
    
    return () => { if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current); scoreIntervalRef.current = null; };
  }, [gameState, score, addPendingSpawn]);

  return {
    gameState,
    startGame: () => {
      resetGameValues();
      // Initialize and unlock audio on user gesture
      if (!healthLoseAudioRef.current) {
        try {
          const a = new Audio();
          const can = a.canPlayType ? a.canPlayType('audio/mpeg') : '';
          if (can) {
            a.src = '/sounds/11L-health_lose_sound_ef-1755881941542.mp3';
            a.preload = 'auto';
            a.volume = 1.0;
            healthLoseAudioRef.current = a;
            // Attempt to unlock by playing and pausing immediately
            a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
          }
        } catch {}
      }
      setGameState('playing');
    },
    backToMenu: () => setGameState('menu'),
    score,
    displayedScoreSpeed,
    displayedRedObjectSpeed,
    displayedYellowObjectSpeed,
    redObjectCount,
    yellowObjectCount,
    hearts,
    timeSlowActive: timeSlowEffect.isActive,
    canvasRef
  };
}


