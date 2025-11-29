import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserProgress, UserSettings, Badge, User } from '@/types';
import { MULTIPLICATION_TABLES } from '@/constants/tables';

const STORAGE_KEYS = {
  PROGRESS: '@tables_magiques_progress',
  SETTINGS: '@tables_magiques_settings',
  BADGES: '@tables_magiques_badges',
  USERS: '@tables_magiques_users',
  CURRENT_USER: '@tables_magiques_current_user',
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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [progressData, settingsData, badgesData, usersData, currentUserId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.BADGES),
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
      ]);

      console.log('📦 Loading data...');
      console.log('Users data:', usersData);

      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        console.log('✅ Parsed users:', parsedUsers.length, 'users');
        setUsers(parsedUsers);

        if (currentUserId) {
          const user = parsedUsers.find((u: User) => u.id === currentUserId);
          if (user) {
            console.log('👤 Current user found:', user.firstName);
            setCurrentUser(user);
            setProgress(user.progress || INITIAL_PROGRESS);
          } else {
            console.log('⚠️ Current user ID not found in users list');
            if (progressData) {
              setProgress(JSON.parse(progressData));
            }
          }
        } else if (progressData) {
          console.log('📊 Loading global progress data');
          setProgress(JSON.parse(progressData));
        }
      } else {
        console.log('⚠️ No users data found in storage');
        if (progressData) {
          console.log('📊 Loading global progress data (no users)');
          setProgress(JSON.parse(progressData));
        }
      }

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }

      if (badgesData) {
        setBadges(JSON.parse(badgesData));
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const stars = progress.reduce((sum, p) => sum + p.starsEarned, 0);
    setTotalStars(stars);
  }, [progress]);



  const saveProgress = useCallback(async (newProgress: UserProgress[]) => {
    try {
      setProgress(newProgress);
      
      if (currentUser) {
        const updatedUser = { ...currentUser, progress: newProgress };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        setCurrentUser(updatedUser);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [currentUser, users]);

  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const saveBadges = useCallback(async (newBadges: Badge[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(newBadges));
      setBadges(newBadges);
    } catch (error) {
      console.error('Error saving badges:', error);
    }
  }, []);

  const updateTableProgress = useCallback(async (
    tableNumber: number,
    correct: number,
    total: number,
    stars: number,
    level?: 1 | 2
  ) => {
    setProgress(prevProgress => {
      const newProgress = prevProgress.map(p => {
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
      return newProgress;
    });
  }, [saveProgress]);

  const unlockBadge = useCallback((badgeId: string) => {
    const newBadges = badges.map(b => {
      if (b.id === badgeId && !b.earned) {
        return { ...b, earned: true, earnedDate: new Date().toISOString() };
      }
      return b;
    });
    saveBadges(newBadges);
  }, [badges, saveBadges]);

  const getTableProgress = useCallback((tableNumber: number): UserProgress | undefined => {
    return progress.find(p => p.tableNumber === tableNumber);
  }, [progress]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    saveSettings({ ...settings, ...newSettings });
  }, [settings, saveSettings]);

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

  const saveUsers = useCallback(async (newUsers: User[]) => {
    try {
      console.log('💾 Saving users:', newUsers.length, 'users');
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      setUsers(newUsers);
      console.log('✅ Users saved successfully');
    } catch (error) {
      console.error('❌ Error saving users:', error);
    }
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id' | 'createdAt' | 'progress'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      progress: INITIAL_PROGRESS,
    };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    return newUser;
  }, [users, saveUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    await saveUsers(updatedUsers);
    
    if (currentUser?.id === userId) {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
      setProgress(INITIAL_PROGRESS);
    }
  }, [users, currentUser, saveUsers]);

  const selectUser = useCallback(async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
      setCurrentUser(user);
      setProgress(user.progress || INITIAL_PROGRESS);
    }
  }, [users]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    );
    await saveUsers(updatedUsers);
    
    if (currentUser?.id === userId) {
      const updated = { ...currentUser, ...updates };
      setCurrentUser(updated);
    }
  }, [users, currentUser, saveUsers]);

  const clearCurrentUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
      
      const progressData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (progressData) {
        setProgress(JSON.parse(progressData));
      } else {
        setProgress(INITIAL_PROGRESS);
      }
    } catch (error) {
      console.error('Error clearing current user:', error);
      setProgress(INITIAL_PROGRESS);
    }
  }, []);

  return useMemo(() => ({
    progress,
    settings,
    badges,
    totalStars,
    users,
    currentUser,
    updateTableProgress,
    unlockBadge,
    getTableProgress,
    updateSettings,
    resetProgress,
    addUser,
    deleteUser,
    selectUser,
    updateUser,
    clearCurrentUser,
  }), [progress, settings, badges, totalStars, users, currentUser, updateTableProgress, unlockBadge, getTableProgress, updateSettings, resetProgress, addUser, deleteUser, selectUser, updateUser, clearCurrentUser]);
});
