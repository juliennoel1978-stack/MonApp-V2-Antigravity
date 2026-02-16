import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import OnboardingWelcome from '@/components/OnboardingWelcome';
import OnboardingProfile from '@/components/OnboardingProfile';
import { AppColors } from '@/constants/colors';
import { useApp, DEFAULT_SETTINGS } from '@/contexts/AppContext';
import { ThemedText } from '@/components/ThemedText';
import type { BadgeTheme } from '@/types';
import i18n from '@/utils/i18n';

interface ProfileData {
    firstName: string;
    age: number;
    gender: 'boy' | 'girl';
    avatarId: string;
    badgeTheme: BadgeTheme;
}

export default function OnboardingScreen() {
    const router = useRouter();
    const { addUser, selectUser, clearCurrentUser, setOnboardingCompleted, setHasSelectedAnonymousMode, updateSettings, resetProgress } = useApp();
    const [step, setStep] = useState<1 | 2>(1);
    const [showConfetti, setShowConfetti] = useState(false);
    const [createdName, setCreatedName] = useState('');
    const confettiRef = useRef<ConfettiCannon>(null);
    const celebrationOpacity = useRef(new Animated.Value(0)).current;
    const celebrationScale = useRef(new Animated.Value(0.5)).current;

    const handleCreateProfile = () => {
        setStep(2);
    };

    const handlePlayDirectly = async () => {
        // Mode anonyme - pas de profil créé
        await clearCurrentUser();
        // Reset settings to defaults ensuring clean state (e.g. standard font)
        updateSettings(DEFAULT_SETTINGS);
        // Reset progress to ensure a blank slate for new guest session
        await resetProgress();
        await setHasSelectedAnonymousMode(true); // Prevent user modal from showing
        await setOnboardingCompleted(true);
        router.replace('/');
    };

    const handleFinishProfile = async (profileData: ProfileData) => {
        try {
            setCreatedName(profileData.firstName);

            // Déclenche les confettis et l'animation de célébration
            setShowConfetti(true);

            // Animation d'entrée du message de célébration
            Animated.parallel([
                Animated.timing(celebrationOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(celebrationScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Démarre les confettis après un court délai
            setTimeout(() => {
                confettiRef.current?.start();
            }, 100);

            // Crée le profil
            const newUser = await addUser({
                firstName: profileData.firstName,
                gender: profileData.gender,
                age: profileData.age,
                grade: '', // Optionnel à l'onboarding
                avatarId: profileData.avatarId,
                badgeTheme: profileData.badgeTheme,
                // Valeurs par défaut
                voiceEnabled: true,
                voiceGender: 'female',
                soundEnabled: true,
                hapticsEnabled: true,
                fontPreference: 'standard',
                zenMode: false,
            });

            await selectUser(newUser.id);
            await setOnboardingCompleted(true);

            // Plus longue pause pour profiter des confettis
            setTimeout(() => {
                router.replace('/');
            }, 3500);
        } catch (error) {
            console.error('Error creating profile:', error);
            router.replace('/');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                {step === 1 ? (
                    <OnboardingWelcome
                        onCreateProfile={handleCreateProfile}
                        onPlayDirectly={handlePlayDirectly}
                    />
                ) : (
                    !showConfetti && <OnboardingProfile onFinish={handleFinishProfile} />
                )}

                {/* Message de célébration */}
                {showConfetti && (
                    <Animated.View
                        style={[
                            styles.celebrationContainer,
                            {
                                opacity: celebrationOpacity,
                                transform: [{ scale: celebrationScale }],
                            }
                        ]}
                    >
                        <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
                        <ThemedText style={styles.celebrationTitle}>
                            {i18n.t('onboarding.welcome_name', { name: createdName })}
                        </ThemedText>
                        <ThemedText style={styles.celebrationSubtitle}>
                            {i18n.t('onboarding.profile_created')}
                        </ThemedText>
                    </Animated.View>
                )}
            </View>

            {/* Animation de confettis améliorée */}
            {showConfetti && (
                <ConfettiCannon
                    ref={confettiRef}
                    count={300}
                    origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
                    autoStart={false}
                    fadeOut={true}
                    explosionSpeed={400}
                    fallSpeed={4000}
                    colors={['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9FF3', '#54A0FF']}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    celebrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    celebrationEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    celebrationTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    celebrationSubtitle: {
        fontSize: 18,
        color: AppColors.textSecondary,
        textAlign: 'center',
    },
});
