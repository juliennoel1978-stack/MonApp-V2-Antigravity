import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { AppColors } from '@/constants/colors';

type ChallengeHeaderProps = {
    onHomePress: () => void;
    title?: string;
};

export const ChallengeHeader = ({ onHomePress, title = 'Challenge' }: ChallengeHeaderProps) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.homeButton}
                onPress={onHomePress}
                testID="home-button"
            >
                <Home size={24} color={AppColors.text} />
            </TouchableOpacity>
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
