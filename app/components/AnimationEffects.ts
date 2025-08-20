import { DamageAnimation, AnimationParticle } from './types';
import {
  HIT_ANIMATION_DURATION,
  HIT_ANIMATION_PARTICLES,
  HIT_ANIMATION_PARTICLE_SPEED,
  HIT_ANIMATION_MAX_RADIUS,
  DEATH_CIRCLE_ANIMATION_DURATION,
  DEATH_CIRCLE_ANIMATION_PARTICLES,
  DEATH_CIRCLE_ANIMATION_PARTICLE_SPEED,
  DEATH_CIRCLE_ANIMATION_MAX_RADIUS,
  HIT_ANIMATION_COLORS,
  DEATH_CIRCLE_ANIMATION_COLORS
} from './constants';

export function createDamageAnimation(x: number, y: number, type: 'hit' | 'deathCircle'): DamageAnimation {
  return {
    id: 'damage-' + Date.now() + '-' + Math.random(),
    x,
    y,
    startTime: Date.now(),
    duration: type === 'hit' ? HIT_ANIMATION_DURATION : DEATH_CIRCLE_ANIMATION_DURATION,
    type
  };
}

export function createAnimationParticles(animation: DamageAnimation): AnimationParticle[] {
  const particles: AnimationParticle[] = [];
  const particleCount = animation.type === 'hit' ? HIT_ANIMATION_PARTICLES : DEATH_CIRCLE_ANIMATION_PARTICLES;
  const speed = animation.type === 'hit' ? HIT_ANIMATION_PARTICLE_SPEED : DEATH_CIRCLE_ANIMATION_PARTICLE_SPEED;
  const colors = animation.type === 'hit' ? HIT_ANIMATION_COLORS : DEATH_CIRCLE_ANIMATION_COLORS;
  const maxLife = animation.duration;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const velocity = speed * (0.8 + Math.random() * 0.4); // variabilní rychlost
    const size = 2 + Math.random() * 3; // velikost 2-5px
    const color = colors[Math.floor(Math.random() * colors.length)];

    particles.push({
      x: animation.x,
      y: animation.y,
      dx: Math.cos(angle) * velocity,
      dy: Math.sin(angle) * velocity,
      life: maxLife,
      maxLife,
      size,
      color,
      alpha: 1.0
    });
  }

  return particles;
}

export function updateAnimationParticles(particles: AnimationParticle[], deltaTime: number): AnimationParticle[] {
  return particles.filter(particle => {
    // Aktualizace pozice
    particle.x += particle.dx * deltaTime / 16; // normalizace na 60 FPS
    particle.y += particle.dy * deltaTime / 16;
    
    // Snížení životnosti
    particle.life -= deltaTime;
    
    // Výpočet alpha hodnoty podle zbývající životnosti
    particle.alpha = Math.max(0, particle.life / particle.maxLife);
    
    // Zpomalení částic časem (efekt tření)
    particle.dx *= 0.98;
    particle.dy *= 0.98;
    
    // Zachovat pouze částice se zbývající životností
    return particle.life > 0;
  });
}

export function renderDamageAnimation(
  ctx: CanvasRenderingContext2D,
  animation: DamageAnimation,
  particles: AnimationParticle[],
  now: number
) {
  const elapsed = now - animation.startTime;
  const progress = elapsed / animation.duration;
  
  if (progress >= 1) return; // animace skončila

  ctx.save();

  // Centrální energetická vlna
  if (animation.type === 'hit') {
    renderHitWave(ctx, animation, progress);
  } else if (animation.type === 'deathCircle') {
    renderDeathCircleWave(ctx, animation, progress);
  }

  // Renderování částic
  particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    
    // Glow efekt
    ctx.shadowBlur = 8;
    ctx.shadowColor = particle.color;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });

  ctx.restore();
}

function renderHitWave(ctx: CanvasRenderingContext2D, animation: DamageAnimation, progress: number) {
  const maxRadius = HIT_ANIMATION_MAX_RADIUS;
  const currentRadius = maxRadius * progress;
  const alpha = Math.max(0, 1 - progress * 1.5); // rychlejší fade
  
  // Vnější červená vlna
  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  const gradient = ctx.createRadialGradient(
    animation.x, animation.y, 0,
    animation.x, animation.y, currentRadius
  );
  gradient.addColorStop(0, '#FF4444');
  gradient.addColorStop(0.5, '#FF6666');
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(animation.x, animation.y, currentRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Vnitřní bílá vlna
  ctx.globalAlpha = alpha * 0.8;
  const innerRadius = currentRadius * 0.6;
  const innerGradient = ctx.createRadialGradient(
    animation.x, animation.y, 0,
    animation.x, animation.y, innerRadius
  );
  innerGradient.addColorStop(0, '#FFFFFF');
  innerGradient.addColorStop(0.7, '#FFAAAA');
  innerGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(animation.x, animation.y, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function renderDeathCircleWave(ctx: CanvasRenderingContext2D, animation: DamageAnimation, progress: number) {
  const maxRadius = DEATH_CIRCLE_ANIMATION_MAX_RADIUS;
  const currentRadius = maxRadius * progress;
  const alpha = Math.max(0, 1 - progress * 1.2);
  
  // Vnější duhovková vlna
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  
  // Kreslení několika koncentrických kruhů s různými barvami
  const colors = DEATH_CIRCLE_ANIMATION_COLORS;
  for (let i = 0; i < colors.length; i++) {
    const layerRadius = currentRadius * (1 - i * 0.15);
    if (layerRadius <= 0) continue;
    
    const gradient = ctx.createRadialGradient(
      animation.x, animation.y, layerRadius * 0.3,
      animation.x, animation.y, layerRadius
    );
    gradient.addColorStop(0, colors[i]);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(animation.x, animation.y, layerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Centrální energetické jádro
  ctx.globalAlpha = alpha;
  const coreGradient = ctx.createRadialGradient(
    animation.x, animation.y, 0,
    animation.x, animation.y, currentRadius * 0.3
  );
  coreGradient.addColorStop(0, '#FFFFFF');
  coreGradient.addColorStop(0.5, '#00FFFF');
  coreGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(animation.x, animation.y, currentRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
