import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { AppColors } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface BadgeOverlayProps {
  visible: boolean;
  badgeIcon: string;
  badgeTitle: string;
  badgeMessage: string;
  onDismiss: () => void;
}

export default function BadgeOverlay({
  visible,
  badgeIcon,
  badgeTitle,
  badgeMessage,
  onDismiss,
}: BadgeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 360,
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
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.primary,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: AppColors.primary,
  },
  badgeEmoji: {
    fontSize: 64,
  },
  badgeTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeMessage: {
    fontSize: 17,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  tapHint: {
    fontSize: 14,
    color: AppColors.textLight,
    fontStyle: 'italic' as const,
  },
});
