export type AbilityKey = 'deathCircle' | 'timelapse' | 'blackHole' | 'heartman';

export const LEVEL_COLOR = ['#6B7280', '#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000'];

// Abilities that are visible/selectable in the shop grid (exclude removed ones if needed)
export const SHOP_ABILITIES: AbilityKey[] = ['deathCircle', 'timelapse', 'heartman'];

export const ABILITY_META: Record<AbilityKey, {
  title: string;
  titleEn: string;
  baseCost: number;
  description: string;
  descriptionEn: string;
  icon: string;
  upgradeDesc: string[];
  upgradeDescEn: string[];
}> = {
  deathCircle: { 
    title: 'Ocas Smrti',
    titleEn: 'Trail of Death',
    baseCost: 20, 
    description: 'Nepřátelé, kteří se dotknou tvé stopy, okamžitě zemřou. Vyšší level zkracuje cooldown.',
    descriptionEn: 'Enemies that touch your cursor trail die instantly. Higher levels reduce cooldown.',
    icon: '⭕',
    upgradeDesc: [
      'Cooldown: ∞',
      'Cooldown: 20s', 
      'Cooldown: 15s', 
      'Cooldown: 10s',
      'Cooldown: 5s',
      'Bez cooldownu'
    ],
    upgradeDescEn: [
      'Cooldown: ∞',
      'Cooldown: 20s',
      'Cooldown: 15s',
      'Cooldown: 10s',
      'Cooldown: 5s',
      'No cooldown'
    ]
  },
  heartman: {
    title: 'Srdcař',
    titleEn: 'Heartman',
    baseCost: 20,
    description: 'Pasivní schopnost: každý level přidá 1 srdíčko na začátku hry.',
    descriptionEn: 'Passive: each level adds +1 heart at the start of the game.',
    icon: '❤️',
    upgradeDesc: [
      'Pasivní schopnost (nelze vybavit do slotu).',
      '+1 srdíčko na start (začínáš se 2)',
      '+2 srdíčka na start (začínáš se 3)',
      '+3 srdíčka na start (začínáš se 4)',
      '+4 srdíčka na start (začínáš s 5)',
      '+5 srdíček na start (začínáš s 6)'
    ],
    upgradeDescEn: [
      'Passive ability (cannot be equipped).',
      '+1 heart at start (you begin with 2)',
      '+2 hearts at start (you begin with 3)',
      '+3 hearts at start (you begin with 4)',
      '+4 hearts at start (you begin with 5)',
      '+5 hearts at start (you begin with 6)'
    ]
  },
  timelapse: { 
    title: 'Timelapse',
    titleEn: 'Timelapse', 
    baseCost: 30, 
    description: 'Pasivně zrychluje přičítání skóre. Vyšší level = větší bonus.',
    descriptionEn: 'Passively increases score gain rate. Higher levels give a bigger bonus.',
    icon: '⚡',
    upgradeDesc: [
      'Žádný bonus',
      '+10% rychlost skóre',
      '+30% rychlost skóre',
      '+60% rychlost skóre', 
      '+100% rychlost skóre',
      '+150% rychlost skóre'
    ],
    upgradeDescEn: [
      'No bonus',
      '+10% score rate',
      '+30% score rate',
      '+60% score rate',
      '+100% score rate',
      '+150% score rate'
    ]
  },
  blackHole: {
    title: 'Černá Díra',
    titleEn: 'Black Hole',
    baseCost: 50,
    description: 'Aktivace mezerníkem vytvoří uprostřed mapy černou díru, která pohltí objekty v dosahu.',
    descriptionEn: 'Activate to create a black hole in the center that pulls in nearby objects.',
    icon: '🕳️',
    upgradeDesc: [
      'Cooldown: ∞',
      'Cooldown: 25s, Trvání: 1s, Dosah: 0.5× bomba',
      'Cooldown: 25s, Trvání: 2s, Dosah: +5%',
      'Cooldown: 25s, Trvání: 3s, Dosah: +10%',
      'Cooldown: 25s, Trvání: 4s, Dosah: +15%',
      'Cooldown: 25s, Trvání: 5s, Dosah: +20%'
    ],
    upgradeDescEn: [
      'Cooldown: ∞',
      'Cooldown: 25s, Duration: 1s, Range: 0.5× bomb',
      'Cooldown: 25s, Duration: 2s, Range: +5%',
      'Cooldown: 25s, Duration: 3s, Range: +10%',
      'Cooldown: 25s, Duration: 4s, Range: +15%',
      'Cooldown: 25s, Duration: 5s, Range: +20%'
    ]
  }
};

export const calcLevelCost = (key: AbilityKey, currentLevel: number) => {
  if (currentLevel >= 5) return null;
  const base = ABILITY_META[key].baseCost;
  return base * Math.pow(2, Math.max(0, currentLevel));
};

export const allLevelCosts = (key: AbilityKey) => {
  const base = ABILITY_META[key].baseCost;
  return [0,1,2,3,4].map(l => base * Math.pow(2, l));
};
