
export interface DecompositionParts {
    addend?: number;
    calc?: string;
    doubleResult?: number;
    calc5?: string;
    result5?: number;
    added?: number;
    calc4?: string;
    result4?: number;
    calc10?: string;
    result10?: number;
    subtracted?: number;
    special?: string;
    display?: string;
}

export type DecompositionType = 'simple' | 'table2' | 'table3' | 'table4' | 'table5' | 'table6' | 'table8' | 'table9' | 'table10';

export interface RowDecomposition {
    type: DecompositionType;
    parts?: DecompositionParts;
    isPair?: boolean;
}

export interface TableRow {
    multiplier: number;
    result: number;
    decomposition?: RowDecomposition;
}

// Generate table-specific detailed content
// ORDER: [Table] × [Multiplicateur] = ...
export function getTableDetailContent(tableNumber: number): { rows: TableRow[] } {
    const rows: TableRow[] = [];

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

// Helper to get decomposition for a specific question (multiplier)
export function getQuestionDecomposition(tableNumber: number, multiplier: number): TableRow | undefined {
    const { rows } = getTableDetailContent(tableNumber);
    return rows.find(r => r.multiplier === multiplier);
}
