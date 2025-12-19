import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { AppColors } from '@/constants/colors';
import { ThemedText } from './ThemedText';
import type { QueuedReward } from '@/types';

const { width } = Dimensions.get('window');

interface BadgeOverlayProps {
  visible: boolean;
  currentReward: QueuedReward | null;
  onDismiss: () => void;
}

export default function BadgeOverlay({
  visible,
  currentReward,
  onDismiss,
}: BadgeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && currentReward) {
      Keyboard.dismiss();

      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      bounceAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      bounceAnim.stopAnimation();
      bounceAnim.setValue(0);
    }
  }, [visible, currentReward, fadeAnim, scaleAnim, bounceAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !currentReward) return null;

  const isLevelBadge = currentReward.type === 'level_badge';
  const headerColor = isLevelBadge ? AppColors.primary : '#FF9500';
  const borderColor = isLevelBadge ? AppColors.primary : '#FF9500';

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          <View style={styles.sparkleContainer}>
            <ThemedText style={styles.sparkle}>✨</ThemedText>
            <ThemedText style={[styles.sparkle, styles.sparkleRight]}>✨</ThemedText>
          </View>

          <ThemedText style={[styles.headerLabel, { color: headerColor }]}>
            {currentReward.headerText}
          </ThemedText>

          <View style={[styles.emojiContainer, { borderColor }]}>
            <ThemedText style={styles.badgeEmoji}>{currentReward.icon}</ThemedText>
          </View>

          <ThemedText style={styles.badgeTitle}>{currentReward.title}</ThemedText>
          <ThemedText style={styles.badgeMessage}>{currentReward.message}</ThemedText>

          {isLevelBadge && currentReward.nextBadgeInfo && (
            <View style={styles.nextBadgeContainer}>
              <View style={styles.nextBadgeDivider} />
              <ThemedText style={styles.nextBadgeLabel}>Prochain badge</ThemedText>
              <View style={styles.nextBadgeRow}>
                <ThemedText style={styles.nextBadgeIcon}>{currentReward.nextBadgeInfo.icon}</ThemedText>
                <View style={styles.nextBadgeInfo}>
                  <ThemedText style={styles.nextBadgeTitle}>{currentReward.nextBadgeInfo.title}</ThemedText>
                  <ThemedText style={styles.nextBadgeProgress}>
                    Plus que {currentReward.nextBadgeInfo.challengesRemaining} challenge{currentReward.nextBadgeInfo.challengesRemaining > 1 ? 's' : ''} !
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {isLevelBadge && !currentReward.nextBadgeInfo && (
            <View style={styles.maxBadgeContainer}>
              <View style={styles.nextBadgeDivider} />
              <ThemedText style={styles.maxBadgeText}>🏆 Tu as tous les badges !</ThemedText>
            </View>
          )}

          {!isLevelBadge && currentReward.achievementType === 'RECURRING' && (
            <View style={styles.recurringBadge}>
              <ThemedText style={styles.recurringText}>🔄 Peut être obtenu à nouveau</ThemedText>
            </View>
          )}

          <ThemedText style={styles.tapHint}>Touche pour continuer</ThemedText>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: width * 0.88,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  sparkle: {
    fontSize: 24,
  },
  sparkleRight: {
    transform: [{ scaleX: -1 }],
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
  },
  badgeEmoji: {
    fontSize: 52,
  },
  badgeTitle: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeMessage: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  nextBadgeContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  nextBadgeDivider: {
    width: '80%',
    height: 1,
    backgroundColor: AppColors.border,
    marginBottom: 14,
  },
  nextBadgeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: AppColors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
  },
  nextBadgeIcon: {
    fontSize: 36,
  },
  nextBadgeInfo: {
    flex: 1,
  },
  nextBadgeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
    marginBottom: 2,
  },
  nextBadgeProgress: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500' as const,
  },
  maxBadgeContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  maxBadgeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.success,
  },
  recurringBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 12,
  },
  recurringText: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500' as const,
  },
  tapHint: {
    fontSize: 13,
    color: AppColors.textLight,
    fontStyle: 'italic' as const,
    marginTop: 16,
  },
});
