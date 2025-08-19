'use client';

import { useCallback, useEffect, useState } from 'react';
import ScoreboardModal from '@/app/components/ScoreboardModal';
import ShopModal from '@/app/components/ShopModal';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type CoinsState = { coins: number; uid: string | null };

interface GameMenuProps {
  onStartGame: () => void;
  onStartDeveloper: (targetScore?: number) => void;
}

export default function GameMenu({ onStartGame, onStartDeveloper }: GameMenuProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [coinsState, setCoinsState] = useState<CoinsState>({ coins: 0, uid: null });

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
          setCoinsState({ coins, uid: u.uid });
        });
      } else {
        setCoinsState({ coins: 0, uid: null });
      }
    });
    return () => { if (unsubUser) unsubUser(); unsubAuth(); };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center relative">
      <h1 className="text-3xl sm:text-5xl font-bold mb-8">Vyhýbej se Objektům!</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-4 w-full max-w-md">
        <button
          onClick={onStartGame}
          className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-green-500 rounded-lg hover:bg-green-600 text-lg sm:text-2xl font-semibold transition-colors"
        >
          Hrát hru
        </button>
        <button
          onClick={toggleInfoModal}
          className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-blue-500 rounded-lg hover:bg-blue-600 text-lg sm:text-2xl font-semibold transition-colors"
        >
          Informace
        </button>
        <button
          onClick={toggleScoreboard}
          className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-purple-600 rounded-lg hover:bg-purple-500 text-lg sm:text-2xl font-semibold transition-colors"
        >
          Žebříček skóre
        </button>
        <button
          onClick={toggleShop}
          className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-yellow-600 rounded-lg hover:bg-yellow-500 text-lg sm:text-2xl font-semibold transition-colors"
        >
          Obchod
        </button>
      </div>
      <div className="mb-8 text-white/90">Mince: <span className="font-semibold">{coinsState.coins}</span></div>
      <p className="text-lg text-gray-400">made by syslisk0</p>

      {showInfoModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
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
              className="mt-6 px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 text-lg sm:text-xl font-semibold transition-colors"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {showScoreboard && (
        <ScoreboardModal onClose={toggleScoreboard} />
      )}

      {showShop && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl w-full">
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
