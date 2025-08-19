export type SkinId = 'green' | 'blue' | 'pink' | 'white' | 'peach' | 'gold' | 'diamond' | 'skull' | 'space' | 'watermelon' | 'football' | 'basketball' | 'tennis' | 'golf' | 'volleyball';
// add new skins: skull (epic), space (legendary)

export type Skin = {
  id: SkinId;
  name: string;
  color: string;
  price: number; // v coinech
  rarity: 'rare' | 'super_rare' | 'epic' | 'legendary';
  spriteUrl?: string; // volitelný vzdálený sprite pro zobrazení v obchodě
};

export const SKINS: Skin[] = [
  { id: 'green', name: 'Zelená kulička', color: '#00FF00', price: 0, rarity: 'rare' },
  { id: 'blue', name: 'Modrá kulička', color: '#3399FF', price: 10, rarity: 'rare' },
  { id: 'pink', name: 'Růžová kulička', color: '#FF66CC', price: 10, rarity: 'rare' },
  { id: 'white', name: 'Bílá kulička', color: '#FFFFFF', price: 10, rarity: 'rare' },
  { id: 'peach', name: 'Broskvová kulička', color: '#FFC1A1', price: 10, rarity: 'rare' },
  { id: 'football', name: 'Fotbalový', color: '#1E7F3F', price: 12, rarity: 'super_rare', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/26BD.svg' },
  { id: 'basketball', name: 'Basketbalový', color: '#D35400', price: 12, rarity: 'super_rare', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F3C0.svg' },
  { id: 'tennis', name: 'Tenisový', color: '#C8FF00', price: 12, rarity: 'super_rare', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F3BE.svg' },
  { id: 'golf', name: 'Golfový', color: '#A8E6A2', price: 12, rarity: 'super_rare', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/26F3.svg' },
  { id: 'volleyball', name: 'Volejbalový', color: '#F1C40F', price: 12, rarity: 'super_rare', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F3D0.svg' },
  { id: 'gold', name: 'Zlatá kulička', color: '#FFD000', price: 15, rarity: 'epic' },
  { id: 'diamond', name: 'Diamant', color: '#6EC6FF', price: 50, rarity: 'legendary', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F48E.svg' },
  { id: 'skull', name: 'Lebka', color: '#EEEEEE', price: 25, rarity: 'epic', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F480.svg' },
  { id: 'space', name: 'Vesmírná kulička', color: '#0B0F33', price: 60, rarity: 'legendary', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F30C.svg' },
  { id: 'watermelon', name: 'Meloun', color: '#FF6699', price: 20, rarity: 'epic', spriteUrl: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/1F349.svg' },
];

export function getSkinColor(skinId: SkinId | string | undefined | null): string {
  const found = SKINS.find(s => s.id === skinId);
  return found ? found.color : '#00FF00';
}


