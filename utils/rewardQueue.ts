import type {
  QueuedReward,
  UnlockedAchievement,
  BadgeTheme,
  PersistenceBadge
} from '@/types';
import { checkForNewBadge, getNextBadgeInfo, type UnlockedBadge } from '@/constants/badges';
import {
  getAchievementById,
  isAchievementUnlocked,
  canUnlockRecurringAchievement,
  getDistinctPlayDaysThisWeek
} from '@/constants/achievements';

export interface ChallengeContext {
  totalChallengesCompleted: number;
  badgeTheme: BadgeTheme;
  existingBadges: PersistenceBadge[];
  existingAchievements: UnlockedAchievement[];
  playDates: string[];
  gender?: 'boy' | 'girl';
  timerEnabled: boolean;
  scorePercent: number;
  isReviewingErrors: boolean;
}

export interface RewardCheckResult {
  queue: QueuedReward[];
  newBadge: UnlockedBadge | null;
  newAchievements: UnlockedAchievement[];
}

const PRIORITY = {
  LEVEL_BADGE: 1,
  ONE_SHOT_ACHIEVEMENT: 2,
  RECURRING_ACHIEVEMENT: 3,
} as const;

export const checkForRewards = (context: ChallengeContext): RewardCheckResult => {
  const queue: QueuedReward[] = [];
  const newAchievements: UnlockedAchievement[] = [];
  let newBadge: UnlockedBadge | null = null;

  const { newBadge: levelBadge, badgeConfig } = checkForNewBadge(
    context.totalChallengesCompleted,
    context.badgeTheme,
    context.existingBadges as UnlockedBadge[],
    context.gender
  );

  if (levelBadge && badgeConfig) {
    newBadge = levelBadge;

    const nextBadge = getNextBadgeInfo(
      context.totalChallengesCompleted,
      context.badgeTheme,
      context.gender
    );

    queue.push({
      type: 'level_badge',
      priority: PRIORITY.LEVEL_BADGE,
      icon: levelBadge.icon,
      title: levelBadge.title,
      message: badgeConfig.message,
      headerText: 'Nouveau Niveau !',
      nextBadgeInfo: nextBadge,
    });
  }

  if (context.timerEnabled) {
    const timeMasterAchievement = getAchievementById('time_master');
    if (timeMasterAchievement && !isAchievementUnlocked('time_master', context.existingAchievements)) {
      const achievement: UnlockedAchievement = {
        id: 'time_master',
        unlockedAt: new Date().toISOString(),
        count: 1,
      };
      newAchievements.push(achievement);
      queue.push({
        type: 'achievement',
        priority: PRIORITY.ONE_SHOT_ACHIEVEMENT,
        icon: timeMasterAchievement.emoji,
        title: timeMasterAchievement.title,
        message: timeMasterAchievement.message,
        headerText: 'Nouveau Succès !',
        achievementType: 'ONE_SHOT',
      });
    }
  }

  if (context.scorePercent === 100) {
    const perfectScoreAchievement = getAchievementById('perfect_score');
    if (perfectScoreAchievement && canUnlockRecurringAchievement('perfect_score', context.existingAchievements)) {
      const achievement: UnlockedAchievement = {
        id: 'perfect_score',
        unlockedAt: new Date().toISOString(),
        count: 1,
      };
      newAchievements.push(achievement);
      queue.push({
        type: 'achievement',
        priority: PRIORITY.RECURRING_ACHIEVEMENT,
        icon: perfectScoreAchievement.emoji,
        title: perfectScoreAchievement.title,
        message: perfectScoreAchievement.message,
        headerText: 'Nouveau Succès !',
        achievementType: 'RECURRING',
      });
    }
  }

  const now = new Date();
  const hour = now.getHours();

  if (hour < 10) {
    const earlyBirdAchievement = getAchievementById('early_bird');
    if (earlyBirdAchievement && canUnlockRecurringAchievement('early_bird', context.existingAchievements)) {
      const achievement: UnlockedAchievement = {
        id: 'early_bird',
        unlockedAt: new Date().toISOString(),
        count: 1,
      };
      newAchievements.push(achievement);
      queue.push({
        type: 'achievement',
        priority: PRIORITY.RECURRING_ACHIEVEMENT,
        icon: earlyBirdAchievement.emoji,
        title: earlyBirdAchievement.title,
        message: earlyBirdAchievement.message,
        headerText: 'Nouveau Succès !',
        achievementType: 'RECURRING',
      });
    }
  }

  if (hour >= 19) {
    const nightOwlAchievement = getAchievementById('night_owl');
    if (nightOwlAchievement && canUnlockRecurringAchievement('night_owl', context.existingAchievements)) {
      const achievement: UnlockedAchievement = {
        id: 'night_owl',
        unlockedAt: new Date().toISOString(),
        count: 1,
      };
      newAchievements.push(achievement);
      queue.push({
        type: 'achievement',
        priority: PRIORITY.RECURRING_ACHIEVEMENT,
        icon: nightOwlAchievement.emoji,
        title: nightOwlAchievement.title,
        message: nightOwlAchievement.message,
        headerText: 'Nouveau Succès !',
        achievementType: 'RECURRING',
      });
    }
  }

  const todayStr = new Date().toISOString();
  const updatedPlayDates = [...context.playDates, todayStr];
  const distinctDays = getDistinctPlayDaysThisWeek(updatedPlayDates);

  if (distinctDays >= 3) {
    const regularPlayerAchievement = getAchievementById('regular_player');
    if (regularPlayerAchievement) {
      const existing = context.existingAchievements.find(a => a.id === 'regular_player');
      const lastUnlocked = existing?.lastUnlockedAt || existing?.unlockedAt;

      let shouldUnlock = false;
      if (!existing) {
        shouldUnlock = true;
      } else if (lastUnlocked) {
        const lastDate = new Date(lastUnlocked);
        const lastWeekStart = getWeekStartForDate(lastDate);
        const currentWeekStart = getWeekStartForDate(new Date());
        shouldUnlock = lastWeekStart.getTime() !== currentWeekStart.getTime();
      }

      if (shouldUnlock) {
        const achievement: UnlockedAchievement = {
          id: 'regular_player',
          unlockedAt: new Date().toISOString(),
          count: 1,
        };
        newAchievements.push(achievement);
        queue.push({
          type: 'achievement',
          priority: PRIORITY.RECURRING_ACHIEVEMENT,
          icon: regularPlayerAchievement.emoji,
          title: regularPlayerAchievement.title,
          message: regularPlayerAchievement.message,
          headerText: 'Nouveau Succès !',
          achievementType: 'RECURRING',
        });
      }
    }
  }

  queue.sort((a, b) => a.priority - b.priority);

  return {
    queue,
    newBadge,
    newAchievements,
  };
};

export const checkStrategistAchievement = (
  existingAchievements: UnlockedAchievement[]
): QueuedReward | null => {
  const strategistAchievement = getAchievementById('strategist');
  if (strategistAchievement && !isAchievementUnlocked('strategist', existingAchievements)) {
    return {
      type: 'achievement',
      priority: PRIORITY.ONE_SHOT_ACHIEVEMENT,
      icon: strategistAchievement.emoji,
      title: strategistAchievement.title,
      message: strategistAchievement.message,
      headerText: 'Nouveau Succès !',
      achievementType: 'ONE_SHOT',
    };
  }
  return null;
};

const getWeekStartForDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
