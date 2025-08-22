'use client';

import { useState } from 'react';

interface WelcomePageProps {
  onEnterGame: () => void;
}

export default function WelcomePage({ onEnterGame }: WelcomePageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-8">
      {/* Main content */}
      <div className="text-center">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-16 animate-pulse">
          CURSOR DODGER
        </h1>

        {/* Large Enter Game Button */}
        <div className="transform transition-transform duration-300 hover:scale-105">
          <button
            onClick={onEnterGame}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              relative px-16 py-8 text-4xl md:text-5xl font-bold text-white
              bg-gradient-to-r from-purple-600 to-pink-600
              rounded-full shadow-2xl transition-all duration-300
              hover:shadow-3xl hover:shadow-purple-500/50
              active:scale-95
              ${isHovered ? 'animate-pulse' : ''}
            `}
          >
            <span className="relative z-10">ENTER THE GAME</span>
            <div className={`
              absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400
              transition-opacity duration-300 ${isHovered ? 'opacity-20' : 'opacity-0'}
            `} />
            {isHovered && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-ping opacity-20" />
            )}
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <div className="w-1 h-1 bg-cyan-400 rounded-full opacity-30" />
          </div>
        ))}
      </div>
    </div>
  );
}
