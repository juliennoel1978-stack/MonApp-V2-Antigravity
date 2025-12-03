import type { StreakTier, BadgeTheme } from '@/types';

export const STREAK_MESSAGES = {
  '4': [
    "Bravo, 4 bonnes d'affilée ! Tu tiens un super rythme 💪",
    "Top ! 4 réponses parfaites, ton cerveau chauffe 🔥",
    "4 sur 4, c'est une vraie série magique ✨",
  ],
  '8': [
    "Incroyable ! 8 bonnes réponses de suite, tu domptes les tables 👑",
    "8 d'affilée, c'est le niveau champion 🏆",
  ],
  '12': [
    "Record magique ! 12 réponses de suite, tu es un maître des tables ✨",
    "12 enchaînées, c'est du très haut niveau. Respect ! 👏",
  ],
  '20': [
    "20 d'affilée ! Tu bascules dans la zone expert 🚀",
    "Série de 20, c'est un niveau confirmé de multiplication 🔥",
  ],
  '30': [
    "30 d'affilée… c'est historique 🎯",
    "Tu viens de franchir un mur mental : 30 réponses parfaites 👑",
  ],
  'max': [
    "Perf maximale du jour ! Tu as répondu juste à toutes les questions 🌟",
    "Série parfaite : tu as explosé ton record du jour 🎉",
    "Tout bon du début à la fin, un vrai sans-faute 💫",
  ],
};

export const THEMED_BADGES: Record<BadgeTheme, Record<string, string>> = {
  space: {
    '4': 'Décollage 🚀',
    '8': 'Pilote Spatial 🛰',
    '12': 'Astro-Expert ⭐️',
    '20': 'Commandant Galactique 🪐',
    '30': 'Maître de l\'Univers 👾',
    'max': 'Élite Interstellaire 🌌',
  },
  heroes: {
    '4': 'Super Départ ⚡️',
    '8': 'Héros des Tables 🛡',
    '12': 'Pro des Multiplications 💥',
    '20': 'Super Champion ⭐️',
    '30': 'Méga Surdoué 🔥',
    'max': 'Invincible des Tables 🏅',
  },
  animals: {
    '4': 'Tigre Rapide 🐯',
    '8': 'Faucon Fulgurant 🦅',
    '12': 'Guépard Turbo ⚡️',
    '20': 'Renard Ingénieux 🦊',
    '30': 'Dragon des Tables 🐉',
    'max': 'Phénix Ultime 🔥',
  },
};

const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

const getBadgeName = (tier: string, theme: BadgeTheme): string => {
  const validTheme: BadgeTheme = ['space', 'heroes', 'animals'].includes(theme) ? theme : 'space';
  return THEMED_BADGES[validTheme][tier] || THEMED_BADGES['space'][tier];
};

interface StreakInput {
  lastAnswerIsCorrect: boolean;
  currentStreak: number;
  bestStreak: number;
  challengeQuestionCount: number;
  userBadges: string[];
  lastTierShown: StreakTier;
  badgeTheme?: BadgeTheme;
}

interface StreakOutput {
  updatedCurrentStreak: number;
  updatedBestStreak: number;
  messageToast: string | null;
  badgeUnlocked: string | null;
  showBadgeAnimation: boolean;
  updatedUserBadges: string[];
  updatedLastTierShown: StreakTier;
}

export function processStreakLogic(input: StreakInput): StreakOutput {
  const {
    lastAnswerIsCorrect,
    currentStreak,
    bestStreak,
    challengeQuestionCount,
    userBadges,
    lastTierShown,
    badgeTheme = 'space',
  } = input;

  if (!lastAnswerIsCorrect) {
    return {
      updatedCurrentStreak: 0,
      updatedBestStreak: bestStreak,
      messageToast: null,
      badgeUnlocked: null,
      showBadgeAnimation: false,
      updatedUserBadges: [...userBadges],
      updatedLastTierShown: lastTierShown,
    };
  }

  const newStreak = currentStreak + 1;
  const newBestStreak = Math.max(newStreak, bestStreak);
  let messageToast: string | null = null;
  let badgeUnlocked: string | null = null;
  let showBadgeAnimation = false;
  const updatedUserBadges = [...userBadges];
  let updatedLastTierShown: StreakTier = lastTierShown;

  const checkTier = (tier: StreakTier, streakValue: number) => {
    if (newStreak === streakValue && lastTierShown !== tier) {
      const messages = STREAK_MESSAGES[tier as keyof typeof STREAK_MESSAGES];
      if (messages) {
        messageToast = getRandomMessage(messages);
        updatedLastTierShown = tier;

        const badgeName = getBadgeName(tier as string, badgeTheme);
        if (badgeName && !updatedUserBadges.includes(badgeName)) {
          badgeUnlocked = badgeName;
          showBadgeAnimation = true;
          updatedUserBadges.push(badgeName);
        }
      }
    }
  };

  if (newStreak === challengeQuestionCount && lastTierShown !== 'max') {
    const messages = STREAK_MESSAGES['max'];
    messageToast = getRandomMessage(messages);
    updatedLastTierShown = 'max';

    const badgeName = getBadgeName('max', badgeTheme);
    if (!updatedUserBadges.includes(badgeName)) {
      badgeUnlocked = badgeName;
      showBadgeAnimation = true;
      updatedUserBadges.push(badgeName);
    }
  } else {
    checkTier('4', 4);
    checkTier('8', 8);
    checkTier('12', 12);
    checkTier('20', 20);
    checkTier('30', 30);
  }

  return {
    updatedCurrentStreak: newStreak,
    updatedBestStreak: newBestStreak,
    messageToast,
    badgeUnlocked,
    showBadgeAnimation,
    updatedUserBadges,
    updatedLastTierShown,
  };
}
