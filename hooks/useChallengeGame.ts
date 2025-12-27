import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { checkForRewards } from '@/utils/rewardQueue';
import type { QueuedReward, UnlockedAchievement } from '@/types';
import { Audio } from 'expo-av';

import { useAudio } from '@/hooks/useAudio';
import { useHaptics } from '@/hooks/useHaptics';



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

export type Question = {
    num1: number;
    num2: number;
    answer: number;
    type: QuestionType;
    displayText: string;
};

export const useChallengeGame = () => {
    const router = useRouter();
    const {
        settings,
        currentUser,
        incrementChallengesCompleted,
        anonymousChallengesCompleted,
        addPersistenceBadge,
        addAchievement,
        addPlayDate,
        getAchievements,
        getPlayDates,
        getPersistenceBadges,
        updateBestStreak,
        batchUpdateTableProgress,
        updateStrongestTable,
        updateUser,
    } = useApp();

    const { playSound } = useAudio();
    const { vibrate } = useHaptics();

    // Define Zen Mode early for use in effects
    const zenMode = (currentUser?.zenMode ?? settings.zenMode) || false;

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [attempts, setAttempts] = useState<number>(0);
    const [correctCount, setCorrectCount] = useState<number>(0);
    const [incorrectCount, setIncorrectCount] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
    const [showFeedback, setShowFeedback] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [showCelebration, setShowCelebration] = useState<boolean>(false); // Exposed but not heavily used logic-wise yet
    const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
    const [isTimeout, setIsTimeout] = useState<boolean>(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [currentCorrectPhrase, setCurrentCorrectPhrase] = useState<string>('');
    const [currentErrorPhrase, setCurrentErrorPhrase] = useState<string>('');
    const [maxQuestions, setMaxQuestions] = useState<number>(15);
    const [isEnduranceUnlock, setIsEnduranceUnlock] = useState<boolean>(false); // New State to track if an endurance badge was just unlocked (optional, for effects)
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [bestStreak, setBestStreak] = useState<number>(0);
    const [wrongAnswers, setWrongAnswers] = useState<{ num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]>([]);
    const [tableStats, setTableStats] = useState<Record<number, { correct: number; total: number }>>({});
    const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
    const [reviewQuestions, setReviewQuestions] = useState<{ num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]>([]);
    const [showMidBoost, setShowMidBoost] = useState<boolean>(false);

    // Rewards state
    const [showBadgeOverlay, setShowBadgeOverlay] = useState<boolean>(false);
    const [rewardQueue, setRewardQueue] = useState<QueuedReward[]>([]);
    const [currentReward, setCurrentReward] = useState<QueuedReward | null>(null);
    const [pendingAchievements, setPendingAchievements] = useState<UnlockedAchievement[]>([]);
    const [pendingBadge, setPendingBadge] = useState<{ id: string; threshold: number; title: string; icon: string; unlockedAt: string } | null>(null);
    const [pendingReviewStart, setPendingReviewStart] = useState<boolean>(false);

    const pendingWrongAnswersRef = useRef<{ num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]>([]);
    const tableStatsRef = useRef<Record<number, { correct: number; total: number }>>({}); // Ref for fresh access
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMounted = useRef(true);

    // Animations
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const celebrationAnim = useRef(new Animated.Value(0)).current;

    // Initial config
    useEffect(() => {
        isMounted.current = true;
        const questions = currentUser
            ? (currentUser.challengeQuestions || 15)
            : (settings.challengeQuestions || 15);
        setMaxQuestions(questions);

        // Configure Audio for iOS Silent Mode
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        }).catch(err => console.error('Failed to set audio mode', err));

        return () => {
            isMounted.current = false;
        };
    }, [currentUser, settings]);

    const handleTimeOut = useCallback(() => {
        if (!isMounted.current) return;

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

        setCurrentQuestion(question);
        setUserAnswer('');
        setAttempts(0);
        setShowFeedback(false);
        setShowCorrectAnswer(false);
        setIsTimeout(false);

        // Timer config
        const duration = currentUser
            ? (currentUser.timerSettings?.enabled ? (currentUser.timerSettings.duration || 0) : 0)
            : (settings.timerEnabled ? settings.timerDuration : 0);
        setTimeRemaining(duration);

    }, [settings.timerDuration, settings.timerEnabled, currentUser, isReviewMode, reviewQuestions, totalQuestions]);

    // Initial question generation
    useEffect(() => {
        if (totalQuestions === 0 && !currentQuestion) {
            generateNewQuestion();
        }
    }, []); // Empty dependency array intentionally

    // Timer logic
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

        // Force disable timer in Zen Mode
        if (!zenMode && timerEnabled && timerDuration > 0 && !showFeedback && !showCelebration && !showMidBoost && currentQuestion) {
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
    }, [zenMode, currentQuestion, showFeedback, showCelebration, showMidBoost, settings.timerEnabled, settings.timerDuration, currentUser, handleTimeOut, generateNewQuestion]);

    const [completedChallengeCount, setCompletedChallengeCount] = useState<number>(0);

    const handleChallengeEnd = useCallback(async () => {
        if (isReviewMode) {
            setIsFinished(true);
            return;
        }

        const newTotal = await incrementChallengesCompleted();
        await addPlayDate();
        setCompletedChallengeCount(newTotal);

        // Save table stats logic...
        // Use REF to get latest stats avoiding closure staleness
        const currentStats = tableStatsRef.current;
        const tableUpdates = Object.entries(currentStats).map(([tableStr, stats]) => ({
            tableNumber: parseInt(tableStr, 10),
            correct: stats.correct,
            total: stats.total
        }));

        // Calculate Strongest Table for this session/overall
        let bestTableReq = -1;
        let bestTableRate = -1; // Scores (number of correct answers) are stored here for ranking




        // NOTE: Strongest Table calculation and saving is now handled by the ChallengeResults component
        // to ensure that the value displayed to the user is exactly the one that is persisted.
        // This prevents logic mismatch bugs.

        if (tableUpdates.length > 0) {
            await batchUpdateTableProgress(tableUpdates);
        }

        const badgeTheme = currentUser?.badgeTheme || settings.badgeTheme || 'space';
        const existingBadges = getPersistenceBadges();
        const existingAchievements = getAchievements();
        const playDates = getPlayDates();
        const gender = currentUser?.gender;

        const timerEnabled = currentUser
            ? (currentUser.timerSettings?.enabled || false)
            : settings.timerEnabled;

        const scorePercent = Math.round((correctCount / maxQuestions) * 100);

        // --- ENDURANCE BADGES LOGIC ---
        // New logic to unlock 20, 30, 50 question badges with > 70% success.
        // Retroactive unlock: 50 unlocks 30 and 20 if needed.
        if (currentUser && scorePercent > 70) {
            const currentEndurance = currentUser.enduranceBadges || {};
            const updates: Partial<{ 20: boolean; 30: boolean; 50: boolean }> = {};
            let hasChanges = false;

            // Check for 50 (The Boss)
            if (maxQuestions >= 50) {
                if (!currentEndurance[50]) { updates[50] = true; hasChanges = true; }
                if (!currentEndurance[30]) { updates[30] = true; hasChanges = true; }
                if (!currentEndurance[20]) { updates[20] = true; hasChanges = true; }
            }
            // Check for 30
            else if (maxQuestions >= 30) {
                if (!currentEndurance[30]) { updates[30] = true; hasChanges = true; }
                if (!currentEndurance[20]) { updates[20] = true; hasChanges = true; }
            }
            // Check for 20
            else if (maxQuestions >= 20) {
                if (!currentEndurance[20]) { updates[20] = true; hasChanges = true; }
            }

            if (hasChanges) {
                const newEndurance = { ...currentEndurance, ...updates };
                await updateUser(currentUser.id, { enduranceBadges: newEndurance });
                // We could add a specific notification/reward here if desired, 
                // but the requirements focus on the "Mes Exploits" appearance.
                // For now, we just silently unlock or rely on typical persistence checks.
            }
        }
        // ------------------------------

        const { queue, newBadge, newAchievements } = checkForRewards({
            totalChallengesCompleted: newTotal,
            badgeTheme,
            existingBadges,
            existingAchievements,
            playDates,
            gender,
            timerEnabled,
            scorePercent,
            isReviewingErrors: false,
        });

        if (queue.length > 0) {
            setRewardQueue(queue);
            setCurrentReward(queue[0]);
            setPendingAchievements(newAchievements);
            setPendingBadge(newBadge);
            setShowBadgeOverlay(true);
        } else {
            setIsFinished(true);
        }
    }, [isReviewMode, incrementChallengesCompleted, addPlayDate, currentUser, settings, correctCount, maxQuestions, getPersistenceBadges, getAchievements, getPlayDates, tableStats, batchUpdateTableProgress, updateStrongestTable, updateUser]);

    const startReviewMode = useCallback((wrongAnswersToReview: { num1: number; num2: number; answer: number; type: QuestionType; displayText: string }[]) => {
        setIsFinished(false);
        setIsReviewMode(true);
        setReviewQuestions([...wrongAnswersToReview]);
        setCorrectCount(0);
        setIncorrectCount(0);
        setTotalQuestions(0);
        setConsecutiveCorrect(0);
        setMaxQuestions(wrongAnswersToReview.length);
        setWrongAnswers([]);
        const firstWrongQuestion = wrongAnswersToReview[0];
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

    }, [currentUser, settings]);

    const getAchievementIdFromTitle = (title: string): string => {
        const mapping: Record<string, string> = {
            'Maître du Temps': 'time_master',
            'Grand Stratège': 'strategist',
            'Habitué': 'regular_player',
            'Lève-tôt': 'early_bird',
            'Insomnie': 'night_owl',
            'Oeil de Lynx': 'perfect_score',
        };
        return mapping[title] || '';
    };


    const handleBadgeDismiss = useCallback(async () => {
        const currentIndex = rewardQueue.findIndex(r => r === currentReward);
        const nextIndex = currentIndex + 1;

        if (currentReward) {
            if (currentReward.type === 'level_badge' && pendingBadge) {
                await addPersistenceBadge(pendingBadge);
                setPendingBadge(null);
            } else if (currentReward.type === 'achievement') {
                const achievementToSave = pendingAchievements.find(
                    a => a.id === getAchievementIdFromTitle(currentReward.title)
                );
                if (achievementToSave) {
                    await addAchievement(achievementToSave);
                    setPendingAchievements(prev => prev.filter(a => a.id !== achievementToSave.id));
                }
            }
        }

        if (nextIndex < rewardQueue.length) {
            setCurrentReward(rewardQueue[nextIndex]);
        } else {
            setShowBadgeOverlay(false);
            setRewardQueue([]);
            setCurrentReward(null);

            if (pendingReviewStart && pendingWrongAnswersRef.current.length > 0) {
                startReviewMode(pendingWrongAnswersRef.current);
                setPendingReviewStart(false);
                pendingWrongAnswersRef.current = [];
            } else {
                setIsFinished(true);
            }
        }
    }, [rewardQueue, currentReward, pendingBadge, pendingAchievements, addPersistenceBadge, addAchievement, pendingReviewStart, startReviewMode]);

    const handleReviewErrors = useCallback(() => {
        if (!wrongAnswers || wrongAnswers.length === 0) {
            return;
        }

        // Unconditionally start review mode as requested
        // Unconditionally start review mode as requested
        startReviewMode([...wrongAnswers]);
    }, [wrongAnswers, startReviewMode]);

    const playBoostSound = useCallback(async () => {
        await playSound('boost');
        vibrate('heavy');
    }, [playSound, vibrate]);

    const checkAnswer = useCallback(() => {
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
        setAttempts(prev => prev + 1);

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
            if (!zenMode) playSound('challenge');
            vibrate('success');
            setCorrectCount(prev => prev + 1);
            setTotalQuestions(prev => prev + 1);
            setCurrentCorrectPhrase(getRandomPhrase(CORRECT_PHRASES));

            setConsecutiveCorrect(prev => {
                const newStreak = prev + 1;
                if (newStreak > bestStreak) {
                    setBestStreak(newStreak);
                    updateBestStreak(newStreak);
                }
                return newStreak;
            });

            setTableStats(prev => {
                const table = currentQuestion.num1 <= 10 && currentQuestion.num2 <= 10
                    ? Math.max(currentQuestion.num1, currentQuestion.num2)
                    : currentQuestion.num1;
                const newStats = {
                    ...prev,
                    [table]: {
                        correct: (prev[table]?.correct || 0) + 1,
                        total: (prev[table]?.total || 0) + 1,
                    },
                };
                tableStatsRef.current = newStats; // Sync ref
                return newStats;
            });

            if (isReviewMode) {
                const currentIndex = (totalQuestions) % reviewQuestions.length;
                const updatedReviewQuestions = reviewQuestions.filter((_, idx) => idx !== currentIndex);
                setReviewQuestions(updatedReviewQuestions);

                if (updatedReviewQuestions.length === 0) {

                    setTimeout(() => {
                        if (isMounted.current) {
                            setIsFinished(true);
                        }
                    }, 2000);
                    return;
                }
            }

            if (totalQuestions + 1 >= maxQuestions) {

                setTimeout(() => {
                    if (isMounted.current) {
                        handleChallengeEnd();
                    }
                }, 2000);
                return;
            }

            // MID-COURSE BOOST TRIGGER
            // Check if we hit exactly 50%
            const zenMode = (currentUser?.zenMode ?? settings.zenMode) || false;

            if (!zenMode && totalQuestions + 1 === Math.floor(maxQuestions / 2)) {
                playBoostSound();
                setShowMidBoost(true);

                // Wait 2.5s then resume
                setTimeout(() => {
                    if (isMounted.current) {
                        setShowMidBoost(false);
                        generateNewQuestion();
                    }
                }, 2500);
                return; // SKIP standard generation
            }

            setTimeout(() => {
                if (isMounted.current && !showCelebration) { // Note: showCelebration logic is tricky here if calculated inside component
                    generateNewQuestion();
                }
            }, 1500);
        } else {
            vibrate('error');
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
                setCurrentErrorPhrase(getRandomPhrase(ERROR_PHRASES));

                const alreadyInWrongAnswers = wrongAnswers.some(
                    q => q.num1 === currentQuestion.num1 &&
                        q.num2 === currentQuestion.num2 &&
                        q.type === currentQuestion.type
                );
                if (!alreadyInWrongAnswers) {
                    setWrongAnswers(prev => [...prev, currentQuestion]);
                }

                setTableStats(prev => {
                    const table = currentQuestion.num1 <= 10 && currentQuestion.num2 <= 10
                        ? Math.max(currentQuestion.num1, currentQuestion.num2)
                        : currentQuestion.num1;
                    const newStats = {
                        ...prev,
                        [table]: {
                            correct: prev[table]?.correct || 0,
                            total: (prev[table]?.total || 0) + 1,
                        },
                    };
                    tableStatsRef.current = newStats; // Sync ref
                    return newStats;
                });

                if (totalQuestions + 1 >= maxQuestions) {
                    setTimeout(() => {
                        if (isMounted.current) {
                            handleChallengeEnd();
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
    }, [zenMode, currentQuestion, userAnswer, showFeedback, attempts, correctCount, totalQuestions, consecutiveCorrect, bestStreak, isReviewMode, reviewQuestions, maxQuestions, showCelebration, wrongAnswers, handleChallengeEnd, generateNewQuestion, updateBestStreak, playSound, vibrate]);

    const restartGame = useCallback(() => {
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
        tableStatsRef.current = {}; // Fix: Clear ref to prevent ghost stats from previous games
        const questions = currentUser
            ? (currentUser.challengeQuestions || 15)
            : (settings.challengeQuestions || 15);
        setMaxQuestions(questions);
        generateNewQuestion();
    }, [currentUser, settings, generateNewQuestion]);



    return {
        // State
        showMidBoost,
        currentQuestion,
        userAnswer,
        setUserAnswer,
        attempts,
        correctCount,
        incorrectCount,
        totalQuestions,
        consecutiveCorrect,
        showFeedback,
        isCorrect,
        showCelebration,
        showCorrectAnswer,
        isTimeout,
        timeRemaining,
        currentCorrectPhrase,
        currentErrorPhrase,
        maxQuestions,
        isFinished,
        bestStreak,
        wrongAnswers,
        tableStats,
        isReviewMode,
        reviewQuestions,
        showBadgeOverlay,
        rewardQueue,
        currentReward,
        completedChallengeCount,
        anonymousChallengesCompleted,

        // Refs & Anims
        scaleAnim,
        celebrationAnim,

        // Actions
        checkAnswer,
        restartGame,
        handleBadgeDismiss,
        handleReviewErrors,

        // Context
        currentUser,
        settings,
        zenMode: (currentUser?.zenMode ?? settings.zenMode) || false,
    };
};
