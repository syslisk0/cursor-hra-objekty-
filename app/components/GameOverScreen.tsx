'use client';
import { useEffect, useState } from 'react';

interface GameOverScreenProps {
  score: number;
  displayedScoreSpeed: number;
  displayedRedObjectSpeed: number;
  displayedYellowObjectSpeed: number;
  redObjectCount: number;
  yellowObjectCount: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onSubmitScore?: (finalScore: number) => Promise<{ isRecord: boolean; best: number }>;
  coinsEarned?: number;
}

export default function GameOverScreen({
  score,
  displayedScoreSpeed,
  displayedRedObjectSpeed,
  displayedYellowObjectSpeed,
  redObjectCount,
  yellowObjectCount,
  onPlayAgain,
  onBackToMenu,
  onSubmitScore,
  coinsEarned = 0
}: GameOverScreenProps) {
  const [saving, setSaving] = useState(false);
  const [recordInfo, setRecordInfo] = useState<{ isRecord: boolean; best: number } | null>(null);

  const handleSave = async () => {
    if (!onSubmitScore || saving) return;
    setSaving(true);
    try {
      const res = await onSubmitScore(score);
      setRecordInfo(res);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (onSubmitScore && recordInfo === null) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/70 via-black/60 to-black/70 p-4">
      <div className="relative w-full max-w-2xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 rounded-2xl blur opacity-40"></div>
        <div className="relative rounded-2xl bg-gray-900/90 backdrop-blur-xl text-white shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/10">
            <h2 className="text-4xl font-extrabold tracking-tight">Konec hry</h2>
            <p className="text-sm text-gray-300 mt-1">Dobrá práce, zkus překonat svůj rekord!</p>
          </div>
          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-1 bg-white/5 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Skóre</div>
              <div className="text-3xl font-bold">{score}</div>
            </div>
            <div className="col-span-1 md:col-span-1 bg-white/5 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Získané mince</div>
              <div className="text-3xl font-bold">{coinsEarned}</div>
            </div>
            <div className="col-span-1 md:col-span-1 bg-white/5 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Rychlost skóre</div>
              <div className="text-3xl font-bold">{displayedScoreSpeed.toFixed(2)}</div>
            </div>
            <div className="col-span-1 md:col-span-1 bg-white/5 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Objekty</div>
              <div className="text-lg">Červené: <span className="font-semibold">{redObjectCount}</span></div>
              <div className="text-lg">Žluté: <span className="font-semibold">{yellowObjectCount}</span></div>
            </div>
          </div>
          <div className="px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-xl p-4">
                <div className="text-gray-300 text-sm">Rychlost Červených</div>
                <div className="text-2xl font-semibold">{displayedRedObjectSpeed.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-xl p-4">
                <div className="text-gray-300 text-sm">Rychlost Žlutých</div>
                <div className="text-2xl font-semibold">{displayedYellowObjectSpeed.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="px-8 pt-4 pb-6 text-center">
            {recordInfo ? (
              <div className={`mb-4 inline-block px-4 py-2 rounded-full text-sm font-medium ${recordInfo.isRecord ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-200'}`}>
                {recordInfo.isRecord ? `Nový rekord! (${recordInfo.best})` : `Tvůj nejlepší rekord je ${recordInfo.best}`}
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mb-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl disabled:opacity-50 transition-colors"
              >
                {saving ? 'Ukládám…' : 'Uložit skóre'}
              </button>
            )}
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={onPlayAgain}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-lg font-semibold transition-colors"
              >
                Hrát znovu
              </button>
              <button
                onClick={onBackToMenu}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-semibold transition-colors"
              >
                Menu
              </button>
            </div>
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}


