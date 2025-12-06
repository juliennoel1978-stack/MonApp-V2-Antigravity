import type { AchievementDefinition, UnlockedAchievement } from '@/types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'time_master',
    type: 'ONE_SHOT',
    title: 'Maître du Temps',
    emoji: '⏱️',
    message: 'Le chrono ne te résiste pas.',
    backTitle: 'Vitesse Éclair ! ⚡️',
    trigger: 'First time finishing with Timer ON',
  },
  {
    id: 'strategist',
    type: 'ONE_SHOT',
    title: 'Grand Stratège',
    emoji: '🔎',
    message: 'Tu apprends de tes erreurs.',
    backTitle: 'Génie en action 🧠',
    trigger: 'Clicking "Revoir mes erreurs" (Review Errors)',
  },
  {
    id: 'regular_player',
    type: 'RECURRING',
    title: 'Habitué',
    emoji: '📅',
    message: 'Tu reviens nous voir chaque jour.',
    backTitle: 'Toujours fidèle ! 🫡',
    trigger: 'Played on 3 distinct days in current week',
  },
  {
    id: 'early_bird',
    type: 'RECURRING',
    title: 'Lève-tôt',
    emoji: '🌅',
    message: 'Déjà prêt à gagner des étoiles.',
    backTitle: 'Debout champion ! ☀️',
    trigger: 'Finish challenge before 10:00 AM',
  },
  {
    id: 'night_owl',
    type: 'RECURRING',
    title: 'Insomnie',
    emoji: '🦉',
    message: 'Tu travailles même le soir !',
    backTitle: 'Oiseau de nuit 🦉',
    trigger: 'Finish challenge after 07:00 PM (19:00)',
  },
  {
    id: 'perfect_score',
    type: 'RECURRING',
    title: 'Oeil de Lynx',
    emoji: '🎯',
    message: 'Aucune erreur ne te résiste.',
    backTitle: 'Regard perçant 😼',
    trigger: 'Score === 100%',
  },
  {
    id: 'streak_max',
    type: 'RECURRING',
    title: 'Série Max',
    emoji: '🔥',
    message: 'Quelle superbe série de victoires.',
    backTitle: 'Inarrêtable ! 🔥',
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
