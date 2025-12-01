import { Platform } from 'react-native';
import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export async function speak(text: string) {
  await stop(); // Stop any current speech

  if (Platform.OS === 'web') {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8; // Match the rate in Discovery
    window.speechSynthesis.speak(utterance);
  } else {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Using Google Translate TTS as used in Discovery screen for consistency
      const uri = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(text)}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          if (currentSound === sound) {
            currentSound = null;
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
}

export async function stop() {
  if (Platform.OS === 'web') {
    window.speechSynthesis.cancel();
  } else {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
        console.log('Error stopping sound', e);
      }
      currentSound = null;
    }
  }
}
