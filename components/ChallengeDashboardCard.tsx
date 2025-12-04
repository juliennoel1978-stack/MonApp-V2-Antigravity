import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  strongestTable,
}: ChallengeDashboardCardProps) {
  const progressLabel = getProgressLabel(theme);
  const remaining = nextBadgeThreshold ? nextBadgeThreshold - totalChallengesCompleted : 0;
  const progressPercent = nextBadgeThreshold
    ? Math.min((totalChallengesCompleted / nextBadgeThreshold) * 100, 100)
    : 100;

  const hasStarted = totalChallengesCompleted > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.levelRow}>
          <Text style={styles.badgeIcon}>{currentBadge?.icon || '🌟'}</Text>
          <View style={styles.levelTextContainer}>
            <Text style={styles.levelLabel}>Niveau Actuel</Text>
            <Text style={styles.levelTitle} numberOfLines={1}>
              {currentBadge?.title || 'Débutant'}
            </Text>
          </View>
        </View>

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

        {nextBadgeThreshold && remaining > 0 ? (
          <Text style={styles.progressText}>
            Plus que {remaining} {progressLabel} !
          </Text>
        ) : hasStarted ? (
          <Text style={styles.progressText}>
            Niveau maximum atteint ! 🎉
          </Text>
        ) : (
          <Text style={styles.progressText}>
            Prêt pour ta première mission ?
          </Text>
        )}
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statMainText}>{totalChallengesCompleted}</Text>
          <Text style={styles.statSubText}>challenges{"\n"}terminés</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statIcon}>💪</Text>
          <Text style={styles.statMainText} numberOfLines={1}>
            {strongestTable !== null ? `Table ${strongestTable}` : '—'}
          </Text>
          <Text style={styles.statSubText}>
            {strongestTable !== null ? 'ta force' : 'aucune'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSection: {
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeIcon: {
    fontSize: 42,
    marginRight: 14,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: AppColors.borderLight,
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
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statMainText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
