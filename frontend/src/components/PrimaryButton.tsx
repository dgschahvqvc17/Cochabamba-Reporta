/**
 * Componente: Botón principal (MVC - componentes).
 *
 * Diseño neon-glass: gradiente cyan→azul, resplandor animado pulsante,
 * spring de escala al presionar, estados loading/disabled.
 *
 * useNativeDriver: false (web no tiene native driver).
 * Sombras via boxShadow (no shadow* props obsoletas).
 *
 * @format
 */

import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, fontWeights, radius, spacing } from '../theme';
import GradientOverlay from './GradientOverlay';

type Variant = 'primary' | 'ghost' | 'danger';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
};

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = true,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Removed glow pulse animation — Animated.Value driving boxShadow
  // requires useNativeDriver:false and interpolating non-layout props,
  // which is unreliable on web. Static boxShadow looks fine.

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: false,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.ghostWrapper,
          !fullWidth && styles.inline,
          isDisabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[styles.ghostBtn, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.ghostLabel}>{label}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.wrapper,
          !fullWidth && styles.inline,
          isDisabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[
            styles.btn,
            styles.dangerBtn,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.glowWrap,
        !fullWidth && styles.inline,
        isDisabled && styles.disabled,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.wrapper}
      >
        <Animated.View
          style={[styles.btn, { transform: [{ scale: scaleAnim }] }]}
        >
          <GradientOverlay
            colors={['#005F8A', Colors.accentDim, Colors.accent]}
            style={styles.gradient}
          />
          <View style={styles.shimmer} />
          {loading ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    borderRadius: radius.pill,
    marginVertical: spacing.base,
    // boxShadow replaces deprecated shadow* props
    // @ts-ignore
    boxShadow: `0 0 18px 0 ${Colors.accent}55`,
  },
  wrapper: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  ghostWrapper: {
    marginVertical: spacing.base,
  },
  inline: {
    alignSelf: 'flex-start',
  },
  btn: {
    borderRadius: radius.pill,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  dangerBtn: {
    backgroundColor: Colors.danger,
    borderRadius: radius.pill,
    minHeight: 56,
  },
  ghostBtn: {
    borderRadius: radius.pill,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  gradient: {
    borderRadius: radius.pill,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
  },
  label: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.6,
  },
  ghostLabel: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.6,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default PrimaryButton;
