import React, { useCallback } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Delete } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from './ThemedText';
import * as Haptics from 'expo-haptics';
import i18n from '@/utils/i18n';

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
    color: string;
    isSubmitDisabled?: boolean;
}

// Animated key component with bounce effect
const AnimatedKey = ({
    children,
    onPress,
    style,
    hapticType = 'light',
    disabled = false,
    accessibilityLabel,
}: {
    children: React.ReactNode;
    onPress: () => void;
    style?: object;
    hapticType?: 'light' | 'medium' | 'success' | 'none';
    disabled?: boolean;
    accessibilityLabel?: string;
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withTiming(0.92, { duration: 50 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        // Spring bounce back with overshoot
        scale.value = withSpring(1, {
            damping: 10,
            stiffness: 400,
            mass: 0.5,
        });
    }, [scale]);

    const handlePress = useCallback(() => {
        if (disabled) return;

        // Differentiated haptics
        if (Platform.OS !== 'web') {
            switch (hapticType) {
                case 'light':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'success':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'none':
                default:
                    break;
            }
        }

        onPress();
    }, [disabled, hapticType, onPress]);

    return (
        <Pressable
            onPressIn={disabled ? undefined : handlePressIn}
            onPressOut={disabled ? undefined : handlePressOut}
            onPress={handlePress}
            disabled={disabled}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={{ flex: 1 }}
        >
            <Animated.View style={[styles.key, style, animatedStyle, disabled && styles.keyDisabled]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

export const Keypad = ({
    onKeyPress,
    onDelete,
    onSubmit,
    color,
    isSubmitDisabled = false
}: KeypadProps) => {
    const colors = useThemeColors();
    const isDark = colors.background !== AppColors.background;

    const renderNumberKey = useCallback((num: number) => (
        <AnimatedKey
            key={num}
            onPress={() => onKeyPress(num.toString())}
            hapticType="light"
            accessibilityLabel={`Chiffre ${num}`}
            style={isDark ? { backgroundColor: colors.surface, borderColor: colors.border } : undefined}
        >
            <ThemedText style={[styles.keyText, isDark && { color: colors.text }]}>{num}</ThemedText>
        </AnimatedKey>
    ), [onKeyPress]);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? colors.surface : '#F7F7F9', borderTopColor: colors.border }]}>
            {/* Row 1: 1, 2, 3 */}
            <View style={styles.row}>
                {[1, 2, 3].map(renderNumberKey)}
            </View>

            {/* Row 2: 4, 5, 6 */}
            <View style={styles.row}>
                {[4, 5, 6].map(renderNumberKey)}
            </View>

            {/* Row 3: 7, 8, 9 */}
            <View style={styles.row}>
                {[7, 8, 9].map(renderNumberKey)}
            </View>

            {/* Row 4: DELETE, 0, OK */}
            <View style={styles.row}>
                {/* Delete Button - Neutral gray with big icon */}
                <AnimatedKey
                    onPress={onDelete}
                    style={[styles.keyDelete, isDark && { backgroundColor: colors.border }]}
                    hapticType="medium"
                    accessibilityLabel={i18n.t('keypad.delete')}
                >
                    <Delete size={32} color={colors.text} strokeWidth={2.5} />
                </AnimatedKey>

                {/* Zero Key */}
                {renderNumberKey(0)}

                {/* Submit Button - Green/Primary when active, gray when disabled */}
                <AnimatedKey
                    onPress={onSubmit}
                    style={[
                        styles.keySubmit,
                        { backgroundColor: isSubmitDisabled ? (isDark ? colors.border : '#CCCCCC') : color },
                    ]}
                    hapticType={isSubmitDisabled ? 'none' : 'success'}
                    disabled={isSubmitDisabled}
                    accessibilityLabel={i18n.t('keypad.validate')}
                >
                    <ThemedText style={styles.keySubmitText}>OK</ThemedText>
                </AnimatedKey>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        gap: 12,
        backgroundColor: '#F7F7F9',
        borderTopWidth: 1,
        borderTopColor: AppColors.borderLight,
        width: '100%',
        maxWidth: 450, // iPad constraint - keeps keys centered, not stretched
        alignSelf: 'center', // Center on iPad
        paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Safe area padding
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        height: 72, // Increased from 60px for better accessibility
    },
    key: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Pure white for maximum contrast
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E8E8EC',
    },
    keyDisabled: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    keyDelete: {
        backgroundColor: '#E8E8EC', // Neutral gray - not red to avoid negative connotation
    },
    keySubmit: {
        // backgroundColor set dynamically via props
    },
    keyText: {
        fontSize: 32, // Slightly larger for visibility
        fontWeight: 'bold',
        color: '#2D3436', // Dark gray/black for maximum contrast
    },
    keySubmitText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
