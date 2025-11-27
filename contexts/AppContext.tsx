import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserProgress, UserSettings, Badge } from '@/types';
import { MULTIPLICATION_TABLES } from '@/constants/tables';

const STORAGE_KEYS = {
  PROGRESS: '@tables_magiques_progress',
  SETTINGS: '@tables_magiques_settings',
  BADGES: '@tables_magiques_badges',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: true,
  voiceGender: 'female',
  fontSize: 'large',
  timerEnabled: false,
  timerDuration: 10,
  soundEnabled: true,
  avatarId: 'avatar1',
};

const INITIAL_BADGES: Badge[] = [
  { id: 'first_table', name: 'Première Table', description: 'Complète ta première table', icon: '🌟', earned: false },
  { id: 'easy_master', name: 'Maître Facile', description: 'Complète toutes les tables faciles', icon: '⭐', earned: false },
  { id: 'speed_demon', name: 'Éclair', description: 'Réponds en moins de 3 secondes', icon: '⚡', earned: false },
  { id: 'perfect_score', name: 'Parfait', description: 'Obtiens 10/10 à un quiz', icon: '💯', earned: false },
  { id: 'week_streak', name: 'Régulier', description: 'Pratique 7 jours de suite', icon: '🔥', earned: false },
];

const INITIAL_PROGRESS: UserProgress[] = MULTIPLICATION_TABLES.map(table => ({
  tableNumber: table.number,
  starsEarned: 0,
  completed: false,
  correctAnswers: 0,
  totalAttempts: 0,
}));

export const [AppProvider, useApp] = createContextHook(() => {
  const [progress, setProgress] = useState<UserProgress[]>(INITIAL_PROGRESS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [totalStars, setTotalStars] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [progressData, settingsData, badgesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.BADGES),
      ]);

      if (progressData) {
        setProgress(JSON.parse(progressData));
      }

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }

      if (badgesData) {
        setBadges(JSON.parse(badgesData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const stars = progress.reduce((sum, p) => sum + p.starsEarned, 0);
    setTotalStars(stars);
  }, [progress]);



  const saveProgress = async (newProgress: UserProgress[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const saveBadges = async (newBadges: Badge[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(newBadges));
      setBadges(newBadges);
    } catch (error) {
      console.error('Error saving badges:', error);
    }
  };

  const updateTableProgress = useCallback((
    tableNumber: number,
    correct: number,
    total: number,
    stars: number,
    level?: 1 | 2
  ) => {
    const newProgress = progress.map(p => {
      if (p.tableNumber === tableNumber) {
        const updates: Partial<UserProgress> = {
          correctAnswers: p.correctAnswers + correct,
          totalAttempts: p.totalAttempts + total,
          starsEarned: Math.max(p.starsEarned, stars),
          completed: stars >= 3,
          lastPracticed: new Date().toISOString(),
        };

        if (level === 1 && correct === 10) {
          updates.level1Completed = true;
        }
        if (level === 2) {
          updates.level2Completed = true;
        }

        return { ...p, ...updates };
      }
      return p;
    });
    saveProgress(newProgress);
  }, [progress]);

  const unlockBadge = useCallback((badgeId: string) => {
    const newBadges = badges.map(b => {
      if (b.id === badgeId && !b.earned) {
        return { ...b, earned: true, earnedDate: new Date().toISOString() };
      }
      return b;
    });
    saveBadges(newBadges);
  }, [badges]);

  const getTableProgress = useCallback((tableNumber: number): UserProgress | undefined => {
    return progress.find(p => p.tableNumber === tableNumber);
  }, [progress]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    saveSettings({ ...settings, ...newSettings });
  }, [settings]);

  const resetProgress = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROGRESS,
        STORAGE_KEYS.BADGES,
      ]);
      setProgress(INITIAL_PROGRESS);
      setBadges(INITIAL_BADGES);
      setTotalStars(0);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }, []);

  return useMemo(() => ({
    progress,
    settings,
    badges,
    totalStars,
    updateTableProgress,
    unlockBadge,
    getTableProgress,
    updateSettings,
    resetProgress,
  }), [progress, settings, badges, totalStars, updateTableProgress, unlockBadge, getTableProgress, updateSettings, resetProgress]);
});
