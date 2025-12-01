import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, ArrowRight, ArrowLeft, Volume2, X, Check } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber } from '@/constants/tables';

const { width } = Dimensions.get('window');

function getTipExamples(tableNumber: number): string[] {
  switch (tableNumber) {
    case 1:
      return [
        '5 × 1 = 5',
        '9 × 1 = 9'
      ];
    case 2:
      return [
        '3 × 2 = 6 (3 + 3)',
        '5 × 2 = 10 (5 + 5)'
      ];
    case 3:
      return [
        '3 + 3 + 3 = 9',
        '6 + 6 = 12 (2 × 6)'
      ];
    case 4:
      return [
        '3 × 4 = 12 (double de 6)',
        '5 × 4 = 20 (double de 10)'
      ];
    case 5:
      return [
        '3 × 5 = 15 ✨',
        '6 × 5 = 30 ✨'
      ];
    case 6:
      return [
        '4 × 6 = 24 (20 + 4)',
        '7 × 6 = 42 (35 + 7)'
      ];
    case 7:
      return [
        '3 × 7 = 21 🎯',
        '5 × 7 = 35 🎯'
      ];
    case 8:
      return [
        '3 × 8 = 24 (double de 12)',
        '5 × 8 = 40 (double de 20)'
      ];
    case 9:
      return [
        '2 × 9 = 18 (2+8=10→1+8=9)',
        '5 × 9 = 45 (4+5=9)'
      ];
    case 10:
      return [
        '4 × 10 = 40 (4 + 0)',
        '7 × 10 = 70 (7 + 0)'
      ];
    default:
      return [
        `${tableNumber} × 2 = ${tableNumber * 2}`,
        `${tableNumber} × 5 = ${tableNumber * 5}`
      ];
  }
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const { tableNumber, step } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const [currentStep, setCurrentStep] = useState(step ? Number(step) : 0);
  const currentStepRef = useRef(0);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedMultiplication, setSelectedMultiplication] = useState<{ multiplier: number; result: number } | null>(null);
  const [clickedMultiplications, setClickedMultiplications] = useState<Set<number>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const modalSoundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only activate if horizontal swipe is dominant and significant
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderEnd: (_, gestureState) => {
        const step = currentStepRef.current;
        const totalSteps = 4;
        const swipeThreshold = 50;

        if (gestureState.dx > swipeThreshold && step > 0) {
          setCurrentStep(step - 1);
        } else if (gestureState.dx < -swipeThreshold && step < totalSteps - 1) {
          setCurrentStep(step + 1);
        }
      },
    })
  ).current;

  // Sync step from params when it changes
  useEffect(() => {
    if (step !== undefined) {
      setCurrentStep(Number(step));
    }
  }, [step]);


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
    currentStepRef.current = currentStep;
    animateIn();
  }, [currentStep, animateIn]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
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



  const handleMultiplicationPress = useCallback((multiplier: number, result: number) => {
    setSelectedMultiplication({ multiplier, result });
    setClickedMultiplications(prev => new Set(prev).add(multiplier));
    
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
        if (!isMounted.current) break;
        await new Promise<void>((resolve) => {
          utterances[i].onend = () => resolve();
          window.speechSynthesis.speak(utterances[i]);
        });
      }

      if (isMounted.current) {
        setIsPlayingAudio(false);
      }
    } else {
      if (isPlayingAudio) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        if (isMounted.current) {
          setIsPlayingAudio(false);
        }
        return;
      }

      if (isMounted.current) {
        setIsPlayingAudio(true);
      }

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
              if (isMounted.current) {
                setIsPlayingAudio(false);
              }
              sound.unloadAsync();
            }
          }
        );

        soundRef.current = sound;
      } catch (error) {
        console.error('Error playing audio:', error);
        if (isMounted.current) {
          setIsPlayingAudio(false);
        }
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
          <View style={styles.tipExamplesContainer}>
            {getTipExamples(table.number).map((example, idx) => (
              <View key={idx} style={[styles.tipExampleCard, { borderColor: tableColor }]}>
                <Text 
                  style={[styles.tipExampleText, { color: tableColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {example}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: 'Compte avec moi !',
      content: 'Clique sur les multiplications pour entendre comment elles se lisent !',
      visual: (
        <View style={styles.countingContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
            const result = table.number * i;
            const isClicked = clickedMultiplications.has(i);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.countingItem,
                  { 
                    backgroundColor: isClicked ? tableColor : tableColor + '20',
                    borderColor: isClicked ? tableColor : 'transparent',
                  },
                ]}
                onPress={() => handleMultiplicationPress(i, result)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[styles.countingNumber, { color: isClicked ? '#FFFFFF' : tableColor }]}
                >
                  {result}
                </Text>
                <Text 
                  style={[styles.countingLabel, { color: isClicked ? '#FFFFFF' : AppColors.textSecondary }]}
                >
                  {table.number} × {i}
                </Text>
                {isClicked && (
                  <View style={styles.checkmarkBadge}>
                    <Check size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ),
    },
    {
      title: 'C\'est parti !',
      content: 'Maintenant, teste tes connaissances avec le quiz !',
      visual: (
        <View style={styles.readyContainer}>
          <Text style={styles.readyEmoji}>🚀 🌟</Text>
          <Text style={styles.readyTitle}>C&apos;est parti !</Text>
          <Text style={styles.encouragementText}>Tu vas assurer comme un champion ! {"\n"} Prêt à gagner des étoiles ?</Text>
          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: tableColor }]}
            onPress={() => router.push(`/practice/${table.number}` as any)}
          >
            <Text style={styles.practiceButtonText}>Commencer le quiz</Text>
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

        <View
          style={{ flex: 1 }}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.content}>
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepContent}>{currentStepData.content}</Text>

              {currentStepData.visual}
            </View>
          </Animated.View>
        </View>

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
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingTop: 8,
  },
  stepContent: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  visualContainer: {
    width: width - 40,
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
    width: width - 40,
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
    marginBottom: 20,
  },
  tipExamplesContainer: {
    width: '100%',
    gap: 8,
  },
  tipExampleCard: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
  },
  tipExampleText: {
    fontSize: 16, // Reduced slightly to fit
    fontWeight: '700' as const,
    textAlign: 'center',
    width: '100%',
  },
  countingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  readyTitle: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  countingItem: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  countingNumber: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginBottom: 2,
  },
  countingLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
  },
  readyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  readyEmoji: {
    fontSize: 100,
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 20,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  checkmarkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phase2Content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  phase2Title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  phase2QuestionCard: {
    backgroundColor: AppColors.surface,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  answerInputContainer: {
    marginBottom: 12,
  },
  answerInput: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: AppColors.surface,
    minHeight: 70,
  },
  validateButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  validateButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  numpadContainer: {
    gap: 12,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numpadButton: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numpadText: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.success,
  },
  resultContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 40,
  },
  resultCard: {
    backgroundColor: AppColors.surface,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: width - 48,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  resultScore: {
    fontSize: 64,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 24,
    fontWeight: '600' as const,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  encouragement: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  intermediateText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  intermediateDescription: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  feedbackContainer: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  backToTablesButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backToTablesText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
});
