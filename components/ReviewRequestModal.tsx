import React, { useEffect, useRef } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { AppColors } from '@/constants/colors';
import i18n from '@/utils/i18n';
import {
    markReviewCompleted,
    markReviewDeclined,
    requestNativeReview,
} from '@/utils/storeReviewHelper';

const { width } = Dimensions.get('window');

interface ReviewRequestModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ReviewRequestModal = ({ visible, onClose }: ReviewRequestModalProps) => {
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            opacityAnim.setValue(0);
            scaleAnim.setValue(0.8);
        }
    }, [visible, opacityAnim, scaleAnim]);

    const handleRate = async () => {
        await markReviewCompleted();
        await requestNativeReview();
        onClose();
    };

    const handleLater = async () => {
        await markReviewDeclined();
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
                <Animated.View
                    style={[
                        styles.card,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    {/* Star Icon */}
                    <View style={styles.iconContainer}>
                        <ThemedText style={styles.icon}>⭐</ThemedText>
                    </View>

                    {/* Title */}
                    <ThemedText style={styles.title}>
                        {i18n.t('review.title')}
                    </ThemedText>

                    {/* Message */}
                    <ThemedText style={styles.message}>
                        {i18n.t('review.message')}
                    </ThemedText>

                    {/* Subtitle */}
                    <ThemedText style={styles.subtitle}>
                        {i18n.t('review.subtitle')}
                    </ThemedText>

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.rateButton}
                            onPress={handleRate}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.rateButtonText}>
                                {i18n.t('review.rate_button')}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.laterButton}
                            onPress={handleLater}
                            activeOpacity={0.8}
                        >
                            <ThemedText style={styles.laterButtonText}>
                                {i18n.t('review.later_button')}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: AppColors.surface,
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
        width: Math.min(width - 48, 340),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: AppColors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        opacity: 0.8,
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
    },
    rateButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
    },
    rateButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    laterButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.textSecondary,
    },
});
