export type SkinId = 'green' | 'blue' | 'pink' | 'white' | 'peach' | 'gold' | 'diamond' | 'skull' | 'space' | 'watermelon' | 'football' | 'basketball' | 'tennis' | 'golf' | 'volleyball';
// add new skins: skull (epic), space (legendary)

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
  { id: 'skull', name: 'Lebka', color: '#EEEEEE', price: 25, rarity: 'epic' },
  { id: 'space', name: 'Vesmírná kulička', color: '#0B0F33', price: 60, rarity: 'legendary' },
  { id: 'watermelon', name: 'Meloun', color: '#FF6699', price: 20, rarity: 'epic' },
  { id: 'football', name: 'Fotbalový míč', color: '#FFFFFF', price: 12, rarity: 'rare' },
  { id: 'basketball', name: 'Basketbalový míč', color: '#F28C28', price: 12, rarity: 'rare' },
  { id: 'tennis', name: 'Tenisový míček', color: '#CCFF00', price: 12, rarity: 'rare' },
  { id: 'golf', name: 'Golfový míček', color: '#F8F8F8', price: 12, rarity: 'rare' },
  { id: 'volleyball', name: 'Volejbalový míč', color: '#FFFFFF', price: 12, rarity: 'rare' },
];

export function getSkinColor(skinId: SkinId | string | undefined | null): string {
  const found = SKINS.find(s => s.id === skinId);
  return found ? found.color : '#00FF00';
}


