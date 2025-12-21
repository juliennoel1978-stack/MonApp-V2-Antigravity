import { useRouter } from 'expo-router';
import { Clock, Users, Trash2, Edit, RotateCcw, Award, Zap, RefreshCw, Calendar, ChevronDown, ChevronUp, Play, Timer } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import CollectionModal from '@/components/CollectionModal';



// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Jamais';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BADGE_NAMES: Record<string, string> = {
  '10_correct': 'Débutant',
  '50_correct': 'Expert',
  '100_correct': 'Maître',
  'streak_3': 'Série 3',
  'streak_5': 'Série 5',
  'streak_10': 'Série 10',
  'fast_answer': 'Éclair',
  'perfect_score': 'Parfait',
};

const BADGE_ICONS: Record<string, string> = {
  '10_correct': '🥉',
  '50_correct': '🥈',
  '100_correct': '🥇',
  'streak_3': '🔥',
  'streak_5': '🔥🔥',
  'streak_10': '🔥🔥🔥',
  'fast_answer': '⚡',
  'perfect_score': '⭐',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetProgress, users, deleteUser, currentUser, selectUser, updateUser } = useApp();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Badge Modal State
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeModalUser, setBadgeModalUser] = useState<any>(null);

  const getTableStatusColor = (user: any, tableNum: number) => {
    const p = user.progress.find((tp: any) => tp.tableNumber === tableNum);

    // 1. Not Started -> GREY
    // If no progress entry exists OR totalAttempts is 0.
    if (!p || (p.totalAttempts || 0) === 0) return '#F0F0F0';

    // 2. Mastered -> GREEN
    // "niveau un et niveau 2 fait" -> level1Completed AND level2Completed
    // OR 3 stars OR completed flag (legacy support)
    if ((p.level1Completed && p.level2Completed) || p.completed || (p.starsEarned >= 3)) {
      return AppColors.success;
    }

    // 3. In Progress -> YELLOW (Warning)
    // "un seul niveau validé jaune" -> Matches here if not fully mastered.
    return AppColors.warning;
  };

  const getStrongestTable = (user: any) => {
    // Use explicit strongestTable or lastSessionBestTable if available
    if (user.strongestTable) return user.strongestTable;

    // Fallback calculation
    let bestTable = 0;
    let bestRate = -1;

    user.progress.forEach((p: any) => {
      if (p.totalAttempts > 5) { // Minimum attempts to be significant
        const rate = p.correctAnswers / p.totalAttempts;
        if (rate > bestRate) {
          bestRate = rate;
          bestTable = p.tableNumber;
        }
      }
    });
    return bestRate > 0.7 ? bestTable : '-';
  };

  const getWeakestTable = (user: any) => {
    // SMART RECOMMENDATION LOGIC (Mission Button Logic)
    // 1. PROGRESSION: Find first table (1-10) not mastered.
    // Definition of 'not mastered' must match Green status above.
    const isMastered = (p: any) => (p.level1Completed && p.level2Completed) || p.completed || (p.starsEarned >= 3);

    for (let i = 1; i <= 10; i++) {
      const p = user.progress.find((prog: any) => prog.tableNumber === i);
      // If not started (no p) or not mastered -> Recommend it
      if (!p || !isMastered(p)) {
        return i;
      }
    }

    // 2. WEAKNESS/CONSOLIDATION: If all 1-10 mastered, check for poor success rate
    const tablesWithAttempts = user.progress.filter((p: any) => p.tableNumber >= 1 && p.tableNumber <= 10 && p.totalAttempts > 0);
    let worstTable = 0;
    let worstRate = 1.0;

    for (const p of tablesWithAttempts) {
      const rate = p.correctAnswers / p.totalAttempts;
      if (rate < 0.85) {
        if (rate < worstRate) {
          worstRate = rate;
          worstTable = p.tableNumber;
        }
      }
    }
    if (worstTable !== 0) return worstTable;

    // 3. MAINTENANCE: If all good, pick least recently practiced
    const sortedByDate = [...tablesWithAttempts].sort((a: any, b: any) => {
      if (!a.lastPracticed) return -1;
      if (!b.lastPracticed) return 1;
      return new Date(a.lastPracticed).getTime() - new Date(b.lastPracticed).getTime();
    });

    if (sortedByDate.length > 0) {
      return sortedByDate[0].tableNumber;
    }

    return "Aucune";
  };

  const getAverageTime = (user: any) => {
    let totalWeightedTime = 0;
    let totalAttempts = 0;

    user.progress.forEach((p: any) => {
      if (p.averageTime && p.totalAttempts) {
        totalWeightedTime += (p.averageTime * p.totalAttempts);
        totalAttempts += p.totalAttempts;
      }
    });

    if (totalAttempts === 0) return '-';
    return (totalWeightedTime / totalAttempts / 1000).toFixed(1) + 's';
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  };

  const badgeThemes = [
    { value: 'space', label: 'Espace', icon: '🚀' },
    { value: 'animals', label: 'Animaux', icon: '🦁' },
    { value: 'heroes', label: 'Héros', icon: '🦸' },
  ];

  const handleResetUser = (user: any) => {
    const resetAction = () => {
      const resetUser = {
        ...user,
        progress: user.progress.map((p: any) => ({
          ...p,
          starsEarned: 0,
          completed: false,
          correctAnswers: 0,
          totalAttempts: 0,
          level1Completed: false,
          level2Completed: false,
          averageTime: 0
        })),
        challengesCompleted: 0,
        bestStreak: 0,
        persistenceBadges: [],
        achievements: [],
        badgesCompleted: 0,
        strongestTable: 0,
        lastSessionBestTable: 0,
        totalStars: 0
      };
      updateUser(user.id, resetUser);
    };

    if (Platform.OS === 'web') {
      // @ts-ignore
      if (confirm(`Réinitialiser ${user.firstName} ?`)) resetAction();
    } else {
      Alert.alert(
        "Réinitialiser ?",
        "Ceci effacera TOUS les progrès (badges, scores, temps).",
        [{ text: "Annuler" }, { text: "Réinitialiser", style: 'destructive', onPress: resetAction }]
      );
    }
  };

  const getUserBadges = (user: any) => {
    if (!user.persistenceBadges) return [];
    // If persistenceBadges contains IDs
    return user.persistenceBadges.map((id: string) => ({
      id,
      name: BADGE_NAMES[id] || 'Badge',
      icon: BADGE_ICONS[id] || '🏅'
    }));
  };

  const handleOpenBadges = (user: any) => {
    setBadgeModalUser(user);
    setShowBadgeModal(true);
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ThemedText style={styles.headerButtonText}>✕</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Paramètres</ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PARENT ZONE / USERS SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Users size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Espace Parents & Profils</Text>
            </View>
            <Text style={[styles.sectionNote, { marginBottom: 16 }]}>
              Gérez les profils et suivez la progression.
            </Text>

            {users.filter(u => u && u.firstName).map(user => {
              const isExpanded = expandedUserId === user.id;
              const isCurrent = currentUser?.id === user.id;
              const userBadges = getUserBadges(user);

              return (
                <View key={user.id} style={[styles.userCard, isExpanded && styles.userCardExpanded, isCurrent && styles.userCardActive]}>
                  {/* User Header (Always visible) */}
                  <TouchableOpacity
                    style={[styles.userCardHeader, isCurrent && styles.userCardHeaderActive]}
                    onPress={() => toggleUserExpand(user.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userHeaderLeft}>
                      <View style={styles.avatarContainer}>
                        {user.photoUri ? (
                          <Image source={{ uri: user.photoUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        ) : (
                          <ThemedText style={{ fontSize: 24 }}>
                            {user.gender === 'boy' ? '👦' : '👧'}
                          </ThemedText>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.userName, isCurrent && { color: AppColors.primary }]}>{user.firstName}</ThemedText>
                        <ThemedText style={styles.userDetails}>{user.age} ans • {user.grade}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.userHeaderRight}>
                      {isCurrent && <View style={styles.badgeCurrent}><Text style={styles.badgeCurrentText}>Actif</Text></View>}
                      {isExpanded ? <ChevronUp size={20} color={AppColors.textSecondary} /> : <ChevronDown size={20} color={AppColors.textSecondary} />}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Content: Stats & Actions */}
                  {isExpanded && (
                    <View style={styles.userCardContent}>

                      {/* SELECT PROFILE BUTTON */}
                      {!isCurrent && (
                        <TouchableOpacity
                          style={styles.selectProfileButton}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              // @ts-ignore
                              if (confirm(`Choisir ${user.firstName} ?`)) { selectUser(user.id); router.back(); }
                            } else {
                              Alert.alert("Choisir ce profil", `Basculer sur ${user.firstName} ?`, [
                                { text: "Annuler", style: "cancel" },
                                { text: "Oui", onPress: () => { selectUser(user.id); router.back(); } }
                              ]);
                            }
                          }}
                        >
                          <Play size={20} fill="#FFF" color="#FFF" />
                          <Text style={styles.selectProfileButtonText}>Choisir ce profil</Text>
                        </TouchableOpacity>
                      )}

                      {/* KPIs ROW 1 */}
                      <View style={styles.kpiRow}>
                        <TouchableOpacity
                          style={styles.kpiItem}
                          onPress={() => handleOpenBadges(user)}
                        >
                          <Award size={20} color={AppColors.warning} />
                          <Text style={styles.kpiValue}>
                            {userBadges.length}
                            {/* Note: This counts persistence badges array, logic matches CollectionModal */}
                          </Text>
                          <Text style={styles.kpiLabel}>Badges</Text>
                        </TouchableOpacity>
                        <View style={styles.kpiItem}>
                          <RefreshCw size={20} color={AppColors.primary} />
                          <Text style={styles.kpiValue}>
                            {user.challengesCompleted || 0}
                          </Text>
                          <Text style={styles.kpiLabel}>Défis</Text>
                        </View>
                        <View style={styles.kpiItem}>
                          <Timer size={20} color={AppColors.secondary} />
                          <Text style={styles.kpiValue}>
                            {getAverageTime(user)}
                          </Text>
                          <Text style={styles.kpiLabel}>Vitesse moy.</Text>
                        </View>
                      </View>

                      {/* BADGE LIST PREVIEW (Small visual line, removed since we have big modal now?) 
                                  User said: "je ne veux pas de la collection de medaille je veux voir les badges obetenu, on peut faire apparaitre la fenetre avec le meme mode de fonctionnement que lorsque l'on est est sur la home"
                                  So I keep the visual indicators but the tap logic opens the modal.
                              */}

                      {/* KPIs ROW 2: Strongest/Weakest */}
                      <View style={[styles.kpiRow, { marginTop: 0 }]}>
                        <View style={styles.kpiItem}>
                          <Text style={[styles.kpiValue, { color: AppColors.success }]}>
                            Table {getStrongestTable(user)}
                          </Text>
                          <Text style={styles.kpiLabel}>Table Forte</Text>
                        </View>
                        <View style={styles.kpiItem}>
                          <Text style={[styles.kpiValue, { color: AppColors.error }]}>
                            Table {getWeakestTable(user)}
                          </Text>
                          <Text style={styles.kpiLabel}>À revoir</Text>
                        </View>
                      </View>

                      {/* ACTIVITY DATE */}
                      <View style={styles.activityRow}>
                        <Calendar size={14} color={AppColors.textSecondary} />
                        <Text style={styles.activityText}>
                          Dernière activité : {formatDate(user.progress.reduce((latest: string, p: any) => {
                            if (!p.lastPracticed) return latest;
                            return (!latest || new Date(p.lastPracticed) > new Date(latest)) ? p.lastPracticed : latest;
                          }, user.createdAt))}
                        </Text>
                      </View>

                      {/* RADAR */}
                      <Text style={styles.radarTitle}>Maîtrise des Tables</Text>
                      <View style={styles.radarGrid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                          const color = getTableStatusColor(user, num);
                          return (
                            <View key={num} style={[styles.radarDot, { backgroundColor: color }]}>
                              <Text style={[styles.radarNum, { color: color === '#F0F0F0' ? '#BBB' : '#FFF' }]}>{num}</Text>
                            </View>
                          );
                        })}
                      </View>

                      <View style={styles.divider} />

                      {/* MANAGEMENT ACTIONS (STACKED) */}
                      <View style={styles.userActionsStack}>
                        <TouchableOpacity
                          style={styles.actionButtonWide}
                          onPress={() => router.push(`/user-form?userId=${user.id}` as any)}
                        >
                          <Edit size={18} color={AppColors.text} />
                          <Text style={styles.actionButtonText}>Modifier le profil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionButtonWide}
                          onPress={() => handleResetUser(user)}
                        >
                          <RotateCcw size={18} color={AppColors.text} />
                          <Text style={styles.actionButtonText}>Réinitialiser la progression</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButtonWide, styles.actionButtonDestructiveWide]}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              // @ts-ignore
                              if (window.confirm("Supprimer ?")) deleteUser(user.id);
                            } else {
                              Alert.alert("Supprimer ?", "Action irréversible.", [{ text: "Annuler" }, { text: "Supprimer", style: 'destructive', onPress: () => deleteUser(user.id) }]);
                            }
                          }}
                        >
                          <Trash2 size={18} color={AppColors.error} />
                          <Text style={[styles.actionButtonText, { color: AppColors.error }]}>Supprimer le profil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addUserButton}
              onPress={() => router.push('/user-form' as any)}
            >
              <Text style={styles.addUserButtonText}>+ Ajouter un profil</Text>
            </TouchableOpacity>

          </View>

          {/* GENERAL SETTINGS + ANONYMOUS RESET */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Zap size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Préférences Générales (Tous)</Text>
            </View>
            <Text style={[styles.sectionNote, { marginBottom: 16 }]}>
              Appliqué à tous les profils.
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <ThemedText style={styles.settingTitle}>Musique & Sons</ThemedText>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={v => updateSettings({ soundEnabled: v })}
                trackColor={{ false: AppColors.borderLight, true: AppColors.primary }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <ThemedText style={styles.settingTitle}>Vibrations</ThemedText>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={v => updateSettings({ hapticsEnabled: v })}
                trackColor={{ false: AppColors.borderLight, true: AppColors.primary }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <ThemedText style={styles.settingTitle}>Synthèse Vocale</ThemedText>
              </View>
              <Switch
                value={settings.voiceEnabled}
                onValueChange={v => updateSettings({ voiceEnabled: v })}
                trackColor={{ false: AppColors.borderLight, true: AppColors.primary }}
              />
            </View>

            {settings.voiceEnabled && (
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <ThemedText style={styles.settingTitle}>Voix de l&apos;Assistant</ThemedText>
                  <Text style={styles.settingSubTitle}>Masculine ou Féminine</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => updateSettings({ voiceGender: 'female' })}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: settings.voiceGender === 'female' ? AppColors.primary : AppColors.surfaceLight,
                      opacity: settings.voiceGender === 'female' ? 1 : 0.5
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>👩</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateSettings({ voiceGender: 'male' })}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: settings.voiceGender === 'male' ? AppColors.primary : AppColors.surfaceLight,
                      opacity: settings.voiceGender === 'male' ? 1 : 0.5
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>👨</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <ThemedText style={styles.settingTitle}>Mode Zen</ThemedText>
                <Text style={styles.settingSubTitle}>Moins d&apos;animations</Text>
              </View>
              <Switch
                value={settings.zenMode}
                onValueChange={v => updateSettings({ zenMode: v })}
                trackColor={{ false: AppColors.borderLight, true: AppColors.primary }}
              />
            </View>

            <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.settingTitle, { marginBottom: 12 }]}>Police d&apos;écriture</Text>
              <Text style={[styles.settingSubTitle, { marginBottom: 16 }]}>Choisissez le style de texte le plus confortable</Text>

              <View style={[styles.challengeQuestionsButtons, { flexDirection: 'column', width: '100%', gap: 8 }]}>
                {/* Standard */}
                <TouchableOpacity
                  style={[
                    styles.challengeQuestionButton,
                    { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
                    (settings.fontPreference === 'standard' || (!settings.fontPreference && !settings.dyslexiaFontEnabled)) && styles.challengeQuestionButtonActive
                  ]}
                  onPress={() => updateSettings({ fontPreference: 'standard', dyslexiaFontEnabled: false })}
                >
                  <Text style={{ fontSize: 16, color: '#333' }}>Standard</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>Arrondie (Défaut)</Text>
                </TouchableOpacity>

                {/* Lexend */}
                <TouchableOpacity
                  style={[
                    styles.challengeQuestionButton,
                    { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
                    (settings.fontPreference === 'lexend' || (!settings.fontPreference && settings.dyslexiaFontEnabled)) && styles.challengeQuestionButtonActive
                  ]}
                  onPress={() => updateSettings({ fontPreference: 'lexend', dyslexiaFontEnabled: true })}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'Lexend', color: '#333' }}>Moderne</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>Fluide (Lexend)</Text>
                </TouchableOpacity>

                {/* OpenDyslexic */}
                <TouchableOpacity
                  style={[
                    styles.challengeQuestionButton,
                    {
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center', // Align items vertically center
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                      minHeight: 56, // Ensure enough height for wrap
                    },
                    settings.fontPreference === 'opendyslexic' && styles.challengeQuestionButtonActive
                  ]}
                  onPress={() => updateSettings({ fontPreference: 'opendyslexic', dyslexiaFontEnabled: false })}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 16, fontFamily: 'OpenDyslexic', color: '#333' }}>Spéciale Dys</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#666' }}>OpenDyslexic</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ANONYMOUS RESET BTN - Moved here for better visibility */}
            {/* ANONYMOUS RESET BTN - Always visible for easier access */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionButtonWide}
              onPress={() => {
                Alert.alert(
                  "Réinitialiser le mode invité ?",
                  "Effacer toute la progression anonyme (non sauvegardée) ?",
                  [{ text: "Annuler" }, { text: "Effacer", style: "destructive", onPress: resetProgress }]
                )
              }}
            >
              <RotateCcw size={18} color={AppColors.textSecondary} />
              <Text style={[styles.actionButtonText, { color: AppColors.textSecondary }]}>Réinitialiser mode Invité</Text>
            </TouchableOpacity>
          </View>

          {/* GAME SETTINGS */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Clock size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Paramètres de Jeu</Text>
            </View>

            {/* Question Count */}
            <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.settingTitle, { marginBottom: 12 }]}>Questions par Challenge</Text>
              <View style={styles.challengeQuestionsButtons}>
                {[10, 15, 20, 30].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.challengeQuestionButton,
                      (settings.challengeQuestions || 15) === num && styles.challengeQuestionButtonActive,
                    ]}
                    onPress={() => updateSettings({ challengeQuestions: num })}
                  >
                    <Text
                      style={[
                        styles.challengeQuestionButtonText,
                        (settings.challengeQuestions || 15) === num && styles.challengeQuestionButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Badge Theme */}
            <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.settingTitle, { marginBottom: 12 }]}>Thème des Badges</Text>
              <View style={styles.challengeQuestionsButtons}>
                {badgeThemes.map((theme) => (
                  <TouchableOpacity
                    key={theme.value}
                    style={[
                      styles.challengeQuestionButton,
                      (settings.badgeTheme || 'space') === theme.value && styles.challengeQuestionButtonActive
                    ]}
                    onPress={() => updateSettings({ badgeTheme: theme.value as any })}
                  >
                    <Text style={[
                      styles.challengeQuestionButtonText,
                      (settings.badgeTheme || 'space') === theme.value && styles.challengeQuestionButtonTextActive
                    ]}>
                      {theme.icon} {theme.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timer Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <ThemedText style={styles.settingTitle}>Chronomètre</ThemedText>
                <Text style={styles.settingSubTitle}>Activer le temps en challenge</Text>
              </View>
              <Switch
                value={settings.timerEnabled}
                onValueChange={v => updateSettings({ timerEnabled: v })}
                trackColor={{ false: AppColors.borderLight, true: AppColors.primary }}
              />
            </View>

            {/* Advanced Timer Settings (Conditional) */}
            {settings.timerEnabled && (
              <View style={{ marginTop: -12, marginBottom: 20, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: AppColors.borderLight }}>

                {/* Timer Mode */}
                <Text style={[styles.settingTitle, { fontSize: 14, marginBottom: 8, marginTop: 8 }]}>Mode d&apos;affichage</Text>
                <View style={styles.challengeQuestionsButtons}>
                  {[
                    { id: 'chronometer', label: '⏱️ Chrono' },
                    { id: 'bar', label: '📊 Barre' }
                  ].map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.challengeQuestionButton,
                        (settings.timerDisplayMode || 'chronometer') === mode.id && styles.challengeQuestionButtonActive
                      ]}
                      onPress={() => updateSettings({ timerDisplayMode: mode.id as any })}
                    >
                      <Text style={[
                        styles.challengeQuestionButtonText,
                        (settings.timerDisplayMode || 'chronometer') === mode.id && styles.challengeQuestionButtonTextActive
                      ]}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Timer Duration (Only if Bar? Or both? Assuming Bar usually needs duration, but user asked for "duration" generally) */}
                <Text style={[styles.settingTitle, { fontSize: 14, marginBottom: 8, marginTop: 16 }]}>Durée par question (Barre)</Text>
                <View style={styles.challengeQuestionsButtons}>
                  {[10, 20, 30, 60].map((dur) => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.challengeQuestionButton,
                        (settings.timerDuration || 10) === dur && styles.challengeQuestionButtonActive
                      ]}
                      onPress={() => updateSettings({ timerDuration: dur })}
                    >
                      <Text style={[
                        styles.challengeQuestionButtonText,
                        (settings.timerDuration || 10) === dur && styles.challengeQuestionButtonTextActive
                      ]}>
                        {dur}s
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>


              </View>
            )}
          </View>


          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* RICH BADGE MODAL */}
      <CollectionModal
        visible={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        theme={badgeModalUser?.badgeTheme || settings.badgeTheme || 'space'}
        gender={badgeModalUser?.gender}
        targetUser={badgeModalUser}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerButtonText: {
    fontSize: 24,
    color: AppColors.text,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Lexend',
    fontWeight: 'bold',
    color: AppColors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
    fontFamily: 'Lexend',
    flex: 1, // Allow text to take space
    flexWrap: 'wrap', // ALLOW WRAP
  },
  sectionNote: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 16,
    opacity: 0.8,
    flexWrap: 'wrap', // ALLOW WRAP
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    overflow: 'hidden',
    marginBottom: 12,
  },
  userCardActive: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  userCardExpanded: {
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  userCardHeaderActive: {
    backgroundColor: '#F0F4FF',
  },
  userHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    flexWrap: 'wrap',
  },
  userDetails: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  badgeCurrent: {
    backgroundColor: AppColors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCurrentText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userCardContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    backgroundColor: '#FFF',
  },
  selectProfileButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  selectProfileButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
  userActionsStack: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButtonWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    gap: 10,
  },
  actionButtonDestructiveWide: {
    backgroundColor: '#FFF2F2',
    borderColor: '#FFD6D6',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
    flexShrink: 1, // Allow text to shrink/wrap
    textAlign: 'center', // Center text if it wraps
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 12,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
    opacity: 0.7,
  },
  activityText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  radarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  radarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  radarDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarNum: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    opacity: 0.7,
  },
  resetLinkText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginTop: 8,
  },
  addUserButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24, // Increased spacing
  },
  settingLeft: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: AppColors.text,
    flexWrap: 'wrap',
  },
  settingSubTitle: {
    fontSize: 13, // Slightly larger
    color: AppColors.textSecondary,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  challengeQuestionsButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  challengeQuestionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginBottom: 6,
  },
  challengeQuestionButtonActive: {
    backgroundColor: AppColors.primary,
  },
  challengeQuestionButtonText: {
    color: AppColors.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  challengeQuestionButtonTextActive: {
    color: '#FFF',
  },
  closeButton: {
    backgroundColor: AppColors.primary, // Use primary color instead of generic Button
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
});
