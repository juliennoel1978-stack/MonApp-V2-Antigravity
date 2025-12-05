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
  
  const remaining = nextBadgeThreshold ? nextBadgeThreshold - totalChallengesCompleted : 0;
  const isPlural = remaining > 1;
  const progressLabel = getProgressLabel(theme, isPlural);
  const progressPercent = nextBadgeThreshold
    ? Math.min((totalChallengesCompleted / nextBadgeThreshold) * 100, 100)
    : 100;

  const hasMaxBadge = !nextBadgeThreshold || remaining <= 0;
  const isZeroState = totalChallengesCompleted === 0;

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

      {/* FOOTER SECTION - Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Container A: Streak */}
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🔥</Text>
          {isZeroState ? (
            <>
              <Text style={[styles.statMainTextNew, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
                Prêt à briller ?
              </Text>
              <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
                Fais ta 1ère série !
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statMainTextStats, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
                Série Max : {bestStreak}
              </Text>
              <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
                bonnes réponses d'affilée
              </Text>
            </>
          )}
        </View>

        {/* Container B: Strength */}
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>💪</Text>
          {isZeroState ? (
            <>
              <Text style={[styles.statMainTextNew, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
                Talent caché...
              </Text>
              <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
                Découvre ta force !
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statMainTextStats, isSmallScreen && styles.statMainTextSmall]} numberOfLines={1}>
                Force : {strongestTable !== null ? `Table de ${strongestTable}` : '—'}
              </Text>
              <Text style={[styles.statSubtext, isSmallScreen && styles.statSubtextSmall]}>
                Ta meilleure table
              </Text>
            </>
          )}
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
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
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
  statSubtext: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  statSubtextSmall: {
    fontSize: 10,
  },
});
