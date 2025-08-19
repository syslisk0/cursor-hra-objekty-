export type SkinId = 'green' | 'blue' | 'pink' | 'white' | 'peach' | 'gold' | 'diamond';

export type Skin = {
  id: SkinId;
  name: string;
  color: string;
  price: number; // v coinech
  rarity: 'rare' | 'epic' | 'legendary';
};

export const SKINS: Skin[] = [
  { id: 'green', name: 'Zelená kulička', color: '#00FF00', price: 0, rarity: 'rare' },
  { id: 'blue', name: 'Modrá kulička', color: '#3399FF', price: 10, rarity: 'rare' },
  { id: 'pink', name: 'Růžová kulička', color: '#FF66CC', price: 10, rarity: 'rare' },
  { id: 'white', name: 'Bílá kulička', color: '#FFFFFF', price: 10, rarity: 'rare' },
  { id: 'peach', name: 'Broskvová kulička', color: '#FFC1A1', price: 10, rarity: 'rare' },
  { id: 'gold', name: 'Zlatá kulička', color: '#FFD000', price: 15, rarity: 'epic' },
  { id: 'diamond', name: 'Diamant', color: '#6EC6FF', price: 50, rarity: 'legendary' },
];

export function getSkinColor(skinId: SkinId | string | undefined | null): string {
  const found = SKINS.find(s => s.id === skinId);
  return found ? found.color : '#00FF00';
}


