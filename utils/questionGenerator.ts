import type { Question } from '@/types';

// Hardcoded confusions for difficult multiplications
const COMMON_CONFUSIONS: Record<string, number[]> = {
  "6x7": [36, 48, 49],
  "7x6": [36, 48, 49],
  "6x8": [42, 54, 56],
  "8x6": [42, 54, 56],
  "7x8": [54, 48, 64],
  "8x7": [54, 48, 64],
  "6x9": [45, 63, 56],
  "9x6": [45, 63, 56],
  "7x9": [56, 72, 64],
  "9x7": [56, 72, 64],
  "8x9": [64, 81, 70],
  "9x8": [64, 81, 70],
  "4x6": [20, 28, 32],
  "6x4": [20, 28, 32],
  "3x4": [16, 9, 14],
  "4x3": [16, 9, 14],
};

export function generateQuestions(tableNumber: number, count: number = 10): Question[] {
  const questions: Question[] = [];
  const usedMultipliers = new Set<number>();

  while (questions.length < count) {
    let multiplier = Math.floor(Math.random() * 10) + 1;

    // Ensure we don't repeat the same question too often in a single session
    // For a session of 10 questions on a single table (10 possibilities), we try to cover all if possible,
    // or just avoid immediate repeats if we are generating more than 10.
    if (count <= 10) {
      while (usedMultipliers.has(multiplier) && usedMultipliers.size < 10) {
        multiplier = Math.floor(Math.random() * 10) + 1;
      }
      usedMultipliers.add(multiplier);
    } else {
      // If we want more than 10 questions, just avoid the *immediately* preceding one
      const lastMultiplier = questions.length > 0 ? questions[questions.length - 1].multiplier : -1;
      while (multiplier === lastMultiplier) {
        multiplier = Math.floor(Math.random() * 10) + 1;
      }
    }

    const correctAnswer = tableNumber * multiplier;
    const options = generateSmartOptions(tableNumber, multiplier, correctAnswer);

    questions.push({
      multiplicand: tableNumber,
      multiplier,
      correctAnswer,
      options,
    });
  }

  return questions;
}

function generateSmartOptions(tableNumber: number, multiplier: number, correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);
  const key = `${tableNumber}x${multiplier}`;

  // 4. RÈGLE DES CONFUSIONS (Tables difficiles)
  if (COMMON_CONFUSIONS[key]) {
    const confusions = COMMON_CONFUSIONS[key];
    // Pick 1 or 2 confusions randomly
    const shuffledConfusions = [...confusions].sort(() => Math.random() - 0.5);
    for (const conf of shuffledConfusions) {
      if (options.size < 4) {
        options.add(conf);
      }
    }
  }

  // Helper to add valid distinct option
  const addOption = (val: number) => {
    if (val > 0 && val !== correctAnswer && val <= 100) { // Max 100 is a soft limit, 10x10=100
      options.add(val);
    }
  };

  let attempts = 0;
  while (options.size < 4 && attempts < 50) {
    attempts++;
    let distract: number;

    // 2. RÈGLE "FINALE 0 ou 5" (Table de 5)
    if (tableNumber === 5) {
      // Generate a multiple of 5 close to the answer
      // range +/- 2 steps of 5 (i.e. +/- 10)
      const offsetSteps = (Math.floor(Math.random() * 5) - 2) * 5; // -10, -5, 0, 5, 10
      if (offsetSteps === 0) {
        // Force a non-zero shift if we picked 0
        distract = correctAnswer + (Math.random() > 0.5 ? 5 : -5);
      } else {
        distract = correctAnswer + offsetSteps;
      }
      addOption(distract);
      continue;
    }

    // 3. RÈGLE "FINALE 0" (Table de 10)
    if (tableNumber === 10) {
      const offsetSteps = (Math.floor(Math.random() * 5) - 2) * 10; // -20, -10, 0, 10, 20
      if (offsetSteps === 0) {
        distract = correctAnswer + (Math.random() > 0.5 ? 10 : -10);
      } else {
        distract = correctAnswer + offsetSteps;
      }
      addOption(distract);
      continue;
    }

    // 1. RÈGLE DE PROXIMITÉ (Générale)
    // Generate close numbers: +/- 1 to 5, occasionally +/- 10
    const variance = Math.random();
    let offset: number;

    if (variance < 0.7) {
      // Very close: +/- 1 to 3
      offset = Math.floor(Math.random() * 3) + 1;
    } else {
      // Medium close: +/- 4 to 10
      offset = Math.floor(Math.random() * 7) + 4;
    }

    // Positive or negative
    offset = offset * (Math.random() > 0.5 ? 1 : -1);

    distract = correctAnswer + offset;

    addOption(distract);
  }

  // Fallback if strict rules made it hard to find 4 options (rare)
  while (options.size < 4) {
    const fallbackOffset = Math.floor(Math.random() * 20) - 10;
    const val = correctAnswer + fallbackOffset;
    if (val > 0 && val !== correctAnswer) options.add(val);
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

export function calculateStars(correctCount: number, totalCount: number): number {
  const percentage = (correctCount / totalCount) * 100;

  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
}
