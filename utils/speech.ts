import { Platform } from 'react-native';
import { Audio as ExpoAudio } from 'expo-av';

let currentSound: ExpoAudio.Sound | null = null;

export async function speak(text: string) {
  // Stop any current speech
  await stop();

  if (Platform.OS === 'web') {
    // Web: Use SpeechSynthesis with careful voice selection
    const textToSpeak = new SpeechSynthesisUtterance(text);

    // Robust voice loading
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Force load attempt for Chrome
      window.speechSynthesis.cancel();
      voices = window.speechSynthesis.getVoices();
    }

    // Try to find the best possible French voice
    const bestVoice =
      voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google')) || // Best on Chrome
      voices.find(v => v.lang.startsWith('fr') && v.name.includes('Thomas')) || // Good on Mac
      voices.find(v => v.lang.startsWith('fr') && v.name.includes('Audrey')) || // Good on Mac
      voices.find(v => v.lang.startsWith('fr') && v.name.includes('Premium')) || // Apple Premium
      voices.find(v => v.lang.startsWith('fr')); // Fallback

    if (bestVoice) {
      // @ts-ignore
      textToSpeak.voice = bestVoice;
      // @ts-ignore
      textToSpeak.lang = bestVoice.lang;
      console.log('Selected voice:', bestVoice.name);
    } else {
      // @ts-ignore
      textToSpeak.lang = 'fr-FR';
    }

    // Adjust rate and pitch for more natural sound
    // @ts-ignore
    textToSpeak.rate = 0.9; // Slightly slower is often more natural/authoritative
    // @ts-ignore
    textToSpeak.pitch = 1.0;

    // @ts-ignore
    window.speechSynthesis.speak(textToSpeak);
  } else {
    // Native: Use expo-av
    try {
      await ExpoAudio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Use Google Translate TTS for a smoother, more natural voice on ALL platforms (including Web)
      // This bypasses the robotic system voices.
      const uri = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(text)}`;

      const { sound } = await ExpoAudio.Sound.createAsync(
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
        console.log('Error stopping sound', e);
      }
      currentSound = null;
    }
  }
}
