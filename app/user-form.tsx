import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, Save, X, Clock } from 'lucide-react-native';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function UserFormScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { addUser, updateUser, users } = useApp();
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(15);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'bar' | 'chronometer'>('bar');
  const firstNameRef = React.useRef<TextInput>(null);
  const ageRef = React.useRef<TextInput>(null);
  const gradeRef = React.useRef<TextInput>(null);

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
      }
    }
  }, [userId, users]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert('Permission d\'accès à la galerie requise');
      } else {
        Alert.alert('Permission requise', 'Permission d\'accès à la galerie requise');
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
        window.alert('Permission d\'accès à la caméra requise');
      } else {
        Alert.alert('Permission requise', 'Permission d\'accès à la caméra requise');
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
        window.alert('Le prénom est requis');
      } else {
        Alert.alert('Erreur', 'Le prénom est requis');
      }
      return;
    }

    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert('L\'âge doit être un nombre valide');
      } else {
        Alert.alert('Erreur', 'L\'âge doit être un nombre valide');
      }
      return;
    }

    if (!grade.trim()) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert('La classe est requise');
      } else {
        Alert.alert('Erreur', 'La classe est requise');
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
          timerSettings,
        });
      } else {
        await addUser({
          firstName: firstName.trim(),
          gender,
          age: Number(age),
          grade: grade.trim(),
          photoUri,
          timerSettings,
        });
      }

      router.back();
    } catch (error) {
      console.error('Error adding user:', error);
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert('Erreur lors de l\'ajout de l\'utilisateur');
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'ajout de l\'utilisateur');
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
          <Text style={styles.title}>{isEditing ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</Text>
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
              onPress={pickImage}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
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
                onPress={pickImage}
              >
                <ImageIcon size={20} color={AppColors.primary} />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePhoto}
              >
                <Camera size={20} color={AppColors.primary} />
                <Text style={styles.photoButtonText}>Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              ref={firstNameRef}
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ex: Marie"
              placeholderTextColor={AppColors.textSecondary}
              returnKeyType="next"
              onSubmitEditing={() => ageRef.current?.focus()}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Genre *</Text>
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
                  👦 Garçon
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
                  👧 Fille
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Âge *</Text>
            <TextInput
              ref={ageRef}
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Ex: 8"
              placeholderTextColor={AppColors.textSecondary}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => gradeRef.current?.focus()}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Classe *</Text>
            <TextInput
              ref={gradeRef}
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              placeholder="Ex: CE2"
              placeholderTextColor={AppColors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSave();
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Chronomètre</Text>
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
                {timerEnabled ? 'Activé' : 'Désactivé'}
              </Text>
            </TouchableOpacity>

            {timerEnabled && (
              <View style={styles.timerConfig}>
                <View style={styles.timerModeSection}>
                  <Text style={styles.timerSubLabel}>Mode d&apos;affichage</Text>
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
                        📊 Barre
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
                        ⏱️ Chrono
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timerDurationSection}>
                  <Text style={styles.timerSubLabel}>
                    Durée : {timerDuration} sec
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
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
});
