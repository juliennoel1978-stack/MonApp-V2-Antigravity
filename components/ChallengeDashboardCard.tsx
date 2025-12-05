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
  console.log('[ChallengeDashboardCard RENDER] challenges:', totalChallengesCompleted, 'badge:', currentBadge?.title);
  const { width } = useWindowDimensions();
  const isSmallScreen = useMemo(() => width < 375, [width]);
  
  const progressLabel = getProgressLabel(theme);
  const remaining = nextBadgeThreshold ? nextBadgeThreshold - totalChallengesCompleted : 0;
  const progressPercent = nextBadgeThreshold
    ? Math.min((totalChallengesCompleted / nextBadgeThreshold) * 100, 100)
    : 100;

  const hasStarted = totalChallengesCompleted > 0;

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: AppColors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? 12 : 14,
      marginTop: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    badgeIcon: {
      fontSize: isSmallScreen ? 32 : 38,
      marginRight: 10,
    },
    headerContent: {
      flex: 1,
    },
    levelTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: 'bold' as const,
      color: AppColors.primary,
      marginBottom: 6,
    },
    progressBarBackground: {
      height: 6,
      backgroundColor: AppColors.borderLight,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: AppColors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: isSmallScreen ? 11 : 12,
      color: AppColors.textSecondary,
      fontWeight: '600' as const,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8F8F8',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statEmoji: {
      fontSize: isSmallScreen ? 18 : 20,
    },
    statValue: {
      fontSize: isSmallScreen ? 14 : 15,
      fontWeight: 'bold' as const,
      color: AppColors.text,
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: AppColors.border,
      marginHorizontal: 20,
    },
  }), [isSmallScreen]);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.headerRow}>
        <Text style={dynamicStyles.badgeIcon}>{currentBadge?.icon || '🌟'}</Text>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.levelTitle} numberOfLines={1}>
            {currentBadge?.title || 'Débutant'}
          </Text>
          <View style={dynamicStyles.progressBarBackground}>
            <View
              style={[
                dynamicStyles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={dynamicStyles.progressText} numberOfLines={1}>
            {nextBadgeThreshold && remaining > 0
              ? `+${remaining} ${progressLabel}`
              : hasStarted
              ? '🎉 Max !'
              : 'Prêt ?'}
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.statsRow}>
        <View style={dynamicStyles.statItem}>
          <Text style={dynamicStyles.statEmoji}>🏆</Text>
          <Text style={dynamicStyles.statValue}>{totalChallengesCompleted}</Text>
        </View>
        <View style={dynamicStyles.statDivider} />
        <View style={dynamicStyles.statItem}>
          <Text style={dynamicStyles.statEmoji}>💪</Text>
          <Text style={dynamicStyles.statValue} numberOfLines={1}>
            {strongestTable !== null ? `T.${strongestTable}` : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
