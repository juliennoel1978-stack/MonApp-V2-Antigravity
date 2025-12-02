import { useRouter } from 'expo-router';
import { Home, X, Check, Timer, Clock } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');

type QuestionType = 'result' | 'multiplier' | 'multiplicand';

type Question = {
  num1: number;
  num2: number;
  answer: number;
  type: QuestionType;
  displayText: string;
};

export default function ChallengeScreen() {
  const router = useRouter();
  const { settings, currentUser } = useApp();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const celebrationAnim = React.useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleTimeOut = useCallback(() => {
    if (!isMounted.current) return;
    
    // In both modes, we don't count it as "incorrect" (failure), just not successful in time
    setTotalQuestions(prev => prev + 1);
    setConsecutiveCorrect(0);
    setShowCorrectAnswer(true);
    setShowFeedback(true);
    setIsCorrect(false);
    setIsTimeout(true);
  }, []);

  const generateNewQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const result = num1 * num2;
    
    const questionTypes: QuestionType[] = ['result', 'multiplier', 'multiplicand'];
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    let answer: number;
    let displayText: string;
    
    switch (randomType) {
      case 'result':
        answer = result;
        displayText = `${num1} × ${num2} = ?`;
        break;
      case 'multiplier':
        answer = num2;
        displayText = `${num1} × ? = ${result}`;
        break;
      case 'multiplicand':
        answer = num1;
        displayText = `? × ${num2} = ${result}`;
        break;
    }
    
    setCurrentQuestion({
      num1,
      num2,
      answer,
      type: randomType,
      displayText,
    });
    setUserAnswer('');
    setAttempts(0);
    setShowFeedback(false);
    setShowCorrectAnswer(false);
    setIsTimeout(false);
    const duration = currentUser 
      ? (currentUser.timerSettings?.enabled ? (currentUser.timerSettings.duration || 0) : 0)
      : (settings.timerEnabled ? settings.timerDuration : 0);
    setTimeRemaining(duration);
    
    setTimeout(() => {
      if (isMounted.current) {
        inputRef.current?.focus();
      }
    }, 100);
  }, [settings.timerDuration, settings.timerEnabled, currentUser]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  useEffect(() => {
    const timerEnabled = currentUser 
      ? (currentUser.timerSettings?.enabled || false)
      : settings.timerEnabled;
    const timerDuration = currentUser
      ? (currentUser.timerSettings?.duration || 0)
      : settings.timerDuration;
    
    if (timerEnabled && timerDuration > 0 && !showFeedback && !showCelebration) {
      setTimeRemaining(timerDuration);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleTimeOut();
            setTimeout(() => {
              if (isMounted.current) {
                generateNewQuestion();
              }
            }, 6000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [currentQuestion, showFeedback, showCelebration, settings.timerEnabled, settings.timerDuration, currentUser, handleTimeOut, generateNewQuestion]);

  const checkAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const answer = parseInt(userAnswer, 10);
    const correct = answer === currentQuestion.answer;

    setIsCorrect(correct);
    setShowFeedback(true);
    setAttempts(attempts + 1);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (correct) {
      const newConsecutive = consecutiveCorrect + 1;
      setCorrectCount(prev => prev + 1);
      setTotalQuestions(prev => prev + 1);
      setConsecutiveCorrect(newConsecutive);

      if (newConsecutive === 4) {
        setShowCelebration(true);
        Animated.spring(celebrationAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          if (isMounted.current) {
            setShowCelebration(false);
            celebrationAnim.setValue(0);
            setConsecutiveCorrect(0);
            generateNewQuestion();
          }
        }, 3000);
      } else {
        setTimeout(() => {
          if (isMounted.current) {
            generateNewQuestion();
          }
        }, 1500);
      }
    } else {
      setConsecutiveCorrect(0);

      if (attempts === 0) {
        setTimeout(() => {
          if (isMounted.current) {
            setShowFeedback(false);
            setUserAnswer('');
          }
        }, 1500);
      } else {
        setIncorrectCount(prev => prev + 1);
        setTotalQuestions(prev => prev + 1);
        setShowCorrectAnswer(true);

        setTimeout(() => {
          if (isMounted.current) {
            generateNewQuestion();
          }
        }, 7000);
      }
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            testID="home-button"
          >
            <Home size={24} color={AppColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenge</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Bonnes</Text>
            <Text style={[styles.statValue, { color: AppColors.success }]}>
              {correctCount}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Mauvaises</Text>
            <Text style={[styles.statValue, { color: AppColors.error }]}>
              {incorrectCount}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: AppColors.primary }]}>
              {totalQuestions}
            </Text>
          </View>
        </View>

        {(() => {
          const timerEnabled = currentUser 
            ? (currentUser.timerSettings?.enabled || false)
            : settings.timerEnabled;
          const timerDuration = currentUser
            ? (currentUser.timerSettings?.duration || 0)
            : settings.timerDuration;
          const displayMode = currentUser
            ? (currentUser.timerSettings?.displayMode || 'chronometer')
            : settings.timerDisplayMode;
          
          const timerColor = timeRemaining > timerDuration * 0.66 
            ? AppColors.timerStart 
            : timeRemaining > timerDuration * 0.33 
            ? AppColors.timerMiddle 
            : AppColors.timerEnd;

          if (!timerEnabled || timerDuration === 0 || showCelebration) return null;
          
          return (
            <View style={styles.timerContainer}>
              {displayMode === 'chronometer' ? (
                <>
                  <Timer 
                    size={20} 
                    color={timerColor} 
                  />
                  <Text 
                    style={[
                      styles.timerText,
                      { color: timerColor }
                    ]}
                  >
                    {timeRemaining}s
                  </Text>
                </>
              ) : (
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${(timeRemaining / timerDuration) * 100}%`,
                        backgroundColor: timerColor
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          );
        })()}

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
          {showCelebration ? (
            <Animated.View
              style={[
                styles.celebrationContainer,
                {
                  opacity: celebrationAnim,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationText}>Correct !</Text>
              <Text style={styles.celebrationSubtext}>
                4 bonnes réponses d&apos;affilée !
              </Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {currentQuestion.displayText}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  keyboardType="number-pad"
                  placeholder="Ta réponse"
                  placeholderTextColor={AppColors.textLight}
                  autoFocus
                  editable={!showCorrectAnswer}
                  testID="answer-input"
                />
              </View>

              {showFeedback && (
                <Animated.View
                  style={[
                    styles.feedbackContainer,
                    { transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  {isCorrect ? (
                    <View style={styles.feedbackBox}>
                      <Check size={48} color={AppColors.success} />
                      <Text style={[styles.feedbackText, { color: AppColors.success }]}>
                        Correct !
                      </Text>
                    </View>
                  ) : isTimeout ? (
                    <View style={styles.feedbackBox}>
                      <Clock size={48} color={AppColors.timerMiddle} />
                      <Text style={[styles.feedbackText, { color: AppColors.timerMiddle, textAlign: 'center' }]}>
                        {(currentUser?.timerSettings?.displayMode || settings.timerDisplayMode) === 'bar' 
                          ? "Prends ton temps,\non regarde la réponse ensemble."
                          : "Temps écoulé !"}
                      </Text>
                      {showCorrectAnswer && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.correctAnswerLabel}>
                            La bonne réponse est : <Text style={styles.correctAnswerValue}>{currentQuestion.answer}</Text>
                          </Text>
                          <View style={styles.equationContainer}>
                            <Text style={styles.equationText}>
                              {currentQuestion.type === 'multiplicand' && (
                                <Text style={styles.underlined}>{currentQuestion.num1}</Text>
                              )}
                              {currentQuestion.type !== 'multiplicand' && currentQuestion.num1}
                              {' × '}
                              {currentQuestion.type === 'multiplier' && (
                                <Text style={styles.underlined}>{currentQuestion.num2}</Text>
                              )}
                              {currentQuestion.type !== 'multiplier' && currentQuestion.num2}
                              {' = '}
                              {currentQuestion.type === 'result' && (
                                <Text style={styles.underlined}>{currentQuestion.answer}</Text>
                              )}
                              {currentQuestion.type !== 'result' && currentQuestion.num1 * currentQuestion.num2}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.feedbackBox}>
                      <X size={48} color={AppColors.error} />
                      <Text style={[styles.feedbackText, { color: AppColors.error }]}>
                        {attempts === 1 ? 'Essaie encore !' : 'Pas tout à fait...'}
                      </Text>
                      {showCorrectAnswer && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.correctAnswerLabel}>
                            La bonne réponse est : <Text style={styles.correctAnswerValue}>{currentQuestion.answer}</Text>
                          </Text>
                          <View style={styles.equationContainer}>
                            <Text style={styles.equationText}>
                              {currentQuestion.type === 'multiplicand' && (
                                <Text style={styles.underlined}>{currentQuestion.num1}</Text>
                              )}
                              {currentQuestion.type !== 'multiplicand' && currentQuestion.num1}
                              {' × '}
                              {currentQuestion.type === 'multiplier' && (
                                <Text style={styles.underlined}>{currentQuestion.num2}</Text>
                              )}
                              {currentQuestion.type !== 'multiplier' && currentQuestion.num2}
                              {' = '}
                              {currentQuestion.type === 'result' && (
                                <Text style={styles.underlined}>{currentQuestion.answer}</Text>
                              )}
                              {currentQuestion.type !== 'result' && currentQuestion.num1 * currentQuestion.num2}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </Animated.View>
              )}

              {!showFeedback && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={checkAnswer}
                  testID="submit-button"
                >
                  <Text style={styles.submitButtonText}>Valider</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  placeholder: {
    width: 40,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  questionCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    marginTop: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  questionText: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  inputContainer: {
    width: width - 48,
    marginBottom: 16,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 12,
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  feedbackContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  feedbackBox: {
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  answerContainer: {
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  correctAnswerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  correctAnswerValue: {
    fontSize: 44,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
  },
  equationContainer: {
    backgroundColor: AppColors.surfaceLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  equationText: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  underlined: {
    textDecorationLine: 'underline',
    textDecorationColor: AppColors.primary,
    textDecorationStyle: 'solid',
    color: AppColors.primary,
  },
  celebrationContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  celebrationEmoji: {
    fontSize: 120,
  },
  celebrationText: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
  },
  celebrationSubtext: {
    fontSize: 24,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    gap: 8,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: AppColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});