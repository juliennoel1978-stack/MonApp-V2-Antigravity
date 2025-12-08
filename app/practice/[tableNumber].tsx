import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, Check, X, Star, RefreshCw, ArrowRight } from 'lucide-react-native';
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
import { speak, stop } from '@/utils/speech';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber, TIPS_BY_TABLE } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { generateQuestions } from '@/utils/questionGenerator';
import type { Question } from '@/types';

const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();
  const { tableNumber } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const { updateTableProgress, unlockBadge, getTableProgress, settings, currentUser } = useApp();

  const tableProgress = getTableProgress(Number(tableNumber));
  const initialLevel = tableProgress?.level1Completed ? 2 : 1;

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
  


  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);







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

  const speakCorrection = (question: Question) => {
    if (settings?.voiceEnabled) {
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
      animateSuccess();
      setTimeout(() => {
        if (isMounted.current) {
          nextQuestion(newCorrectCount);
        }
      }, 1000);
    } else {
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
      animateSuccess();
      setTimeout(() => {
        if (isMounted.current) {
          nextQuestion(newCorrectCount);
        }
      }, 1000);
    } else {
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
    stop();
    nextQuestion(correctCount);
  };

  const handleRetryQuestion = () => {
    setShowErrorFeedback(false);
    stop();
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

    if (level === 1) {
      if (finalCorrectCount >= 8) {
        updateTableProgress(table.number, finalCorrectCount, questions.length, finalCorrectCount === 10 ? 2 : 1, 1);
        if (finalCorrectCount === 10) setQuestionsToReview([]);
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
      
      updateTableProgress(table.number, totalCorrectLevel2, questions.length, stars, 2);

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
    setQuestionsToReview([]);
    setReviewErrors([]);
    
    setTimeout(() => {
      if (isMounted.current) {
        inputRef.current?.focus();
      }
    }, 500);
  };

  const retry = () => {
    setQuestions(generateQuestions(table.number, 10));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
    setShowLevelTransition(false);
    setQuestionsToReview([]);
    setReviewErrors([]);
    
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
    setReviewErrors([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setIsCorrect(null);
    setCorrectCount(0);
    setShowResult(false);
    setShowLevelTransition(false);
    
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
            <Text style={styles.resultTitle}>Bravo {userName ? `${userName} ` : ''}! 🎉</Text>
            <Text style={styles.resultSubtitle}>
              {correctCount === 10 
                ? 'Tu maîtrises cette table !' 
                : 'Tu as débloqué le niveau 2 !'}
            </Text>

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
              <Text style={styles.intermediateStarsText}>{starsEarnedLevel1} étoile{starsEarnedLevel1 > 1 ? 's' : ''} sur 4</Text>
              <Text style={styles.transitionDescriptionFirst}>Maintenant, allons plus loin !</Text>
              <Text style={styles.transitionDescriptionSecond}>
                Tape les réponses pour obtenir{'\n'}les {4 - starsEarnedLevel1} étoile{4 - starsEarnedLevel1 > 1 ? 's' : ''} restante{4 - starsEarnedLevel1 > 1 ? 's' : ''}.
              </Text>
            </View>
            
            <View style={styles.resultButtonsColumn}>
               <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tableColor }]}
                onPress={startLevel2}
              >
                <Text style={styles.primaryButtonText}>Passer au niveau 2 🚀</Text>
              </TouchableOpacity>
              
              {questionsToReview.length > 0 && (
                 <View style={styles.reviewSectionContainer}>
                    <Text style={styles.reviewSectionTitle}>Tu veux d&apos;abord revoir tes erreurs ?</Text>
                    <TouchableOpacity
                      style={styles.reviewButtonSecondary}
                      onPress={startReview}
                    >
                      <Text style={styles.reviewButtonSecondaryText}>Oui, réviser {questionsToReview.length === 1 ? 'mon' : `mes ${questionsToReview.length}`} erreur{questionsToReview.length > 1 ? 's' : ''}</Text>
                    </TouchableOpacity>
                 </View>
              )}
              
              <TouchableOpacity
                style={styles.backToMenuButton}
                onPress={() => router.push('/tables' as any)}
              >
                <Text style={styles.backToMenuButtonText}>Retour au menu</Text>
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
                <Text style={styles.resultTitle}>Bravo {userName} ! 🎉</Text>
                <Text style={styles.resultSubtitle}>
                  Tu as réussi toutes les questions de révision !
                </Text>

                <View style={styles.resultButtonsColumn}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: tableColor }]}
                    onPress={retry}
                    testID="retry-button"
                  >
                    <Text style={styles.primaryButtonText}>Recommencer le quiz complet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, styles.outlineButton, { borderColor: tableColor, backgroundColor: 'transparent' }]}
                    onPress={() => router.push('/tables' as any)}
                    testID="back-button-result"
                  >
                    <Text style={[styles.primaryButtonText, { color: tableColor }]}>Aller à une autre table</Text>
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
              <Text style={styles.resultTitle}>Presque !</Text>

              <View style={[styles.resultCardCompact, { borderColor: tableColor }]}>
                <Text style={styles.resultScore}>
                  {correctCount}/{questions.length}
                </Text>
                <Text style={styles.resultLabel}>Bonnes réponses</Text>

                <Text style={styles.encouragementLarge}>
                  💪 Continue à t&apos;entraîner, tu vas y arriver !
                </Text>
                <Text style={styles.encouragementSmall}>
                  Il te faut au moins 8/10 pour passer au niveau suivant.
                </Text>
              </View>

              <View style={styles.resultButtonsColumn}>
                {questionsToReview.length > 0 && (
                   <View style={styles.reviewContainer}>
                      <Text style={styles.reviewText}>
                         Tu veux revoir uniquement les questions qui t&apos;ont posé problème ?
                      </Text>
                      <TouchableOpacity
                        style={styles.reviewConfirmButton}
                        onPress={startReview}
                      >
                        <Text style={styles.reviewConfirmButtonText}>Oui</Text>
                      </TouchableOpacity>
                   </View>
                )}

                <View style={styles.resultButtonsRow}>
                  <TouchableOpacity
                    style={[styles.resultButton, { backgroundColor: tableColor }]}
                    onPress={() => router.push(`/discovery/${table.number}?step=2` as any)}
                    testID="review-lesson-button"
                  >
                    <Text style={styles.resultButtonText}>Réviser la table</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.resultButtonsRow}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.secondaryButton]}
                    onPress={retry}
                    testID="retry-button"
                  >
                    <Text style={styles.secondaryButtonText}>Réessayer{"\n"}le quiz</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resultButton, styles.outlineButton, { borderColor: tableColor }]}
                    onPress={() => router.push('/tables' as any)}
                    testID="back-button-result"
                  >
                    <Text style={[styles.outlineButtonText, { color: tableColor }]}>Autre{"\n"}table</Text>
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
              <Text style={styles.resultTitle}>Bravo {userName} ! 🎉</Text>
              <Text style={styles.resultSubtitle}>
                Tu as réussi toutes les questions de révision !
              </Text>

              <View style={styles.resultButtonsColumn}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: tableColor }]}
                  onPress={retry}
                  testID="retry-button"
                >
                  <Text style={styles.primaryButtonText}>Recommencer le quiz complet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.outlineButton, { borderColor: tableColor, backgroundColor: 'transparent' }]}
                  onPress={() => router.push('/tables' as any)}
                  testID="back-button-result"
                >
                  <Text style={[styles.primaryButtonText, { color: tableColor }]}>Aller à une autre table</Text>
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
            <Text style={styles.resultTitle}>{passed ? 'Bravo !' : 'Presque !'}</Text>
            <Text style={styles.resultSubtitle}>
              {passed ? 'Tu as terminé l\'entraînement' : 'Entraîne-toi encore un peu'}
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
                {stars === 4 ? `Super ! Tu maîtrises parfaitement la table de ${table.number} !` :
                stars === 3 ? 'Très bien ! Continue comme ça !' :
                stars === 2 ? 'Bon début ! Entraîne-toi encore !' :
                'Continue à t\'entraîner, tu vas y arriver !'}
              </Text>
            </View>

             <View style={styles.resultButtonsColumn}>
                {questionsToReview.length > 0 && (
                   <View style={styles.reviewSectionContainer}>
                      <Text style={styles.reviewSectionTitle}>
                         Tu veux revoir tes erreurs avant de continuer ?
                      </Text>
                      <TouchableOpacity
                        style={styles.reviewButtonSecondary}
                        onPress={startReview}
                      >
                        <Text style={styles.reviewButtonSecondaryText}>Oui, réviser {questionsToReview.length === 1 ? 'mon' : `mes ${questionsToReview.length}`} erreur{questionsToReview.length > 1 ? 's' : ''}</Text>
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
                    <Text style={[
                      styles.actionButtonText, 
                      passed && { color: AppColors.text }
                    ]}>
                      {passed ? 'Refaire le niveau' : 'Refaire le niveau'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      passed ? { backgroundColor: tableColor } : styles.actionButtonOutline, 
                      !passed && { borderColor: tableColor }
                    ]}
                    onPress={() => router.push('/tables')}
                  >
                    <Text style={[
                      styles.actionButtonText, 
                      !passed && { color: tableColor }
                    ]}>
                      {passed ? 'Non, autre table' : 'Non, autre table'}
                    </Text>
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
              {isReviewMode ? 'Révision' : `Niveau ${level}`} - Question {currentQuestionIndex + 1}/{questions.length}
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
                   </>
                ) : (
                    <Text style={styles.level2QuestionText}>
                      {currentQuestion.multiplicand} × {currentQuestion.multiplier} = ?
                    </Text>
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
                      <Text style={styles.level2SubmitButtonText}>Valider</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isCorrect && (
                     <View style={styles.level2FeedbackContainer}>
                        <View style={styles.level2FeedbackBox}>
                          <Check size={48} color={AppColors.success} />
                          <Text style={[styles.level2FeedbackText, { color: AppColors.success }]}>
                            Correct !
                          </Text>
                        </View>
                    </View>
                  )}
                </>
              )}
              
              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Feedback Overlay */}
        {isCorrect && !showErrorFeedback && (
          <View style={styles.feedbackCenterOverlay}>
             <View style={styles.feedbackCenterContent}>
               <Check size={80} color="#FFFFFF" strokeWidth={4} />
               <Text style={styles.feedbackCenterText}>Excellent !</Text>
             </View>
          </View>
        )}
        
        {/* Error Feedback Overlay / Card */}
        {showErrorFeedback && (
           <View style={styles.fullScreenOverlay}>
              <View style={[styles.errorCard, { borderColor: AppColors.warning }]}>
                 <Text style={styles.errorTitle}>On corrige ensemble ✨</Text>
                 
                 <View style={styles.correctionContainer}>
                    <Text style={styles.correctionText}>
                       {currentQuestion.multiplicand} × {currentQuestion.multiplier} = {currentQuestion.correctAnswer}
                    </Text>
                    <Text style={styles.errorTipText}>
                       {TIPS_BY_TABLE[table.number]?.erreur || ''}
                    </Text>
                 </View>
                 
                 <View style={styles.errorButtons}>
                   {level === 2 && (
                      <TouchableOpacity 
                        style={[styles.errorButton, styles.retryQuestionButton]}
                        onPress={handleRetryQuestion}
                      >
                         <RefreshCw size={20} color={AppColors.text} />
                         <Text style={styles.errorButtonText}>Réessayer cette question</Text>
                      </TouchableOpacity>
                   )}
                   
                   <TouchableOpacity 
                      style={[styles.errorButton, styles.continueButton]}
                      onPress={handleContinueAfterError}
                   >
                      <Text style={[styles.errorButtonText, { color: '#FFF' }]}>Continuer</Text>
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
    fontSize: 15,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
    paddingHorizontal: 4,
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
    fontSize: 16,
    color: AppColors.text,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  transitionDescriptionSecond: {
    fontSize: 14,
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
    fontSize: 15,
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
});
