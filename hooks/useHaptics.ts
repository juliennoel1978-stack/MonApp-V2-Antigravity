import { useCallback } from 'react';
import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';

export const useHaptics = () => {
    const { settings, currentUser } = useApp();

    const isHapticsEnabled = currentUser?.hapticsEnabled ?? settings.hapticsEnabled ?? true;

    // Helper for delays
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));



    const vibrate = useCallback(async (type: 'success' | 'error' | 'light' | 'heavy' | 'selection' | 'impact') => {
        if (!isHapticsEnabled) return;

        // Helper to trigger a manual sequence of Core Vibrations (Works on iOS/Android)
        // This is the "Nuclear Option" when Haptics are too subtle.
        const triggerPattern = async (count: number, delayMs: number) => {
            for (let i = 0; i < count; i++) {
                Vibration.vibrate();
                if (i < count - 1) await wait(delayMs);
            }
        };

        switch (type) {
            case 'selection':
                // UI Click - Keep subtle
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;

            case 'light':
            case 'success':
                // Success: Short but heavy "Da-dump"
                if (Platform.OS === 'ios') {
                    // iOS: Mix Notification + Heavy Impact for maximum "sharpness"
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await wait(100);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } else {
                    Vibration.vibrate([0, 50, 50, 50]);
                }
                break;

            case 'error':
                // Error: SLOW HEAVY THUDS (The "Intimidating" pattern)
                // We use triggerPattern to force repeated motor activation on iOS
                await triggerPattern(2, 400); // BZZZZT (400ms) ... BZZZZT (400ms)
                break;

            case 'impact':
            case 'heavy':
                // Mastery: MACHINE GUN / FIREWORKS
                // A long distinct rumble
                await triggerPattern(4, 200); // BZZT.. BZZT.. BZZT.. BZZT
                break;
        }
    }, [isHapticsEnabled]);

    return {
        vibrate,
        isHapticsEnabled
    };
};
