import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, Check, X, Volume2, VolumeX } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { Keypad } from '@/components/Keypad';

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '@/hooks/useAudio';
import { useHaptics } from '@/hooks/useHaptics';
import { AppColors, NumberColors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getTableByNumber, TIPS_BY_TABLE } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { generateQuestions } from '@/utils/questionGenerator';
import type { Question } from '@/types';


import { Audio } from 'expo-av';

import i18n from '@/utils/i18n';
import { useResponsive } from '@/hooks/useResponsive';
import { ReviewRequestModal } from '@/components/ReviewRequestModal';
import {
  CheckpointModal,
  CoachFeedback,
  LevelCompleteScreen,
  ErrorFeedbackView,
  ResultScreen
} from '@/components/practice';
import {
  shouldRequestReview,
  countMasteredTables,
} from '@/utils/storeReviewHelper';



// Coach theme constant for local use in triggerCoachSuccess
const COACH_THEMES = {
  animals: '🐒',
  space: '👽',
  heroes: '🤖',
};

const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge, getTableProgress, settings, currentUser, progress: userProgress, updateDailyStreak } = useApp();
  const { playSound, playErrorSound, speak, stopSpeech, isVoiceEnabled } = useAudio();
  const { vibrate } = useHaptics();
  const { isSmallScreen, isTablet, spacing, fontSize, containerMaxWidth } = useResponsive();
  const colors = useThemeColors();

  const tableProgress = getTableProgress(Number(tableNumber));
  const initialLevel = tableProgress?.level1Completed ? 2 : 1;
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(isVoiceEnabled);
  const isZenMode = currentUser?.zenMode ?? settings.zenMode ?? false;

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
  const [level1Highscore, setLevel1Highscore] = useState(0);

  // Coach Feedback State
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');

  // Checkpoint State
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [streak, setStreak] = useState(0);

  // Store Review State
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Pause State for AppState handling
  const [isPaused, setIsPaused] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);



  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
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

  // FIX: AppState listener - Pause session when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came back to foreground
        if (isPaused) {
          setIsPaused(false);
          // Reset start time to now so we don't count background time
          startTimeRef.current = Date.now();
          console.log('Practice: App returned to foreground - Timer reset');
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background or inactive -> PAUSE time tracking
        if (!isPaused && !showResult) {
          setIsPaused(true);
          console.log('Practice: App went to background -> Session Paused');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPaused, showResult]);







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
          speak(i18n.t('practice.question_speak', { a: safeCurrentQuestion.multiplicand, b: safeCurrentQuestion.multiplier }));
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
        <ThemedText style={styles.errorText}>{i18n.t('practice.loading')}</ThemedText>
      </SafeAreaView>
    );
  }

  const tableColor = NumberColors[table.number as keyof typeof NumberColors];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  /* Moved helper functions to top to avoid ReferenceErrors */

  const finishLevel = (finalCorrectCount: number) => {
    stopSpeech(); // Ensure no voice over is talking

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
      } else {
        setQuestionsToReview([]);
        if (level === 1 && level1Highscore >= 8) {
          setCorrectCount(level1Highscore);
          setShowLevelTransition(true);
        } else {
          setShowResult(true);
        }
      }
      return;
    }

    const averageTime = questions.length > 0 ? Math.round(totalTimeRef.current / questions.length) : 0;

    if (level === 1) {
      // Option C: Seuil 70% pour débloquer Level 2, étoile encouragement dès 3/10
      if (finalCorrectCount >= 7) {
        // 7/10 ou plus = débloque Level 2
        const stars = finalCorrectCount === 10 ? 2 : 1;
        updateTableProgress(table.number, finalCorrectCount, questions.length, stars, 1, averageTime);
        updateDailyStreak(); // Track daily practice streak
        if (finalCorrectCount === 10) setQuestionsToReview([]);
        vibrate('heavy');
        playSound('finish');
        setLevel1Highscore(finalCorrectCount);
        setShowLevelTransition(true);
      } else if (finalCorrectCount >= 3) {
        // 3-6/10 = 1 étoile d'encouragement mais pas de Level 2
        updateTableProgress(table.number, finalCorrectCount, questions.length, 1, 1, averageTime);
        setShowResult(true);
      } else {
        // <3/10 = pas d'étoile
        setShowResult(true);
      }
    } else {
      const totalCorrectLevel2 = finalCorrectCount;
      // Fix: Calculate stars dynamically based on score (Matching UI logic)
      let stars = 1;
      if (totalCorrectLevel2 === 10) {
        stars = 4;
      } else if (totalCorrectLevel2 >= 8) {
        stars = 3;
      } else if (totalCorrectLevel2 >= 5) {
        stars = 2;
      }

      updateTableProgress(table.number, totalCorrectLevel2, questions.length, stars, 2, averageTime);
      updateDailyStreak(); // Track daily practice streak

      if (stars >= 3) {
        // ALWAYS play the finish music for success (3 or 4 stars) to ensure audio feedback
        // 'finish' maps to 'challenge_finish.mp3' which is the main completion music
        playSound('finish');
        vibrate('heavy');

        // Check for store review trigger (mastery: 2+ tables with 3+ stars, excluding tables 1 and 10)
        // Only check if this table is not 1 or 10
        if (table.number !== 1 && table.number !== 10) {
          const checkMasteryReview = async () => {
            // Count current mastered tables (will include this one after updateTableProgress)
            const currentMastered = countMasteredTables(userProgress);
            // Check if this achievement triggered the threshold (was at 1, now at 2)
            const wasAtThreshold = currentMastered === 1;

            if (wasAtThreshold) {
              const shouldShow = await shouldRequestReview('mastery');
              if (shouldShow) {
                // Delay to show after result screen is visible
                setTimeout(() => {
                  setShowReviewModal(true);
                }, 3000);
              }
            }
          };
          checkMasteryReview();
        }
      }

      if (stars >= 4) {
        unlockBadge('perfect_score');
        // Optional: Play a secondary magic sound or just rely on the 'finish' music
      }

      if (currentQuestionIndex === 0) unlockBadge('first_table');
      setShowResult(true);
    }
  };

  const nextQuestion = (currentCorrectCount: number) => {
    if (currentQuestionIndex < questions.length - 1) {
      fadeAnim.setValue(0);
      setSelectedAnswer(null);
      setUserInput('');
      setIsCorrect(null);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      finishLevel(currentCorrectCount);
    }
  };

  const speakCorrection = (question: Question) => {
    // We also respect local toggle for correction
    if (localVoiceEnabled) {
      const tip = TIPS_BY_TABLE[table.number];
      // Get the localized error text (which might be "1 x X = ...")
      let errorText = i18n.t(tip?.erreur || '');

      // Replace mathematical symbols with spoken words from locale
      errorText = errorText
        .replace(/(\d+)\s*[×]\s*X\s*=/g, `$1 ${i18n.t('practice.speech_correction.times')} ${i18n.t('practice.speech_correction.something')} ${i18n.t('practice.speech_correction.equals')}`)
        .replace(/×/g, i18n.t('practice.speech_correction.times'))
        .replace(/=/g, i18n.t('practice.speech_correction.equals'))
        .replace(/\bX\b/g, i18n.t('practice.speech_correction.something'));

      // Construct the full speech
      const speechText = i18n.t('practice.question_speak', { a: question.multiplicand, b: question.multiplier }).replace('?', '') +
        ` ${i18n.t('practice.speech_correction.equals')} ${question.correctAnswer}. ${errorText}`;

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
      // Délai cognitif de 800ms : cohérence avec Challenge
      setTimeout(() => {
        if (isMounted.current) {
          nextQuestion(newCorrectCount);
          setShowCoachFeedback(false);
        }
      }, 800);
    } else {
      setStreak(0); // Reset streak on error even in Level 1 for consistency
      // Son d'erreur doux global (cohérence Entraînement + Challenge)
      if (!isZenMode) playErrorSound();
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
        // Délai cognitif de 800ms : cohérence avec Challenge
        setTimeout(() => {
          if (isMounted.current) {
            nextQuestion(newCorrectCount);
            setShowCoachFeedback(false);
          }
        }, 800);
      }

    } else {
      setStreak(0); // Reset streak on error
      // Son d'erreur doux global (cohérence Entraînement + Challenge)
      if (!isZenMode) playErrorSound();
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
    // Focus logic removed as we use custom keypad
  };

  const onKeyPress = (key: string) => {
    if (userInput.length < 6) { // Limit length
      setUserInput(prev => prev + key);
    }
  };

  const onDelete = () => {
    setUserInput(prev => prev.slice(0, -1));
  };

  /* Shared utility replaced local implementation */

  const triggerCheckpoint = () => {
    playSound(isZenMode ? 'default' : 'checkpoint'); // Play special character sound
    setShowCheckpoint(true);
  };

  const triggerCoachSuccess = async () => {
    // 1. Play Sound (Web Audio API or Native)
    // Zen Mode: SILENCE for correct answers (User Request)
    if (!isZenMode) {
      const soundVar = level === 2 ? 'magic' : 'default';
      playSound(soundVar);
    }

    // 2. Select Message
    // 2. Select Message
    const isGendered = Math.random() > 0.5;
    let msg = "";

    // Access raw translation arrays
    const practiceStrings = (i18n.translations[i18n.locale]?.practice?.coach || {}) as any;
    let list: string[] = [];

    if (isGendered && currentUser?.gender) {
      list = currentUser.gender === 'boy' ? (practiceStrings.boy || []) : (practiceStrings.girl || []);
    }

    // Fallback if gendered list is empty or not chosen
    if (!list.length) {
      list = practiceStrings.neutral || [];
    }

    // Safety fallback
    if (!list.length) list = [i18n.t('practice.results.bravo_simple')];

    msg = list[Math.floor(Math.random() * list.length)];
    setCoachMessage(msg);
    setShowCoachFeedback(true);
  };



  const animateError = () => {
    if (isZenMode) return; // Disable visual shake in Zen Mode

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
    return (
      <LevelCompleteScreen
        correctCount={correctCount}
        tableColor={tableColor}
        userName={currentUser?.firstName || ''}
        questionsToReview={questionsToReview}
        onStartLevel2={startLevel2}
        onStartReview={startReview}
        onBackToMenu={() => router.push('/tables' as any)}
      />
    );
  }

  if (showResult) {
    // Check if we just finished a review session successfully 
    const justFinishedReview = questions.length < 10 && correctCount === questions.length && !isReviewMode;

    return (
      <ResultScreen
        level={level}
        correctCount={correctCount}
        totalQuestions={questions.length}
        tableColor={tableColor}
        tableNumber={table.number}
        userName={currentUser?.firstName || ''}
        questionsToReview={questionsToReview}
        isReviewSession={justFinishedReview}
        onRetry={retry}
        onStartReview={startReview}
        onBackToMenu={() => router.push('/tables' as any)}
        onReviewTable={() => router.push(`/discovery/${table.number}?step=2` as any)}
      />
    );
  }


  return (
    <View style={[styles.backgroundContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleHomePress}
                testID="back-button"
              >
                <Home size={24} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.soundToggleButton}
                onPress={() => setLocalVoiceEnabled(!localVoiceEnabled)}
              >
                {localVoiceEnabled ? (
                  <Volume2 size={24} color={colors.primary} />
                ) : (
                  <VolumeX size={24} color={colors.textSecondary} />
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
              <Check size={20} color={colors.success} />
            </View>
          </View>


          <View style={styles.contentContainer}>
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
                    <ThemedText style={styles.questionLabel}>{i18n.t('practice.question_label')}</ThemedText>
                    <TouchableOpacity
                      onPress={() => {
                        if (localVoiceEnabled) {
                          speak(`${currentQuestion.multiplicand} fois ${currentQuestion.multiplier} ?`);
                        }
                      }}
                      activeOpacity={localVoiceEnabled ? 0.7 : 1}
                    >
                      <View style={styles.questionRow}>
                        <ThemedText
                          style={[styles.questionNumber, { color: tableColor }, isTablet && { fontSize: fontSize(52) }]}
                          adjustsFontSizeToFit
                          numberOfLines={1}
                          minimumFontScale={0.6}
                        >
                          {currentQuestion.multiplicand}
                        </ThemedText>
                        <ThemedText style={styles.questionOperator}>×</ThemedText>
                        <ThemedText
                          style={[styles.questionNumber, { color: tableColor }, isTablet && { fontSize: fontSize(52) }]}
                          adjustsFontSizeToFit
                          numberOfLines={1}
                          minimumFontScale={0.6}
                        >
                          {currentQuestion.multiplier}
                        </ThemedText>
                        {localVoiceEnabled && <Volume2 size={24} color={colors.textSecondary} style={{ marginLeft: 16, opacity: 0.5 }} />}
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
                    <ThemedText
                      style={[styles.level2QuestionText, isTablet && { fontSize: fontSize(42) }]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      minimumFontScale={0.6}
                    >
                      {currentQuestion.multiplicand} × {currentQuestion.multiplier} = ?
                    </ThemedText>
                    {localVoiceEnabled && <Volume2 size={28} color={colors.textSecondary} style={{ opacity: 0.5 }} />}
                  </TouchableOpacity>
                )}
              </View>

              {level === 1 ? (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectAnswer = option === currentQuestion.correctAnswer;
                    const showCorrect = selectedAnswer !== null && isCorrectAnswer;
                    const showWrong = isSelected && !isCorrect;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          showCorrect && styles.optionCorrect,
                          showWrong && styles.optionWrong,
                          { paddingVertical: spacing(16) },
                        ]}
                        onPress={() => handleAnswerSelect(option)}
                        disabled={selectedAnswer !== null}
                        testID={`option-${index}`}
                      >
                        <ThemedText
                          style={[
                            styles.optionText,
                            (showCorrect || showWrong) && styles.optionTextSelected,
                            isTablet && { fontSize: fontSize(32) },
                          ]}
                          adjustsFontSizeToFit
                          numberOfLines={1}
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
                    {/* 
                         Custom TextInput display that mimics standard input but triggered by Keypad 
                         Must use ThemedText to respect Dyslexia font!
                     */}
                    <View style={[styles.level2InputLike, { borderColor: tableColor }]}>
                      {userInput ? (
                        <ThemedText style={styles.level2InputText}>{userInput}</ThemedText>
                      ) : (
                        <ThemedText style={styles.level2Placeholder}>{i18n.t('practice.your_answer')}</ThemedText>
                      )}
                      <View style={styles.cursor} />
                    </View>
                  </View>

                  {/* Submit Button Removed - Keypad has OK button */}

                  {isCorrect && (
                    <View style={styles.level2FeedbackContainer}>
                      <View style={styles.level2FeedbackBox}>
                        <Check size={48} color={colors.success} />
                        <ThemedText style={[styles.level2FeedbackText, { color: colors.success }]}>
                          {i18n.t('practice.correct_excl')}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          </View>

        </View>

        {/* BOTTOM KEYPAD ZONE (Level 2 Only) */}
        {level === 2 && !showErrorFeedback && selectedAnswer === null && (
          <Keypad
            onKeyPress={onKeyPress}
            onDelete={onDelete}
            onSubmit={handleInputSubmit}
            color={tableColor}
            isSubmitDisabled={userInput.length === 0}
          />
        )}

        {/* Keeping Coach Feedback, Checkpoint, Error Feedback overlays at root level (zIndex handles visibility) */}

        <CoachFeedback
          visible={showCoachFeedback}
          theme={currentUser?.badgeTheme || settings?.badgeTheme || 'animals'}
          gender={currentUser?.gender}
          message={coachMessage}
          isZenMode={isZenMode}
        />

        <CheckpointModal
          visible={showCheckpoint}
          theme={currentUser?.badgeTheme || settings?.badgeTheme || 'animals'}
          isZenMode={isZenMode}
          onClose={() => {
            // No focus needed
          }}
        />



        {/* Error Feedback Overlay / Card */}
        <ErrorFeedbackView
          visible={showErrorFeedback}
          currentQuestion={currentQuestion}
          tableNumber={table.number}
          level={level}
          onRetryQuestion={handleRetryQuestion}
          onContinue={handleContinueAfterError}
        />

        <ReviewRequestModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
        />
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
  resultScrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 16,
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
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 2,
  },
  resultLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
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
    gap: 10,
    width: '100%',
  },
  resultButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  level2InputLike: {
    backgroundColor: AppColors.surface,
    borderWidth: 3,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  level2InputText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
  },
  level2Placeholder: {
    fontSize: 24,
    color: AppColors.textLight,
    fontStyle: 'italic',
  },
  cursor: {
    width: 2,
    height: 40,
    backgroundColor: AppColors.primary,
    marginLeft: 4,
    opacity: 0.5,
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
    fontSize: 14,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 20,
  },
  encouragementSmall: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 13,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    lineHeight: 18,
  },
  reviewConfirmButton: {
    backgroundColor: AppColors.warning,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
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
    padding: 16,
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
