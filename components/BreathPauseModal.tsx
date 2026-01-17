import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';

const { width } = Dimensions.get('window');

// Theme content configuration
const THEME_CONTENT = {
    animals: {
        emoji: '🦥',
        inhaleKey: 'pause.animals_inhale',
        exhaleKey: 'pause.animals_exhale',
        encouragementKey: 'pause.animals_encouragement',
        gradient: ['#8BC34A', '#4CAF50'],
    },
    heroes: {
        emoji: '🧘',
        inhaleKey: 'pause.heroes_inhale',
        exhaleKey: 'pause.heroes_exhale',
        encouragementKey: 'pause.heroes_encouragement',
        gradient: ['#FF5722', '#E91E63'],
    },
    space: {
        emoji: '👩‍🚀',
        inhaleKey: 'pause.space_inhale',
        exhaleKey: 'pause.space_exhale',
        encouragementKey: 'pause.space_encouragement',
        gradient: ['#3F51B5', '#673AB7'],
    },
};

interface BreathPauseModalProps {
    visible: boolean;
    theme: 'animals' | 'space' | 'heroes';
    onResume: () => void;
}

const BREATH_DURATION = 5000; // 5 seconds for each phase

export const BreathPauseModal = ({ visible, theme, onResume }: BreathPauseModalProps) => {
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [isInhaling, setIsInhaling] = useState(true);
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    const themeContent = THEME_CONTENT[theme] || THEME_CONTENT.space;

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Start breathing cycle
            const runBreathingCycle = () => {
                // Inhale phase
                setIsInhaling(true);
                const inhaleAnim = Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: BREATH_DURATION,
                    useNativeDriver: true,
                });

                inhaleAnim.start(({ finished }) => {
                    if (finished) {
                        // Exhale phase
                        setIsInhaling(false);
                        const exhaleAnim = Animated.timing(scaleAnim, {
                            toValue: 0.6,
                            duration: BREATH_DURATION,
                            useNativeDriver: true,
                        });

                        exhaleAnim.start(({ finished: exhaleFinished }) => {
                            if (exhaleFinished) {
                                runBreathingCycle(); // Loop
                            }
                        });

                        animationRef.current = exhaleAnim;
                    }
                });

                animationRef.current = inhaleAnim;
            };

            runBreathingCycle();

            return () => {
                if (animationRef.current) {
                    animationRef.current.stop();
                }
            };
        } else {
            // Reset
            scaleAnim.setValue(0.6);
            opacityAnim.setValue(0);
            setIsInhaling(true);
        }
    }, [visible, scaleAnim, opacityAnim]);

    if (!visible) return null;

    const currentMessage = isInhaling
        ? i18n.t(themeContent.inhaleKey)
        : i18n.t(themeContent.exhaleKey);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
                {/* Title */}
                <ThemedText style={styles.title}>{i18n.t('pause.title')}</ThemedText>

                {/* Breathing Circle with Emoji */}
                <View style={styles.circleContainer}>
                    <Animated.View
                        style={[
                            styles.breathingCircle,
                            {
                                transform: [{ scale: scaleAnim }],
                                backgroundColor: themeContent.gradient[0],
                            },
                        ]}
                    >
                        <ThemedText style={styles.emoji}>{themeContent.emoji}</ThemedText>
                    </Animated.View>
                </View>

                {/* Breathing Instruction */}
                <ThemedText style={styles.instruction}>{currentMessage}</ThemedText>

                {/* Encouragement */}
                <ThemedText style={styles.encouragement}>
                    {i18n.t(themeContent.encouragementKey)}
                </ThemedText>

                {/* Resume Button */}
                <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={onResume}
                    activeOpacity={0.8}
                >
                    <ThemedText style={styles.resumeButtonText}>
                        {i18n.t('pause.ready_button')}
                    </ThemedText>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 40,
        textAlign: 'center',
    },
    circleContainer: {
        width: width * 0.6,
        height: width * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    breathingCircle: {
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    emoji: {
        fontSize: 80,
    },
    instruction: {
        fontSize: 24,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        minHeight: 60,
    },
    encouragement: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    resumeButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    resumeButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
