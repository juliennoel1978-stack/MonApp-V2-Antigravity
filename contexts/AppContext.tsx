import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useRef } from 'react';
import type { UserProgress, UserSettings, Badge, User, PersistenceBadge, UnlockedAchievement } from '@/types';
import { MULTIPLICATION_TABLES } from '@/constants/tables';

const STORAGE_KEYS = {
  PROGRESS: '@tables_magiques_progress',
  SETTINGS: '@tables_magiques_settings',
  BADGES: '@tables_magiques_badges',
  USERS: '@tables_magiques_users',
  CURRENT_USER: '@tables_magiques_current_user',
  ANONYMOUS_CHALLENGES: '@tables_magiques_anonymous_challenges',
  ANONYMOUS_ACHIEVEMENTS: '@tables_magiques_anonymous_achievements',
  ANONYMOUS_PLAY_DATES: '@tables_magiques_anonymous_play_dates',
  ANONYMOUS_BADGES: '@tables_magiques_anonymous_badges',
  ANONYMOUS_BEST_STREAK: '@tables_magiques_anonymous_best_streak',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: true,
  voiceGender: 'female',
  fontSize: 'large',
  timerEnabled: false,
  timerDuration: 10,
  timerDisplayMode: 'chronometer',
  soundEnabled: true,
  avatarId: 'avatar1',
  challengeQuestions: 15,
  badgeTheme: 'space',
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
  const [isLoading, setIsLoading] = useState(true);
  const [anonymousChallengesCompleted, setAnonymousChallengesCompleted] = useState(0);
  const [anonymousAchievements, setAnonymousAchievements] = useState<UnlockedAchievement[]>([]);
  const [anonymousPlayDates, setAnonymousPlayDates] = useState<string[]>([]);
  const [anonymousPersistenceBadges, setAnonymousPersistenceBadges] = useState<PersistenceBadge[]>([]);
  const [anonymousBestStreak, setAnonymousBestStreak] = useState(0);

  const usersRef = useRef(users);
  const currentUserRef = useRef(currentUser);
  const progressRef = useRef(progress);
  const anonymousChallengesRef = useRef(anonymousChallengesCompleted);
  const anonymousPlayDatesRef = useRef(anonymousPlayDates);
  const anonymousAchievementsRef = useRef(anonymousAchievements);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    anonymousChallengesRef.current = anonymousChallengesCompleted;
  }, [anonymousChallengesCompleted]);

  useEffect(() => {
    anonymousPlayDatesRef.current = anonymousPlayDates;
  }, [anonymousPlayDates]);

  useEffect(() => {
    anonymousAchievementsRef.current = anonymousAchievements;
  }, [anonymousAchievements]);

  const updateStateAndStorage = useCallback(async (
    newCurrentUser: User | null, 
    newUsers: User[],
    skipStorage: boolean = false
  ) => {
    // 1. Update Refs immediately so subsequent calls in the same event loop see the latest data
    currentUserRef.current = newCurrentUser;
    usersRef.current = newUsers;

    // 2. Persist to Storage
    if (!skipStorage) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      } catch (error) {
        console.error('❌ Error saving users to storage:', error);
      }
    }

    // 3. Update State (triggers render)
    setUsers(newUsers);
    setCurrentUser(newCurrentUser);
  }, []);

  const loadData = useCallback(async () => {
    console.log('📦 Starting data load...');
    setIsLoading(true);
    
    let progressData: string | null = null;
    let settingsData: string | null = null;
    let badgesData: string | null = null;
    let usersData: string | null = null;
    let currentUserId: string | null = null;
    let anonymousChallenges: string | null = null;
    let anonymousAchievementsData: string | null = null;
    let anonymousPlayDatesData: string | null = null;
    let anonymousBadgesData: string | null = null;
    
    try {
      progressData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      badgesData = await AsyncStorage.getItem(STORAGE_KEYS.BADGES);
      usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      currentUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      anonymousChallenges = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_CHALLENGES);
      anonymousAchievementsData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ACHIEVEMENTS);
      anonymousPlayDatesData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_PLAY_DATES);
      anonymousBadgesData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_BADGES);
    } catch (storageError) {
      console.error('❌ Error reading from AsyncStorage:', storageError);
      setIsLoading(false);
      return;
    }

    try {

      console.log('📦 Loading data...');
      console.log('🔍 Raw users data from storage:', usersData);
      console.log('🔍 Current user ID from storage:', currentUserId);

      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        console.log('✅ Parsed users:', parsedUsers.length, 'users');
        parsedUsers.forEach((u: User, idx: number) => {
          console.log(`  User ${idx + 1}: ${u.firstName} (ID: ${u.id})`);
        });
        
        const validUsers = parsedUsers.filter((u: User) => {
          const isValid = u && u.id && u.firstName && u.gender && u.age && u.grade && u.createdAt && u.progress;
          if (!isValid) {
            console.log('⚠️ Filtering out invalid user:', u);
          }
          return isValid;
        });
        
        if (validUsers.length !== parsedUsers.length) {
          console.log(`🧹 Cleaned ${parsedUsers.length - validUsers.length} invalid user(s)`);
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(validUsers));
        }
        
        setUsers(validUsers);

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
        } else {
          console.log('ℹ️ No current user ID set');
          if (progressData) {
            console.log('📊 Loading global progress data');
            setProgress(JSON.parse(progressData));
          }
        }
      } else {
        console.log('⚠️ No users data found in storage');
        setUsers([]);
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

      if (anonymousChallenges) {
        setAnonymousChallengesCompleted(parseInt(anonymousChallenges, 10) || 0);
        console.log('🏆 Anonymous challenges loaded:', anonymousChallenges);
      }

      if (anonymousAchievementsData) {
        setAnonymousAchievements(JSON.parse(anonymousAchievementsData));
        console.log('🌟 Anonymous achievements loaded');
      }

      if (anonymousPlayDatesData) {
        setAnonymousPlayDates(JSON.parse(anonymousPlayDatesData));
        console.log('📅 Anonymous play dates loaded');
      }

      if (anonymousBadgesData) {
        setAnonymousPersistenceBadges(JSON.parse(anonymousBadgesData));
        console.log('🏅 Anonymous persistence badges loaded');
      }

      const anonymousBestStreakData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_BEST_STREAK);
      if (anonymousBestStreakData) {
        setAnonymousBestStreak(parseInt(anonymousBestStreakData, 10) || 0);
        console.log('🔥 Anonymous best streak loaded:', anonymousBestStreakData);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
      console.log('✅ Data loading complete');
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
      progressRef.current = newProgress;
      
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;

      if (currentU) {
        const updatedUser = { ...currentU, progress: newProgress };
        const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
        
        await updateStateAndStorage(updatedUser, updatedUsers);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [updateStateAndStorage]);

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
    // Use callback form to access latest state if we were using setProgress directly,
    // but here we need to read from ref to ensure we have latest base
    const currentProg = progressRef.current;
    
    const newProgress = currentProg.map(p => {
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
      
      await saveProgress(newProgress);
      return newProgress;
  }, [saveProgress]);

  const batchUpdateTableProgress = useCallback(async (
    updates: { tableNumber: number; correct: number; total: number }[]
  ) => {
    const currentProg = progressRef.current;
    const newProgress = [...currentProg];
      let hasChanges = false;

      updates.forEach(({ tableNumber, correct, total }) => {
        const index = newProgress.findIndex(p => p.tableNumber === tableNumber);
        if (index !== -1) {
          const p = newProgress[index];
          newProgress[index] = {
            ...p,
            correctAnswers: p.correctAnswers + correct,
            totalAttempts: p.totalAttempts + total,
            lastPracticed: new Date().toISOString(),
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await saveProgress(newProgress);
      }
      return newProgress;
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
        STORAGE_KEYS.ANONYMOUS_CHALLENGES,
        STORAGE_KEYS.ANONYMOUS_ACHIEVEMENTS,
        STORAGE_KEYS.ANONYMOUS_PLAY_DATES,
        STORAGE_KEYS.ANONYMOUS_BADGES,
        STORAGE_KEYS.ANONYMOUS_BEST_STREAK,
      ]);
      setProgress(INITIAL_PROGRESS);
      setBadges(INITIAL_BADGES);
      setTotalStars(0);
      setAnonymousChallengesCompleted(0);
      setAnonymousAchievements([]);
      setAnonymousPlayDates([]);
      setAnonymousPersistenceBadges([]);
      setAnonymousBestStreak(0);
      console.log('🔄 Progress reset including anonymous challenges count');
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }, []);

  const saveUsers = useCallback(async (newUsers: User[]) => {
    try {
      console.log('💾 Saving users:', newUsers.length, 'users');
      // Update ref immediately
      usersRef.current = newUsers;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      console.log('📝 Setting users state with', newUsers.length, 'users');
      setUsers(newUsers);
      console.log('✅ Users saved and state updated successfully');
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
    const currentUsrs = usersRef.current;
    const user = currentUsrs.find(u => u.id === userId);
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
      setCurrentUser(user);
      currentUserRef.current = user;
      setProgress(user.progress || INITIAL_PROGRESS);
      progressRef.current = user.progress || INITIAL_PROGRESS;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const currentUsrs = usersRef.current;
    const currentU = currentUserRef.current;
    
    const updatedUsers = currentUsrs.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    );
    await saveUsers(updatedUsers);
    
    if (currentU?.id === userId) {
      const updated = { ...currentU, ...updates };
      setCurrentUser(updated);
      currentUserRef.current = updated;
    }
  }, [saveUsers]);

  const clearCurrentUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
      currentUserRef.current = null;
      
      const progressData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (progressData) {
        const prog = JSON.parse(progressData);
        setProgress(prog);
        progressRef.current = prog;
      } else {
        setProgress(INITIAL_PROGRESS);
        progressRef.current = INITIAL_PROGRESS;
      }
    } catch (error) {
      console.error('Error clearing current user:', error);
      setProgress(INITIAL_PROGRESS);
      progressRef.current = INITIAL_PROGRESS;
    }
  }, []);

  const incrementChallengesCompleted = useCallback(async (): Promise<number> => {
    try {
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;
      
      if (currentU) {
        const newCount = (currentU.challengesCompleted || 0) + 1;
        const updatedUser = { ...currentU, challengesCompleted: newCount };
        const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
        
        await updateStateAndStorage(updatedUser, updatedUsers);
        
        console.log('🏆 User challenges completed:', newCount);
        return newCount;
      } else {
        const currentAnon = anonymousChallengesRef.current;
        const newCount = currentAnon + 1;
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_CHALLENGES, newCount.toString());
        setAnonymousChallengesCompleted(newCount);
        anonymousChallengesRef.current = newCount;
        console.log('🏆 Anonymous challenges completed:', newCount);
        return newCount;
      }
    } catch (error) {
      console.error('Error incrementing challenges completed:', error);
      return currentUserRef.current?.challengesCompleted || anonymousChallengesRef.current;
    }
  }, [updateStateAndStorage]);

  const addPersistenceBadge = useCallback(async (badge: PersistenceBadge) => {
    try {
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;
      
      if (currentU) {
        const existingBadges = currentU.persistenceBadges || [];
        const alreadyExists = existingBadges.some(b => b.id === badge.id);
        if (alreadyExists) {
          console.log('🏅 Badge already exists:', badge.id);
          return;
        }
        const updatedBadges = [...existingBadges, badge];
        const updatedUser = { ...currentU, persistenceBadges: updatedBadges };
        const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
        
        await updateStateAndStorage(updatedUser, updatedUsers);
        console.log('🏅 New persistence badge added:', badge.title, badge.icon);
      } else {
        // ... (anonymous handling is fine as it uses different state)
        const existingBadges = anonymousPersistenceBadges;
        const alreadyExists = existingBadges.some(b => b.id === badge.id);
        if (alreadyExists) return;
        
        const updatedBadges = [...existingBadges, badge];
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_BADGES, JSON.stringify(updatedBadges));
        setAnonymousPersistenceBadges(updatedBadges);
        console.log('🏅 New anonymous persistence badge added:', badge.title, badge.icon);
      }
    } catch (error) {
      console.error('Error adding persistence badge:', error);
    }
  }, [anonymousPersistenceBadges, updateStateAndStorage]);

  const reloadData = useCallback(() => {
    loadData();
  }, [loadData]);

  const addAchievement = useCallback(async (achievement: UnlockedAchievement) => {
    try {
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;

      if (currentU) {
        const existingAchievements = currentU.achievements || [];
        const existingIndex = existingAchievements.findIndex(a => a.id === achievement.id);
        
        let updatedAchievements: UnlockedAchievement[];
        if (existingIndex >= 0) {
          updatedAchievements = existingAchievements.map((a, idx) =>
            idx === existingIndex
              ? { ...a, count: (a.count || 1) + 1, lastUnlockedAt: achievement.unlockedAt }
              : a
          );
        } else {
          updatedAchievements = [...existingAchievements, { ...achievement, count: 1 }];
        }
        
        const updatedUser = { ...currentU, achievements: updatedAchievements };
        const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
        
        await updateStateAndStorage(updatedUser, updatedUsers);
        console.log('🌟 Achievement added:', achievement.id);
      } else {
        const existingIndex = anonymousAchievementsRef.current.findIndex(a => a.id === achievement.id);
        
        let updatedAchievements: UnlockedAchievement[];
        if (existingIndex >= 0) {
          updatedAchievements = anonymousAchievementsRef.current.map((a, idx) =>
            idx === existingIndex
              ? { ...a, count: (a.count || 1) + 1, lastUnlockedAt: achievement.unlockedAt }
              : a
          );
        } else {
          updatedAchievements = [...anonymousAchievementsRef.current, { ...achievement, count: 1 }];
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ACHIEVEMENTS, JSON.stringify(updatedAchievements));
        setAnonymousAchievements(updatedAchievements);
        anonymousAchievementsRef.current = updatedAchievements;
        console.log('🌟 Anonymous achievement added:', achievement.id);
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  }, [updateStateAndStorage]);

  const addPlayDate = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;

      if (currentU) {
        const existingDates = currentU.challengePlayDates || [];
        const updatedDates = [...existingDates, now];
        const updatedUser = { ...currentU, challengePlayDates: updatedDates };
        const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
        
        await updateStateAndStorage(updatedUser, updatedUsers);
        console.log('📅 Play date added for user');
      } else {
        const updatedDates = [...anonymousPlayDatesRef.current, now];
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_PLAY_DATES, JSON.stringify(updatedDates));
        setAnonymousPlayDates(updatedDates);
        anonymousPlayDatesRef.current = updatedDates;
        console.log('📅 Anonymous play date added');
      }
    } catch (error) {
      console.error('Error adding play date:', error);
    }
  }, [updateStateAndStorage]);

  const getAchievements = useCallback((): UnlockedAchievement[] => {
    if (currentUser) {
      return currentUser.achievements || [];
    }
    return anonymousAchievements;
  }, [currentUser, anonymousAchievements]);

  const getPlayDates = useCallback((): string[] => {
    if (currentUser) {
      return currentUser.challengePlayDates || [];
    }
    return anonymousPlayDates;
  }, [currentUser, anonymousPlayDates]);

  const getPersistenceBadges = useCallback((): PersistenceBadge[] => {
    if (currentUser) {
      return currentUser.persistenceBadges || [];
    }
    return anonymousPersistenceBadges;
  }, [currentUser, anonymousPersistenceBadges]);

  const getBestStreak = useCallback((): number => {
    if (currentUser) {
      return currentUser.bestStreak || 0;
    }
    return anonymousBestStreak;
  }, [currentUser, anonymousBestStreak]);

  const updateBestStreak = useCallback(async (newStreak: number) => {
    try {
      const currentU = currentUserRef.current;
      const currentUsrs = usersRef.current;

      if (currentU) {
        const currentBest = currentU.bestStreak || 0;
        if (newStreak > currentBest) {
          const updatedUser = { ...currentU, bestStreak: newStreak };
          const updatedUsers = currentUsrs.map(u => u.id === currentU.id ? updatedUser : u);
          
          await updateStateAndStorage(updatedUser, updatedUsers);
          console.log('🔥 Best streak updated for user:', newStreak);
        }
      } else {
        if (newStreak > anonymousBestStreak) {
          await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_BEST_STREAK, newStreak.toString());
          setAnonymousBestStreak(newStreak);
          console.log('🔥 Anonymous best streak updated:', newStreak);
        }
      }
    } catch (error) {
      console.error('Error updating best streak:', error);
    }
  }, [anonymousBestStreak, updateStateAndStorage]);

  return {
    progress,
    settings,
    badges,
    totalStars,
    users,
    currentUser,
    isLoading,
    anonymousChallengesCompleted,
    anonymousPersistenceBadges,
    updateTableProgress,
    batchUpdateTableProgress,
    unlockBadge,
    getTableProgress,
    updateSettings,
    resetProgress,
    addUser,
    deleteUser,
    selectUser,
    updateUser,
    clearCurrentUser,
    incrementChallengesCompleted,
    addPersistenceBadge,
    reloadData,
    addAchievement,
    addPlayDate,
    getAchievements,
    getPlayDates,
    getPersistenceBadges,
    getBestStreak,
    updateBestStreak,
  };
});
