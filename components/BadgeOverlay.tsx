import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { AppColors } from '@/constants/colors';
import type { NextBadgeInfo } from '@/constants/badges';

const { width } = Dimensions.get('window');

interface BadgeOverlayProps {
  visible: boolean;
  badgeIcon: string;
  badgeTitle: string;
  badgeMessage: string;
  nextBadge: NextBadgeInfo | null;
  onDismiss: () => void;
}

export default function BadgeOverlay({
  visible,
  badgeIcon,
  badgeTitle,
  badgeMessage,
  nextBadge,
  onDismiss,
}: BadgeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      
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
  }, [visible, fadeAnim, scaleAnim, bounceAnim]);

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

  if (!visible) return null;

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
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkleRight]}>✨</Text>
          </View>
          
          <Text style={styles.newBadgeLabel}>Nouveau Badge débloqué !</Text>
          
          <View style={styles.emojiContainer}>
            <Text style={styles.badgeEmoji}>{badgeIcon}</Text>
          </View>
          
          <Text style={styles.badgeTitle}>{badgeTitle}</Text>
          <Text style={styles.badgeMessage}>{badgeMessage}</Text>
          
          {nextBadge && (
            <View style={styles.nextBadgeContainer}>
              <View style={styles.nextBadgeDivider} />
              <Text style={styles.nextBadgeLabel}>Prochain badge</Text>
              <View style={styles.nextBadgeRow}>
                <Text style={styles.nextBadgeIcon}>{nextBadge.icon}</Text>
                <View style={styles.nextBadgeInfo}>
                  <Text style={styles.nextBadgeTitle}>{nextBadge.title}</Text>
                  <Text style={styles.nextBadgeProgress}>
                    Plus que {nextBadge.challengesRemaining} challenge{nextBadge.challengesRemaining > 1 ? 's' : ''} !
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!nextBadge && (
            <View style={styles.maxBadgeContainer}>
              <View style={styles.nextBadgeDivider} />
              <Text style={styles.maxBadgeText}>🏆 Tu as tous les badges !</Text>
            </View>
          )}
          
          <Text style={styles.tapHint}>Touche pour continuer</Text>
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
  newBadgeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: AppColors.primary,
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
    borderColor: AppColors.primary,
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
  tapHint: {
    fontSize: 13,
    color: AppColors.textLight,
    fontStyle: 'italic' as const,
    marginTop: 16,
  },
});
