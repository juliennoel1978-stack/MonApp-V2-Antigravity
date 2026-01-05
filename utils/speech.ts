import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import i18n from '@/utils/i18n';

export async function speak(text: string, gender: 'male' | 'female' = 'female', callbacks?: { onDone?: () => void; onStopped?: () => void }) {
  // Always stop before speaking to prevent overlap and ensure zero latency feeling
  // or simply because user might tap quickly "Replay"
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    const currentLocale = i18n.locale;
    const isFrench = currentLocale.startsWith('fr');
    // Default language based on i18n context (simplifying to fr or en for now)
    const language = isFrench ? 'fr-FR' : 'en-US';

    // Default options for natural, pedagogical voice
    const options: Speech.SpeechOptions = {
      language: language,
      pitch: 1.0,
      rate: 0.9, // Slightly slower for clarity (kids/dyslexia)
      onDone: callbacks?.onDone,
      onStopped: callbacks?.onStopped,
    };

    // Voice Selection Logic
    if (Platform.OS !== 'web') {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        // Filter voices by currently active language (loose match on the first part 'fr' or 'en')
        const targetLangPrefix = currentLocale.split('-')[0];
        const availableVoices = voices.filter(v => v.language.startsWith(targetLangPrefix));

        if (availableVoices.length > 0) {
          let selectedVoice = null;
          let maleNames: string[] = [];
          let femaleNames: string[] = [];
          let maleSiriName = '';
          let femaleSiriName = '';

          if (isFrench) {
            maleNames = ['Thomas', 'Martin', 'Daniel', 'Nicolas', 'Arthur', 'Paul', 'Louis', 'Fred'];
            femaleNames = ['Marie', 'Audrey', 'Aurélie', 'Aurelie', 'Sara', 'Céline', 'Celine', 'Alice', 'Amelie', 'Amélie', 'Sophie'];
            maleSiriName = 'Voice 2';
            femaleSiriName = 'Voice 1';
          } else {
            // English Names Heuristics
            maleNames = ['Daniel', 'Arthur', 'Fred', 'Aaron', 'Grandpa', 'Rocko', 'Shelley', 'Flo', 'Eddy', 'Reed'];
            femaleNames = ['Samantha', 'Karen', 'Tessa', 'Moira', 'Rishi', 'Google US English', 'Sandy', 'Grandma', 'Shelley'];
            // iOS Siri voices vary, but often vaguely named. defaulting to heuristics or just first available.
            maleSiriName = 'Voice 2'; // Not reliable everywhere, but fallback
            femaleSiriName = 'Voice 1';
          }

          if (gender === 'male') {
            selectedVoice = availableVoices.find(v => maleNames.some(name => v.name.includes(name)));
            if (!selectedVoice) {
              // Fallback
              selectedVoice = availableVoices.find(v => v.name.includes('Siri') && v.name.includes(maleSiriName));
            }
          } else {
            selectedVoice = availableVoices.find(v => femaleNames.some(name => v.name.includes(name)));
            if (!selectedVoice) {
              // Fallback
              selectedVoice = availableVoices.find(v => v.name.includes('Siri') && v.name.includes(femaleSiriName));
            }
          }

          // If we found a specific preferred voice, use it
          if (selectedVoice) {
            options.voice = selectedVoice.identifier;
          } else if (gender === 'male') {
            // Last ditch effort if we wanted male but didn't find known male name: 
            // try to change pitch slightly deeper if we can't change voice? 
            // expo-speech pitch 1.0 is normal. 0.8 is deeper.
            options.pitch = 0.85;
          }
        }
      } catch (e) {
        // Ignore voice selection error
      }
    }

    // Web-specific tweaks if needed (SpeechSynthesis behaves differently with rate)
    if (Platform.OS === 'web') {
      // On some browsers, 0.9 might be too slow or fast depending on the implementation
      // standard is 1.0. 0.9 is safe.
    }

    Speech.speak(text, options);

  } catch (error) {
    console.error('Error in speech utility:', error);
  }
}

export async function stop() {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
}
