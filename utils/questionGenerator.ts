import type { Question } from '@/types';

export function generateQuestions(tableNumber: number, count: number = 10): Question[] {
  const questions: Question[] = [];
  const usedMultipliers = new Set<number>();

  while (questions.length < count) {
    let multiplier = Math.floor(Math.random() * 10) + 1;
    
    while (usedMultipliers.has(multiplier) && usedMultipliers.size < 10) {
      multiplier = Math.floor(Math.random() * 10) + 1;
    }
    
    usedMultipliers.add(multiplier);
    
    const correctAnswer = tableNumber * multiplier;
    const options = generateOptions(correctAnswer, tableNumber);
    
    questions.push({
      multiplicand: tableNumber,
      multiplier,
      correctAnswer,
      options,
    });
  }

  return questions;
}

function generateOptions(correctAnswer: number, tableNumber: number): number[] {
  const options = new Set<number>([correctAnswer]);
  
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    let wrongAnswer = correctAnswer + offset;
    
    if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && wrongAnswer <= 100) {
      options.add(wrongAnswer);
    }
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
