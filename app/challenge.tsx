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
import { processStreakLogic } from '@/utils/streakLogic';
import type { StreakTier } from '@/types';

const { width } = Dimensions.get('window');

const CORRECT_PHRASES = [
  "Bravo, c'est exactement ça !",
  "Super, ta table est bien en place 💪",
  "Parfait, tu vas de plus en plus vite ✨",
  "Nickel, on continue sur cette lancée !",
  "Génial ! On sent que tu maîtrises ! 🔥",
  "Top ! Tu deviens vraiment fort(e) avec cette table 🚀",
];

const ERROR_PHRASES = [
  "Ce n'est pas grave, On révisera cette table 😉, si besoin",
  "Presque ! On la reverra un peu plus tard.",
  "Tu progresseras en la revoyant plusieurs fois, c'est normal.",
  "On corrige ensemble, et on continue tranquillement.",
  "L'important, c'est de rester dans le jeu, pas d'être parfait.",
];

const getRandomPhrase = (phrases: string[]) => {
  return phrases[Math.floor(Math.random() * phrases.length)];
};

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
  const { settings, currentUser, updateUser, incrementChallengesCompleted, anonymousChallengesCompleted } = useApp();
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
  const [currentCorrectPhrase, setCurrentCorrectPhrase] = useState<string>('');
  const [currentErrorPhrase, setCurrentErrorPhrase] = useState<string>('');
  const [maxQuestions, setMaxQuestions] = useState<number>(15);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<{ num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]>([]); 
  const [tableStats, setTableStats] = useState<Record<number, { correct: number; total: number }>>({}); 
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [reviewQuestions, setReviewQuestions] = useState<{ num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]>([]);
  const [lastTierShown, setLastTierShown] = useState<StreakTier>(null);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [streakToast, setStreakToast] = useState<string | null>(null);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState<boolean>(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const celebrationAnim = React.useRef(new Animated.Value(0)).current;
  const toastAnim = React.useRef(new Animated.Value(0)).current;
  const badgeAnim = React.useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const questions = currentUser 
      ? (currentUser.challengeQuestions || 15)
      : (settings.challengeQuestions || 15);
    setMaxQuestions(questions);
    const badges = currentUser?.challengeBadges || [];
    setUserBadges(badges);
    console.log('🎯 Challenge initialized with', questions, 'questions');
    console.log('🏅 User badges loaded:', badges);
    return () => {
      isMounted.current = false;
    };
  }, [currentUser, settings]);

  const showStreakToast = useCallback((message: string) => {
    setStreakToast(message);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMounted.current) {
        setStreakToast(null);
      }
    });
  }, [toastAnim]);

  const showBadgeUnlocked = useCallback((badge: string) => {
    setNewBadge(badge);
    setShowBadgeAnimation(true);
    badgeAnim.setValue(0);
    Animated.sequence([
      Animated.spring(badgeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(badgeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMounted.current) {
        setShowBadgeAnimation(false);
        setNewBadge(null);
      }
    });
  }, [badgeAnim]);

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
    
    let question: Question;
    
    if (isReviewMode && reviewQuestions.length > 0) {
      const index = totalQuestions % reviewQuestions.length;
      question = reviewQuestions[index];
    } else {
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
      
      question = {
        num1,
        num2,
        answer,
        type: randomType,
        displayText,
      };
    }
    
    console.log('🔄 Generating new question:', question.displayText);
    setCurrentQuestion(question);
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
  }, [settings.timerDuration, settings.timerEnabled, currentUser, isReviewMode, wrongAnswers, totalQuestions]);

  useEffect(() => {
    if (totalQuestions === 0 && !currentQuestion) {
      console.log('🎬 Initial question generation');
      generateNewQuestion();
    }
  }, []);

  useEffect(() => {
    const timerEnabled = currentUser 
      ? (currentUser.timerSettings?.enabled || false)
      : settings.timerEnabled;
    const timerDuration = currentUser
      ? (currentUser.timerSettings?.duration || 0)
      : settings.timerDuration;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (timerEnabled && timerDuration > 0 && !showFeedback && !showCelebration && currentQuestion) {
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
    }
  }, [currentQuestion, showFeedback, showCelebration, settings.timerEnabled, settings.timerDuration, currentUser, handleTimeOut, generateNewQuestion]);

  const checkAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;
    if (showFeedback) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
      const newCorrectCount = correctCount + 1;
      const newTotalQuestions = totalQuestions + 1;
      setCorrectCount(newCorrectCount);
      setTotalQuestions(newTotalQuestions);
      setCurrentCorrectPhrase(getRandomPhrase(CORRECT_PHRASES));
      
      const badgeTheme = currentUser?.badgeTheme || settings.badgeTheme || 'space';
      const streakResult = processStreakLogic({
        lastAnswerIsCorrect: true,
        currentStreak: consecutiveCorrect,
        bestStreak,
        challengeQuestionCount: maxQuestions,
        userBadges,
        lastTierShown,
        badgeTheme,
      });
      
      setConsecutiveCorrect(streakResult.updatedCurrentStreak);
      setBestStreak(streakResult.updatedBestStreak);
      setLastTierShown(streakResult.updatedLastTierShown);
      setUserBadges(streakResult.updatedUserBadges);
      
      if (streakResult.messageToast) {
        showStreakToast(streakResult.messageToast);
      }
      
      if (streakResult.showBadgeAnimation && streakResult.badgeUnlocked) {
        showBadgeUnlocked(streakResult.badgeUnlocked);
        if (currentUser) {
          updateUser(currentUser.id, { challengeBadges: streakResult.updatedUserBadges });
        }
      }
      
      setTableStats(prev => {
        const table = currentQuestion.num1 <= 10 && currentQuestion.num2 <= 10 
          ? Math.max(currentQuestion.num1, currentQuestion.num2) 
          : currentQuestion.num1;
        return {
          ...prev,
          [table]: {
            correct: (prev[table]?.correct || 0) + 1,
            total: (prev[table]?.total || 0) + 1,
          },
        };
      });

      if (isReviewMode) {
        const currentIndex = (totalQuestions - 1) % reviewQuestions.length;
        const updatedReviewQuestions = reviewQuestions.filter((_, idx) => idx !== currentIndex);
        setReviewQuestions(updatedReviewQuestions);
        
        if (updatedReviewQuestions.length === 0) {
          console.log('✅ All review questions corrected!');
          setTimeout(() => {
            if (isMounted.current) {
              setIsFinished(true);
            }
          }, 2000);
          return;
        }
      }

      if (newTotalQuestions >= maxQuestions) {
        console.log('🎯 Challenge finished! Answered', newTotalQuestions, 'questions');
        if (!isReviewMode) {
          incrementChallengesCompleted();
        }
        setTimeout(() => {
          if (isMounted.current) {
            setIsFinished(true);
          }
        }, 2000);
        return;
      }

      setTimeout(() => {
        if (isMounted.current && !showCelebration) {
          generateNewQuestion();
        }
      }, 1500);
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
        const newIncorrectCount = incorrectCount + 1;
        const newTotalQuestions = totalQuestions + 1;
        setIncorrectCount(newIncorrectCount);
        setTotalQuestions(newTotalQuestions);
        setShowCorrectAnswer(true);
        setCurrentErrorPhrase(getRandomPhrase(ERROR_PHRASES));
        
        setWrongAnswers(prev => [...prev, currentQuestion]);
        
        setTableStats(prev => {
          const table = currentQuestion.num1 <= 10 && currentQuestion.num2 <= 10 
            ? Math.max(currentQuestion.num1, currentQuestion.num2) 
            : currentQuestion.num1;
          return {
            ...prev,
            [table]: {
              correct: prev[table]?.correct || 0,
              total: (prev[table]?.total || 0) + 1,
            },
          };
        });

        if (newTotalQuestions >= maxQuestions) {
          console.log('🎯 Challenge finished! Answered', newTotalQuestions, 'questions');
          if (!isReviewMode) {
            incrementChallengesCompleted();
          }
          setTimeout(() => {
            if (isMounted.current) {
              setIsFinished(true);
            }
          }, 3000);
        } else {
          setTimeout(() => {
            if (isMounted.current) {
              generateNewQuestion();
            }
          }, 3000);
        }
      }
    }
  };

  if (isFinished) {
    if (isReviewMode) {
      const correctedCount = correctCount;
      const correctionMessages = [
        "Une erreur de moins, bravo. Le Pro s'installe.",
        "Chaque correction compte. Tu t'améliores vraiment.",
        "Bien joué ! Tu as tout compris cette fois-ci 🎯",
        "Super ! C'est comme ça qu'on progresse 💪",
      ];
      const randomMessage = correctionMessages[Math.floor(Math.random() * correctionMessages.length)];
      
      return (
        <View style={styles.backgroundContainer}>
          <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView 
              contentContainerStyle={styles.finishedScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.finishedContainer}>
                <Text style={styles.finishedEmoji}>✅</Text>
                <Text style={styles.finishedTitle}>
                  Bien joué{currentUser ? ` ${currentUser.firstName}` : ''} !
                </Text>
                <Text style={styles.finishedSubtitle}>Tu as corrigé tes erreurs</Text>
                
                <View style={styles.finishedStats}>
                  <Text style={styles.correctionMessage}>
                    {randomMessage}
                  </Text>
                </View>
                
                <View style={styles.finishedButtonsContainer}>
                  <TouchableOpacity
                    style={styles.finishedButton}
                    onPress={() => {
                      setIsFinished(false);
                      setIsReviewMode(false);
                      setReviewQuestions([]);
                      setCorrectCount(0);
                      setIncorrectCount(0);
                      setTotalQuestions(0);
                      setConsecutiveCorrect(0);
                      setBestStreak(0);
                      setWrongAnswers([]);
                      setTableStats({});
                      const questions = currentUser 
                        ? (currentUser.challengeQuestions || 15)
                        : (settings.challengeQuestions || 15);
                      setMaxQuestions(questions);
                      generateNewQuestion();
                    }}
                  >
                    <Text style={styles.finishedButtonText}>Refaire un Challenge</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.finishedButton, styles.finishedButtonOutline]}
                    onPress={() => router.replace('/')}
                  >
                    <Text style={[styles.finishedButtonText, styles.finishedButtonOutlineText]}>Retour à l&apos;accueil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      );
    }
    
    const precision = Math.round((correctCount / maxQuestions) * 100);
    
    let bestTable = -1;
    let worstTable = -1;
    let bestTableRate = -1;
    let worstTableRate = 2;
    
    Object.entries(tableStats).forEach(([table, stats]) => {
      const rate = stats.correct / stats.total;
      if (rate > bestTableRate) {
        bestTableRate = rate;
        bestTable = parseInt(table);
      }
      if (rate < worstTableRate && stats.total > 0 && stats.correct < stats.total) {
        worstTableRate = rate;
        worstTable = parseInt(table);
      }
    });
    
    return (
      <View style={styles.backgroundContainer}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView 
            contentContainerStyle={styles.finishedScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.finishedContainer}>
              <Text style={styles.finishedEmoji}>🎉</Text>
              <Text style={styles.finishedTitle}>
                {currentUser ? `Bravo ${currentUser.firstName} !` : 'Félicitations !'}
              </Text>
              <Text style={styles.finishedSubtitle}>
                Challenge terminé ! (n°{currentUser ? (currentUser.challengesCompleted || 0) : anonymousChallengesCompleted})
              </Text>
              
              <View style={styles.finishedStats}>
                <View style={styles.finishedStatRow}>
                  <Text style={styles.finishedStatLabel}>Précision</Text>
                  <Text style={[styles.finishedStatValue, { color: AppColors.primary }]}>
                    {correctCount} bonnes / {maxQuestions} → {precision}% 👍
                  </Text>
                </View>
                
                {bestStreak > 0 && (
                  <View style={styles.finishedStatRow}>
                    <Text style={styles.finishedStatLabel}>Ta meilleure série</Text>
                    <Text style={[styles.finishedStatValue, { color: AppColors.success }]}>
                      {bestStreak} {bestStreak === 1 ? 'bonne' : 'bonnes'} d&apos;affilée ✨
                    </Text>
                  </View>
                )}
                
                {bestTable > 0 && (
                  <View style={styles.finishedStatRow}>
                    <Text style={styles.finishedStatLabel}>Table la plus solide</Text>
                    <Text style={[styles.finishedStatValue, { color: AppColors.success }]}>
                      {bestTable}
                    </Text>
                  </View>
                )}
                
                {worstTable > 0 && (
                  <View style={styles.finishedStatRow}>
                    <Text style={styles.finishedStatLabel}>Table à surveiller</Text>
                    <Text style={[styles.finishedStatValue, { color: AppColors.timerMiddle }]}>
                      {worstTable}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.finishedButtonsContainer}>
                {wrongAnswers.length > 0 && (
                  <TouchableOpacity
                    style={[styles.finishedButton, styles.finishedButtonSecondary]}
                    onPress={() => {
                      setIsFinished(false);
                      setIsReviewMode(true);
                      setReviewQuestions([...wrongAnswers]);
                      setCorrectCount(0);
                      setIncorrectCount(0);
                      setTotalQuestions(0);
                      setConsecutiveCorrect(0);
                      setMaxQuestions(wrongAnswers.length);
                      setWrongAnswers([]);
                      const firstWrongQuestion = reviewQuestions[0] || wrongAnswers[0];
                      setCurrentQuestion(firstWrongQuestion);
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
                    }}
                  >
                    <Text style={styles.finishedButtonText}>Revoir mes erreurs</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.finishedButton}
                  onPress={() => {
                    setIsFinished(false);
                    setIsReviewMode(false);
                    setReviewQuestions([]);
                    setCorrectCount(0);
                    setIncorrectCount(0);
                    setTotalQuestions(0);
                    setConsecutiveCorrect(0);
                    setBestStreak(0);
                    setWrongAnswers([]);
                    setTableStats({});
                    const questions = currentUser 
                      ? (currentUser.challengeQuestions || 15)
                      : (settings.challengeQuestions || 15);
                    setMaxQuestions(questions);
                    generateNewQuestion();
                  }}
                >
                  <Text style={styles.finishedButtonText}>Refaire un Challenge</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.finishedButton, styles.finishedButtonOutline]}
                  onPress={() => router.replace('/')}
                >
                  <Text style={[styles.finishedButtonText, styles.finishedButtonOutlineText]}>Retour à l&apos;accueil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {streakToast && (
          <Animated.View
            style={[
              styles.toastContainer,
              {
                opacity: toastAnim,
                transform: [{
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.toastText}>{streakToast}</Text>
          </Animated.View>
        )}

        {showBadgeAnimation && newBadge && (
          <Animated.View
            style={[
              styles.badgeOverlay,
              {
                opacity: badgeAnim,
                transform: [{
                  scale: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.badgeCard}>
              <Text style={styles.badgeTitle}>Nouveau badge !</Text>
              <Text style={styles.badgeEmoji}>{newBadge}</Text>
            </View>
          </Animated.View>
        )}

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
              {totalQuestions}/{maxQuestions}
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
              <Text style={styles.celebrationText}>Bravo !</Text>
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
                  {isCorrect && !showCelebration ? (
                    <View style={styles.feedbackBox}>
                      <Check size={48} color={AppColors.success} />
                      <Text style={[styles.feedbackText, { color: AppColors.success }]}>
                        Correct !
                      </Text>
                      <Text style={styles.encouragementText}>
                        {currentCorrectPhrase}
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
                      <X size={48} color={attempts === 1 ? AppColors.timerMiddle : AppColors.timerEnd} />
                      <Text style={[styles.feedbackText, { color: attempts === 1 ? AppColors.timerMiddle : AppColors.timerEnd }]}>
                        {attempts === 1 ? 'On réessaie 😌' : 'Pas tout à fait...'}
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
                          <Text style={styles.kindPhraseText}>
                            {currentErrorPhrase}
                          </Text>
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
    marginTop: 0,
    marginBottom: 16,
  },
  feedbackBox: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  encouragementText: {
    fontSize: 16,
    color: AppColors.success,
    textAlign: 'center' as const,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  kindPhraseText: {
    fontSize: 15,
    color: AppColors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
    fontStyle: 'italic' as const,
    paddingHorizontal: 16,
  },
  continueButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  answerContainer: {
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  correctAnswerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  correctAnswerValue: {
    fontSize: 32,
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
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  finishedEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  finishedSubtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  finishedScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  finishedStats: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  finishedStatRow: {
    alignItems: 'center',
  },
  finishedStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finishedStatLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  finishedStatValue: {
    fontSize: 22,
    fontWeight: 'bold' as const,
  },
  finishedButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  finishedButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  finishedButtonSecondary: {
    backgroundColor: AppColors.timerMiddle,
  },
  finishedButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  finishedButtonOutlineText: {
    color: AppColors.primary,
  },
  finishedButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: AppColors.success,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  badgeCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 16,
  },
  badgeEmoji: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  correctionMessage: {
    fontSize: 17,
    color: AppColors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    fontStyle: 'italic' as const,
    paddingHorizontal: 8,
  },
});