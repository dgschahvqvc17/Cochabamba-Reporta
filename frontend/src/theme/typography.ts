/**
 * Design tokens — Tipografía (src/theme).
 *
 * Escala tipográfica definida en rules/Frontend.md.
 * Las familias Poppins (títulos) e Inter (cuerpo) se deben instalar
 * como fuentes nativas en cada plataforma; mientras tanto se usa la
 * fuente del sistema con la misma escala y pesos.
 *
 * @format
 */

export const fonts = {
  heading: undefined, // 'Poppins' cuando se instale
  body: undefined, // 'Inter' cuando se instale
} as const;

export const fontSizes = {
  display: 34,
  h2: 24,
  h3: 18,
  body: 15,
  caption: 12,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;