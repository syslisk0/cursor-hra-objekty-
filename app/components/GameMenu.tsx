'use client';

import { useCallback, useEffect, useState } from 'react';
import ScoreboardModal from '@/app/components/ScoreboardModal';
import ShopModal from '@/app/components/ShopModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type CoinsState = { coins: number; uid: string | null; username?: string | null };

interface GameMenuProps {
  onStartGame: () => void;
  onStartDeveloper: (targetScore?: number) => void;
}

export default function GameMenu({ onStartGame, onStartDeveloper }: GameMenuProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [coinsState, setCoinsState] = useState<CoinsState>({ coins: 0, uid: null, username: null });

  const toggleInfoModal = useCallback(() => {
    setShowInfoModal(prev => !prev);
  }, []);
  const toggleScoreboard = useCallback(() => {
    setShowScoreboard(prev => !prev);
  }, []);
  const toggleShop = useCallback(() => {
    setShowShop(prev => !prev);
  }, []);

  // Live odběr mincí přihlášeného uživatele
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (u) {
        setCoinsState(cs => ({ ...cs, uid: u.uid }));
        const ref = doc(db, 'users', u.uid);
        unsubUser = onSnapshot(ref, (snap) => {
          const data = snap.data() as any;
          const coins = typeof data?.coins === 'number' ? data.coins : 0;
          const username = typeof data?.username === 'string' ? data.username : null;
          setCoinsState({ coins, uid: u.uid, username });
        });
      } else {
        setCoinsState({ coins: 0, uid: null, username: null });
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 text-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Title section */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Vyhýbej se Objektům!
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-6">
            Ovládej svůj osud, vyhni se překážkám a dosáhni nejvyššího skóre!
          </p>
          
          {/* User info section */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
              <span className="text-2xl">💰</span>
              <span className="text-xl font-bold text-yellow-400">{coinsState.coins?.toLocaleString() || 0}</span>
              <span className="text-sm text-gray-300">mincí</span>
            </div>
            
            {coinsState.username && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                <span className="text-xl">👤</span>
                <span className="text-lg font-semibold text-blue-300">{coinsState.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
          <button
            onClick={onStartGame}
            className="group relative overflow-hidden px-6 py-6 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center gap-2">
              <span className="text-3xl">🎮</span>
              <span>Hrát hru</span>
            </div>
          </button>

          <button
            onClick={toggleInfoModal}
            className="group relative overflow-hidden px-6 py-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center gap-2">
              <span className="text-3xl">ℹ️</span>
              <span>Informace</span>
            </div>
          </button>

          <button
            onClick={toggleScoreboard}
            className="group relative overflow-hidden px-6 py-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center gap-2">
              <span className="text-3xl">🏆</span>
              <span>Žebříček</span>
            </div>
          </button>

          <button
            onClick={toggleShop}
            className="group relative overflow-hidden px-6 py-6 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center gap-2">
              <span className="text-3xl">🛒</span>
              <span>Obchod</span>
            </div>
          </button>
        </div>

        {/* Footer section */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-lg text-gray-400">made by syslisk0</p>
            
            {coinsState.uid && (
              <button
                onClick={() => signOut(auth)}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 text-sm cursor-pointer"
              >
                🚪 Odhlásit se
              </button>
            )}
          </div>
        </div>
      </div>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Informace o hře</h2>
            <p className="text-base sm:text-lg mb-4 text-gray-300">
              Cílem hry je vyhnout se objektům. Když dosáhnete skóre 100 a více, je šance 30 %, že se spawne žlutý objekt, který je sice o 50 % pomalejší, ale následuje vás.
            </p>
            <p className="text-base sm:text-lg mb-4 text-gray-300">
              Místo štítu jsou ve hře srdíčka (ve stylu Minecraft). Začínáš s 1 srdíčkem. Srdíčko se spawnuje při skóre 100, 200, 300 atd. Po sebrání zvýší počet tvých srdcí. Když přijdeš o srdíčko při zásahu, pozadí začne červeně pulzovat a vše se zpomalí na 5 % po dobu 5 sekund, aby ses stihl dostat do bezpečí. Během těchto 5 sekund jsi nesmrtelný.
            </p>
                          <p className="text-base sm:text-lg mb-4 text-gray-300">
                Na mapě se nachází i bomba, která se spawnuje, když dosáhnete skóre 150, 280, 380, 480 atd. Bomba má hnědou barvu a dokáže zničit všechny objekty v daném dosahu.
              </p>
              <p className="text-base sm:text-lg mb-4 text-gray-300">
                Ve hře jsou také hodiny, které se spawnují ve skóre 200, 275, 350 atd. Zpomalí čas na 5 sekund o 60%.
              </p>
              <p className="text-base sm:text-lg mb-4 text-green-300 font-semibold">
                Odměny: Za každých 100 bodů skóre získáš 1 minci.
              </p>
            <button
              onClick={toggleInfoModal}
              className="mt-6 px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 text-lg sm:text-xl font-semibold transition-colors cursor-pointer"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {showScoreboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-[92vw] max-w-7xl max-h-[90vh] overflow-y-auto">
            <ScoreboardModal onClose={toggleScoreboard} />
          </div>
        </div>
      )}

      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-[92vw] max-w-7xl max-h-[90vh] overflow-y-auto">
            <ShopModal onClose={toggleShop} />
          </div>
        </div>
      )}
      {/* Developer button bottom-right */}
      <button
        onClick={() => {
          const pwd = typeof window !== 'undefined' ? window.prompt('Zadej developerské heslo:') : null;
          if (pwd === 'b14b82b83b43') {
            const val = window.prompt('Zadej cílové skóre (číslo):');
            const parsed = val != null ? parseInt(val, 10) : NaN;
            const target = Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
            onStartDeveloper(target);
          }
        }}
        className="absolute bottom-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg"
        title="Developer"
      >
        Developer
      </button>
    </div>
  );
}
