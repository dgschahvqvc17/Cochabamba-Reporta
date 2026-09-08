/**
 * Componente compartido: Gradiente vertical por capas (MVC - componentes).
 *
 * Renderiza un degradado interpolando los colores recibidos en bandas
 * horizontales. Implementación 100% Views (React Native) para que funcione
 * igual en web y en dispositivo, sin módulos nativos.
 *
 * @format
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const STEPS = 28;

type Rgba = [number, number, number, number];

function parseColor(color: string): Rgba {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(color);
  if (!match) {
    return [0, 0, 0, 1];
  }
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] === undefined ? 1 : Number(match[4]),
  ];
}

function toRgba(color: Rgba): string {
  const [r, g, b, a] = color;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
    b,
  )}, ${a.toFixed(3)})`;
}

type GradientOverlayProps = {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
};

function GradientOverlay({ colors, style }: GradientOverlayProps) {
  const stops = colors.map(parseColor);

  const bands = Array.from({ length: STEPS }, (_, index) => {
    const t = index / (STEPS - 1);
    const scaled = t * (stops.length - 1);
    const segment = Math.min(Math.floor(scaled), stops.length - 2);
    const fraction = scaled - segment;
    const from = stops[segment];
    const to = stops[segment + 1];

    return toRgba([
      from[0] + (to[0] - from[0]) * fraction,
      from[1] + (to[1] - from[1]) * fraction,
      from[2] + (to[2] - from[2]) * fraction,
      from[3] + (to[3] - from[3]) * fraction,
    ]);
  });

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {bands.map((backgroundColor, index) => (
        <View key={index} style={[styles.band, { backgroundColor }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flex: 1,
  },
});

export default GradientOverlay;