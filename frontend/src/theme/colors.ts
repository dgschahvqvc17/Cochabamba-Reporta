/**
 * Design tokens — Colores (src/theme).
 *
 * Paleta "Dark Civic Tech" — Cochabamba Reporta.
 * Combina el azul institucional con tonos neon/glassmorphism modernos.
 *
 * @format
 */

export const Colors = {
  // ── Primarios institucionales ──────────────────────────────────────
  primary: '#0B4A6F',       // Azul Cochabamba (institucional)
  primaryLight: '#1A6FA0',  // Azul intermedio
  accent: '#00D4FF',        // Cyan Neon (acento principal)
  accentDim: '#16A3E0',     // Cyan estándar (botones, links)
  accentSoft: 'rgba(0, 212, 255, 0.18)', // Glassmorphic accent

  // ── Semánticos ────────────────────────────────────────────────────
  success: '#00E896',       // Verde neon
  successDim: '#4CA866',    // Verde estándar
  successSoft: 'rgba(0, 232, 150, 0.14)',
  warning: '#FFB800',       // Dorado vivo
  warningDim: '#F2B705',    // Dorado clásico
  warningSoft: 'rgba(255, 184, 0, 0.16)',
  danger: '#FF4560',        // Rojo coral neon
  dangerDim: '#E63946',     // Rojo estándar
  dangerSoft: 'rgba(255, 69, 96, 0.14)',
  info: '#A78BFA',          // Violeta info

  // ── Fondos oscuros (modo principal) ───────────────────────────────
  bgDark: '#050E1A',        // Fondo base casi negro
  bgDeep: '#030912',        // Fondo profundo (cards, modales)
  bgMid: '#071624',         // Fondo intermedio
  bgCard: '#0A1E30',        // Superficie de card dark
  bgCardHover: '#0E2640',   // Card hover state
  bgGlass: 'rgba(10, 30, 48, 0.72)',  // Glassmorphic dark
  bgGlassLight: 'rgba(255, 255, 255, 0.06)', // Glass blanco sutil

  // ── Superficie clara (formularios admin, listas) ──────────────────
  background: '#F0F4F8',    // Gris claro para pantallas admin
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F7FA',
  surfaceDark: '#0D1F32',   // Superficie dark para uso interno

  // ── Bordes ────────────────────────────────────────────────────────
  border: '#1A3A52',        // Borde dark
  borderLight: '#E6ECF1',   // Borde claro (para pantallas blancas)
  borderGlow: 'rgba(0, 212, 255, 0.35)', // Borde con glow
  borderSoft: '#E4EBF2',

  // ── Texto ─────────────────────────────────────────────────────────
  textPrimary: '#141B22',   // Texto principal (sobre blanco)
  textSecondary: '#8A94A2', // Texto secundario
  textOnPrimary: '#FFFFFF', // Texto sobre fondos oscuros
  textOnDark: '#E8F0F8',    // Texto claro sobre dark
  textMuted: 'rgba(232, 240, 248, 0.55)', // Texto atenuado sobre dark
  textAccent: '#00D4FF',    // Texto resaltado

  // ── Gradientes (colores de parada) ────────────────────────────────
  gradientStart: '#040D18',
  gradientMid: '#071828',
  gradientEnd: '#030912',

  // ── Legados (compatibilidad) ──────────────────────────────────────
  navy: '#063043',
  navyDeep: '#031220',
} as const;
