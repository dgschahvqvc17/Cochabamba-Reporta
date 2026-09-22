/**
 * Componente: Píldora / etiqueta de estado (MVC - componentes).
 *
 * Badge discreto con borde sutil y texto uppercase.
 * Soporte dark/light.
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';

export type PillTone =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info';

type PillBadgeProps = {
  label: string;
  tone?: PillTone;
  dot?: boolean;
};

type ToneStyle = {
  bg: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
};

const TONES: Record<PillTone, ToneStyle> = {
  primary: {
    bg: 'rgba(42, 109, 158, 0.14)',
    border: 'rgba(42, 109, 158, 0.5)',
    text: Colors.primaryLight,
    dot: Colors.primaryLight,
    glow: 'rgba(18, 74, 112, 0.4)',
  },
  accent: {
    bg: 'rgba(59, 130, 184, 0.12)',
    border: 'rgba(59, 130, 184, 0.4)',
    text: Colors.accent,
    dot: Colors.accent,
    glow: 'rgba(59, 130, 184, 0.25)',
  },
  success: {
    bg: 'rgba(47, 156, 110, 0.12)',
    border: 'rgba(47, 156, 110, 0.4)',
    text: Colors.success,
    dot: Colors.success,
    glow: 'rgba(47, 156, 110, 0.25)',
  },
  warning: {
    bg: 'rgba(217, 164, 65, 0.14)',
    border: 'rgba(217, 164, 65, 0.45)',
    text: Colors.warning,
    dot: Colors.warning,
    glow: 'rgba(217, 164, 65, 0.3)',
  },
  danger: {
    bg: 'rgba(194, 73, 79, 0.12)',
    border: 'rgba(194, 73, 79, 0.4)',
    text: Colors.danger,
    dot: Colors.danger,
    glow: 'rgba(194, 73, 79, 0.25)',
  },
  neutral: {
    bg: 'rgba(138, 148, 162, 0.10)',
    border: 'rgba(138, 148, 162, 0.3)',
    text: Colors.textSecondary,
    dot: Colors.textSecondary,
    glow: 'transparent',
  },
  info: {
    bg: 'rgba(108, 92, 176, 0.12)',
    border: 'rgba(108, 92, 176, 0.4)',
    text: Colors.info,
    dot: Colors.info,
    glow: 'rgba(108, 92, 176, 0.25)',
  },
};

function PillBadge({ label, tone = 'neutral', dot = false }: PillBadgeProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
        },
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: t.dot }]} />
      )}
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default PillBadge;
