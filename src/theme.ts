// Design tokens that don't depend on the colour theme (colours live in paleta.ts and come from useColors()).
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const fonts = { body: 'Lexend_400Regular', medium: 'Lexend_500Medium', semi: 'Lexend_600SemiBold', logo: 'Unbounded_700Bold' };

export const type = {
  hero: { fontFamily: fonts.semi, fontSize: 36, lineHeight: 42 },
  title: { fontFamily: fonts.semi, fontSize: 24, lineHeight: 30 },
  subheading: { fontFamily: fonts.semi, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
};
