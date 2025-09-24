"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import AbilityCard from './AbilityCard';
import { ABILITY_META, AbilityKey, LEVEL_COLOR, SHOP_ABILITIES } from './abilities';

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const { t, lang } = useLanguage();
  const [uid, setUid] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [levels, setLevels] = useState<{ deathCircle: number; timelapse: number; blackHole: number; heartman: number }>({ deathCircle: 0, timelapse: 0, blackHole: 0, heartman: 0 });
  const [slots, setSlots] = useState<number>(1);
  const [equipped, setEquipped] = useState<(AbilityKey | null)[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuyMenu, setShowBuyMenu] = useState<boolean>(false);
  const buyMenuRef = useRef<HTMLDivElement | null>(null);
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
          const hm = typeof data?.abilities?.heartmanLevel === 'number' ? data.abilities.heartmanLevel : 0;
          setLevels({ deathCircle: dc, timelapse: tl, blackHole: bh, heartman: hm });
          const newSlots = typeof data?.abilitySlots === 'number' ? data.abilitySlots : 1;
          setSlots(newSlots);
          if (newSlots > (lastSlotsRef.current || 1)) {
            setHighlightSlotIdx(newSlots - 1);
            setTimeout(() => setHighlightSlotIdx(null), 1600);
          }
          lastSlotsRef.current = newSlots;
          const raw = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities : [];
          // Black Hole is removed from the game; allow deathCircle, timelapse, heartman
          const normalized = raw.map((v: any) => (v === 'deathCircle' || v === 'timelapse' || v === 'heartman') ? v : null) as (AbilityKey | null)[];
          setEquipped(normalized);
          setLoading(false);
        });
      } else {
        setUid(null);
        setCoins(0);
        setLevels({ deathCircle: 0, timelapse: 0, blackHole: 0, heartman: 0 });
        setLoading(false);
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  // Close coin buy menu on outside click or ESC
  useEffect(() => {
    if (!showBuyMenu) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (buyMenuRef.current && t && !buyMenuRef.current.contains(t)) {
        setShowBuyMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowBuyMenu(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [showBuyMenu]);

  // Preload cash register sound with fallbacks; set src directly to avoid source-type quirks
  useEffect(() => {
    try {
      const audio = document.createElement('audio');
      const can = audio.canPlayType ? audio.canPlayType('audio/mpeg') : '';
      if (!can) { cashSoundRef.current = null; return; }
      audio.preload = 'auto';
      audio.volume = 1.0;
      const primary = '/sounds/11L-A_classic_cash_regis-1755860435960.mp3';
      const fallback1 = '/sounds/level1.mp3';
      const fallback2 = '/sounds/death.mp3';
      audio.src = primary;
      // optional: keep out of layout but in DOM helps some browsers
      audio.style.display = 'none';
      document.body.appendChild(audio);
      const onError = () => {
        try {
          if (audio.src.endsWith('11L-A_classic_cash_regis-1755860435960.mp3')) {
            audio.src = fallback1; audio.load(); return;
          }
          if (audio.src.endsWith('level1.mp3')) {
            audio.src = fallback2; audio.load(); return;
          }
        } catch {}
        cashSoundRef.current = null;
      };
      audio.addEventListener('error', onError);
      cashSoundRef.current = audio;
    } catch (_) {
      cashSoundRef.current = null;
    }
    return () => {
      try {
        const a = cashSoundRef.current;
        if (a && a.parentElement) a.parentElement.removeChild(a);
      } catch {}
      cashSoundRef.current = null;
    };
  }, []);

  const playCash = () => {
    // Respect global mute persisted by Game.tsx
    try { if (localStorage.getItem('bgmMuted') === '1') return; } catch {}
    const a = cashSoundRef.current as HTMLAudioElement | null;
    if (!a) return;
    try {
      // Only try to play when the browser can play it
      const can = a.canPlayType ? a.canPlayType('audio/mpeg') : '';
      if (can === '') return;
      if (a.readyState < 2) {
        const handler = () => {
          try { a.currentTime = 0; void a.play(); } catch {}
          a.removeEventListener('canplaythrough', handler);
        };
        a.addEventListener('canplaythrough', handler);
        // Trigger load just in case
        try { a.load(); } catch {}
        return;
      }
      a.currentTime = 0;
      void a.play();
    } catch (_) { /* ignore */ }
  };

  const nextCost = useMemo(() => {
    return (key: AbilityKey) => {
      const base = ABILITY_META[key].baseCost;
      const currentLevel = key === 'deathCircle' ? levels.deathCircle : key === 'timelapse' ? levels.timelapse : key === 'heartman' ? levels.heartman : levels.blackHole;
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
        // Ignore 'blackHole' in existing equipped list; allow deathCircle, timelapse, heartman
        const current: (AbilityKey | null)[] = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities.map((v: any) => (v === 'deathCircle' || v === 'timelapse' || v === 'heartman') ? v : null) : [];
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
        const current: (AbilityKey | null)[] = Array.isArray(data?.equippedAbilities) ? data.equippedAbilities.map((v: any) => (v === 'deathCircle' || v === 'timelapse' || v === 'heartman') ? v : null) : [];
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

  // Click-to-equip helper: equips active owned abilities to the first free slot.
  const equipByClick = (key: AbilityKey) => {
    const lvl =
      key === 'deathCircle' ? levels.deathCircle :
      key === 'timelapse' ? levels.timelapse :
      key === 'heartman' ? levels.heartman :
      levels.blackHole;
    if (lvl <= 0) return; // not owned
    // Find first free slot
    const firstFree = equippedPadded.slice(0, slots).findIndex(v => v == null);
    if (firstFree === -1) {
      setError(t('shop.error.no_free_slots'));
      return;
    }
    equipAtSlot(firstFree, key);
  };

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
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowBuyMenu((v) => !v); }}
              className="ml-2 w-7 h-7 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/40 text-yellow-300 flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
              title="Koupit coiny"
              aria-label="Koupit coiny"
            >
              +
            </button>
          </div>
          {/* Buy coins fullscreen overlay */}
          {showBuyMenu && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBuyMenu(false)} />
              <div
                ref={buyMenuRef}
                onClick={(e) => e.stopPropagation()}
                className="relative z-[61] w-[92vw] max-w-2xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Koupit coiny</div>
                  <button
                    onClick={() => setShowBuyMenu(false)}
                    className="px-3 py-1 rounded-md bg-gray-800/70 hover:bg-gray-700/70 border border-white/10 text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm text-gray-300 mb-4">Vyber balíček coinů</div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setError('Nákup 50 coinů bude brzy dostupný.'); setShowBuyMenu(false); }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 border border-white/10 hover:border-white/20 transition cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-xl bg-yellow-500/10 border border-yellow-500/25">
                      <svg className="absolute" width="18" height="18" viewBox="0 0 20 20" style={{ left: '18px', top: '16px' }}>
                        <circle cx="10" cy="10" r="8" fill="#FACC15" stroke="#D97706" strokeWidth="2" />
                      </svg>
                      <svg className="absolute opacity-90" width="16" height="16" viewBox="0 0 20 20" style={{ left: '8px', top: '22px' }}>
                        <circle cx="10" cy="10" r="7" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                      </svg>
                      <svg className="absolute opacity-75" width="14" height="14" viewBox="0 0 20 20" style={{ left: '26px', top: '6px' }}>
                        <circle cx="10" cy="10" r="6" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-lg">50</div>
                      <div className="text-xs text-gray-400">Malý balíček</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setError('Nákup 100 coinů bude brzy dostupný.'); setShowBuyMenu(false); }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-amber-900/30 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-500/40 transition cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40">
                      <svg className="absolute" width="18" height="18" viewBox="0 0 20 20" style={{ left: '6px', top: '18px' }}>
                        <circle cx="10" cy="10" r="8" fill="#FACC15" stroke="#D97706" strokeWidth="2" />
                      </svg>
                      <svg className="absolute" width="18" height="18" viewBox="0 0 20 20" style={{ left: '20px', top: '20px' }}>
                        <circle cx="10" cy="10" r="8" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                      </svg>
                      <svg className="absolute" width="18" height="18" viewBox="0 0 20 20" style={{ left: '13px', top: '8px' }}>
                        <circle cx="10" cy="10" r="8" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
                      </svg>
                      <svg className="absolute opacity-90" width="16" height="16" viewBox="0 0 20 20" style={{ left: '2px', top: '6px' }}>
                        <circle cx="10" cy="10" r="7" fill="#FACC15" stroke="#D97706" strokeWidth="2" />
                      </svg>
                      <svg className="absolute opacity-90" width="16" height="16" viewBox="0 0 20 20" style={{ left: '26px', top: '6px' }}>
                        <circle cx="10" cy="10" r="7" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                      </svg>
                      <svg className="absolute opacity-80" width="14" height="14" viewBox="0 0 20 20" style={{ left: '18px', top: '2px' }}>
                        <circle cx="10" cy="10" r="6" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
                      </svg>
                      <span className="absolute -top-1 -right-1 text-[10px] px-1 py-[2px] rounded bg-amber-500 text-black font-extrabold border border-amber-300">x2</span>
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-lg">100</div>
                      <div className="text-xs text-gray-400">Balíček</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setError('Nákup 500 coinů bude brzy dostupný.'); setShowBuyMenu(false); }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 border border-white/10 hover:border-white/20 transition cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-yellow-500/20 border border-yellow-500/30">💰</div>
                    <div className="text-left">
                      <div className="text-white font-bold text-lg">500</div>
                      <div className="text-xs text-gray-400">Velký balíček</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setError('Nákup 1000 coinů bude brzy dostupný.'); setShowBuyMenu(false); }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 border border-white/10 hover:border-white/20 transition cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-yellow-500/20 border border-yellow-500/30">🏦</div>
                    <div className="text-left">
                      <div className="text-white font-bold text-lg">1000</div>
                      <div className="text-xs text-gray-400">Mega balík</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  const level =
                    val === 'deathCircle' ? levels.deathCircle :
                    val === 'timelapse' ? levels.timelapse :
                    val === 'heartman' ? levels.heartman :
                    val === 'blackHole' ? levels.blackHole : 0;
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
                        if (ability === 'deathCircle' || ability === 'timelapse' || ability === 'heartman') {
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
                            <div className="text-xs text-gray-300 mb-2">{t('hud.level')} {level}</div>
                            <button 
                              onClick={() => unequipSlot(idx)} 
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 bg-red-600/80 hover:bg-red-500 rounded text-xs cursor-pointer"
                            >
                              ✕ {t('shop.release')}
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
                              {isDragOver && isValidDropTarget ? t('shop.dropHere') : isDragOver && !isValidDropTarget ? t('shop.cannotPlace') : t('shop.emptySlot')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {isDragOver ? '' : t('shop.drag')}
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
                    <div className="w-14 h-14 rounded-xl mb-2 relative bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-black shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span>💰</span>
                      <svg className="absolute right-1 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="7" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                      </svg>
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
              {(SHOP_ABILITIES as AbilityKey[]).map((key) => {
                const lvl =
                  key === 'deathCircle' ? levels.deathCircle :
                  key === 'timelapse' ? levels.timelapse :
                  key === 'heartman' ? levels.heartman :
                  levels.blackHole;
                const isEquipped = equipped.includes(key);
                return (
                  <AbilityCard
                    key={key}
                    ability={key}
                    level={lvl}
                    isEquipped={isEquipped}
                    isDragging={draggedAbility === key}
                    onUpgrade={(ab) => upgrade(ab)}
                    onSelect={(ab) => equipByClick(ab)}
                    onDragStart={(ab, _e) => setDraggedAbility(ab)}
                    onDragEnd={() => { setDraggedAbility(null); setDragOverSlotIdx(null); }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


