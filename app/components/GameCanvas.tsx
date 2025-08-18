'use client';

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
  onTouchPosition
}: GameCanvasProps) {
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
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
      <div className="text-white text-xl mb-2 w-[800px] flex items-center justify-start gap-4">
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
      <div className="text-white text-lg mb-2 flex flex-wrap justify-center gap-x-6 gap-y-1">
        <div>Červené: {redObjectCount} (R: {displayedRedObjectSpeed.toFixed(2)})</div>
        <div>Žluté: {yellowObjectCount} (R: {displayedYellowObjectSpeed.toFixed(2)})</div>
      </div>
      <canvas
        ref={canvasRef}
        className="border-2 border-white rounded-lg bg-black"
        style={{ width: '800px', height: '600px', touchAction: 'none' }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      />
    </div>
  );
}
