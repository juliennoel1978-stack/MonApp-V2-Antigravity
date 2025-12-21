
import React, { useMemo, useState, useRef, useCallback } from 'react';

import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { AppColors } from '@/constants/colors';
import { ThemedText } from './ThemedText';
import { PERSISTENCE_BADGES, getBadgeIcon, getBadgeTitle, ENDURANCE_BADGES } from '@/constants/badges';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { useApp } from '@/contexts/AppContext';
import { BadgeTheme, User } from '@/types';

const { width, height } = Dimensions.get('window');

interface CollectionModalProps {
  visible: boolean;
  onClose: () => void;
  theme: BadgeTheme;
  gender?: 'boy' | 'girl';
  targetUser?: User | null;
}

interface AchievementFlipCardProps {
  achievement: typeof ACHIEVEMENTS[0];
  isUnlocked: boolean;
  count: number;
}

function AchievementFlipCard({ achievement, isUnlocked, count }: AchievementFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.9, 0.9],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.9, 1],
  });

  return (
    <TouchableOpacity
      style={[
        styles.achievementItem,
        !isUnlocked && styles.achievementItemLocked
      ]}
      onPress={flipCard}
      activeOpacity={0.7}
    >
      <View style={styles.flipHint}>
        <View style={styles.flipHintDot} />
      </View>

      {/* Front Face */}
      <Animated.View
        style={[
          styles.achievementFace,
          { opacity: frontOpacity, transform: [{ scale: frontScale }] },
        ]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        <View style={styles.achievementEmojiContainer}>
          <ThemedText style={[
            styles.achievementEmoji,
            !isUnlocked && styles.achievementEmojiLocked
          ]}>
            {achievement.emoji}
          </ThemedText>
        </View>
        <ThemedText style={[
          styles.achievementTitle,
          !isUnlocked && styles.achievementTitleLocked
        ]} numberOfLines={2}>
          {achievement.title}
        </ThemedText>
        {count > 1 && (
          <View style={styles.countBadgeBottom}>
            <ThemedText style={styles.countTextBottom}>x{count}</ThemedText>
          </View>
        )}
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.achievementFace,
          styles.achievementFaceBack,
          { opacity: backOpacity, transform: [{ scale: backScale }] },
        ]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        <View style={styles.achievementBackContent}>
          <ThemedText style={styles.achievementBackTitle}>
            {achievement.backTitle}
          </ThemedText>
          <ThemedText style={styles.achievementDescriptionText}>
            {achievement.message}
          </ThemedText>
        </View>
      </Animated.View>
    </TouchableOpacity >
  );
}

interface EnduranceFlipCardProps {
  threshold: 20 | 30 | 50;
  isUnlocked: boolean;
  title: string;
  icon: string;
  backTitle: string;
  backMessage: string;
}

function EnduranceFlipCard({ threshold, isUnlocked, title, icon, backTitle, backMessage }: EnduranceFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.9, 0.9],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.9, 1],
  });

  return (
    <TouchableOpacity
      style={[
        styles.achievementItem,
        !isUnlocked && styles.achievementItemLocked
      ]}
      onPress={flipCard}
      activeOpacity={0.7}
    >
      <View style={styles.flipHint}>
        <View style={styles.flipHintDot} />
      </View>

      {/* Front Face */}
      <Animated.View
        style={[
          styles.achievementFace,
          { opacity: frontOpacity, transform: [{ scale: frontScale }] },
        ]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        <View style={styles.achievementEmojiContainer}>
          <ThemedText style={[
            styles.achievementEmoji,
            !isUnlocked && styles.achievementEmojiLocked
          ]}>
            {icon}
          </ThemedText>
        </View>
        <ThemedText style={[
          styles.achievementTitle,
          !isUnlocked && styles.achievementTitleLocked
        ]} numberOfLines={2}>
          {title}
        </ThemedText>
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.achievementFace,
          styles.achievementFaceBack,
          { opacity: backOpacity, transform: [{ scale: backScale }] },
        ]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        <View style={styles.achievementBackContent}>
          <ThemedText style={styles.enduranceBackTitle}>
            {backTitle}
          </ThemedText>
          <ThemedText style={styles.enduranceBackMessage}>
            {backMessage}
          </ThemedText>
        </View>
      </Animated.View>
    </TouchableOpacity>

  );
}

interface AdventureFlipCardProps {
  badge: import('@/constants/badges').BadgeConfig;
  isUnlocked: boolean;
  gender?: 'boy' | 'girl';
}

function AdventureFlipCard({ badge, isUnlocked, gender }: AdventureFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.9, 0.9],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.9, 1],
  });

  return (
    <TouchableOpacity
      style={[
        styles.adventureItem,
        !isUnlocked && styles.adventureItemLocked
      ]}
      onPress={flipCard}
      activeOpacity={0.9}
    >
      <View style={styles.flipHint}>
        <View style={styles.flipHintDot} />
      </View>

      {/* Front Face */}
      <Animated.View
        style={[
          styles.adventureFace,
          !isUnlocked && styles.adventureFaceLocked,
          { opacity: frontOpacity, transform: [{ scale: frontScale }] }
        ]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        <View style={[
          styles.badgeIconContainer,
          !isUnlocked && styles.badgeIconContainerLocked
        ]}>
          <ThemedText style={[
            styles.badgeIcon,
            !isUnlocked && styles.badgeIconLocked
          ]}>
            {getBadgeIcon(badge, gender)}
          </ThemedText>
        </View>

        <View style={styles.badgeInfo}>
          <ThemedText style={[
            styles.badgeTitle,
            !isUnlocked && styles.badgeTitleLocked
          ]}>
            {getBadgeTitle(badge, gender)}
          </ThemedText>
          <ThemedText style={styles.badgeThreshold}>
            {isUnlocked ? `${badge.threshold} Challenges` : `${badge.threshold} Challenges`}
          </ThemedText>
        </View>

        {/* Visual Indicator for Acquired/Locked (Optional, but color shift handles it) */}
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.adventureFaceBack,
          { opacity: backOpacity, transform: [{ scale: backScale }] }
        ]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        <ThemedText style={styles.adventureBackText}>
          {isUnlocked ? badge.message : "Mystère... Encore un peu d'entraînement ! 🔒"}
        </ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CollectionModal({
  visible,
  onClose,
  theme,
  gender,
  targetUser,
}: CollectionModalProps) {
  const { currentUser, anonymousChallengesCompleted, anonymousAchievements, anonymousPersistenceBadges } = useApp();

  // Determine source of truth: targetUser -> currentUser -> Anonymous
  const effectiveUser = targetUser || currentUser;

  const unlockedAchievements = useMemo(() => {
    if (effectiveUser) return effectiveUser.achievements || [];
    return anonymousAchievements || [];
  }, [effectiveUser, anonymousAchievements]);

  const challengesCompleted = useMemo(() => {
    if (effectiveUser) return effectiveUser.challengesCompleted || 0;
    return anonymousChallengesCompleted || 0;
  }, [effectiveUser, anonymousChallengesCompleted]);

  // Use effectiveUser for endurance badges check
  const hasEnduranceBadge = (threshold: 20 | 30 | 50) => {
    // If user object has endurance badges map
    if (effectiveUser?.enduranceBadges?.[threshold]) return true;
    return false;
  };


  // Get badges for current theme
  const badges = useMemo(() => {
    return PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;
  }, [theme]);

  // Sort achievements: unlocked first, then locked
  const sortedAchievements = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aUnlocked = unlockedAchievements.some(ua => ua.id === a.id);
      const bUnlocked = unlockedAchievements.some(ub => ub.id === b.id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return 0;
    });
  }, [unlockedAchievements]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={true}
          >
            {/* ZONE 1: MON AVENTURE */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>MON AVENTURE</ThemedText>
              <View style={styles.adventureList}>
                {badges.map((badge, index) => {
                  const isUnlocked = challengesCompleted >= badge.threshold;

                  return (
                    <AdventureFlipCard
                      key={badge.threshold}
                      badge={badge}
                      isUnlocked={isUnlocked}
                      gender={gender}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* ZONE 2: MES EXPLOITS */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>MES EXPLOITS</ThemedText>
              <View style={styles.achievementsGrid}>
                {sortedAchievements.map((achievement) => {
                  const unlocked = unlockedAchievements.find(ua => ua.id === achievement.id);
                  const isUnlocked = !!unlocked;
                  const count = unlocked?.count || 0;

                  return (
                    <AchievementFlipCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={isUnlocked}
                      count={count}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* ZONE 3: ENDURANCE */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>ENDURANCE</ThemedText>
              <View style={styles.achievementsGrid}>
                {ENDURANCE_BADGES.map((badge) => {
                  const isUnlocked = hasEnduranceBadge(badge.threshold);

                  return (
                    <EnduranceFlipCard
                      key={badge.threshold}
                      threshold={badge.threshold}
                      isUnlocked={isUnlocked}
                      title={badge.title}
                      icon={badge.icon}
                      backTitle={badge.backTitle}
                      backMessage={badge.backMessage}
                    />
                  );
                })}
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 600, // Tablet constraint
    height: height * 0.8,
    maxHeight: 700, // Prevent it from being too tall on huge screens
    backgroundColor: AppColors.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignSelf: 'center', // Center in overlay
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AppColors.primary,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  adventureList: {
    gap: 16,
  },
  adventureItem: {
    marginBottom: 0,
    position: 'relative',
    // Background and visuals moved to adventureFace for flip effect
  },
  adventureItemLocked: {
    // handled in face
  },
  adventureFace: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    backfaceVisibility: 'hidden',
  },
  adventureFaceLocked: {
    backgroundColor: '#F0F0F0',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  adventureFaceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 16, // Match parent radius
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    padding: 12,
  },
  adventureBackText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeIconContainerLocked: {
    backgroundColor: '#E0E0E0',
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: '#888',
  },
  badgeThreshold: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: (width * 0.85 - 48 - 24) / 2,
    aspectRatio: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  achievementItemLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: 'transparent',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  achievementEmojiContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 40,
  },
  achievementEmojiLocked: {
    opacity: 0.3,
    // On native, we can't easily do grayscale without image filters
    // Low opacity + gray background helps
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  countText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#999',
  },
  achievementFace: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: 12,
  },
  achievementFaceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 10,
    overflow: 'hidden',
    margin: 0,
  },
  achievementBackContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6, // Minimal padding to prevent edge touching
  },
  flipHint: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  flipHintDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AppColors.primary,
    opacity: 0.4,
  },
  achievementBackTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  achievementDescriptionText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14.4, // 1.2 * 12
    width: '100%',
  },
  countBadgeBottom: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  countTextBottom: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  enduranceBackTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  enduranceBackMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14.4, // 1.2 * 12
  },
});
