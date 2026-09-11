/**
 * Componente compartido: Píldora o etiqueta de estado (MVC - componentes).
 *
 * Etiqueta redondeada codificada por color, usada para mostrar el rol
 * y el estado activo/inactivo de un usuario (HU03).
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';

export type PillTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

type PillBadgeProps = {
  label: string;
  tone?: PillTone;
};

const TONE_COLORS: Record<PillTone, { background: string; border: string; text: string }> = {
  primary: {
    background: 'rgba(11, 74, 111, 0.10)',
    border: Colors.primary,
    text: Colors.primary,
  },
  accent: {
    background: 'rgba(22, 163, 224, 0.10)',
    border: Colors.accent,
    text: Colors.accent,
  },
  success: {
    background: 'rgba(76, 168, 102, 0.12)',
    border: Colors.success,
    text: '#2E7D46',
  },
  warning: {
    background: 'rgba(242, 183, 5, 0.14)',
    border: '#E4A600',
    text: '#9A6C00',
  },
  danger: {
    background: 'rgba(230, 57, 70, 0.10)',
    border: Colors.danger,
    text: Colors.danger,
  },
  neutral: {
    background: Colors.surfaceSubtle,
    border: Colors.border,
    text: Colors.textSecondary,
  },
};

function PillBadge({ label, tone = 'neutral' }: PillBadgeProps) {
  const palette = TONE_COLORS[tone];

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: palette.background, borderColor: palette.border, color: palette.text },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
});

export default PillBadge;