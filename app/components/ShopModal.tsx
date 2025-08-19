'use client';

import { useEffect, useState } from 'react';
import { SKINS, type Skin } from './skins';
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...SKINS]
              .sort((a: Skin, b: Skin) => {
                const order: Record<Skin['rarity'], number> = { rare: 0, super_rare: 1, epic: 2, legendary: 3 };
                if (order[a.rarity] !== order[b.rarity]) return order[a.rarity] - order[b.rarity];
                return a.price - b.price;
              })
              .map(skin => {
              const owned = ownedSkins.includes(skin.id);
              const selected = selectedSkinId === skin.id;
              return (
                <div key={skin.id} className={`p-4 rounded-lg bg-gray-700/50 border ${selected ? 'border-green-400' : 'border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    {/* Custom previews for certain skins to match in-game look */}
                    {skin.id === 'space' ? (
                      <div className="w-10 h-10 rounded-full relative overflow-hidden" style={{ backgroundColor: '#5B2C6F' }}>
                        <div className="absolute inset-1 rounded-full" style={{ backgroundColor: '#0B0F33' }} />
                        {/* stars */}
                        <div className="absolute inset-0">
                          <div className="absolute w-1 h-1 bg-white rounded-full" style={{ left: '20%', top: '30%' }} />
                          <div className="absolute w-1 h-1 bg-yellow-300 rounded-full" style={{ left: '45%', top: '20%' }} />
                          <div className="absolute w-1 h-1 bg-white rounded-full" style={{ left: '65%', top: '55%' }} />
                          <div className="absolute w-1 h-1 bg-yellow-300 rounded-full" style={{ left: '30%', top: '70%' }} />
                          <div className="absolute w-1 h-1 bg-white rounded-full" style={{ left: '70%', top: '35%' }} />
                        </div>
                      </div>
                    ) : skin.id === 'golf' ? (
                      <div className="w-10 h-10 rounded-full relative overflow-hidden flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full relative overflow-hidden bg-white">
                          {/* dimples grid */}
                          <div className="absolute inset-0">
                            {Array.from({ length: 4 }).map((_, ri) => (
                              <div key={ri} className="absolute left-1 right-1 h-[2px] opacity-20 bg-black" style={{ top: `${(ri + 1) * 18}%` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : skin.id === 'watermelon' ? (
                      <div className="w-10 h-10 rounded-full relative overflow-hidden flex items-center justify-center">
                        <canvas
                          className="w-9 h-9"
                          ref={(el) => {
                            if (!el) return;
                            const size = 64;
                            el.width = size; el.height = size;
                            const ctx = el.getContext('2d');
                            if (!ctx) return;
                            // dynamic import to avoid SSR issues
                            // Simple local re-implementation to avoid circular import
                            const draw = (c: CanvasRenderingContext2D) => {
                              const cx = size / 2; const cy = size / 2; const r = size / 2 - 1;
                              // Basic renderer matching in-game look (approximate, same algorithm should be used ideally)
                              // Rind gradient
                              const rindGrad = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
                              rindGrad.addColorStop(0, '#3DDB84');
                              rindGrad.addColorStop(0.6, '#2ECC71');
                              rindGrad.addColorStop(1, '#1E8449');
                              c.fillStyle = rindGrad;
                              c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
                              // Stripes
                              c.save(); c.strokeStyle = 'rgba(0,80,0,0.45)';
                              for (let i = 0; i < 9; i++) { c.lineWidth = Math.max(1, r * (0.06 + (i % 2) * 0.03)); const ang = (i / 9) * Math.PI * 2 + 0.2; c.beginPath(); c.arc(cx, cy, r * 0.92, ang - 0.18, ang + 0.18); c.stroke(); }
                              c.restore();
                              // Pith
                              c.fillStyle = '#F7F9F9'; c.beginPath(); c.arc(cx, cy, r * 0.86, 0, Math.PI * 2); c.fill();
                              // Flesh
                              const fleshGrad = c.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r * 0.82);
                              fleshGrad.addColorStop(0, '#FF758C'); fleshGrad.addColorStop(1, '#FF5E7A');
                              c.fillStyle = fleshGrad; c.beginPath(); c.arc(cx, cy, r * 0.8, 0, Math.PI * 2); c.fill();
                              // Seeds deterministic
                              let s = 13371337 >>> 0; const rnd = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 0xffffffff; };
                              for (let i = 0; i < 16; i++) {
                                const minRad = 0.12; const maxRad = 0.8 - 0.08; const radial = minRad + rnd() * (maxRad - minRad); const angle = rnd() * Math.PI * 2; const rot = rnd() * Math.PI * 2; const dist = r * radial; const sx = cx + Math.cos(angle) * dist; const sy = cy + Math.sin(angle) * dist; const sw = Math.max(1, r * 0.11); const sh = Math.max(1, r * 0.2);
                                c.save(); c.translate(sx, sy); c.rotate(rot); c.fillStyle = '#2C3E50'; c.beginPath(); c.ellipse(0, 0, sw * 0.5, sh * 0.5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.65)'; c.beginPath(); c.ellipse(-sw * 0.15, -sh * 0.15, sw * 0.12, sh * 0.12, 0, 0, Math.PI * 2); c.fill(); c.restore();
                              }
                              // Gloss
                              const gloss = c.createRadialGradient(cx - r * 0.5, cy - r * 0.6, 0, cx - r * 0.5, cy - r * 0.6, r);
                              gloss.addColorStop(0, 'rgba(255,255,255,0.25)'); gloss.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gloss; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
                            };
                            draw(ctx);
                          }}
                        />
                      </div>
                    ) : skin.spriteUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                        <img src={skin.spriteUrl} alt={skin.name} className="w-full h-full object-contain" />
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
                        {skin.rarity === 'super_rare' && <span className="text-green-300">Super vzácná</span>}
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


