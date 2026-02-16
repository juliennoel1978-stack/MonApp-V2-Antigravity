import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';
import type { Question } from '@/types';

const { width } = Dimensions.get('window');

type LevelCompleteScreenProps = {
    correctCount: number;
    tableColor: string;
    userName: string;
    questionsToReview: Question[];
    onStartLevel2: () => void;
    onStartReview: () => void;
    onBackToMenu: () => void;
};

export const LevelCompleteScreen: React.FC<LevelCompleteScreenProps> = ({
    correctCount,
    tableColor,
    userName,
    questionsToReview,
    onStartLevel2,
    onStartReview,
    onBackToMenu,
}) => {
    const starsEarnedLevel1 = correctCount === 10 ? 2 : 1;

    return (
        <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.resultScrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <ThemedText style={styles.resultTitle}>
                        {i18n.t('practice.bravo_name', { name: userName })}
                    </ThemedText>
                    <ThemedText style={styles.resultSubtitle}>
                        {correctCount === 10
                            ? i18n.t('practice.mastered')
                            : i18n.t('practice.unlocked_lvl2')}
                    </ThemedText>

                    <View style={[styles.resultCard, { borderColor: tableColor }]}>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4].map(starIndex => (
                                <Star
                                    key={starIndex}
                                    size={32}
                                    color={starIndex <= starsEarnedLevel1 ? AppColors.warning : AppColors.borderLight}
                                    fill={starIndex <= starsEarnedLevel1 ? AppColors.warning : 'transparent'}
                                />
                            ))}
                        </View>
                        <ThemedText style={styles.intermediateStarsText}>
                            {i18n.t('practice.stars_count', { count: starsEarnedLevel1, s: starsEarnedLevel1 > 1 ? 's' : '' })}
                        </ThemedText>
                        <ThemedText style={styles.transitionDescriptionFirst}>
                            {i18n.t('practice.level2_intro')}
                        </ThemedText>
                        <ThemedText style={styles.transitionDescriptionSecond}>
                            {i18n.t('practice.level2_desc', { count: 4 - starsEarnedLevel1, s: (4 - starsEarnedLevel1) > 1 ? 's' : '' })}
                        </ThemedText>
                    </View>

                    <View style={styles.resultButtonsColumn}>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: tableColor }]}
                            onPress={onStartLevel2}
                        >
                            <ThemedText style={styles.primaryButtonText}>
                                {i18n.t('practice.go_level2')}
                            </ThemedText>
                        </TouchableOpacity>

                        {questionsToReview.length > 0 && (
                            <View style={styles.reviewSectionContainer}>
                                <ThemedText style={styles.reviewSectionTitle}>
                                    {i18n.t('practice.review_errors_q')}
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.reviewButtonSecondary}
                                    onPress={onStartReview}
                                >
                                    <ThemedText style={styles.reviewButtonSecondaryText}>
                                        {questionsToReview.length === 1
                                            ? i18n.t('practice.review_btn_one')
                                            : i18n.t('practice.review_btn_many', { count: questionsToReview.length })}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.backToMenuButton}
                            onPress={onBackToMenu}
                        >
                            <ThemedText style={styles.backToMenuButtonText}>
                                {i18n.t('common.back_to_menu')}
                            </ThemedText>
                        </TouchableOpacity>
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
    starsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    intermediateStarsText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.text,
        marginTop: 6,
        marginBottom: 12,
    },
    transitionDescriptionFirst: {
        fontSize: 15,
        color: AppColors.text,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '600',
        marginBottom: 8,
    },
    transitionDescriptionSecond: {
        fontSize: 13,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    resultButtonsColumn: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
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
    backToMenuButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    backToMenuButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.textSecondary,
    },
});
