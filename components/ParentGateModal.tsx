import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { AppColors } from '@/constants/colors';
import { Lock, X, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ParentGateModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ParentGateModal = ({ visible, onClose, onSuccess }: ParentGateModalProps) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(0);
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (visible) {
            generateChallenge();
            setInput('');
            setError(false);
        }
    }, [visible]);

    const generateChallenge = () => {
        const mode = Math.random() > 0.5 ? 'mult' : 'add';

        if (mode === 'mult') {
            const a = Math.floor(Math.random() * 8) + 11; // 11 to 18
            const b = Math.floor(Math.random() * 4) + 2;  // 2 to 5
            setQuestion(`${a} × ${b}`);
            setAnswer(a * b);
        } else {
            const a = Math.floor(Math.random() * 20) + 15; // 15 to 34
            const b = Math.floor(Math.random() * 20) + 15; // 15 to 34
            setQuestion(`${a} + ${b}`);
            setAnswer(a + b);
        }
    };

    const handleVerify = () => {
        const userVal = parseInt(input, 10);
        if (!isNaN(userVal) && userVal === answer) {
            onSuccess();
        } else {
            setError(true);
            setTimeout(() => {
                setError(false);
                setInput('');
            }, 1000);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

                <View style={[styles.content, { width: width * 0.85, maxWidth: 340 }]}>

                    {/* FIXED HEADER - Always visible, never scrolls */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <X color={AppColors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* SCROLLABLE CONTENT - Handles large fonts (OpenDyslexic) */}
                    <ScrollView
                        style={{ width: '100%' }}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.iconContainer}>
                            <Lock color={AppColors.primary} size={32} />
                        </View>

                        <ThemedText style={styles.title}>Zone Parents & Réglages</ThemedText>

                        <ThemedText style={styles.subtitle}>
                            Résolvez pour accéder :
                        </ThemedText>

                        <TouchableOpacity onPress={generateChallenge} activeOpacity={0.7} style={{ marginBottom: 16 }}>
                            <View style={styles.challengeContainer}>
                                <ThemedText style={styles.questionText}>{question} = ?</ThemedText>
                                <RefreshCw color={AppColors.primary} size={14} style={{ position: 'absolute', top: 6, right: 6, opacity: 0.5 }} />
                            </View>
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, error && styles.inputError]}
                            value={input}
                            onChangeText={(text) => {
                                setInput(text.replace(/[^0-9]/g, ''));
                                setError(false);
                            }}
                            placeholder="Réponse"
                            placeholderTextColor={AppColors.textLight}
                            keyboardType="number-pad"
                            maxLength={3}
                            autoFocus
                        />

                        {error && (
                            <ThemedText style={styles.errorText}>Mauvaise réponse</ThemedText>
                        )}

                        <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={handleVerify}
                        >
                            <ThemedText style={styles.verifyButtonText}>Valider</ThemedText>
                        </TouchableOpacity>

                        <ThemedText style={styles.disclaimer}>
                            Protection des réglages
                        </ThemedText>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20, // Horizontal padding for header
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        maxHeight: Dimensions.get('window').height * 0.85, // Safety cap for height
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 8,
        height: 44,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 4, // Inner padding for scroll content
        paddingBottom: 8,
    },
    iconContainer: {
        marginBottom: 12,
        backgroundColor: '#F0F3FF',
        padding: 12,
        borderRadius: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Lexend',
        fontWeight: 'bold',
        color: AppColors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    challengeContainer: {
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
        minWidth: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.primary,
        fontFamily: 'Lexend',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 14,
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
        color: AppColors.text,
        fontFamily: 'Lexend',
        backgroundColor: '#FAFAFA',
    },
    inputError: {
        borderColor: AppColors.error,
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: AppColors.error,
        fontSize: 12,
        marginBottom: 8,
        marginTop: 4,
    },
    verifyButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 12,
        width: '100%',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Lexend',
    },
    disclaimer: {
        fontSize: 11,
        color: '#BBB',
        textAlign: 'center',
        marginTop: 16,
    },
});
