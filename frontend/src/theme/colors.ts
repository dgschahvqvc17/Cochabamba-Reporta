/**
 * Design tokens — Colores (src/theme).
 *
 * Paleta institucional basada en los colores de la
 * Alcaldía Municipal de Cochabamba (ver rules/Frontend.md).
 *
 * @format
 */

export const Colors = {
  // Primarios
  primary: '#0B4A6F', // Azul Cochabamba
  accent: '#16A3E0', // Celeste Andino
  success: '#4CA866', // Verde Andino
  warning: '#F2B705', // Dorado Sol
  danger: '#E63946', // Rojo Granadilla

  // Tonos del fondo institucional
  navy: '#063043', // Azul profundo de fondo
  navyDeep: '#031220', // Azul casi negro (base del gradiente)

  // Neutros
  background: '#F4F7FA', // Gris Nieve
  surface: '#FFFFFF', // Blanco Puro
  surfaceSubtle: '#F3F6FA', // Gris Claro (inputs)
  border: '#E6ECF1', // Gris Suave
  borderSoft: '#E4EBF2',
  textPrimary: '#141B22', // Tinta
  textSecondary: '#8A94A2', // Gris Medio
  textOnPrimary: '#FFFFFF',
} as const;