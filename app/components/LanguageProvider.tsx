'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'cs' | 'en';

type I18nDict = Record<string, string>;

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'cs',
  setLang: () => {},
  t: (k: string) => k,
});

const CS: I18nDict = {
  // Menu
  'menu.title': 'Cursor Dodger',
  'menu.subtitle': 'Vyhni se  objektům, vydělej mince a zlepšuj schopnosti',
  'menu.coins': 'mincí',
  'menu.play': 'Hrát',
  'menu.info': 'Informace',
  'menu.scoreboard': 'Žebříček',
  'menu.shop': 'Obchod',
  'menu.madeBy': 'Vytvořeno s ❤',
  'menu.logout': 'Odhlásit',
  'menu.infoTitle': 'Jak hrát',
  'menu.infoP1': 'Pohybuj kurzorem a vyhýbej se objektům.',
  'menu.infoP2': 'Sbírej mince a vylepšuj schopnosti v obchodě.',
  'menu.infoP3': 'Aktivuj schopnosti ve hře dle popisu.',
  'menu.infoP4': 'Zlepšuj skóre a bojuj o první místo!',
  'menu.rewards': 'Za skóre získáš mince!',
  'menu.close': 'Zavřít',

  // Scoreboard
  'scoreboard.title': 'Žebříček',
  'scoreboard.close': 'Zavřít',
  'scoreboard.loading': 'Načítání…',
  'scoreboard.anonymous': 'Anonym',
  'scoreboard.empty': 'Zatím žádné skóre',

  // Auth
  'auth.loading': 'Načítání…',
  'auth.required': 'Přihlášení je vyžadováno',
  'auth.signin.desc': 'Přihlas se prosím přes Google, abychom uložili tvůj postup.',
  'auth.signin': 'Přihlásit se přes Google',
  'auth.signout': 'Odhlásit se',
  'auth.error': 'Chyba při přihlášení, zkus to prosím znovu.',

  // Username
  'user.pickTitle': 'Zvol si přezdívku',
  'user.pickDesc': 'Tvoje jméno se zobrazí v žebříčku.',
  'user.placeholder': 'Přezdívka…',
  'user.confirm': 'Potvrdit',
  'user.checking': 'Kontroluji…',
  'user.err.min': 'Minimálně 3 znaky.',
  'user.err.taken': 'Tato přezdívka je již zabraná.',
  'user.err.invalid': 'Neplatná přezdívka.',
  'user.err.fail': 'Nepodařilo se uložit přezdívku.',

  // HUD
  'hud.score': 'Skóre',
  'hud.speed': 'Rychlost',
  'hud.slow': 'Zpomalení času',
  'hud.deathCircle': 'Kruh smrti',
  'hud.blackHole': 'Černá díra',
  'hud.level': 'Úroveň',
  'hud.speedUnit': '/s',

  // Game Over
  'go.title': 'Konec hry',
  'go.subtitle': 'Zkus to znovu a poraž svůj rekord!',
  'go.finalScore': 'Konečné skóre',
  'go.coins': 'Získané mince',
  'go.speed': 'Rychlost skóre',
  'go.objects': 'Objekty',
  'go.redObjects': 'Rychlost červených',
  'go.yellowObjects': 'Rychlost žlutých',
  'go.speedUnit': '/s',
  'go.newRecord': 'Nový rekord!',
  'go.bestRecord': 'Nejlepší: ',
  'go.saving': 'Ukládám…',
  'go.saveScore': 'Uložit skóre',
  'go.playAgain': 'Hrát znovu',
  'go.backToMenu': 'Zpět do menu',

  // Shop (basic)
  'shop.title': 'Obchod',
  'shop.subtitle': 'Nakupuj a spravuj schopnosti',
  'shop.close': 'Zavřít',
  'shop.loading': 'Načítání…',
  'shop.section.slots': 'Sloty schopností',
  'shop.section.slots.desc': 'Vyber, které schopnosti chceš mít aktivní během hry.',
  'shop.activeSlots': 'Aktivní sloty',
  'shop.buySlot': 'Koupit slot',
  'shop.coins': 'mincí',
  'shop.clickToBuy': 'Klikni pro koupi',
  'shop.section.abilities': 'Schopnosti',
  'shop.section.abilities.desc': 'Vylepšuj a přetahuj do slotů',
  'shop.drag': 'Přetáhni do slotu',
  'shop.now': 'Nyní:',
  'shop.next': 'Další:',
  'shop.buy': 'Koupit',
  'shop.upgrade': 'Vylepšit',
  'shop.maxLevel': 'Max úroveň',
  'shop.error.login': 'Pro akci se přihlas.',
  'shop.error.ability_not_owned': 'Tuto schopnost nevlastníš.',
  'shop.error.invalid_slot': 'Neplatný slot.',
  'shop.error.action_failed': 'Akce se nezdařila.',
  'shop.error.not_enough_coins': 'Nemáš dost mincí.',
  'shop.error.user_not_found': 'Uživatel nenalezen.',
  'shop.error.unequip_failed': 'Nepodařilo se odebrat ze slotu.',
};

const EN: I18nDict = {
  // Menu
  'menu.title': 'Cursor Dodger',
  'menu.subtitle': 'Dodge objects, earn coins, upgrade abilities',
  'menu.coins': 'coins',
  'menu.play': 'Play',
  'menu.info': 'Info',
  'menu.scoreboard': 'Scoreboard',
  'menu.shop': 'Shop',
  'menu.madeBy': 'Made with ❤',
  'menu.logout': 'Logout',
  'menu.infoTitle': 'How to play',
  'menu.infoP1': 'Move the cursor and avoid objects.',
  'menu.infoP2': 'Collect coins and upgrade abilities in the shop.',
  'menu.infoP3': 'Activate abilities in the game as described.',
  'menu.infoP4': 'Improve your score and fight for #1!',
  'menu.rewards': 'You earn coins from score!',
  'menu.close': 'Close',

  // Scoreboard
  'scoreboard.title': 'Scoreboard',
  'scoreboard.close': 'Close',
  'scoreboard.loading': 'Loading…',
  'scoreboard.anonymous': 'Anonymous',
  'scoreboard.empty': 'No scores yet',

  // Auth
  'auth.loading': 'Loading…',
  'auth.required': 'Sign-in required',
  'auth.signin.desc': 'Please sign in with Google so we can save your progress.',
  'auth.signin': 'Sign in with Google',
  'auth.signout': 'Sign out',
  'auth.error': 'Sign-in error, please try again.',

  // Username
  'user.pickTitle': 'Choose a nickname',
  'user.pickDesc': 'Your name will appear on the leaderboard.',
  'user.placeholder': 'Nickname…',
  'user.confirm': 'Confirm',
  'user.checking': 'Checking…',
  'user.err.min': 'At least 3 characters.',
  'user.err.taken': 'This nickname is already taken.',
  'user.err.invalid': 'Invalid nickname.',
  'user.err.fail': 'Failed to save nickname.',

  // HUD
  'hud.score': 'Score',
  'hud.speed': 'Speed',
  'hud.slow': 'Time slow',
  'hud.deathCircle': 'Ring of death',
  'hud.blackHole': 'Black Hole',
  'hud.level': 'Level',
  'hud.speedUnit': '/s',

  // Game Over
  'go.title': 'Game Over',
  'go.subtitle': 'Try again and beat your record!',
  'go.finalScore': 'Final score',
  'go.coins': 'Coins earned',
  'go.speed': 'Score speed',
  'go.objects': 'Objects',
  'go.redObjects': 'Red speed',
  'go.yellowObjects': 'Yellow speed',
  'go.speedUnit': '/s',
  'go.newRecord': 'New record!',
  'go.bestRecord': 'Best: ',
  'go.saving': 'Saving…',
  'go.saveScore': 'Save score',
  'go.playAgain': 'Play again',
  'go.backToMenu': 'Back to menu',

  // Shop (basic)
  'shop.title': 'Shop',
  'shop.subtitle': 'Buy and manage abilities',
  'shop.close': 'Close',
  'shop.loading': 'Loading…',
  'shop.section.slots': 'Ability slots',
  'shop.section.slots.desc': 'Choose which abilities you want active during the game.',
  'shop.activeSlots': 'Active slots',
  'shop.buySlot': 'Buy slot',
  'shop.coins': 'coins',
  'shop.clickToBuy': 'Click to buy',
  'shop.section.abilities': 'Abilities',
  'shop.section.abilities.desc': 'Upgrade and drag into slots',
  'shop.drag': 'Drag to slot',
  'shop.now': 'Now:',
  'shop.next': 'Next:',
  'shop.buy': 'Buy',
  'shop.upgrade': 'Upgrade',
  'shop.maxLevel': 'Max level',
  'shop.error.login': 'Please sign in.',
  'shop.error.ability_not_owned': 'You do not own this ability.',
  'shop.error.invalid_slot': 'Invalid slot.',
  'shop.error.action_failed': 'Action failed.',
  'shop.error.not_enough_coins': 'Not enough coins.',
  'shop.error.user_not_found': 'User not found.',
  'shop.error.unequip_failed': 'Failed to unequip.',
};

const DICTS: Record<Lang, I18nDict> = { cs: CS, en: EN };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('cs');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'cs' || saved === 'en') {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  };

  const t = useMemo(() => {
    const dict = DICTS[lang] || {};
    return (key: string) => dict[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
