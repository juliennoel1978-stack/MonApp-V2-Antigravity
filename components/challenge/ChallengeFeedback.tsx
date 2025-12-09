import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import type { User } from '@/types';

type QuestionType = 'result' | 'multiplier' | 'multiplicand';

type Question = {
    num1: number;
    num2: number;
    answer: number;
    type: QuestionType;
};

type ChallengeFeedbackProps = {
    showCelebration: boolean;
    celebrationAnim: Animated.Value;
    showFeedback: boolean;
    scaleAnim: Animated.Value;
    isCorrect: boolean;
    isTimeout: boolean;
    currentUser: User | null;
    timerDisplayMode: 'bar' | 'chronometer';
    showCorrectAnswer: boolean;
    currentQuestion: Question | null;
    attempts: number;
    currentCorrectPhrase: string;
    currentErrorPhrase: string;
};

export const ChallengeFeedback = ({
    showCelebration,
    celebrationAnim,
    showFeedback,
    scaleAnim,
    isCorrect,
    isTimeout,
    currentUser,
    timerDisplayMode,
    showCorrectAnswer,
    currentQuestion,
    attempts,
    currentCorrectPhrase,
    currentErrorPhrase,
}: ChallengeFeedbackProps) => {

    if (showCelebration) {
        return (
            <Animated.View
                style={[
                    styles.celebrationContainer,
                    {
                        opacity: celebrationAnim,
                        transform: [
                            {
                                scale: celebrationAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <Text style={styles.celebrationText}>Bravo !</Text>
                <Text style={styles.celebrationSubtext}>
                    4 bonnes réponses d&apos;affilée !
                </Text>
            </Animated.View>
        );
    }

    if (showFeedback) {
        return (
            <Animated.View
                style={[
                    styles.feedbackContainer,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {isCorrect ? (
                    <View style={styles.feedbackBox}>
                        <Check size={48} color={AppColors.success} />
                        <Text style={[styles.feedbackText, { color: AppColors.success }]}>
                            Correct !
                        </Text>
                        <Text style={styles.encouragementText}>
                            {currentCorrectPhrase}
                        </Text>
                    </View>
                ) : isTimeout ? (
                    <View style={styles.feedbackBox}>
                        <Clock size={48} color={AppColors.timerMiddle} />
                        <Text style={[styles.feedbackText, { color: AppColors.timerMiddle, textAlign: 'center' }]}>
                            {timerDisplayMode === 'bar'
                                ? "Prends ton temps,\non regarde la réponse ensemble."
                                : "Temps écoulé !"}
                        </Text>
                        {showCorrectAnswer && currentQuestion && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.correctAnswerLabel}>
                                    La bonne réponse est : <Text style={styles.correctAnswerValue}>{currentQuestion.answer}</Text>
                                </Text>
                                <View style={styles.equationContainer}>
                                    <Text style={styles.equationText}>
                                        {currentQuestion.type === 'multiplicand' && (
                                            <Text style={styles.underlined}>{currentQuestion.num1}</Text>
                                        )}
                                        {currentQuestion.type !== 'multiplicand' && currentQuestion.num1}
                                        {' × '}
                                        {currentQuestion.type === 'multiplier' && (
                                            <Text style={styles.underlined}>{currentQuestion.num2}</Text>
                                        )}
                                        {currentQuestion.type !== 'multiplier' && currentQuestion.num2}
                                        {' = '}
                                        {currentQuestion.type === 'result' && (
                                            <Text style={styles.underlined}>{currentQuestion.answer}</Text>
                                        )}
                                        {currentQuestion.type !== 'result' && currentQuestion.num1 * currentQuestion.num2}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.feedbackBox}>
                        <X size={48} color={attempts === 1 ? AppColors.timerMiddle : AppColors.timerEnd} />
                        <Text style={[styles.feedbackText, { color: attempts === 1 ? AppColors.timerMiddle : AppColors.timerEnd }]}>
                            {attempts === 1 ? 'On réessaie 😌' : 'Pas tout à fait...'}
                        </Text>
                        {showCorrectAnswer && currentQuestion && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.correctAnswerLabel}>
                                    La bonne réponse est : <Text style={styles.correctAnswerValue}>{currentQuestion.answer}</Text>
                                </Text>
                                <View style={styles.equationContainer}>
                                    <Text style={styles.equationText}>
                                        {currentQuestion.type === 'multiplicand' && (
                                            <Text style={styles.underlined}>{currentQuestion.num1}</Text>
                                        )}
                                        {currentQuestion.type !== 'multiplicand' && currentQuestion.num1}
                                        {' × '}
                                        {currentQuestion.type === 'multiplier' && (
                                            <Text style={styles.underlined}>{currentQuestion.num2}</Text>
                                        )}
                                        {currentQuestion.type !== 'multiplier' && currentQuestion.num2}
                                        {' = '}
                                        {currentQuestion.type === 'result' && (
                                            <Text style={styles.underlined}>{currentQuestion.answer}</Text>
                                        )}
                                        {currentQuestion.type !== 'result' && currentQuestion.num1 * currentQuestion.num2}
                                    </Text>
                                </View>
                                <Text style={styles.kindPhraseText}>
                                    {currentErrorPhrase}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </Animated.View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    feedbackContainer: {
        marginTop: 0,
        marginBottom: 16,
    },
    feedbackBox: {
        alignItems: 'center',
        gap: 4,
    },
    feedbackText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    encouragementText: {
        fontSize: 16,
        color: AppColors.success,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500',
    },
    kindPhraseText: {
        fontSize: 15,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
        paddingHorizontal: 16,
    },
    answerContainer: {
        alignItems: 'center',
        marginTop: 2,
        gap: 6,
    },
    correctAnswerLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.textSecondary,
        textAlign: 'center',
    },
    correctAnswerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    equationContainer: {
        backgroundColor: AppColors.surfaceLight,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: AppColors.primary,
    },
    equationText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.text,
        textAlign: 'center',
    },
    underlined: {
        textDecorationLine: 'underline',
        textDecorationColor: AppColors.primary,
        textDecorationStyle: 'solid',
        color: AppColors.primary,
    },
    celebrationContainer: {
        alignItems: 'center',
        gap: 16,
        marginTop: 60,
    },
    celebrationEmoji: {
        fontSize: 120,
    },
    celebrationText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    celebrationSubtext: {
        fontSize: 24,
        color: AppColors.textSecondary,
        textAlign: 'center',
    },
});
