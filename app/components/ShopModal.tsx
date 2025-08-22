"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';

interface ShopModalProps {
  onClose: () => void;
}

type AbilityKey = 'deathCircle' | 'timelapse' | 'blackHole';

const ABILITY_META: Record<AbilityKey, { 
  title: string; 
  titleEn?: string;
  baseCost: number; 
  description: string; 
  icon: string;
  upgradeDesc: string[];
}> = {
  deathCircle: { 
    title: 'Kruh Smrti',
    titleEn: 'Ring of Death',
    baseCost: 20, 
    description: 'Obkroužením označíš a zničíš objekt. Vyšší level zkracuje cooldown.',
    icon: '⭕',
    upgradeDesc: [
      'Cooldown: ∞',
      'Cooldown: 20s',
      'Cooldown: 15s', 
      'Cooldown: 10s',
      'Cooldown: 5s',
      'Bez cooldownu'
    ]
  },
  timelapse: { 
    title: 'Timelapse', 
    baseCost: 30, 
    description: 'Pasivně zrychluje přičítání skóre. Vyšší level = větší bonus.',
    icon: '⚡',
    upgradeDesc: [
      'Žádný bonus',
      '+10% rychlost skóre',
      '+30% rychlost skóre',
      '+60% rychlost skóre', 
      '+100% rychlost skóre',
      '+150% rychlost skóre'
    ]
  },
  blackHole: {
    title: 'Černá Díra',
    titleEn: 'Black Hole',
    baseCost: 50,
    description: 'Aktivace mezerníkem vytvoří uprostřed mapy černou díru, která pohltí objekty v dosahu.',
    icon: '🕳️',
    upgradeDesc: [
      'Cooldown: ∞',
      'Cooldown: 25s, Trvání: 1s, Dosah: 0.5× bomba',
      'Cooldown: 25s, Trvání: 2s, Dosah: +5%'
      , 'Cooldown: 25s, Trvání: 3s, Dosah: +10%'
      , 'Cooldown: 25s, Trvání: 4s, Dosah: +15%'
      , 'Cooldown: 25s, Trvání: 5s, Dosah: +20%'
    ]
  }
};

const LEVEL_COLOR = ['#6B7280', '#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000'];

export default function ShopModal({ onClose }: ShopModalProps) {
  const { t, lang } = useLanguage();
  const [uid, setUid] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [levels, setLevels] = useState<{ deathCircle: number; timelapse: number; blackHole: number }>({ deathCircle: 0, timelapse: 0, blackHole: 0 });
  const [slots, setSlots] = useState<number>(1);
  const [equipped, setEquipped] = useState<(AbilityKey | null)[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastSlotsRef = useRef<number>(1);
  const [highlightSlotIdx, setHighlightSlotIdx] = useState<number | null>(null);
  const [draggedAbility, setDraggedAbility] = useState<AbilityKey | null>(null);
  const [dragOverSlotIdx, setDragOverSlotIdx] = useState<number | null>(null);
  const cashSoundRef = useRef<HTMLAudioElement | null>(null);

  // Auto-skrývání chybové hlášky po 5 sekundách
  useEffect(() => {
    if (!error) return;
    const timeoutId = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (user) {
        setUid(user.uid);
        const ref = doc(db, 'users', user.uid);
        unsubUser = onSnapshot(ref, (snap) => {
          const data = snap.data() as any;
          setCoins(typeof data?.coins === 'number' ? data.coins : 0);
          const dc = typeof data?.abilities?.deathCircleLevel === 'number' ? data.abilities.deathCircleLevel : 0;
          const tl = typeof data?.abilities?.timelapseLevel === 'number' ? data.abilities.timelapseLevel : 0;
          const bh = typeof data?.abilities?.blackHoleLevel === 'number' ? data.abilities.blackHoleLevel : 0;
          setLevels({ deathCircle: dc, timelapse: tl, blackHole: bh });
          const newSlots = typeof data?.abilitySlots === 'number' ? data.abilitySlots : 1;
          setSlots(newSlots);
          if (newSlots > (lastSlotsRef.current || 1)) {
            setHighlightSlotIdx(newSlots - 1);
            setTimeout(() => setHighlightSlotIdx(null), 1600);
          }
          lastSlotsRef.current = newSlots;
          const raw = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities : [];
          // Black Hole is removed from the game; ignore if present in user data
          const normalized = raw.map((v: any) => (v === 'deathCircle' || v === 'timelapse') ? v : null) as (AbilityKey | null)[];
          setEquipped(normalized);
          setLoading(false);
        });
      } else {
        setUid(null);
        setCoins(0);
        setLevels({ deathCircle: 0, timelapse: 0, blackHole: 0 });
        setLoading(false);
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  // Preload cash register sound
  useEffect(() => {
    try {
      const audio = new Audio('/sounds/11L-A_classic_cash_regis-1755860435960.mp3');
      audio.preload = 'auto';
      audio.volume = 1.0;
      cashSoundRef.current = audio;
    } catch (_) {
      cashSoundRef.current = null;
    }
  }, []);

  const playCash = () => {
    const a = cashSoundRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      void a.play();
    } catch (_) { /* ignore */ }
  };

  const nextCost = useMemo(() => {
    return (key: AbilityKey) => {
      const base = ABILITY_META[key].baseCost;
      const currentLevel = key === 'deathCircle' ? levels.deathCircle : key === 'timelapse' ? levels.timelapse : levels.blackHole;
      if (currentLevel >= 5) return null;
      // lvl1 stojí base, lvl2 2x, lvl3 4x ...
      return base * Math.pow(2, Math.max(0, currentLevel));
    };
  }, [levels]);

  // Dynamická cena dalšího slotu: každý další slot stojí 2x více než předchozí
  const slotCost = useMemo(() => {
    const base = 500;
    return base * Math.pow(2, Math.max(0, (slots - 1)));
  }, [slots]);

  const upgrade = async (key: AbilityKey) => {
    if (!uid) { setError(t('shop.error.login')); return; }
    setError(null);
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const curCoins = typeof data?.coins === 'number' ? data.coins : 0;
        const currentLevel = typeof data?.abilities?.[key + 'Level'] === 'number' ? data.abilities[key + 'Level'] : 0;
        if (currentLevel >= 5) throw new Error('MAX_LEVEL');
        const cost = ABILITY_META[key].baseCost * Math.pow(2, Math.max(0, currentLevel));
        if (curCoins < cost) throw new Error('NOT_ENOUGH_COINS');
        const newLevel = currentLevel + 1;
        const abilities = { ...(data.abilities || {}), [key + 'Level']: newLevel };
        tx.update(ref, { coins: curCoins - cost, abilities, updatedAt: serverTimestamp() });
      });
      playCash();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg === 'NOT_ENOUGH_COINS') setError(t('shop.error.not_enough_coins'));
      else if (msg === 'MAX_LEVEL') setError(t('shop.maxLevel'));
      else if (msg === 'USER_NOT_FOUND') setError(t('shop.error.user_not_found'));
      else setError(t('shop.error.action_failed'));
    }
  };

  const equipAtSlot = async (slotIndex: number, key: AbilityKey) => {
    if (!uid) { setError(t('shop.error.login')); return; }
    setError(null);
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const slotsAvail = typeof data?.abilitySlots === 'number' ? data.abilitySlots : 1;
        if (slotIndex < 0 || slotIndex >= slotsAvail) throw new Error('INVALID_SLOT');
        const level = typeof data?.abilities?.[key + 'Level'] === 'number' ? data.abilities[key + 'Level'] : 0;
        if (level <= 0) throw new Error('ABILITY_NOT_OWNED');
        // Ignore 'blackHole' in existing equipped list
        const current: (AbilityKey | null)[] = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities.map((v: any) => (v === 'deathCircle' || v === 'timelapse') ? v : null) : [];
        while (current.length < slotsAvail) current.push(null);
        const prevIndex = current.findIndex((v) => v === key);
        if (prevIndex !== -1) current[prevIndex] = null;
        current[slotIndex] = key;
        while (current.length > 0 && current[current.length - 1] == null) current.pop();
        tx.update(ref, { equippedAbilities: current, updatedAt: serverTimestamp() });
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg === 'ABILITY_NOT_OWNED') setError(t('shop.error.ability_not_owned'));
      else if (msg === 'INVALID_SLOT') setError(t('shop.error.invalid_slot'));
      else setError(t('shop.error.action_failed'));
    }
  };

  const unequipSlot = async (slotIndex: number) => {
    if (!uid) { setError(t('shop.error.login')); return; }
    setError(null);
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const slotsAvail = typeof data?.abilitySlots === 'number' ? data.abilitySlots : 1;
        const current: (AbilityKey | null)[] = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities.map((v: any) => (v === 'deathCircle' || v === 'timelapse') ? v : null) : [];
        while (current.length < slotsAvail) current.push(null);
        if (slotIndex >= 0 && slotIndex < current.length) current[slotIndex] = null;
        while (current.length > 0 && current[current.length - 1] == null) current.pop();
        tx.update(ref, { equippedAbilities: current, updatedAt: serverTimestamp() });
      });
    } catch (_e) {
      setError(t('shop.error.unequip_failed'));
    }
  };

  const buySlot = async () => {
    if (!uid) { setError(t('shop.error.login')); return; }
    setError(null);
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const curCoins = typeof data?.coins === 'number' ? data.coins : 0;
        const currentSlots = typeof data?.abilitySlots === 'number' ? data.abilitySlots : 1;
        const cost = 500 * Math.pow(2, Math.max(0, (currentSlots - 1)));
        if (curCoins < cost) throw new Error('NOT_ENOUGH_COINS');
        tx.update(ref, { coins: curCoins - cost, abilitySlots: currentSlots + 1, updatedAt: serverTimestamp() });
      });
      playCash();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg === 'NOT_ENOUGH_COINS') setError(t('shop.error.not_enough_coins'));
      else if (msg === 'USER_NOT_FOUND') setError(t('shop.error.user_not_found'));
      else setError(t('shop.error.action_failed'));
    }
  };

  const equippedPadded = useMemo(() => {
    const arr = [...equipped];
    while (arr.length < slots) arr.push(null);
    return arr;
  }, [equipped, slots]);

  return (
    <div className="text-white min-h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-2xl">
            🛒
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('shop.title')}
            </h2>
            <p className="text-sm text-gray-400">{t('shop.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
          </div>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            ✕ {t('shop.close')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <span className="ml-3 text-gray-300">{t('shop.loading')}</span>
        </div>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {error}
            </div>
          )}

          {/* Sloty sekce */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-lg">
                🎯
              </div>
              <div>
                <h3 className="text-2xl font-bold">{t('shop.section.slots')}</h3>
                <p className="text-gray-400">{t('shop.section.slots.desc')}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-lg font-semibold">{t('shop.activeSlots')}</span>
                <span className="px-3 py-1 bg-blue-600 rounded-full text-white font-bold">{slots}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {equippedPadded.map((val, idx) => {
                  const meta = val ? ABILITY_META[val] : null;
                  const level = val === 'deathCircle' ? levels.deathCircle : val === 'timelapse' ? levels.timelapse : val === 'blackHole' ? levels.blackHole : 0;
                  const color = val ? LEVEL_COLOR[level] : LEVEL_COLOR[0];
                  const highlight = highlightSlotIdx === idx;
                  const isDragOver = dragOverSlotIdx === idx;
                  const isValidDropTarget = draggedAbility && (!val || val !== draggedAbility);
                  
                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlotIdx(idx);
                      }}
                      onDragLeave={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX;
                        const y = e.clientY;
                        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                          setDragOverSlotIdx(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverSlotIdx(null);
                        setDraggedAbility(null);
                        const ability = e.dataTransfer.getData('text/ability') as AbilityKey;
                        // Block equipping removed ability 'blackHole'
                        if (ability === 'deathCircle' || ability === 'timelapse') {
                          equipAtSlot(idx, ability);
                        }
                      }}
                      className={`relative group h-[140px] w-full rounded-xl border-2 transition-all duration-300 cursor-pointer
                        ${val 
                          ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 border-white/20 hover:border-white/40' 
                          : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-dashed border-gray-500/50 hover:border-gray-400/50'
                        }
                        ${highlight ? 'ring-4 ring-green-400/50 animate-pulse border-green-400' : ''}
                        ${isDragOver && isValidDropTarget 
                          ? 'ring-4 ring-blue-400/70 border-blue-400 bg-blue-500/20 scale-105' 
                          : isDragOver && !isValidDropTarget 
                          ? 'ring-4 ring-red-400/70 border-red-400 bg-red-500/20' 
                          : ''
                        }
                      `}
                    >
                      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
                        {val ? (
                          <>
                            <div 
                              className="w-14 h-14 rounded-xl mb-2 flex items-center justify-center text-2xl font-bold border-2 border-white/20 shadow-lg"
                              style={{ backgroundColor: color }}
                            >
                              {meta?.icon}
                            </div>
                            <div className="text-sm font-semibold mb-1">{lang === 'en' ? (meta?.titleEn || meta?.title) : meta?.title}</div>
                            <div className="text-xs text-gray-300 mb-2">Level {level}</div>
                            <button 
                              onClick={() => unequipSlot(idx)} 
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 bg-red-600/80 hover:bg-red-500 rounded text-xs cursor-pointer"
                            >
                              ✕ Uvolnit
                            </button>
                          </>
                        ) : (
                          <>
                            <div className={`w-14 h-14 rounded-xl mb-2 border-2 border-dashed flex items-center justify-center text-3xl transition-all duration-300
                              ${isDragOver && isValidDropTarget 
                                ? 'border-blue-400 bg-blue-400/20 text-blue-300' 
                                : isDragOver && !isValidDropTarget
                                ? 'border-red-400 bg-red-400/20 text-red-300'
                                : 'border-gray-500/50 bg-gray-600/30 text-gray-500'
                              }`}
                            >
                              {isDragOver && isValidDropTarget ? '⬇' : isDragOver && !isValidDropTarget ? '❌' : '+'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {isDragOver && isValidDropTarget ? 'Pusť zde' : isDragOver && !isValidDropTarget ? 'Nelze umístit' : 'Prázdný slot'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {isDragOver ? '' : 'Přetáhni schopnost'}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Drop zone indicator */}
                      {isDragOver && isValidDropTarget && (
                        <div className="absolute inset-0 rounded-xl bg-blue-400/10 border-2 border-blue-400 border-dashed animate-pulse" />
                      )}
                    </div>
                  );
                })}
                
                {/* Tlačítko koupit slot jako další slot */}
                <div 
                  className="relative group h-[140px] w-full rounded-xl border-2 border-dashed border-yellow-500/50 hover:border-yellow-400/70 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 hover:from-yellow-400/20 hover:to-orange-400/20 transition-all duration-300 cursor-pointer"
                  onClick={() => { if (coins >= slotCost) buySlot(); else setError(t('shop.error.not_enough_coins')); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="p-4 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-xl mb-2 bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-black shadow-lg group-hover:scale-110 transition-transform duration-300">
                      💰
                    </div>
                    <div className="text-sm font-semibold mb-1 text-yellow-400">{t('shop.buySlot')}</div>
                    <div className="text-xs text-gray-300 mb-1">{slotCost.toLocaleString()} {t('shop.coins')}</div>
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">{t('shop.clickToBuy')}</div>
                  </div>
                  
                  {/* Efekt při hover */}
                  <div className="absolute inset-0 rounded-xl bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Schopnosti sekce */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-lg">
                ⚡
              </div>
              <div>
                <h3 className="text-2xl font-bold">{t('shop.section.abilities')}</h3>
                <p className="text-gray-400">{t('shop.section.abilities.desc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(['deathCircle','timelapse'] as AbilityKey[]).map((key) => {
                const lvl = key === 'deathCircle' ? levels.deathCircle : key === 'timelapse' ? levels.timelapse : levels.blackHole;
                const cost = nextCost(key);
                const color = LEVEL_COLOR[lvl];
                const isOwned = lvl > 0;
                const meta = ABILITY_META[key];
                const currentDesc = meta.upgradeDesc[lvl];
                const nextDesc = lvl < 5 ? meta.upgradeDesc[lvl + 1] : null;
                const isEquipped = equipped.includes(key);
                
                return (
                  <div 
                    key={key} 
                    className={`group relative h-[140px] w-full rounded-xl border-2 transition-all duration-300 overflow-hidden
                      ${isOwned 
                        ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 border-white/20 hover:border-white/40 cursor-grab active:cursor-grabbing transform hover:scale-105' 
                        : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-600/50 hover:border-gray-500/50'
                      }
                      ${draggedAbility === key ? 'opacity-50 scale-95' : ''}
                    `}
                    draggable={isOwned}
                    onDragStart={(e) => { 
                      if (isOwned) {
                        e.dataTransfer.setData('text/ability', key);
                        setDraggedAbility(key);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedAbility(null);
                      setDragOverSlotIdx(null);
                    }}
                  >
                    {/* Level progress bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${(lvl / 5) * 100}%` }}
                      />
                    </div>

                    {/* Equipped indicator */}
                    {isEquipped && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white z-10">
                        ✓
                      </div>
                    )}

                    <div className="p-4 h-full flex flex-col items-center justify-center text-center">
                      <div 
                        className="w-14 h-14 rounded-xl mb-2 flex items-center justify-center text-2xl font-bold border-2 border-white/20 shadow-lg flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {meta.icon}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-bold mb-1">{lang === 'en' ? (meta.titleEn || meta.title) : meta.title}</h4>
                        <span className="px-2 py-0.5 bg-gray-700/50 rounded-full text-xs font-semibold mb-1">
                          {lvl}/5
                        </span>
                        
                        {isOwned && (
                          <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">🖱️ {t('shop.drag')}</div>
                        )}
                      </div>
                    </div>

                    {/* Hover overlay s detaily */}
                    <div className="absolute inset-0 bg-gray-900/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-center">
                      <div className="text-center mb-3">
                        <h4 className="text-sm font-bold mb-1">{meta.title}</h4>
                        <p className="text-xs text-gray-300 mb-2">{meta.description}</p>
                        
                        <div className="space-y-1">
                          <div className="text-xs"><span className="text-gray-400">{t('shop.now')}</span><span className="text-blue-300 ml-1">{currentDesc}</span></div>
                          {nextDesc && (
                            <div className="text-xs"><span className="text-gray-400">{t('shop.next')}</span><span className="text-green-300 ml-1">{nextDesc}</span></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        {lvl === 0 ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              upgrade(key);
                            }} 
                            className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded text-xs font-semibold transition-all duration-200 cursor-pointer"
                          >
                            💰 {t('shop.buy')} ({meta.baseCost})
                          </button>
                        ) : cost !== null ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              upgrade(key);
                            }} 
                            className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded text-xs font-semibold transition-all duration-200 cursor-pointer"
                          >
                            ⬆️ {t('shop.upgrade')} ({cost})
                          </button>
                        ) : (
                          <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-xs font-semibold opacity-75">
                            ✨ {t('shop.maxLevel')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


