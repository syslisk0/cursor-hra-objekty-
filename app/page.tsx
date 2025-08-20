"use client";

import AuthGate from "./components/AuthGate";
import Game from "./components/Game";

export default function Home() {
  return (
    <AuthGate>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Game />
      </div>
    </AuthGate>
  );
}
