import React, { forwardRef } from 'react';
import { View, TextInput, StyleSheet, Dimensions, Platform } from 'react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';

const { width } = Dimensions.get('window');

type ChallengeQuestionProps = {
    question: {
        displayText: string;
    };
    userAnswer: string;
    setUserAnswer: (text: string) => void;
    showCorrectAnswer: boolean;
};

export const ChallengeQuestion = forwardRef<TextInput, ChallengeQuestionProps>(
    ({ question, userAnswer, showCorrectAnswer }, ref) => {
        return (
            <>
                <View style={styles.questionCard}>
                    <ThemedText style={styles.questionText}>
                        {question.displayText}
                    </ThemedText>
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputLike}>
                        {userAnswer ? (
                            <ThemedText style={styles.inputText}>{userAnswer}</ThemedText>
                        ) : (
                            <ThemedText style={styles.placeholder}>Ta réponse</ThemedText>
                        )}
                        {!showCorrectAnswer && <View style={styles.cursor} />}
                    </View>
                </View>
            </>
        );
    }
);
ChallengeQuestion.displayName = 'ChallengeQuestion';

const styles = StyleSheet.create({
    questionCard: {
        backgroundColor: AppColors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        marginTop: 8,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    questionText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: AppColors.text,
        textAlign: 'center',
    },
    inputContainer: {
        width: width - 48,
        marginBottom: 16,
        alignItems: 'center',
    },
    inputLike: {
        backgroundColor: AppColors.surface,
        borderRadius: 14,
        paddingVertical: 14, // Slightly taller
        paddingHorizontal: 20,
        minWidth: 150,
        width: '100%',
        maxWidth: 250,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: AppColors.primary,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.text,
        textAlign: 'center',
    },
    placeholder: {
        fontSize: 22,
        color: AppColors.textLight,
        fontStyle: 'italic',
    },
    cursor: {
        width: 2,
        height: 24,
        backgroundColor: AppColors.primary,
        marginLeft: 4,
        opacity: 0.6,
    },
});
