/**
 * Componente compartido: Botón principal (MVC - componentes).
 *
 * Diseño moderno: píldora con degradado Azul Cochabamba → Celeste Andino,
 * sombra de resplandor, escala al presionar y estados loading/disabled.
 *
 * @format
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, fontWeights, spacing } from '../theme';
import GradientOverlay from './GradientOverlay';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pressable,
        isDisabled && styles.pressableDisabled,
        pressed && !isDisabled && styles.pressablePressed,
      ]}
    >
      <View style={styles.button}>
        <GradientOverlay
          colors={[Colors.primary, '#0E7BB8', Colors.accent]}
          style={styles.gradient}
        />
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#0B7FB8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
    marginVertical: spacing.base,
  },
  pressablePressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.2,
  },
  pressableDisabled: {
    opacity: 0.55,
  },
  button: {
    borderRadius: 30,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  gradient: {
    borderRadius: 30,
  },
  label: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.4,
  },
});

export default PrimaryButton;