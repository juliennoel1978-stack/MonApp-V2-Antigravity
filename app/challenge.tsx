import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import BadgeOverlay from '@/components/BadgeOverlay';
import { ChallengeHeader } from '@/components/challenge/ChallengeHeader';
import { ChallengeStats } from '@/components/challenge/ChallengeStats';
import { ChallengeTimer } from '@/components/challenge/ChallengeTimer';
import { ChallengeResults } from '@/components/challenge/ChallengeResults';
import { ChallengeQuestion } from '@/components/challenge/ChallengeQuestion';
import { ChallengeFeedback } from '@/components/challenge/ChallengeFeedback';
import { useChallengeGame } from '@/hooks/useChallengeGame';

const { width } = Dimensions.get('window');

export default function ChallengeScreen() {
  const router = useRouter();
  const {
    // State
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
    inputRef,
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
  } = useChallengeGame();

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

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <BadgeOverlay
          visible={showBadgeOverlay}
          currentReward={currentReward}
          onDismiss={handleBadgeDismiss}
        />

        <ChallengeHeader
          onHomePress={() => router.replace('/')}
          title="Challenge"
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
              <>
                {!showFeedback && (
                  <ChallengeQuestion
                    ref={inputRef}
                    question={currentQuestion}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                    showCorrectAnswer={showCorrectAnswer}
                  />
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


});
