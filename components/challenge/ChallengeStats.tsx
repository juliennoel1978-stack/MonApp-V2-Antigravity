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

export const ChallengeStats = ({ correct, incorrect, total, max }: ChallengeStatsProps) => {
    return (
        <View style={styles.statsBar}>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Bonnes</ThemedText>
                <ThemedText style={[styles.statValue, { color: AppColors.success }]}>
                    {correct}
                </ThemedText>
            </View>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Mauvaises</ThemedText>
                <ThemedText style={[styles.statValue, { color: AppColors.error }]}>
                    {incorrect}
                </ThemedText>
            </View>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Total</ThemedText>
                <ThemedText style={[styles.statValue, { color: AppColors.primary }]}>
                    {total}/{max}
                </ThemedText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: AppColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
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
});
