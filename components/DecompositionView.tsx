
import React from 'react';
import { View, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SemanticColors, AppColors } from '@/constants/colors';
import { RowDecomposition } from '@/utils/tableLogic';

interface DecompositionViewProps {
    decomposition?: RowDecomposition;
    multiplier: number;
    result: number;
    scale?: number; // Optional scaling for different contexts
    centered?: boolean; // Whether to center the view (for error feedback)
}

export const DecompositionView: React.FC<DecompositionViewProps> = ({
    decomposition,
    multiplier,
    result,
    scale = 1,
    centered = false
}) => {
    if (!decomposition) return null;

    const parts = decomposition.parts;

    // Use container logic instead of text alignment purely
    const containerStyle = [
        scale !== 1 ? { transform: [{ scale }] } : {},
        centered ? styles.centeredContainer : styles.rowContainer
    ];

    const operatorStyle: StyleProp<TextStyle> = [styles.operatorText, centered && { fontSize: 24 }];
    const numberStyle: StyleProp<TextStyle> = [styles.rightTextBold, centered && { fontSize: 24 }];
    const resultStyle: StyleProp<TextStyle> = [styles.resultTextLarge, { fontWeight: 'bold' as const }, centered && { fontSize: 32 }];

    const Content = () => {
        switch (decomposition.type) {
            case 'table2':
                return (
                    <View style={styles.inlineRow}>
                        <ThemedText style={operatorStyle}>= </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.addend}</ThemedText>
                        <ThemedText style={operatorStyle}> + </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.addend}</ThemedText>
                        <ThemedText style={operatorStyle}> = </ThemedText>
                        <ThemedText style={resultStyle}>{result}</ThemedText>
                    </View>
                );

            case 'table3':
                // User wants this on one line: = 10 + 10 + 10 = 30
                // We reduce font size slightly if needed and use flexible container
                return (
                    <View style={styles.inlineRow}>
                        <ThemedText style={operatorStyle}>= </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.addend}</ThemedText>
                        <ThemedText style={operatorStyle}> + </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.addend}</ThemedText>
                        <ThemedText style={operatorStyle}> + </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.addend}</ThemedText>
                        <ThemedText style={operatorStyle}> = </ThemedText>
                        <ThemedText style={resultStyle}>{result}</ThemedText>
                    </View>
                );

            case 'table4':
                // Full formula with colors - 2-line layout for both modal and correction
                const cyanColor = SemanticColors.table4Result;
                const orangeColor = SemanticColors.multiplier;

                return (
                    <View style={{ alignItems: centered ? 'center' : 'flex-start', gap: 2 }}>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= (</ThemedText>
                            <ThemedText style={[numberStyle, { color: cyanColor }]}>2</ThemedText>
                            <ThemedText style={operatorStyle}>×</ThemedText>
                            <ThemedText style={[numberStyle, { color: orangeColor }]}>{multiplier}</ThemedText>
                            <ThemedText style={operatorStyle}>) + (</ThemedText>
                            <ThemedText style={[numberStyle, { color: cyanColor }]}>2</ThemedText>
                            <ThemedText style={operatorStyle}>×</ThemedText>
                            <ThemedText style={[numberStyle, { color: orangeColor }]}>{multiplier}</ThemedText>
                            <ThemedText style={operatorStyle}>)</ThemedText>
                        </View>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= </ThemedText>
                            <ThemedText style={[numberStyle, { color: cyanColor }]}>{parts?.doubleResult}</ThemedText>
                            <ThemedText style={operatorStyle}> + </ThemedText>
                            <ThemedText style={[numberStyle, { color: cyanColor }]}>{parts?.doubleResult}</ThemedText>
                            <ThemedText style={operatorStyle}> = </ThemedText>
                            <ThemedText style={resultStyle}>{result}</ThemedText>
                        </View>
                    </View>
                );

            case 'table5':
                const isPair = decomposition.isPair;
                const indicatorColor = isPair ? SemanticColors.pairIndicator : SemanticColors.impairIndicator;
                const indicatorText = isPair ? 'Pair → 0' : 'Impair → 5';

                if (centered) {
                    return (
                        <View style={{ alignItems: 'center', gap: 8 }}>
                            <View style={styles.inlineRow}>
                                <ThemedText style={operatorStyle}>= </ThemedText>
                                <ThemedText style={resultStyle}>{result}</ThemedText>
                            </View>
                            <View style={[styles.pairBadge, { backgroundColor: indicatorColor + '20', borderColor: indicatorColor }]}>
                                <ThemedText style={[styles.pairBadgeText, { color: indicatorColor }]}>{indicatorText}</ThemedText>
                            </View>
                        </View>
                    );
                }

                return (
                    <View style={styles.table5Row}>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= </ThemedText>
                            <ThemedText style={resultStyle}>{result}</ThemedText>
                        </View>
                        <View style={[styles.pairBadge, { backgroundColor: indicatorColor + '20', borderColor: indicatorColor }]}>
                            <ThemedText style={[styles.pairBadgeText, { color: indicatorColor }]}>
                                {indicatorText}
                            </ThemedText>
                        </View>
                    </View>
                );

            case 'table6':
                // Keep single line but more compact
                return (
                    <View style={styles.inlineRow}>
                        <ThemedText style={operatorStyle}>= </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.table5Result }]}>{parts?.result5}</ThemedText>
                        <ThemedText style={operatorStyle}> + </ThemedText>
                        <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.added}</ThemedText>
                        <ThemedText style={operatorStyle}> = </ThemedText>
                        <ThemedText style={resultStyle}>{result}</ThemedText>
                    </View>
                );

            case 'table8':
                // Full formula with colors - 2-line layout for both modal and correction
                return (
                    <View style={{ alignItems: centered ? 'center' : 'flex-start', gap: 2 }}>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= (</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table4Result }]}>4</ThemedText>
                            <ThemedText style={operatorStyle}>×</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                            <ThemedText style={operatorStyle}>) + (</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table4Result }]}>4</ThemedText>
                            <ThemedText style={operatorStyle}>×</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                            <ThemedText style={operatorStyle}>)</ThemedText>
                        </View>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= </ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table4Result }]}>{parts?.result4}</ThemedText>
                            <ThemedText style={operatorStyle}> + </ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table4Result }]}>{parts?.result4}</ThemedText>
                            <ThemedText style={operatorStyle}> = </ThemedText>
                            <ThemedText style={resultStyle}>{result}</ThemedText>
                        </View>
                    </View>
                );

            case 'table9':
                // Full formula with colors - 2-line layout for both modal and correction
                return (
                    <View style={{ alignItems: centered ? 'center' : 'flex-start', gap: 2 }}>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= (</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table10Result }]}>10</ThemedText>
                            <ThemedText style={operatorStyle}>×</ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                            <ThemedText style={operatorStyle}>) - </ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.subtracted}</ThemedText>
                        </View>
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= </ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.table10Result }]}>{parts?.result10}</ThemedText>
                            <ThemedText style={operatorStyle}> - </ThemedText>
                            <ThemedText style={[numberStyle, { color: SemanticColors.multiplier }]}>{parts?.subtracted}</ThemedText>
                            <ThemedText style={operatorStyle}> = </ThemedText>
                            <ThemedText style={resultStyle}>{result}</ThemedText>
                        </View>
                    </View>
                );

            case 'table10':
                return (
                    <View style={styles.inlineRow}>
                        <ThemedText style={operatorStyle}>= </ThemedText>
                        <ThemedText style={resultStyle}>{result}</ThemedText>
                        <ThemedText style={styles.hintText}> (</ThemedText>
                        <ThemedText style={[styles.hintTextColored, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                        <ThemedText style={[styles.hintTextColored, { color: SemanticColors.table10Result }]}>0</ThemedText>
                        <ThemedText style={styles.hintText}>)</ThemedText>
                    </View>
                );

            case 'simple':
            default:
                if (parts?.special === '5678') {
                    return (
                        <View style={styles.inlineRow}>
                            <ThemedText style={operatorStyle}>= </ThemedText>
                            <ThemedText style={resultStyle}>{result}</ThemedText>
                            <ThemedText style={styles.hintText}> ⭐ 5678</ThemedText>
                        </View>
                    );
                }
                return (
                    <View style={styles.inlineRow}>
                        <ThemedText style={operatorStyle}>= </ThemedText>
                        <ThemedText style={resultStyle}>{result}</ThemedText>
                    </View>
                );
        }
    };

    return (
        <View style={containerStyle}>
            <Content />
        </View>
    );
};



const styles = StyleSheet.create({
    rowContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    centeredContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    rightText: {
        fontSize: 15,
        color: AppColors.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    centeredText: {
        fontSize: 20,
        color: AppColors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    operatorText: {
        fontSize: 16,
        color: SemanticColors.operator,
        fontWeight: '600' as const,
    },
    rightTextBold: {
        fontWeight: 'bold' as const,
        fontSize: 15,
    },
    resultTextLarge: {
        fontSize: 18,
        color: AppColors.text,
    },
    hintText: {
        fontSize: 12,
        color: AppColors.textSecondary,
        fontStyle: 'italic',
    },
    hintTextColored: {
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    table5Row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        flex: 1,
    },
    pairBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    pairBadgeText: {
        fontSize: 10,
    },
});
