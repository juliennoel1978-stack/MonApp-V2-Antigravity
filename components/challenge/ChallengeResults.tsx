import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { User } from '@/types';

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
                            <Text style={styles.finishedEmoji}>✅</Text>
                            <Text style={styles.finishedTitle}>
                                Bien joué{currentUser ? ` ${currentUser.firstName}` : ''} !
                            </Text>
                            <Text style={styles.finishedSubtitle}>Tu as corrigé tes erreurs</Text>

                            <View style={styles.finishedStats}>
                                <Text style={styles.correctionMessage}>
                                    {randomMessage}
                                </Text>
                            </View>

                            <View style={styles.finishedButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.finishedButton}
                                    onPress={onRestart}
                                >
                                    <Text style={styles.finishedButtonText} numberOfLines={1}>Refaire un Challenge</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.finishedButton, styles.finishedButtonOutline]}
                                    onPress={onHome}
                                >
                                    <Text style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>Retour à l&apos;accueil</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    let bestTable = -1;
    let worstTable = -1;
    let bestTableRate = -1;
    let worstTableRate = 2;

    Object.entries(tableStats).forEach(([table, stats]) => {
        const rate = stats.correct / stats.total;
        if (rate > bestTableRate) {
            bestTableRate = rate;
            bestTable = parseInt(table);
        }
        if (rate < worstTableRate && stats.total > 0 && stats.correct < stats.total) {
            worstTableRate = rate;
            worstTable = parseInt(table);
        }
    });

    return (
        <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView
                    contentContainerStyle={styles.finishedScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.finishedContainer}>
                        <Text style={styles.finishedEmoji}>🎉</Text>
                        <Text style={styles.finishedTitle}>
                            {currentUser ? `Bravo ${currentUser.firstName} !` : 'Félicitations !'}
                        </Text>
                        <Text style={styles.finishedSubtitle}>
                            Challenge terminé ! (n°{completedChallengeCount > 0 ? completedChallengeCount : (currentUser ? (currentUser.challengesCompleted || 0) : anonymousChallengesCompleted)})
                        </Text>

                        <View style={styles.finishedStats}>
                            <View style={styles.finishedStatRow}>
                                <Text style={styles.finishedStatLabel}>Précision</Text>
                                <Text style={[styles.finishedStatValue, { color: AppColors.primary }]} numberOfLines={1}>
                                    {correctCount} / {maxQuestions} 👍
                                </Text>
                            </View>

                            {bestStreak > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <Text style={styles.finishedStatLabel}>Ta meilleure série</Text>
                                    <Text style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {bestStreak} {bestStreak === 1 ? 'bonne' : 'bonnes'} d&apos;affilée ✨
                                    </Text>
                                </View>
                            )}

                            {bestTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <Text style={styles.finishedStatLabel}>Table la plus solide</Text>
                                    <Text style={[styles.finishedStatValue, { color: AppColors.success }]} numberOfLines={1}>
                                        {bestTable} 💪
                                    </Text>
                                </View>
                            )}

                            {worstTable > 0 && (
                                <View style={styles.finishedStatRow}>
                                    <Text style={styles.finishedStatLabel}>Table à surveiller</Text>
                                    <Text style={[styles.finishedStatValue, { color: AppColors.timerMiddle }]} numberOfLines={1}>
                                        {worstTable} 🚸
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.finishedButtonsContainer}>
                            {wrongAnswersCount > 0 && (
                                <TouchableOpacity
                                    style={[styles.finishedButton, styles.finishedButtonSecondary]}
                                    onPress={onReviewErrors}
                                >
                                    <Text style={styles.finishedButtonText} numberOfLines={1}>Revoir mes erreurs</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.finishedButton}
                                onPress={onRestart}
                            >
                                <Text style={styles.finishedButtonText} numberOfLines={1}>Refaire un Challenge</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.finishedButton, styles.finishedButtonOutline]}
                                onPress={onHome}
                            >
                                <Text style={[styles.finishedButtonText, styles.finishedButtonOutlineText]} numberOfLines={1}>Retour à l&apos;accueil</Text>
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
