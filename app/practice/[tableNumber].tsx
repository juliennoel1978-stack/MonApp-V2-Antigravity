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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { generateQuestions, calculateStars } from '@/utils/questionGenerator';
import type { Question } from '@/types';

const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [homeClickCount, setHomeClickCount] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

    if (correct) {
      setCorrectCount(correctCount + 1);
      animateSuccess();
    } else {
      animateError();
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        finishPractice();
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
    setIsCorrect(null);
    setCurrentQuestionIndex(currentQuestionIndex + 1);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const finishPractice = () => {
    const stars = calculateStars(correctCount + (isCorrect ? 1 : 0), questions.length);
    updateTableProgress(table.number, correctCount + (isCorrect ? 1 : 0), questions.length, stars);

    if (stars >= 3) {
      unlockBadge('perfect_score');
    }

    if (currentQuestionIndex === 0) {
      unlockBadge('first_table');
    }

    setShowResult(true);
  };

  const retry = () => {
    setQuestions(generateQuestions(table.number, 10));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
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

  if (showResult) {
    const finalCorrect = correctCount + (isCorrect ? 1 : 0);
    const stars = calculateStars(finalCorrect, questions.length);

    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Bravo !</Text>
            <Text style={styles.resultSubtitle}>Tu as terminé l&apos;entraînement</Text>

            <View style={[styles.resultCard, { borderColor: tableColor }]}>
              <Text style={styles.resultScore}>
                {finalCorrect}/{questions.length}
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
                {stars === 3 && 'Parfait ! Tu maîtrises cette table !'}
                {stars === 2 && 'Très bien ! Continue comme ça !'}
                {stars === 1 && 'Bon début ! Entraîne-toi encore !'}
                {stars === 0 && 'Continue à t\'entraîner, tu vas y arriver !'}
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
              {currentQuestionIndex + 1}/{questions.length}
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
                {isCorrect ? '✓ Bravo !' : '✗ Pas tout à fait...'}
              </Text>
            </View>
          )}
        </Animated.View>
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
    padding: 24,
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: AppColors.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
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
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    paddingVertical: 20,
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
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
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
});
