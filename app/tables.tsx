import { useRouter } from 'expo-router';
import { Home, Star } from 'lucide-react-native';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, NumberColors } from '@/constants/colors';
import { MULTIPLICATION_TABLES } from '@/constants/tables';
import { useApp } from '@/contexts/AppContext';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/utils/i18n';

export default function TablesScreen() {
  const router = useRouter();
  const { progress } = useApp();
  const { width, height } = useWindowDimensions();

  // Tablet Optimization: Dynamic columns
  const getNumColumns = () => {
    if (width > 768) return 4; // iPad/Tablet
    if (width >= 600) return 3; // Large phones/Small tablets
    return 2; // Standard phones
  };

  const numColumns = getNumColumns();
  const gap = 10;
  const padding = 12;
  const availableWidth = width - (padding * 2) - (gap * (numColumns - 1));
  const cardWidth = availableWidth / numColumns;

  // Dynamic card height: fit 5 rows on screen (10 tables / 2 columns = 5 rows)
  // Account for header (~72px), SafeArea (~50px top), padding
  const headerHeight = 72;
  const safeAreaTop = 50;
  const totalPadding = padding * 2 + gap * 4; // 5 rows = 4 gaps
  const availableHeight = height - headerHeight - safeAreaTop - totalPadding;
  const numRows = Math.ceil(MULTIPLICATION_TABLES.length / numColumns);

  // Calculate optimal card height to fit all cards without scrolling if possible
  const minCardHeight = 85; // Minimum to show content properly
  const maxCardHeight = 120;
  const calculatedCardHeight = Math.floor(availableHeight / numRows);
  const cardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, calculatedCardHeight));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return AppColors.easy;
      case 'medium':
        return AppColors.medium;
      case 'hard':
        return AppColors.hard;
      default:
        return AppColors.primary;
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#14532d'; // darker green
      case 'medium':
        return '#78350f'; // darker amber
      case 'hard':
        return '#7f1d1d'; // darker red
      default:
        return AppColors.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    return i18n.t(`difficulty.${difficulty}`);
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.dismissAll()}
            testID="home-button"
          >
            <Home size={24} color={AppColors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{i18n.t('tables_selection.title')}</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: padding }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { gap }]}>
            {MULTIPLICATION_TABLES.map(table => {
              const tableProgress = progress.find(
                p => p.tableNumber === table.number
              );
              const stars = tableProgress?.starsEarned || 0;
              const isCompleted = tableProgress?.completed || false;

              return (
                <TouchableOpacity
                  key={table.number}
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      borderColor: isCompleted ? AppColors.success : NumberColors[
                        table.number as keyof typeof NumberColors
                      ],
                    },
                    isCompleted && styles.cardCompleted,
                  ]}
                  onPress={() =>
                    router.push(`/discovery/${table.number}` as any)
                  }
                  testID={`table-${table.number}`}
                >
                  <View style={[styles.cardContent, { height: cardHeight - 4 }]}>
                    <ThemedText
                      style={[
                        styles.tableNumber,
                        {
                          color:
                            NumberColors[
                            table.number as keyof typeof NumberColors
                            ],
                          fontSize: cardHeight < 95 ? 24 : cardHeight < 100 ? 28 : 32,
                        },
                      ]}
                    >
                      {table.number}
                    </ThemedText>

                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor:
                            getDifficultyColor(table.difficulty) + '20',
                          paddingVertical: cardHeight < 95 ? 1 : 2,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.difficultyText,
                          {
                            color: getDifficultyTextColor(table.difficulty),
                            fontSize: cardHeight < 95 ? 8 : 9,
                          },
                        ]}
                      >
                        {getDifficultyLabel(table.difficulty)}
                      </ThemedText>
                    </View>

                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4].map(starIndex => (
                        <Star
                          key={starIndex}
                          size={cardHeight < 95 ? 9 : 11}
                          color={
                            starIndex <= stars
                              ? AppColors.warning
                              : '#AAAAAA'
                          }
                          fill={
                            starIndex <= stars
                              ? AppColors.warning
                              : 'transparent'
                          }
                        />
                      ))}
                    </View>

                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <ThemedText style={styles.completedText}>✓</ThemedText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  card: {
    // width set dynamically
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'visible',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompleted: {
    borderWidth: 3,
    borderColor: AppColors.success,
    shadowColor: AppColors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tableNumber: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 2,
  },
  cardContent: {
    padding: 6,
    paddingTop: 6,
    paddingBottom: 18, // Space for absolutely positioned stars
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    position: 'relative',
  },
  difficultyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'center',
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '600' as const,
  },
  starsContainer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 1,
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: AppColors.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: AppColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
});
