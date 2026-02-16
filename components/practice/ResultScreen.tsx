import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';
import type { Question } from '@/types';

const { width } = Dimensions.get('window');

type ResultScreenProps = {
    level: 1 | 2;
    correctCount: number;
    totalQuestions: number;
    tableColor: string;
    tableNumber: number;
    userName: string;
    questionsToReview: Question[];
    isReviewSession: boolean; // True if just finished reviewing errors (not a full quiz)
    onRetry: () => void;
    onStartReview: () => void;
    onBackToMenu: () => void;
    onReviewTable: () => void;
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
    level,
    correctCount,
    totalQuestions,
    tableColor,
    tableNumber,
    userName,
    questionsToReview,
    isReviewSession,
    onRetry,
    onStartReview,
    onBackToMenu,
    onReviewTable,
}) => {
    // If just finished a review session successfully
    if (isReviewSession) {
        return (
            <View style={styles.backgroundContainer}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.resultContainer}>
                        <ThemedText style={styles.resultTitle}>
                            {level === 1
                                ? i18n.t('practice.bravo_name', { name: userName })
                                : `${i18n.t('practice.results.bravo_simple')} ${userName ? `${userName} ` : ''}! 🎉`}
                        </ThemedText>
                        <ThemedText style={styles.resultSubtitle}>
                            {i18n.t('practice.review_success')}
                        </ThemedText>

                        <View style={styles.resultButtonsColumn}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: tableColor }]}
                                onPress={onRetry}
                                testID="retry-button"
                            >
                                <ThemedText style={styles.primaryButtonText}>
                                    {i18n.t('practice.results.retry_full_nl')}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryButton, styles.outlineButton, { borderColor: tableColor, backgroundColor: 'transparent' }]}
                                onPress={onBackToMenu}
                                testID="back-button-result"
                            >
                                <ThemedText style={[styles.primaryButtonText, { color: tableColor }]}>
                                    {i18n.t('practice.results.other_table_full')}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Level 1 - Score insuffisant pour Level 2 (< 7/10)
    if (level === 1) {
        const earnedEncouragementStar = correctCount >= 3;

        return (
            <View style={styles.backgroundContainer}>
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.resultScrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <ThemedText style={styles.resultTitle}>
                            {i18n.t('practice.results.almost')}
                        </ThemedText>

                        <View style={[styles.resultCardCompact, { borderColor: tableColor }]}>
                            <ThemedText style={styles.resultScore}>
                                {correctCount}/{totalQuestions}
                            </ThemedText>
                            <ThemedText style={styles.resultLabel}>
                                {i18n.t('practice.results.correct_answers')}
                            </ThemedText>

                            {earnedEncouragementStar && (
                                <View style={styles.starsContainer}>
                                    <Star size={24} color={AppColors.warning} fill={AppColors.warning} />
                                </View>
                            )}

                            <ThemedText style={styles.encouragementLarge}>
                                {earnedEncouragementStar
                                    ? i18n.t('practice.results.encouragement_star_earned')
                                    : i18n.t('practice.results.encouragement_muscle')}
                            </ThemedText>
                            <ThemedText style={styles.encouragementSmall}>
                                {i18n.t('practice.results.encouragement_min')}
                            </ThemedText>
                        </View>

                        <View style={styles.resultButtonsColumn}>
                            {questionsToReview.length > 0 && (
                                <View style={styles.reviewContainer}>
                                    <ThemedText style={styles.reviewText}>
                                        {i18n.t('practice.results.review_only_errors')}
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={styles.reviewConfirmButton}
                                        onPress={onStartReview}
                                    >
                                        <ThemedText style={styles.reviewConfirmButtonText}>
                                            {i18n.t('practice.results.yes')}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.resultButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.resultButton, { backgroundColor: tableColor }]}
                                    onPress={onReviewTable}
                                    testID="review-lesson-button"
                                >
                                    <ThemedText style={styles.resultButtonText}>
                                        {i18n.t('practice.results.review_table')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.resultButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.resultButton, styles.secondaryButton]}
                                    onPress={onRetry}
                                    testID="retry-button"
                                >
                                    <ThemedText style={styles.secondaryButtonText}>
                                        {i18n.t('practice.results.retry_quiz')}
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.resultButton, styles.outlineButton, { borderColor: tableColor }]}
                                    onPress={onBackToMenu}
                                    testID="back-button-result"
                                >
                                    <ThemedText style={[styles.outlineButtonText, { color: tableColor }]}>
                                        {i18n.t('practice.results.other_table_nl')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    // Level 2 Finished
    const totalCorrectLevel2 = correctCount;
    let stars = 4;
    if (totalCorrectLevel2 < 10) {
        stars = totalCorrectLevel2 >= 8 ? 3 : totalCorrectLevel2 >= 5 ? 2 : 1;
    }
    const passed = stars >= 3;

    return (
        <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.resultScrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <ThemedText style={styles.resultTitle}>
                        {passed
                            ? `${i18n.t('practice.results.bravo_simple')} ${userName ? `${userName} ` : ''}! 🎉`
                            : `${i18n.t('practice.results.almost_simple')} ${userName ? `${userName} ` : ''}! 😕`}
                    </ThemedText>
                    <ThemedText style={styles.resultSubtitle}>
                        {passed ? i18n.t('practice.results.finished') : i18n.t('practice.results.keep_training')}
                    </ThemedText>

                    <View style={[styles.resultCard, { borderColor: tableColor }]}>
                        <ThemedText style={styles.resultScore}>
                            {correctCount}/{totalQuestions}
                        </ThemedText>
                        <ThemedText style={styles.resultLabel}>
                            {i18n.t('practice.results.correct_answers')}
                        </ThemedText>

                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4].map(starIndex => (
                                <Star
                                    key={starIndex}
                                    size={32}
                                    color={starIndex <= stars ? AppColors.warning : AppColors.borderLight}
                                    fill={starIndex <= stars ? AppColors.warning : 'transparent'}
                                />
                            ))}
                        </View>

                        <ThemedText style={styles.encouragement}>
                            {stars === 4 ? i18n.t('practice.results.encouragement_perfect', { number: tableNumber }) :
                                stars === 3 ? i18n.t('practice.results.encouragement_great') :
                                    stars === 2 ? i18n.t('practice.results.encouragement_good') :
                                        i18n.t('practice.results.encouragement_fail')}
                        </ThemedText>
                    </View>

                    <View style={styles.resultButtonsColumn}>
                        {questionsToReview.length > 0 && (
                            <View style={styles.reviewSectionContainer}>
                                <ThemedText style={styles.reviewSectionTitle}>
                                    {i18n.t('practice.results.review_only_errors')}
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.reviewButtonSecondary}
                                    onPress={onStartReview}
                                >
                                    <ThemedText style={styles.reviewButtonSecondaryText}>
                                        {i18n.t('practice.results.yes')}, {questionsToReview.length === 1 ? i18n.t('practice.review_btn_one') : i18n.t('practice.review_btn_many', { count: questionsToReview.length })}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.resultButtonsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    passed ? styles.retryButtonStyle : { backgroundColor: tableColor }
                                ]}
                                onPress={onRetry}
                            >
                                <ThemedText style={[
                                    styles.actionButtonText,
                                    passed && { color: AppColors.text }
                                ]}>
                                    {i18n.t('practice.retry_level1')}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    passed ? { backgroundColor: tableColor } : styles.actionButtonOutline,
                                    !passed && { borderColor: tableColor }
                                ]}
                                onPress={onBackToMenu}
                            >
                                <ThemedText style={[
                                    styles.actionButtonText,
                                    !passed && { color: tableColor }
                                ]}>
                                    {i18n.t('practice.results.other_table_full')}
                                </ThemedText>
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
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    resultContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    resultScrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        alignItems: 'center',
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    resultSubtitle: {
        fontSize: 16,
        color: AppColors.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: AppColors.surface,
        padding: 28,
        paddingTop: 24,
        paddingBottom: 24,
        borderRadius: 24,
        alignItems: 'center',
        width: width - 48,
        borderWidth: 3,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
    },
    resultCardCompact: {
        backgroundColor: AppColors.surface,
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
        borderWidth: 2,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 12,
    },
    resultScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: AppColors.primary,
        marginBottom: 2,
    },
    resultLabel: {
        fontSize: 14,
        color: AppColors.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    encouragement: {
        fontSize: 14,
        color: AppColors.text,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 20,
        paddingHorizontal: 0,
        maxWidth: '100%',
    },
    encouragementLarge: {
        fontSize: 14,
        color: AppColors.text,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 8,
        lineHeight: 20,
    },
    encouragementSmall: {
        fontSize: 12,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 16,
    },
    resultButtonsColumn: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
    },
    resultButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    resultButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
    },
    resultButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: AppColors.surfaceLight,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppColors.text,
        textAlign: 'center',
        lineHeight: 20,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    outlineButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    primaryButton: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 12,
    },
    primaryButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    reviewContainer: {
        backgroundColor: AppColors.warning + '20',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    reviewText: {
        fontSize: 13,
        color: AppColors.text,
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
        lineHeight: 18,
    },
    reviewConfirmButton: {
        backgroundColor: AppColors.warning,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    reviewConfirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    reviewSectionContainer: {
        backgroundColor: AppColors.warning + '15',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AppColors.warning + '30',
    },
    reviewSectionTitle: {
        fontSize: 14,
        color: AppColors.text,
        textAlign: 'center',
        marginBottom: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    reviewButtonSecondary: {
        backgroundColor: AppColors.surface,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: AppColors.warning,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    reviewButtonSecondaryText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.warning,
        textAlign: 'center',
        lineHeight: 20,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 56,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 20,
    },
    actionButtonOutline: {
        backgroundColor: AppColors.surface,
        borderWidth: 2,
    },
    retryButtonStyle: {
        backgroundColor: AppColors.surface,
        borderWidth: 2,
        borderColor: AppColors.border,
    },
});
