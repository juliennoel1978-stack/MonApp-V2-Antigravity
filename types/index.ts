export interface UserProgress {
  tableNumber: number;
  starsEarned: number;
  completed: boolean;
  lastPracticed?: string;
  correctAnswers: number;
  totalAttempts: number;
  averageTime?: number;
}

export interface UserSettings {
  voiceEnabled: boolean;
  voiceGender: 'male' | 'female';
  fontSize: 'normal' | 'large' | 'xlarge';
  timerEnabled: boolean;
  timerDuration: number;
  soundEnabled: boolean;
  avatarId: string;
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
