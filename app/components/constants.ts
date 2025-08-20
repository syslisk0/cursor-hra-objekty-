export const PLAYER_RADIUS = 10;
export const OBJECT_SIZE = 20;
// Globální škálování rychlosti hry (1.0 = původní, 0.9 = o 10% pomalejší)
export const GLOBAL_SPEED_SCALE = 0.95; // +5% rychlejší oproti předchozímu stavu
export const GLOBAL_TIME_SCALE = 0.95;
export const INITIAL_RED_OBJECT_SPEED = 3 * GLOBAL_SPEED_SCALE; // 10% zpomalení
export const OBJECT_SPEED_ACCELERATION_SCORE_THRESHOLD = 50;
export const OBJECT_SPEED_ACCELERATION_FACTOR = 1.0 + (1.2 - 1.0) * GLOBAL_SPEED_SCALE; // 10% zpomalení zrychlování
export const SPAWN_WARNING_DURATION = 1000;
export const SPAWN_WARNING_MIN_RADIUS = 5;
export const SPAWN_WARNING_MAX_RADIUS = 15;
export const SPAWN_WARNING_PULSE_SPEED = 0.2 * GLOBAL_SPEED_SCALE; // 10% zpomalení

export const INITIAL_SCORE_INTERVAL = 1000 / GLOBAL_TIME_SCALE; // 10% zpomalení (delší interval = pomalejší skórování)
export const MIN_SCORE_INTERVAL = 100 / GLOBAL_TIME_SCALE; // 10% zpomalení
export const SCORE_ACCELERATION_TIME_THRESHOLD = 20000;
export const SCORE_ACCELERATION_FACTOR = 1.0 - (1.0 - 0.7) * GLOBAL_SPEED_SCALE; // 10% zpomalení zrychlování skóre

export const YELLOW_OBJECT_CHANCE_THRESHOLD_SCORE = 100;
export const YELLOW_OBJECT_SPAWN_CHANCE = 0.3;

export const SHIELD_SIZE = 15;
export const SHIELD_PICKUP_COLOR = '#FF3B3B';
export const PLAYER_WITH_SHIELD_COLOR = '#33FF33';
export const PLAYER_DEFAULT_COLOR = '#00FF00';
export const KNOCKBACK_FORCE = 180;
export const SHIELD_SPAWN_INTERVAL_SCORE = 100;

export const SHIELD_SPAWN_WARNING_DURATION = 1000;
export const SHIELD_SPAWN_WARNING_MIN_RADIUS = 5;
export const SHIELD_SPAWN_WARNING_MAX_RADIUS = 15;
export const SHIELD_SPAWN_WARNING_PULSE_SPEED = 0.2 * GLOBAL_SPEED_SCALE; // 10% zpomalení
export const SHIELD_SPAWN_WARNING_COLOR = 'rgba(255, 80, 100, 0.5)';

export const BOMB_COLLECTIBLE_SIZE = 18;
export const BOMB_COLLECTIBLE_COLOR = '#8B4513';
export const BOMB_FIRST_SPAWN_SCORE = 150;
export const BOMB_SECOND_SPAWN_SCORE = 280;
export const BOMB_SUBSEQUENT_SPAWN_INTERVAL = 100;
export const BOMB_EXPLOSION_RADIUS = 20 * OBJECT_SIZE;
export const BOMB_EXPLOSION_DURATION = 500;
export const BOMB_EXPLOSION_COLOR = 'rgba(255, 165, 0, 0.7)';

export const HOURGLASS_COLLECTIBLE_SIZE = 16;
export const HOURGLASS_COLLECTIBLE_COLOR = '#DAA520';
export const HOURGLASS_FIRST_SPAWN_SCORE = 200;
export const HOURGLASS_SECOND_SPAWN_SCORE = 275;
export const HOURGLASS_SUBSEQUENT_SPAWN_INTERVAL = 75;
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
