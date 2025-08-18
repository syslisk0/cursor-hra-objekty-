'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { ensureUserDocument } from '../services/userService';

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        ensureUserDocument(nextUser).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError('Přihlášení selhalo. Zkuste to prosím znovu.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Načítání…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full text-center text-white">
          <h1 className="text-xl font-semibold mb-3">Přihlášení vyžadováno</h1>
          <p className="text-sm text-gray-300 mb-4">Pokračujte přihlášením pomocí účtu Google.</p>
          {error && (
            <div className="text-red-400 text-sm mb-3">{error}</div>
          )}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium py-2 px-4 rounded-lg"
          >
            Přihlásit se přes Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="absolute top-3 right-3">
        <button
          onClick={handleSignOut}
          className="text-xs bg-gray-800 text-gray-200 px-3 py-1 rounded hover:bg-gray-700"
        >
          Odhlásit
        </button>
      </div>
      {children}
    </div>
  );
}


