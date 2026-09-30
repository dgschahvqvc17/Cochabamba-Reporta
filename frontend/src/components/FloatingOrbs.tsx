/**
 * Componente: Esferas decorativas animadas (MVC - componentes).
 *
 * Login / Registro (HU01/HU02): orbes de colores (dorado, azul y violeta)
 * inspirados en el escudo que se desplazan suavemente por todo el fondo,
 * detrás del contenido. `pointerEvents = none` para no bloquear la
 * interacción. Solo decorativo (useNativeDriver: false, web compat).
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';

import { Colors } from '../theme';

type OrbDef = {
  value: Animated.Value;
  size: number;
  color: string;
  top: DimensionValue;
  left: DimensionValue;
  duration: number;
  driftX: [number, number];
  driftY: [number, number];
  opacity: [number, number];
  scale?: [number, number];
};

const ORBS: Omit<OrbDef, 'value'>[] = [
  {
    // Esfera dorada grande (esquina superior izquierda)
    size: 260,
    color: `${Colors.gold}52`,
    top: -90,
    left: -70,
    duration: 8000,
    driftX: [-30, 70],
    driftY: [0, 150],
    opacity: [0.5, 0.18],
    scale: [1, 1.18],
  },
  {
    // Esfera azul media (lado derecho)
    size: 210,
    color: `${Colors.accent}45`,
    top: '44%',
    left: '74%',
    duration: 10500,
    driftX: [50, -40],
    driftY: [0, 110],
    opacity: [0.45, 0.16],
    scale: [1, 1.14],
  },
  {
    // Esfera violeta media (parte inferior)
    size: 240,
    color: `${Colors.info}40`,
    top: '75%',
    left: -60,
    duration: 13000,
    driftX: [-20, 90],
    driftY: [-60, 30],
    opacity: [0.4, 0.14],
    scale: [1, 1.18],
  },
];

function startDrift(
  value: Animated.Value,
  duration: number,
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }),
    ]),
  );
}

function FloatingOrbs() {
  const gold = useRef(new Animated.Value(0)).current;
  const accent = useRef(new Animated.Value(0)).current;
  const info = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftGold = startDrift(gold, ORBS[0].duration);
    const driftAccent = startDrift(accent, ORBS[1].duration);
    const driftInfo = startDrift(info, ORBS[2].duration);
    driftGold.start();
    driftAccent.start();
    driftInfo.start();
    return () => {
      driftGold.stop();
      driftAccent.stop();
      driftInfo.stop();
    };
  }, [gold, accent, info]);

  const renderOrb = (def: Omit<OrbDef, 'value'>, value: Animated.Value) => (
    <Orb key={def.color} def={def} value={value} />
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      {renderOrb(ORBS[0], gold)}
      {renderOrb(ORBS[1], accent)}
      {renderOrb(ORBS[2], info)}
    </View>
  );
}

function Orb({
  def,
  value,
}: {
  def: Omit<OrbDef, 'value'>;
  value: Animated.Value;
}) {
  const translateX = value.interpolate({
    inputRange: [0, 1],
    outputRange: def.driftX,
  });
  const translateY = value.interpolate({
    inputRange: [0, 1],
    outputRange: def.driftY,
  });
  const opacity = value.interpolate({
    inputRange: [0, 1],
    outputRange: def.opacity,
  });
  const scale = def.scale
    ? value.interpolate({ inputRange: [0, 1], outputRange: def.scale })
    : 1;

  const orbStyle: ViewStyle = {
    position: 'absolute',
    top: def.top,
    left: def.left,
    width: def.size,
    height: def.size,
    borderRadius: def.size / 2,
    backgroundColor: def.color,
    // @ts-ignore — boxShadow (web) genera el halo suave de la esfera
    boxShadow: `0 0 ${Math.round(def.size / 2)}px 26px ${def.color}`,
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        orbStyle,
        { opacity, transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});

export default FloatingOrbs;