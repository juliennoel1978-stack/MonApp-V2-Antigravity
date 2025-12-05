import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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

const getProgressLabel = (theme: BadgeTheme): string => {
  switch (theme) {
    case 'space':
      return 'missions';
    case 'heroes':
      return 'exploits';
    case 'animals':
      return 'défis';
    default:
      return 'challenges';
  }
};

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
  
  const progressLabel = getProgressLabel(theme);
  const remaining = nextBadgeThreshold ? nextBadgeThreshold - totalChallengesCompleted : 0;
  const progressPercent = nextBadgeThreshold
    ? Math.min((totalChallengesCompleted / nextBadgeThreshold) * 100, 100)
    : 100;

  const hasMaxBadge = !nextBadgeThreshold || remaining <= 0;

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerSection}>
        {/* Row 1: Badge Icon + Level Title */}
        <View style={styles.levelRow}>
          <Text style={[styles.badgeIcon, isSmallScreen && styles.badgeIconSmall]}>
            {currentBadge?.icon || '🌟'}
          </Text>
          <Text style={[styles.levelTitle, isSmallScreen && styles.levelTitleSmall]} numberOfLines={1}>
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
          {hasMaxBadge
            ? '🎉 Niveau maximum atteint !'
            : `Plus que ${remaining} ${progressLabel} !`}
        </Text>
      </View>

      {/* FOOTER SECTION - Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Container A: Streak */}
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statMainText, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
            Série Max : {bestStreak}
          </Text>
          <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
            bonnes réponses consécutives
          </Text>
        </View>

        {/* Container B: Strength */}
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>💪</Text>
          <Text style={[styles.statMainText, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
            Force : {strongestTable !== null ? `Table de ${strongestTable}` : 'Aucune'}
          </Text>
          <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
            ta meilleure table
          </Text>
        </View>
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
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    flex: 1,
  },
  levelTitleSmall: {
    fontSize: 14,
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
  statBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statMainText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  statMainTextSmall: {
    fontSize: 12,
  },
  statSubtext: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  statSubtextSmall: {
    fontSize: 10,
  },
});
