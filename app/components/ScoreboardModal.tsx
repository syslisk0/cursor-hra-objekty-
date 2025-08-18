'use client';

import { useEffect, useState } from 'react';
import { getTopBestScores, UserRecord } from '../services/userService';

interface Props {
  onClose: () => void;
}

export default function ScoreboardModal({ onClose }: Props) {
  const [items, setItems] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopBestScores(20)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Žebříček skóre</h2>
          <button onClick={onClose} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">Zavřít</button>
        </div>
        {loading ? (
          <div className="text-gray-300">Načítám…</div>
        ) : (
          <ol className="space-y-2">
            {items.map((u, idx) => (
              <li key={u.uid} className="flex items-center justify-between bg-gray-900/50 px-3 py-2 rounded">
                <span className="text-gray-300">#{idx + 1}</span>
                <span className="flex-1 px-3 truncate">{u.username ?? u.email ?? 'Anonym'}</span>
                <span className="font-semibold">{u.bestScore}</span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-gray-300">Zatím žádná skóre.</li>
            )}
          </ol>
        )}
      </div>
    </div>
  );
}


