export const NumberColors = {
  1: '#FF6B6B',
  2: '#4ECDC4',
  3: '#5CBFAE', // Darker teal for better contrast
  4: '#9C27B0', // Deep violet for better contrast (accessibility)
  5: '#5DC09B', // Darker green for better contrast
  6: '#9BA8D9', // Darker lavender for better contrast
  7: '#0097A7', // Dark cyan for better contrast (accessibility)
  8: '#00796B', // Teal for better contrast (accessibility)
  9: '#9B8AC4', // Darker purple for better contrast
  10: '#E8A87C', // Darker peach for better contrast
} as const;

// Semantic colors for pedagogical table displays
export const SemanticColors = {
  multiplier: '#F97316',       // Orange - the variable we track
  operator: '#9CA3AF',         // Neutral gray - sobriety
  table5Result: '#5DC09B',     // Green - table of 5 results
  table4Result: '#4ECDC4',     // Cyan - table of 4 results
  table10Result: '#4ECDC4',    // Cyan - table of 10 results
  pairIndicator: '#3B82F6',    // Blue - even numbers
  impairIndicator: '#EC4899',  // Pink - odd numbers
} as const;

export const AppColors = {
  primary: '#6C63FF',
  secondary: '#FF6B9D',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',

  timerStart: '#86EFAC', // Soft Green
  timerMiddle: '#FBBF24', // Amber/Orange
  timerEnd: '#F97316', // Orange

  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceLight: '#F5F7FF',

  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',

  border: '#E8ECEF',
  borderLight: '#F0F3F7',

  easy: '#A8E6CF',
  medium: '#FFE66D',
  hard: '#FF8B94',

  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.3)',
} as const;

export const GradientColors = {
  primary: ['#6C63FF', '#8B7FFF'],
  success: ['#4CAF50', '#66BB6A'],
  celebration: ['#FF6B9D', '#FFA06B', '#FFD06B'],
  background: ['#F8F9FE', '#E8ECFF'],
} as const;

export default {
  light: {
    tint: AppColors.primary,
  },
};
