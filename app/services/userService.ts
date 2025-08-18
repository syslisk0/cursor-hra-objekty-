import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export type UserRecord = {
  uid: string;
  email: string | null;
  bestScore: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function ensureUserDocument(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const payload: UserRecord = {
      uid: user.uid,
      email: user.email ?? null,
      bestScore: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, payload);
  }
}

export async function getUserBestScore(uid: string): Promise<number> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as Partial<UserRecord>;
    return typeof data.bestScore === 'number' ? data.bestScore : 0;
  }
  return 0;
}

export async function updateBestScoreIfHigher(uid: string, email: string | null, score: number): Promise<{ updated: boolean; newBest: number }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, email, bestScore: score, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { updated: true, newBest: score };
  }
  const current = (snap.data() as Partial<UserRecord>).bestScore ?? 0;
  if (score > current) {
    await updateDoc(ref, { bestScore: score, updatedAt: serverTimestamp(), email });
    return { updated: true, newBest: score };
  }
  return { updated: false, newBest: current };
}

export async function getTopBestScores(max: number = 20): Promise<UserRecord[]> {
  const q = query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data() as Partial<UserRecord>;
    return {
      uid: data.uid ?? d.id,
      email: data.email ?? null,
      bestScore: typeof data.bestScore === 'number' ? data.bestScore : 0,
    } as UserRecord;
  });
}


