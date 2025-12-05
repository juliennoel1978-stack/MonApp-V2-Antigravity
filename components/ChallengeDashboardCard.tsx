import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Animated } from 'react-native';
import { AppColors } from '@/constants/colors';
import type { BadgeTheme } from '@/types';

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
}

const getProgressLabel = (theme: BadgeTheme, plural: boolean = true): string => {
  switch (theme) {
    case 'space':
      return plural ? 'missions' : 'mission';
    case 'heroes':
      return plural ? 'exploits' : 'exploit';
    case 'animals':
      return plural ? 'défis' : 'défi';
    default:
      return plural ? 'challenges' : 'challenge';
  }
};

const getZeroStateMessage = (theme: BadgeTheme): string => {
  switch (theme) {
    case 'space':
      return 'Lance ta première mission !';
    case 'heroes':
      return 'Accomplis ton 1er exploit !';
    case 'animals':
      return 'Relève ton premier défi !';
    default:
      return 'Lance ton premier challenge !';
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
          <Text style={styles.statEmoji}>{icon}</Text>
          <Text
            style={[
              isZeroState ? styles.statMainTextNew : styles.statMainTextStats,
              isSmallScreen && styles.statMainTextSmall,
            ]}
            numberOfLines={1}
          >
            {frontText}
          </Text>
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
          <Text style={[styles.backText, isSmallScreen && styles.backTextSmall]}>
            {backText}
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChallengeDashboardCard({
  theme,
  currentBadge,
  nextBadgeThreshold,
  totalChallengesCompleted,
  bestStreak,
  strongestTable,
}: ChallengeDashboardCardProps) {
  console.log('[ChallengeDashboardCard RENDER] challenges:', totalChallengesCompleted, 'badge:', currentBadge?.title, 'streak:', bestStreak);
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
  
  console.log('[ChallengeDashboardCard] Progress calculation:', {
    totalChallengesCompleted,
    nextBadgeThreshold,
    remaining,
    progressPercent: progressPercent.toFixed(1) + '%',
    isZeroState,
  });

  const getProgressMessage = (): string => {
    if (hasMaxBadge) {
      return '🎉 Niveau maximum atteint !';
    }
    if (isZeroState) {
      return getZeroStateMessage(theme);
    }
    return `Plus que ${remaining} ${progressLabel} !`;
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerSection}>
        {/* Row 1: Badge Icon + Level Title */}
        <View style={styles.levelRow}>
          <Text style={[styles.badgeIcon, isSmallScreen && styles.badgeIconSmall]}>
            {currentBadge?.icon || '🌟'}
          </Text>
          <Text style={[styles.levelTitle, isSmallScreen && styles.levelTitleSmall]}>
            Niveau Actuel : {currentBadge?.title || 'Débutant'}
          </Text>
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
        <Text style={[styles.progressText, isSmallScreen && styles.progressTextSmall]}>
          {getProgressMessage()}
        </Text>
      </View>

      {/* FOOTER SECTION - Interactive Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Flip Card A: Streak */}
        <FlipCard
          icon="🔥"
          frontText={isZeroState ? 'Prêt ?' : `Série Max : ${bestStreak}`}
          backText="Ton record de réponses justes à la suite !"
          isZeroState={isZeroState}
          isSmallScreen={isSmallScreen}
        />

        {/* Flip Card B: Strength */}
        <FlipCard
          icon="💪"
          frontText={isZeroState ? 'Mystère...' : (strongestTable !== null ? `Table de ${strongestTable}` : '—')}
          backText="C'est la table que tu connais le mieux !"
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
