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
import { useThemeColors } from '@/hooks/useThemeColors';
import i18n from '@/utils/i18n';
import { getTableDetailContent } from '@/utils/tableLogic';
import { DecompositionView } from '@/components/DecompositionView';

const { width } = Dimensions.get('window');

interface TableDetailModalProps {
    visible: boolean;
    tableNumber: number;
    onClose: () => void;
}

// Render colored header based on table number
// Render colored header based on table number
// Helper to render text with <bold>...</bold> tags
// Replaces tags with bold ThemedText and applies sequential colors from highlightColors array
function renderRichText(text: string, highlightColors: string[] = []): React.ReactNode {
    // text should already be the result of i18n.t, so params like {{name}} are already replaced by i18n
    // but we need to ensure the caller passes the params to i18n.t BEFORE calling this.

    const parts = text.split(/(<bold>.*?<\/bold>)/g);
    let colorIndex = 0;

    return (
        <ThemedText style={styles.techniqueText}>
            {parts.map((part, index) => {
                if (part.startsWith('<bold>') && part.endsWith('</bold>')) {
                    const content = part.replace('<bold>', '').replace('</bold>', '');
                    const color = highlightColors[colorIndex % highlightColors.length] || AppColors.text;
                    colorIndex++;
                    return (
                        <ThemedText key={index} style={[styles.techniqueTextBold, { color }]}>
                            {content}
                        </ThemedText>
                    );
                }
                return part;
            })}
        </ThemedText>
    );
}

// Render colored header based on table number
function renderColoredHeader(tableNumber: number): React.ReactNode {
    const themeName = i18n.t(`tables.${tableNumber}.theme_name`);

    switch (tableNumber) {
        case 1:
            // "la technique : {{name}} - le chiffre reste identique"
            // Color: NumberColors[1] (blue/cyan)
            return renderRichText(
                i18n.t('tables_modal.techniques.1', { name: themeName }),
                [NumberColors[1]]
            );
        case 2:
            // "la technique : {{name}} - on double le nombre"
            // Color: NumberColors[2] (orange)
            return renderRichText(
                i18n.t('tables_modal.techniques.2', { name: themeName }),
                [NumberColors[2]]
            );
        case 3:
            // "la technique : {{name}} - on ajoute 3 fois"
            // Color: NumberColors[3] (green)
            return renderRichText(
                i18n.t('tables_modal.techniques.3', { name: themeName }),
                [NumberColors[3]]
            );
        case 4:
            // "... {{strong}}Double{{/strong}} ... {{strong}}Double{{/strong}} ..."
            // Colors: [table4Result, table4Result] (cyan, cyan)
            // Ensure parameters are passed correctly if needed by the translation key
            return renderRichText(
                i18n.t('tables_modal.techniques.4'),
                [SemanticColors.table4Result, SemanticColors.table4Result]
            );
        case 5:
            // "{{strong}}Pair → 0{{/strong}}, {{strong}}Impair → 5{{/strong}}"
            return renderRichText(
                i18n.t('tables_modal.techniques.5'),
                [SemanticColors.pairIndicator, SemanticColors.impairIndicator]
            );
        case 6:
            return renderRichText(
                i18n.t('tables_modal.techniques.6'),
                [SemanticColors.table5Result, SemanticColors.multiplier]
            );
        case 7:
            return renderRichText(
                i18n.t('tables_modal.techniques.7'),
                [NumberColors[7]]
            );
        case 8:
            return (
                <View style={{ alignItems: 'center' }}>
                    {renderRichText(i18n.t('tables_modal.techniques.8_1'), [SemanticColors.table4Result])}
                    {renderRichText(i18n.t('tables_modal.techniques.8_2'), [SemanticColors.table4Result])}
                </View>
            );
        case 9:
            // For table 9, we need to handle the params manually if i18n interpolation fails often with nested tags
            // But here we rely on standard i18n.t behavior.
            return (
                <View style={{ alignItems: 'center' }}>
                    {renderRichText(i18n.t('tables_modal.techniques.9_1'), [SemanticColors.table10Result])}
                    {renderRichText(
                        i18n.t('tables_modal.techniques.9_2'),
                        [SemanticColors.table10Result, SemanticColors.multiplier, SemanticColors.multiplier]
                    )}
                </View>
            );
        case 10:
            return renderRichText(
                i18n.t('tables_modal.techniques.10'),
                [NumberColors[10], SemanticColors.table10Result]
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
    const colors = useThemeColors();

    // Render the decomposition with semantic colors
    const renderDecomposition = (row: typeof rows[0]) => {
        const { decomposition, multiplier, result } = row;
        if (!decomposition) return null;

        return (
            <DecompositionView
                decomposition={decomposition}
                multiplier={multiplier}
                result={result}
            />
        );
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
                <View style={[styles.modalContent, { borderColor: tableColor, backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.titleContainer}>
                            <ThemedText style={styles.themeEmoji}>{themeEmoji}</ThemedText>
                            <ThemedText style={[styles.title, { color: tableColor }]}>
                                {i18n.t('practice.discovery.table_of', { number: tableNumber })}
                            </ThemedText>
                            <ThemedText style={[styles.themeName, { color: colors.textSecondary }]}>{themeName}</ThemedText>
                        </View>
                        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surfaceLight }]} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Colored Technique Header for ALL tables */}
                        <View style={[styles.techniqueHeader, { borderColor: tableColor + '40', backgroundColor: colors.surfaceLight }]}>
                            <ThemedText style={styles.techniqueEmoji}>{headerEmoji}</ThemedText>
                            {renderColoredHeader(tableNumber)}
                        </View>

                        {/* Table rows with ORDER: [Table] × [Multiplicateur] */}
                        {rows.map((row, index) => {
                            // Table 5: color multiplier based on pair/impair
                            const multiplierColor = tableNumber === 5
                                ? (row.multiplier % 2 === 0 ? SemanticColors.pairIndicator : SemanticColors.impairIndicator)
                                : SemanticColors.multiplier;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.row,
                                        row.decomposition?.parts?.special === '5678' && { backgroundColor: tableColor + '20' },
                                        !row.decomposition?.parts?.special && { backgroundColor: colors.background },
                                    ]}
                                >
                                    {/* Left side: [Table] × [Multiplicateur] with colors */}
                                    <View style={styles.leftContainer}>
                                        <ThemedText style={[styles.tableNumberText, { color: tableColor }]}>
                                            {tableNumber}
                                        </ThemedText>
                                        <ThemedText style={styles.operatorText}> × </ThemedText>
                                        <ThemedText style={[styles.multiplierText, { color: multiplierColor }]}>
                                            {row.multiplier}
                                        </ThemedText>
                                    </View>

                                    {/* Right side: decomposition */}
                                    {renderDecomposition(row)}
                                </View>
                            );
                        })}
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
