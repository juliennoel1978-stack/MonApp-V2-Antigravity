import { useRouter, useFocusEffect } from 'expo-router';
import { Sparkles, Settings as SettingsIcon, Trophy, Zap, UserX, Users, Plus, X } from 'lucide-react-native';
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, NumberColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { BADGE_THRESHOLDS, getBadgeForThreshold, getBadgeIcon, getBadgeTitle } from '@/constants/badges';
import ChallengeDashboardCard from '@/components/ChallengeDashboardCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { totalStars, progress, users, currentUser, selectUser, clearCurrentUser, isLoading, reloadData, settings, anonymousChallengesCompleted, getAchievements, getPersistenceBadges, getBestStreak } = useApp();
  const [showTablesModal, setShowTablesModal] = React.useState(false);
  const tablesModalOpacity = React.useRef(new Animated.Value(0)).current;
  const tablesModalScale = React.useRef(new Animated.Value(0.9)).current;
  const [dataVersion, setDataVersion] = React.useState(0);
  const [showFirstLaunchModal, setShowFirstLaunchModal] = React.useState(false);
  const hasCheckedFirstLaunch = useRef(false);
  const lastFocusTime = useRef(0);
  
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusTime.current < 500) {
        console.log('🔄 [HomeScreen] Skipping reload - too soon');
        return;
      }
      lastFocusTime.current = now;
      console.log('🔄 [HomeScreen] Screen focused - reloading data');
      reloadData();
      setDataVersion(prev => prev + 1);
    }, [reloadData])
  );

  console.log('[HomeScreen RENDER] users.length:', users.length);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.9)).current;
  const [isReady, setIsReady] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [settingsProgress, setSettingsProgress] = React.useState(0);
  const settingsTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsProgressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[HomeScreen useEffect] isLoading:', isLoading);
    
    if (!isLoading && !isReady) {
      setIsReady(true);
    }
  }, [isLoading, isReady]);

  useEffect(() => {
    console.log('[HomeScreen useEffect] Users loaded:', users.length, 'users');
    console.log('[HomeScreen useEffect] Current user:', currentUser?.firstName || 'none');
    console.log('[HomeScreen useEffect] isReady:', isReady, 'hasCheckedFirstLaunch:', hasCheckedFirstLaunch.current);
    
    if (isReady && !hasCheckedFirstLaunch.current) {
      hasCheckedFirstLaunch.current = true;
      
      if (users.length === 0 && !currentUser) {
        console.log('[HomeScreen] First launch detected - showing welcome modal');
        const timer = setTimeout(() => {
          setShowFirstLaunchModal(true);
        }, 600);
        return () => clearTimeout(timer);
      } else if (users.length > 0 && !currentUser) {
        console.log('[HomeScreen] Users exist but none selected - showing user modal');
        const timer = setTimeout(() => {
          setShowUserModal(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [users, currentUser, isReady]);

  useEffect(() => {
    if (isReady) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scaleAnim, fadeAnim, isReady]);

  useEffect(() => {
    if (showUserModal) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalOpacity.setValue(0);
      modalScale.setValue(0.9);
    }
  }, [showUserModal, modalOpacity, modalScale]);

  useEffect(() => {
    if (showTablesModal) {
      Animated.parallel([
        Animated.timing(tablesModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(tablesModalScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      tablesModalOpacity.setValue(0);
      tablesModalScale.setValue(0.9);
    }
  }, [showTablesModal, tablesModalOpacity, tablesModalScale]);

  const handleSelectUser = async (userId: string) => {
    console.log('[HomeScreen] Selecting user:', userId);
    await selectUser(userId);
    closeModal();
  };

  const handleAnonymousMode = async () => {
    await clearCurrentUser();
    closeModal();
  };

  const handleOpenModal = () => {
    console.log('[HomeScreen] ========== OPENING USER MODAL ==========');
    console.log('[HomeScreen] Users state length:', users.length);
    console.log('[HomeScreen] Is loading:', isLoading);
    console.log('[HomeScreen] Current user:', currentUser?.firstName || 'none');
    console.log('[HomeScreen] Users array:', JSON.stringify(users, null, 2));
    
    users.forEach((u, idx) => {
      console.log(`[HomeScreen]   User ${idx + 1}:`, u.firstName, 'ID:', u.id, 'Age:', u.age);
    });
    
    console.log('[HomeScreen] ================================================');
    setShowUserModal(true);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 0.9,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowUserModal(false);
    });
  };

  const openTablesModal = () => {
    console.log('[HomeScreen] Opening tables modal');
    setShowTablesModal(true);
  };

  const closeTablesModal = () => {
    Animated.parallel([
      Animated.timing(tablesModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(tablesModalScale, {
        toValue: 0.9,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTablesModal(false);
    });
  };

  const completedTables = progress.filter(p => p.completed).length;
  const totalTables = progress.length;

  const challengesCompleted = currentUser?.challengesCompleted || anonymousChallengesCompleted;
  const badgeTheme = currentUser?.badgeTheme || settings.badgeTheme || 'space';
  const gender = currentUser?.gender;
  const persistenceBadges = getPersistenceBadges();

  console.log('[HomeScreen RENDER] challenges:', challengesCompleted, 'badges:', persistenceBadges.length, 'version:', dataVersion);

  const currentBadgeData = React.useMemo(() => {
    const sortedBadges = [...persistenceBadges].sort((a, b) => b.threshold - a.threshold);
    if (sortedBadges.length > 0) {
      const latestBadge = sortedBadges[0];
      const badgeFromTheme = getBadgeForThreshold(badgeTheme, latestBadge.threshold as 1 | 4 | 7 | 10 | 15 | 20 | 25 | 30 | 45);
      if (badgeFromTheme) {
        return {
          icon: getBadgeIcon(badgeFromTheme, gender),
          title: getBadgeTitle(badgeFromTheme, gender),
        };
      }
      return {
        icon: latestBadge.icon,
        title: latestBadge.title,
      };
    }
    
    let lastEarnedBadge = null;
    for (const threshold of BADGE_THRESHOLDS) {
      if (challengesCompleted >= threshold) {
        const badge = getBadgeForThreshold(badgeTheme, threshold);
        if (badge) {
          lastEarnedBadge = {
            icon: getBadgeIcon(badge, gender),
            title: getBadgeTitle(badge, gender),
          };
        }
      }
    }
    return lastEarnedBadge;
  }, [challengesCompleted, badgeTheme, gender, persistenceBadges, dataVersion]);

  const nextBadgeThreshold = React.useMemo(() => {
    for (const threshold of BADGE_THRESHOLDS) {
      if (threshold > challengesCompleted) {
        return threshold;
      }
    }
    return null;
  }, [challengesCompleted]);

  const strongestTable = React.useMemo(() => {
    const tablesWithAttempts = progress.filter(p => p.totalAttempts > 0);
    if (tablesWithAttempts.length === 0) return null;
    
    let best = tablesWithAttempts[0];
    let bestRate = best.correctAnswers / best.totalAttempts;
    
    for (const table of tablesWithAttempts) {
      const rate = table.correctAnswers / table.totalAttempts;
      if (rate > bestRate || (rate === bestRate && table.totalAttempts > best.totalAttempts)) {
        bestRate = rate;
        best = table;
      }
    }
    
    return bestRate >= 0.7 ? best.tableNumber : null;
  }, [progress]);

  const missionTable = React.useMemo(() => {
    const tablesWithAttempts = progress.filter(p => p.totalAttempts > 0 && !p.completed);
    
    if (tablesWithAttempts.length === 0) {
      const notStarted = progress.filter(p => p.totalAttempts === 0 && !p.completed);
      return notStarted.length > 0 ? notStarted[0].tableNumber : null;
    }
    
    let worstTable = tablesWithAttempts[0];
    let worstRate = worstTable.correctAnswers / worstTable.totalAttempts;
    
    for (const table of tablesWithAttempts) {
      const rate = table.correctAnswers / table.totalAttempts;
      if (rate < worstRate) {
        worstRate = rate;
        worstTable = table;
      }
    }
    
    return worstTable.tableNumber;
  }, [progress]);

  const handleSettingsPressIn = () => {
    console.log('[HomeScreen] Settings long press started');
    setSettingsProgress(0);
    settingsProgressAnim.setValue(0);
    
    Animated.timing(settingsProgressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    let currentProgress = 0;
    settingsTimerRef.current = setInterval(() => {
      currentProgress += (100 / 30);
      if (currentProgress >= 100) {
        if (settingsTimerRef.current) {
          clearInterval(settingsTimerRef.current);
          settingsTimerRef.current = null;
        }
        setSettingsProgress(0);
        console.log('[HomeScreen] Settings unlocked - navigating');
        setTimeout(() => {
          router.push('/settings' as any);
        }, 0);
      } else {
        setSettingsProgress(currentProgress);
      }
    }, 100);
  };

  const handleSettingsPressOut = () => {
    console.log('[HomeScreen] Settings long press cancelled');
    if (settingsTimerRef.current) {
      clearInterval(settingsTimerRef.current);
      settingsTimerRef.current = null;
    }
    setSettingsProgress(0);
    settingsProgressAnim.stopAnimation();
    settingsProgressAnim.setValue(0);
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: AppColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: AppColors.text }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.backgroundContainer}>
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <Text style={{ fontSize: 18, color: AppColors.text }}>Mise à jour...</Text>
        </View>
      )}
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenModal}
            testID="users-button"
          >
            <Users size={28} color={AppColors.text} />
          </TouchableOpacity>
          <Pressable
            style={styles.settingsButton}
            onPressIn={handleSettingsPressIn}
            onPressOut={handleSettingsPressOut}
            testID="settings-button"
          >
            <View style={styles.settingsButtonInner}>
              <SettingsIcon size={28} color={AppColors.text} />
              {settingsProgress > 0 && (
                <View style={styles.settingsProgressContainer}>
                  <Animated.View
                    style={[
                      styles.settingsProgressRing,
                      {
                        transform: [{
                          rotate: settingsProgressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        }],
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.animatedContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]
          }
          >
            <View style={styles.titleContainer}>
            <View style={styles.sparkleLeft}>
              <Sparkles size={32} color={AppColors.primary} />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.title}>Tables Magiques</Text>
              {currentUser && (
                <Text style={styles.userName}>Bonjour {currentUser.firstName} !</Text>
              )}
            </View>
            <View style={styles.sparkleRight}>
              <Sparkles size={32} color={AppColors.secondary} />
            </View>
          </View>

          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleMain}>Deviens un as du calcul ✨</Text>
            <Text style={styles.subtitleSecondary}>Apprends en t{"'"}amusant !</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Trophy size={20} color={AppColors.warning} />
              <Text style={styles.progressTitle}>Ta Progression</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalStars}</Text>
                <Text style={styles.statLabel}>⭐ Étoiles</Text>
              </View>

              <View style={styles.statDivider} />

              <TouchableOpacity 
                style={styles.statItem}
                onPress={openTablesModal}
                testID="tables-progress-button"
                activeOpacity={0.7}
              >
                <Text style={styles.statValue}>
                  {completedTables}/{totalTables}
                </Text>
                <Text style={styles.statLabel}>Tables</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(completedTables / totalTables) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {missionTable !== null && (
              <TouchableOpacity
                style={styles.missionButton}
                onPress={() => router.push(`/discovery/${missionTable}` as any)}
                testID="mission-button"
                activeOpacity={0.8}
              >
                <Text style={styles.missionIcon}>🎯</Text>
                <Text style={styles.missionButtonText}>Mission : Table de {missionTable}</Text>
                <Text style={styles.missionChevron}>➔</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/tables' as any)}
            testID="start-button"
          >
            <Text style={styles.startButtonText}>Commencer</Text>
            <Sparkles size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.challengeButton}
            onPress={() => router.push('/challenge' as any)}
            testID="challenge-button"
          >
            <Text style={styles.challengeButtonText}>Challenge</Text>
            <Zap size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ChallengeDashboardCard
            key={`challenge-card-${dataVersion}`}
            theme={badgeTheme}
            currentBadge={currentBadgeData}
            nextBadgeThreshold={nextBadgeThreshold}
            totalChallengesCompleted={challengesCompleted}
            bestStreak={getBestStreak()}
            strongestTable={strongestTable}
          />
          </Animated.View>
        </ScrollView>

        {showTablesModal && (
          <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={closeTablesModal}
          >
            <TouchableOpacity
              style={styles.tablesModalOverlay}
              activeOpacity={1}
              onPress={closeTablesModal}
            >
              <Animated.View
                style={[
                  styles.tablesModalContent,
                  {
                    opacity: tablesModalOpacity,
                    transform: [{ scale: tablesModalScale }],
                  },
                ]}
              >
                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.tablesModalHeader}>
                    <Text style={styles.tablesModalTitle}>Mes Tables</Text>
                    <TouchableOpacity
                      style={styles.tablesModalCloseButton}
                      onPress={closeTablesModal}
                      testID="tables-modal-close"
                    >
                      <X size={22} color={AppColors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tablesGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tableNumber => {
                      const tableProgress = progress.find(p => p.tableNumber === tableNumber);
                      const isCompleted = tableProgress?.completed || false;
                      const hasAttempts = (tableProgress?.totalAttempts || 0) > 0;
                      const tableColor = NumberColors[tableNumber as keyof typeof NumberColors];

                      return (
                        <View
                          key={tableNumber}
                          style={[
                            styles.tablesGridCard,
                            isCompleted && styles.tablesGridCardCompleted,
                            !hasAttempts && !isCompleted && styles.tablesGridCardNotSeen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tablesGridNumber,
                              {
                                color: isCompleted
                                  ? tableColor
                                  : hasAttempts
                                  ? tableColor
                                  : AppColors.textSecondary,
                              },
                            ]}
                          >
                            {tableNumber}
                          </Text>
                          {isCompleted && (
                            <View style={styles.tablesGridStar}>
                              <Text style={styles.tablesGridStarIcon}>⭐</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.tablesModalLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, styles.legendBoxNotSeen]} />
                      <Text style={styles.legendText}>Non vue</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, styles.legendBoxCompleted]}>
                        <Text style={styles.legendStarSmall}>⭐</Text>
                      </View>
                      <Text style={styles.legendText}>Maîtrisée</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        )}

        {showUserModal && (
          <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={closeModal}
          >
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    opacity: modalOpacity,
                    transform: [{ scale: modalScale }],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeModal}
                    testID="modal-close"
                  >
                    <X size={24} color={AppColors.text} />
                  </TouchableOpacity>
                  <View style={styles.modalHeaderContent}>
                    <Text style={styles.modalTitle}>Qui es-tu ?</Text>
                    <Text style={styles.modalSubtitle}>Choisis ton profil</Text>
                    {users.length > 0 && (
                      <Text style={{ fontSize: 10, color: AppColors.textSecondary, marginTop: 4 }}>
                        ({users.length} utilisateurs disponibles)
                      </Text>
                    )}
                  </View>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.userGrid}>
                    {users.length === 0 && (
                      <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: AppColors.textSecondary, textAlign: 'center' }}>
                          Aucun utilisateur trouvé
                        </Text>
                        <Text style={{ fontSize: 14, color: AppColors.textSecondary, marginTop: 10, textAlign: 'center' }}>
                          Crée un profil pour commencer !
                        </Text>
                      </View>
                    )}
                    {users.map(user => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.modalUserCard}
                        onPress={() => handleSelectUser(user.id)}
                        testID={`modal-user-${user.id}`}
                      >
                        <View style={styles.modalAvatarContainer}>
                          {user.photoUri ? (
                            <Image source={{ uri: user.photoUri }} style={styles.modalAvatar} />
                          ) : (
                            <View style={styles.modalAvatarPlaceholder}>
                              <Text style={styles.modalAvatarEmoji}>
                                {user.gender === 'boy' ? '👦' : '👧'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.modalUserName} numberOfLines={1} adjustsFontSizeToFit>{user.firstName}</Text>
                        <Text style={styles.modalUserInfo}>{user.age} ans</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={[styles.modalUserCard, styles.addUserCard]}
                      onPress={() => {
                        closeModal();
                        router.push('/user-form' as any);
                      }}
                      testID="modal-add-user"
                    >
                      <View style={styles.modalAvatarContainer}>
                        <View style={styles.addAvatarPlaceholder}>
                          <Plus size={48} color={AppColors.primary} />
                        </View>
                      </View>
                      <Text style={styles.addUserName}>Ajouter</Text>
                    </TouchableOpacity>

                    {users.length > 0 && (
                      <TouchableOpacity
                        style={[styles.modalUserCard, styles.anonymousCard]}
                        onPress={handleAnonymousMode}
                        testID="modal-anonymous"
                      >
                        <View style={styles.modalAvatarContainer}>
                          <View style={styles.anonymousAvatarPlaceholder}>
                            <UserX size={40} color={AppColors.textSecondary} />
                          </View>
                        </View>
                        <Text style={styles.anonymousUserName}>Mode
Anonyme</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>
        )}

        {showFirstLaunchModal && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={styles.firstLaunchOverlay}>
              <View style={styles.firstLaunchContent}>
                <Text style={styles.firstLaunchEmoji}>👋</Text>
                <Text style={styles.firstLaunchTitle}>Qui es-tu ?</Text>
                <Text style={styles.firstLaunchSubtitle}>
                  Bienvenue dans Tables Magiques !{"\n"}Crée ton profil pour sauvegarder ta progression.
                </Text>

                <TouchableOpacity
                  style={styles.firstLaunchCreateButton}
                  onPress={() => {
                    setShowFirstLaunchModal(false);
                    router.push('/user-form' as any);
                  }}
                  testID="first-launch-create"
                >
                  <Plus size={24} color="#FFFFFF" />
                  <Text style={styles.firstLaunchCreateButtonText}>Créer un profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.firstLaunchAnonymousButton}
                  onPress={() => {
                    setShowFirstLaunchModal(false);
                    clearCurrentUser();
                  }}
                  testID="first-launch-anonymous"
                >
                  <UserX size={20} color={AppColors.textSecondary} />
                  <Text style={styles.firstLaunchAnonymousButtonText}>Mode Anonyme</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    gap: 12,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsButtonInner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsProgressContainer: {
    position: 'absolute',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsProgressRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: AppColors.primary,
    borderRightColor: AppColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
  },
  animatedContent: {
    width: '100%',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  titleContent: {
    alignItems: 'center',
    flexShrink: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  sparkleLeft: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleRight: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  subtitleMain: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1A365D',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  subtitleSecondary: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#4A5568',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  progressCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: AppColors.border,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: AppColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  missionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginTop: 12,
    gap: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 44,
  },
  missionIcon: {
    fontSize: 18,
  },
  missionButtonText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    flexShrink: 1,
  },
  missionChevron: {
    fontSize: 18,
    color: AppColors.primary,
    fontWeight: 'bold' as const,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 12,
    width: '100%',
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.secondary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 20,
    width: '100%',
  },
  challengeButtonText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    maxHeight: '80%',
    backgroundColor: AppColors.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: AppColors.surface,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  modalScrollView: {
    width: '100%',
  },
  modalScrollContent: {
    padding: 20,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  modalUserCard: {
    width: (width - 100) / 2,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalAvatarContainer: {
    marginBottom: 8,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.borderLight,
  },
  modalAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarEmoji: {
    fontSize: 40,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalUserInfo: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  anonymousCard: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.textSecondary,
    backgroundColor: AppColors.background,
  },
  anonymousAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousUserName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  firstLaunchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  firstLaunchContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: AppColors.background,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  firstLaunchEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  firstLaunchTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  firstLaunchSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  firstLaunchCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  firstLaunchCreateButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  firstLaunchAnonymousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.textSecondary,
  },
  firstLaunchAnonymousButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  addUserCard: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surface,
  },
  addAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addUserName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.primary,
    textAlign: 'center',
  },

  tablesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tablesModalContent: {
    width: width * 0.85,
    backgroundColor: AppColors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  tablesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  tablesModalTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  tablesModalCloseButton: {
    position: 'absolute',
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  tablesGridCard: {
    width: (width * 0.85 - 80) / 5,
    aspectRatio: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    position: 'relative',
  },
  tablesGridCardCompleted: {
    backgroundColor: '#FFF8E1',
    borderColor: AppColors.warning,
    borderWidth: 2,
  },
  tablesGridCardNotSeen: {
    backgroundColor: AppColors.borderLight,
    borderColor: AppColors.border,
  },
  tablesGridNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  tablesGridStar: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tablesGridStarIcon: {
    fontSize: 10,
  },
  tablesModalLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBoxNotSeen: {
    backgroundColor: AppColors.borderLight,
    borderColor: AppColors.border,
  },
  legendBoxCompleted: {
    backgroundColor: '#FFF8E1',
    borderColor: AppColors.warning,
  },
  legendStarSmall: {
    fontSize: 10,
  },
  legendText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
});
