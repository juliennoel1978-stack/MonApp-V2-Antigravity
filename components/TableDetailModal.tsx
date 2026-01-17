import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { AppColors, NumberColors, SemanticColors } from '@/constants/colors';
import i18n from '@/utils/i18n';

const { width } = Dimensions.get('window');

interface TableDetailModalProps {
    visible: boolean;
    tableNumber: number;
    onClose: () => void;
}

// Render colored header based on table number
function renderColoredHeader(tableNumber: number): React.ReactNode {
    switch (tableNumber) {
        case 1:
            return (
                <ThemedText style={styles.techniqueText}>
                    La technique : <ThemedText style={[styles.techniqueTextBold, { color: NumberColors[1] }]}>Le Miroir</ThemedText> - le chiffre reste identique
                </ThemedText>
            );
        case 2:
            return (
                <ThemedText style={styles.techniqueText}>
                    La technique : <ThemedText style={[styles.techniqueTextBold, { color: NumberColors[2] }]}>Les Jumeaux</ThemedText> - on double le nombre
                </ThemedText>
            );
        case 3:
            return (
                <ThemedText style={styles.techniqueText}>
                    La technique : <ThemedText style={[styles.techniqueTextBold, { color: NumberColors[3] }]}>Les Sauts de Puce</ThemedText> - on ajoute 3 fois
                </ThemedText>
            );
        case 4:
            return (
                <ThemedText style={styles.techniqueText}>
                    La technique : <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table4Result }]}>Double</ThemedText>, puis encore <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table4Result }]}>Double</ThemedText> !
                </ThemedText>
            );
        case 5:
            return (
                <ThemedText style={styles.techniqueText}>
                    <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.pairIndicator }]}>Pair → 0</ThemedText>, <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.impairIndicator }]}>Impair → 5</ThemedText>
                </ThemedText>
            );
        case 6:
            return (
                <ThemedText style={styles.techniqueText}>
                    La technique : <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table5Result }]}>Table de 5</ThemedText> + <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.multiplier }]}>le nombre</ThemedText>
                </ThemedText>
            );
        case 7:
            return (
                <ThemedText style={styles.techniqueText}>
                    <ThemedText style={[styles.techniqueTextBold, { color: NumberColors[7] }]}>La Table des Champions !</ThemedText> 🏆
                </ThemedText>
            );
        case 8:
            return (
                <View style={{ alignItems: 'center' }}>
                    <ThemedText style={styles.techniqueText}>
                        La technique : Utilise la <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table4Result }]}>Table de 4</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.techniqueText}>
                        puis <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table4Result }]}>Double</ThemedText> !
                    </ThemedText>
                </View>
            );
        case 9:
            return (
                <View style={{ alignItems: 'center' }}>
                    <ThemedText style={styles.techniqueText}>
                        L'Astuce : Utilise la <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table10Result }]}>Table de 10</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.techniqueText}>
                        (<ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table10Result }]}>10</ThemedText> × <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.multiplier }]}>N</ThemedText>) - <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.multiplier }]}>N</ThemedText>
                    </ThemedText>
                </View>
            );
        case 10:
            return (
                <ThemedText style={styles.techniqueText}>
                    <ThemedText style={[styles.techniqueTextBold, { color: NumberColors[10] }]}>Le Magicien</ThemedText> ajoute un <ThemedText style={[styles.techniqueTextBold, { color: SemanticColors.table10Result }]}>0</ThemedText> !
                </ThemedText>
            );
        default:
            return null;
    }
}

// Table header emoji mapping
const TABLE_EMOJI: Record<number, string> = {
    1: '🪞',
    2: '👯',
    3: '🦗',
    4: '🐇',
    5: '✋',
    6: '🖐️☝️',
    7: '🏰',
    8: '🎱',
    9: '👐',
    10: '🎩',
};

// Generate table-specific detailed content with semantic color support
// ORDER: [Table] × [Multiplicateur] = ...
function getTableDetailContent(tableNumber: number): {
    rows: Array<{
        multiplier: number;
        result: number;
        decomposition?: {
            type: 'simple' | 'table2' | 'table3' | 'table4' | 'table5' | 'table6' | 'table8' | 'table9' | 'table10';
            parts?: Record<string, string | number>;
            isPair?: boolean;
        };
    }>;
} {
    const rows: Array<{
        multiplier: number;
        result: number;
        decomposition?: {
            type: 'simple' | 'table2' | 'table3' | 'table4' | 'table5' | 'table6' | 'table8' | 'table9' | 'table10';
            parts?: Record<string, string | number>;
            isPair?: boolean;
        };
    }> = [];

    for (let i = 1; i <= 10; i++) {
        const result = tableNumber * i;

        switch (tableNumber) {
            case 1:
                // Simple: N × 1 = N
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: { type: 'simple' },
                });
                break;

            case 2:
                // 2 × N = N + N (with orange coloring on N)
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table2',
                        parts: { addend: i },
                    },
                });
                break;

            case 3:
                // 3 × N = N + N + N (with orange coloring on N)
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table3',
                        parts: { addend: i },
                    },
                });
                break;

            case 4:
                // 4 × N = (2×N) + (2×N)
                const double2 = i * 2;
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table4',
                        parts: {
                            calc: `(2×${i})`,
                            doubleResult: double2,
                        },
                    },
                });
                break;

            case 5:
                // 5 × N with Pair/Impair indicator
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table5',
                        isPair: i % 2 === 0,
                    },
                });
                break;

            case 6:
                // 6 × N = (5×N) + N
                const times5 = i * 5;
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table6',
                        parts: {
                            calc5: `(5×${i})`,
                            result5: times5,
                            added: i,
                        },
                    },
                });
                break;

            case 7:
                // 7 × 8 = 56 (special 5, 6, 7, 8)
                const isSpecial = i === 8;
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'simple',
                        parts: isSpecial ? { special: '5678' } : undefined,
                    },
                });
                break;

            case 8:
                // 8 × N = (4×N) + (4×N)
                const times4 = i * 4;
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table8',
                        parts: {
                            calc4: `(4×${i})`,
                            result4: times4,
                        },
                    },
                });
                break;

            case 9:
                // 9 × N = (10×N) - N
                const times10 = i * 10;
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table9',
                        parts: {
                            calc10: `(10×${i})`,
                            result10: times10,
                            subtracted: i,
                        },
                    },
                });
                break;

            case 10:
                // 10 × N = N0
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: {
                        type: 'table10',
                        parts: { display: `${i}0` },
                    },
                });
                break;

            default:
                rows.push({
                    multiplier: i,
                    result,
                    decomposition: { type: 'simple' },
                });
        }
    }

    return { rows };
}

export default function TableDetailModal({
    visible,
    tableNumber,
    onClose,
}: TableDetailModalProps) {
    const tableColor = NumberColors[tableNumber as keyof typeof NumberColors] || AppColors.primary;
    const { rows } = getTableDetailContent(tableNumber);
    const themeEmoji = i18n.t(`tables.${tableNumber}.theme_emoji`);
    const themeName = i18n.t(`tables.${tableNumber}.theme_name`);
    const headerEmoji = TABLE_EMOJI[tableNumber] || '';

    // Render the decomposition with semantic colors
    const renderDecomposition = (row: typeof rows[0]) => {
        const { decomposition, multiplier, result } = row;
        if (!decomposition) return null;

        const parts = decomposition.parts;

        switch (decomposition.type) {
            case 'table2':
                // 2 × 6 = 6 + 6 = 12 (with orange numbers)
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                    >
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.addend}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.addend}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table3':
                // 3 × 4 = 4 + 4 + 4 = 12 (with orange numbers)
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.addend}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.addend}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.addend}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table4':
                // 4 × 3 = (2×3) + (2×3) = 6 + 6 = 12
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>
                            {parts?.calc}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>
                            {parts?.calc}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>
                            {parts?.doubleResult}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>
                            {parts?.doubleResult}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table5':
                // 5 × N = result (Pair → 0) or (Impair → 5)
                const isPair = decomposition.isPair;
                const indicatorColor = isPair ? SemanticColors.pairIndicator : SemanticColors.impairIndicator;
                const indicatorText = isPair ? 'Pair → 0' : 'Impair → 5';
                return (
                    <View style={styles.table5Row}>
                        <ThemedText style={styles.rightText}>
                            <ThemedText style={styles.operatorText}>= </ThemedText>
                            <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                        </ThemedText>
                        <View style={[styles.pairBadge, { backgroundColor: indicatorColor + '20', borderColor: indicatorColor }]}>
                            <ThemedText style={[styles.pairBadgeText, { color: indicatorColor }]}>
                                {indicatorText}
                            </ThemedText>
                        </View>
                    </View>
                );

            case 'table6':
                // 6 × 4 = (5×4) + 4 = 20 + 4 = 24
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.45}
                    >
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table5Result }]}>
                            {parts?.calc5}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.added}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table5Result }]}>
                            {parts?.result5}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>
                            {parts?.added}
                        </ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table8':
                // 8 × 3 = (4 cyan × 3 orange) + (4 cyan × 3 orange) = 12 cyan + 12 cyan = 24
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.35}
                    >
                        <ThemedText style={styles.operatorText}>= (</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>4</ThemedText>
                        <ThemedText style={styles.operatorText}>×</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                        <ThemedText style={styles.operatorText}>) + (</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>4</ThemedText>
                        <ThemedText style={styles.operatorText}>×</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                        <ThemedText style={styles.operatorText}>) = </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>{parts?.result4}</ThemedText>
                        <ThemedText style={styles.operatorText}> + </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table4Result }]}>{parts?.result4}</ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table9':
                // 9 × 7 = (10 cyan × 7 orange) - 7 orange = 70 cyan - 7 orange = 63
                return (
                    <ThemedText
                        style={styles.rightText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                    >
                        <ThemedText style={styles.operatorText}>= (</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table10Result }]}>10</ThemedText>
                        <ThemedText style={styles.operatorText}>×</ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                        <ThemedText style={styles.operatorText}>) - </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>{parts?.subtracted}</ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.table10Result }]}>{parts?.result10}</ThemedText>
                        <ThemedText style={styles.operatorText}> - </ThemedText>
                        <ThemedText style={[styles.rightTextBold, { color: SemanticColors.multiplier }]}>{parts?.subtracted}</ThemedText>
                        <ThemedText style={styles.operatorText}> = </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );

            case 'table10':
                // 10 × N = N0 with N in orange and 0 in cyan
                return (
                    <ThemedText style={styles.rightText}>
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                        <ThemedText style={styles.hintText}> (</ThemedText>
                        <ThemedText style={[styles.hintTextColored, { color: SemanticColors.multiplier }]}>{multiplier}</ThemedText>
                        <ThemedText style={[styles.hintTextColored, { color: SemanticColors.table10Result }]}>0</ThemedText>
                        <ThemedText style={styles.hintText}>)</ThemedText>
                    </ThemedText>
                );

            case 'simple':
            default:
                // Simple display with optional special marker
                if (parts?.special === '5678') {
                    return (
                        <ThemedText style={styles.rightText}>
                            <ThemedText style={styles.operatorText}>= </ThemedText>
                            <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                            <ThemedText style={styles.hintText}> ⭐ 5678</ThemedText>
                        </ThemedText>
                    );
                }
                return (
                    <ThemedText style={styles.rightText}>
                        <ThemedText style={styles.operatorText}>= </ThemedText>
                        <ThemedText style={[styles.resultTextLarge, { fontWeight: 'bold' }]}>{result}</ThemedText>
                    </ThemedText>
                );
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.modalContent, { borderColor: tableColor }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <ThemedText style={styles.themeEmoji}>{themeEmoji}</ThemedText>
                            <ThemedText style={[styles.title, { color: tableColor }]}>
                                {i18n.t('practice.discovery.table_of', { number: tableNumber })}
                            </ThemedText>
                            <ThemedText style={styles.themeName}>{themeName}</ThemedText>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={AppColors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Colored Technique Header for ALL tables */}
                        <View style={[styles.techniqueHeader, { borderColor: tableColor + '40' }]}>
                            <ThemedText style={styles.techniqueEmoji}>{headerEmoji}</ThemedText>
                            {renderColoredHeader(tableNumber)}
                        </View>

                        {/* Table rows with ORDER: [Table] × [Multiplicateur] */}
                        {rows.map((row, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.row,
                                    row.decomposition?.parts?.special === '5678' && { backgroundColor: tableColor + '20' },
                                ]}
                            >
                                {/* Left side: [Table] × [Multiplicateur] with colors */}
                                <View style={styles.leftContainer}>
                                    <ThemedText style={[styles.tableNumberText, { color: tableColor }]}>
                                        {tableNumber}
                                    </ThemedText>
                                    <ThemedText style={styles.operatorText}> × </ThemedText>
                                    <ThemedText style={[styles.multiplierText, { color: SemanticColors.multiplier }]}>
                                        {row.multiplier}
                                    </ThemedText>
                                </View>

                                {/* Right side: decomposition */}
                                {renderDecomposition(row)}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <TouchableOpacity
                        style={[styles.closeButtonBottom, { backgroundColor: tableColor }]}
                        onPress={onClose}
                    >
                        <ThemedText style={styles.closeButtonText}>
                            {i18n.t('common.close')}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        width: width - 40,
        maxHeight: '85%',
        backgroundColor: AppColors.surface,
        borderRadius: 24,
        borderWidth: 3,
        overflow: 'hidden',
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    themeEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    themeName: {
        fontSize: 14,
        color: AppColors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AppColors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        maxHeight: 420,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 12,
    },
    techniqueHeader: {
        backgroundColor: AppColors.surfaceLight,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    techniqueEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    techniqueText: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.text,
        textAlign: 'center',
    },
    techniqueTextBold: {
        fontSize: 13,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 5,
        backgroundColor: AppColors.background,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 70,
    },
    tableNumberText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    multiplierText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    operatorText: {
        fontSize: 16,
        color: SemanticColors.operator,
        fontWeight: '600',
    },
    rightText: {
        fontSize: 15,
        color: AppColors.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    rightTextBold: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    resultText: {
        fontSize: 16,
        color: AppColors.text,
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
        fontWeight: '700',
    },
    closeButtonBottom: {
        margin: 16,
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
