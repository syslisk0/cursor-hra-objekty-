'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { ensureUserDocument, getUser } from '../services/userService';
import UsernameModal from './UsernameModal';

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        try {
          await ensureUserDocument(nextUser);
          const record = await getUser(nextUser.uid);
          setNeedsUsername(!record?.username);
        } catch (_) {
          // ignore
        }
      } else {
        setNeedsUsername(false);
      }
    });
    return () => unsub();
  }, []);

  // Handle redirect result (fallback auth)
  useEffect(() => {
    // Only in browser
    if (typeof window === 'undefined') return;
    getRedirectResult(auth).catch((e) => {
      // Surface error for debugging in prod
      console.error('Auth redirect error:', e);
      setError(t('auth.error'));
    });
  }, [t]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      // Log concrete error code for diagnostics
      console.error('Auth popup error:', e?.code || e);
      const code = e?.code as string | undefined;
      // Common cases: popup blocked or disallowed domain → fallback to redirect
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (re) {
          console.error('Auth redirect start failed:', re);
        }
      }
      if (code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/unauthorized-domain') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (re) {
          console.error('Auth redirect start failed:', re);
        }
      }
      setError(t('auth.error'));
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {t('auth.loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full text-center text-white">
          <h1 className="text-xl font-semibold mb-3">{t('auth.required')}</h1>
          <p className="text-sm text-gray-300 mb-4">{t('auth.signin.desc')}</p>
          {error && (
            <div className="text-red-400 text-sm mb-3">{t('auth.error')}</div>
          )}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium py-2 px-4 rounded-lg"
          >
            {t('auth.signin')}
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
          {t('auth.signout')}
        </button>
      </div>
      {needsUsername && user ? (
        <UsernameModal user={user} onDone={() => setNeedsUsername(false)} />
      ) : (
        children
      )}
    </div>
  );
}


