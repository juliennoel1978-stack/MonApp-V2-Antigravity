import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';

type ChallengeStatsProps = {
    correct: number;
    incorrect: number;
    total: number;
    max: number;
};

import i18n from '@/utils/i18n';

export const ChallengeStats = ({ correct, incorrect, total, max }: ChallengeStatsProps) => {
    const progressPercent = max > 0 ? (total / max) * 100 : 0;

    return (
        <View style={styles.statsContainer}>
            <View style={styles.statsBar}>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statLabel}>{i18n.t('challenge.stats.correct')}</ThemedText>
                    <ThemedText style={[styles.statValue, { color: AppColors.success }]}>
                        {correct}
                    </ThemedText>
                </View>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statLabel}>{i18n.t('challenge.stats.incorrect')}</ThemedText>
                    <ThemedText style={[styles.statValue, { color: AppColors.error }]}>
                        {incorrect}
                    </ThemedText>
                </View>
                <View style={styles.statBox}>
                    <ThemedText style={styles.statLabel}>{i18n.t('challenge.stats.total')}</ThemedText>
                    <ThemedText style={[styles.statValue, { color: AppColors.primary }]}>
                        {total}/{max}
                    </ThemedText>
                </View>
            </View>
            {/* Fine barre de progression verte */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statsContainer: {
        backgroundColor: AppColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: AppColors.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: AppColors.borderLight,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: AppColors.success,
        borderRadius: 2,
    },
});
