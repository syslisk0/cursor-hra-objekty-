import Game from "./components/Game";
import dynamic from "next/dynamic";
import AuthGate from "./components/AuthGate";

export default function Home() {
  return (
    <AuthGate>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Game />
      </div>
    </AuthGate>
  );
}
