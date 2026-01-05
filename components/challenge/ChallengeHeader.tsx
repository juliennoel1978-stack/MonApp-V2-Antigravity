import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Volume2, VolumeX } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';

type ChallengeHeaderProps = {
    onHomePress: () => void;
    title?: string;
    onToggleVoice?: () => void;
    isVoiceEnabled?: boolean;
};

export const ChallengeHeader = ({ onHomePress, title = 'Challenge', onToggleVoice, isVoiceEnabled }: ChallengeHeaderProps) => {
    return (
        <View style={styles.header}>
            <View style={styles.leftContainer}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={onHomePress}
                    testID="home-button"
                >
                    <Home size={24} color={AppColors.text} />
                </TouchableOpacity>

                {onToggleVoice && (
                    <TouchableOpacity
                        style={[styles.homeButton, { marginLeft: 10 }]}
                        onPress={onToggleVoice}
                        testID="voice-toggle-button"
                    >
                        {isVoiceEnabled ? (
                            <Volume2 size={24} color={AppColors.primary} />
                        ) : (
                            <VolumeX size={24} color={AppColors.textSecondary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            <View style={styles.placeholder} />
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
        fontWeight: 'bold',
        color: AppColors.text,
    },
    placeholder: {
        width: 40,
    },
});
