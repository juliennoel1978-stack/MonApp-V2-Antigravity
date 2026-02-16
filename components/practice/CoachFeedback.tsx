// components/practice/CoachFeedback.tsx
import React, { useState, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppColors } from '@/constants/colors';

const COACH_THEMES = {
    animals: '🐒',
    space: '👽',
    heroes: '🤖',
};

interface CoachFeedbackProps {
    visible: boolean;
    theme: string;
    gender?: 'boy' | 'girl';
    isZenMode?: boolean;
    message: string;
}

export const CoachFeedback: React.FC<CoachFeedbackProps> = ({
    visible,
    theme,
    gender,
    isZenMode,
    message,
}) => {
    const [scaleAnim] = useState(new Animated.Value(0));
    const [opacityAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            if (isZenMode) {
                // Zen Mode: Simple Fade In, no movement
                scaleAnim.setValue(1); // Immediate scale
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else {
                // Normal Mode: Spring + Move + Fade
                Animated.parallel([
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        } else {
            if (!isZenMode) scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible, isZenMode, scaleAnim, opacityAnim]);

    if (!visible) return null;

    const coachEmoji = COACH_THEMES[theme as keyof typeof COACH_THEMES] || '🐒';
    const celebrationEmojis = ['🎉', '🌟', '🔥', '🚀', '👏', '💪'];
    const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];

    return (
        <View style={styles.coachContainer} pointerEvents="none">
            <Animated.View
                style={[
                    styles.coachBubble,
                    {
                        opacity: opacityAnim,
                        // In Zen Mode, we remove the translateY movement and purely rely on static positioning
                        transform: isZenMode
                            ? []
                            : [{ scale: scaleAnim }, { translateY: -20 }],
                    },
                ]}
            >
                <ThemedText style={styles.coachMessage}>
                    {message}
                    {!isZenMode && randomEmoji}
                </ThemedText>
                <View style={styles.coachBubbleArrow} />
            </Animated.View>
            {!isZenMode && <ThemedText style={styles.coachEmoji}>{coachEmoji}</ThemedText>}
        </View>
    );
};

const styles = StyleSheet.create({
    coachContainer: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 50,
    },
    coachBubble: {
        backgroundColor: AppColors.surface,
        borderRadius: 16,
        padding: 12,
        maxWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 8,
    },
    coachMessage: {
        fontSize: 16,
        color: AppColors.text,
        textAlign: 'center',
    },
    coachBubbleArrow: {
        position: 'absolute',
        bottom: -8,
        right: 24,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: AppColors.surface,
    },
    coachEmoji: {
        fontSize: 48,
    },
});
