/**
 * Componente: Píldora / etiqueta de estado (MVC - componentes).
 *
 * Badge glassmorphic con glow de color y texto uppercase.
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
    bg: 'rgba(11, 74, 111, 0.18)',
    border: 'rgba(26, 111, 160, 0.6)',
    text: '#5BC8F5',
    dot: '#5BC8F5',
    glow: 'rgba(11, 74, 111, 0.4)',
  },
  accent: {
    bg: 'rgba(0, 212, 255, 0.12)',
    border: 'rgba(0, 212, 255, 0.4)',
    text: Colors.accent,
    dot: Colors.accent,
    glow: 'rgba(0, 212, 255, 0.25)',
  },
  success: {
    bg: 'rgba(0, 232, 150, 0.12)',
    border: 'rgba(0, 232, 150, 0.4)',
    text: Colors.success,
    dot: Colors.success,
    glow: 'rgba(0, 232, 150, 0.25)',
  },
  warning: {
    bg: 'rgba(255, 184, 0, 0.14)',
    border: 'rgba(255, 184, 0, 0.45)',
    text: Colors.warning,
    dot: Colors.warning,
    glow: 'rgba(255, 184, 0, 0.3)',
  },
  danger: {
    bg: 'rgba(255, 69, 96, 0.12)',
    border: 'rgba(255, 69, 96, 0.4)',
    text: Colors.danger,
    dot: Colors.danger,
    glow: 'rgba(255, 69, 96, 0.25)',
  },
  neutral: {
    bg: 'rgba(138, 148, 162, 0.10)',
    border: 'rgba(138, 148, 162, 0.3)',
    text: Colors.textSecondary,
    dot: Colors.textSecondary,
    glow: 'transparent',
  },
  info: {
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.4)',
    text: Colors.info,
    dot: Colors.info,
    glow: 'rgba(167, 139, 250, 0.25)',
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
