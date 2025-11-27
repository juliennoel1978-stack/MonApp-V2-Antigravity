import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, Check, X, Star } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { generateQuestions } from '@/utils/questionGenerator';
import type { Question } from '@/types';

const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge } = useApp();

  const [level, setLevel] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (table) {
      setQuestions(generateQuestions(table.number, 10));
    }
  }, [table]);

  if (!table || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const tableColor = NumberColors[table.number as keyof typeof NumberColors];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    if (correct) {
      setCorrectCount(newCorrectCount);
      animateSuccess();
    } else {
      animateError();
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        finishLevel(newCorrectCount);
      }
    }, 1500);
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
      animateSuccess();
    } else {
      animateError();
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        finishLevel(newCorrectCount);
      }
    }, 1500);
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

  const nextQuestion = () => {
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
  };

  const finishLevel = (finalCorrectCount: number) => {
    if (level === 1) {
      if (finalCorrectCount === 10) {
        setShowLevelTransition(true);
      } else {
        setShowResult(true);
      }
    } else {
      const totalCorrectLevel2 = finalCorrectCount;
      let stars = 4;
      if (totalCorrectLevel2 < 10) {
        stars = totalCorrectLevel2 >= 7 ? 3 : totalCorrectLevel2 >= 5 ? 2 : 1;
      }
      
      updateTableProgress(table.number, totalCorrectLevel2, questions.length, stars);

      if (stars >= 4) {
        unlockBadge('perfect_score');
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
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowLevelTransition(false);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  };

  const retry = () => {
    setLevel(1);
    setQuestions(generateQuestions(table.number, 10));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
    setShowLevelTransition(false);
  };

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

  if (showLevelTransition) {
    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>🎉 Bravo !</Text>
            <Text style={styles.resultSubtitle}>Tu commences à maîtriser la table de {table?.number} !</Text>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4].map(starIndex => (
                  <Star
                    key={starIndex}
                    size={40}
                    color={starIndex <= 2 ? AppColors.warning : AppColors.borderLight}
                    fill={starIndex <= 2 ? AppColors.warning : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.intermediateStarsText}>2 étoiles sur 4</Text>
              <Text style={styles.transitionDescription}>
                Maintenant, allons plus loin ! Tape les réponses pour obtenir les 2 étoiles restantes.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: tableColor, width: '100%' }]}
              onPress={startLevel2}
            >
              <Text style={styles.resultButtonText}>C&apos;est parti !</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showResult) {
    if (level === 1) {
      return (
        <View style={styles.backgroundContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Presque !</Text>
              <Text style={styles.resultSubtitle}>
                Tu as fait {correctCount} bonnes réponses sur {questions.length}
              </Text>

              <View style={[styles.resultCard, { borderColor: tableColor }]}>
                <Text style={styles.resultScore}>
                  {correctCount}/{questions.length}
                </Text>
                <Text style={styles.resultLabel}>Bonnes réponses</Text>

                <Text style={styles.encouragementLarge}>
                  💪 Continue à t&apos;entraîner, tu vas y arriver !
                  {correctCount >= 8 ? ' Tu es presque au niveau suivant !' : ''}
                </Text>
                <Text style={styles.encouragementSmall}>
                  Il te faut 10/10 pour accéder au niveau 2
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.resultButton, { backgroundColor: tableColor, width: '100%' }]}
                onPress={retry}
              >
                <Text style={styles.resultButtonText}>Réessayer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resultButton, styles.retryButton, { width: '100%', marginTop: 12 }]}
                onPress={() => router.back()}
              >
                <Text style={styles.retryButtonText}>Retour</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      );
    }

    const totalCorrectLevel2 = correctCount;
    let stars = 4;
    if (totalCorrectLevel2 < 10) {
      stars = totalCorrectLevel2 >= 7 ? 3 : totalCorrectLevel2 >= 5 ? 2 : 1;
    }

    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Bravo !</Text>
            <Text style={styles.resultSubtitle}>
              Tu as terminé l&apos;entraînement
            </Text>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <Text style={styles.resultScore}>
                {correctCount}/{questions.length}
              </Text>
              <Text style={styles.resultLabel}>Bonnes réponses</Text>

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

              <Text style={styles.encouragement}>
                {stars === 4 ? 'Super ! Tu maîtrises parfaitement cette table !' :
                stars === 3 ? 'Très bien ! Continue comme ça !' :
                stars === 2 ? 'Bon début ! Entraîne-toi encore !' :
                'Continue à t&apos;entraîner, tu vas y arriver !'}
              </Text>
            </View>

            <View style={styles.resultButtons}>
              <TouchableOpacity
                style={[styles.resultButton, styles.retryButton]}
                onPress={retry}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resultButton, { backgroundColor: tableColor }]}
                onPress={() => router.back()}
              >
                <Text style={styles.resultButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (level === 1) {
    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleHomePress}
              testID="back-button"
            >
              <Home size={24} color={AppColors.primary} />
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
                Niveau 1 - {currentQuestionIndex + 1}/{questions.length}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{correctCount}</Text>
              <Check size={20} color={AppColors.success} />
            </View>
          </View>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.questionCard, { borderColor: tableColor }]}>
              <Text style={styles.questionLabel}>Combien font :</Text>
              <View style={styles.questionRow}>
                <Text style={[styles.questionNumber, { color: tableColor }]}>
                  {currentQuestion.multiplicand}
                </Text>
                <Text style={styles.questionOperator}>×</Text>
                <Text style={[styles.questionNumber, { color: tableColor }]}>
                  {currentQuestion.multiplier}
                </Text>
              </View>
            </View>

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
                    ]}
                    onPress={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                    testID={`option-${index}`}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        (showCorrect || showWrong) && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {showCorrect && <Check size={24} color="#FFFFFF" />}
                    {showWrong && <X size={24} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isCorrect !== null && (
              <View
                style={[
                  styles.feedbackContainer,
                  { backgroundColor: isCorrect ? AppColors.success + '20' : AppColors.error + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    { color: isCorrect ? AppColors.success : AppColors.error },
                  ]}
                >
                  {isCorrect ? '✓ Correct !' : '✗ Pas tout à fait...'}
                </Text>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHomePress}
            testID="back-button"
          >
            <Home size={24} color={AppColors.primary} />
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
              Niveau 2 - Question {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{correctCount}/{questions.length}</Text>
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
                styles.level2Content,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.level2QuestionCard, { borderColor: tableColor }]}>
                <Text style={styles.level2QuestionText}>
                  {currentQuestion.multiplicand} × {currentQuestion.multiplier} = ?
                </Text>
              </View>

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

              {isCorrect !== null ? (
                <View style={styles.level2FeedbackContainer}>
                  {isCorrect ? (
                    <View style={styles.level2FeedbackBox}>
                      <Check size={48} color={AppColors.success} />
                      <Text style={[styles.level2FeedbackText, { color: AppColors.success }]}>
                        Correct !
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.level2FeedbackBox}>
                      <X size={48} color={AppColors.error} />
                      <Text style={[styles.level2FeedbackText, { color: AppColors.error }]}>
                        Pas tout à fait...
                      </Text>
                      <Text style={styles.correctAnswerText}>
                        La bonne réponse est : {currentQuestion.correctAnswer}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.level2SubmitButton, { backgroundColor: tableColor }]}
                  onPress={handleInputSubmit}
                  testID="submit-button"
                >
                  <Text style={styles.level2SubmitButtonText}>Valider</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  questionCard: {
    backgroundColor: AppColors.surface,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionLabel: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 16,
    fontWeight: '600' as const,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  questionNumber: {
    fontSize: 64,
    fontWeight: 'bold' as const,
  },
  questionOperator: {
    fontSize: 48,
    color: AppColors.text,
    fontWeight: 'bold' as const,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
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
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    marginRight: 8,
  },
  feedbackContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
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
    textAlign: 'center',
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
  resultButtons: {
    flexDirection: 'row',
    gap: 16,
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
  },
  retryButton: {
    backgroundColor: AppColors.surfaceLight,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  transitionTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  transitionDescription: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  intermediateStarsText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginTop: 16,
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
  },
  correctAnswerText: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  encouragementLarge: {
    fontSize: 18,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
    marginTop: 24,
    lineHeight: 26,
  },
  encouragementSmall: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
