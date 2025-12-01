import { useRouter } from 'expo-router';
import { Plus, ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function SelectUserScreen() {
  const router = useRouter();
  const { users, selectUser, clearCurrentUser } = useApp();

  console.log('🎭 SelectUserScreen - Users available:', users.length);
  users.forEach(u => console.log('  - User:', u.firstName, u.id));

  const handleSelectUser = async (userId: string) => {
    console.log('👉 Selecting user:', userId);
    await selectUser(userId);
    router.replace('/' as any);
  };

  const handleGuestMode = async () => {
    console.log('👉 Selecting guest mode');
    await clearCurrentUser();
    router.replace('/' as any);
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color={AppColors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>Qui es-tu ?</Text>
          <Text style={styles.subtitle}>Choisis ton profil</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {users.map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => handleSelectUser(user.id)}
                testID={`user-${user.id}`}
              >
                <View style={styles.avatarContainer}>
                  {user.photoUri ? (
                    <Image source={{ uri: user.photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarEmoji}>
                        {user.gender === 'boy' ? '👦' : '👧'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text 
                  style={styles.userName} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit
                >
                  {user.firstName}
                </Text>
                <Text style={styles.userAge}>{user.age} ans</Text>
                <Text style={styles.userGrade}>{user.grade}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.userCard, styles.addCard]}
              onPress={() => router.push('/user-form' as any)}
              testID="add-user"
            >
              <View style={styles.addIconContainer}>
                <Plus size={40} color={AppColors.primary} />
              </View>
              <Text style={styles.addText}>Ajouter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userCard, styles.guestCard]}
              onPress={handleGuestMode}
              testID="guest-mode"
            >
              <View style={[styles.addIconContainer, styles.guestIconContainer]}>
                <Text style={{ fontSize: 32 }}>🕵️</Text>
              </View>
              <Text style={[styles.addText, styles.guestText]}>Mode Invité</Text>
            </TouchableOpacity>
          </View>
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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  userCard: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.borderLight,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  userAge: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 0,
  },
  userGrade: {
    fontSize: 12,
    color: AppColors.textSecondary,
    display: 'none', // Hide grade to save space as requested to keep it compact? Or just keep it small.
  },
  addCard: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.primary,
  },
  addIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: AppColors.primary,
  },
  guestCard: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  guestIconContainer: {
    backgroundColor: AppColors.textSecondary + '10',
  },
  guestText: {
    color: AppColors.textSecondary,
  },
});
