import { useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { playSuccessSound as playSoundAsset, SoundVariant } from '@/utils/soundPlayer';
import { speak as speakTextUtil, stop as stopSpeechUtil } from '@/utils/speech';

export const useAudio = () => {
    const { settings, currentUser } = useApp();

    // Logic: User preference overrides global setting.
    // If user preference is undefined, fallback to global setting.
    const isVoiceEnabled = currentUser?.voiceEnabled ?? settings.voiceEnabled ?? true;
    const voiceGender = currentUser?.voiceGender ?? settings.voiceGender ?? 'female';
    const isSoundEnabled = currentUser?.soundEnabled ?? settings.soundEnabled ?? true;

    const playSound = useCallback(async (variant: SoundVariant = 'default') => {
        if (isSoundEnabled) {
            await playSoundAsset(variant);
        }
    }, [isSoundEnabled]);

    // Son d'erreur doux - cohérence globale (Entraînement + Challenge)
    const playErrorSound = useCallback(async () => {
        if (isSoundEnabled) {
            await playSoundAsset('error');
        }
    }, [isSoundEnabled]);

    const speak = useCallback(async (text: string, callbacks?: { onDone?: () => void; onStopped?: () => void }) => {
        if (isVoiceEnabled) {
            await speakTextUtil(text, voiceGender, callbacks);
        }
    }, [isVoiceEnabled, voiceGender]);

    const stopSpeech = useCallback(async () => {
        await stopSpeechUtil();
    }, []);

    return {
        isVoiceEnabled,
        isSoundEnabled,
        playSound,
        playErrorSound,
        speak,
        stopSpeech
    };
};
