/**
 * Design tokens — Colores (src/theme).
 *
 * Paleta "Azul Refinado + Dorado" — Cochabamba Reporta.
 * Azul institucional sobrio y premium, sin neon/glassmorphism,
 * con dorado del escudo para marcos y acentos elegantes.
 * Diseño híbrido: cabeceras oscuras premium + contenido claro.
 *
 * @format
 */

export const Colors = {
  // ── Primarios institucionales ──────────────────────────────────────
  primary: '#124A70',       // Azul Cochabamba (institucional, sobrio)
  primaryLight: '#2A6D9E',  // Azul intermedio
  accent: '#3B82B8',        // Azul refinado (acento principal, sin neon)
  accentDim: '#1E5E8F',     // Azul profundo (botones, links)
  accentSoft: 'rgba(59, 130, 184, 0.16)', // Acento translúcido

  // ── Dorado del escudo (marcos y acentos premium) ───────────────────
  gold: '#C9A24B',          // Dorado institucional (marcos, separadores)
  goldDim: '#A88636',       // Dorado oscuro
  goldSoft: 'rgba(201, 162, 75, 0.16)', // Dorado translúcido

  // ── Semánticos ────────────────────────────────────────────────────
  success: '#2F9C6E',       // Verde institucional
  successDim: '#1F7150',    // Verde oscuro
  successSoft: 'rgba(47, 156, 110, 0.15)',
  warning: '#D9A441',       // Ámbar refinado
  warningDim: '#B3842A',    // Ámbar clásico
  warningSoft: 'rgba(217, 164, 65, 0.16)',
  danger: '#C2494F',        // Rojo institucional
  dangerDim: '#97303A',     // Rojo oscuro
  dangerSoft: 'rgba(194, 73, 79, 0.15)',
  info: '#6C5CB0',          // Violeta info

  // ── Fondos oscuros (cabeceras / hero premium) ──────────────────────
  bgDark: '#06182B',        // Fondo base azul noche
  bgDeep: '#030F1C',        // Fondo profundo (navbar, modales)
  bgMid: '#0A243C',         // Fondo intermedio
  bgCard: '#0D2C4A',        // Superficie de card dark
  bgCardHover: '#113758',   // Card hover state
  bgGlass: 'rgba(9, 32, 54, 0.82)',  // Glass dark refinado
  bgGlassLight: 'rgba(255, 255, 255, 0.06)', // Glass blanco sutil

  // ── Superficie clara (contenido admin, listas) ─────────────────────
  background: '#F2F5F9',    // Gris azulado claro para contenido
  surface: '#FFFFFF',
  surfaceSubtle: '#F6F9FC',
  surfaceDark: '#081B2E',   // Superficie dark para uso interno

  // ── Bordes ────────────────────────────────────────────────────────
  border: '#14375A',        // Borde dark
  borderLight: '#DCE4EC',   // Borde claro (pantallas blancas)
  borderGlow: 'rgba(59, 130, 184, 0.4)', // Borde con resplandor sutil
  borderGold: '#C9A24B',    // Borde dorado para marcos premium
  borderSoft: '#E5EBF2',

  // ── Texto ─────────────────────────────────────────────────────────
  textPrimary: '#12263A',   // Texto principal (sobre blanco)
  textSecondary: '#57677A', // Texto secundario
  textOnPrimary: '#FFFFFF', // Texto sobre fondos oscuros
  textOnDark: '#EDF4FA',    // Texto claro sobre dark
  textMuted: 'rgba(237, 244, 250, 0.6)', // Texto atenuado sobre dark
  textAccent: '#3B82B8',    // Texto resaltado

  // ── Gradientes (colores de parada) ────────────────────────────────
  gradientStart: '#020B14',
  gradientMid: '#0A2240',
  gradientEnd: '#030F1C',

  // ── Legados (compatibilidad) ──────────────────────────────────────
  navy: '#0A3A5C',
  navyDeep: '#04182A',
} as const;