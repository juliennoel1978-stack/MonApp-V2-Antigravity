import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, ArrowRight, ArrowLeft, Volume2, X, Check, Star } from 'lucide-react-native';
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
import { useApp } from '@/contexts/AppContext';
import { generateQuestions } from '@/utils/questionGenerator';
import type { Question } from '@/types';

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
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedMultiplication, setSelectedMultiplication] = useState<{ multiplier: number; result: number } | null>(null);
  const [clickedMultiplications, setClickedMultiplications] = useState<Set<number>>(new Set());
  const [showPhase2, setShowPhase2] = useState(false);
  const [phase2Questions, setPhase2Questions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase2Complete, setPhase2Complete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const modalSoundRef = useRef<Audio.Sound | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMovedEnough = Math.abs(gestureState.dx) > 20;
        return isHorizontalSwipe && hasMovedEnough;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMovedEnough = Math.abs(gestureState.dx) > 20;
        return isHorizontalSwipe && hasMovedEnough;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: () => {},
      onPanResponderRelease: (_, gestureState) => {
        const totalSteps = 4;
        const swipeThreshold = 50;
        
        if (gestureState.dx > swipeThreshold && currentStep > 0) {
          setCurrentStep(currentStep - 1);
        } else if (gestureState.dx < -swipeThreshold && currentStep < totalSteps - 1) {
          setCurrentStep(currentStep + 1);
        }
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

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

  const startPhase2 = useCallback(() => {
    if (!table) return;
    const questions = generateQuestions(table.number, 10);
    setPhase2Questions(questions);
    setShowPhase2(true);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setUserAnswer('');
    setShowResult(null);
  }, [table]);

  const finishPhase2 = useCallback((lastCorrect: boolean) => {
    const finalCorrect = correctCount + (lastCorrect ? 1 : 0);
    const stars = finalCorrect === 10 ? 3 : 0;
    
    if (table) {
      updateTableProgress(table.number, finalCorrect, 10, stars);
      if (stars >= 3) {
        unlockBadge('perfect_score');
      }
    }

    setPhase2Complete(true);
  }, [correctCount, table, updateTableProgress, unlockBadge]);

  const handleMultiplicationPress = useCallback((multiplier: number, result: number) => {
    setSelectedMultiplication({ multiplier, result });
    const newSet = new Set(clickedMultiplications).add(multiplier);
    setClickedMultiplications(newSet);
    
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

    if (newSet.size === 10) {
      setTimeout(() => {
        closeModal();
        setTimeout(() => {
          startPhase2();
        }, 300);
      }, 1500);
    }
  }, [table, modalScaleAnim, clickedMultiplications, closeModal, startPhase2]);

  const handleNumberPress = useCallback((num: string) => {
    if (showResult !== null) return;
    setUserAnswer(prev => prev + num);
  }, [showResult]);

  const handleDeletePress = useCallback(() => {
    setUserAnswer(prev => prev.slice(0, -1));
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    if (userAnswer === '' || showResult !== null) return;
    
    const currentQuestion = phase2Questions[currentQuestionIndex];
    const correct = parseInt(userAnswer) === currentQuestion.correctAnswer;
    
    setShowResult(correct ? 'correct' : 'incorrect');
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < phase2Questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer('');
        setShowResult(null);
      } else {
        finishPhase2(correct);
      }
    }, 1500);
  }, [userAnswer, showResult, phase2Questions, currentQuestionIndex, finishPhase2]);

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
          <View style={styles.tipExamplesContainer}>
            {getTipExamples(table.number).map((example, idx) => (
              <View key={idx} style={[styles.tipExampleCard, { borderColor: tableColor }]}>
                <Text style={[styles.tipExampleText, { color: tableColor }]}>{example}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: 'Compte avec moi !',
      content: clickedMultiplications.size === 10 
        ? 'Correct ! Tu les connais toutes ! Passe à la suite.' 
        : `Clique sur toutes les multiplications (${clickedMultiplications.size}/10)`,
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
                  { backgroundColor: isClicked ? tableColor : tableColor + '20' },
                ]}
                onPress={() => handleMultiplicationPress(i, result)}
                activeOpacity={0.7}
              >
                <Text style={[styles.countingNumber, { color: isClicked ? '#FFFFFF' : tableColor }]}>
                  {result}
                </Text>
                <Text style={[styles.countingLabel, { color: isClicked ? '#FFFFFF' : AppColors.textSecondary }]}>
                  {table.number} × {i}
                </Text>
                {isClicked && (
                  <View style={styles.checkmarkBadge}>
                    <Check size={12} color="#FFFFFF" />
                  </View>
                )}
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

  if (phase2Complete) {
    const finalCorrect = correctCount;
    const stars = finalCorrect === 10 ? 3 : 0;

    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Félicitations !</Text>
            <Text style={styles.resultSubtitle}>Tu as terminé la découverte</Text>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <Text style={styles.resultScore}>
                {finalCorrect}/10
              </Text>
              <Text style={styles.resultLabel}>Bonnes réponses</Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3].map(starIndex => (
                  <Star
                    key={starIndex}
                    size={40}
                    color={starIndex <= stars ? AppColors.warning : AppColors.borderLight}
                    fill={starIndex <= stars ? AppColors.warning : 'transparent'}
                  />
                ))}
              </View>

              <Text style={styles.encouragement}>
                {stars === 3 ? 'Parfait ! Tu as obtenu 3 étoiles !' : 'Continue à t\'entraîner pour obtenir 3 étoiles !'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.practiceButton, { backgroundColor: tableColor }]}
              onPress={() => router.push(`/practice/${table.number}` as any)}
            >
              <Text style={styles.practiceButtonText}>Continuer l&apos;entraînement</Text>
              <ArrowRight size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToTablesButton}
              onPress={() => router.push('/tables')}
            >
              <Text style={styles.backToTablesText}>Retour aux tables</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showPhase2 && phase2Questions.length > 0) {
    const currentQuestion = phase2Questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / phase2Questions.length) * 100;

    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowPhase2(false)}
              testID="back-button"
            >
              <ArrowLeft size={24} color={AppColors.primary} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: tableColor },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentQuestionIndex + 1}/{phase2Questions.length}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{correctCount}</Text>
              <Check size={20} color={AppColors.success} />
            </View>
          </View>

          <View style={styles.phase2Content}>
            <Text style={styles.phase2Title}>Maintenant, tape les réponses !</Text>
            
            <View style={[styles.phase2QuestionCard, { borderColor: tableColor }]}>
              <Text style={styles.questionText}>
                {currentQuestion.multiplicand} × {currentQuestion.multiplier} = ?
              </Text>
            </View>

            <View style={styles.answerInputContainer}>
              <Text style={[styles.answerInput, { borderColor: showResult === 'correct' ? AppColors.success : showResult === 'incorrect' ? AppColors.error : tableColor }]}>
                {userAnswer || ' '}
              </Text>
            </View>

            {showResult && (
              <View style={[styles.feedbackContainer, { backgroundColor: showResult === 'correct' ? AppColors.success + '20' : AppColors.error + '20' }]}>
                <Text style={[styles.feedbackText, { color: showResult === 'correct' ? AppColors.success : AppColors.error }]}>
                  {showResult === 'correct' ? '✓ Correct !' : '✗ Incorrect !'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.validateButton, { backgroundColor: tableColor }]}
              onPress={handleSubmitAnswer}
              disabled={userAnswer === '' || showResult !== null}
            >
              <Text style={styles.validateButtonText}>Valider</Text>
            </TouchableOpacity>

            <View style={styles.numpadContainer}>
              <View style={styles.numpadRow}>
                {[1, 2, 3].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.numpadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <Text style={styles.numpadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                {[4, 5, 6].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.numpadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <Text style={styles.numpadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                {[7, 8, 9].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.numpadButton}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <Text style={styles.numpadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                <View style={styles.numpadButton} />
                <TouchableOpacity
                  style={styles.numpadButton}
                  onPress={() => handleNumberPress('0')}
                >
                  <Text style={styles.numpadText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.numpadButton}
                  onPress={handleDeletePress}
                >
                  <X size={28} color={AppColors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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

        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.content}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepContent}>{currentStepData.content}</Text>

            {currentStepData.visual}
          </View>
        </Animated.View>

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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
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
    lineHeight: 24,
    marginBottom: 24,
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
    marginBottom: 20,
  },
  tipExamplesContainer: {
    width: '100%',
    gap: 12,
  },
  tipExampleCard: {
    backgroundColor: AppColors.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  tipExampleText: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center',
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
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
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
