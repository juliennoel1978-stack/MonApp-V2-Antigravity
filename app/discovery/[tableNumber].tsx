import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, ArrowRight, ArrowLeft, Volume2, X } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber } from '@/constants/tables';

const { width } = Dimensions.get('window');

export default function DiscoveryScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const [currentStep, setCurrentStep] = useState(0);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedMultiplication, setSelectedMultiplication] = useState<{ multiplier: number; result: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const modalSoundRef = useRef<Audio.Sound | null>(null);

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    animateIn();
  }, [currentStep, animateIn]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (modalSoundRef.current) {
        modalSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const speakMultiplication = async (tableNum: number, multiplier: number, result: number) => {
    const text = `${tableNum} fois ${multiplier} égale ${result}`;

    if (Platform.OS === 'web') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      try {
        if (modalSoundRef.current) {
          await modalSoundRef.current.unloadAsync();
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const uri = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(text)}`;

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          }
        );

        modalSoundRef.current = sound;
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleMultiplicationPress = useCallback((multiplier: number, result: number) => {
    setSelectedMultiplication({ multiplier, result });
    
    modalScaleAnim.setValue(0);
    Animated.spring(modalScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    if (table) {
      speakMultiplication(table.number, multiplier, result);
    }
  }, [table, modalScaleAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(modalScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedMultiplication(null);
    });

    if (modalSoundRef.current) {
      modalSoundRef.current.unloadAsync();
      modalSoundRef.current = null;
    }
  }, [modalScaleAnim]);

  const speakTable = async () => {
    if (!table) return;

    if (Platform.OS === 'web') {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      setIsPlayingAudio(true);
      const utterances: SpeechSynthesisUtterance[] = [];

      for (let i = 1; i <= 10; i++) {
        const result = table.number * i;
        const text = `${table.number} fois ${i} égale ${result}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.8;
        utterances.push(utterance);
      }

      for (let i = 0; i < utterances.length; i++) {
        await new Promise<void>((resolve) => {
          utterances[i].onend = () => resolve();
          window.speechSynthesis.speak(utterances[i]);
        });
      }

      setIsPlayingAudio(false);
    } else {
      if (isPlayingAudio) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setIsPlayingAudio(false);
        return;
      }

      setIsPlayingAudio(true);

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const speechTexts: string[] = [];
        for (let i = 1; i <= 10; i++) {
          const result = table.number * i;
          speechTexts.push(`${table.number} fois ${i} égale ${result}`);
        }

        const fullText = speechTexts.join('. ');
        const uri = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(fullText)}`;

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingAudio(false);
              sound.unloadAsync();
            }
          }
        );

        soundRef.current = sound;
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlayingAudio(false);
      }
    }
  };

  if (!table) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Table non trouvée</Text>
      </SafeAreaView>
    );
  }

  const tableColor =
    NumberColors[table.number as keyof typeof NumberColors];

  const steps = [
    {
      title: `Découvre la table de ${table.number}`,
      content: table.story,
      visual: (
        <View style={[styles.visualContainer, { backgroundColor: tableColor + '20' }]}>
          <Text style={[styles.bigNumber, { color: tableColor }]}>
            {table.number}
          </Text>
          <Text style={styles.visualText}>Table de {table.number}</Text>
        </View>
      ),
    },
    {
      title: 'Astuce magique',
      content: table.tip,
      visual: (
        <View style={styles.tipContainer}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>{table.tip}</Text>
        </View>
      ),
    },
    {
      title: 'Compte avec moi !',
      content: `Voici toute la table de ${table.number}`,
      visual: (
        <View style={styles.countingContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
            const result = table.number * i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.countingItem,
                  { backgroundColor: tableColor + '20' },
                ]}
                onPress={() => handleMultiplicationPress(i, result)}
                activeOpacity={0.7}
              >
                <Text style={[styles.countingNumber, { color: tableColor }]}>
                  {result}
                </Text>
                <Text style={styles.countingLabel}>
                  {table.number} × {i}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ),
    },
    {
      title: 'Prêt à pratiquer ?',
      content: 'Tu as découvert la table ! Maintenant, entraîne-toi avec des exercices amusants.',
      visual: (
        <View style={styles.readyContainer}>
          <Text style={styles.readyEmoji}>🎯</Text>
          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: tableColor }]}
            onPress={() => router.push(`/practice/${table.number}` as any)}
          >
            <Text style={styles.practiceButtonText}>Commencer l&apos;entraînement</Text>
            <ArrowRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleHomePress = () => {
    if (homeClickCount === 0) {
      setHomeClickCount(1);
      router.push('/tables');
      setTimeout(() => setHomeClickCount(0), 2000);
    } else {
      setHomeClickCount(0);
      router.push('/');
    }
  };

  return (
    <View style={styles.backgroundContainer}>
      <Modal
        visible={selectedMultiplication !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: tableColor + '15',
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <X size={28} color={AppColors.text} />
            </TouchableOpacity>
            
            {selectedMultiplication && table && (
              <View style={styles.modalInner}>
                <Text style={[styles.modalNumber, { color: tableColor }]}>
                  {selectedMultiplication.result}
                </Text>
                <Text style={[styles.modalEquation, { color: tableColor }]}>
                  {table.number} × {selectedMultiplication.multiplier} = {selectedMultiplication.result}
                </Text>
                <TouchableOpacity
                  style={[styles.repeatButton, { backgroundColor: tableColor }]}
                  onPress={() => speakMultiplication(table.number, selectedMultiplication.multiplier, selectedMultiplication.result)}
                >
                  <Volume2 size={24} color="#FFFFFF" />
                  <Text style={styles.repeatButtonText}>Réécouter</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHomePress}
            testID="back-button"
          >
            <Home size={24} color={AppColors.primary} />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStep ? tableColor : AppColors.borderLight,
                    width: index === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.audioButton,
              isPlayingAudio && styles.audioButtonActive,
            ]}
            onPress={currentStep === 2 ? speakTable : undefined}
            disabled={currentStep !== 2}
            testID="audio-button"
          >
            <Volume2
              size={24}
              color={currentStep === 2 ? (isPlayingAudio ? AppColors.primary : AppColors.text) : AppColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepContent}>{currentStepData.content}</Text>

            {currentStepData.visual}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => setCurrentStep(currentStep - 1)}
              testID="prev-button"
            >
              <ArrowLeft size={20} color={AppColors.text} />
              <Text style={styles.navButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}

          {currentStep < steps.length - 1 && (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                { backgroundColor: tableColor },
                currentStep === 0 && styles.nextButtonFull,
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              testID="next-button"
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: AppColors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonActive: {
    backgroundColor: AppColors.primary + '20',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepContent: {
    fontSize: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  visualContainer: {
    width: width - 80,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  bigNumber: {
    fontSize: 120,
    fontWeight: 'bold' as const,
    marginBottom: 16,
  },
  visualText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: AppColors.text,
  },
  tipContainer: {
    backgroundColor: AppColors.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: width - 80,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  tipText: {
    fontSize: 20,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  countingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 20,
    maxWidth: width - 48,
  },
  countingItem: {
    width: (width - 120) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  countingNumber: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  countingLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
  },
  readyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  readyEmoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  practiceButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  prevButton: {
    backgroundColor: AppColors.surfaceLight,
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: width - 60,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalInner: {
    alignItems: 'center',
    marginTop: 20,
  },
  modalNumber: {
    fontSize: 120,
    fontWeight: 'bold' as const,
    marginBottom: 24,
  },
  modalEquation: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    marginBottom: 32,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  repeatButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
});
