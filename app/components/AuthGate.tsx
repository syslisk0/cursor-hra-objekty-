'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/app/components/LanguageProvider';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User, signInAnonymously } from 'firebase/auth';
import { ensureUserDocument, getUser } from '../services/userService';
import UsernameModal from './UsernameModal';

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  // In-memory guest flag. Not persisted to keep session ephemeral.
  const [guestMode, setGuestMode] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser && !nextUser.isAnonymous) {
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
    if (guestMode) {
      // Exit guest session → also sign out anonymous auth
      setGuestMode(false);
      try { await signOut(auth); } catch {}
      return;
    }
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        {t('auth.loading')}
      </div>
    );
  }

  if (!user && !guestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 relative">
        {/* Language switcher top-right */}
        <div className="absolute top-4 right-4 z-20 text-white">
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/70 hover:bg-gray-700/70 border border-white/10 rounded-lg cursor-pointer"
              onClick={() => setShowLangMenu(prev => !prev)}
            >
              <span className="text-xl">{lang === 'cs' ? '🇨🇿' : '🇬🇧'}</span>
              <span className="text-sm text-gray-300 uppercase">{lang}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-white/10 rounded-lg shadow-lg text-white">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left cursor-pointer"
                  onClick={() => { setLang('cs'); setShowLangMenu(false); }}
                >
                  <span>🇨🇿</span>
                  <span className="text-white">Čeština</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left cursor-pointer"
                  onClick={() => { setLang('en'); setShowLangMenu(false); }}
                >
                  <span>🇬🇧</span>
                  <span className="text-white">English</span>
                </button>
              </div>
            )}
          </div>
        </div>
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
          <div className="my-3 h-px bg-white/10" />
          <div className="text-xs text-gray-400 mb-2">{t('auth.guest.desc')}</div>
          <button
            onClick={async () => {
              setGuestMode(true);
              // Sign in anonymously so Firestore reads work under auth-protected rules
              try { await signInAnonymously(auth); } catch (e) { /* ignore */ }
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium py-2 px-4 rounded-lg"
          >
            {t('auth.guest')}
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
          {guestMode ? 'Exit guest' : t('auth.signout')}
        </button>
      </div>
      {needsUsername && user && !guestMode ? (
        <UsernameModal user={user} onDone={() => setNeedsUsername(false)} />
      ) : (
        children
      )}
    </div>
  );
}


