'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameMenu from './GameMenu';
import GameCanvas from './GameCanvas';
import GameOverScreen from './GameOverScreen';
import { drawEnemy } from './EnemyDraw';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { updateBestScoreIfHigher, getUser, addCoins } from '../services/userService';
import { getSkinColor, SKINS } from './skins';
import { drawWatermelon, WATERMELON_SEED } from './skinRenderers';
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
  LEVEL2_SPEED_MULTIPLIER
} from './constants';
import {
  createNewGameObject,
  addPendingSpawn,
  addPendingShieldSpawn,
  addBombCollectible,
  createExplosion,
  addHourglassCollectible
} from './gameLogic';
import { BossState, createInitialBossState, startBoss, updateBoss } from './GameBoss';

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
  const bossRef = useRef<BossState>(createInitialBossState());
  const bossActiveRef = useRef<boolean>(false);
  const bossSpawnScheduledRef = useRef<boolean>(false);
  const levelRef = useRef<number>(1);
  const levelTextUntilRef = useRef<number>(0);
  const globalPauseUntilRef = useRef<number>(0);
  const bossTextUntilRef = useRef<number>(0);
  const level2InitialSpawnPendingRef = useRef<boolean>(false);
  const spaceStarsSeedRef = useRef<number>(Math.random());
  const levelStartScoreRef = useRef<number>(0);

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
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<string>(PLAYER_DEFAULT_COLOR);
  const [selectedSkinId, setSelectedSkinId] = useState<string>('green');
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const coinsAwardedRef = useRef<boolean>(false);
  const skinSpriteCacheRef = useRef<Record<string, HTMLImageElement | null | 'loading'>>({});
  const watermelonSeedsSpecRef = useRef<Array<{ radial: number; angle: number; rot: number }>>([]);

  useEffect(() => {
    const compute = () => setIsPortrait(typeof window !== 'undefined' && window.innerHeight >= window.innerWidth);
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute as any);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute as any);
    };
  }, []);

  // Developer mode: toggle immortality on Enter while playing
  const devImmortalRef = useRef<boolean>(false);
  useEffect(() => {
    if (gameState !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        devImmortalRef.current = !devImmortalRef.current;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

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
    levelRef.current = 1;
    levelStartScoreRef.current = 0;
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

  const startDeveloper = useCallback((targetScore?: number) => {
    resetGameValues();
    // start with immortality enabled
    devImmortalRef.current = true;
    setGameState('playing');
    if (typeof targetScore === 'number' && isFinite(targetScore) && targetScore >= 0) {
      setScore(targetScore);
      lastObjectSpeedIncreaseScoreRef.current = targetScore; // prevent sudden speed jump
    }
  }, [resetGameValues]);

  const endGame = useCallback(() => {
    setGameState('gameOver');
  }, []);

  const backToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u ? { uid: u.uid, email: u.email } : null);
      if (u) {
        try {
          const rec = await getUser(u.uid);
          const sid = rec?.selectedSkinId || 'green';
          setSelectedSkinId(sid);
          setPlayerColor(getSkinColor(sid));
        } catch (_) {
          setSelectedSkinId('green');
          setPlayerColor(PLAYER_DEFAULT_COLOR);
        }
      } else {
        setSelectedSkinId('green');
        setPlayerColor(PLAYER_DEFAULT_COLOR);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const refreshSkin = async () => {
      if (currentUser) {
        try {
          const rec = await getUser(currentUser.uid);
          const sid = rec?.selectedSkinId || 'green';
          setSelectedSkinId(sid);
          setPlayerColor(getSkinColor(sid));
          // pre-load sprite if available for ball skins
          const skinDef = SKINS.find(s => s.id === sid);
          const ballIds = new Set(['football', 'basketball', 'tennis', 'golf', 'volleyball']);
          if (skinDef?.spriteUrl && ballIds.has(skinDef.id)) {
            if (!skinSpriteCacheRef.current[skinDef.id]) {
              skinSpriteCacheRef.current[skinDef.id] = 'loading';
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => { skinSpriteCacheRef.current[skinDef.id] = img; };
              img.onerror = () => { skinSpriteCacheRef.current[skinDef.id] = null; };
              img.src = skinDef.spriteUrl;
            }
          }
        } catch (_) {
          /* ignore */
        }
      }
    };
    refreshSkin();
  }, [gameState, currentUser]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      const earned = Math.floor(score / 100);
      setCoinsEarned(earned);
      if (!coinsAwardedRef.current) {
        coinsAwardedRef.current = true;
        if (currentUser && earned > 0) {
          addCoins(currentUser.uid, earned).catch(() => {});
        }
      }
    } else {
      coinsAwardedRef.current = false;
      setCoinsEarned(0);
    }
  }, [gameState, score, currentUser]);

  const submitScore = useCallback(async (finalScore: number) => {
    if (!currentUser) return { isRecord: false, best: finalScore };
    const { updated, newBest } = await updateBestScoreIfHigher(currentUser.uid, currentUser.email, finalScore);
    return { isRecord: updated, best: newBest };
  }, [currentUser]);

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
    const targetW = isPortrait ? 600 : 800;
    const targetH = isPortrait ? 800 : 600;
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;

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
      // Global pause after boss (e.g. during LEVEL 2 banner)
      const inGlobalPause = globalPauseUntilRef.current > now;
      // Show BOSS banner when boss starts
      if (bossTextUntilRef.current > now) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff2d2d';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', canvas.width / 2, canvas.height / 2);
        ctx.restore();
      }
      // Show level text overlay if active
      if (levelTextUntilRef.current > now) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 2', canvas.width / 2, canvas.height / 2);
        ctx.restore();
      }
      // Damage pulsing overlay (background pulz)
      if (damageSlowEffect.isActive) {
        const t = (now - damageSlowEffect.startTime) / 1000;
        const alpha = DAMAGE_PULSE_MIN_ALPHA + (DAMAGE_PULSE_MAX_ALPHA - DAMAGE_PULSE_MIN_ALPHA) * (0.5 * (1 + Math.sin(t * DAMAGE_PULSE_FREQUENCY)));
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // Draw player ball with optional skin effects
      // Use sprite for these skins to match shop exactly
      const spriteSkins = new Set(['football', 'basketball', 'volleyball', 'diamond']);
      const selectedSkinDef = SKINS.find(s => s.id === selectedSkinId);
      const spriteCandidate = (selectedSkinDef && spriteSkins.has(selectedSkinDef.id)) ? skinSpriteCacheRef.current[selectedSkinDef.id] : undefined;
      if (spriteCandidate && spriteCandidate !== 'loading') {
        const img = spriteCandidate as HTMLImageElement | null;
        if (img) {
          const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
          ctx.save();
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();
        }
      } else if (selectedSkinId === 'diamond') {
        ctx.save();
        // Draw a cut-diamond shape: wide top, triangular bottom tip
        const cx = mousePos.x;
        const cy = mousePos.y;
        const r = PLAYER_RADIUS;
        const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
        // Cooler, more blue gradient
        grad.addColorStop(0, '#E3F6FF');
        grad.addColorStop(0.45, playerColor);
        grad.addColorStop(1, '#198CFF');
        ctx.fillStyle = grad;
        // Top is a trapezoid, bottom is a triangle (point)
        const topWidth = r * 1.6; // wider top
        const tipY = cy + r; // bottom tip
        ctx.beginPath();
        // trapezoid top
        ctx.moveTo(cx - topWidth * 0.6, cy - r * 0.9); // top-left
        ctx.lineTo(cx + topWidth * 0.6, cy - r * 0.9); // top-right
        ctx.lineTo(cx + topWidth * 0.45, cy - r * 0.1); // mid-right (thicker top)
        ctx.lineTo(cx - topWidth * 0.45, cy - r * 0.1); // mid-left (thicker top)
        ctx.closePath();
        ctx.fill();
        // bottom triangle tip
        ctx.beginPath();
        ctx.moveTo(cx - topWidth * 0.45, cy - r * 0.1);
        ctx.lineTo(cx + topWidth * 0.45, cy - r * 0.1);
        ctx.lineTo(cx, tipY);
        ctx.closePath();
        ctx.fill();
        // Light facets
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        // top facets
        ctx.beginPath();
        ctx.moveTo(cx - topWidth * 0.6, cy - r * 0.9);
        ctx.lineTo(cx + topWidth * 0.6, cy - r * 0.9);
        ctx.moveTo(cx - topWidth * 0.45, cy - r * 0.1);
        ctx.lineTo(cx + topWidth * 0.45, cy - r * 0.1);
        // diagonals on top
        ctx.moveTo(cx - topWidth * 0.6, cy - r * 0.9);
        ctx.lineTo(cx - topWidth * 0.2, cy - r * 0.1);
        ctx.moveTo(cx + topWidth * 0.6, cy - r * 0.9);
        ctx.lineTo(cx + topWidth * 0.2, cy - r * 0.1);
        // triangle facets
        ctx.moveTo(cx - topWidth * 0.45, cy - r * 0.1);
        ctx.lineTo(cx, tipY);
        ctx.moveTo(cx + topWidth * 0.45, cy - r * 0.1);
        ctx.lineTo(cx, tipY);
        ctx.stroke();
        ctx.restore();
      } else if (selectedSkinId === 'skull') {
        // Skull silhouette (non-circular), similar to shop icon
        const cx = mousePos.x;
        const cy = mousePos.y;
        const r = PLAYER_RADIUS;
        // head shape
        ctx.fillStyle = '#EEEEEE';
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        // Rounded cranium
        ctx.moveTo(cx - r * 0.7, cy - r * 0.2);
        ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.9, cx, cy - r * 0.95);
        ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.9, cx + r * 0.7, cy - r * 0.2);
        // Cheeks into jaw
        ctx.quadraticCurveTo(cx + r * 0.72, cy + r * 0.2, cx + r * 0.45, cy + r * 0.35);
        ctx.lineTo(cx - r * 0.45, cy + r * 0.35);
        ctx.quadraticCurveTo(cx - r * 0.72, cy + r * 0.2, cx - r * 0.7, cy - r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.1, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.32, cy - r * 0.1, r * 0.2, 0, Math.PI * 2); ctx.fill();
        // nose (inverted triangle)
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.05);
        ctx.lineTo(cx + r * 0.14, cy + r * 0.28);
        ctx.lineTo(cx - r * 0.14, cy + r * 0.28);
        ctx.closePath();
        ctx.fill();
        // teeth panel
        ctx.fillStyle = '#F5F5F5';
        ctx.strokeStyle = '#111111';
        const tw = r * 0.9;
        const th = r * 0.38;
        ctx.fillRect(cx - tw / 2, cy + r * 0.35, tw, th);
        ctx.strokeRect(cx - tw / 2, cy + r * 0.35, tw, th);
        // vertical tooth lines
        ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
          const x = cx + (i * tw) / 8;
          ctx.moveTo(x, cy + r * 0.35);
          ctx.lineTo(x, cy + r * 0.35 + th);
        }
        ctx.stroke();
      } else if (selectedSkinId === 'football') {
        // Soccer ball: white base with central black pentagon and surrounding patches + seams
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        // base
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#D0D0D0'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.stroke();
        // draw pentagon helper
        const drawPentagon = (ax: number, ay: number, radius: number, rotation = -Math.PI / 2) => {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const ang = rotation + (i * 2 * Math.PI) / 5;
            const x = ax + Math.cos(ang) * radius;
            const y = ay + Math.sin(ang) * radius;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        };
        // central black pentagon
        ctx.fillStyle = '#000000';
        drawPentagon(cx, cy, r * 0.36);
        // ring of 5 surrounding black pentagons
        const ringRadius = r * 0.72;
        const smallPentR = r * 0.18;
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const px = cx + Math.cos(ang) * ringRadius * 0.6;
          const py = cy + Math.sin(ang) * ringRadius * 0.6;
          ctx.fillStyle = '#000000';
          drawPentagon(px, py, smallPentR, ang);
        }
        // seams: subtle gray arcs to mimic panel edges
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      } else if (selectedSkinId === 'basketball') {
        // Basketball: orange base with black seams
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        ctx.fillStyle = '#D35400';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000000'; ctx.lineWidth = Math.max(1, r * 0.12);
        // vertical & horizontal
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.02, 0, 2 * Math.PI); ctx.stroke(); // cap line width
        ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
        // side curves
        ctx.beginPath(); ctx.arc(cx - r * 0.6, cy, r * 0.9, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + r * 0.6, cy, r * 0.9, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
      } else if (selectedSkinId === 'tennis') {
        // Tennis ball: neon yellow with emphasized white seams
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        ctx.fillStyle = '#C8FF00';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1, r * 0.24);
        ctx.beginPath(); ctx.arc(cx - r * 0.35, cy, r * 0.9, -Math.PI / 3, Math.PI / 3); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + r * 0.35, cy, r * 0.9, (2 * Math.PI) / 3, (4 * Math.PI) / 3); ctx.stroke();
        // subtle inner highlight
        const grad = ctx.createRadialGradient(cx, cy - r * 0.4, r * 0.1, cx, cy, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else if (selectedSkinId === 'golf') {
        // Golf ball: realistic white with dimples
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        // base
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        // dimples in staggered grid
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        const step = r * 0.32;
        const radiusInner = r * 0.86;
        for (let row = -2.5; row <= 2.5; row++) {
          const y = cy + row * step * 0.65;
          const offset = (Math.abs(row) % 2) * (step * 0.5);
          for (let col = -3; col <= 3; col++) {
            const x = cx + col * step + offset;
            const dx = x - cx; const dy = y - cy;
            if (dx * dx + dy * dy < radiusInner * radiusInner) {
              ctx.beginPath(); ctx.arc(x, y, Math.max(1, r * 0.06), 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        // soft shading
        const lg = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.1, cx, cy, r);
        lg.addColorStop(0, 'rgba(0,0,0,0.08)');
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else if (selectedSkinId === 'volleyball') {
        // Volleyball: white with blue/yellow bands
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.18);
        // blue arc
        ctx.strokeStyle = '#2E86C1';
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, Math.PI * 0.1, Math.PI * 1.2); ctx.stroke();
        // yellow arc
        ctx.strokeStyle = '#F1C40F';
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, -Math.PI * 0.2, Math.PI * 0.9); ctx.stroke();
        // seams
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.95, Math.PI * 0.2, Math.PI * 1.3); ctx.stroke();
      } else if (selectedSkinId === 'watermelon') {
        drawWatermelon(ctx, mousePos.x, mousePos.y, PLAYER_RADIUS, WATERMELON_SEED);
      } else if (selectedSkinId === 'space') {
        // Space skin: purple rim, dark-space center, and white/yellow stars
        const cx = mousePos.x; const cy = mousePos.y; const r = PLAYER_RADIUS;
        // purple border
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#5B2C6F';
        ctx.fill();
        // inner dark space
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#0B0F33';
        ctx.fill();
        // stars (deterministic positions from seed)
        const seed = spaceStarsSeedRef.current;
        let s = Math.floor(seed * 1e9) || 1234567;
        const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
        const stars = 18;
        for (let i = 0; i < stars; i++) {
          const ang = rand() * Math.PI * 2;
          const rad = (rand() * 0.8 + 0.05) * r * 0.85;
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad;
          const size = Math.max(1, r * (rand() * 0.06 + 0.03));
          ctx.fillStyle = rand() < 0.35 ? '#F1C40F' : '#FFFFFF';
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!inGlobalPause) pendingShieldSpawnsRef.current.forEach(pss => {
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
      if (!inGlobalPause && newShieldsFromPending.length > 0) {
        shieldsRef.current.push(...newShieldsFromPending);
      }

      // Render and pickup hearts (formerly shields)
      if (!inGlobalPause) shieldsRef.current.forEach(shield => {
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

      if (!inGlobalPause) bombCollectiblesRef.current.forEach(bomb => {
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
      if (!inGlobalPause) hourglassCollectiblesRef.current.forEach(hourglass => {
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
      if (!inGlobalPause) pendingSpawnsRef.current.forEach(ps => {
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
      if(!inGlobalPause && newObjectsFromPending.length > 0) {
        objectsRef.current.push(...newObjectsFromPending);
      }
      // If Level 2 initial spawn was requested, mark done after at least one object exists
      if (levelRef.current === 2 && level2InitialSpawnPendingRef.current) {
        const totalNow = objectsRef.current.length + pendingSpawnsRef.current.length;
        if (totalNow >= 1) level2InitialSpawnPendingRef.current = false;
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
          const hitWallX = (obj.x - obj.size < 0) || (obj.x + obj.size > canvas.width);
          const hitWallY = (obj.y - obj.size < 0) || (obj.y + obj.size > canvas.height);
          if (obj.isBossProjectile && (hitWallX || hitWallY)) {
            if (obj.bossProjectileKind === 'wave') {
              return false; // wave projectiles die on wall
            }
            if (obj.bossProjectileKind === 'charge') {
              // Clamp to wall impact point
              obj.x = Math.max(obj.size, Math.min(obj.x, canvas.width - obj.size));
              obj.y = Math.max(obj.size, Math.min(obj.y, canvas.height - obj.size));
              if (typeof obj.bouncesRemaining === 'number' && obj.bouncesRemaining > 0) {
                obj.bouncesRemaining -= 1;
                // Retarget from current position to player's current position (no vanish)
                const dirX2 = mousePos.x - obj.x;
                const dirY2 = mousePos.y - obj.y;
                const mag2 = Math.hypot(dirX2, dirY2) || 1;
                obj.dx = dirX2 / mag2;
                obj.dy = dirY2 / mag2;
              } else {
                return false; // after required repeats, disappear to allow next phase
              }
            }
          }
          if (hitWallX) {
            obj.dx = -obj.dx;
            obj.x = Math.max(obj.size, Math.min(obj.x, canvas.width - obj.size));
          }
          if (hitWallY) {
            obj.dy = -obj.dy;
            obj.y = Math.max(obj.size, Math.min(obj.y, canvas.height - obj.size));
          }
        }
        if (obj.type === 'red') currentRedCount++;
        else if (obj.type === 'yellow') currentYellowCount++;
        drawEnemy(ctx, obj, mousePos);
        // Boss projectile overlay (only charge projectile has face/crown)
        if ((obj as any).isBossProjectile && (obj as any).bossProjectileKind === 'charge') {
          const bx = obj.x; const by = obj.y; const br = obj.size;
          // crown
          ctx.save();
          ctx.fillStyle = '#FFD000';
          ctx.beginPath();
          ctx.moveTo(bx - br * 0.8, by - br * 1.2);
          ctx.lineTo(bx - br * 0.4, by - br * 1.7);
          ctx.lineTo(bx, by - br * 1.2);
          ctx.lineTo(bx + br * 0.4, by - br * 1.7);
          ctx.lineTo(bx + br * 0.8, by - br * 1.2);
          ctx.closePath();
          ctx.fill();
          // eyes
          ctx.fillStyle = '#000000';
          ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.1, br * 0.12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(bx + br * 0.3, by - br * 0.1, br * 0.12, 0, Math.PI * 2); ctx.fill();
          // mouth
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, br * 0.1);
          ctx.beginPath();
          ctx.arc(bx, by + br * 0.2, br * 0.35, 0, Math.PI);
          ctx.stroke();
          ctx.restore();
        }
        const distancePlayer = Math.sqrt(Math.pow(obj.x - mousePos.x, 2) + Math.pow(obj.y - mousePos.y, 2));
        if (!inGlobalPause && distancePlayer < obj.size + PLAYER_RADIUS) {
          // Ignore collisions during invulnerability window
          if (now < invulnerableUntilRef.current) {
            return true;
          }
          // Developer immortality toggle (Enter)
          if (!devImmortalRef.current) {
            // Boss charge projectiles should not disappear on hit
            if (obj.isBossProjectile && obj.bossProjectileKind === 'charge') {
              // small knockback still applies
            } else {
              // If this hit would drop hearts to 0, end the game immediately
              if (hearts <= 1) {
                setHearts(0);
                endGame();
                return false;
              }
            }
            // Otherwise, consume one heart and apply slow + knockback
            setHearts(prev => Math.max(0, prev - 1));
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
          }
          return true;
        }
        return true;
      });
      setRedObjectCount(currentRedCount);
      setYellowObjectCount(currentYellowCount);
      // Draw centered boss (visible in all boss phases)
      if ((bossRef.current as any)?.isActive) {
        const phase: any = (bossRef.current as any).phase;
        if (phase === 'intro' || phase === 'wave_attacks' || phase === 'charge_attacks' || phase === 'final_burst' || phase === 'done') {
          const cx = (bossRef.current as any).centerX;
          const cy = (bossRef.current as any).centerY;
          const r = 18;
          // pulsing spawn aura during intro
          if (phase === 'intro') {
            const t = (now % 1000) / 1000;
            const pulse = r + 10 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
            ctx.beginPath();
            ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,0,0,0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          // body
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          // crown
          ctx.fillStyle = '#FFD000';
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.9, cy - r * 1.2);
          ctx.lineTo(cx - r * 0.4, cy - r * 1.8);
          ctx.lineTo(cx, cy - r * 1.2);
          ctx.lineTo(cx + r * 0.4, cy - r * 1.8);
          ctx.lineTo(cx + r * 0.9, cy - r * 1.2);
          ctx.closePath();
          ctx.fill();
          // eyes
          ctx.fillStyle = '#000000';
          ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + r * 0.35, cy - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
          // mouth (laugh during laughUntil)
          const laughing = now <= (bossRef.current as any).laughUntil;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, r * 0.12);
          ctx.beginPath();
          if (laughing) {
            ctx.arc(cx, cy + r * 0.15, r * 0.5, 0, Math.PI);
          } else {
            ctx.arc(cx, cy + r * 0.2, r * 0.35, 0, Math.PI);
          }
          ctx.stroke();
        }
      }

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
  }, [gameState, mousePos, endGame, hearts, timeSlowEffect, damageSlowEffect, isPortrait]);

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
        const inBossPrezoneNow = (score >= 900 && score < 1000);
        if (!inBossPrezoneNow && elapsedTime - lastScoreAccelerationTimeRef.current >= SCORE_ACCELERATION_TIME_THRESHOLD) {
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

    const inBossPrezone = score >= 900 && score < 1000;
    if (!inBossPrezone && score - lastObjectSpeedIncreaseScoreRef.current >= OBJECT_SPEED_ACCELERATION_SCORE_THRESHOLD) {
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

    // Base expected objects scaled from the current level's start score
    const levelRelativeScore = Math.max(0, score - levelStartScoreRef.current);
    // Suppress spawns during BOSS banner (pre-spawn) and while boss is active
    let expectedObjectsBase = (bossRef.current?.isActive || bossSpawnScheduledRef.current) ? 0 : (1 + Math.floor(levelRelativeScore / 20));
    // At the very start of Level 2, allow exactly one spawn
    if (levelRef.current === 2 && level2InitialSpawnPendingRef.current) {
      expectedObjectsBase = 1;
    }
    const effectiveObjectCount = objectsRef.current.length + pendingSpawnsRef.current.length + destroyedByBombCountRef.current;

    if (!bossRef.current?.isActive && effectiveObjectCount < expectedObjectsBase) {
        const numToSpawn = expectedObjectsBase - effectiveObjectCount;
        // If capped to 1 for level 2 start, only enqueue one
        const spawnCount = (levelRef.current === 2 && level2InitialSpawnPendingRef.current) ? Math.min(1, numToSpawn) : numToSpawn;
        for (let i = 0; i < spawnCount; i++) {
          addPendingSpawn(canvas, score, pendingSpawnsRef.current);
        }
    }

    if (score > 0 && score % SHIELD_SPAWN_INTERVAL_SCORE === 0 && score !== lastShieldSpawnScoreRef.current && shieldsRef.current.length === 0 && pendingShieldSpawnsRef.current.length === 0) {
      addPendingShieldSpawn(canvas, pendingShieldSpawnsRef.current);
      lastShieldSpawnScoreRef.current = score;
    }

    // Bomb spawning logic
    const canSpawnBombConditions = !bossRef.current?.isActive && !bossSpawnScheduledRef.current && bombCollectiblesRef.current.length === 0 && score !== lastBombSpawnScoreRef.current && score > 0;
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
    const canSpawnHourglassConditions = !bossRef.current?.isActive && !bossSpawnScheduledRef.current && hourglassCollectiblesRef.current.length === 0 && score !== lastHourglassSpawnScoreRef.current && score > 0;
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

  // Boss trigger when reaching score 1000
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const now = Date.now();
    if (!bossRef.current.isActive && !bossSpawnScheduledRef.current && score >= 1000 && levelRef.current === 1) {
      // show BOSS banner for 3 seconds first
      bossTextUntilRef.current = now + 3000;
      bossSpawnScheduledRef.current = true;
      // Immediately clear all objects and pending while banner shows
      objectsRef.current = [];
      pendingSpawnsRef.current = [];
      pendingShieldSpawnsRef.current = [];
      bombCollectiblesRef.current = [];
      hourglassCollectiblesRef.current = [];
      // after banner disappears, then spawn the boss
      setTimeout(() => {
        const canvasNow = canvasRef.current;
        if (!canvasNow) return;
        if (bossRef.current.isActive || levelRef.current !== 1) return;
        // clear field and pending
        objectsRef.current = [];
        pendingSpawnsRef.current = [];
        pendingShieldSpawnsRef.current = [];
        bombCollectiblesRef.current = [];
        hourglassCollectiblesRef.current = [];
        // reset score speed to initial
        currentScoreIntervalMsRef.current = INITIAL_SCORE_INTERVAL;
        lastScoreAccelerationTimeRef.current = 0;
        setDisplayedScoreSpeed(1000 / INITIAL_SCORE_INTERVAL);
        // center boss
        startBoss(bossRef.current, canvasNow.width / 2, canvasNow.height / 2, Date.now());
        bossActiveRef.current = true;
      }, 3000);
    }
  }, [score, gameState]);

  // Boss progression and cleanup
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tick = () => {
      const now = Date.now();
      if (bossRef.current.isActive) {
        updateBoss(
          bossRef.current,
          now,
          objectsRef.current,
          (x, y, dx, dy, speed, color) => ({ id: 'boss-' + Date.now() + Math.random(), x, y, dx, dy, speed, color, size: OBJECT_SIZE, type: 'red', isBossProjectile: true }),
          mousePos,
          canvas
        );
        // destroy boss projectiles on wall hit
        objectsRef.current = objectsRef.current.filter(o => {
          if (!o.isBossProjectile) return true;
          const hitWall = (o.x - o.size < 0) || (o.x + o.size > canvas.width) || (o.y - o.size < 0) || (o.y + o.size > canvas.height);
          return !hitWall;
        });
      } else if (bossActiveRef.current) {
        // Boss just finished → Level 2
        bossActiveRef.current = false;
        levelRef.current = 2;
        level2InitialSpawnPendingRef.current = true;
        bossSpawnScheduledRef.current = false;
        levelStartScoreRef.current = score; // reset scaling so Level 2 starts like a new game
        // Pause game for 3 seconds and show banner
        levelTextUntilRef.current = Date.now() + 3000;
        globalPauseUntilRef.current = levelTextUntilRef.current;
        // Clear field entirely during pause
        objectsRef.current = [];
        pendingSpawnsRef.current = [];
        pendingShieldSpawnsRef.current = [];
        bombCollectiblesRef.current = [];
        hourglassCollectiblesRef.current = [];
        // Po pauze: Level 2 začne o 10 % rychlejší (rychlost skóre i objektů)
        setTimeout(() => {
          // Zrychlit objekty o 10 %
          currentRedObjectSpeedRef.current *= LEVEL2_SPEED_MULTIPLIER;
          setDisplayedRedObjectSpeed(currentRedObjectSpeedRef.current);
          setDisplayedYellowObjectSpeed(currentRedObjectSpeedRef.current / 2);

          // Zrychlit skórování o 10 % (kratší interval)
          const newInterval = Math.max(MIN_SCORE_INTERVAL, currentScoreIntervalMsRef.current / LEVEL2_SPEED_MULTIPLIER);
          currentScoreIntervalMsRef.current = newInterval;
          setDisplayedScoreSpeed(1000 / newInterval);
          lastScoreAccelerationTimeRef.current = 0;

          // Resetnout score interval hned teď, efekt si ho následně přenastaví s akcelerací
          if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
          scoreIntervalRef.current = setInterval(() => {
            setScore(prev => prev + 1);
          }, currentScoreIntervalMsRef.current);
        }, 3000);
        // suppress new spawns during level 2 text window
        lastBombSpawnScoreRef.current = score;
        lastHourglassSpawnScoreRef.current = score;
      }
    };
    const id = setInterval(tick, 16);
    return () => clearInterval(id);
  }, [gameState, mousePos]);

  if (gameState === 'menu') {
    return <GameMenu onStartGame={startGame} onStartDeveloper={startDeveloper} />;
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
        onTouchPosition={(x, y) => setMousePos({ x, y })}
        isPortrait={isPortrait}
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
          onSubmitScore={submitScore}
          coinsEarned={coinsEarned}
        />
    </div>
  );
  }

  return null;
} 