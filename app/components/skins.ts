export type SkinId = 'green' | 'blue' | 'pink' | 'white';

export type Skin = {
  id: SkinId;
  name: string;
  color: string;
  price: number; // v coinech
};

export const SKINS: Skin[] = [
  { id: 'green', name: 'Zelená kulička', color: '#00FF00', price: 0 },
  { id: 'blue', name: 'Modrá kulička', color: '#3399FF', price: 10 },
  { id: 'pink', name: 'Růžová kulička', color: '#FF66CC', price: 10 },
  { id: 'white', name: 'Bílá kulička', color: '#FFFFFF', price: 10 },
];

export function getSkinColor(skinId: SkinId | string | undefined | null): string {
  const found = SKINS.find(s => s.id === skinId);
  return found ? found.color : '#00FF00';
}


