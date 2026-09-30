/**
 * Componente: Gradiente vertical multi-parada (MVC - componentes).
 *
 * Renderiza un degradado interpolando N colores en bandas horizontales.
 * 100 % Views — sin módulos nativos — funciona en web y móvil.
 *
 * pointerEvents movido a style (evita la advertencia de deprecación en web).
 *
 * @format
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const STEPS = 40;

type Rgba = [number, number, number, number];

function parseColor(color: string): Rgba {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(color.trim());
  if (hex) {
    const v = hex[1];
    if (v.length === 3 || v.length === 4) {
      const [r, g, b, a] = v.split('').map((c) => parseInt(c + c, 16));
      return [r, g, b, a !== undefined ? a / 255 : 1];
    }
    if (v.length === 6) {
      return [
        parseInt(v.slice(0, 2), 16),
        parseInt(v.slice(2, 4), 16),
        parseInt(v.slice(4, 6), 16),
        1,
      ];
    }
    if (v.length === 8) {
      return [
        parseInt(v.slice(0, 2), 16),
        parseInt(v.slice(2, 4), 16),
        parseInt(v.slice(4, 6), 16),
        parseInt(v.slice(6, 8), 16) / 255,
      ];
    }
  }
  const match =
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/.exec(
      color,
    );
  if (match) {
    return [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      match[4] === undefined ? 1 : Number(match[4]),
    ];
  }
  return [0, 0, 0, 1];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function toRgba([r, g, b, a]: Rgba): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${Math.min(
    1,
    Math.max(0, a),
  ).toFixed(3)})`;
}

type GradientOverlayProps = {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
};

function GradientOverlay({ colors, style }: GradientOverlayProps) {
  const stops = colors.map(parseColor);

  const bands = Array.from({ length: STEPS }, (_, i) => {
    const t = i / (STEPS - 1);
    const scaled = t * (stops.length - 1);
    const seg = Math.min(Math.floor(scaled), stops.length - 2);
    const f = scaled - seg;
    const from = stops[seg];
    const to = stops[seg + 1];
    return toRgba([
      lerp(from[0], to[0], f),
      lerp(from[1], to[1], f),
      lerp(from[2], to[2], f),
      lerp(from[3], to[3], f),
    ]);
  });

  return (
    // pointerEvents in style prop (not as a direct prop — avoids deprecation warning)
    <View style={[StyleSheet.absoluteFill, styles.none, style]}>
      {bands.map((bg, i) => (
        <View key={i} style={[styles.band, { backgroundColor: bg }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  none: {
    // @ts-ignore — pointerEvents as style is the new API on react-native-web
    pointerEvents: 'none',
  },
  band: { flex: 1 },
});

export default GradientOverlay;
