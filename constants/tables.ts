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
    astuce: "Quand on multiplie par 1, le résultat ne change jamais.",
    indice: "C’est le même nombre : on ne le multiplie pas vraiment.",
    erreur: "1 × X = X. On garde exactement le même nombre."
  },
  2: {
    astuce: "On double le nombre : 2, 4, 6, 8…",
    indice: "Si tu connais +2, tu connais la table de 2.",
    erreur: "2 × X = X + X. On double le nombre."
  },
  3: {
    astuce: "On ajoute 3 à chaque fois, comme 3, 6, 9, 12…",
    indice: "Pense aux multiples de 3 : 3, 6, 9, 12, 15…",
    erreur: "3 × X = X + X + X. On ajoute 3 à chaque fois."
  },
  4: {
    astuce: "4, 8, 12, 16… on ajoute toujours 4.",
    indice: "Tu peux faire ×2 puis encore ×2 : on double deux fois !",
    erreur: "4 × X = (2 × X) × 2. On double deux fois pour trouver le résultat."
  },
  5: {
    astuce: "Les résultats finissent toujours par 0 ou 5.",
    indice: "Compte de 5 en 5 : 5, 10, 15, 20…",
    erreur: "5 × X = un nombre qui finit par 0 ou 5. Compte de 5 en 5 pour vérifier."
  },
  6: {
    astuce: "Si tu connais ×3, double le résultat : 6 = 3+3.",
    indice: "Pense à faire 3 × X, puis tu doubles.",
    erreur: "6 × X = 3 × X + 3 × X. On double le résultat de la table de 3."
  },
  7: {
    astuce: "Table plus difficile : pense à la décomposition (5 × X + 2 × X).",
    indice: "Fais 5 × X, puis ajoute encore 2 × X.",
    erreur: "7 × X = 5 × X + 2 × X. On peut la découper pour trouver plus facilement."
  },
  8: {
    astuce: "8, c’est 2 × 2 × 2 : on double trois fois !",
    indice: "Double, puis redouble, puis redouble encore.",
    erreur: "8 × X = on double 3 fois : X → 2X → 4X → 8X."
  },
  9: {
    astuce: "La somme des chiffres du résultat fait souvent 9.",
    indice: "Ex : 9 × 4 = 36 → 3 + 6 = 9.",
    erreur: "Vérifie la somme des chiffres : elle doit souvent faire 9 pour ×9."
  },
  10: {
    astuce: "On ajoute un 0 à la fin du nombre.",
    indice: "10 × X = X avec un zéro derrière.",
    erreur: "10 × X = X0. Il suffit d’écrire un zéro à la fin."
  }
};

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
