import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { AVATARS } from '@/constants/avatars';
import type { BadgeTheme } from '@/types';
import i18n from '@/utils/i18n';

interface ProfileData {
    firstName: string;
    age: number;
    gender: 'boy' | 'girl';
    avatarId: string;
    badgeTheme: BadgeTheme;
}

interface Props {
    onFinish: (profileData: ProfileData) => void;
}

const BADGE_THEMES: { id: BadgeTheme; icon: string }[] = [
    { id: 'space', icon: '🚀' },
    { id: 'heroes', icon: '⚡' },
    { id: 'animals', icon: '🐯' },
];

export default function OnboardingProfile({ onFinish }: Props) {
    const [firstName, setFirstName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'boy' | 'girl'>('boy');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
    const [selectedTheme, setSelectedTheme] = useState<BadgeTheme>('space');

    const isValid = firstName.trim().length > 0 && age.trim().length > 0 && !isNaN(Number(age));

    const handleSubmit = () => {
        if (!isValid) return;

        onFinish({
            firstName: firstName.trim(),
            age: Number(age),
            gender,
            avatarId: selectedAvatar,
            badgeTheme: selectedTheme,
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Titre */}
                    <Text style={styles.title}>
                        {i18n.t('onboarding.profile_avatar')}
                    </Text>

                    {/* Choix d'avatar */}
                    <View style={styles.avatarGrid}>
                        {AVATARS.map((avatar) => (
                            <TouchableOpacity
                                key={avatar.id}
                                style={[
                                    styles.avatarItem,
                                    selectedAvatar === avatar.id && styles.avatarSelected,
                                ]}
                                onPress={() => setSelectedAvatar(avatar.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.avatarIcon}>{avatar.icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Prénom */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>
                            {i18n.t('onboarding.profile_name')}
                        </Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.inputFlex]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder={i18n.t('onboarding.profile_name_placeholder')}
                                placeholderTextColor={AppColors.textLight}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.checkButton,
                                    firstName.trim().length > 0 && styles.checkButtonValid,
                                ]}
                                onPress={Keyboard.dismiss}
                                activeOpacity={0.7}
                            >
                                <Check
                                    size={24}
                                    color={firstName.trim().length > 0 ? '#FFFFFF' : AppColors.textLight}
                                    strokeWidth={3}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Âge */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>
                            {i18n.t('onboarding.profile_age')}
                        </Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.inputAge]}
                                value={age}
                                onChangeText={setAge}
                                placeholder={i18n.t('onboarding.profile_age_placeholder')}
                                placeholderTextColor={AppColors.textLight}
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.checkButton,
                                    age.trim().length > 0 && !isNaN(Number(age)) && styles.checkButtonValid,
                                ]}
                                onPress={Keyboard.dismiss}
                                activeOpacity={0.7}
                            >
                                <Check
                                    size={24}
                                    color={age.trim().length > 0 && !isNaN(Number(age)) ? '#FFFFFF' : AppColors.textLight}
                                    strokeWidth={3}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Genre */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>
                            {i18n.t('onboarding.profile_gender')}
                        </Text>
                        <View style={styles.genderRow}>
                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    gender === 'boy' && styles.genderButtonActive,
                                ]}
                                onPress={() => setGender('boy')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.genderEmoji}>👦</Text>
                                <Text style={[
                                    styles.genderText,
                                    gender === 'boy' && styles.genderTextActive,
                                ]}>
                                    {i18n.t('user_form.boy')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    gender === 'girl' && styles.genderButtonActive,
                                ]}
                                onPress={() => setGender('girl')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.genderEmoji}>👧</Text>
                                <Text style={[
                                    styles.genderText,
                                    gender === 'girl' && styles.genderTextActive,
                                ]}>
                                    {i18n.t('user_form.girl')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Thème de badges */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>
                            {i18n.t('onboarding.profile_theme')}
                        </Text>
                        <View style={styles.themeRow}>
                            {BADGE_THEMES.map((theme) => (
                                <TouchableOpacity
                                    key={theme.id}
                                    style={[
                                        styles.themeButton,
                                        selectedTheme === theme.id && styles.themeButtonActive,
                                    ]}
                                    onPress={() => setSelectedTheme(theme.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.themeEmoji}>{theme.icon}</Text>
                                    <Text style={[
                                        styles.themeText,
                                        selectedTheme === theme.id && styles.themeTextActive,
                                    ]}>
                                        {i18n.t(`settings.themes.${theme.id}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.themeNote}>
                            💡 {i18n.t('onboarding.profile_theme_note')}
                        </Text>
                    </View>

                    {/* Bouton valider */}
                    <TouchableOpacity
                        style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isValid}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>
                            {i18n.t('onboarding.lets_go')} 🎉
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingVertical: 16,
        gap: 20,
    },
    title: {
        fontSize: 22,
        color: AppColors.text,
        textAlign: 'center',
        marginBottom: 4,
        fontFamily: 'Lexend-Bold',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    avatarItem: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: AppColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: AppColors.border,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarSelected: {
        borderColor: AppColors.primary,
        backgroundColor: AppColors.surfaceLight,
        transform: [{ scale: 1.1 }],
    },
    avatarIcon: {
        fontSize: 30,
    },
    inputSection: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        color: AppColors.text,
        marginLeft: 4,
        fontFamily: 'Lexend-Bold',
    },
    input: {
        backgroundColor: AppColors.surface,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 18,
        color: AppColors.text,
        borderWidth: 1,
        borderColor: AppColors.border,
        fontFamily: 'Lexend',
    },
    inputAge: {
        width: 100,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputFlex: {
        flex: 1,
    },
    checkButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: AppColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: AppColors.border,
    },
    checkButtonValid: {
        backgroundColor: '#34C759',
        borderColor: '#34C759',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: AppColors.surface,
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: AppColors.border,
    },
    genderButtonActive: {
        borderColor: AppColors.primary,
        backgroundColor: AppColors.surfaceLight,
    },
    genderEmoji: {
        fontSize: 24,
    },
    genderText: {
        fontSize: 16,
        color: AppColors.textSecondary,
        fontFamily: 'Lexend-Bold',
    },
    genderTextActive: {
        color: AppColors.primary,
    },
    themeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    themeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: AppColors.surface,
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: AppColors.border,
    },
    themeButtonActive: {
        borderColor: AppColors.primary,
        backgroundColor: AppColors.surfaceLight,
    },
    themeEmoji: {
        fontSize: 28,
    },
    themeText: {
        fontSize: 14,
        color: AppColors.textSecondary,
        fontFamily: 'Lexend-Bold',
    },
    themeTextActive: {
        color: AppColors.primary,
    },
    themeNote: {
        fontSize: 13,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        fontFamily: 'Lexend',
    },
    submitButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: AppColors.textLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'Lexend-Bold',
    },
});
