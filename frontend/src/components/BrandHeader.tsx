/**
 * Componente: Encabezado de marca (MVC - componentes).
 *
 * Hero glassmorphic sobre fondo oscuro: logo en cápsula de cristal,
 * línea de acento neon, eslogan y título animados.
 *
 * Fixes: useNativeDriver:false, boxShadow instead of shadow* props,
 * textShadow via style string instead of textShadow* props.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { brandLogo } from '../assets/images';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';

type BrandHeaderProps = {
  title: string;
  subtitle: string;
};

const LOGO_ASPECT_RATIO = 4246 / 1026;

function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // false — web compat
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbTopRight]} />

      {/* Logo in glassy capsule */}
      <View style={styles.logoCapsule}>
        <View style={styles.logoShimmer} />
        <Image
          source={brandLogo}
          style={styles.logo}
          resizeMode="contain"
          testID="brand-logo"
        />
      </View>

      {/* Slogan with neon accent lines */}
      <View style={styles.sloganRow}>
        <View style={styles.accentLineLeft} />
        <Text style={styles.slogan}>COCHABAMBA · CIUDAD DE TODOS</Text>
        <View style={styles.accentLineRight} />
      </View>

      {/* Dot indicator */}
      <View style={styles.dotRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  orbTopLeft: {
    width: 120,
    height: 120,
    backgroundColor: Colors.accent,
    top: -30,
    left: -30,
  },
  orbTopRight: {
    width: 80,
    height: 80,
    backgroundColor: Colors.warning,
    top: 0,
    right: 10,
    opacity: 0.1,
  },
  logoCapsule: {
    width: '88%',
    backgroundColor: 'rgba(5, 18, 32, 0.75)',
    borderRadius: radius.cardLg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.28)',
    overflow: 'hidden',
    alignItems: 'center',
    // @ts-ignore
    boxShadow: `0 0 24px 0 ${Colors.accent}28`,
  },
  logoShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
  },
  logo: {
    width: '90%',
    aspectRatio: LOGO_ASPECT_RATIO,
    // Tint to make it pop on very dark backgrounds (web only)
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  accentLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.warning,
    opacity: 0.5,
    marginRight: spacing.sm,
  },
  accentLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.warning,
    opacity: 0.5,
    marginLeft: spacing.sm,
  },
  slogan: {
    color: Colors.warning,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textAlign: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.accent,
    // @ts-ignore
    boxShadow: `0 0 6px 0 ${Colors.accent}CC`,
  },
  title: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.extraBold,
    letterSpacing: letterSpacings.tight,
    textAlign: 'center',
    // textShadow replaces deprecated textShadow* props
    // @ts-ignore
    textShadow: `0 0 12px ${Colors.accent}4D`,
  },
  subtitle: {
    color: 'rgba(232,240,248,0.72)',
    fontSize: fontSizes.small,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 20,
  },
});

export default BrandHeader;
