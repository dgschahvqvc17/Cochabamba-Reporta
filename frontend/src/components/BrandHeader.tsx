/**
 * Componente: Encabezado de marca (MVC - componentes).
 *
 * Hero premium sobre fondo oscuro: logo en cápsula con marco dorado,
 * líneas de acento, eslogan y título animados.
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
  fonts,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
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

      {/* Logo */}
      <Image
        source={brandLogo}
        style={styles.logo}
        resizeMode="contain"
        testID="brand-logo"
      />

      {/* Slogan with gold accent lines */}
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
  logo: {
    width: '78%',
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
    height: 1.5,
    backgroundColor: Colors.gold,
    opacity: 0.65,
    marginRight: spacing.sm,
  },
  accentLineRight: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.gold,
    opacity: 0.65,
    marginLeft: spacing.sm,
  },
  slogan: {
    color: Colors.gold,
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
    backgroundColor: Colors.gold,
  },
  title: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.extraBold,
    fontFamily: fonts.heading,
    letterSpacing: letterSpacings.tight,
    textAlign: 'center',
    // textShadow replaces deprecated textShadow* props
    // @ts-ignore
    textShadow: '0 2px 18px rgba(2, 10, 18, 0.65)',
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
