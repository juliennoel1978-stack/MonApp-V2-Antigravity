import { useRouter } from 'expo-router';
import { Volume2, VolumeX, Clock, User } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetProgress } = useApp();

  const fontSizes = [
    { value: 'normal' as const, label: 'Normal' },
    { value: 'large' as const, label: 'Grand' },
    { value: 'xlarge' as const, label: 'Très Grand' },
  ];

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                {settings.voiceEnabled ? (
                  <Volume2 size={24} color={AppColors.primary} />
                ) : (
                  <VolumeX size={24} color={AppColors.textSecondary} />
                )}
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Voix-off</Text>
                  <Text style={styles.settingDescription}>
                    Activer les instructions vocales
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.voiceEnabled}
                onValueChange={value =>
                  updateSettings({ voiceEnabled: value })
                }
                trackColor={{
                  false: AppColors.borderLight,
                  true: AppColors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.voiceEnabled && (
              <View style={styles.voiceSettingContainer}>
                <View style={styles.voiceSettingHeader}>
                  <User size={24} color={AppColors.primary} />
                  <View style={styles.voiceTextContainer}>
                    <Text style={styles.voiceTitle}>Type de voix :</Text>
                    <Text style={styles.voiceDescription}>
                      Choisir la voix de l&apos;assistant
                    </Text>
                  </View>
                </View>
                <View style={styles.voiceButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      settings.voiceGender === 'female' &&
                        styles.voiceButtonActive,
                    ]}
                    onPress={() => updateSettings({ voiceGender: 'female' })}
                  >
                    <Text
                      style={[
                        styles.voiceButtonText,
                        settings.voiceGender === 'female' &&
                          styles.voiceButtonTextActive,
                      ]}
                    >
                      Féminine
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      settings.voiceGender === 'male' &&
                        styles.voiceButtonActive,
                    ]}
                    onPress={() => updateSettings({ voiceGender: 'male' })}
                  >
                    <Text
                      style={[
                        styles.voiceButtonText,
                        settings.voiceGender === 'male' &&
                          styles.voiceButtonTextActive,
                      ]}
                    >
                      Masculine
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibilité</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>Aa</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Taille du texte</Text>
                  <Text style={styles.settingDescription}>
                    Ajuster la taille de la police
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.fontSizeButtons}>
              {fontSizes.map(size => (
                <TouchableOpacity
                  key={size.value}
                  style={[
                    styles.fontSizeButton,
                    settings.fontSize === size.value &&
                      styles.fontSizeButtonActive,
                  ]}
                  onPress={() => updateSettings({ fontSize: size.value })}
                >
                  <Text
                    style={[
                      styles.fontSizeButtonText,
                      settings.fontSize === size.value &&
                        styles.fontSizeButtonTextActive,
                    ]}
                  >
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode de jeu</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Clock size={24} color={AppColors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Chronomètre</Text>
                  <Text style={styles.settingDescription}>
                    Activer le mode challenge avec chrono
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.timerEnabled}
                onValueChange={value =>
                  updateSettings({ timerEnabled: value })
                }
                trackColor={{
                  false: AppColors.borderLight,
                  true: AppColors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.timerEnabled && (
              <View style={styles.timerConfig}>
                <Text style={styles.timerLabel}>
                  Durée du chronomètre : {settings.timerDuration === 0 ? 'Désactivé' : `${settings.timerDuration} sec`}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={30}
                  step={5}
                  value={settings.timerDuration}
                  onValueChange={value =>
                    updateSettings({ timerDuration: value })
                  }
                  minimumTrackTintColor={AppColors.primary}
                  maximumTrackTintColor={AppColors.borderLight}
                  thumbTintColor={AppColors.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>0</Text>
                  <Text style={styles.sliderLabelText}>5</Text>
                  <Text style={styles.sliderLabelText}>10</Text>
                  <Text style={styles.sliderLabelText}>15</Text>
                  <Text style={styles.sliderLabelText}>20</Text>
                  <Text style={styles.sliderLabelText}>25</Text>
                  <Text style={styles.sliderLabelText}>30</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (confirm('Êtes-vous sûr de vouloir réinitialiser tous vos scores et votre progression ?')) {
                  resetProgress();
                }
              } else {
                Alert.alert(
                  'Réinitialiser la progression',
                  'Êtes-vous sûr de vouloir réinitialiser tous vos scores et votre progression ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Réinitialiser', style: 'destructive', onPress: resetProgress },
                  ]
                );
              }
            }}
          >
            <Text style={styles.resetButtonText}>Réinitialiser la progression</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  settingIcon: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
  },
  settingTextContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
    marginBottom: 2,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  settingDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  voiceSettingContainer: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  voiceTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  voiceButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  voiceButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: AppColors.borderLight,
    minWidth: 120,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: AppColors.primary,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  voiceButtonTextActive: {
    color: '#FFFFFF',
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  fontSizeButtonActive: {
    backgroundColor: AppColors.primary + '20',
    borderColor: AppColors.primary,
  },
  fontSizeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.textSecondary,
  },
  fontSizeButtonTextActive: {
    color: AppColors.primary,
  },
  resetButton: {
    backgroundColor: AppColors.error,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  timerConfig: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500' as const,
  },
});
