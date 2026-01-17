import { useRouter } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, CheckCircle, RotateCcw, Rocket, Star } from 'lucide-react-native';
import { AppColors, NumberColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive } from '@/hooks/useResponsive';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/utils/i18n';

export default function ChallengeSetupScreen() {
    const router = useRouter();
    const { progress, currentUser, settings } = useApp();
    const { vibrate } = useHaptics();
    const { isSmallScreen, isTablet, spacing, fontSize, containerMaxWidth } = useResponsive();

    // Animation refs for each table button
    const scaleAnims = useRef(
        Array.from({ length: 10 }, () => new Animated.Value(1))
    ).current;

    // Smart selection logic
    const getSmartSelection = useCallback((): number[] => {
        const selected: number[] = [1, 10]; // Always included

        for (let table = 2; table <= 9; table++) {
            const tableProgress = progress.find(p => p.tableNumber === table);
            if (tableProgress?.level2Completed) {
                selected.push(table);
            }
        }

        return selected.sort((a, b) => a - b);
    }, [progress]);

    const [selectedTables, setSelectedTables] = useState<number[]>(() => getSmartSelection());

    // Get stars for a table
    const getTableStars = useCallback((tableNumber: number): number => {
        const tableProgress = progress.find(p => p.tableNumber === tableNumber);
        return tableProgress?.starsEarned || 0;
    }, [progress]);

    // Toggle table selection with animation
    const toggleTable = useCallback((tableNumber: number) => {
        vibrate('light');

        // Bounce animation
        const anim = scaleAnims[tableNumber - 1];
        Animated.sequence([
            Animated.timing(anim, {
                toValue: 1.15,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(anim, {
                toValue: 1,
                friction: 3,
                tension: 200,
                useNativeDriver: true,
            }),
        ]).start();

        setSelectedTables(prev => {
            if (prev.includes(tableNumber)) {
                return prev.filter(t => t !== tableNumber);
            } else {
                return [...prev, tableNumber].sort((a, b) => a - b);
            }
        });
    }, [vibrate, scaleAnims]);

    // Select all tables
    const selectAll = useCallback(() => {
        vibrate('impact');
        setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }, [vibrate]);

    // Reset to smart selection
    const resetToSmartSelection = useCallback(() => {
        vibrate('impact');
        setSelectedTables(getSmartSelection());
    }, [vibrate, getSmartSelection]);

    // Start challenge
    const startChallenge = useCallback(() => {
        if (selectedTables.length === 0) return;
        vibrate('heavy');
        const tablesParam = selectedTables.join(',');
        router.push(`/challenge?tables=${tablesParam}` as any);
    }, [selectedTables, vibrate, router]);

    const canStart = selectedTables.length > 0;

    // Render star indicators using SVG icons (fixes overflow with OpenDyslexic font)
    const renderStars = useCallback((count: number) => {
        const stars = [];
        for (let i = 0; i < 4; i++) {
            const isEarned = i < count;
            stars.push(
                <Star
                    key={i}
                    size={9}
                    color={isEarned ? '#FFD700' : '#AAAAAA'}
                    fill={isEarned ? '#FFD700' : 'transparent'}
                />
            );
        }
        return stars;
    }, []);

    return (
        <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.back()}
                        testID="back-button"
                    >
                        <Home size={26} color={AppColors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText
                            style={[styles.headerTitle, isTablet && { fontSize: fontSize(24) }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {i18n.t('challenge_setup.title')}
                        </ThemedText>
                        <ThemedText
                            style={[styles.headerSubtitle, isTablet && { fontSize: fontSize(14) }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {i18n.t('challenge_setup.subtitle')}
                        </ThemedText>
                    </View>
                </View>

                {/* Tables Grid */}
                <View style={styles.gridContainer}>
                    <View style={[
                        styles.grid,
                        {
                            gap: spacing(12),
                            maxWidth: containerMaxWidth,
                        }
                    ]}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tableNumber => {
                            const isSelected = selectedTables.includes(tableNumber);
                            const stars = getTableStars(tableNumber);
                            const tableColor = NumberColors[tableNumber as keyof typeof NumberColors];

                            return (
                                <Animated.View
                                    key={tableNumber}
                                    style={[
                                        styles.tableButtonWrapper,
                                        { transform: [{ scale: scaleAnims[tableNumber - 1] }] },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.tableButton,
                                            isSelected
                                                ? { backgroundColor: tableColor, borderColor: tableColor }
                                                : styles.tableButtonInactive,
                                        ]}
                                        onPress={() => toggleTable(tableNumber)}
                                        activeOpacity={0.7}
                                        testID={`table-button-${tableNumber}`}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.tableNumber,
                                                isSelected
                                                    ? styles.tableNumberActive
                                                    : { color: tableColor },
                                                isTablet && { fontSize: fontSize(24) },
                                            ]}
                                            adjustsFontSizeToFit
                                            numberOfLines={1}
                                        >
                                            {tableNumber}
                                        </ThemedText>
                                        <View style={styles.starsContainer}>
                                            {renderStars(stars)}
                                        </View>
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <CheckCircle size={16} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>

                {/* Selected count */}
                <View style={[styles.selectionInfo, { paddingVertical: spacing(12) }]}>
                    <ThemedText
                        style={[styles.selectionCount, isTablet && { fontSize: fontSize(16) }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {selectedTables.length === 1
                            ? i18n.t('challenge_setup.tables_selected', { count: selectedTables.length })
                            : i18n.t('challenge_setup.tables_selected_plural', { count: selectedTables.length })}
                    </ThemedText>
                </View>

                {/* Action buttons */}
                <View style={[
                    styles.actionButtonsContainer,
                    {
                        paddingBottom: spacing(20),
                        gap: spacing(12),
                        maxWidth: containerMaxWidth,
                        alignSelf: 'center',
                        width: '100%',
                    }
                ]}>
                    <View style={[styles.topButtonsRow, { gap: spacing(12) }]}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={selectAll}
                            activeOpacity={0.7}
                            testID="select-all-button"
                        >
                            <CheckCircle size={20} color={AppColors.primary} />
                            <ThemedText style={styles.secondaryButtonText}>
                                {i18n.t('challenge_setup.select_all')}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={resetToSmartSelection}
                            activeOpacity={0.7}
                            testID="my-level-button"
                        >
                            <RotateCcw size={20} color={AppColors.primary} />
                            <ThemedText style={styles.secondaryButtonText}>
                                {i18n.t('challenge_setup.my_level')}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            !canStart && styles.startButtonDisabled,
                        ]}
                        onPress={startChallenge}
                        activeOpacity={canStart ? 0.8 : 1}
                        disabled={!canStart}
                        testID="start-challenge-button"
                    >
                        <ThemedText
                            style={[
                                styles.startButtonText,
                                !canStart && styles.startButtonTextDisabled,
                                isTablet && { fontSize: fontSize(20) },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {i18n.t('challenge_setup.start')}
                        </ThemedText>
                        <Rocket
                            size={24}
                            color={canStart ? '#FFFFFF' : AppColors.textSecondary}
                        />
                    </TouchableOpacity>

                    {!canStart && (
                        <ThemedText style={styles.warningText}>
                            {i18n.t('challenge_setup.no_table_warning')}
                        </ThemedText>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    homeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AppColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: AppColors.textSecondary,
        marginTop: 2,
    },
    gridContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 400,
        gap: 12,
    },
    tableButtonWrapper: {
        width: '18%', // Responsive: ~5 items per row with gaps
        aspectRatio: 1,
        minWidth: 55,
        maxWidth: 75,
    },
    tableButton: {
        flex: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        paddingBottom: 18, // Space for absolutely positioned stars
    },
    tableButtonInactive: {
        backgroundColor: AppColors.surface,
        borderColor: AppColors.border,
        opacity: 0.7,
    },
    tableNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    tableNumberActive: {
        color: '#FFFFFF',
    },
    starsContainer: {
        position: 'absolute',
        bottom: 4,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 1,
    },
    checkBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: AppColors.success,
        borderRadius: 10,
        padding: 2,
    },
    selectionInfo: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    selectionCount: {
        fontSize: 16,
        color: AppColors.textSecondary,
        fontWeight: '600',
    },
    actionButtonsContainer: {
        paddingBottom: 20,
        gap: 12,
    },
    topButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppColors.surface,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        borderWidth: 1.5,
        borderColor: AppColors.primary,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.primary,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppColors.success,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
        shadowColor: AppColors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startButtonDisabled: {
        backgroundColor: AppColors.border,
        shadowOpacity: 0,
        elevation: 0,
    },
    startButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    startButtonTextDisabled: {
        color: AppColors.textSecondary,
    },
    warningText: {
        textAlign: 'center',
        fontSize: 13,
        color: AppColors.error,
        marginTop: 4,
    },
});
