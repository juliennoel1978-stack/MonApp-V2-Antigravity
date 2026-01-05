import type { AchievementDefinition, UnlockedAchievement } from '@/types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'time_master',
    type: 'ONE_SHOT',
    title: 'achievements.time_master.title',
    emoji: '⏱️',
    message: 'achievements.time_master.message',
    backTitle: 'achievements.time_master.back_title',
    trigger: 'First time finishing with Timer ON',
  },
  {
    id: 'strategist',
    type: 'ONE_SHOT',
    title: 'achievements.strategist.title',
    emoji: '🔎',
    message: 'achievements.strategist.message',
    backTitle: 'achievements.strategist.back_title',
    trigger: 'Clicking "Revoir mes erreurs" (Review Errors)',
  },
  {
    id: 'regular_player',
    type: 'RECURRING',
    title: 'achievements.regular_player.title',
    emoji: '📅',
    message: 'achievements.regular_player.message',
    backTitle: 'achievements.regular_player.back_title',
    trigger: 'Played on 3 distinct days in current week',
  },
  {
    id: 'early_bird',
    type: 'RECURRING',
    title: 'achievements.early_bird.title',
    emoji: '🌅',
    message: 'achievements.early_bird.message',
    backTitle: 'achievements.early_bird.back_title',
    trigger: 'Finish challenge before 10:00 AM',
  },
  {
    id: 'night_owl',
    type: 'RECURRING',
    title: 'achievements.night_owl.title',
    emoji: '🦉',
    message: 'achievements.night_owl.message',
    backTitle: 'achievements.night_owl.back_title',
    trigger: 'Finish challenge after 07:00 PM (19:00)',
  },
  {
    id: 'perfect_score',
    type: 'RECURRING',
    title: 'achievements.perfect_score.title',
    emoji: '🎯',
    message: 'achievements.perfect_score.message',
    backTitle: 'achievements.perfect_score.back_title',
    trigger: 'Score === 100%',
  },
  {
    id: 'streak_max',
    type: 'RECURRING',
    title: 'achievements.streak_max.title',
    emoji: '🔥',
    message: 'achievements.streak_max.message',
    backTitle: 'achievements.streak_max.back_title',
    trigger: 'Achieve a high streak',
  },
];

export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const isAchievementUnlocked = (
  achievementId: string,
  unlockedAchievements: UnlockedAchievement[]
): boolean => {
  return unlockedAchievements.some(a => a.id === achievementId);
};

export const canUnlockRecurringAchievement = (
  achievementId: string,
  unlockedAchievements: UnlockedAchievement[]
): boolean => {
  const achievement = getAchievementById(achievementId);
  if (!achievement || achievement.type !== 'RECURRING') return false;

  const existing = unlockedAchievements.find(a => a.id === achievementId);
  if (!existing) return true;

  if (achievementId === 'regular_player') {
    return true;
  }

  const lastUnlocked = existing.lastUnlockedAt || existing.unlockedAt;
  const lastDate = new Date(lastUnlocked);
  const today = new Date();

  return (
    lastDate.getFullYear() !== today.getFullYear() ||
    lastDate.getMonth() !== today.getMonth() ||
    lastDate.getDate() !== today.getDate()
  );
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getDistinctPlayDaysThisWeek = (playDates: string[]): number => {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const uniqueDays = new Set<string>();

  playDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (date >= weekStart && date < weekEnd) {
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      uniqueDays.add(dayKey);
    }
  });

  return uniqueDays.size;
};
