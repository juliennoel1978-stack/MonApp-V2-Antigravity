import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { AppColors } from '@/constants/colors';
import { PERSISTENCE_BADGES, getBadgeIcon, getBadgeTitle } from '@/constants/badges';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { useApp } from '@/contexts/AppContext';
import { BadgeTheme } from '@/types';

const { width, height } = Dimensions.get('window');

interface CollectionModalProps {
  visible: boolean;
  onClose: () => void;
  theme: BadgeTheme;
  gender?: 'boy' | 'girl';
}

interface AchievementFlipCardProps {
  achievement: typeof ACHIEVEMENTS[0];
  isUnlocked: boolean;
  count: number;
}

function AchievementFlipCard({ achievement, isUnlocked, count }: AchievementFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const autoFlipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flipCard = useCallback(() => {
    if (autoFlipTimeout.current) {
      clearTimeout(autoFlipTimeout.current);
    }

    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);

    if (!isFlipped) {
      autoFlipTimeout.current = setTimeout(() => {
        Animated.spring(flipAnim, {
          toValue: 0,
          friction: 8,
          tension: 10,
          useNativeDriver: true,
        }).start();
        setIsFlipped(false);
      }, 3000);
    }
  }, [isFlipped, flipAnim]);

  useEffect(() => {
    return () => {
      if (autoFlipTimeout.current) {
        clearTimeout(autoFlipTimeout.current);
      }
    };
  }, []);

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
          <Text style={[
            styles.achievementEmoji,
            !isUnlocked && styles.achievementEmojiLocked
          ]}>
            {achievement.emoji}
          </Text>
          {count > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>x{count}</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.achievementTitle,
          !isUnlocked && styles.achievementTitleLocked
        ]} numberOfLines={2}>
          {achievement.title}
        </Text>
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
        <Text style={styles.achievementDescriptionText}>
          {achievement.message}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CollectionModal({
  visible,
  onClose,
  theme,
  gender,
}: CollectionModalProps) {
  const { currentUser, anonymousChallengesCompleted, getAchievements } = useApp();
  const unlockedAchievements = getAchievements();

  const challengesCompleted = useMemo(() => {
    return currentUser?.challengesCompleted || anonymousChallengesCompleted || 0;
  }, [currentUser, anonymousChallengesCompleted]);

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
              <Text style={styles.sectionTitle}>MON AVENTURE</Text>
              <View style={styles.adventureList}>
                {badges.map((badge, index) => {
                  const isUnlocked = challengesCompleted >= badge.threshold;
                  
                  return (
                    <View 
                      key={badge.threshold} 
                      style={[
                        styles.adventureItem,
                        !isUnlocked && styles.adventureItemLocked
                      ]}
                    >
                      <View style={[
                        styles.badgeIconContainer,
                        !isUnlocked && styles.badgeIconContainerLocked
                      ]}>
                        <Text style={[
                          styles.badgeIcon,
                          !isUnlocked && styles.badgeIconLocked
                        ]}>
                          {getBadgeIcon(badge, gender)}
                        </Text>
                      </View>
                      
                      <View style={styles.badgeInfo}>
                        <Text style={[
                          styles.badgeTitle,
                          !isUnlocked && styles.badgeTitleLocked
                        ]}>
                          {getBadgeTitle(badge, gender)}
                        </Text>
                        <Text style={styles.badgeThreshold}>
                          {isUnlocked ? 'Acquis !' : `Niveau ${badge.threshold}`}
                        </Text>
                      </View>

                      {!isUnlocked && (
                        <View style={styles.lockOverlay} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* ZONE 2: MES EXPLOITS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MES EXPLOITS</Text>
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
    height: height * 0.8,
    backgroundColor: AppColors.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
  },
  adventureItemLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.7,
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
    justifyContent: 'space-between',
    gap: 12,
  },
  achievementItem: {
    width: '31%',
    aspectRatio: 0.8,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 8,
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
    fontSize: 32,
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
    fontSize: 11,
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
  },
  achievementFaceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: '#EEF2FF',
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
  achievementDescriptionText: {
    fontSize: 10,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
});
