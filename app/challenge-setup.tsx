import { useRouter } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, CheckCircle, RotateCcw, Rocket, Star } from 'lucide-react-native';
import { AppColors, NumberColors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useApp } from '@/contexts/AppContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive } from '@/hooks/useResponsive';
import { ThemedText } from '@/components/ThemedText';
import { getAvatarIcon } from '@/constants/avatars';
import i18n from '@/utils/i18n';

export default function ChallengeSetupScreen() {
    const router = useRouter();
    const { progress, currentUser, settings } = useApp();
    const colors = useThemeColors();
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

    // Select all tables (Badge Intrépide is now earned when COMPLETING a challenge with 10 tables)
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

    // Ripple Animation for Start Button
    const rippleScale = useRef(new Animated.Value(0)).current;
    const rippleOpacity = useRef(new Animated.Value(0)).current;

    const performRippleAndStart = useCallback(() => {
        if (selectedTables.length === 0) return;

        // Reset
        rippleScale.setValue(0);
        rippleOpacity.setValue(0.5);

        // Animate
        Animated.parallel([
            Animated.timing(rippleScale, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            startChallenge();
        });
    }, [selectedTables, startChallenge, rippleScale, rippleOpacity]);

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

    // Get theme-specific greeting
    const getThemeGreeting = useCallback(() => {
        if (!currentUser) return '';
        const badgeTheme = currentUser.badgeTheme || settings.badgeTheme || 'space';
        const name = currentUser.firstName || '';

        switch (badgeTheme) {
            case 'space':
                return i18n.t('challenge_setup.greeting_space', { name });
            case 'heroes':
                return i18n.t('challenge_setup.greeting_heroes', { name });
            case 'animals':
                return i18n.t('challenge_setup.greeting_animals', { name });
            default:
                return i18n.t('challenge_setup.greeting', { name });
        }
    }, [currentUser, settings.badgeTheme]);

    // Get avatar display - supports photos and emojis
    const renderAvatar = useCallback(() => {
        if (!currentUser) return null;

        // Priority: photoUri > avatarId > gender fallback
        if (currentUser.photoUri) {
            return (
                <Image
                    source={{ uri: currentUser.photoUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                />
            );
        } else if (currentUser.avatarId) {
            return <ThemedText style={styles.avatarEmoji}>{getAvatarIcon(currentUser.avatarId)}</ThemedText>;
        } else {
            // Fallback to gender-based emoji
            return <ThemedText style={styles.avatarEmoji}>{currentUser.gender === 'boy' ? '👦' : '👧'}</ThemedText>;
        }
    }, [currentUser]);

    return (
        <View style={[styles.backgroundContainer, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.homeButton, { backgroundColor: colors.surface }]}
                        onPress={() => router.back()}
                        testID="back-button"
                    >
                        <Home size={26} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrapper}>
                        <ThemedText
                            style={[styles.headerTitle, isTablet && { fontSize: fontSize(32) }, { color: colors.text }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {i18n.t('challenge_setup.title')}
                        </ThemedText>
                    </View>

                    {/* Spacer to balance header */}
                    <View style={{ width: 44 }} />
                </View>

                {/* Personalization Section - Only show if user is logged in */}
                {currentUser && (
                    <View style={styles.personalizationSection}>
                        <View style={styles.avatarContainer}>
                            {renderAvatar()}
                        </View>
                        <ThemedText style={[styles.greetingText, { color: colors.text }]}>
                            {getThemeGreeting()}
                        </ThemedText>
                    </View>
                )}

                <ThemedText style={[styles.explanatoryText, { color: colors.textSecondary }]}>
                    {i18n.t('challenge_setup.explanation_sub')}
                </ThemedText>

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
                                                : [styles.tableButtonInactive, { backgroundColor: colors.surface, borderColor: colors.border }],
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
                            <CheckCircle size={20} color={colors.primary} />
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
                            <RotateCcw size={20} color={colors.primary} />
                            <ThemedText style={styles.secondaryButtonText}>
                                {i18n.t('challenge_setup.my_level')}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            !canStart && styles.startButtonDisabled,
                            { overflow: 'hidden', position: 'relative' } // Needed for ripple
                        ]}
                        onPress={performRippleAndStart}
                        activeOpacity={canStart ? 0.9 : 1}
                        disabled={!canStart}
                        testID="start-challenge-button"
                    >
                        {/* Ripple Effect Layer */}
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: rippleOpacity,
                                transform: [{
                                    scale: rippleScale.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.1, 4] // Expand to cover button
                                    })
                                }]
                            }}
                        >
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                        </Animated.View>

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
                            color={canStart ? '#FFFFFF' : colors.textSecondary}
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
    headerTitleWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    personalizationSection: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: AppColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: AppColors.primary,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },
    avatarEmoji: {
        fontSize: 36,
    },
    greetingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.text,
        marginTop: 10,
        textAlign: 'center',
    },
    explanatoryText: {
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
        paddingHorizontal: 20,
        fontStyle: 'italic',
    },
});
