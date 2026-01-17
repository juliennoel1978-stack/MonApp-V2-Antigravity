import { useRouter, useLocalSearchParams } from 'expo-router';
import { Home, ArrowRight, ArrowLeft, Volume2, X, Check, Eye } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions, // Restored for StyleSheet use
  Modal, // Restored
  PanResponder, // Restored
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, NumberColors } from '@/constants/colors';
import { getTableByNumber } from '@/constants/tables';
import { ThemedText } from '@/components/ThemedText';
import { useAudio } from '@/hooks/useAudio';
import i18n from '@/utils/i18n';

// Lazy load modal pour réduire le bundle initial
const TableDetailModal = lazy(() => import('@/components/TableDetailModal'));

// Keep this for static styles usage, while component uses hook for dynamic updates
const { width } = Dimensions.get('window');

function getTipExamples(tableNumber: number): string[] {
  // All examples use consistent ORDER: [Table] × [Multiplier]
  switch (tableNumber) {
    case 1:
      return [
        '1 × 5 = 5',
        '1 × 9 = 9'
      ];
    case 2:
      return [
        '2 × 3 = 6 (3 + 3)',
        '2 × 5 = 10 (5 + 5)'
      ];
    case 3:
      return [
        '3 × 3 = 9 (3 + 3 + 3)',
        '3 × 4 = 12 (4 + 4 + 4)'
      ];
    case 4:
      return [
        '4 × 3 = 12 (double de 6)',
        '4 × 5 = 20 (double de 10)'
      ];
    case 5:
      return [
        '5 × 3 = 15 ✨',
        '5 × 6 = 30 ✨'
      ];
    case 6:
      return [
        '6 × 4 = 24 (20 + 4)',
        '6 × 7 = 42 (35 + 7)'
      ];
    case 7:
      return [
        '7 × 3 = 21 🎯',
        '7 × 5 = 35 🎯'
      ];
    case 8:
      return [
        '8 × 3 = 24 (double de 12)',
        '8 × 5 = 40 (double de 20)'
      ];
    case 9:
      return [
        '9 × 2 = 18 (2+8=10→1+8=9)',
        '9 × 5 = 45 (4+5=9)'
      ];
    case 10:
      return [
        '10 × 4 = 40 (4 + 0)',
        '10 × 7 = 70 (7 + 0)'
      ];
    default:
      return [
        `${tableNumber} × 2 = ${tableNumber * 2}`,
        `${tableNumber} × 5 = ${tableNumber * 5}`
      ];
  }
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const { tableNumber, step } = useLocalSearchParams();
  const table = getTableByNumber(Number(tableNumber));
  const [currentStep, setCurrentStep] = useState(step ? Number(step) : 0);
  const currentStepRef = useRef(0);
  const [homeClickCount, setHomeClickCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedMultiplication, setSelectedMultiplication] = useState<{ multiplier: number; result: number } | null>(null);
  const [clickedMultiplications, setClickedMultiplications] = useState<Set<number>>(new Set());
  const [showTableDetail, setShowTableDetail] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  // soundRef and modalSoundRef removed
  const isMounted = useRef(true);

  const { speak, stopSpeech } = useAudio();

  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;

  // Dynamic columns calculation (legacy, not used for counting grid anymore)
  const numColumns = isTablet ? 5 : 3;
  const gap = 8;
  const containerPadding = 8;
  const effectiveWidth = Math.min(width, 800);
  const itemWidth = (effectiveWidth - (containerPadding * 2) - (gap * (numColumns - 1))) / numColumns;

  // Dynamic card height calculation for "Compte avec moi" grid
  // We need all 10 cards (5 rows × 2 columns) to fit without scrolling
  // Layout: Header(60) + Title(50) + Grid + Footer(70) + SafeArea(60)
  const headerHeight = 60;
  const footerHeight = 70;
  const titleHeight = 50; // Just title, no subtitle for counting step
  const safeAreaPadding = 60;
  const gridGaps = 4 * 4; // 4px gap × 4 gaps (between 5 rows)
  const gridPadding = 16; // Horizontal padding
  const availableGridHeight = height - headerHeight - footerHeight - titleHeight - safeAreaPadding - gridGaps - gridPadding;
  const dynamicCardHeight = Math.max(45, Math.floor(availableGridHeight / 5)); // 5 rows, min 45px

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only activate if horizontal swipe is dominant and significant
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderEnd: (_, gestureState) => {
        const step = currentStepRef.current;
        const totalSteps = 4;
        const swipeThreshold = 50;

        if (gestureState.dx > swipeThreshold && step > 0) {
          setCurrentStep(step - 1);
        } else if (gestureState.dx < -swipeThreshold && step < totalSteps - 1) {
          setCurrentStep(step + 1);
        }
      },
    })
  ).current;

  // Sync step from params when it changes
  useEffect(() => {
    if (step !== undefined) {
      setCurrentStep(Number(step));
    }
  }, [step]);


  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    currentStepRef.current = currentStep;
    animateIn();
  }, [currentStep, animateIn]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopSpeech();
    };
  }, []);

  const speakMultiplication = useCallback(async (tableNum: number, multiplier: number, result: number) => {
    const text = `${tableNum} fois ${multiplier} égale ${result}`;
    speak(text);
  }, [speak]);

  const closeModal = useCallback(() => {
    Animated.timing(modalScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedMultiplication(null);
    });

    stopSpeech();
  }, [modalScaleAnim, stopSpeech]);



  const handleMultiplicationPress = useCallback((multiplier: number, result: number) => {
    setSelectedMultiplication({ multiplier, result });
    setClickedMultiplications(prev => new Set(prev).add(multiplier));

    modalScaleAnim.setValue(0);
    Animated.spring(modalScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    if (table) {
      speakMultiplication(table.number, multiplier, result);
    }
  }, [table, modalScaleAnim, speakMultiplication]);



  const speakTable = async () => {
    if (!table) return;

    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    // Construct the full text for continuous offline reading
    const speechTexts: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const result = table.number * i;
      speechTexts.push(`${table.number} fois ${i} égale ${result}`);
    }
    const fullText = speechTexts.join('. ');

    speak(fullText, {
      onDone: () => setIsPlayingAudio(false),
      onStopped: () => setIsPlayingAudio(false),
    });
  };

  if (!table) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText style={styles.errorText}>{i18n.t('discovery.table_not_found')}</ThemedText>
      </SafeAreaView>
    );
  }

  const tableColor =
    NumberColors[table.number as keyof typeof NumberColors];

  const steps = [
    {
      title: i18n.t('practice.discovery.title', { number: table.number }),
      content: i18n.t(`tables.${table.number}.story`),
      visual: (
        <TouchableOpacity
          style={[styles.visualContainer, { backgroundColor: tableColor + '20' }]}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.themeEmoji}>
            {i18n.t(`tables.${table.number}.theme_emoji`)}
          </ThemedText>
          <ThemedText style={[styles.bigNumber, { color: tableColor }]}>
            {table.number}
          </ThemedText>
          <ThemedText style={styles.visualText}>
            {i18n.t(`tables.${table.number}.theme_name`)}
          </ThemedText>
        </TouchableOpacity>
      ),
    },
    {
      title: i18n.t(`tables.${table.number}.tip_title`),
      content: '', // Content is shown in the visual to avoid duplication
      visual: (
        <View style={styles.tipContainer}>
          <ThemedText style={styles.tipEmoji}>
            {i18n.t(`tables.${table.number}.theme_emoji`)} 💡
          </ThemedText>
          <ThemedText style={styles.tipText}>
            {i18n.t(`tables.${table.number}.tip`)}
          </ThemedText>
          <View style={styles.tipExamplesContainer}>
            <View style={[styles.tipExampleCard, { borderColor: tableColor }]}>
              <ThemedText
                style={[styles.tipExampleText, { color: tableColor }]}
                numberOfLines={3}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {i18n.t(`tables.${table.number}.example`)}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewTableButton, { borderColor: tableColor }]}
            onPress={() => setShowTableDetail(true)}
          >
            <Eye size={16} color={tableColor} />
            <ThemedText style={[styles.viewTableButtonText, { color: tableColor }]}>
              {i18n.t('practice.discovery.view_full_table')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: i18n.t('practice.discovery.count_with_me'),
      content: '', // No subtitle to maximize grid space
      visual: (
        <View style={styles.countingContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
            const result = table.number * i;
            const isClicked = clickedMultiplications.has(i);
            // Dynamic font sizes based on card height
            const numberFontSize = Math.max(18, Math.min(28, Math.floor(dynamicCardHeight * 0.35)));
            const labelFontSize = Math.max(10, Math.min(14, Math.floor(dynamicCardHeight * 0.16)));
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.countingItem,
                  {
                    height: dynamicCardHeight,
                    backgroundColor: isClicked ? tableColor : tableColor + '20',
                    borderColor: isClicked ? tableColor : 'transparent',
                  },
                ]}
                onPress={() => handleMultiplicationPress(i, result)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.countingNumber,
                    {
                      color: isClicked ? '#FFFFFF' : tableColor,
                      fontSize: numberFontSize,
                    }
                  ]}
                >
                  {result}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.countingLabel,
                    {
                      color: isClicked ? '#FFFFFF' : AppColors.textSecondary,
                      fontSize: labelFontSize,
                    }
                  ]}
                >
                  {table.number} × {i}
                </ThemedText>
                {isClicked && (
                  <View style={styles.checkmarkBadge}>
                    <Check size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ),
    },
    {
      title: i18n.t('practice.discovery.intro_title'),
      content: i18n.t('practice.discovery.intro_subtitle'),
      visual: (
        <View style={styles.readyContainer}>
          <ThemedText style={styles.readyEmoji}>🚀 🌟</ThemedText>
          <ThemedText style={styles.readyTitle}>{i18n.t('practice.discovery.intro_title')}</ThemedText>
          <ThemedText style={styles.encouragementText}>{i18n.t('practice.discovery.intro_card_message')}</ThemedText>
          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: tableColor }]}
            onPress={() => router.push(`/practice/${table.number}` as any)}
          >
            <ThemedText style={styles.practiceButtonText}>{i18n.t('practice.discovery.start_quiz')}</ThemedText>
            <ArrowRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleHomePress = () => {
    if (homeClickCount === 0) {
      setHomeClickCount(1);
      router.push('/tables');
      setTimeout(() => setHomeClickCount(0), 2000);
    } else {
      setHomeClickCount(0);
      router.dismissAll();
    }
  };



  return (
    <View style={styles.backgroundContainer}>
      <TableDetailModal
        visible={showTableDetail}
        tableNumber={table.number}
        onClose={() => setShowTableDetail(false)}
      />

      <Modal
        visible={selectedMultiplication !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: tableColor + '15',
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <X size={28} color={AppColors.text} />
            </TouchableOpacity>

            {selectedMultiplication && table && (
              <View style={styles.modalInner}>
                <ThemedText style={[styles.modalNumber, { color: tableColor }]}>
                  {selectedMultiplication.result}
                </ThemedText>
                <ThemedText style={[styles.modalEquation, { color: tableColor }]}>
                  {table.number} × {selectedMultiplication.multiplier} = {selectedMultiplication.result}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.repeatButton, { backgroundColor: tableColor }]}
                  onPress={() => speakMultiplication(table.number, selectedMultiplication.multiplier, selectedMultiplication.result)}
                >
                  <Volume2 size={24} color="#FFFFFF" />
                  <ThemedText style={styles.repeatButtonText}>{i18n.t('practice.discovery.listen_again')}</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHomePress}
            testID="back-button"
          >
            <Home size={24} color={AppColors.primary} />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStep ? tableColor : AppColors.borderLight,
                    width: index === currentStep ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.audioButton,
              isPlayingAudio && styles.audioButtonActive,
            ]}
            onPress={currentStep === 2 ? speakTable : undefined}
            disabled={currentStep !== 2}
            testID="audio-button"
          >
            <Volume2
              size={24}
              color={currentStep === 2 ? (isPlayingAudio ? AppColors.primary : AppColors.text) : AppColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                maxWidth: 800,
                alignSelf: 'center',
                width: '100%',
              },
            ]}
          >
            <View style={styles.content}>
              <ThemedText style={styles.stepTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
                {currentStepData.title}
              </ThemedText>
              {currentStepData.content ? (
                <ThemedText style={styles.stepContent} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {currentStepData.content}
                </ThemedText>
              ) : null}

              {currentStepData.visual}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => setCurrentStep(currentStep - 1)}
              testID="prev-button"
            >
              <ArrowLeft size={20} color={AppColors.text} />
              <ThemedText style={styles.navButtonText}>{i18n.t('practice.discovery.previous')}</ThemedText>
            </TouchableOpacity>
          )}

          {currentStep < steps.length - 1 && (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                { backgroundColor: tableColor },
                currentStep === 0 && styles.nextButtonFull,
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              testID="next-button"
            >
              <ThemedText style={styles.nextButtonText}>{i18n.t('practice.discovery.next')}</ThemedText>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
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
  errorText: {
    fontSize: 18,
    color: AppColors.error,
    textAlign: 'center',
    marginTop: 40,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonActive: {
    backgroundColor: AppColors.primary + '20',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 20, // Reduced from 24
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 4, // Reduced
    paddingTop: 4,
  },
  stepContent: {
    fontSize: 14, // Reduced from 16
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  visualContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  visualText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  tipContainer: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tipEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 15,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
    lineHeight: 22,
    marginBottom: 12,
  },
  tipExamplesContainer: {
    width: '100%',
    gap: 6,
  },
  tipExampleCard: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
  },
  tipExampleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'center',
    width: '100%',
  },
  themeEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  viewTableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  viewTableButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  countingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 4,
    gap: 4,
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  countingItem: {
    // Width: 48% for 2 columns, height is set dynamically in the component
    width: '48.5%',
    padding: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  countingNumber: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 0,
  },
  countingLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
  },
  readyContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  readyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  practiceButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  prevButton: {
    backgroundColor: AppColors.surfaceLight,
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: AppColors.text,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: width - 60,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalInner: {
    alignItems: 'center',
    marginTop: 20,
  },
  modalNumber: {
    fontSize: 120,
    fontWeight: 'bold' as const,
    marginBottom: 24,
  },
  modalEquation: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    marginBottom: 32,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  repeatButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phase2Content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  phase2Title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  phase2QuestionCard: {
    backgroundColor: AppColors.surface,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
  },
  answerInputContainer: {
    marginBottom: 12,
  },
  answerInput: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    textAlign: 'center',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: AppColors.surface,
    minHeight: 70,
  },
  validateButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  validateButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  numpadContainer: {
    gap: 12,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numpadButton: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numpadText: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: AppColors.text,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: AppColors.success,
  },
  resultContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 40,
  },
  resultCard: {
    backgroundColor: AppColors.surface,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: width - 48,
    borderWidth: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  resultScore: {
    fontSize: 64,
    fontWeight: 'bold' as const,
    color: AppColors.primary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 18,
    color: AppColors.textSecondary,
    marginBottom: 24,
    fontWeight: '600' as const,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  encouragement: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  intermediateText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  intermediateDescription: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  feedbackContainer: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  backToTablesButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backToTablesText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
});
