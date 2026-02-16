import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw, ArrowRight } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { DecompositionView } from '@/components/DecompositionView';
import { AppColors, SemanticColors } from '@/constants/colors';
import { getQuestionDecomposition } from '@/utils/tableLogic';
import { TIPS_BY_TABLE } from '@/constants/tables';
import i18n from '@/utils/i18n';
import type { Question } from '@/types';

type ErrorFeedbackViewProps = {
    visible: boolean;
    currentQuestion: Question;
    tableNumber: number;
    level: 1 | 2;
    onRetryQuestion: () => void;
    onContinue: () => void;
};

export const ErrorFeedbackView: React.FC<ErrorFeedbackViewProps> = ({
    visible,
    currentQuestion,
    tableNumber,
    level,
    onRetryQuestion,
    onContinue,
}) => {
    if (!visible) return null;

    const decomposition = getQuestionDecomposition(tableNumber, currentQuestion.multiplier);

    const getDynamicTip = () => {
        const erreurKey = TIPS_BY_TABLE[tableNumber]?.erreur;
        if (erreurKey) {
            return i18n.t(erreurKey);
        }
        return '';
    };

    return (
        <View style={styles.fullScreenOverlay}>
            <View style={[styles.errorCard, { borderColor: AppColors.warning }]}>
                <ThemedText style={styles.errorTitle}>
                    {i18n.t('practice.correction.title')}
                </ThemedText>

                <View style={styles.correctionContainer}>
                    <View style={{ alignItems: 'center', width: '100%' }}>
                        {/* 1. Large Standard Result */}
                        <ThemedText style={styles.correctionText}>
                            {currentQuestion.multiplicand} ×
                            <ThemedText style={{ color: SemanticColors.multiplier }}>
                                {currentQuestion.multiplier}
                            </ThemedText> = {currentQuestion.correctAnswer}
                        </ThemedText>

                        {/* 2. Decomposition Detail */}
                        {decomposition && (
                            <View style={{ marginTop: 8, marginBottom: 12 }}>
                                <DecompositionView
                                    decomposition={decomposition.decomposition}
                                    multiplier={currentQuestion.multiplier}
                                    result={currentQuestion.correctAnswer}
                                    scale={1.0}
                                    centered={true}
                                />
                            </View>
                        )}

                        {/* 3. Tip / Rule */}
                        <View style={{ marginTop: 8, alignItems: 'center', paddingHorizontal: 10 }}>
                            <ThemedText style={[styles.errorTipText, { opacity: 0.8, fontSize: 14, marginBottom: 4 }]}>
                                {i18n.t('practice.correction.remember_rule')}
                            </ThemedText>
                            <ThemedText style={[styles.errorTipText, { fontSize: 15, fontWeight: '600', textAlign: 'center' }]}>
                                {getDynamicTip()}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.errorButtons}>
                    {level === 2 && (
                        <TouchableOpacity
                            style={[styles.errorButton, styles.retryQuestionButton]}
                            onPress={onRetryQuestion}
                        >
                            <RefreshCw size={20} color={AppColors.text} />
                            <ThemedText style={styles.errorButtonText}>
                                {i18n.t('practice.correction.retry_question')}
                            </ThemedText>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.errorButton, styles.continueButton]}
                        onPress={onContinue}
                    >
                        <ThemedText style={[styles.errorButtonText, { color: '#FFF' }]}>
                            {i18n.t('practice.correction.continue')}
                        </ThemedText>
                        <ArrowRight size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        padding: 20,
        paddingBottom: 40,
        zIndex: 200,
    },
    errorCard: {
        backgroundColor: AppColors.surface,
        padding: 16,
        borderRadius: 24,
        borderWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
        width: '100%',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.warning,
        textAlign: 'center',
        marginBottom: 20,
    },
    correctionContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    correctionText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 12,
    },
    errorTipText: {
        fontSize: 18,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    errorButtons: {
        gap: 12,
    },
    errorButton: {
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButton: {
        backgroundColor: AppColors.warning,
    },
    retryQuestionButton: {
        backgroundColor: AppColors.surfaceLight,
    },
    errorButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.text,
    },
});
