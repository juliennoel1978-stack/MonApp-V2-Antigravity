import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { AppColors } from '@/constants/colors';

export default function AssistantScreen() {
  const router = useRouter();

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/' as any)}
            testID="home-button"
          >
            <Home size={24} color={AppColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ton Assistant Magique</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.videoBlock}>
            <Text style={styles.videoTitle}>
              Construire les tables de multiplication de 1 à 5
            </Text>
            <View style={styles.videoContainer}>
              <WebView
                source={{
                  uri: 'https://lesfondamentaux.reseau-canope.fr/embed/video/construire-les-tables-de-multiplication-de-1-a-5',
                }}
                style={styles.webview}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          </View>

          <View style={styles.videoBlock}>
            <Text style={styles.videoTitle}>
              Construire les tables de multiplication de 6 à 9
            </Text>
            <View style={styles.videoContainer}>
              <WebView
                source={{
                  uri: 'https://lesfondamentaux.reseau-canope.fr/embed/video/construire-les-tables-de-multiplication-de-6-a-9',
                }}
                style={styles.webview}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  videoBlock: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
