'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { isUsernameAvailable, setUsernameForUser } from '../services/userService';

type Props = {
  user: User;
  onDone: () => void;
};

export default function UsernameModal({ user, onDone }: Props) {
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const candidate = value.trim();
    if (candidate.length < 3) {
      setError('Uživatelské jméno musí mít alespoň 3 znaky.');
      return;
    }
    setChecking(true);
    try {
      const available = await isUsernameAvailable(candidate);
      if (!available) {
        setError('Toto uživatelské jméno je již obsazeno.');
        return;
      }
      await setUsernameForUser(user.uid, candidate);
      onDone();
    } catch (err: any) {
      if (err?.message === 'INVALID_USERNAME') {
        setError('Povolena jsou pouze písmena, čísla a podtržítko (3–20 znaků).');
      } else if (err?.message === 'USERNAME_TAKEN') {
        setError('Toto uživatelské jméno je již obsazeno.');
      } else {
        setError('Nastavení jména selhalo, zkuste to znovu.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-2">Zvol si uživatelské jméno</h2>
        <p className="text-sm text-gray-300 mb-4">Bude viditelné v žebříčku skóre.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="např. syslisk0"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors text-white font-medium py-2 px-4 rounded-lg"
          >
            {checking ? 'Kontroluji…' : 'Potvrdit jméno'}
          </button>
        </form>
      </div>
    </div>
  );
}


