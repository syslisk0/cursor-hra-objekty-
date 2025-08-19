'use client';

import { useEffect, useState } from 'react';
import { SKINS } from './skins';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getUser, purchaseSkin, selectSkin } from '../services/userService';

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['green']);
  const [selectedSkinId, setSelectedSkinId] = useState<string>('green');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          setOwnedSkins(Array.isArray(data?.ownedSkins) ? (data.ownedSkins as string[]) : ['green']);
          setSelectedSkinId(typeof data?.selectedSkinId === 'string' ? data.selectedSkinId : 'green');
          setLoading(false);
        });
      } else {
        setUid(null);
        setCoins(0);
        setOwnedSkins(['green']);
        setSelectedSkinId('green');
        setLoading(false);
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  const handleBuy = async (skinId: string, price: number) => {
    if (!uid) { setError('Přihlas se, abys mohl nakupovat.'); return; }
    setError(null);
    try {
      const res = await purchaseSkin(uid, skinId, price);
      setCoins(res.coins);
      setOwnedSkins(res.ownedSkins);
    } catch (e: any) {
      setError(e?.message || 'Nákup se nepovedl.');
    }
  };

  const handleSelect = async (skinId: string) => {
    if (!uid) { setError('Přihlas se, abys mohl vybírat skin.'); return; }
    setError(null);
    await selectSkin(uid, skinId);
    setSelectedSkinId(skinId);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Obchod se skiny</h2>
        <button onClick={onClose} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Zavřít</button>
      </div>
      {loading ? (
        <div>Načítám…</div>
      ) : (
        <>
          <div className="mb-4">Mince: <span className="font-semibold">{coins}</span></div>
          {error && <div className="mb-3 text-red-400">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SKINS.map(skin => {
              const owned = ownedSkins.includes(skin.id);
              const selected = selectedSkinId === skin.id;
              return (
                <div key={skin.id} className={`p-4 rounded-lg bg-gray-700/50 border ${selected ? 'border-green-400' : 'border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    {skin.id === 'diamond' ? (
                      <div className="w-10 h-10 relative">
                        <svg viewBox="0 0 100 120" className="w-10 h-10">
                          <defs>
                            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#E3F6FF"/>
                              <stop offset="45%" stopColor={skin.color}/>
                              <stop offset="100%" stopColor="#198CFF"/>
                            </linearGradient>
                          </defs>
                          <path d="M10,10 L90,10 L80,40 L20,40 Z M20,40 L80,40 L50,110 Z" fill="url(#g)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: skin.color }} />
                    )}
                    <div>
                      <div className="font-semibold">{skin.name}</div>
                      <div className="text-xs uppercase tracking-wide text-gray-300">Vzácnost: {' '}
                        {skin.rarity === 'legendary' && <span className="text-yellow-300">Legendární</span>}
                        {skin.rarity === 'epic' && <span className="text-purple-300">Epická</span>}
                        {skin.rarity === 'rare' && <span className="text-blue-300">Vzácná</span>}
                      </div>
                      <div className="text-sm text-gray-300">Cena: {skin.price} mincí</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {!owned ? (
                      <button onClick={() => handleBuy(skin.id, skin.price)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded">Koupit</button>
                    ) : (
                      <button disabled={selected} onClick={() => handleSelect(skin.id)} className={`px-3 py-1 rounded ${selected ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-500'}`}>{selected ? 'Vybráno' : 'Vybrat'}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


