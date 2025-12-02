import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AppColors } from '@/constants/colors';

interface TimerDisplayProps {
  duration: number;
  timeRemaining: number;
  mode: 'bar' | 'chronometer';
}

export default function TimerDisplay({ duration, timeRemaining, mode }: TimerDisplayProps) {
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const progress = timeRemaining / duration;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining, duration, progressAnim]);

  const getBarColor = () => {
    const progress = timeRemaining / duration;
    
    if (progress > 0.66) {
      return '#34D399';
    } else if (progress > 0.33) {
      return '#FBBF24';
    } else {
      return '#EF4444';
    }
  };

  if (mode === 'bar') {
    const barColor = getBarColor();
    
    return (
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.barText, { color: barColor }]}>
          {timeRemaining}s
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chronometerContainer}>
      <View style={[styles.chronometerCircle, { borderColor: getBarColor() }]}>
        <Text style={[styles.chronometerText, { color: getBarColor() }]}>
          {timeRemaining}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    minWidth: 32,
    textAlign: 'right',
  },
  chronometerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  chronometerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
  },
  chronometerText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
});
