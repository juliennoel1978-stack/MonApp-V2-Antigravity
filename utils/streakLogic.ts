import type { StreakTier } from '@/types';

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

export const STREAK_BADGES: Record<string, string> = {
  '4': 'Starter 🔹',
  '8': 'Champion Bronze 🥉',
  '12': 'Champion Argent 🥈',
  '20': 'Expert Or 🥇',
  '30': 'Master Diamant 💎',
  'max': 'Perfect Day 🏅',
};

const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

interface StreakInput {
  lastAnswerIsCorrect: boolean;
  currentStreak: number;
  bestStreak: number;
  challengeQuestionCount: number;
  userBadges: string[];
  lastTierShown: StreakTier;
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

        const badgeName = STREAK_BADGES[tier as string];
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

    const badgeName = STREAK_BADGES['max'];
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
