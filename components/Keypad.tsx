import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { ThemedText } from './ThemedText';
import * as Haptics from 'expo-haptics';

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
    color: string;
}

export const Keypad = ({ onKeyPress, onDelete, onSubmit, color }: KeypadProps) => {
    const handlePress = (key: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onKeyPress(key);
    };

    const handleDelete = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onDelete();
    };

    const handleSubmit = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onSubmit();
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.keyText}>{num}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.row}>
                {[4, 5, 6].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.keyText}>{num}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.row}>
                {[7, 8, 9].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.keyText}>{num}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.key, styles.keyAction]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                >
                    <Delete size={28} color={AppColors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.key}
                    onPress={() => handlePress('0')}
                    activeOpacity={0.7}
                >
                    <ThemedText style={styles.keyText}>0</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.key, styles.keySubmit, { backgroundColor: color }]}
                    onPress={handleSubmit}
                    activeOpacity={0.7}
                >
                    <ThemedText style={styles.keySubmitText}>OK</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        gap: 10,
        backgroundColor: '#F7F7F9', // Slightly distinct background (or match surface)
        borderTopWidth: 1,
        borderTopColor: AppColors.borderLight,
        width: '100%',
        maxWidth: 450, // Constraint for iPad
        alignSelf: 'center', // Center on iPad
        paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Safe area padding
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        height: 60, // Fixed height for consistency
    },
    key: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    keyAction: {
        backgroundColor: '#F0F0F0',
    },
    keySubmit: {
        // backgroundColor overwritten by props
    },
    keyText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.text,
    },
    keySubmitText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
