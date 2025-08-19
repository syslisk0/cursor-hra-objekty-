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
                    ) : skin.id === 'space' ? (
                      <div className="w-10 h-10 rounded-full relative" style={{ backgroundColor: skin.color, boxShadow: '0 0 8px 4px rgba(138,43,226,0.6)' }}>
                        {/* stars */}
                        <div className="absolute inset-0">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute rounded-full" style={{
                              width: i % 5 === 0 ? 2 : 1,
                              height: i % 5 === 0 ? 2 : 1,
                              backgroundColor: i % 3 === 0 ? '#FFD700' : '#FFFFFF',
                              left: `${(i * 17) % 36 + 2}px`,
                              top: `${(i * 29) % 36 + 2}px`
                            }} />
                          ))}
                        </div>
                      </div>
                    ) : skin.id === 'skull' ? (
                      <div className="w-10 h-10 relative">
                        <svg viewBox="0 0 100 120" className="w-10 h-10">
                          {/* Lebka silueta */}
                          <path d="M50,10 C72,10 90,28 90,50 C90,68 78,75 78,85 L78,95 L22,95 L22,85 C22,75 10,68 10,50 C10,28 28,10 50,10 Z" fill="#EEEEEE" stroke="#111" strokeWidth="2"/>
                          {/* Oční důlky */}
                          <circle cx="35" cy="50" r="8" fill="#000" />
                          <circle cx="65" cy="50" r="8" fill="#000" />
                          {/* Nos (obrácený trojúhelník) */}
                          <path d="M50,58 L56,70 L44,70 Z" fill="#000" />
                          {/* Zuby */}
                          <rect x="30" y="88" width="40" height="10" fill="#F5F5F5" stroke="#111" strokeWidth="1.5" />
                          <path d="M35,88 L35,98 M40,88 L40,98 M45,88 L45,98 M50,88 L50,98 M55,88 L55,98 M60,88 L60,98 M65,88 L65,98" stroke="#111" strokeWidth="1" />
                        </svg>
                      </div>
                    ) : skin.id === 'watermelon' ? (
                      <div className="w-10 h-10 relative rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #1D7A3B 0%, #2FAA52 50%, #1D7A3B 100%)', border: '3px solid #1D7A3B' }}>
                        <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: '#FF6F91' }} />
                        {/* seeds clipped within pink area */}
                        <svg viewBox="0 0 40 40" className="absolute inset-[3px] rounded-full">
                          <defs>
                            <clipPath id="clip-pink">
                              <circle cx="20" cy="20" r="20" />
                            </clipPath>
                          </defs>
                          <g clipPath="url(#clip-pink)">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <ellipse key={i} cx={(6 + (i % 5) * 6)} cy={(8 + Math.floor(i / 5) * 10)} rx="1" ry="2" fill="#000" transform="rotate(20, 20, 20)" />
                            ))}
                          </g>
                        </svg>
                      </div>
                    ) : skin.id === 'football' ? (
                      <div className="w-10 h-10 rounded-full bg-white relative">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="absolute" style={{
                            width: 8, height: 8, backgroundColor: '#111',
                            clipPath: 'polygon(50% 0%, 95% 35%, 77% 90%, 23% 90%, 5% 35%)',
                            left: `${6 + i*4}px`, top: `${6 + (i%2)*6}px`
                          }} />
                        ))}
                      </div>
                    ) : skin.id === 'basketball' ? (
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#F28C28', boxShadow: 'inset 0 0 0 2px #7A4A0E' }}>
                        <svg viewBox="0 0 40 40" className="w-10 h-10">
                          <path d="M0 20 H40 M20 0 V40 M6 6 C20 20, 20 20, 34 34 M34 6 C20 20, 20 20, 6 34" stroke="#7A4A0E" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    ) : skin.id === 'tennis' ? (
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#CCFF00' }}>
                        <svg viewBox="0 0 40 40" className="w-10 h-10">
                          <path d="M0 14 C16 14, 24 26, 40 26 M0 26 C16 26, 24 14, 40 14" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    ) : skin.id === 'golf' ? (
                      <div className="w-10 h-10 rounded-full bg-white relative">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="absolute rounded-full" style={{ width: 2, height: 2, backgroundColor: '#ddd', left: `${6 + (i%5)*6}px`, top: `${6 + Math.floor(i/5)*6}px` }} />
                        ))}
                      </div>
                    ) : skin.id === 'volleyball' ? (
                      <div className="w-10 h-10 rounded-full bg-white relative">
                        <svg viewBox="0 0 40 40" className="w-10 h-10">
                          <path d="M2 20 C2 10, 10 2, 20 2" stroke="#d1d5db" strokeWidth="2" fill="none" />
                          <path d="M38 20 C38 10, 30 2, 20 2" stroke="#d1d5db" strokeWidth="2" fill="none" />
                          <path d="M2 20 C2 30, 10 38, 20 38" stroke="#d1d5db" strokeWidth="2" fill="none" />
                          <path d="M38 20 C38 30, 30 38, 20 38" stroke="#d1d5db" strokeWidth="2" fill="none" />
                          <path d="M2 26 H38 M2 14 H38" stroke="#d1d5db" strokeWidth="2" />
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


