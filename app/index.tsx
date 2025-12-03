import { useRouter, useFocusEffect } from 'expo-router';
import { Sparkles, Settings as SettingsIcon, Trophy, Zap, UserX, Users, Plus, X } from 'lucide-react-native';
import React, { useEffect, useCallback } from 'react';
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
import { FontFamily } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { totalStars, progress, users, currentUser, selectUser, clearCurrentUser, isLoading, reloadData } = useApp();
  
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [HomeScreen] Screen focused - reloading data');
      reloadData();
    }, [reloadData])
  );

  console.log('[HomeScreen RENDER] users.length:', users.length);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.9)).current;
  const [isReady, setIsReady] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);

  useEffect(() => {
    const checkUserSelection = async () => {
      console.log('[HomeScreen useEffect] isLoading:', isLoading);
      console.log('[HomeScreen useEffect] Users loaded:', users.length, 'users');
      console.log('[HomeScreen useEffect] Current user:', currentUser?.firstName || 'none');
      
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

  const completedTables = progress.filter(p => p.completed).length;
  const totalTables = progress.length;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenModal}
            testID="users-button"
          >
            <Users size={28} color={AppColors.text} />
          </TouchableOpacity>
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
            Apprends les multiplications en jouant : chasse les étoiles, décroche tes badges !
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


        </Animated.View>

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
                        <Text style={{ fontSize: 12, color: AppColors.error, marginTop: 10, textAlign: 'center' }}>
                          DEBUG: users.length = {users.length}
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
    fontSize: 28,
    fontFamily: FontFamily.title,
    color: AppColors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: FontFamily.body,
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
    fontSize: 16,
    fontFamily: FontFamily.bodyRegular,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
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
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: FontFamily.titleMedium,
    color: AppColors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: FontFamily.title,
    color: AppColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FontFamily.body,
    color: AppColors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 35,
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
    gap: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
    width: '100%',
  },
  startButtonText: {
    fontSize: 20,
    fontFamily: FontFamily.title,
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
    shadowColor: AppColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
    width: '100%',
  },
  challengeButtonText: {
    fontSize: 20,
    fontFamily: FontFamily.title,
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
    fontFamily: FontFamily.title,
    color: AppColors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: FontFamily.bodyRegular,
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
    fontFamily: FontFamily.bodyBold,
    color: AppColors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalUserInfo: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
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
});
