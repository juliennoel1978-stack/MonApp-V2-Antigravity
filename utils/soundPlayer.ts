import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Sound Assets
const SOUNDS = {
    default: require('../assets/sounds/ding.mp3'),
    magic: require('../assets/sounds/magic.mp3'),
    boost: require('../assets/sounds/boost.mp3'),
    challenge: require('../assets/sounds/challenge_success.mp3'),
    finish: require('../assets/sounds/challenge_finish.mp3'),
    mastery: require('../assets/sounds/mastery.mp3'),
    checkpoint: require('../assets/sounds/game-character-140506.mp3'),
};

export const playSuccessSound = async (variant: 'default' | 'magic' | 'boost' | 'challenge' | 'finish' | 'mastery' | 'checkpoint' = 'default') => {
    if (Platform.OS === 'web') {
        // ... (Web implementation remains minimal/unchanged for now or can be expanded later)
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            // Simple beep for web fallback for now
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = variant === 'magic' ? 'triangle' : 'sine'; // Slight difference for web
            osc.frequency.setValueAtTime(variant === 'magic' ? 600 : 523.25, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio error", e);
        }
    } else {
        try {
            // Haptic Feedback
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Play Sound from Asset (Bundled)
            const soundAsset = SOUNDS[variant] || SOUNDS.default;
            const { sound } = await Audio.Sound.createAsync(
                soundAsset,
                { shouldPlay: true }
            );

            // Cleanup
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.error("Native Sound Error", error);
        }
    }
};
