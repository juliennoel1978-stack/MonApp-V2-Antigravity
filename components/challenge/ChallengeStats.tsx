import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
                <Text style={styles.statLabel}>Bonnes</Text>
                <Text style={[styles.statValue, { color: AppColors.success }]}>
                    {correct}
                </Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Mauvaises</Text>
                <Text style={[styles.statValue, { color: AppColors.error }]}>
                    {incorrect}
                </Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={[styles.statValue, { color: AppColors.primary }]}>
                    {total}/{max}
                </Text>
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
