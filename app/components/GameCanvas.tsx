'use client';
import { useEffect } from 'react';

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
  isPortrait
}: GameCanvasProps) {
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
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative overflow-hidden overscroll-none touch-none select-none">
      <div className="text-white text-xl mb-2 w-full max-w-[800px] hidden sm:flex items-center justify-start gap-4 px-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: hearts }).map((_, idx) => (
            <span key={idx} title="Srdíčko" className="text-red-500">❤</span>
          ))}
          {hearts === 0 && <span className="text-gray-400">0 ❤</span>}
        </div>
        <div>Skóre: {score}</div>
        <div>Rychlost skóre: {displayedScoreSpeed.toFixed(2)} bodů/s</div>
        {timeSlowActive && <div className="text-yellow-400 font-bold">(Čas zpomalen!)</div>}
      </div>
      <div className="text-white text-lg mb-2 hidden sm:flex flex-wrap justify-center gap-x-6 gap-y-1">
        <div>Červené: {redObjectCount} (R: {displayedRedObjectSpeed.toFixed(2)})</div>
        <div>Žluté: {yellowObjectCount} (R: {displayedYellowObjectSpeed.toFixed(2)})</div>
      </div>
      {/* Mobile overlay with condensed stats */}
      <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-10 text-[12px] text-white bg-black/50 rounded px-2 py-1 flex items-center gap-2">
        <span>{'❤'.repeat(Math.max(0, Math.min(hearts, 5))) || '0 ❤'}</span>
        <span>Skóre: {score}</span>
        <span>R: {displayedScoreSpeed.toFixed(1)}/s</span>
        {timeSlowActive && <span className="text-yellow-300">Slow</span>}
      </div>
      <canvas
        ref={canvasRef}
        className="border-2 border-white rounded-lg bg-black w-full max-w-[800px]"
        style={{ width: '100%', maxWidth: '800px', aspectRatio: isPortrait ? '3 / 4' : '4 / 3', touchAction: 'none' }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      />
    </div>
  );
}
