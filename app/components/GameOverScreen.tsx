'use client';

interface GameOverScreenProps {
  score: number;
  displayedScoreSpeed: number;
  displayedRedObjectSpeed: number;
  displayedYellowObjectSpeed: number;
  redObjectCount: number;
  yellowObjectCount: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export default function GameOverScreen({
  score,
  displayedScoreSpeed,
  displayedRedObjectSpeed,
  displayedYellowObjectSpeed,
  redObjectCount,
  yellowObjectCount,
  onPlayAgain,
  onBackToMenu
}: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="text-center text-white p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl mb-4 font-bold">Konec hry!</h2>
        <p className="text-lg mb-2">Tvoje skóre: {score}</p>
        <p className="text-md mb-1">Finální rychlost skóre: {displayedScoreSpeed.toFixed(2)} bodů/s</p>
        <p className="text-md mb-1">Finální rychlost Červených: {displayedRedObjectSpeed.toFixed(2)}</p>
        <p className="text-md mb-4">Finální rychlost Žlutých: {displayedYellowObjectSpeed.toFixed(2)}</p>
        <div className="text-md mb-4">
          Červené objekty: {redObjectCount} | Žluté objekty: {yellowObjectCount}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 text-lg font-semibold transition-colors"
          >
            Hrát znovu
          </button>
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 text-lg font-semibold transition-colors"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}


