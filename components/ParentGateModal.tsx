import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { AppColors } from '@/constants/colors';
import { Lock, X, Check } from 'lucide-react-native';

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
        // Generate a simple math challenge (multiplication or addition)
        // To ensure it's easy for adults but requires reading/calculating
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

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Lock color="#FFF" size={24} />
                        </View>
                        <ThemedText style={styles.title}>Zone Parents</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color={AppColors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.subtitle}>
                        Pour accéder, résolvez ce calcul :
                    </ThemedText>

                    <View style={styles.challengeContainer}>
                        <ThemedText style={styles.questionText}>{question} = ?</ThemedText>
                    </View>

                    <TextInput
                        style={[styles.input, error && styles.inputError]}
                        value={input}
                        onChangeText={(text) => {
                            setInput(text.replace(/[^0-9]/g, ''));
                            setError(false);
                        }}
                        placeholder="Réponse"
                        placeholderTextColor={AppColors.textquaternary}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus
                    />

                    {error && (
                        <ThemedText style={styles.errorText}>Mauvaise réponse, essayez encore.</ThemedText>
                    )}

                    <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleVerify}
                    >
                        <ThemedText style={styles.verifyButtonText}>Valider</ThemedText>
                        <Check color="#FFF" size={20} />
                    </TouchableOpacity>

                    <ThemedText style={styles.disclaimer}>
                        Cette vérification protège les réglages et les données.
                    </ThemedText>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: AppColors.card,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Lexend',
        fontWeight: 'bold',
        color: AppColors.text,
        marginLeft: 12,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 16,
        color: AppColors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    challengeContainer: {
        backgroundColor: AppColors.background,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: AppColors.border,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 2,
        borderColor: AppColors.border,
        borderRadius: 16,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
        color: AppColors.text,
        fontFamily: 'Lexend',
        backgroundColor: AppColors.background,
    },
    inputError: {
        borderColor: AppColors.error,
        backgroundColor: '#FFE5E5',
    },
    errorText: {
        color: AppColors.error,
        fontSize: 14,
        marginBottom: 12,
    },
    verifyButton: {
        flexDirection: 'row',
        backgroundColor: AppColors.success,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
        justifyContent: 'center',
        gap: 8,
    },
    verifyButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Lexend',
    },
    disclaimer: {
        fontSize: 12,
        color: AppColors.textquaternary,
        textAlign: 'center',
        marginTop: 20,
    },
});
