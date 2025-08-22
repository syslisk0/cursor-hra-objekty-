export const GLOBAL_SIZE_SCALE = 0.7; // -30% velikosti všech herních prvků
export const PLAYER_RADIUS = 10 * GLOBAL_SIZE_SCALE;
export const OBJECT_SIZE = 20 * GLOBAL_SIZE_SCALE;
// Globální škálování rychlosti hry (1.0 = původní, 0.9 = o 10% pomalejší)
export const GLOBAL_SPEED_SCALE = 0.95; // +5% rychlejší oproti předchozímu stavu
export const GLOBAL_TIME_SCALE = 0.95;
export const INITIAL_RED_OBJECT_SPEED = 3 * GLOBAL_SPEED_SCALE; // 10% zpomalení
export const OBJECT_SPEED_ACCELERATION_SCORE_THRESHOLD = 50;
export const OBJECT_SPEED_ACCELERATION_FACTOR = 1.0 + (1.2 - 1.0) * GLOBAL_SPEED_SCALE; // 10% zpomalení zrychlování
export const SPAWN_WARNING_DURATION = 1000;
export const SPAWN_WARNING_MIN_RADIUS = 5 * GLOBAL_SIZE_SCALE;
export const SPAWN_WARNING_MAX_RADIUS = 15 * GLOBAL_SIZE_SCALE;
export const SPAWN_WARNING_PULSE_SPEED = 0.2 * GLOBAL_SPEED_SCALE; // 10% zpomalení

export const INITIAL_SCORE_INTERVAL = 1000 / GLOBAL_TIME_SCALE; // 10% zpomalení (delší interval = pomalejší skórování)
export const MIN_SCORE_INTERVAL = 100 / GLOBAL_TIME_SCALE; // 10% zpomalení
export const SCORE_ACCELERATION_TIME_THRESHOLD = 20000;
export const SCORE_ACCELERATION_FACTOR = 1.0 - (1.0 - 0.7) * GLOBAL_SPEED_SCALE; // 10% zpomalení zrychlování skóre

export const YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE = 100;
export const YELLOW_OBJECT_SPAWN_CHANCE = 0.3;

// Interval (in score points) at which enemies spawn
export const ENEMY_SPAWN_SCORE_INTERVAL = 20;

export const SHIELD_SIZE = 15 * GLOBAL_SIZE_SCALE;
export const SHIELD_PICKUP_COLOR = '#FF3B3B';
export const PLAYER_WITH_SHIELD_COLOR = '#33FF33';
export const PLAYER_DEFAULT_COLOR = '#00FF00';
export const KNOCKBACK_FORCE = 180 * GLOBAL_SIZE_SCALE;
export const SHIELD_SPAWN_INTERVAL_SCORE = 100;

// Probabilistic spawn chances (0..1)
export const HEART_SPAWN_CHANCE = 0.5; // 50% chance at each eligible 100-score threshold

export const SHIELD_SPAWN_WARNING_DURATION = 1000;
export const SHIELD_SPAWN_WARNING_MIN_RADIUS = 5 * GLOBAL_SIZE_SCALE;
export const SHIELD_SPAWN_WARNING_MAX_RADIUS = 15 * GLOBAL_SIZE_SCALE;
export const SHIELD_SPAWN_WARNING_PULSE_SPEED = 0.2 * GLOBAL_SPEED_SCALE; // 10% zpomalení
export const SHIELD_SPAWN_WARNING_COLOR = 'rgba(255, 80, 100, 0.5)';

export const BOMB_COLLECTIBLE_SIZE = 18 * GLOBAL_SIZE_SCALE;
export const BOMB_COLLECTIBLE_COLOR = '#8B4513';
export const BOMB_FIRST_SPAWN_SCORE = 150;
export const BOMB_SECOND_SPAWN_SCORE = 280;
export const BOMB_SUBSEQUENT_SPAWN_INTERVAL = 100;
export const BOMB_SPAWN_CHANCE = 0.4; // 40% chance at eligible thresholds
export const BOMB_EXPLOSION_RADIUS = 20 * OBJECT_SIZE;
export const BOMB_EXPLOSION_DURATION = 500;
export const BOMB_EXPLOSION_COLOR = 'rgba(255, 165, 0, 0.7)';

export const HOURGLASS_COLLECTIBLE_SIZE = 16 * GLOBAL_SIZE_SCALE;
export const HOURGLASS_COLLECTIBLE_COLOR = '#DAA520';
export const HOURGLASS_FIRST_SPAWN_SCORE = 200;
export const HOURGLASS_SECOND_SPAWN_SCORE = 275;
export const HOURGLASS_SUBSEQUENT_SPAWN_INTERVAL = 75;
export const HOURGLASS_SPAWN_CHANCE = 0.3; // 30% chance at eligible thresholds
export const TIME_SLOW_DURATION = 5000; // 5 sekund
export const TIME_SLOW_FACTOR = 0.4; // 60% zpomalení (40% původní rychlosti)

// Zpomalení a pulzace při zásahu (ztrátě srdíčka)
export const DAMAGE_SLOW_DURATION = 5000; // 5 sekund
export const DAMAGE_SLOW_FACTOR = 0.05; // 5 % původní rychlosti
export const DAMAGE_PULSE_MAX_ALPHA = 0.35; // maximální průhlednost červeného pulsu
export const DAMAGE_PULSE_MIN_ALPHA = 0.1; // minimální průhlednost červeného pulsu
export const DAMAGE_PULSE_FREQUENCY = 6.0; // rychlost pulzování (rad/s)

// Multiplikátor pro Level 2: vše o 10 % rychlejší
export const LEVEL2_SPEED_MULTIPLIER = 1.1;

// Boss velikost (pro kreslení centrálního boss objektu)
export const BOSS_RADIUS = 18 * GLOBAL_SIZE_SCALE;

// Animace zásahů a efektů
export const HIT_ANIMATION_DURATION = 800; // ms
export const HIT_ANIMATION_PARTICLES = 12; // počet částic při zásahu
export const HIT_ANIMATION_PARTICLE_SPEED = 4; // rychlost částic
export const HIT_ANIMATION_MAX_RADIUS = 40 * GLOBAL_SIZE_SCALE; // maximální dosah částic

export const DEATH_CIRCLE_ANIMATION_DURATION = 1200; // ms
export const DEATH_CIRCLE_ANIMATION_PARTICLES = 20; // počet částic při zabití kruhem smrti
export const DEATH_CIRCLE_ANIMATION_PARTICLE_SPEED = 6; // rychlost částic
export const DEATH_CIRCLE_ANIMATION_MAX_RADIUS = 60 * GLOBAL_SIZE_SCALE; // maximální dosah částic

// Barvy pro animace
export const HIT_ANIMATION_COLORS = ['#FF4444', '#FF6666', '#FF8888', '#FFAAAA'];
export const DEATH_CIRCLE_ANIMATION_COLORS = ['#00FFFF', '#00FF88', '#88FF00', '#FFFF00', '#FF8800'];
