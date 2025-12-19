import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';

type ChallengeTimerProps = {
    timeRemaining: number;
    duration: number;
    displayMode?: 'chronometer' | 'bar';
};

export const ChallengeTimer = ({ timeRemaining, duration, displayMode = 'chronometer' }: ChallengeTimerProps) => {
    const timerColor = timeRemaining > duration * 0.66
        ? AppColors.timerStart
        : timeRemaining > duration * 0.33
            ? AppColors.timerMiddle
            : AppColors.timerEnd;

    return (
        <View style={styles.timerContainer}>
            {displayMode === 'chronometer' ? (
                <>
                    <Timer
                        size={20}
                        color={timerColor}
                    />
                    <ThemedText
                        style={[
                            styles.timerText,
                            { color: timerColor }
                        ]}
                    >
                        {timeRemaining}s
                    </ThemedText>
                </>
            ) : (
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${(timeRemaining / duration) * 100}%`,
                                backgroundColor: timerColor
                            }
                        ]}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
        fontWeight: 'bold',
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
});
