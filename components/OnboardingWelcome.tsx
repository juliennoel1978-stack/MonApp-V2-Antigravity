import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView , Text } from 'react-native';
import { BookOpen, Zap, Heart } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';

interface Props {
    onCreateProfile: () => void;
    onPlayDirectly: () => void;
}

export default function OnboardingWelcome({ onCreateProfile, onPlayDirectly }: Props) {
    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* Emoji d'accueil */}
            <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>🎉</Text>
            </View>

            {/* Titre */}
            <Text style={styles.title}>
                {i18n.t('onboarding.welcome_title')}
            </Text>

            {/* Sous-titre */}
            <Text style={styles.subtitle}>
                {i18n.t('onboarding.welcome_subtitle')}
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
                        <BookOpen size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.featureText}>
                        {i18n.t('onboarding.feature_discovery')}
                    </Text>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
                        <Zap size={24} color="#FF9800" />
                    </View>
                    <Text style={styles.featureText}>
                        {i18n.t('onboarding.feature_challenge')}
                    </Text>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Heart size={24} color="#2196F3" />
                    </View>
                    <Text style={styles.featureText}>
                        {i18n.t('onboarding.feature_accessibility')}
                    </Text>
                </View>
            </View>

            {/* Bouton principal - Créer profil */}
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={onCreateProfile}
                activeOpacity={0.8}
            >
                <Text style={styles.primaryButtonText}>
                    📝 {i18n.t('onboarding.create_profile')}
                </Text>
                <Text style={styles.primaryButtonDesc}>
                    {i18n.t('onboarding.create_profile_desc')}
                </Text>
            </TouchableOpacity>

            {/* Bouton secondaire - Jouer directement */}
            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onPlayDirectly}
                activeOpacity={0.8}
            >
                <Text style={styles.secondaryButtonText}>
                    🎮 {i18n.t('onboarding.play_directly')}
                </Text>
            </TouchableOpacity>

            {/* Note */}
            <Text style={styles.note}>
                💡 {i18n.t('onboarding.later_note')}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 16,
    },
    emojiContainer: {
        marginBottom: 8,
    },
    emoji: {
        fontSize: 64,
    },
    title: {
        fontSize: 26,
        color: AppColors.text,
        textAlign: 'center',
        paddingHorizontal: 10,
        fontFamily: 'Lexend-Bold',
    },
    subtitle: {
        fontSize: 18,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 8,
        fontFamily: 'Lexend',
    },
    featuresContainer: {
        width: '100%',
        backgroundColor: AppColors.surface,
        borderRadius: 16,
        padding: 16,
        gap: 16,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginVertical: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        fontSize: 15,
        color: AppColors.text,
        lineHeight: 22,
        fontFamily: 'Lexend',
    },
    primaryButton: {
        width: '100%',
        backgroundColor: AppColors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Lexend-Bold',
    },
    primaryButtonDesc: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'Lexend',
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: AppColors.surface,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    secondaryButtonText: {
        color: AppColors.textSecondary,
        fontSize: 18,
        fontFamily: 'Lexend-Bold',
    },
    note: {
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'Lexend',
    },
});
