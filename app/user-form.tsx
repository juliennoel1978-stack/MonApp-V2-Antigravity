import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, Save, X, Clock, Volume2, VolumeX, Mic, Zap, Type, Leaf, User as UserIcon, Check } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Switch,
  Modal,
  InputAccessoryView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { AVATARS, getAvatarIcon } from '@/constants/avatars';
import type { BadgeTheme } from '@/types';
import i18n from '@/utils/i18n';

export default function UserFormScreen() {
  const router = useRouter();
  const { userId, convertAnonymous } = useLocalSearchParams<{ userId?: string; convertAnonymous?: string }>();
  const { addUser, updateUser, users, selectUser, convertAnonymousToProfile } = useApp();
  const isConvertingAnonymous = convertAnonymous === 'true';
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(15);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'bar' | 'chronometer'>('bar');
  const [challengeQuestions, setChallengeQuestions] = useState(15);
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>('space');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [dyslexiaFontEnabled, setDyslexiaFontEnabled] = useState(false);
  const [fontPreference, setFontPreference] = useState<'standard' | 'lexend' | 'opendyslexic'>('standard');
  const [zenMode, setZenMode] = useState(false);
  const [avatarId, setAvatarId] = useState<string | undefined>(undefined);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const firstNameRef = React.useRef<TextInput>(null);
  const ageRef = React.useRef<TextInput>(null);
  const gradeRef = React.useRef<TextInput>(null);
  const inputAccessoryViewID = 'ageInputAccessory';

  useEffect(() => {
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setFirstName(user.firstName);
        setGender(user.gender);
        setAge(String(user.age));
        setGrade(user.grade);
        setPhotoUri(user.photoUri);
        setIsEditing(true);
        if (user.timerSettings) {
          setTimerEnabled(user.timerSettings.enabled);
          setTimerDuration(user.timerSettings.duration);
          setTimerDisplayMode(user.timerSettings.displayMode);
        }
        if (user.challengeQuestions) {
          setChallengeQuestions(user.challengeQuestions);
        }
        if (user.badgeTheme) {
          setBadgeTheme(user.badgeTheme);
        }
        setVoiceEnabled(user.voiceEnabled ?? true);
        setVoiceGender(user.voiceGender ?? 'female');
        setSoundEnabled(user.soundEnabled ?? true);
        setHapticsEnabled(user.hapticsEnabled ?? true);
        setDyslexiaFontEnabled(user.dyslexiaFontEnabled ?? false);
        // Migration logic for initial load
        if (user.fontPreference) {
          setFontPreference(user.fontPreference);
        } else {
          setFontPreference(user.dyslexiaFontEnabled ? 'lexend' : 'standard');
        }
        setZenMode(user.zenMode ?? false);
        if (user.avatarId) {
          setAvatarId(user.avatarId);
        }
      }
    }
  }, [userId, users]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.permission_gallery'));
      } else {
        Alert.alert(i18n.t('user_form.permission_title'), i18n.t('user_form.permission_gallery'));
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.permission_camera'));
      } else {
        Alert.alert(i18n.t('user_form.permission_title'), i18n.t('user_form.permission_camera'));
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.error_firstname'));
      } else {
        Alert.alert(i18n.t('user_form.error_title'), i18n.t('user_form.error_firstname'));
      }
      return;
    }

    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.error_age'));
      } else {
        Alert.alert(i18n.t('user_form.error_title'), i18n.t('user_form.error_age'));
      }
      return;
    }

    if (!grade.trim()) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.error_grade'));
      } else {
        Alert.alert(i18n.t('user_form.error_title'), i18n.t('user_form.error_grade'));
      }
      return;
    }

    const timerSettings = timerEnabled ? {
      enabled: timerEnabled,
      duration: timerDuration,
      displayMode: timerDisplayMode,
    } : undefined;

    try {
      if (isEditing && userId) {
        await updateUser(userId, {
          firstName: firstName.trim(),
          gender,
          age: Number(age),
          grade: grade.trim(),
          photoUri,
          avatarId,
          timerSettings,
          challengeQuestions,
          badgeTheme,
          voiceEnabled,
          voiceGender,
          soundEnabled,
          hapticsEnabled,
          dyslexiaFontEnabled: fontPreference === 'lexend', // Backwards compat
          fontPreference,
          zenMode,
        });
        router.back();
      } else {
        // Use conversion if coming from anonymous mode
        if (isConvertingAnonymous) {
          await convertAnonymousToProfile({
            firstName: firstName.trim(),
            gender,
            age: Number(age),
            grade: grade.trim(),
            photoUri,
            avatarId,
            timerSettings,
            challengeQuestions,
            badgeTheme,
            voiceEnabled,
            voiceGender,
            soundEnabled,
            hapticsEnabled,
            dyslexiaFontEnabled: fontPreference === 'lexend',
            fontPreference,
            zenMode,
          });
        } else {
          const newUser = await addUser({
            firstName: firstName.trim(),
            gender,
            age: Number(age),
            grade: grade.trim(),
            photoUri,
            avatarId,
            timerSettings,
            challengeQuestions,
            badgeTheme,
            voiceEnabled,
            voiceGender,
            soundEnabled,
            hapticsEnabled,
            dyslexiaFontEnabled: fontPreference === 'lexend', // Backwards compat
            fontPreference,
            zenMode,
          });
          await selectUser(newUser.id);
        }
        router.replace('/' as any);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(i18n.t('user_form.error_save'));
      } else {
        Alert.alert(i18n.t('user_form.error_title'), i18n.t('user_form.error_save'));
      }
    }
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={AppColors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? i18n.t('user_form.edit_title') : i18n.t('user_form.new_title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => setShowAvatarModal(true)}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : avatarId ? (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoEmoji}>
                      {getAvatarIcon(avatarId)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoEmoji}>
                      {gender === 'boy' ? '👦' : '👧'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => setShowAvatarModal(true)}
                >
                  <UserIcon size={20} color={AppColors.primary} />
                  <Text style={styles.photoButtonText}>{i18n.t('user_form.avatar')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickImage}
                >
                  <ImageIcon size={20} color={AppColors.primary} />
                  <Text style={styles.photoButtonText}>{i18n.t('user_form.photo_gallery')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <Camera size={20} color={AppColors.primary} />
                  <Text style={styles.photoButtonText}>{i18n.t('user_form.photo_camera')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.first_name')}</Text>
              <TextInput
                ref={firstNameRef}
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={i18n.t('user_form.first_name_placeholder')}
                placeholderTextColor={AppColors.textSecondary}
                returnKeyType="next"
                onSubmitEditing={() => ageRef.current?.focus()}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.gender')}</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'boy' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('boy')}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'boy' && styles.genderButtonTextActive,
                    ]}
                  >
                    👦 {i18n.t('user_form.boy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'girl' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('girl')}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'girl' && styles.genderButtonTextActive,
                    ]}
                  >
                    👧 {i18n.t('user_form.girl')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.age')}</Text>
              <TextInput
                ref={ageRef}
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder={i18n.t('user_form.age_placeholder')}
                placeholderTextColor={AppColors.textSecondary}
                keyboardType="number-pad"
                returnKeyType="done"
                inputAccessoryViewID={inputAccessoryViewID}
                onSubmitEditing={() => gradeRef.current?.focus()}
              />
              {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={inputAccessoryViewID}>
                  <View style={styles.accessoryContainer}>
                    <TouchableOpacity
                      style={styles.accessoryButton}
                      onPress={() => gradeRef.current?.focus()}
                    >
                      <Text style={styles.accessoryButtonLabel}>{i18n.t('user_form.validate')}</Text>
                      <Check size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </InputAccessoryView>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.grade')}</Text>
              <TextInput
                ref={gradeRef}
                style={styles.input}
                value={grade}
                onChangeText={setGrade}
                placeholder={i18n.t('user_form.grade_placeholder')}
                placeholderTextColor={AppColors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handleSave();
                }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.challenge_questions')}</Text>
              <Text style={styles.challengeSubLabel}>
                {i18n.t('user_form.challenge_questions_sub')}
              </Text>
              <Text style={styles.challengeCurrentValue}>
                {i18n.t('user_form.questions_count', { count: challengeQuestions })}
              </Text>
              <View style={styles.challengeQuestionsButtons}>
                {[12, 15, 20, 25, 30, 40, 50].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.challengeQuestionButton,
                      challengeQuestions === num && styles.challengeQuestionButtonActive,
                    ]}
                    onPress={() => setChallengeQuestions(num)}
                  >
                    <Text
                      style={[
                        styles.challengeQuestionButtonText,
                        challengeQuestions === num && styles.challengeQuestionButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.badge_theme')}</Text>
              <Text style={styles.badgeThemeSubLabel}>
                {i18n.t('user_form.badge_theme_sub')}
              </Text>
              <View style={styles.badgeThemeButtons}>
                <TouchableOpacity
                  style={[
                    styles.badgeThemeButton,
                    badgeTheme === 'space' && styles.badgeThemeButtonActive,
                  ]}
                  onPress={() => setBadgeTheme('space')}
                >
                  <Text style={styles.badgeThemeEmoji}>🚀</Text>
                  <Text
                    style={[
                      styles.badgeThemeButtonText,
                      badgeTheme === 'space' && styles.badgeThemeButtonTextActive,
                    ]}
                  >
                    {i18n.t('user_form.theme_space')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.badgeThemeButton,
                    badgeTheme === 'heroes' && styles.badgeThemeButtonActive,
                  ]}
                  onPress={() => setBadgeTheme('heroes')}
                >
                  <Text style={styles.badgeThemeEmoji}>⚡️</Text>
                  <Text
                    style={[
                      styles.badgeThemeButtonText,
                      badgeTheme === 'heroes' && styles.badgeThemeButtonTextActive,
                    ]}
                  >
                    {i18n.t('user_form.theme_heroes')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.badgeThemeButton,
                    badgeTheme === 'animals' && styles.badgeThemeButtonActive,
                  ]}
                  onPress={() => setBadgeTheme('animals')}
                >
                  <Text style={styles.badgeThemeEmoji}>🐯</Text>
                  <Text
                    style={[
                      styles.badgeThemeButtonText,
                      badgeTheme === 'animals' && styles.badgeThemeButtonTextActive,
                    ]}
                  >
                    {i18n.t('user_form.theme_animals')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>





            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.audio')}</Text>
              <Text style={styles.challengeSubLabel}>
                {i18n.t('user_form.audio_sub')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.timerToggle,
                  voiceEnabled && styles.timerToggleActive,
                  { marginBottom: 12 }
                ]}
                onPress={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? (
                  <Mic size={24} color={AppColors.primary} />
                ) : (
                  <Mic size={24} color={AppColors.textSecondary} />
                )}
                <Text
                  style={[
                    styles.timerToggleText,
                    voiceEnabled && styles.timerToggleTextActive,
                  ]}
                >
                  {voiceEnabled ? i18n.t('user_form.voice_enabled') : i18n.t('user_form.voice_disabled')}
                </Text>
              </TouchableOpacity>

              {voiceEnabled && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, paddingLeft: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.challengeQuestionButton,
                      { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center' },
                      // @ts-ignore - Assuming state voiceGender exists or will be added
                      voiceGender === 'female' && styles.challengeQuestionButtonActive
                    ]}
                    onPress={() => setVoiceGender('female')}
                  >
                    <Text style={{ fontSize: 20 }}>👩</Text>
                    <Text style={[styles.challengeQuestionButtonText, voiceGender === 'female' && styles.challengeQuestionButtonTextActive]}>{i18n.t('user_form.voice_female')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.challengeQuestionButton,
                      { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center' },
                      // @ts-ignore
                      voiceGender === 'male' && styles.challengeQuestionButtonActive
                    ]}
                    onPress={() => setVoiceGender('male')}
                  >
                    <Text style={{ fontSize: 20 }}>👨</Text>
                    <Text style={[styles.challengeQuestionButtonText, voiceGender === 'male' && styles.challengeQuestionButtonTextActive]}>{i18n.t('user_form.voice_male')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.timerToggle,
                  soundEnabled && styles.timerToggleActive,
                ]}
                onPress={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 size={24} color={AppColors.primary} />
                ) : (
                  <VolumeX size={24} color={AppColors.textSecondary} />
                )}
                <Text
                  style={[
                    styles.timerToggleText,
                    soundEnabled && styles.timerToggleTextActive,
                  ]}
                >
                  {soundEnabled ? i18n.t('user_form.sound_enabled') : i18n.t('user_form.sound_disabled')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timerToggle,
                  hapticsEnabled && styles.timerToggleActive,
                  { marginTop: 12 }
                ]}
                onPress={() => setHapticsEnabled(!hapticsEnabled)}
              >
                {hapticsEnabled ? (
                  <Zap size={24} color={AppColors.primary} />
                ) : (
                  <Zap size={24} color={AppColors.textSecondary} />
                )}
                <Text
                  style={[
                    styles.timerToggleText,
                    hapticsEnabled && styles.timerToggleTextActive,
                  ]}
                >
                  {hapticsEnabled ? i18n.t('user_form.haptics_enabled') : i18n.t('user_form.haptics_disabled')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.accessibility')}</Text>
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>{i18n.t('user_form.font')}</Text>
                <Text style={styles.challengeSubLabel}>
                  {i18n.t('user_form.font_sub')}
                </Text>

                <View style={{ flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.timerToggle,
                      fontPreference === 'standard' && styles.timerToggleActive,
                      { paddingVertical: 12 }
                    ]}
                    onPress={() => setFontPreference('standard')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.timerToggleText, fontPreference === 'standard' && styles.timerToggleTextActive]}>
                        {i18n.t('user_form.font_standard')}
                      </Text>
                    </View>
                    {fontPreference === 'standard' && <Text style={{ fontSize: 12 }}>✓</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timerToggle,
                      fontPreference === 'lexend' && styles.timerToggleActive,
                      { paddingVertical: 12 }
                    ]}
                    onPress={() => setFontPreference('lexend')}
                  >
                    <Text style={{ fontSize: 16, fontFamily: 'Lexend', color: fontPreference === 'lexend' ? AppColors.primary : AppColors.textSecondary, marginRight: 10 }}>Abc</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.timerToggleText, fontPreference === 'lexend' && styles.timerToggleTextActive]}>
                        {i18n.t('user_form.font_modern')}
                      </Text>
                    </View>
                    {fontPreference === 'lexend' && <Text style={{ fontSize: 12 }}>✓</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timerToggle,
                      fontPreference === 'opendyslexic' && styles.timerToggleActive,
                      { paddingVertical: 12 }
                    ]}
                    onPress={() => setFontPreference('opendyslexic')}
                  >
                    <Text style={{ fontSize: 16, fontFamily: 'OpenDyslexic', color: fontPreference === 'opendyslexic' ? AppColors.primary : AppColors.textSecondary, marginRight: 10 }}>Abc</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.timerToggleText, fontPreference === 'opendyslexic' && styles.timerToggleTextActive]}>
                        {i18n.t('user_form.font_dys')}
                      </Text>
                    </View>
                    {fontPreference === 'opendyslexic' && <Text style={{ fontSize: 12 }}>✓</Text>}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.timerToggle,
                  zenMode && styles.timerToggleActive,
                  { marginTop: 12 }
                ]}
                onPress={() => setZenMode(!zenMode)}
              >
                <Leaf size={24} color={zenMode ? AppColors.primary : AppColors.textSecondary} />
                <Text
                  style={[
                    styles.timerToggleText,
                    zenMode && styles.timerToggleTextActive,
                  ]}
                >
                  {zenMode ? i18n.t('user_form.zen_mode_on') : i18n.t('user_form.zen_mode_off')}
                </Text>
              </TouchableOpacity>
            </View>



            <View style={styles.section}>
              <Text style={styles.label}>{i18n.t('user_form.timer')}</Text>
              <TouchableOpacity
                style={[
                  styles.timerToggle,
                  timerEnabled && styles.timerToggleActive,
                ]}
                onPress={() => setTimerEnabled(!timerEnabled)}
              >
                <Clock size={24} color={timerEnabled ? AppColors.primary : AppColors.textSecondary} />
                <Text
                  style={[
                    styles.timerToggleText,
                    timerEnabled && styles.timerToggleTextActive,
                  ]}
                >
                  {timerEnabled ? i18n.t('user_form.timer_on') : i18n.t('user_form.timer_off')}
                </Text>
              </TouchableOpacity>

              {timerEnabled && (
                <View style={styles.timerConfig}>
                  <View style={styles.timerModeSection}>
                    <Text style={styles.timerSubLabel}>{i18n.t('user_form.display_mode')}</Text>
                    <View style={styles.timerModeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.timerModeButton,
                          timerDisplayMode === 'bar' && styles.timerModeButtonActive,
                        ]}
                        onPress={() => setTimerDisplayMode('bar')}
                      >
                        <Text
                          style={[
                            styles.timerModeButtonText,
                            timerDisplayMode === 'bar' && styles.timerModeButtonTextActive,
                          ]}
                        >
                          {i18n.t('user_form.bar')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.timerModeButton,
                          timerDisplayMode === 'chronometer' && styles.timerModeButtonActive,
                        ]}
                        onPress={() => setTimerDisplayMode('chronometer')}
                      >
                        <Text
                          style={[
                            styles.timerModeButtonText,
                            timerDisplayMode === 'chronometer' && styles.timerModeButtonTextActive,
                          ]}
                        >
                          {i18n.t('user_form.chronometer')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.timerDurationSection}>
                    <Text style={styles.timerSubLabel}>
                      {i18n.t('user_form.duration', { count: timerDuration })}
                    </Text>
                    <View style={styles.timerDurationButtons}>
                      {[5, 10, 15, 20, 30].map((duration) => (
                        <TouchableOpacity
                          key={duration}
                          style={[
                            styles.timerDurationButton,
                            timerDuration === duration && styles.timerDurationButtonActive,
                          ]}
                          onPress={() => setTimerDuration(duration)}
                        >
                          <Text
                            style={[
                              styles.timerDurationButtonText,
                              timerDuration === duration && styles.timerDurationButtonTextActive,
                            ]}
                          >
                            {duration}s
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Save size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{i18n.t('user_form.save')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.avatarModalOverlay}>
          <View style={styles.avatarModalContent}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>{i18n.t('user_form.choose_avatar')}</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <X size={24} color={AppColors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    avatarId === avatar.id && styles.avatarItemSelected,
                  ]}
                  onPress={() => {
                    setAvatarId(avatar.id);
                    setPhotoUri(undefined); // Clear photo when selecting avatar
                    setShowAvatarModal(false);
                  }}
                >
                  <Text style={styles.avatarEmoji}>{avatar.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.avatarModalActions}>
              <TouchableOpacity
                style={styles.avatarModalButton}
                onPress={() => {
                  setShowAvatarModal(false);
                  pickImage();
                }}
              >
                <ImageIcon size={20} color={AppColors.primary} />
                <Text style={styles.avatarModalButtonText}>{i18n.t('user_form.photo_gallery')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarModalButton}
                onPress={() => {
                  setShowAvatarModal(false);
                  takePhoto();
                }}
              >
                <Camera size={20} color={AppColors.primary} />
                <Text style={styles.avatarModalButtonText}>{i18n.t('user_form.photo_camera')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  keyboardView: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.borderLight,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: AppColors.primary,
    borderStyle: 'dashed' as const,
  },
  photoEmoji: {
    fontSize: 64,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.primary,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: AppColors.text,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  genderButtonActive: {
    backgroundColor: AppColors.primary + '20',
    borderColor: AppColors.primary,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  genderButtonTextActive: {
    color: AppColors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  timerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  timerToggleActive: {
    backgroundColor: AppColors.primary + '10',
    borderColor: AppColors.primary,
  },
  timerToggleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  timerToggleTextActive: {
    color: AppColors.primary,
  },
  timerConfig: {
    marginTop: 16,
    gap: 16,
  },
  timerModeSection: {
    gap: 8,
  },
  timerSubLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.text,
    marginBottom: 4,
  },
  timerModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timerModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  timerModeButtonActive: {
    backgroundColor: AppColors.primary + '20',
    borderColor: AppColors.primary,
  },
  timerModeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  timerModeButtonTextActive: {
    color: AppColors.primary,
  },
  timerDurationSection: {
    gap: 8,
  },
  timerDurationButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timerDurationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  timerDurationButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  timerDurationButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  timerDurationButtonTextActive: {
    color: '#FFFFFF',
  },
  challengeSubLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  challengeCurrentValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  challengeQuestionsButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  challengeQuestionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.border,
    minWidth: 50,
    alignItems: 'center',
  },
  challengeQuestionButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  challengeQuestionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  challengeQuestionButtonTextActive: {
    color: '#FFFFFF',
  },
  badgeThemeSubLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  badgeThemeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeThemeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    gap: 4,
  },
  badgeThemeButtonActive: {
    backgroundColor: AppColors.primary + '20',
    borderColor: AppColors.primary,
  },
  badgeThemeEmoji: {
    fontSize: 28,
  },
  badgeThemeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  badgeThemeButtonTextActive: {
    color: AppColors.primary,
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  avatarModalContent: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatarItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarItemSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + '20',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  avatarModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
    backgroundColor: 'transparent',
  },
  avatarModalButtonText: {
    color: AppColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  accessoryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  accessoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  accessoryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
