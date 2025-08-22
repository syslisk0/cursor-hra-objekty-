'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';

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
  const { t } = useLanguage();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-sm p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-40 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-40 w-28 h-28 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto">
        {/* Main container with multiple glowing borders */}
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-red-500/30 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl blur opacity-80"></div>
          
          <div className="relative rounded-2xl bg-gray-900/95 backdrop-blur-2xl text-white shadow-2xl overflow-hidden border border-white/10">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 text-center border-b border-white/10 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-5xl animate-bounce">💀</div>
                <div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {t('go.title')}
                  </h2>
                  <p className="text-sm text-gray-300 mt-1">{t('go.subtitle')}</p>
                </div>
                <div className="text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>☠️</div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Score Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">🎯</div>
                      <div className="text-blue-300 text-sm font-semibold">{t('go.finalScore')}</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{score.toLocaleString()}</div>
                  </div>
                </div>

                {/* Coins Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">💰</div>
                      <div className="text-yellow-300 text-sm font-semibold">{t('go.coins')}</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{coinsEarned}</div>
                  </div>
                </div>

                {/* Speed Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">⚡</div>
                      <div className="text-green-300 text-sm font-semibold">{t('go.speed')}</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{displayedScoreSpeed.toFixed(1)}<span className="text-lg text-gray-400">{t('hud.speedUnit')}</span></div>
                  </div>
                </div>

                {/* Objects Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-red-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-pink-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">🎪</div>
                      <div className="text-pink-300 text-sm font-semibold">{t('go.objects')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-white font-bold">{redObjectCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-white font-bold">{yellowObjectCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-red-300 text-sm font-semibold">{t('go.redObjects')}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{displayedRedObjectSpeed.toFixed(1)} <span className="text-sm text-gray-400">{t('go.speedUnit')}</span></div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="text-yellow-300 text-sm font-semibold">{t('go.yellowObjects')}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{displayedYellowObjectSpeed.toFixed(1)} <span className="text-sm text-gray-400">{t('go.speedUnit')}</span></div>
                </div>
              </div>
            </div>

            {/* Record/Save Section */}
            <div className="px-8 pb-6 text-center">
              {recordInfo ? (
                <div className={`mb-6 inline-block px-6 py-3 rounded-2xl text-base font-bold border-2 transition-all duration-300 ${
                  recordInfo.isRecord 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/50 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/50'
                }`}>
                  {recordInfo.isRecord ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <span>{t('go.newRecord')} ({recordInfo.best.toLocaleString()})</span>
                      <span className="text-2xl">🏆</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <span>{t('go.bestRecord')} {recordInfo.best.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mb-6 inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl text-lg font-bold disabled:opacity-50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('go.saving')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">💾</span>
                      <span>{t('go.saveScore')}</span>
                    </>
                  )}
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onPlayAgain}
                  className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-2xl">🎮</span>
                    <span>{t('go.playAgain')}</span>
                  </div>
                </button>
                
                <button
                  onClick={onBackToMenu}
                  className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-2xl">🏠</span>
                    <span>{t('go.backToMenu')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


