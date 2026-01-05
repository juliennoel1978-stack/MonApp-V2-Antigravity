import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { User } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { ThemedText } from '../ThemedText';
import { useAudio } from '@/hooks/useAudio';
import { useHaptics } from '@/hooks/useHaptics';
import i18n from '@/utils/i18n';

type ChallengeResultsProps = {
    isReviewMode: boolean;
    currentUser: User | null;
    completedChallengeCount: number;
    anonymousChallengesCompleted: number;
    correctCount: number;
    maxQuestions: number;
    bestStreak: number;
    tableStats: Record<number, { correct: number; total: number }>;
    wrongAnswersCount: number;
    onRestart: () => void;
    onHome: () => void;
    onReviewErrors: () => void;
};

export const ChallengeResults = ({
    isReviewMode,
    currentUser,
    completedChallengeCount,
    anonymousChallengesCompleted,
    correctCount,
    maxQuestions,
    bestStreak,
    tableStats,
    wrongAnswersCount,
    onRestart,
    onHome,
    onReviewErrors,
}: ChallengeResultsProps) => {

    // 1. HOOKS ALWAYS CALLED AT TOP LEVEL
    const { updateStrongestTable } = useApp();
    const { playSound } = useAudio();
    const { vibrate } = useHaptics();

    // 2. CALC STATS (Only needed for Results mode, but safe to calc always or memoize based on props)
    const { bestTable, worstTable, bestStreakValue } = React.useMemo(() => {
        if (isReviewMode) return { bestTable: -1, worstTable: -1, bestStreakValue: 0 };

        let best = -1;
        let worst = -1;
        let bestRate = -1;
        let worstRate = 2;

        Object.entries(tableStats).forEach(([table, stats]) => {
            const rate = stats.total > 0 ? stats.correct / stats.total : 0;

            if (rate > bestRate) {
                bestRate = rate;
                best = parseInt(table);
            }
            if (rate < worstRate && stats.total > 0 && stats.correct < stats.total) {
                worstRate = rate;
                worst = parseInt(table);
            }
        });

        return { bestTable: best, worstTable: worst, bestStreakValue: bestStreak };
    }, [tableStats, bestStreak, isReviewMode]);

    // 3. SIDE EFFECTS
    React.useEffect(() => {
        // Only trigger sounds/updates if NOT in review mode
        if (!isReviewMode) {
            playSound('finish');
            vibrate('heavy');

            if (bestTable > 0) {
                updateStrongestTable(bestTable);
            }
        }
    }, [isReviewMode, bestTable, updateStrongestTable, playSound, vibrate]);


    // 4. RENDER LOGIC
    if (isReviewMode) {
        const correctionMessages = (i18n.translations[i18n.locale]?.challenge?.results?.correction_msgs as string[]) || ["Bravo !"];
        const randomMessage = correctionMessages[Math.floor(Math.random() * correctionMessages.length)];

        return (
            <View style={styles.backgroundContainer}>
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView
                        contentContainerStyle={styles.finishedScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.finishedContainer}>
                            <ThemedText style={styles.finishedEmoji}>✅</ThemedText>
                            <ThemedText style={styles.finishedTitle}>
                                {i18n.t('challenge.results.well_done_user', { name: currentUser ? currentUser.firstName : '' }).trim()}
                            </ThemedText>
                            <ThemedText style={styles.finishedSubtitle}>{i18n.t('challenge.results.corrected_errors')}</ThemedText>

                            <View style={styles.finishedStats}>
                                <ThemedText style={styles.correctionMessage}>
                                    {randomMessage}
                                </ThemedText>
                            </View>

                            <View style={styles.finishedButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.finishedButton}
                                    onPress={onRestart}
                                >
                                    <ThemedText style={styles.finishedButtonText} numberOfLines={1}>{i18n.t('challenge.results.retry_challenge')}</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.finishedButton, styles.finishedButtonOutline]}
                                    onPress={onHome}
                                >
                                    <ThemedText style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>{i18n.t('challenge.results.back_home')}</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView
                    contentContainerStyle={styles.finishedScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.finishedContainer}>
                        <ThemedText style={styles.finishedEmoji}>🎉</ThemedText>
                        <ThemedText style={styles.finishedTitle}>
                            {currentUser
                                ? i18n.t('challenge.results.well_done_user', { name: currentUser.firstName })
                                : i18n.t('challenge.results.congrats')}
                        </ThemedText>
                        <ThemedText style={styles.finishedSubtitle}>
                            {i18n.t('challenge.results.challenge_finished', { count: completedChallengeCount > 0 ? completedChallengeCount : (currentUser ? (currentUser.challengesCompleted || 0) : anonymousChallengesCompleted) })}
                        </ThemedText>

                        <View style={styles.finishedStats}>
                            <View style={styles.finishedStatRow}>
                                <ThemedText style={styles.finishedStatLabel}>{i18n.t('challenge.results.precision')}</ThemedText>
                                <ThemedText style={[styles.finishedStatValue, { color: AppColors.primary }]} numberOfLines={1}>
                                    {correctCount} / {maxQuestions} 👍
                                </ThemedText>
                            </View>

                            {bestStreak > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>{i18n.t('challenge.results.best_streak')}</ThemedText>
                                    <ThemedText style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {i18n.t('challenge.results.streak_val', { count: bestStreak, s: bestStreak > 1 ? 's' : '' })}
                                    </ThemedText>
                                </View>
                            )}

                            {bestTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>{i18n.t('challenge.results.strongest_table')}</ThemedText>
                                    <ThemedText style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {bestTable} 💪
                                    </ThemedText>
                                </View>
                            )}

                            {worstTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>{i18n.t('challenge.results.weakest_table')}</ThemedText>
                                    <ThemedText style={[styles.finishedStatValue, { color: AppColors.timerMiddle }]} numberOfLines={1}>
                                        {worstTable} 🚸
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        <View style={styles.finishedButtonsContainer}>
                            {wrongAnswersCount > 0 && (
                                <TouchableOpacity
                                    style={[styles.finishedButton, styles.finishedButtonSecondary]}
                                    onPress={onReviewErrors}
                                >
                                    <ThemedText style={styles.finishedButtonText} numberOfLines={1}>{i18n.t('challenge.results.review_errors')}</ThemedText>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.finishedButton}
                                onPress={onRestart}
                            >
                                <ThemedText style={styles.finishedButtonText} numberOfLines={1}>{i18n.t('challenge.results.retry_challenge')}</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.finishedButton, styles.finishedButtonOutline]}
                                onPress={onHome}
                            >
                                <ThemedText style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>{i18n.t('challenge.results.back_home')}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    container: {
        flex: 1,
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    finishedEmoji: {
        fontSize: 64,
        marginBottom: 8,
    },
    finishedTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    finishedSubtitle: {
        fontSize: 16,
        color: AppColors.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    finishedScrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    finishedStats: {
        width: '100%',
        backgroundColor: AppColors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        gap: 8,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    finishedStatRow: {
        alignItems: 'center',
    },
    finishedStatLabel: {
        fontSize: 12,
        color: AppColors.textSecondary,
        fontWeight: '600',
        marginBottom: 2,
    },
    finishedStatValue: {
        fontSize: 19,
        fontWeight: 'bold',
    },
    finishedButtonsContainer: {
        width: '100%',
        gap: 10,
    },
    finishedButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
    },
    finishedButtonSecondary: {
        backgroundColor: AppColors.timerMiddle,
    },
    finishedButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: AppColors.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
    finishedButtonOutlineText: {
        color: AppColors.primary,
    },
    finishedButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    correctionMessage: {
        fontSize: 17,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontStyle: 'italic',
        paddingHorizontal: 8,
    },
});
