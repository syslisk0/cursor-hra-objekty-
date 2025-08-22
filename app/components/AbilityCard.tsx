"use client";

import React from 'react';
import { ABILITY_META, AbilityKey, LEVEL_COLOR, allLevelCosts, calcLevelCost } from './abilities';
import { useLanguage } from '@/app/components/LanguageProvider';

export interface AbilityCardProps {
  ability: AbilityKey;
  level: number;
  isEquipped?: boolean;
  isDragging?: boolean;
  onUpgrade: (ability: AbilityKey) => void;
  onSelect?: (ability: AbilityKey) => void; // equip/select to first free slot
  onDragStart?: (ability: AbilityKey, e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export default function AbilityCard({
  ability,
  level,
  isEquipped = false,
  isDragging = false,
  onUpgrade,
  onSelect,
  onDragStart,
  onDragEnd,
}: AbilityCardProps) {
  const { t, lang } = useLanguage();
  const meta = ABILITY_META[ability];
  const owned = level > 0;
  // Make all owned abilities draggable, including heartman (drop/equip rules stay in parent)
  const draggable = owned;
  const color = LEVEL_COLOR[level];
  const cost = calcLevelCost(ability, level);
  const currentDesc = (lang === 'en' ? meta.upgradeDescEn : meta.upgradeDesc)[level];
  const nextDesc = level < 5 ? (lang === 'en' ? meta.upgradeDescEn : meta.upgradeDesc)[level + 1] : null;
  const levelCosts = allLevelCosts(ability);

  return (
    <div 
      className={`group relative h-[140px] w-full rounded-xl border-2 transition-all duration-300 overflow-hidden
        ${owned 
          ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 border-white/20 hover:border-white/40 cursor-grab active:cursor-grabbing transform hover:scale-105' 
          : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-600/50 hover:border-gray-500/50'
        }
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
      draggable={draggable}
      onClick={() => { if (onSelect) onSelect(ability); }}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData('text/ability', ability);
        onDragStart?.(ability, e);
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      {/* Level progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
          style={{ width: `${(level / 5) * 100}%` }}
        />
      </div>

      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white z-10">
          ✓
        </div>
      )}

      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div 
          className="w-14 h-14 rounded-xl mb-2 flex items-center justify-center text-2xl font-bold border-2 border-white/20 shadow-lg flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h4 className="text-sm font-bold mb-1">{lang === 'en' ? (meta.titleEn || meta.title) : meta.title}</h4>
          <span className="px-2 py-0.5 bg-gray-700/50 rounded-full text-xs font-semibold mb-1">
            {level}/5
          </span>
          {owned && ability !== 'heartman' && (
            <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">🖱️ {t('shop.drag')}</div>
          )}
        </div>
      </div>

      {/* Hover overlay with details */}
      <div className="absolute inset-0 bg-gray-900/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col overflow-y-auto">
        <div className="text-center">
          <h4 className="text-sm font-bold mb-1">{lang === 'en' ? (meta.titleEn || meta.title) : meta.title}</h4>
          <div className="text-xs text-gray-300 mb-2">{lang === 'en' ? (meta.descriptionEn || meta.description) : meta.description}</div>
          <div className="space-y-1 mb-2">
            <div className="text-xs"><span className="text-gray-400">{t('shop.now')}</span><span className="text-blue-300 ml-1">{currentDesc}</span></div>
            {nextDesc && (
              <div className="text-xs"><span className="text-gray-400">{t('shop.next')}</span><span className="text-green-300 ml-1">{nextDesc}</span></div>
            )}
          </div>
        </div>

        {/* Action buttons always visible above the prices */}
        <div className="flex justify-center gap-2 mt-1 mb-2">
          {level === 0 ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onUpgrade(ability); }}
              className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              💰 {t('shop.buy')} ({meta.baseCost})
            </button>
          ) : cost !== null ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpgrade(ability); }}
                className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                ⬆️ {t('shop.upgrade')} ({cost})
              </button>
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(ability); }}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 rounded text-xs font-semibold transition-all duration-200 cursor-pointer"
                >
                  ⭐ {t('shop.select')}
                </button>
              )}
            </>
          ) : (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-xs font-semibold opacity-75">
              ✨ {t('shop.maxLevel')}
            </div>
          )}
        </div>

        {/* Levels and prices list */}
        <div className="text-[10px] text-left mx-auto max-w-[220px] bg-gray-800/60 rounded p-2 border border-white/10 mt-auto">
          <div className="font-semibold mb-1">{t('shop.levelPrices')}</div>
          <div className="grid grid-cols-5 gap-1">
            {[1,2,3,4,5].map((lv, idx) => (
              <div key={lv} className={`px-1 py-0.5 rounded text-center border ${lv-1 <= level ? 'bg-green-700/40 border-green-500/40' : 'bg-gray-700/40 border-gray-500/30'}`}>
                <div className="font-bold">{lv}</div>
                <div className="text-[9px] opacity-80">{levelCosts[idx].toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
