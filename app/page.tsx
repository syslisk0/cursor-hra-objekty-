"use client";

import { useState } from "react";
import AuthGate from "./components/AuthGate";
import WelcomePage from "./components/WelcomePage";
import Game from "./components/Game";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'game'>('welcome');

  const handleEnterGame = () => {
    setCurrentPage('game');
  };

  const handleBackToWelcome = () => {
    setCurrentPage('welcome');
  };

  return (
    <AuthGate>
      {currentPage === 'welcome' ? (
        <WelcomePage onEnterGame={handleEnterGame} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <Game />
        </div>
      )}
    </AuthGate>
  );
}
