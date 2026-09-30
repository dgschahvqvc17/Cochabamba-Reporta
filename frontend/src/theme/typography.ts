/**
 * Design tokens — Tipografía (src/theme).
 *
 * Escala tipográfica "Dark Civic Tech" — Cochabamba Reporta.
 * Poppins (display/headings) + Inter (body/ui).
 *
 * @format
 */

export const fonts = {
  heading: 'Poppins',  // Instalar: @fontsource/poppins
  body: 'Inter',       // Instalar: @fontsource/inter
} as const;

export const fontSizes = {
  hero: 42,      // Pantalla de bienvenida / splash
  display: 34,   // Títulos de pantalla principales
  h1: 28,        // Sección grande
  h2: 22,        // Tarjetas y paneles
  h3: 18,        // Sub-secciones
  h4: 16,        // Labels destacados
  body: 15,      // Texto de cuerpo estándar
  bodyLg: 17,    // Cuerpo grande
  small: 13,     // Texto pequeño
  caption: 11,   // Etiquetas, badges, metadata
  micro: 10,     // Auxiliar / uppercase labels
} as const;

export const fontWeights = {
  thin: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 1.8,
} as const;

export const letterSpacings = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2.5,
} as const;
