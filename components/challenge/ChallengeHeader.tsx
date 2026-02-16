import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Volume2, VolumeX, Pause, Heart } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';

type ChallengeHeaderProps = {
    onHomePress: () => void;
    title?: string;
    onToggleVoice?: () => void;
    isVoiceEnabled?: boolean;
    onPausePress?: () => void;
    isTimerEnabled?: boolean;
};

export const ChallengeHeader = ({
    onHomePress,
    title = 'Challenge',
    onToggleVoice,
    isVoiceEnabled,
    onPausePress,
    isTimerEnabled = false,
}: ChallengeHeaderProps) => {
    const colors = useThemeColors();
    return (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.leftContainer}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onHomePress}
                    testID="home-button"
                >
                    <Home size={24} color={colors.text} />
                </TouchableOpacity>

                {onToggleVoice && (
                    <TouchableOpacity
                        style={[styles.iconButton, { marginLeft: 10 }]}
                        onPress={onToggleVoice}
                        testID="voice-toggle-button"
                    >
                        {isVoiceEnabled ? (
                            <Volume2 size={24} color={colors.primary} />
                        ) : (
                            <VolumeX size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>{title}</ThemedText>

            <View style={styles.rightContainer}>
                {onPausePress && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={onPausePress}
                        testID="pause-button"
                    >
                        {isTimerEnabled ? (
                            <Pause size={24} color={colors.primary} />
                        ) : (
                            <Heart size={24} color="#E91E63" fill="#E91E63" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 90, // Ensure consistent spacing
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 40,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AppColors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.text,
    },
});
