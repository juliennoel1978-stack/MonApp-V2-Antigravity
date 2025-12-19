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
    ({ question, userAnswer, setUserAnswer, showCorrectAnswer }, ref) => {
        return (
            <>
                <View style={styles.questionCard}>
                    <ThemedText style={styles.questionText}>
                        {question.displayText}
                    </ThemedText>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        ref={ref}
                        style={styles.input}
                        value={userAnswer}
                        onChangeText={setUserAnswer}
                        keyboardType="number-pad"
                        placeholder="Ta réponse"
                        placeholderTextColor={AppColors.textLight}
                        autoFocus
                        editable={!showCorrectAnswer}
                        testID="answer-input"
                    />
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
    },
    input: {
        backgroundColor: AppColors.surface,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 20,
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.text,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: AppColors.primary,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
});
