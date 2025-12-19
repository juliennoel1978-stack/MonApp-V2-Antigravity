import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { User } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { ThemedText } from '../ThemedText';
import { useAudio } from '@/hooks/useAudio';
import { useHaptics } from '@/hooks/useHaptics';

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

    if (isReviewMode) {
        const correctionMessages = [
            "Une erreur de moins, bravo. Le Pro s'installe.",
            "Chaque correction compte. Tu t'améliores vraiment.",
            "Bien joué ! Tu as tout compris cette fois-ci 🎯",
            "Super ! C'est comme ça qu'on progresse 💪",
        ];
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
                                Bien joué{currentUser ? ` ${currentUser.firstName}` : ''} !
                            </ThemedText>
                            <ThemedText style={styles.finishedSubtitle}>Tu as corrigé tes erreurs</ThemedText>

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
                                    <ThemedText style={styles.finishedButtonText} numberOfLines={1}>Refaire un Challenge</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.finishedButton, styles.finishedButtonOutline]}
                                    onPress={onHome}
                                >
                                    <ThemedText style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>Retour à l&apos;accueil</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    // INTEGRATION FIX: We use the context directly here to save what we DISPLAY.
    // This ensures "What You See Is What You Get".
    const { updateStrongestTable } = useApp();
    const { playSound } = useAudio();
    const { vibrate } = useHaptics();

    const { bestTable, worstTable, bestStreakValue } = React.useMemo(() => {
        let best = -1;
        let worst = -1;
        let bestRate = -1;
        let worstRate = 2;

        Object.entries(tableStats).forEach(([table, stats]) => {
            const rate = stats.total > 0 ? stats.correct / stats.total : 0;

            // Logic matches the display exactly
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
    }, [tableStats, bestStreak]);

    // Side Effect: Save the Best Table to Context immediately when calculated.
    // This runs once when the component mounts (Results screen appears).
    React.useEffect(() => {
        // Play Finish Sound
        playSound('finish');
        vibrate('heavy'); // Significant feedback for completion

        if (bestTable > 0) {
            console.log('🏆 UI-Driven Save: Updating Strongest Table to', bestTable);
            updateStrongestTable(bestTable);
        }
    }, [bestTable, updateStrongestTable]);

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
                            {currentUser ? `Bravo ${currentUser.firstName} !` : 'Félicitations !'}
                        </ThemedText>
                        <ThemedText style={styles.finishedSubtitle}>
                            Challenge terminé ! (n°{completedChallengeCount > 0 ? completedChallengeCount : (currentUser ? (currentUser.challengesCompleted || 0) : anonymousChallengesCompleted)})
                        </ThemedText>

                        <View style={styles.finishedStats}>
                            <View style={styles.finishedStatRow}>
                                <ThemedText style={styles.finishedStatLabel}>Précision</ThemedText>
                                <ThemedText style={[styles.finishedStatValue, { color: AppColors.primary }]} numberOfLines={1}>
                                    {correctCount} / {maxQuestions} 👍
                                </ThemedText>
                            </View>

                            {bestStreak > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>Ta meilleure série</ThemedText>
                                    <ThemedText style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {bestStreak} {bestStreak === 1 ? 'bonne' : 'bonnes'} d&apos;affilée ✨
                                    </ThemedText>
                                </View>
                            )}

                            {bestTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>Table la plus solide</ThemedText>
                                    <ThemedText style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {bestTable} 💪
                                    </ThemedText>
                                </View>
                            )}

                            {worstTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <ThemedText style={styles.finishedStatLabel}>Table à surveiller</ThemedText>
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
                                    <ThemedText style={styles.finishedButtonText} numberOfLines={1}>Revoir mes erreurs</ThemedText>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.finishedButton}
                                onPress={onRestart}
                            >
                                <ThemedText style={styles.finishedButtonText} numberOfLines={1}>Refaire un Challenge</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.finishedButton, styles.finishedButtonOutline]}
                                onPress={onHome}
                            >
                                <ThemedText style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>Retour à l&apos;accueil</ThemedText>
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
