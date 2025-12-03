export const FontFamily = {
  title: 'Fredoka_700Bold',
  titleMedium: 'Fredoka_600SemiBold',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyRegular: 'Nunito_400Regular',
} as const;

export type FontFamilyType = typeof FontFamily[keyof typeof FontFamily];
