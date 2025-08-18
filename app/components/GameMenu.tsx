'use client';

import { useCallback, useState } from 'react';

interface GameMenuProps {
  onStartGame: () => void;
}

export default function GameMenu({ onStartGame }: GameMenuProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const toggleInfoModal = useCallback(() => {
    setShowInfoModal(prev => !prev);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-5xl font-bold mb-8">Vyhýbej se Objektům!</h1>
      <div className="flex gap-4 mb-12">
        <button
          onClick={onStartGame}
          className="px-8 py-4 bg-green-500 rounded-lg hover:bg-green-600 text-2xl font-semibold transition-colors"
        >
          Hrát hru
        </button>
        <button
          onClick={toggleInfoModal}
          className="px-8 py-4 bg-blue-500 rounded-lg hover:bg-blue-600 text-2xl font-semibold transition-colors"
        >
          Informace
        </button>
      </div>
      <p className="text-lg text-gray-400">Vytvořeno Štěpánem Dvořákem</p>

      {showInfoModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Informace o hře</h2>
            <p className="text-lg mb-4 text-gray-300">
              Cílem hry je vyhnout se objektům. Když dosáhnete skóre 100 a více, je šance 30 %, že se spawne žlutý objekt, který je sice o 50 % pomalejší, ale následuje vás.
            </p>
            <p className="text-lg mb-4 text-gray-300">
              Místo štítu jsou ve hře srdíčka (ve stylu Minecraft). Začínáš s 1 srdíčkem. Srdíčko se spawnuje při skóre 100, 200, 300 atd. Po sebrání zvýší počet tvých srdcí. Když přijdeš o srdíčko při zásahu, pozadí začne červeně pulzovat a vše se zpomalí na 5 % po dobu 5 sekund, aby ses stihl dostat do bezpečí. Během těchto 5 sekund jsi nesmrtelný.
            </p>
                          <p className="text-lg mb-4 text-gray-300">
                Na mapě se nachází i bomba, která se spawnuje, když dosáhnete skóre 150, 280, 380, 480 atd. Bomba má hnědou barvu a dokáže zničit všechny objekty v daném dosahu.
              </p>
              <p className="text-lg mb-4 text-gray-300">
                Ve hře jsou také hodiny, které se spawnují ve skóre 200, 275, 350 atd. Zpomalí čas na 5 sekund o 60%.
              </p>
            <button
              onClick={toggleInfoModal}
              className="mt-6 px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 text-xl font-semibold transition-colors"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
