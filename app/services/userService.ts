import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, limit, runTransaction } from 'firebase/firestore';

export type UserRecord = {
  uid: string;
  email: string | null;
  bestScore: number;
  username?: string;
  coins?: number; // měna
  ownedSkins?: string[]; // pole skinId
  selectedSkinId?: string; // aktuální skin
  abilities?: {
    deathCircleLevel?: number; // 0-5
    timelapseLevel?: number;   // 0-5
  };
  abilitySlots?: number; // počet slotů pro equip
  equippedAbilities?: string[]; // klíče schopností
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
      coins: 0,
      ownedSkins: ['green'],
      selectedSkinId: 'green',
      abilities: { deathCircleLevel: 0, timelapseLevel: 0 },
      abilitySlots: 1,
      equippedAbilities: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, payload);
  }
}

export async function getUser(uid: string): Promise<UserRecord | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserRecord>;
  return {
    uid: data.uid ?? uid,
    email: data.email ?? null,
    bestScore: typeof data.bestScore === 'number' ? data.bestScore : 0,
    username: typeof data.username === 'string' ? data.username : undefined,
    coins: typeof data.coins === 'number' ? data.coins : 0,
    ownedSkins: Array.isArray(data.ownedSkins) ? data.ownedSkins as string[] : ['green'],
    selectedSkinId: typeof data.selectedSkinId === 'string' ? data.selectedSkinId : 'green',
    abilities: {
      deathCircleLevel: typeof (data.abilities as any)?.deathCircleLevel === 'number' ? (data.abilities as any).deathCircleLevel : 0,
      timelapseLevel: typeof (data.abilities as any)?.timelapseLevel === 'number' ? (data.abilities as any).timelapseLevel : 0,
    },
    abilitySlots: typeof (data.abilitySlots as any) === 'number' ? (data.abilitySlots as any) : 1,
    equippedAbilities: Array.isArray((data.equippedAbilities as any)) ? (data.equippedAbilities as any) : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as UserRecord;
}

export async function isUsernameAvailable(desiredUsername: string): Promise<boolean> {
  const normalized = desiredUsername.trim().toLowerCase();
  if (!normalized) return false;
  const ref = doc(db, 'usernames', normalized);
  const snap = await getDoc(ref);
  return !snap.exists();
}

export async function setUsernameForUser(uid: string, desiredUsername: string): Promise<void> {
  const username = desiredUsername.trim();
  if (!username) {
    throw new Error('EMPTY_USERNAME');
  }
  // jednoduché ověření – jen písmena/čísla/_. 3–20 znaků
  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  if (!valid) {
    throw new Error('INVALID_USERNAME');
  }
  const key = username.toLowerCase();
  const usernameRef = doc(db, 'usernames', key);
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists()) {
      throw new Error('USERNAME_TAKEN');
    }
    tx.set(usernameRef, { uid, username, createdAt: serverTimestamp() });
    tx.update(userRef, { username, updatedAt: serverTimestamp() });
  });
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
    await setDoc(ref, { uid, email, bestScore: score, coins: 0, ownedSkins: ['green'], selectedSkinId: 'green', abilities: { deathCircleLevel: 0, timelapseLevel: 0 }, abilitySlots: 1, equippedAbilities: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
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
      username: data.username,
      bestScore: typeof data.bestScore === 'number' ? data.bestScore : 0,
      coins: typeof data.coins === 'number' ? data.coins : 0,
      ownedSkins: Array.isArray(data.ownedSkins) ? data.ownedSkins as string[] : ['green'],
      selectedSkinId: typeof data.selectedSkinId === 'string' ? data.selectedSkinId : 'green',
    } as UserRecord;
  });
}

export async function addCoins(uid: string, amount: number): Promise<number> {
  if (amount === 0) return (await getUser(uid))?.coins ?? 0;
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.data() as Partial<UserRecord>) || {};
    const current = typeof data.coins === 'number' ? data.coins : 0;
    const next = Math.max(0, current + amount);
    tx.set(ref, { coins: next, updatedAt: serverTimestamp() }, { merge: true });
  });
  const updated = await getUser(uid);
  return updated?.coins ?? 0;
}

export async function purchaseSkin(uid: string, skinId: string, price: number): Promise<{ success: boolean; coins: number; ownedSkins: string[]; selectedSkinId: string }>{
  const ref = doc(db, 'users', uid);
  let result = { success: false, coins: 0, ownedSkins: ['green'], selectedSkinId: 'green' };
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error('USER_NOT_FOUND');
    }
    const data = snap.data() as Partial<UserRecord>;
    const currentCoins = typeof data.coins === 'number' ? data.coins : 0;
    const owned = Array.isArray(data.ownedSkins) ? [...data.ownedSkins] as string[] : ['green'];
    if (!owned.includes(skinId)) {
      if (currentCoins < price) {
        throw new Error('NOT_ENOUGH_COINS');
      }
      owned.push(skinId);
      tx.update(ref, { coins: currentCoins - price, ownedSkins: owned, updatedAt: serverTimestamp() });
      result = { success: true, coins: currentCoins - price, ownedSkins: owned, selectedSkinId: data.selectedSkinId as string || 'green' };
    } else {
      result = { success: true, coins: currentCoins, ownedSkins: owned, selectedSkinId: data.selectedSkinId as string || 'green' };
    }
  });
  return result;
}

export async function selectSkin(uid: string, skinId: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { selectedSkinId: skinId, updatedAt: serverTimestamp() });
}


