export type TableDifficulty = 'easy' | 'medium' | 'hard';

export interface MultiplicationTable {
  number: number;
  difficulty: TableDifficulty;
  order: number;
  story: string;
  tip: string;
}

export const MULTIPLICATION_TABLES: MultiplicationTable[] = [
  {
    number: 1,
    difficulty: 'easy',
    order: 1,
    story: 'La table de 1, c\'est facile ! Tout reste pareil.',
    tip: 'N\'importe quel nombre × 1 = ce nombre',
  },
  {
    number: 2,
    difficulty: 'easy',
    order: 2,
    story: 'La table de 2, c\'est doubler ! Comme des jumeaux.',
    tip: 'Compte de 2 en 2 : 2, 4, 6, 8, 10...',
  },
  {
    number: 5,
    difficulty: 'easy',
    order: 3,
    story: 'La table de 5, regarde tes doigts ! Ça finit toujours par 0 ou 5.',
    tip: 'Les résultats finissent par 0 ou 5',
  },
  {
    number: 10,
    difficulty: 'easy',
    order: 4,
    story: 'La table de 10, ajoute juste un zéro !',
    tip: 'Ajoute un 0 à la fin du nombre',
  },
  {
    number: 3,
    difficulty: 'medium',
    order: 5,
    story: 'La table de 3, compte par bonds de 3 !',
    tip: 'Compte de 3 en 3 : 3, 6, 9, 12, 15...',
  },
  {
    number: 4,
    difficulty: 'medium',
    order: 6,
    story: 'La table de 4, c\'est doubler deux fois !',
    tip: 'Double le nombre, puis double encore',
  },
  {
    number: 6,
    difficulty: 'medium',
    order: 7,
    story: 'La table de 6, c\'est 5 + 1 de plus !',
    tip: 'Utilise la table de 5 et ajoute le nombre',
  },
  {
    number: 9,
    difficulty: 'medium',
    order: 8,
    story: 'La table de 9, le truc des doigts magiques !',
    tip: 'Les chiffres des résultats font toujours 9',
  },
  {
    number: 7,
    difficulty: 'hard',
    order: 9,
    story: 'La table de 7, la plus difficile ! Utilise des histoires.',
    tip: 'Apprends avec des images et des histoires',
  },
  {
    number: 8,
    difficulty: 'hard',
    order: 10,
    story: 'La table de 8, double la table de 4 !',
    tip: 'Utilise la table de 4 et double le résultat',
  },
];

export const getTableByNumber = (number: number): MultiplicationTable | undefined => {
  return MULTIPLICATION_TABLES.find(t => t.number === number);
};

export const getTablesByDifficulty = (difficulty: TableDifficulty): MultiplicationTable[] => {
  return MULTIPLICATION_TABLES.filter(t => t.difficulty === difficulty);
};
