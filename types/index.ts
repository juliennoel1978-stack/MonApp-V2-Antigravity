export interface UserProgress {
  tableNumber: number;
  starsEarned: number;
  completed: boolean;
  lastPracticed?: string;
  correctAnswers: number;
  totalAttempts: number;
  averageTime?: number;
  level1Completed?: boolean;
  level2Completed?: boolean;
}

export interface UserSettings {
  voiceEnabled: boolean;
  voiceGender: 'male' | 'female';
  fontSize: 'normal' | 'large' | 'xlarge';
  timerEnabled: boolean;
  timerDuration: number;
  timerDisplayMode: 'bar' | 'chronometer';
  soundEnabled: boolean;
  avatarId: string;
  challengeQuestions?: number;
  badgeTheme?: BadgeTheme;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface Question {
  multiplicand: number;
  multiplier: number;
  correctAnswer: number;
  options: number[];
}

export type GameMode = 'discovery' | 'practice' | 'challenge';

export interface TimerSettings {
  enabled: boolean;
  duration: number;
  displayMode: 'bar' | 'chronometer';
}

export type BadgeTheme = 'space' | 'heroes' | 'animals';

export interface PersistenceBadge {
  id: string;
  threshold: number;
  title: string;
  icon: string;
  unlockedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  gender: 'boy' | 'girl';
  age: number;
  grade: string;
  photoUri?: string;
  createdAt: string;
  progress: UserProgress[];
  timerSettings?: TimerSettings;
  challengeQuestions?: number;
  challengeBadges?: string[];
  persistenceBadges?: PersistenceBadge[];
  badgeTheme?: BadgeTheme;
  challengesCompleted?: number;
  achievements?: UnlockedAchievement[];
  challengePlayDates?: string[];
}

export type StreakTier = '4' | '8' | '12' | '20' | '30' | 'max' | null;

export type AchievementType = 'ONE_SHOT' | 'RECURRING';

export interface AchievementDefinition {
  id: string;
  type: AchievementType;
  title: string;
  emoji: string;
  message: string;
  trigger: string;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  count?: number;
  lastUnlockedAt?: string;
}

export type RewardType = 'level_badge' | 'achievement';

export interface QueuedReward {
  type: RewardType;
  priority: number;
  icon: string;
  title: string;
  message: string;
  headerText: string;
  nextBadgeInfo?: NextBadgeInfo | null;
  achievementType?: AchievementType;
}

export interface NextBadgeInfo {
  title: string;
  icon: string;
  threshold: number;
  challengesRemaining: number;
}
