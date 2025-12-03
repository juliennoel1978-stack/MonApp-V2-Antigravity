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
  badgeTheme?: BadgeTheme;
  challengesCompleted?: number;
}

export type StreakTier = '4' | '8' | '12' | '20' | '30' | 'max' | null;
