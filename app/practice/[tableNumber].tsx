import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, Check, X, Star, RefreshCw, ArrowRight, Volume2, VolumeX } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '@/hooks/useAudio';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber, TIPS_BY_TABLE } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { generateQuestions } from '@/utils/questionGenerator';
import type { Question } from '@/types';

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Short "Ding" sound (Base64 MP3)


// Short "Ding" sound (Base64 MP3) - Moved to utils/soundPlayer.ts

const COACH_THEMES = {
  animals: '🐒',
  space: '👽',
  heroes: '🤖',
};

const COACH_MESSAGES = {
  neutral: ["Bravo !", "Super !", "Génial !", "Top !", "Bien joué !", "Excellent !", "C'est ça !"],
  boy: ["Tu es un Champion !", "T'es le meilleur !", "Quel talent !", "Fort !"],
  girl: ["Tu es une Championne !", "T'es la meilleure !", "Quel talent !", "Forte !"],
};

const CHECKPOINT_THEMES = {
  animals: { image: '🐒', item: '🍌', title: 'Miam !', subtitle: 'Déjà la moitié de la table !' },
  space: { image: '👽', item: '💎', title: 'Énergie 50% !', subtitle: 'Tu as fait la moitié du voyage.' },
  heroes: { image: '🤖', item: '🔋', title: 'Recharge OK !', subtitle: 'Puissance à 50%.' },
};

const CheckpointModal = ({
  visible,
  theme,
  onClose,
}: {
  visible: boolean;
  theme: string;
  onClose: () => void;
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();

      // Auto close after 2.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const data = CHECKPOINT_THEMES[theme as keyof typeof CHECKPOINT_THEMES] || CHECKPOINT_THEMES.animals;

  return (
    <View style={styles.checkpointOverlay}>
      <Animated.View style={[styles.checkpointCard, { transform: [{ scale: scaleAnim }] }]}>
        <ThemedText style={styles.checkpointTitle}>{data.title}</ThemedText>
        <View style={styles.checkpointImageContainer}>
          <ThemedText style={styles.checkpointEmojiMain}>{data.image}</ThemedText>
          <ThemedText style={styles.checkpointEmojiItem}>{data.item}</ThemedText>
        </View>
        <ThemedText style={styles.checkpointSubtitle}>{data.subtitle}</ThemedText>
      </Animated.View>
    </View>
  );
};

const CoachFeedback = ({
  visible,
  theme,
  gender,
  message,
}: {
  visible: boolean;
  theme: string;
  gender?: 'boy' | 'girl';
  message: string;
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const coachEmoji = COACH_THEMES[theme as keyof typeof COACH_THEMES] || '🐒';

  return (
    <View style={styles.coachContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.coachBubble,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { translateY: -20 }],
          },
        ]}
      >
        <ThemedText style={styles.coachMessage}>{message} {['🎉', '🌟', '🔥', '🚀', '👏', '💪'][Math.floor(Math.random() * 6)]}</ThemedText>
        <View style={styles.coachBubbleArrow} />
      </Animated.View>
      <ThemedText style={styles.coachEmoji}>{coachEmoji}</ThemedText>
    </View>
  );
};

const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge, getTableProgress, settings, currentUser } = useApp();
  const { playSound, speak, stopSpeech, isVoiceEnabled } = useAudio();
  const { vibrate } = useHaptics();

  const tableProgress = getTableProgress(Number(tableNumber));
  const initialLevel = tableProgress?.level1Completed ? 2 : 1;
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(isVoiceEnabled);

  const [level, setLevel] = useState<1 | 2>(initialLevel);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);

  const [questionsToReview, setQuestionsToReview] = useState<Question[]>([]);
  const [showErrorFeedback, setShowErrorFeedback] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<Question[]>([]);

  // Coach Feedback State
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');

  // Checkpoint State
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [streak, setStreak] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);



  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  const isMounted = useRef(true);

  // Silent Data Collection Refs
  const startTimeRef = useRef<number>(Date.now());
  const totalTimeRef = useRef<number>(0);

  useEffect(() => {
    // Reset timer on every new question
    startTimeRef.current = Date.now();
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    isMounted.current = true;

    // Configure Audio for iOS Silent Mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      isMounted.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);







  useEffect(() => {
    if (table) {
      setQuestions(generateQuestions(table.number, 10));
    }
  }, [table]);

  // Effect to speak the question when it changes or when the screen is ready
  // MOVED HERE TO AVOID "RENDERED MORE HOOKS" ERROR
  useEffect(() => {
    // Safely access currentQuestion inside the effect
    const safeCurrentQuestion = questions[currentQuestionIndex];

    if (
      safeCurrentQuestion &&
      !showResult &&
      !showLevelTransition &&
      !showErrorFeedback &&
      !showCoachFeedback &&
      !showCheckpoint &&
      isMounted.current
    ) {
      // Small delay to ensure UI is ready and previous sounds are finished
      const timer = setTimeout(() => {
        if (isMounted.current && localVoiceEnabled) {
          speak(`${safeCurrentQuestion.multiplicand} fois ${safeCurrentQuestion.multiplier} ?`);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [
    // Dependencies must be stable or simple values
    questions,
    currentQuestionIndex,
    showResult,
    showLevelTransition,
    showErrorFeedback,
    showCoachFeedback,
    showCheckpoint,
    speak,
    localVoiceEnabled
  ]);

  if (!table || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText style={styles.errorText}>Chargement...</ThemedText>
      </SafeAreaView>
    );
  }

  const tableColor = NumberColors[table.number as keyof typeof NumberColors];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const speakCorrection = (question: Question) => {
    // We also respect local toggle for correction
    if (localVoiceEnabled) {
      const tip = TIPS_BY_TABLE[table.number];
      let errorText = tip?.erreur || '';

      // Improve speech for the error tip to be more natural
      // Replaces "5 × X =" with "5 fois quelque chose égale"
      errorText = errorText
        .replace(/(\d+)\s*[×]\s*X\s*=/g, "$1 fois quelque chose égale")
        .replace(/×/g, "fois")
        .replace(/=/g, "égale")
        .replace(/\bX\b/g, "quelque chose");

      const speechText = `${question.multiplicand} fois ${question.multiplier} égale ${question.correctAnswer}. ${errorText}`;
      speak(speechText);
    }
  };

  const handleAnswerSelect = (answer: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    if (correct) {
      setCorrectCount(newCorrectCount);

      // Silent Data Collection: Track time for correct answer
      totalTimeRef.current += (Date.now() - startTimeRef.current);

      // Level 1: Just regular loop, no streak/checkpoint logic needed as per request
      vibrate('success');
      triggerCoachSuccess();
      setTimeout(() => {
        if (isMounted.current) {
          nextQuestion(newCorrectCount);
          setShowCoachFeedback(false);
        }
      }, 1200);
    } else {
      setStreak(0); // Reset streak on error even in Level 1 for consistency
      vibrate('error');
      animateError();
      if (isReviewMode) {
        const alreadyInReviewErrors = reviewErrors.some(
          q => q.multiplicand === currentQuestion.multiplicand && q.multiplier === currentQuestion.multiplier
        );
        if (!alreadyInReviewErrors) {
          setReviewErrors([...reviewErrors, currentQuestion]);
        }
      } else {
        const alreadyInReview = questionsToReview.some(
          q => q.multiplicand === currentQuestion.multiplicand && q.multiplier === currentQuestion.multiplier
        );
        if (!alreadyInReview) {
          setQuestionsToReview([...questionsToReview, currentQuestion]);
        }
      }
      setShowErrorFeedback(true);
      speakCorrection(currentQuestion);
    }
  };

  const handleInputSubmit = () => {
    if (userInput.trim() === '' || selectedAnswer !== null) return;

    const answer = parseInt(userInput, 10);
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    if (correct) {
      setCorrectCount(newCorrectCount);

      // Silent Data Collection: Track time for correct answer
      totalTimeRef.current += (Date.now() - startTimeRef.current);

      const newStreak = streak + 1;
      setStreak(newStreak);

      // Checkpoint Trigger (Level 2 ONLY, 5 Consecutive)
      if (level === 2 && newStreak === 5) {
        vibrate('success');
        triggerCheckpoint();
        // Wait 2.5s for checkpoint, then proceed
        setTimeout(() => {
          if (isMounted.current) {
            setShowCheckpoint(false);
            nextQuestion(newCorrectCount);
          }
        }, 2500);
      } else {
        // Standard Success
        vibrate('success');
        triggerCoachSuccess();
        setTimeout(() => {
          if (isMounted.current) {
            nextQuestion(newCorrectCount);
            setShowCoachFeedback(false);
          }
        }, 1200);
      }

    } else {
      setStreak(0); // Reset streak on error
      vibrate('error');
      animateError();
      if (isReviewMode) {
        const alreadyInReviewErrors = reviewErrors.some(
          q => q.multiplicand === currentQuestion.multiplicand && q.multiplier === currentQuestion.multiplier
        );
        if (!alreadyInReviewErrors) {
          setReviewErrors([...reviewErrors, currentQuestion]);
        }
      } else {
        const alreadyInReview = questionsToReview.some(
          q => q.multiplicand === currentQuestion.multiplicand && q.multiplier === currentQuestion.multiplier
        );
        if (!alreadyInReview) {
          setQuestionsToReview([...questionsToReview, currentQuestion]);
        }
      }
      setShowErrorFeedback(true);
      speakCorrection(currentQuestion);
    }
  };

  const handleContinueAfterError = () => {
    setShowErrorFeedback(false);
    stopSpeech();
    nextQuestion(correctCount);
  };

  const handleRetryQuestion = () => {
    setShowErrorFeedback(false);
    stopSpeech();
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    if (level === 2) {
      setTimeout(() => {
        if (isMounted.current) {
          inputRef.current?.focus();
        }
      }, 350);
    }
  };

  /* Shared utility replaced local implementation */

  const triggerCheckpoint = () => {
    playSound('checkpoint'); // Play special character sound
    setShowCheckpoint(true);
  };

  const triggerCoachSuccess = async () => {
    // 1. Play Sound (Web Audio API or Native)
    playSound(level === 2 ? 'magic' : 'default');

    // 2. Select Message
    const isGendered = Math.random() > 0.5;
    let msg = "";
    if (isGendered && currentUser?.gender) {
      const list = currentUser.gender === 'boy' ? COACH_MESSAGES.boy : COACH_MESSAGES.girl;
      msg = list[Math.floor(Math.random() * list.length)];
    } else {
      msg = COACH_MESSAGES.neutral[Math.floor(Math.random() * COACH_MESSAGES.neutral.length)];
    }
    setCoachMessage(msg);
    setShowCoachFeedback(true);
  };

  const animateSuccess = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextQuestion = (currentCorrectCount: number) => {
    if (currentQuestionIndex < questions.length - 1) {
      fadeAnim.setValue(0);
      setSelectedAnswer(null);
      setUserInput('');
      setIsCorrect(null);
      setCurrentQuestionIndex(currentQuestionIndex + 1);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (level === 2) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 350);
      }
    } else {
      finishLevel(currentCorrectCount);
    }
  };

  const finishLevel = (finalCorrectCount: number) => {
    if (isReviewMode) {
      setIsReviewMode(false);

      if (reviewErrors.length > 0) {
        setQuestionsToReview([...reviewErrors]);
        setReviewErrors([]);
        setQuestions([...reviewErrors]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setUserInput('');
        setIsCorrect(null);
        setCorrectCount(0);
        setShowResult(false);
        setIsReviewMode(true);

        if (level === 2) {
          setTimeout(() => {
            if (isMounted.current) {
              inputRef.current?.focus();
            }
          }, 500);
        }
      } else {
        setQuestionsToReview([]);
        setShowResult(true);
      }
      return;
    }

    const averageTime = questions.length > 0 ? Math.round(totalTimeRef.current / questions.length) : 0;

    if (level === 1) {
      if (finalCorrectCount >= 8) {
        updateTableProgress(table.number, finalCorrectCount, questions.length, finalCorrectCount === 10 ? 2 : 1, 1, averageTime);
        if (finalCorrectCount === 10) setQuestionsToReview([]);
        vibrate('heavy'); // Celebrate passing level 1
        setShowLevelTransition(true);
      } else {
        setShowResult(true);
      }
    } else {
      const totalCorrectLevel2 = finalCorrectCount;
      let stars = 1;
      if (totalCorrectLevel2 === 10) stars = 4;
      else if (totalCorrectLevel2 >= 8) stars = 3;
      else if (totalCorrectLevel2 >= 5) stars = 2;

      updateTableProgress(table.number, totalCorrectLevel2, questions.length, stars, 2, averageTime);

      if (stars >= 4) {
        unlockBadge('perfect_score');
        playSound('mastery');
      }

      if (stars >= 3) { // 8/10 or better
        vibrate('heavy'); // Celebrate passing level 2
      }

      if (currentQuestionIndex === 0) {
        unlockBadge('first_table');
      }

      setShowResult(true);
    }
  };

  const startLevel2 = () => {
    setLevel(2);
    setQuestions(generateQuestions(table.number, 10));
    totalTimeRef.current = 0; // Reset timer for new level
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowLevelTransition(false);
    setQuestionsToReview([]);
    setReviewErrors([]);
    setStreak(0); // Reset streak when starting a new level

    setTimeout(() => {
      if (isMounted.current) {
        inputRef.current?.focus();
      }
    }, 500);
  };

  const retry = () => {
    setQuestions(generateQuestions(table.number, 10));
    totalTimeRef.current = 0; // Reset timer for retry
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
    setShowLevelTransition(false);
    setQuestionsToReview([]);
    setReviewErrors([]);
    setStreak(0); // Reset streak on retry

    if (level === 2) {
      setTimeout(() => {
        if (isMounted.current) {
          inputRef.current?.focus();
        }
      }, 500);
    }
  };

  const startReview = () => {
    const reviewQuestions = [...questionsToReview];
    setIsReviewMode(true);
    setQuestions(reviewQuestions);
    totalTimeRef.current = 0; // Reset timer for review
    setReviewErrors([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
    setShowLevelTransition(false);
    setStreak(0); // Reset streak on starting review

    if (level === 2) {
      setTimeout(() => {
        if (isMounted.current) {
          inputRef.current?.focus();
        }
      }, 500);
    }
  };

  const handleHomePress = () => {
    if (homeClickCount === 0) {
      setHomeClickCount(1);
      router.push('/tables');
      setTimeout(() => {
        if (isMounted.current) {
          setHomeClickCount(0);
        }
      }, 2000);
    } else {
      setHomeClickCount(0);
      router.dismissAll();
    }
  };

  if (showLevelTransition) {
    const starsEarnedLevel1 = correctCount === 10 ? 2 : 1;
    const userName = currentUser?.firstName || '';
    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <ThemedText style={styles.resultTitle}>Bravo {userName ? `${userName} ` : ''}! 🎉</ThemedText>
            <ThemedText style={styles.resultSubtitle}>
              {correctCount === 10
                ? 'Tu maîtrises cette table !'
                : 'Tu as débloqué le niveau 2 !'}
            </ThemedText>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4].map(starIndex => (
                  <Star
                    key={starIndex}
                    size={40}
                    color={starIndex <= starsEarnedLevel1 ? AppColors.warning : AppColors.borderLight}
                    fill={starIndex <= starsEarnedLevel1 ? AppColors.warning : 'transparent'}
                  />
                ))}
              </View>
              <ThemedText style={styles.intermediateStarsText}>{starsEarnedLevel1} étoile{starsEarnedLevel1 > 1 ? 's' : ''} sur 4</ThemedText>
              <ThemedText style={styles.transitionDescriptionFirst}>Maintenant, allons plus loin !</ThemedText>
              <ThemedText style={styles.transitionDescriptionSecond}>
                Tape les réponses pour obtenir{'\n'}les {4 - starsEarnedLevel1} étoile{4 - starsEarnedLevel1 > 1 ? 's' : ''} restante{4 - starsEarnedLevel1 > 1 ? 's' : ''}.
              </ThemedText>
            </View>

            <View style={styles.resultButtonsColumn}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tableColor }]}
                onPress={startLevel2}
              >
                <ThemedText style={styles.primaryButtonText}>Passer au niveau 2 🚀</ThemedText>
              </TouchableOpacity>

              {questionsToReview.length > 0 && (
                <View style={styles.reviewSectionContainer}>
                  <ThemedText style={styles.reviewSectionTitle}>Tu veux d&apos;abord revoir tes erreurs ?</ThemedText>
                  <TouchableOpacity
                    style={styles.reviewButtonSecondary}
                    onPress={startReview}
                  >
                    <ThemedText style={styles.reviewButtonSecondaryText}>Oui, réviser {questionsToReview.length === 1 ? 'mon' : `mes ${questionsToReview.length}`} erreur{questionsToReview.length > 1 ? 's' : ''}</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.backToMenuButton}
                onPress={() => router.push('/tables' as any)}
              >
                <ThemedText style={styles.backToMenuButtonText}>Retour au menu</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showResult) {
    // Logic for Final Result Screen (Level 1 Fail OR Level 2 End)
    if (level === 1) {
      // Check if we just finished a review session successfully
      const justFinishedReview = questions.length < 10 && correctCount === questions.length && !isReviewMode;
      const userName = currentUser?.firstName || '';

      if (justFinishedReview) {
        return (
          <View style={styles.backgroundContainer}>
            <SafeAreaView style={styles.container}>
              <View style={styles.resultContainer}>
                <ThemedText style={styles.resultTitle}>Bravo {userName ? `${userName} ` : ''}! 🎉</ThemedText>
                <ThemedText style={styles.resultSubtitle}>
                  Tu as réussi toutes les questions de révision !
                </ThemedText>

                <View style={styles.resultButtonsColumn}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: tableColor }]}
                    onPress={retry}
                    testID="retry-button"
                  >
                    <ThemedText style={styles.primaryButtonText}>Recommencer le quiz complet</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, styles.outlineButton, { borderColor: tableColor, backgroundColor: 'transparent' }]}
                    onPress={() => router.push('/tables' as any)}
                    testID="back-button-result"
                  >
                    <ThemedText style={[styles.primaryButtonText, { color: tableColor }]}>Aller à une autre table</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </View>
        );
      }

      // Level 1 Failed (Score <= 6)
      return (
        <View style={styles.backgroundContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.resultContainer}>
              <ThemedText style={styles.resultTitle}>Presque !</ThemedText>

              <View style={[styles.resultCardCompact, { borderColor: tableColor }]}>
                <ThemedText style={styles.resultScore}>
                  {correctCount}/{questions.length}
                </ThemedText>
                <ThemedText style={styles.resultLabel}>Bonnes réponses</ThemedText>

                <ThemedText style={styles.encouragementLarge}>
                  💪 Continue à t&apos;entraîner, tu vas y arriver !
                </ThemedText>
                <ThemedText style={styles.encouragementSmall}>
                  Il te faut au moins 8/10 pour passer au niveau suivant.
                </ThemedText>
              </View>

              <View style={styles.resultButtonsColumn}>
                {questionsToReview.length > 0 && (
                  <View style={styles.reviewContainer}>
                    <ThemedText style={styles.reviewText}>
                      Tu veux revoir uniquement les questions qui t&apos;ont posé problème ?
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.reviewConfirmButton}
                      onPress={startReview}
                    >
                      <ThemedText style={styles.reviewConfirmButtonText}>Oui</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.resultButtonsRow}>
                  <TouchableOpacity
                    style={[styles.resultButton, { backgroundColor: tableColor }]}
                    onPress={() => router.push(`/discovery/${table.number}?step=2` as any)}
                    testID="review-lesson-button"
                  >
                    <ThemedText style={styles.resultButtonText}>Réviser la table</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.resultButtonsRow}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.secondaryButton]}
                    onPress={retry}
                    testID="retry-button"
                  >
                    <ThemedText style={styles.secondaryButtonText}>Réessayer{"\n"}le quiz</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resultButton, styles.outlineButton, { borderColor: tableColor }]}
                    onPress={() => router.push('/tables' as any)}
                    testID="back-button-result"
                  >
                    <ThemedText style={[styles.outlineButtonText, { color: tableColor }]}>Autre{"\n"}table</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      );
    }

    // Check if we just finished a review session successfully for Level 2
    const justFinishedReviewL2 = questions.length < 10 && correctCount === questions.length && !isReviewMode;
    const userName = currentUser?.firstName || '';

    if (justFinishedReviewL2) {
      return (
        <View style={styles.backgroundContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.resultContainer}>
              <ThemedText style={styles.resultTitle}>Bravo {userName ? `${userName} ` : ''}! 🎉</ThemedText>
              <ThemedText style={styles.resultSubtitle}>
                Tu as réussi toutes les questions de révision !
              </ThemedText>

              <View style={styles.resultButtonsColumn}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: tableColor }]}
                  onPress={retry}
                  testID="retry-button"
                >
                  <ThemedText style={styles.primaryButtonText}>Recommencer le quiz complet</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.outlineButton, { borderColor: tableColor, backgroundColor: 'transparent' }]}
                  onPress={() => router.push('/tables' as any)}
                  testID="back-button-result"
                >
                  <ThemedText style={[styles.primaryButtonText, { color: tableColor }]}>Aller à une autre table</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      );
    }

    // Level 2 Finished
    const totalCorrectLevel2 = correctCount;
    let stars = 4;
    if (totalCorrectLevel2 < 10) {
      stars = totalCorrectLevel2 >= 8 ? 3 : totalCorrectLevel2 >= 5 ? 2 : 1;
    }
    const passed = stars >= 3;

    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <ThemedText style={styles.resultTitle}>
              {passed
                ? `Bravo ${userName ? `${userName} ` : ''}! 🎉`
                : `Presque ${userName ? `${userName} ` : ''}! 😕`}
            </ThemedText>
            <ThemedText style={styles.resultSubtitle}>
              {passed ? 'Tu as terminé l\'entraînement' : 'Entraîne-toi encore un peu'}
            </ThemedText>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <ThemedText style={styles.resultScore}>
                {correctCount}/{questions.length}
              </ThemedText>
              <ThemedText style={styles.resultLabel}>Bonnes réponses</ThemedText>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4].map(starIndex => (
                  <Star
                    key={starIndex}
                    size={40}
                    color={starIndex <= stars ? AppColors.warning : AppColors.borderLight}
                    fill={starIndex <= stars ? AppColors.warning : 'transparent'}
                  />
                ))}
              </View>

              <ThemedText style={styles.encouragement}>
                {stars === 4 ? `Super ! Tu maîtrises parfaitement la table de ${table.number} !` :
                  stars === 3 ? 'Très bien ! Continue comme ça !' :
                    stars === 2 ? 'Bon début ! Entraîne-toi encore !' :
                      'Continue à t\'entraîner, tu vas y arriver !'}
              </ThemedText>
            </View>

            <View style={styles.resultButtonsColumn}>
              {questionsToReview.length > 0 && (
                <View style={styles.reviewSectionContainer}>
                  <ThemedText style={styles.reviewSectionTitle}>
                    Tu veux revoir tes erreurs avant de continuer ?
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.reviewButtonSecondary}
                    onPress={startReview}
                  >
                    <ThemedText style={styles.reviewButtonSecondaryText}>Oui, réviser {questionsToReview.length === 1 ? 'mon' : `mes ${questionsToReview.length}`} erreur{questionsToReview.length > 1 ? 's' : ''}</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.resultButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    passed ? styles.retryButtonStyle : { backgroundColor: tableColor }
                  ]}
                  onPress={retry}
                >
                  <ThemedText style={[
                    styles.actionButtonText,
                    passed && { color: AppColors.text }
                  ]}>
                    {passed ? 'Refaire le niveau' : 'Refaire le niveau'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    passed ? { backgroundColor: tableColor } : styles.actionButtonOutline,
                    !passed && { borderColor: tableColor }
                  ]}
                  onPress={() => router.push('/tables')}
                >
                  <ThemedText style={[
                    styles.actionButtonText,
                    !passed && { color: tableColor }
                  ]}>
                    {passed ? 'Non, autre table' : 'Non, autre table'}
                  </ThemedText>
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleHomePress}
              testID="back-button"
            >
              <Home size={24} color={AppColors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soundToggleButton}
              onPress={() => setLocalVoiceEnabled(!localVoiceEnabled)}
            >
              {localVoiceEnabled ? (
                <Volume2 size={24} color={AppColors.primary} />
              ) : (
                <VolumeX size={24} color={AppColors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: tableColor },
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {isReviewMode ? 'Révision' : `Niveau ${level}`} - Question {currentQuestionIndex + 1}/{questions.length}
            </ThemedText>
          </View>

          <View style={styles.scoreContainer}>
            <ThemedText style={styles.scoreText}>{correctCount}/{questions.length}</ThemedText>
            <Check size={20} color={AppColors.success} />
          </View>
        </View>



        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                level === 2 ? styles.level2Content : { width: '100%' },
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[
                level === 2 ? styles.level2QuestionCard : styles.questionCard,
                { borderColor: tableColor }
              ]}
              >
                {level === 1 ? (
                  <>
                    <ThemedText style={styles.questionLabel}>Combien font :</ThemedText>
                    <TouchableOpacity
                      onPress={() => {
                        if (localVoiceEnabled) {
                          speak(`${currentQuestion.multiplicand} fois ${currentQuestion.multiplier} ?`);
                        }
                      }}
                      activeOpacity={localVoiceEnabled ? 0.7 : 1}
                    >
                      <View style={styles.questionRow}>
                        <ThemedText style={[styles.questionNumber, { color: tableColor }]}>
                          {currentQuestion.multiplicand}
                        </ThemedText>
                        <ThemedText style={styles.questionOperator}>×</ThemedText>
                        <ThemedText style={[styles.questionNumber, { color: tableColor }]}>
                          {currentQuestion.multiplier}
                        </ThemedText>
                        {localVoiceEnabled && <Volume2 size={24} color={AppColors.textSecondary} style={{ marginLeft: 16, opacity: 0.5 }} />}
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      if (localVoiceEnabled) {
                        speak(`${currentQuestion.multiplicand} fois ${currentQuestion.multiplier} ?`);
                      }
                    }}
                    activeOpacity={localVoiceEnabled ? 0.7 : 1}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <ThemedText style={styles.level2QuestionText}>
                      {currentQuestion.multiplicand} × {currentQuestion.multiplier} = ?
                    </ThemedText>
                    {localVoiceEnabled && <Volume2 size={28} color={AppColors.textSecondary} style={{ opacity: 0.5 }} />}
                  </TouchableOpacity>
                )}
              </View>

              {level === 1 ? (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectAnswer = option === currentQuestion.correctAnswer;
                    // Only show correct/wrong indication if we are NOT in error feedback mode (or show it differently?)
                    // Actually logic is: if error, we show error feedback modal, but here we can keep selection style
                    const showCorrect = selectedAnswer !== null && isCorrectAnswer;
                    const showWrong = isSelected && !isCorrect;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          showCorrect && styles.optionCorrect,
                          showWrong && styles.optionWrong,
                        ]}
                        onPress={() => handleAnswerSelect(option)}
                        disabled={selectedAnswer !== null}
                        testID={`option-${index}`}
                      >
                        <ThemedText
                          style={[
                            styles.optionText,
                            (showCorrect || showWrong) && styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </ThemedText>
                        {showCorrect && <Check size={24} color="#FFFFFF" />}
                        {showWrong && <X size={24} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <>
                  <View style={styles.level2InputContainer}>
                    <TextInput
                      ref={inputRef}
                      style={[styles.level2Input, { borderColor: tableColor }]}
                      value={userInput}
                      onChangeText={setUserInput}
                      keyboardType="number-pad"
                      placeholder="Ta réponse"
                      placeholderTextColor={AppColors.textLight}
                      autoFocus
                      editable={selectedAnswer === null}
                      testID="answer-input"
                    />
                  </View>

                  {!showErrorFeedback && selectedAnswer === null && (
                    <TouchableOpacity
                      style={[styles.level2SubmitButton, { backgroundColor: tableColor }]}
                      onPress={handleInputSubmit}
                      testID="submit-button"
                    >
                      <ThemedText style={styles.level2SubmitButtonText}>Valider</ThemedText>
                    </TouchableOpacity>
                  )}

                  {isCorrect && (
                    <View style={styles.level2FeedbackContainer}>
                      <View style={styles.level2FeedbackBox}>
                        <Check size={48} color={AppColors.success} />
                        <ThemedText style={[styles.level2FeedbackText, { color: AppColors.success }]}>
                          Correct !
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Feedback Overlay REMOVED - Replaced by Coach */}

        <CoachFeedback
          visible={showCoachFeedback}
          theme={currentUser?.badgeTheme || settings?.badgeTheme || 'animals'}
          gender={currentUser?.gender}
          message={coachMessage}
        />

        <CheckpointModal
          visible={showCheckpoint}
          theme={currentUser?.badgeTheme || settings?.badgeTheme || 'animals'}
          onClose={() => {
            // Focus is handled by the timeout logic in triggerCheckpoint/nextQuestion
            if (isMounted.current) {
              inputRef.current?.focus();
            }
          }}
        />

        {/* Error Feedback Overlay / Card */}
        {showErrorFeedback && (
          <View style={styles.fullScreenOverlay}>
            <View style={[styles.errorCard, { borderColor: AppColors.warning }]}>
              <ThemedText style={styles.errorTitle}>On corrige ensemble ✨</ThemedText>

              <View style={styles.correctionContainer}>
                <ThemedText style={styles.correctionText}>
                  {currentQuestion.multiplicand} × {currentQuestion.multiplier} = {currentQuestion.correctAnswer}
                </ThemedText>
                <ThemedText style={styles.errorTipText}>
                  {TIPS_BY_TABLE[table.number]?.erreur || ''}
                </ThemedText>
              </View>

              <View style={styles.errorButtons}>
                {level === 2 && (
                  <TouchableOpacity
                    style={[styles.errorButton, styles.retryQuestionButton]}
                    onPress={handleRetryQuestion}
                  >
                    <RefreshCw size={20} color={AppColors.text} />
                    <ThemedText style={styles.errorButtonText}>Réessayer cette question</ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.errorButton, styles.continueButton]}
                  onPress={handleContinueAfterError}
                >
                  <ThemedText style={[styles.errorButtonText, { color: '#FFF' }]}>Continuer</ThemedText>
                  <ArrowRight size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 18,
    color: AppColors.textSecondary,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '600',
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
    fontWeight: 'bold',
    color: AppColors.success,
  },
  questionCard: {
    backgroundColor: AppColors.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionLabel: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionNumber: {
    fontSize: 52,
    fontWeight: 'bold',
  },
  questionOperator: {
    fontSize: 40,
    color: AppColors.text,
    fontWeight: 'bold',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AppColors.border,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCorrect: {
    backgroundColor: AppColors.success,
    borderColor: AppColors.success,
  },
  optionWrong: {
    backgroundColor: AppColors.error,
    borderColor: AppColors.error,
  },
  optionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    marginRight: 8,
  },
  feedbackCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  feedbackCenterContent: {
    backgroundColor: AppColors.success,
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.1 }],
  },
  feedbackCenterText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: AppColors.surface,
    padding: 28,
    paddingTop: 24,
    paddingBottom: 24,
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
  resultCardCompact: {
    backgroundColor: AppColors.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  encouragement: {
    fontSize: 14,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
    paddingHorizontal: 0,
    maxWidth: '100%',
  },
  resultButtonsColumn: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  resultButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  retryButton: {
    backgroundColor: AppColors.surfaceLight,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transitionDescriptionFirst: {
    fontSize: 15,
    color: AppColors.text,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  transitionDescriptionSecond: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  intermediateStarsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.text,
    marginTop: 6,
    marginBottom: 12,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  level2Content: {
    width: '100%',
    alignItems: 'center',
  },
  level2QuestionCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
  },
  level2QuestionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
  },
  level2InputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  level2Input: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
    borderWidth: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  level2SubmitButton: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  level2SubmitButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  level2FeedbackContainer: {
    marginTop: 8,
  },
  level2FeedbackBox: {
    alignItems: 'center',
    gap: 12,
  },
  level2FeedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  encouragementLarge: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 20,
    lineHeight: 24,
  },
  encouragementSmall: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  resultButtonTextLarge: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultButtonSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewContainer: {
    backgroundColor: AppColors.warning + '20',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 15,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    lineHeight: 22,
  },
  reviewConfirmButton: {
    backgroundColor: AppColors.warning,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  reviewSectionContainer: {
    backgroundColor: AppColors.warning + '15',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.warning + '30',
  },
  reviewSectionTitle: {
    fontSize: 14,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  reviewButtonSecondary: {
    backgroundColor: AppColors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.warning,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewButtonSecondaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.warning,
    textAlign: 'center',
    lineHeight: 20,
  },
  backToMenuButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backToMenuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 56,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtonOutline: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
  },
  retryButtonStyle: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
    zIndex: 200,
  },
  errorCard: {
    backgroundColor: AppColors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    width: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.warning,
    textAlign: 'center',
    marginBottom: 20,
  },
  correctionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  correctionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 12,
  },
  errorTipText: {
    fontSize: 18,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  errorButtons: {
    gap: 12,
  },
  errorButton: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButton: {
    backgroundColor: AppColors.warning,
  },
  retryQuestionButton: {
    backgroundColor: AppColors.surfaceLight,
  },
  errorButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  coachContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  coachEmoji: {
    fontSize: 80,
  },
  coachBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: '80%',
  },
  coachMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
  },
  coachBubbleArrow: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  // Checkpoint Styles
  checkpointOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 900,
  },
  checkpointCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  checkpointTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  checkpointImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  checkpointEmojiMain: {
    fontSize: 80,
  },
  checkpointEmojiItem: {
    fontSize: 60,
    marginLeft: -20,
    marginTop: 30,
  },
  checkpointSubtitle: {
    fontSize: 18,
    color: AppColors.textLight,
    textAlign: 'center',
    fontWeight: '600',
  },
});
