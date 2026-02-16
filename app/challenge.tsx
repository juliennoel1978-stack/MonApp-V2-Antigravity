import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import BadgeOverlay from '@/components/BadgeOverlay';
import { ThemedText } from '@/components/ThemedText';
import { ChallengeHeader } from '@/components/challenge/ChallengeHeader';
import i18n from '@/utils/i18n';
import { ChallengeStats } from '@/components/challenge/ChallengeStats';
import { ChallengeTimer } from '@/components/challenge/ChallengeTimer';
import { ChallengeResults } from '@/components/challenge/ChallengeResults';
import { ChallengeQuestion } from '@/components/challenge/ChallengeQuestion';
import { ChallengeFeedback } from '@/components/challenge/ChallengeFeedback';
import { useChallengeGame } from '@/hooks/useChallengeGame';
import { Keypad } from '@/components/Keypad';
import { BreathPauseModal } from '@/components/BreathPauseModal';

const { width } = Dimensions.get('window');

const BOOST_THEMES = {
  animals: { image: '🐒', item: '🧃', title: 'challenge.boost.animals.title', subtitle: 'challenge.boost.animals.subtitle' },
  space: { image: '👽', item: '🛸', title: 'challenge.boost.space.title', subtitle: 'challenge.boost.space.subtitle' },
  heroes: { image: '🤖', item: '💾', title: 'challenge.boost.heroes.title', subtitle: 'challenge.boost.heroes.subtitle' },
};

const MidChallengeBoostModal = ({
  visible,
  theme,
}: {
  visible: boolean;
  theme: string;
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
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  if (!visible) return null;

  const data = BOOST_THEMES[theme as keyof typeof BOOST_THEMES] || BOOST_THEMES.animals;

  return (
    <View style={styles.boostOverlay}>
      <Animated.View style={[styles.boostCard, { transform: [{ scale: scaleAnim }] }]}>
        <ThemedText style={styles.boostTitle}>{i18n.t(data.title)}</ThemedText>
        <View style={styles.boostImageContainer}>
          <ThemedText style={styles.boostEmojiMain}>{data.image}</ThemedText>
          <ThemedText style={styles.boostEmojiItem}>{data.item}</ThemedText>
        </View>
        <ThemedText style={styles.boostSubtitle}>{i18n.t(data.subtitle)}</ThemedText>
      </Animated.View>
    </View>
  );
};

export default function ChallengeScreen() {
  const router = useRouter();
  const { tables } = useLocalSearchParams();
  const colors = useThemeColors();

  // Parse selected tables from query params
  const selectedTables = useMemo(() => {
    if (!tables) return undefined;
    const parsed = String(tables)
      .split(',')
      .map(Number)
      .filter(n => n >= 1 && n <= 10);
    return parsed.length > 0 ? parsed : undefined;
  }, [tables]);

  const {
    // State
    currentQuestion,
    userAnswer,
    setUserAnswer,
    attempts,
    correctCount,
    incorrectCount,
    totalQuestions,
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
    showMidBoost,

    // Refs & Anims
    scaleAnim,
    celebrationAnim,

    // Actions
    checkAnswer,
    restartGame,
    handleBadgeDismiss,
    handleReviewErrors,
    pauseChallenge,
    resumeChallenge,

    // Context
    currentUser,
    settings,
    isChallengeVoiceEnabled,
    toggleChallengeVoice,
    isPaused,
  } = useChallengeGame(selectedTables);

  if (isFinished) {
    return (
      <ChallengeResults
        isReviewMode={isReviewMode}
        currentUser={currentUser}
        completedChallengeCount={completedChallengeCount}
        anonymousChallengesCompleted={anonymousChallengesCompleted}
        correctCount={correctCount}
        maxQuestions={maxQuestions}
        bestStreak={bestStreak}
        tableStats={tableStats}
        wrongAnswersCount={wrongAnswers.length}
        onRestart={restartGame}
        onHome={() => router.replace('/')}
        onReviewErrors={handleReviewErrors}
      />
    );
  }

  const onKeyPress = (key: string) => {
    if (userAnswer.length < 6) { // Limit length
      setUserAnswer(userAnswer + key);
    }
  };

  const onDelete = () => {
    setUserAnswer(userAnswer.slice(0, -1));
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={[styles.backgroundContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <BadgeOverlay
          visible={showBadgeOverlay}
          currentReward={currentReward}
          onDismiss={handleBadgeDismiss}
        />

        <MidChallengeBoostModal
          visible={showMidBoost}
          theme={currentUser?.badgeTheme || settings?.badgeTheme || 'space'}
        />

        <BreathPauseModal
          visible={isPaused}
          theme={(currentUser?.badgeTheme || settings?.badgeTheme || 'space') as 'animals' | 'space' | 'heroes'}
          onResume={resumeChallenge}
        />

        <ChallengeHeader
          onHomePress={() => router.replace('/')}
          title={i18n.t('challenge.title')}
          onToggleVoice={toggleChallengeVoice}
          isVoiceEnabled={isChallengeVoiceEnabled}
          onPausePress={pauseChallenge}
          isTimerEnabled={currentUser ? (currentUser.timerSettings?.enabled || false) : settings.timerEnabled}
        />

        <ChallengeStats
          correct={correctCount}
          incorrect={incorrectCount}
          total={totalQuestions}
          max={maxQuestions}
        />

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

          if (!timerEnabled || timerDuration === 0 || showCelebration) return null;

          return (
            <ChallengeTimer
              timeRemaining={timeRemaining}
              duration={timerDuration}
              displayMode={displayMode}
            />
          );
        })()}

        {/* Main Content Split: Top Part (Questions/Feedback) + Bottom Part (Keypad) */}
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>

          <ChallengeFeedback
            showCelebration={showCelebration}
            celebrationAnim={celebrationAnim}
            showFeedback={showFeedback}
            scaleAnim={scaleAnim}
            isCorrect={isCorrect}
            isTimeout={isTimeout}
            currentUser={currentUser}
            timerDisplayMode={currentUser?.timerSettings?.displayMode ?? settings.timerDisplayMode}
            showCorrectAnswer={showCorrectAnswer}
            currentQuestion={currentQuestion}
            attempts={attempts}
            currentCorrectPhrase={currentCorrectPhrase}
            currentErrorPhrase={currentErrorPhrase}
          />

          {!showCelebration && currentQuestion && (
            <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 20 }}>
              {/* We pass a stripped down set of props since we handle input via Keypad */}
              {!showFeedback && (
                <ChallengeQuestion
                  question={currentQuestion}
                  userAnswer={userAnswer}
                  setUserAnswer={() => { }} // No-op, managed by Keypad
                  showCorrectAnswer={showCorrectAnswer}
                />
              )}
            </View>
          )}
        </View>

        {/* BOTTOM KEYPAD ZONE */}
        {!showCelebration && !showFeedback && currentQuestion && (
          <Keypad
            onKeyPress={onKeyPress}
            onDelete={onDelete}
            onSubmit={checkAnswer}
            color={colors.primary}
            isSubmitDisabled={userAnswer.length === 0}
          />
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
    maxWidth: 500, // Tablet constraint
    width: '100%',
    alignSelf: 'center', // Center on tablet
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

  // Boost Modal Styles
  boostOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // High z-index to overlay everything
  },
  boostCard: {
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
    borderWidth: 4,
    borderColor: '#FFD700', // Gold border for special feel
  },
  boostTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  boostImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  boostEmojiMain: {
    fontSize: 80,
  },
  boostEmojiItem: {
    fontSize: 60,
    marginLeft: -20,
    marginTop: 30,
  },
  boostSubtitle: {
    fontSize: 20,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },


});
