import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export async function speak(text: string, gender: 'male' | 'female' = 'female', callbacks?: { onDone?: () => void; onStopped?: () => void }) {
  // Always stop before speaking to prevent overlap and ensure zero latency feeling
  // or simply because user might tap quickly "Replay"
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    // Default options for natural, pedagogical voice
    const options: Speech.SpeechOptions = {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.9, // Slightly slower for clarity (kids/dyslexia)
      onDone: callbacks?.onDone,
      onStopped: callbacks?.onStopped,
    };

    // Voice Selection Logic
    if (Platform.OS !== 'web') {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const frenchVoices = voices.filter(v => v.language.includes('fr-FR') || v.language.includes('fr_FR'));

        if (frenchVoices.length > 0) {
          let selectedVoice = null;

          // Heuristics for Male/Female names
          const maleNames = ['Thomas', 'Martin', 'Daniel', 'Nicolas', 'Arthur', 'Paul', 'Louis', 'Fred'];
          const femaleNames = ['Marie', 'Audrey', 'Aurélie', 'Aurelie', 'Sara', 'Céline', 'Celine', 'Alice', 'Amelie', 'Amélie', 'Sophie'];

          if (gender === 'male') {
            selectedVoice = frenchVoices.find(v => maleNames.some(name => v.name.includes(name)));
            if (!selectedVoice) {
              // Fallback to any voice that doesn't sound explicitly female if possible, 
              // or just picking a known male identifier if available on the system
              selectedVoice = frenchVoices.find(v => v.name.includes('Siri') && v.name.includes('Voice 2')); // iOS often Male
            }
          } else {
            selectedVoice = frenchVoices.find(v => femaleNames.some(name => v.name.includes(name)));
            if (!selectedVoice) {
              selectedVoice = frenchVoices.find(v => v.name.includes('Siri') && v.name.includes('Voice 1')); // iOS often Female
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
      // We can try to pick a better voice on Web if desired, but expo-speech
      // selects the default OS voice usually.
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
