import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import i18n from '@/utils/i18n';


import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Animated } from 'react-native';
import { AppColors } from '@/constants/colors';
import type { BadgeTheme } from '@/types';
import { getNextBadgeInfo } from '@/constants/badges';
import { ThemedText } from './ThemedText';

interface CurrentBadge {
  icon: string;
  title: string;
}

interface ChallengeDashboardCardProps {
  theme: BadgeTheme;
  currentBadge: CurrentBadge | null;
  nextBadgeThreshold: number | null;
  totalChallengesCompleted: number;
  bestStreak: number;
  strongestTable: number | null;
  gender?: 'boy' | 'girl';
  onPressLevel?: () => void;
}

const getProgressLabel = (theme: BadgeTheme, plural: boolean = true): string => {
  const suffix = plural ? '_p' : '_s';
  switch (theme) {
    case 'space':
      return i18n.t(`dashboard.mission${suffix}`);
    case 'heroes':
      return i18n.t(`dashboard.exploit${suffix}`);
    case 'animals':
      return i18n.t(`dashboard.defi${suffix}`);
    default:
      return i18n.t(`dashboard.challenge${suffix}`);
  }
};

const getZeroStateMessage = (theme: BadgeTheme): string => {
  switch (theme) {
    case 'space':
      return i18n.t('dashboard.start_mission');
    case 'heroes':
      return i18n.t('dashboard.start_exploit');
    case 'animals':
      return i18n.t('dashboard.start_defi');
    default:
      return i18n.t('dashboard.start_challenge');
  }
};

interface FlipCardProps {
  icon: string;
  frontText: string;
  backText: string;
  isZeroState: boolean;
  isSmallScreen: boolean;
}

function FlipCard({ icon, frontText, backText, isZeroState, isSmallScreen }: FlipCardProps) {
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
      style={styles.flipCardContainer}
      onPress={flipCard}
      activeOpacity={0.8}
    >
      <View style={[styles.statBox, isFlipped && styles.statBoxFlipped]}>
        {/* Clickable hint */}
        <View style={styles.clickHint}>
          <View style={styles.clickHintDot} />
        </View>

        {/* Front Face */}
        <Animated.View
          style={[
            styles.cardFace,
            { opacity: frontOpacity, transform: [{ scale: frontScale }] },
          ]}
          pointerEvents={isFlipped ? 'none' : 'auto'}
        >
          <ThemedText style={styles.statEmoji}>{icon}</ThemedText>
          <ThemedText
            style={[
              isZeroState ? styles.statMainTextNew : styles.statMainTextStats,
              isSmallScreen && styles.statMainTextSmall,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {frontText}
          </ThemedText>
        </Animated.View>
        {/* Back Face */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFaceBack,
            { opacity: backOpacity, transform: [{ scale: backScale }] },
          ]}
          pointerEvents={isFlipped ? 'auto' : 'none'}
        >
          <ThemedText style={[styles.backText, isSmallScreen && styles.backTextSmall]}>
            {backText}
          </ThemedText>
        </Animated.View>
      </View>
    </TouchableOpacity >
  );
}

export default function ChallengeDashboardCard({
  theme,
  currentBadge,
  nextBadgeThreshold,
  totalChallengesCompleted,
  bestStreak,
  strongestTable,
  gender,
  onPressLevel,
}: ChallengeDashboardCardProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = useMemo(() => width < 375, [width]);

  const remaining = useMemo(() => {
    return nextBadgeThreshold ? nextBadgeThreshold - totalChallengesCompleted : 0;
  }, [nextBadgeThreshold, totalChallengesCompleted]);

  const isPlural = remaining > 1;
  const progressLabel = getProgressLabel(theme, isPlural);

  const progressPercent = useMemo(() => {
    if (!nextBadgeThreshold) return 100;
    return Math.min((totalChallengesCompleted / nextBadgeThreshold) * 100, 100);
  }, [totalChallengesCompleted, nextBadgeThreshold]);

  const hasMaxBadge = !nextBadgeThreshold || remaining <= 0;
  const isZeroState = totalChallengesCompleted === 0;

  const getProgressMessage = (): string => {
    if (hasMaxBadge) {
      return i18n.t('dashboard.max_level');
    }
    if (isZeroState) {
      return getZeroStateMessage(theme);
    }
    const nextBadge = getNextBadgeInfo(totalChallengesCompleted, theme, gender);
    if (nextBadge) {
      return i18n.t('dashboard.more_to_go', { count: remaining, label: progressLabel, icon: nextBadge.icon, title: i18n.t(nextBadge.title) });
    }
    return i18n.t('dashboard.more_to_go_simple', { count: remaining, label: progressLabel });
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <TouchableOpacity
        style={styles.headerSection}
        onPress={onPressLevel}
        activeOpacity={0.7}
        testID="level-card-header"
      >
        {/* Row 1: Badge Icon + Level Title */}
        <View style={styles.levelRow}>
          <ThemedText style={[styles.badgeIcon, isSmallScreen && styles.badgeIconSmall]}>
            {isZeroState ? '🌟' : (currentBadge?.icon || '🌟')}
          </ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.levelTitle, isSmallScreen && styles.levelTitleSmall]}>
              {isZeroState
                ? i18n.t('dashboard.current_level', { level: i18n.t('dashboard.beginner') })
                : i18n.t('dashboard.current_level', { level: currentBadge ? i18n.t(currentBadge.title) : i18n.t('dashboard.beginner') })}
            </ThemedText>
            <ThemedText style={{ fontSize: 11, color: AppColors.textSecondary, marginTop: 2 }}>
              {i18n.t('dashboard.view_collection')}
            </ThemedText>
          </View>
        </View>

        {/* Row 2: Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Row 3: Dynamic Text */}
        <ThemedText style={[styles.progressText, isSmallScreen && styles.progressTextSmall]}>
          {getProgressMessage()}
        </ThemedText>
      </TouchableOpacity>

      {/* FOOTER SECTION - Interactive Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Flip Card A: Streak */}
        <FlipCard
          icon="🔥"
          frontText={isZeroState ? i18n.t('dashboard.ready') : i18n.t('dashboard.max_streak', { streak: bestStreak })}
          backText={i18n.t('dashboard.max_streak_desc')}
          isZeroState={isZeroState}
          isSmallScreen={isSmallScreen}
        />

        {/* Flip Card B: Strength */}
        <FlipCard
          icon="💪"
          frontText={isZeroState ? i18n.t('dashboard.mystery') : (strongestTable !== null ? i18n.t('dashboard.strongest_table', { table: strongestTable }) : '—')}
          backText={i18n.t('dashboard.strongest_table_desc')}
          isZeroState={isZeroState}
          isSmallScreen={isSmallScreen}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  headerSection: {
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    fontSize: 36,
    marginRight: 10,
  },
  badgeIconSmall: {
    fontSize: 28,
    marginRight: 8,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    flex: 1,
    flexWrap: 'wrap' as const,
  },
  levelTitleSmall: {
    fontSize: 13,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  progressTextSmall: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  flipCardContainer: {
    flex: 1,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  statBoxFlipped: {
    backgroundColor: '#EEF2FF',
  },
  cardFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFaceBack: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  clickHint: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
  },
  clickHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    opacity: 0.4,
  },
  backText: {
    fontSize: 12,
    color: AppColors.text,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  backTextSmall: {
    fontSize: 11,
    lineHeight: 16,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statMainTextNew: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  statMainTextStats: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statMainTextSmall: {
    fontSize: 12,
  },

});
