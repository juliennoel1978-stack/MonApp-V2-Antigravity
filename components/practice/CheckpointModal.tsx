// components/practice/CheckpointModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';

const CHECKPOINT_THEMES = {
    animals: {
        image: '🐒',
        item: '🍌',
        title: 'practice.checkpoints.animals.title',
        subtitle: 'practice.checkpoints.animals.subtitle'
    },
    space: {
        image: '👽',
        item: '💎',
        title: 'practice.checkpoints.space.title',
        subtitle: 'practice.checkpoints.space.subtitle'
    },
    heroes: {
        image: '🤖',
        item: '🔋',
        title: 'practice.checkpoints.heroes.title',
        subtitle: 'practice.checkpoints.heroes.subtitle'
    },
};

interface CheckpointModalProps {
    visible: boolean;
    theme: string;
    isZenMode?: boolean;
    onClose: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
    visible,
    theme,
    isZenMode,
    onClose,
}) => {
    const [scaleAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            if (isZenMode) {
                // Zen Mode: Simple Fade
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else {
                // Normal Mode: Bounce
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 5,
                    useNativeDriver: true,
                }).start();
            }

            // Auto close after 2.5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 2500);
            return () => clearTimeout(timer);
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible, isZenMode, onClose, scaleAnim]);

    if (!visible) return null;

    const data = CHECKPOINT_THEMES[theme as keyof typeof CHECKPOINT_THEMES] || CHECKPOINT_THEMES.animals;

    return (
        <View style={styles.checkpointOverlay}>
            <Animated.View style={[styles.checkpointCard, { transform: [{ scale: scaleAnim }] }]}>
                <ThemedText style={styles.checkpointTitle}>{i18n.t(data.title)}</ThemedText>
                <View style={styles.checkpointImageContainer}>
                    <ThemedText style={styles.checkpointEmojiMain}>{data.image}</ThemedText>
                    <ThemedText style={styles.checkpointEmojiItem}>{data.item}</ThemedText>
                </View>
                <ThemedText style={styles.checkpointSubtitle}>{i18n.t(data.subtitle)}</ThemedText>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    checkpointOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    checkpointCard: {
        backgroundColor: AppColors.surface,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    checkpointTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    checkpointImageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkpointEmojiMain: {
        fontSize: 80,
        marginRight: 8,
    },
    checkpointEmojiItem: {
        fontSize: 48,
    },
    checkpointSubtitle: {
        fontSize: 18,
        color: AppColors.textSecondary,
        textAlign: 'center',
    },
});
