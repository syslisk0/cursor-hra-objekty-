'use client';

import { useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { User } from 'firebase/auth';
import { isUsernameAvailable, setUsernameForUser } from '../services/userService';

type Props = {
  user: User;
  onDone: () => void;
};

export default function UsernameModal({ user, onDone }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const candidate = value.trim();
    if (candidate.length < 3) {
      setError(t('user.err.min'));
      return;
    }
    setChecking(true);
    try {
      const available = await isUsernameAvailable(candidate);
      if (!available) {
        setError(t('user.err.taken'));
        return;
      }
      await setUsernameForUser(user.uid, candidate);
      onDone();
    } catch (err: any) {
      if (err?.message === 'INVALID_USERNAME') {
        setError(t('user.err.invalid'));
      } else if (err?.message === 'USERNAME_TAKEN') {
        setError(t('user.err.taken'));
      } else {
        setError(t('user.err.fail'));
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-2">{t('user.pickTitle')}</h2>
        <p className="text-sm text-gray-300 mb-4">{t('user.pickDesc')}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('user.placeholder')}
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors text-white font-medium py-2 px-4 rounded-lg"
          >
            {checking ? t('user.checking') : t('user.confirm')}
          </button>
        </form>
      </div>
    </div>
  );
}


