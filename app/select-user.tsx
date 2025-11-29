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
  const { users, selectUser } = useApp();

  console.log('🎭 SelectUserScreen - Users available:', users.length);
  users.forEach(u => console.log('  - User:', u.firstName, u.id));

  const handleSelectUser = async (userId: string) => {
    console.log('👉 Selecting user:', userId);
    await selectUser(userId);
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
                <Text style={styles.userName}>{user.firstName}</Text>
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
                <Plus size={48} color={AppColors.primary} />
              </View>
              <Text style={styles.addText}>Ajouter</Text>
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
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  userCard: {
    width: CARD_WIDTH,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.borderLight,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 4,
  },
  userAge: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  userGrade: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  addCard: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: AppColors.primary,
  },
  addIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.primary,
  },
});
