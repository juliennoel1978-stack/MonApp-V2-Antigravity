export const NumberColors = {
  1: '#FF6B6B',
  2: '#4ECDC4',
  3: '#95E1D3',
  4: '#FFE66D',
  5: '#A8E6CF',
  6: '#C7CEEA',
  7: '#FFDAC1',
  8: '#FF8B94',
  9: '#B4A7D6',
  10: '#FFD3B6',
} as const;

export const AppColors = {
  primary: '#6C63FF',
  secondary: '#FF6B9D',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  
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
