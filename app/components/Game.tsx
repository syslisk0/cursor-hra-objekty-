'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameMenu from './GameMenu';
import GameCanvas from './GameCanvas';
import GameOverScreen from './GameOverScreen';
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
  DAMAGE_PULSE_FREQUENCY
} from './constants';
import {
  createNewGameObject,
  addPendingSpawn,
  addPendingShieldSpawn,
  addBombCollectible,
  createExplosion,
  addHourglassCollectible
} from './gameLogic';

export default function Game() {
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
  
  const currentScoreIntervalMsRef = useRef<number>(INITIAL_SCORE_INTERVAL);
  const gameTimeStartRef = useRef<number>(0);
  const lastScoreAccelerationTimeRef = useRef<number>(0);
  const currentRedObjectSpeedRef = useRef<number>(INITIAL_RED_OBJECT_SPEED);
  const lastObjectSpeedIncreaseScoreRef = useRef<number>(0);
  const lastShieldSpawnScoreRef = useRef<number>(0);
  const lastBombSpawnScoreRef = useRef<number>(0);
  const lastHourglassSpawnScoreRef = useRef<number>(0);
  const destroyedByBombCountRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [hearts, setHearts] = useState<number>(0);
  
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
  const invulnerableUntilRef = useRef<number>(0);

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

  const endGame = useCallback(() => {
    setGameState('gameOver');
  }, []);

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
      
      // Check slow effects (hourglass + damage)
      let currentSlowFactor = 1;
      let sfCandidates: number[] = [1];
      if (timeSlowEffect.isActive) {
        const elapsedTime = now - timeSlowEffect.startTime;
        if (elapsedTime >= timeSlowEffect.duration) {
          setTimeSlowEffect(prev => ({ ...prev, isActive: false }));
        } else {
          sfCandidates.push(timeSlowEffect.slowFactor);
        }
      }
      if (damageSlowEffect.isActive) {
        const elapsedTime = now - damageSlowEffect.startTime;
        if (elapsedTime >= damageSlowEffect.duration) {
          setDamageSlowEffect(prev => ({ ...prev, isActive: false }));
        } else {
          sfCandidates.push(damageSlowEffect.slowFactor);
        }
      }
      currentSlowFactor = Math.min(...sfCandidates);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Damage pulsing overlay (background pulz)
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

      pendingShieldSpawnsRef.current.forEach(pss => {
        pss.currentRadius += pss.pulseDirection * SHIELD_SPAWN_WARNING_PULSE_SPEED;
        if (pss.currentRadius <= SHIELD_SPAWN_WARNING_MIN_RADIUS || pss.currentRadius >= SHIELD_SPAWN_WARNING_MAX_RADIUS) {
            pss.pulseDirection *= -1;
            pss.currentRadius = Math.max(SHIELD_SPAWN_WARNING_MIN_RADIUS, Math.min(pss.currentRadius, SHIELD_SPAWN_WARNING_MAX_RADIUS));
        }
        // Ensure radius is never negative
        const safeRadius = Math.max(0, pss.currentRadius);
        ctx.beginPath();
        ctx.arc(pss.x, pss.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = pss.color;
        ctx.fill();
      });

      const newShieldsFromPending: Shield[] = [];
      pendingShieldSpawnsRef.current = pendingShieldSpawnsRef.current.filter(pss => {
        if (now >= pss.spawnTime) {
          newShieldsFromPending.push({
            id: 'shield-' + Date.now() + Math.random(),
            x: pss.x,
            y: pss.y,
            size: SHIELD_SIZE,
          });
          return false;
        }
        return true;
      });
      if (newShieldsFromPending.length > 0) {
        shieldsRef.current.push(...newShieldsFromPending);
      }

      // Render and pickup hearts (formerly shields)
      shieldsRef.current.forEach(shield => {
        const sX = shield.x;
        const sY = shield.y;
        const sSize = shield.size;
        // Draw pixel heart (Minecraft-like)
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
            if (pattern[r][c] === 1) {
              ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell);
            }
          }
        }
        const distPlayerShield = Math.sqrt(Math.pow(shield.x - mousePos.x, 2) + Math.pow(shield.y - mousePos.y, 2));
        if (distPlayerShield < shield.size + PLAYER_RADIUS) {
          setHearts(prev => prev + 1);
          shieldsRef.current = shieldsRef.current.filter(s => s.id !== shield.id);
        }
      });

      bombCollectiblesRef.current.forEach(bomb => {
        ctx.fillStyle = BOMB_COLLECTIBLE_COLOR;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bomb.size, 0, Math.PI * 2);
        ctx.fill();
        const distPlayerBomb = Math.sqrt(Math.pow(bomb.x - mousePos.x, 2) + Math.pow(bomb.y - mousePos.y, 2));
        if (distPlayerBomb < bomb.size + PLAYER_RADIUS) {
          activeExplosionsRef.current.push(createExplosion(bomb.x, bomb.y));
          const initialObjectCount = objectsRef.current.length;
          objectsRef.current = objectsRef.current.filter(obj => {
            const distToExplosion = Math.sqrt(Math.pow(obj.x - bomb.x, 2) + Math.pow(obj.y - bomb.y, 2));
            return distToExplosion >= BOMB_EXPLOSION_RADIUS;
          });
          const destroyedCount = initialObjectCount - objectsRef.current.length;
          destroyedByBombCountRef.current += destroyedCount;
          bombCollectiblesRef.current = bombCollectiblesRef.current.filter(b => b.id !== bomb.id);
        }
      });

      // Hourglass rendering and pickup
      hourglassCollectiblesRef.current.forEach(hourglass => {
        // Vykreslení přesýpacích hodin
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
        
        const distPlayerHourglass = Math.sqrt(Math.pow(hourglass.x - mousePos.x, 2) + Math.pow(hourglass.y - mousePos.y, 2));
        if (distPlayerHourglass < hourglass.size + PLAYER_RADIUS) {
          // Aktivace time slow efektu
          setTimeSlowEffect({
            isActive: true,
            startTime: Date.now(),
            duration: TIME_SLOW_DURATION,
            slowFactor: TIME_SLOW_FACTOR
          });
          hourglassCollectiblesRef.current = hourglassCollectiblesRef.current.filter(h => h.id !== hourglass.id);
        }
      });

      activeExplosionsRef.current = activeExplosionsRef.current.filter(exp => {
        const elapsedTime = now - exp.startTime;
        if (elapsedTime >= exp.duration) return false;
        exp.currentRadius = (elapsedTime / exp.duration) * exp.maxRadius;
        // Ensure radius is never negative
        const safeRadius = Math.max(0, exp.currentRadius);
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = exp.color;
        ctx.fill();
        return true;
      });

      let currentRedCount = 0;
      let currentYellowCount = 0;
      pendingSpawnsRef.current.forEach(ps => {
        ps.currentRadius += ps.pulseDirection * SPAWN_WARNING_PULSE_SPEED;
        if (ps.currentRadius <= SPAWN_WARNING_MIN_RADIUS || ps.currentRadius >= SPAWN_WARNING_MAX_RADIUS) {
            ps.pulseDirection *= -1;
            ps.currentRadius = Math.max(SPAWN_WARNING_MIN_RADIUS, Math.min(ps.currentRadius, SPAWN_WARNING_MAX_RADIUS));
        }
        // Ensure radius is never negative
        const safeRadius = Math.max(0, ps.currentRadius);
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = ps.color;
        ctx.fill();
      });
      
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
      if(newObjectsFromPending.length > 0) {
        objectsRef.current.push(...newObjectsFromPending);
      }
      for (let i = 0; i < objectsRef.current.length; i++) {
        if (objectsRef.current[i].type === 'yellow') {
          for (let j = i + 1; j < objectsRef.current.length; j++) {
            if (objectsRef.current[j].type === 'yellow') {
              const obj1 = objectsRef.current[i];
              const obj2 = objectsRef.current[j];
              const distVec = { x: obj2.x - obj1.x, y: obj2.y - obj1.y };
              const distance = Math.sqrt(distVec.x * distVec.x + distVec.y * distVec.y);
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
      objectsRef.current = objectsRef.current.filter(obj => {
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
        if (obj.type === 'red') currentRedCount++;
        else if (obj.type === 'yellow') currentYellowCount++;
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
        const distancePlayer = Math.sqrt(Math.pow(obj.x - mousePos.x, 2) + Math.pow(obj.y - mousePos.y, 2));
        if (distancePlayer < obj.size + PLAYER_RADIUS) {
          // Ignore collisions during invulnerability window
          if (now < invulnerableUntilRef.current) {
            return true;
          }
          if (hearts > 0) {
            setHearts(prev => Math.max(0, prev - 1));
            // Trigger damage slow and knockback
            setDamageSlowEffect({
              isActive: true,
              startTime: Date.now(),
              duration: DAMAGE_SLOW_DURATION,
              slowFactor: DAMAGE_SLOW_FACTOR
            });
            invulnerableUntilRef.current = Date.now() + DAMAGE_SLOW_DURATION;
            objectsRef.current.forEach(o => {
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
            return true;
          } else {
            endGame();
            return false;
          }
        }
        return true;
      });
      setRedObjectCount(currentRedCount);
      setYellowObjectCount(currentYellowCount);
      if (gameState === 'playing') {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'playing' && !gameLoopRef.current) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => { 
        if (gameLoopRef.current) { 
            cancelAnimationFrame(gameLoopRef.current); 
            gameLoopRef.current = null; 
        }
    };
  }, [gameState, mousePos, endGame, hearts, timeSlowEffect, damageSlowEffect]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      scoreIntervalRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      currentRedObjectSpeedRef.current *= OBJECT_SPEED_ACCELERATION_FACTOR;
      const newYellowSpeed = currentRedObjectSpeedRef.current / 2;
      setDisplayedRedObjectSpeed(currentRedObjectSpeedRef.current);
      setDisplayedYellowObjectSpeed(newYellowSpeed);
      objectsRef.current.forEach(obj => {
        if (obj.type === 'red') obj.speed = currentRedObjectSpeedRef.current;
        else if (obj.type === 'yellow') obj.speed = newYellowSpeed;
      });
      lastObjectSpeedIncreaseScoreRef.current = score;
    }

    const expectedObjectsBase = 1 + Math.floor(score / 20);
    const effectiveObjectCount = objectsRef.current.length + pendingSpawnsRef.current.length + destroyedByBombCountRef.current;

    if (effectiveObjectCount < expectedObjectsBase) {
        const numToSpawn = expectedObjectsBase - effectiveObjectCount;
        for (let i = 0; i < numToSpawn; i++) {
            addPendingSpawn(canvas, score, pendingSpawnsRef.current);
        }
    }

    if (score > 0 && score % SHIELD_SPAWN_INTERVAL_SCORE === 0 && score !== lastShieldSpawnScoreRef.current && shieldsRef.current.length === 0 && pendingShieldSpawnsRef.current.length === 0) {
      addPendingShieldSpawn(canvas, pendingShieldSpawnsRef.current);
      lastShieldSpawnScoreRef.current = score;
    }

    // Bomb spawning logic
    const canSpawnBombConditions = bombCollectiblesRef.current.length === 0 && score !== lastBombSpawnScoreRef.current && score > 0;
    let shouldSpawnThisBomb = false;

    if (score === BOMB_FIRST_SPAWN_SCORE) {
      shouldSpawnThisBomb = true;
    } else if (score === BOMB_SECOND_SPAWN_SCORE) {
      shouldSpawnThisBomb = true;
    } else if (score > BOMB_SECOND_SPAWN_SCORE && (score - BOMB_SECOND_SPAWN_SCORE) % BOMB_SUBSEQUENT_SPAWN_INTERVAL === 0) {
      shouldSpawnThisBomb = true;
    }

    if (canSpawnBombConditions && shouldSpawnThisBomb) {
      addBombCollectible(canvas, bombCollectiblesRef.current);
      lastBombSpawnScoreRef.current = score;
    }

    // Hourglass spawning logic
    const canSpawnHourglassConditions = hourglassCollectiblesRef.current.length === 0 && score !== lastHourglassSpawnScoreRef.current && score > 0;
    let shouldSpawnThisHourglass = false;

    if (score === HOURGLASS_FIRST_SPAWN_SCORE) {
      shouldSpawnThisHourglass = true;
    } else if (score === HOURGLASS_SECOND_SPAWN_SCORE) {
      shouldSpawnThisHourglass = true;
    } else if (score > HOURGLASS_SECOND_SPAWN_SCORE && (score - HOURGLASS_SECOND_SPAWN_SCORE) % HOURGLASS_SUBSEQUENT_SPAWN_INTERVAL === 0) {
      shouldSpawnThisHourglass = true;
    }

    if (canSpawnHourglassConditions && shouldSpawnThisHourglass) {
      addHourglassCollectible(canvas, hourglassCollectiblesRef.current);
      lastHourglassSpawnScoreRef.current = score;
    }
    
    return () => {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      scoreIntervalRef.current = null;
    };
  }, [gameState, score, addPendingSpawn]);

  if (gameState === 'menu') {
    return <GameMenu onStartGame={startGame} />;
  }

  if (gameState === 'playing') {
    return (
      <GameCanvas
        score={score}
        displayedScoreSpeed={displayedScoreSpeed}
        redObjectCount={redObjectCount}
        yellowObjectCount={yellowObjectCount}
        displayedRedObjectSpeed={displayedRedObjectSpeed}
        displayedYellowObjectSpeed={displayedYellowObjectSpeed}
        hearts={hearts}
        timeSlowActive={timeSlowEffect.isActive}
        canvasRef={canvasRef}
      />
    );
  }

  if (gameState === 'gameOver') {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <GameOverScreen
          score={score}
          displayedScoreSpeed={displayedScoreSpeed}
          displayedRedObjectSpeed={displayedRedObjectSpeed}
          displayedYellowObjectSpeed={displayedYellowObjectSpeed}
          redObjectCount={redObjectCount}
          yellowObjectCount={yellowObjectCount}
          onPlayAgain={startGame}
          onBackToMenu={backToMenu}
        />
    </div>
  );
  }

  return null;
} 