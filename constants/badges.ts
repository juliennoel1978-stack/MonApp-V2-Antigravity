import type { BadgeTheme } from '@/types';

export const BADGE_THRESHOLDS = [1, 4, 7, 10, 15, 20, 25, 30, 45] as const;

export type BadgeThreshold = typeof BADGE_THRESHOLDS[number];

export interface BadgeDefinition {
  threshold: BadgeThreshold;
  title: string;
  message: string;
  icon: string;
}

export interface GenderedBadgeDefinition {
  threshold: BadgeThreshold;
  title: string | { male: string; female: string; default: string };
  message: string;
  icon: {
    male: string;
    female: string;
    default: string;
  };
}

export type BadgeConfig = BadgeDefinition | GenderedBadgeDefinition;

export const isGenderedBadge = (badge: BadgeConfig): badge is GenderedBadgeDefinition => {
  return typeof badge.icon === 'object';
};

export const PERSISTENCE_BADGES: Record<BadgeTheme, BadgeConfig[]> = {
  space: [
    { threshold: 1, title: 'badges.space.1.title', message: 'badges.space.1.message', icon: '✨' },
    { threshold: 4, title: 'badges.space.4.title', message: 'badges.space.4.message', icon: '🌙' },
    { threshold: 7, title: 'badges.space.7.title', message: 'badges.space.7.message', icon: '🚀' },
    { threshold: 10, title: 'badges.space.10.title', message: 'badges.space.10.message', icon: { male: '👨‍🚀', female: '👩‍🚀', default: '🧑‍🚀' } },
    { threshold: 15, title: 'badges.space.15.title', message: 'badges.space.15.message', icon: '🛰️' },
    { threshold: 20, title: 'badges.space.20.title', message: 'badges.space.20.message', icon: '☀️' },
    { threshold: 25, title: 'badges.space.25.title', message: 'badges.space.25.message', icon: '🌠' },
    { threshold: 30, title: 'badges.space.30.title', message: 'badges.space.30.message', icon: '🪐' },
    { threshold: 45, title: 'badges.space.45.title', message: 'badges.space.45.message', icon: '🌌' },
  ],
  animals: [
    { threshold: 1, title: 'badges.animals.1.title', message: 'badges.animals.1.message', icon: '🐜' },
    { threshold: 4, title: 'badges.animals.4.title', message: 'badges.animals.4.message', icon: '🐿️' },
    { threshold: 7, title: 'badges.animals.7.title', message: 'badges.animals.7.message', icon: '🦊' },
    { threshold: 10, title: 'badges.animals.10.title', message: 'badges.animals.10.message', icon: '🐆' },
    { threshold: 15, title: 'badges.animals.15.title', message: 'badges.animals.15.message', icon: '🐬' },
    { threshold: 20, title: 'badges.animals.20.title', message: 'badges.animals.20.message', icon: '🦅' },
    { threshold: 25, title: 'badges.animals.25.title', message: 'badges.animals.25.message', icon: '🐻' },
    { threshold: 30, title: 'badges.animals.30.title', message: 'badges.animals.30.message', icon: '🦁' },
    { threshold: 45, title: 'badges.animals.45.title', message: 'badges.animals.45.message', icon: '🐉' },
  ],
  heroes: [
    { threshold: 1, title: 'badges.heroes.1.title', message: 'badges.heroes.1.message', icon: '🎒' },
    { threshold: 4, title: 'badges.heroes.4.title', message: 'badges.heroes.4.message', icon: '🔦' },
    { threshold: 7, title: 'badges.heroes.7.title', message: 'badges.heroes.7.message', icon: '🛡️' },
    { threshold: 10, title: 'badges.heroes.10.title', message: 'badges.heroes.10.message', icon: '⚡' },
    { threshold: 15, title: 'badges.heroes.15.title', message: 'badges.heroes.15.message', icon: '🥷' },
    { threshold: 20, title: 'badges.heroes.20.title', message: 'badges.heroes.20.message', icon: '🧠' },
    { threshold: 25, title: 'badges.heroes.25.title', message: 'badges.heroes.25.message', icon: '🦾' },
    { threshold: 30, title: 'badges.heroes.30.title', message: 'badges.heroes.30.message', icon: '💥' },
    { threshold: 45, title: { male: 'badges.heroes.45.title', female: 'badges.heroes.45.title_female', default: 'badges.heroes.45.title' }, message: 'badges.heroes.45.message', icon: { male: '🦸‍♂️', female: '🦸‍♀️', default: '🦸' } },
  ],
};

export interface UnlockedBadge {
  id: string;
  threshold: number;
  title: string;
  icon: string;
  unlockedAt: string;
}

export const getBadgeIcon = (
  badge: BadgeConfig,
  gender: 'boy' | 'girl' | undefined
): string => {
  if (isGenderedBadge(badge)) {
    if (gender === 'girl') return badge.icon.female;
    if (gender === 'boy') return badge.icon.male;
    return badge.icon.default;
  }
  return badge.icon;
};

export const getBadgeTitle = (
  badge: BadgeConfig,
  gender: 'boy' | 'girl' | undefined
): string => {
  if (isGenderedBadge(badge) && typeof badge.title === 'object') {
    if (gender === 'girl') return badge.title.female;
    if (gender === 'boy') return badge.title.male;
    return badge.title.default;
  }
  return badge.title as string;
};

export const getBadgeForThreshold = (
  theme: BadgeTheme,
  threshold: number
): BadgeConfig | undefined => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;
  return badges.find(b => b.threshold === threshold);
};

export const checkForNewBadge = (
  totalChallengesCompleted: number,
  theme: BadgeTheme,
  existingBadges: UnlockedBadge[],
  gender?: 'boy' | 'girl'
): { newBadge: UnlockedBadge | null; badgeConfig: BadgeConfig | null } => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;

  for (const badge of badges) {
    if (totalChallengesCompleted === badge.threshold) {
      const alreadyUnlocked = existingBadges.some(
        b => b.threshold === badge.threshold
      );

      if (!alreadyUnlocked) {
        const icon = getBadgeIcon(badge, gender);
        const title = getBadgeTitle(badge, gender);
        const newBadge: UnlockedBadge = {
          id: `${theme}_${badge.threshold}`,
          threshold: badge.threshold,
          title, // This now stores the translation key
          icon,
          unlockedAt: new Date().toISOString(),
        };
        return { newBadge, badgeConfig: badge };
      }
    }
  }

  return { newBadge: null, badgeConfig: null };
};

export interface NextBadgeInfo {
  title: string;
  icon: string;
  threshold: number;
  challengesRemaining: number;
}

export const getNextBadgeInfo = (
  totalChallengesCompleted: number,
  theme: BadgeTheme,
  gender?: 'boy' | 'girl'
): NextBadgeInfo | null => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;

  for (const badge of badges) {
    if (badge.threshold > totalChallengesCompleted) {
      const icon = getBadgeIcon(badge, gender);
      const title = getBadgeTitle(badge, gender);
      return {
        title, // This now returns a key
        icon,
        threshold: badge.threshold,
        challengesRemaining: badge.threshold - totalChallengesCompleted,
      };
    }
  }

  return null;
};

export interface EnduranceBadgeDefinition {
  threshold: 20 | 30 | 50;
  title: string;
  icon: string;
  backTitle: string;
  backMessage: string;
}

export const ENDURANCE_BADGES: EnduranceBadgeDefinition[] = [
  {
    threshold: 20,
    title: 'endurance.20.title',
    icon: '🧠',
    backTitle: 'endurance.20.back_title',
    backMessage: 'endurance.20.message'
  },
  {
    threshold: 30,
    title: 'endurance.30.title',
    icon: '🏃',
    backTitle: 'endurance.30.back_title',
    backMessage: 'endurance.30.message'
  },
  {
    threshold: 50,
    title: 'endurance.50.title',
    icon: '🏔️',
    backTitle: 'endurance.50.back_title',
    backMessage: 'endurance.50.message'
  }
];
