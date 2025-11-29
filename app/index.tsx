import { useRouter } from 'expo-router';
import { Sparkles, Settings as SettingsIcon, Trophy, Zap, UserX, Users, Plus, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { totalStars, progress, users, currentUser, selectUser, clearCurrentUser, isLoading } = useApp();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.9)).current;
  const [isReady, setIsReady] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);

  useEffect(() => {
    const checkUserSelection = async () => {
      console.log('[HomeScreen] isLoading:', isLoading);
      console.log('[HomeScreen] Users loaded:', users.length, 'users');
      console.log('[HomeScreen] Current user:', currentUser?.firstName || 'none');
      
      if (!isLoading) {
        if (!isReady) {
          setIsReady(true);
        }
        
        if (isReady && users.length > 0 && !currentUser) {
          setTimeout(() => {
            console.log('[HomeScreen] Opening user modal - users:', users.length);
            setShowUserModal(true);
          }, 500);
        }
      }
    };
    checkUserSelection();
  }, [users, currentUser, isReady, isLoading]);

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
    console.log('[HomeScreen] Opening user modal manually');
    console.log('[HomeScreen] Users available:', users.length);
    console.log('[HomeScreen] Users array:', JSON.stringify(users, null, 2));
    if (users.length === 0) {
      console.error('[HomeScreen] WARNING: No users found when opening modal!');
    }
    users.forEach((u, idx) => {
      console.log(`  User ${idx + 1}:`, u.firstName, u.id);
    });
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

  const completedTables = progress.filter(p => p.completed).length;
  const totalTables = progress.length;

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: AppColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: AppColors.text }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {users.length > 0 && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenModal}
              testID="users-button"
            >
              <Users size={28} color={AppColors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings' as any)}
            testID="settings-button"
          >
            <SettingsIcon size={28} color={AppColors.text} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
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

          <Text style={styles.subtitle}>
            Apprends les multiplications en t&apos;amusant !
          </Text>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Trophy size={32} color={AppColors.warning} />
              <Text style={styles.progressTitle}>Ta Progression</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalStars}</Text>
                <Text style={styles.statLabel}>⭐ Étoiles</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {completedTables}/{totalTables}
                </Text>
                <Text style={styles.statLabel}>Tables</Text>
              </View>
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

          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.push('/assistant' as any)}
            testID="assistant-button"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧙‍♂️</Text>
            </View>
            <Text style={styles.avatarLabel}>Ton Assistant Magique</Text>
          </TouchableOpacity>
        </Animated.View>

        <Modal
          key={`user-modal-${users.length}`}
          visible={showUserModal}
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
                        Aucun utilisateur trouvé ({users.length})
                      </Text>
                      <Text style={{ fontSize: 14, color: AppColors.textSecondary, marginTop: 10, textAlign: 'center' }}>
                        Crée un profil pour commencer !
                      </Text>
                    </View>
                  )}
                  {users.map(user => {
                    console.log('[Modal Render] Rendering user:', user.firstName, user.id);
                    return (
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
                        <Text style={styles.modalUserName}>{user.firstName}</Text>
                        <Text style={styles.modalUserInfo}>{user.age} ans</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={[styles.modalUserCard, styles.addUserCard]}
                    onPress={() => {
                      closeModal();
                      router.push('/select-user' as any);
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
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
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  userName: {
    fontSize: 16,
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
  subtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressCard: {
    width: width - 48,
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
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
    gap: 12,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.border,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: AppColors.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
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
    gap: 12,
    backgroundColor: AppColors.secondary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: AppColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  challengeButtonText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarLabel: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
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
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: AppColors.surface,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  modalScrollView: {
    flex: 1,
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
    padding: 20,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalAvatarContainer: {
    marginBottom: 12,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.borderLight,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarEmoji: {
    fontSize: 48,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 4,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousUserName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addUserCard: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surface,
  },
  addAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
});
