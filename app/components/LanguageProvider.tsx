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
  'menu.infoP1': 'Cílem je přežít co nejdéle: pohybuj kurzorem a vyhýbej se objektům.',
  'menu.infoP2': 'Získáváš skóre v čase. Za skóre získáš mince, které utratíš v obchodě.',
  'menu.infoP3': 'Schopnosti: aktivní (Stopa smrti) se vybavují do slotů a používají ve hře, pasivní (Timelapse, Srdcař) dávají trvalé bonusy.',
  'menu.infoP4': 'Tipy: kup další sloty, vylepšuj schopnosti, nastav si přezdívku a bojuj o první místo v žebříčku!',
  'menu.rewards': 'Za skóre získáš mince!',
  'menu.close': 'Zavřít',
  // Info (extended)
  'menu.info.controlsTitle': 'Ovládání',
  'menu.info.controlsBody': 'Pohybuj kurzorem myši po hrací ploše a ničemu se nedotýkej. Stiskem Escape ukončíš běh hry.',
  'menu.info.scoringTitle': 'Skóre a mince',
  'menu.info.scoringBody': 'Skóre roste v čase a s postupem hry zrychluje. Po konci hry získáš mince: 1 mince za každých 100 bodů skóre.',
  'menu.info.abilitiesTitle': 'Schopnosti',
  'menu.info.abilitiesBody': 'Aktivní: Stopa smrti (vybav do slotu; cooldown se s úrovní zkracuje až na 0 s). Pasivní: Timelapse zvyšuje rychlost získávání skóre, Srdcař přidává srdíčka na startu (1 + úroveň).',
  'menu.info.collectiblesTitle': 'Předměty',
  'menu.info.collectibles.bomb': 'Bomba: po sebrání vybuchne a zničí blízké objekty.',
  'menu.info.collectibles.shield': 'Štít: přidá dočasnou ochranu proti zásahu.',
  'menu.info.collectibles.hourglass': 'Přesýpací hodiny: dočasně zpomalí čas.',
  'menu.info.collectibles.heart': 'Srdce: přidá život.',
  'menu.info.levelsTitle': 'Úrovně',
  'menu.info.levelsBody': 'Po určitém postupu přejdeš do LEVEL 2: rychlejší hra, nové vlny a jiná hudba.',
  'menu.info.bossTitle': 'Boss',
  'menu.info.bossBody': 'Boss útočí ve fázích a je oznámen výrazným nápisem BOSS. Připrav se na vlny projektilů a krátké pauzy.',
  'menu.info.tipsTitle': 'Tipy',
  'menu.info.tipsBody': 'Kup další sloty, vylepšuj schopnosti, využívej předměty a snaž se udržet v bezpečných zónách. Nastav přezdívku a porovnej se v žebříčku.',

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
  'hud.deathCircle': 'Ocas smrti',
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
  'shop.section.abilities.desc': 'Klikni pro vybavení do slotu (nebo přetáhni)',
  'shop.drag': 'Klikni nebo přetáhni do slotu',
  'shop.now': 'Nyní:',
  'shop.next': 'Další:',
  'shop.buy': 'Koupit',
  'shop.upgrade': 'Vylepšit',
  'shop.select': 'Vybrat',
  'shop.maxLevel': 'Max úroveň',
  'shop.levelPrices': 'Ceny úrovní',
  'shop.release': 'Uvolnit',
  'shop.error.login': 'Pro akci se přihlas.',
  'shop.error.ability_not_owned': 'Tuto schopnost nevlastníš.',
  'shop.error.invalid_slot': 'Neplatný slot.',
  'shop.error.action_failed': 'Akce se nezdařila.',
  'shop.error.not_enough_coins': 'Nemáš dost mincí.',
  'shop.error.user_not_found': 'Uživatel nenalezen.',
  'shop.error.unequip_failed': 'Nepodařilo se odebrat ze slotu.',
  'shop.error.no_free_slots': 'Nemáš žádné volné sloty.',
  'shop.dropHere': 'Pusť zde',
  'shop.cannotPlace': 'Nelze umístit',
  'shop.emptySlot': 'Prázdný slot',
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
  'menu.infoP1': 'Survive as long as possible: move the cursor and avoid objects.',
  'menu.infoP2': 'You earn score over time. Score converts to coins that you spend in the shop.',
  'menu.infoP3': 'Abilities: active (Trail of Death) must be equipped into slots and used in-game; passive (Timelapse, Heartman) grant permanent bonuses.',
  'menu.infoP4': 'Tips: buy more slots, upgrade abilities, set your nickname, and fight for the top of the leaderboard!',
  'menu.rewards': 'You earn coins from score!',
  'menu.close': 'Close',
  // Info (extended)
  'menu.info.controlsTitle': 'Controls',
  'menu.info.controlsBody': 'Move your mouse cursor around the playfield and avoid touching objects. Press Escape to end the current run.',
  'menu.info.scoringTitle': 'Scoring & Coins',
  'menu.info.scoringBody': 'Your score increases over time and accelerates as the game progresses. After the run ends, you get coins: 1 coin for every 100 score.',
  'menu.info.abilitiesTitle': 'Abilities',
  'menu.info.abilitiesBody': 'Active: Trail of Death (equip to a slot; cooldown shortens with level down to 0s). Passive: Timelapse boosts score gain rate, Heartman adds hearts at start (1 + level).',
  'menu.info.collectiblesTitle': 'Collectibles',
  'menu.info.collectibles.bomb': 'Bomb: explodes on pickup and destroys nearby objects.',
  'menu.info.collectibles.shield': 'Shield: grants temporary protection from a hit.',
  'menu.info.collectibles.hourglass': 'Hourglass: temporarily slows down time.',
  'menu.info.collectibles.heart': 'Heart: adds a life.',
  'menu.info.levelsTitle': 'Levels',
  'menu.info.levelsBody': 'After some progress you reach LEVEL 2: faster gameplay, new waves, and different music.',
  'menu.info.bossTitle': 'Boss',
  'menu.info.bossBody': 'The boss attacks in phases and is announced by a prominent BOSS banner. Expect projectile waves and short pauses.',
  'menu.info.tipsTitle': 'Tips',
  'menu.info.tipsBody': 'Buy extra slots, upgrade abilities, leverage collectibles, and stay in safe zones. Set your nickname and compete on the leaderboard.',

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
  'hud.deathCircle': 'Trail of death',
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
  'shop.section.abilities.desc': 'Click to equip into slots (or drag)',
  'shop.drag': 'Click or drag to slot',
  'shop.now': 'Now:',
  'shop.next': 'Next:',
  'shop.buy': 'Buy',
  'shop.upgrade': 'Upgrade',
  'shop.select': 'Select',
  'shop.maxLevel': 'Max level',
  'shop.levelPrices': 'Level prices',
  'shop.release': 'Unequip',
  'shop.error.login': 'Please sign in.',
  'shop.error.ability_not_owned': 'You do not own this ability.',
  'shop.error.invalid_slot': 'Invalid slot.',
  'shop.error.action_failed': 'Action failed.',
  'shop.error.not_enough_coins': 'Not enough coins.',
  'shop.error.user_not_found': 'User not found.',
  'shop.error.unequip_failed': 'Failed to unequip.',
  'shop.error.no_free_slots': 'No free slots available.',
  'shop.dropHere': 'Drop here',
  'shop.cannotPlace': 'Cannot place',
  'shop.emptySlot': 'Empty slot',
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
