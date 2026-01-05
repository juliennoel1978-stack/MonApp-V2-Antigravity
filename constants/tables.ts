export type TableDifficulty = 'easy' | 'medium' | 'hard';

export interface MultiplicationTable {
  number: number;
  difficulty: TableDifficulty;
  order: number;
  story: string;
  tip: string;
}

export const TIPS_BY_TABLE: Record<number, { astuce: string; indice: string; erreur: string }> = {
  1: {
    astuce: "tables.1.astuce",
    indice: "tables.1.indice",
    erreur: "tables.1.erreur"
  },
  2: {
    astuce: "tables.2.astuce",
    indice: "tables.2.indice",
    erreur: "tables.2.erreur"
  },
  3: {
    astuce: "tables.3.astuce",
    indice: "tables.3.indice",
    erreur: "tables.3.erreur"
  },
  4: {
    astuce: "tables.4.astuce",
    indice: "tables.4.indice",
    erreur: "tables.4.erreur"
  },
  5: {
    astuce: "tables.5.astuce",
    indice: "tables.5.indice",
    erreur: "tables.5.erreur"
  },
  6: {
    astuce: "tables.6.astuce",
    indice: "tables.6.indice",
    erreur: "tables.6.erreur"
  },
  7: {
    astuce: "tables.7.astuce",
    indice: "tables.7.indice",
    erreur: "tables.7.erreur"
  },
  8: {
    astuce: "tables.8.astuce",
    indice: "tables.8.indice",
    erreur: "tables.8.erreur"
  },
  9: {
    astuce: "tables.9.astuce",
    indice: "tables.9.indice",
    erreur: "tables.9.erreur"
  },
  10: {
    astuce: "tables.10.astuce",
    indice: "tables.10.indice",
    erreur: "tables.10.erreur"
  }
};

export const MULTIPLICATION_TABLES: MultiplicationTable[] = [
  {
    number: 1,
    difficulty: 'easy',
    order: 1,
    story: 'tables.1.story',
    tip: 'tables.1.tip',
  },
  {
    number: 2,
    difficulty: 'easy',
    order: 2,
    story: 'tables.2.story',
    tip: 'tables.2.tip',
  },
  {
    number: 5,
    difficulty: 'easy',
    order: 3,
    story: 'tables.5.story',
    tip: 'tables.5.tip',
  },
  {
    number: 10,
    difficulty: 'easy',
    order: 4,
    story: 'tables.10.story',
    tip: 'tables.10.tip',
  },
  {
    number: 3,
    difficulty: 'medium',
    order: 5,
    story: 'tables.3.story',
    tip: 'tables.3.tip',
  },
  {
    number: 4,
    difficulty: 'medium',
    order: 6,
    story: 'tables.4.story',
    tip: 'tables.4.tip',
  },
  {
    number: 6,
    difficulty: 'medium',
    order: 7,
    story: 'tables.6.story',
    tip: 'tables.6.tip',
  },
  {
    number: 9,
    difficulty: 'medium',
    order: 8,
    story: 'tables.9.story',
    tip: 'tables.9.tip',
  },
  {
    number: 7,
    difficulty: 'hard',
    order: 9,
    story: 'tables.7.story',
    tip: 'tables.7.tip',
  },
  {
    number: 8,
    difficulty: 'hard',
    order: 10,
    story: 'tables.8.story',
    tip: 'tables.8.tip',
  },
];

export const getTableByNumber = (number: number): MultiplicationTable | undefined => {
  return MULTIPLICATION_TABLES.find(t => t.number === number);
};

export const getTablesByDifficulty = (difficulty: TableDifficulty): MultiplicationTable[] => {
  return MULTIPLICATION_TABLES.filter(t => t.difficulty === difficulty);
};
