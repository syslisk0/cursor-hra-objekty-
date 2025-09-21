"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/app/components/LanguageProvider';

interface PreGameStoreModalProps {
  onClose: () => void;
  onApply: (buffs: { extraHearts: number; luckStacks: number }) => void;
}

// Pricing
const HEART_COST = 50; // per +1 heart for this run
const LUCK_COST = 50;  // per +1 stack (+5% drop chance)

export default function PreGameStoreModal({ onClose, onApply }: PreGameStoreModalProps) {
  const { t } = useLanguage();
  const [uid, setUid] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [extraHearts, setExtraHearts] = useState<number>(0); // unlimited
  const [luckStacks, setLuckStacks] = useState<number>(0);   // unlimited, each +5%
  const cashSoundRef = useRef<HTMLAudioElement | null>(null);

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
          setLoading(false);
        });
      } else {
        setUid(null);
        setCoins(0);
        setLoading(false);
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  // Preload cash sound
  useEffect(() => {
    try {
      const a = new Audio();
      const can = a.canPlayType ? a.canPlayType('audio/mpeg') : '';
      if (!can) { cashSoundRef.current = null; return; }
      a.src = '/sounds/11L-A_classic_cash_regis-1755860435960.mp3';
      a.preload = 'auto';
      a.volume = 1.0;
      cashSoundRef.current = a;
    } catch { cashSoundRef.current = null; }
    return () => { cashSoundRef.current = null; };
  }, []);

  const playCash = () => {
    try { if (localStorage.getItem('bgmMuted') === '1') return; } catch {}
    const a = cashSoundRef.current; if (!a) return;
    try { a.currentTime = 0; void a.play(); } catch {}
  };

  const canBuyHeart = coins >= HEART_COST;
  const canBuyLuck = coins >= LUCK_COST;

  const buyHeart = async () => {
    if (!uid) { setError(t('shop.error.login')); return; }
    if (!canBuyHeart) { setError(t('shop.error.not_enough_coins')); return; }
    setError(null);
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const curCoins = typeof data?.coins === 'number' ? data.coins : 0;
        if (curCoins < HEART_COST) throw new Error('NOT_ENOUGH_COINS');
        tx.update(ref, { coins: curCoins - HEART_COST, updatedAt: serverTimestamp() });
      });
      setExtraHearts(v => v + 1);
      playCash();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg === 'NOT_ENOUGH_COINS') setError(t('shop.error.not_enough_coins'));
      else if (msg === 'USER_NOT_FOUND') setError(t('shop.error.user_not_found'));
      else setError(t('shop.error.action_failed'));
    }
  };

  const buyLuck = async () => {
    if (!uid) { setError(t('shop.error.login')); return; }
    if (!canBuyLuck) { setError(t('shop.error.not_enough_coins')); return; }
    setError(null);
    const cost = LUCK_COST;
    const ref = doc(db, 'users', uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('USER_NOT_FOUND');
        const data = snap.data() as any;
        const curCoins = typeof data?.coins === 'number' ? data.coins : 0;
        if (curCoins < cost) throw new Error('NOT_ENOUGH_COINS');
        tx.update(ref, { coins: curCoins - cost, updatedAt: serverTimestamp() });
      });
      setLuckStacks(v => v + 1);
      playCash();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg === 'NOT_ENOUGH_COINS') setError(t('shop.error.not_enough_coins'));
      else if (msg === 'USER_NOT_FOUND') setError(t('shop.error.user_not_found'));
      else setError(t('shop.error.action_failed'));
    }
  };

  const totalSummary = useMemo(() => {
    const luckPct = luckStacks * 5;
    return { hearts: extraHearts, luckPct };
  }, [extraHearts, luckStacks]);

  const hasPurchase = useMemo(() => (extraHearts > 0 || luckStacks > 0), [extraHearts, luckStacks]);

  return (
    <div className="text-white min-h-[480px]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-2xl">🛍️</div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Pre-Game Store</h2>
            <p className="text-sm text-gray-400">Nakup si za coiny extra věci pouze pro tuto hru</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400"></div>
          <span className="ml-3 text-gray-300">Načítání...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extra Hearts */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-red-500/30 rounded-lg flex items-center justify-center">💖</div>
                <div>
                  <h3 className="text-xl font-bold">Extra srdce</h3>
                  <p className="text-gray-400 text-sm">+1 startovní srdce pro tento pokus (bez limitu)</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-300">Zakoupeno: <span className="text-white font-semibold">{extraHearts}</span></div>
                <button
                  onClick={buyHeart}
                  disabled={!canBuyHeart}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Koupit ({HEART_COST}💰)
                </button>
              </div>
            </div>

            {/* Luck */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center">🍀</div>
                <div>
                  <h3 className="text-xl font-bold">Štěstí</h3>
                  <p className="text-gray-400 text-sm">+5% šance na drop za nákup (bez limitu)</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-300">Nákupy: <span className="text-white font-semibold">{luckStacks}</span></div>
                <button
                  onClick={buyLuck}
                  disabled={!canBuyLuck}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  Koupit ({LUCK_COST}💰)
                </button>
              </div>
            </div>
          </div>

          {/* Summary and actions */}
          <div className="mt-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-gray-200 text-sm mb-3">
              <div className="font-semibold">Shrnutí pro tento pokus:</div>
              <div>+{totalSummary.hearts} ❤️ srdcí navíc</div>
              <div>+{totalSummary.luckPct}% 🍀 šance na drop</div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              {hasPurchase ? (
                <button
                  onClick={() => onApply({ extraHearts, luckStacks })}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl font-bold text-black cursor-pointer"
                >
                  Začít hru
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700/60 hover:bg-gray-600/60 rounded-xl font-semibold text-white border border-white/10 hover:border-white/20 cursor-pointer"
                  aria-label="Skip"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
