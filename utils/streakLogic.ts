import type { StreakTier, BadgeTheme } from '@/types';
import i18n from '@/utils/i18n';

// Keys for streak messages - now using i18n translation keys
const STREAK_MESSAGE_KEYS: Record<string, string[]> = {
  '4': [
    'streak_messages.4.msg1',
    'streak_messages.4.msg2',
    'streak_messages.4.msg3',
  ],
  '8': [
    'streak_messages.8.msg1',
    'streak_messages.8.msg2',
  ],
  '12': [
    'streak_messages.12.msg1',
    'streak_messages.12.msg2',
  ],
  '20': [
    'streak_messages.20.msg1',
    'streak_messages.20.msg2',
  ],
  '30': [
    'streak_messages.30.msg1',
    'streak_messages.30.msg2',
  ],
  'max': [
    'streak_messages.max.msg1',
    'streak_messages.max.msg2',
    'streak_messages.max.msg3',
  ],
};

// Badge name keys for each theme (now using i18n)
const THEMED_BADGE_KEYS: Record<BadgeTheme, Record<string, string>> = {
  space: {
    '4': 'streak_badges.space.4',
    '8': 'streak_badges.space.8',
    '12': 'streak_badges.space.12',
    '20': 'streak_badges.space.20',
    '30': 'streak_badges.space.30',
    'max': 'streak_badges.space.max',
  },
  heroes: {
    '4': 'streak_badges.heroes.4',
    '8': 'streak_badges.heroes.8',
    '12': 'streak_badges.heroes.12',
    '20': 'streak_badges.heroes.20',
    '30': 'streak_badges.heroes.30',
    'max': 'streak_badges.heroes.max',
  },
  animals: {
    '4': 'streak_badges.animals.4',
    '8': 'streak_badges.animals.8',
    '12': 'streak_badges.animals.12',
    '20': 'streak_badges.animals.20',
    '30': 'streak_badges.animals.30',
    'max': 'streak_badges.animals.max',
  },
};

const getRandomMessage = (keys: string[]): string => {
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return i18n.t(randomKey);
};

const getBadgeName = (tier: string, theme: BadgeTheme): string => {
  const validTheme: BadgeTheme = ['space', 'heroes', 'animals'].includes(theme) ? theme : 'space';
  const key = THEMED_BADGE_KEYS[validTheme][tier] || THEMED_BADGE_KEYS['space'][tier];
  return key ? i18n.t(key) : '';
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
      const messageKeys = STREAK_MESSAGE_KEYS[tier as keyof typeof STREAK_MESSAGE_KEYS];
      if (messageKeys) {
        messageToast = getRandomMessage(messageKeys);
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
    const messageKeys = STREAK_MESSAGE_KEYS['max'];
    messageToast = getRandomMessage(messageKeys);
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
