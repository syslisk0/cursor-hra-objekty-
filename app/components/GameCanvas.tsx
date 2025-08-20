'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface GameCanvasProps {
  score: number;
  displayedScoreSpeed: number;
  redObjectCount: number;
  yellowObjectCount: number;
  displayedRedObjectSpeed: number;
  displayedYellowObjectSpeed: number;
  hearts: number;
  timeSlowActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onTouchPosition?: (x: number, y: number) => void;
  isPortrait?: boolean;
  deathCircleCooldownLeftMs?: number;
  deathCircleLevel?: number;
  deathCircleEquipped?: boolean;
}

export default function GameCanvas({
  score,
  displayedScoreSpeed,
  redObjectCount,
  yellowObjectCount,
  displayedRedObjectSpeed,
  displayedYellowObjectSpeed,
  hearts,
  timeSlowActive,
  canvasRef,
  onTouchPosition,
  isPortrait,
  deathCircleCooldownLeftMs = 0,
  deathCircleLevel = 0,
  deathCircleEquipped = false
}: GameCanvasProps) {
  // Canvas je zaměřený na vykreslení hry; zobrazení mincí řeší menu a game over
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
    };
  }, []);
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvasRef.current.height / rect.height);
    onTouchPosition?.(x, y);
  };
  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden overscroll-none touch-none select-none cursor-none">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Top HUD Bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between p-4">
          {/* Left side - Score and Speed */}
          <div className="flex items-center gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="text-white font-bold text-xl">{score.toLocaleString()}</div>
                  <div className="text-gray-300 text-xs">Skóre</div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="text-white font-bold text-lg">{displayedScoreSpeed.toFixed(1)}/s</div>
                  <div className="text-gray-300 text-xs">Rychlost</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Hearts */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="text-xl">💖</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(hearts, 1) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      idx < hearts 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    <span className="text-xs">❤</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between p-4">
          {/* Left side - Object counts */}
          <div className="flex items-center gap-3">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-red-500/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-white font-semibold">{redObjectCount}</span>
                <span className="text-gray-300 text-xs">({displayedRedObjectSpeed.toFixed(1)})</span>
              </div>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-white font-semibold">{yellowObjectCount}</span>
                <span className="text-gray-300 text-xs">({displayedYellowObjectSpeed.toFixed(1)})</span>
              </div>
            </div>
          </div>

          {/* Right side - Special effects and abilities */}
          <div className="flex items-center gap-3">
            {timeSlowActive && (
              <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-cyan-500/50 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🕐</div>
                  <span className="text-cyan-300 font-semibold text-sm">Zpomalení</span>
                </div>
              </div>
            )}
            
            {deathCircleLevel > 0 && deathCircleEquipped && (() => {
              const colors = ['#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000'];
              const color = colors[Math.min(5, Math.max(1, deathCircleLevel)) - 1];
              const isReady = deathCircleCooldownLeftMs <= 0;
              const timeLeft = (deathCircleCooldownLeftMs / 1000).toFixed(1);
              
              return (
                <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isReady ? 'animate-pulse shadow-lg' : ''
                      }`}
                      style={{ 
                        backgroundColor: color,
                        color: 'black',
                        boxShadow: isReady ? `0 0 20px ${color}50` : 'none'
                      }}
                    >
                      {isReady ? '⭕' : timeLeft}
                    </div>
                    <div className="text-xs">
                      <div className="text-white font-semibold">Kruh smrti</div>
                      <div className="text-gray-300">Lvl {deathCircleLevel}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mobile HUD - Compact version for small screens */}
      <div className="sm:hidden pointer-events-none absolute top-2 left-2 right-2 z-20">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-white font-bold text-lg">{score}</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(hearts, 3) }).map((_, idx) => (
                  <span key={idx} className="text-red-500 text-sm">❤</span>
                ))}
                {hearts > 3 && <span className="text-gray-300 text-xs">+{hearts - 3}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-300">{displayedScoreSpeed.toFixed(1)}/s</span>
              {timeSlowActive && <span className="text-cyan-300">🕐</span>}
              {deathCircleLevel > 0 && deathCircleEquipped && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ 
                    backgroundColor: ['#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000'][Math.min(5, Math.max(1, deathCircleLevel)) - 1],
                    color: 'black'
                  }}
                >
                  {deathCircleCooldownLeftMs <= 0 ? '⭕' : (deathCircleCooldownLeftMs/1000).toFixed(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas with beautiful frame */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative">
          {/* Glow effect around canvas */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-lg"></div>
          
          <canvas
            ref={canvasRef}
            className="relative bg-black rounded-lg shadow-2xl border border-white/10"
            style={{
              width: isPortrait ? 'min(100vw, calc(100dvh * 0.625))' : 'min(100vw, calc(100dvh * 1.6))',
              height: 'auto',
              maxHeight: 'calc(100dvh - 120px)',
              maxWidth: 'calc(100vw - 20px)',
              aspectRatio: isPortrait ? '10 / 16' : '16 / 10',
              touchAction: 'none'
            }}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
          />
        </div>
      </div>
    </div>
  );
}
