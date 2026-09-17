/**
 * Componente: Encabezado con imagen de fondo para pantallas admin (MVC - componentes).
 *
 * Hero full-bleed con overlay glassmorphic multicapa, logo en anillo neon,
 * título animado y curva de transición.
 *
 * Fixes: useNativeDriver:false, boxShadow/textShadow instead of deprecated props.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brandLogo } from '../assets/images';
import {
  Colors,
  fontSizes,
  fontWeights,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import GradientOverlay from './GradientOverlay';
import Icon from './Icon';

type AdminImageHeaderProps = {
  background: ImageSourcePropType;
  title: string;
  subtitle?: string;
  badge?: string;
  onBack: () => void;
  /** Fondo del contenido que sigue al encabezado; la curva lo replica (dark por defecto). */
  contentBackground?: string;
};

function AdminImageHeader({
  background,
  title,
  subtitle,
  badge,
  onBack,
  contentBackground = Colors.bgDeep,
}: AdminImageHeaderProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // web compat
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Multi-layer dark overlay */}
      <GradientOverlay
        colors={[
          'rgba(3, 9, 18, 0.88)',
          'rgba(5, 14, 26, 0.78)',
          'rgba(7, 24, 40, 0.72)',
          'rgba(3, 9, 18, 0.9)',
        ]}
      />
      {/* Cyan tint at bottom */}
      <View style={styles.cyanTint} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {/* Top row: back + logo */}
        <View style={styles.topRow}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
            testID="admin-back"
          >
            <Icon name="chevronLeft" size={22} color={Colors.textOnPrimary} />
          </Pressable>

          {/* Logo institucional como banner horizontal (no en círculo) */}
          <View style={styles.logoCapsule}>
            <Image
              source={brandLogo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.sideSlot} />
        </View>

        {/* Title block */}
        <Animated.View
          style={[
            styles.titleBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {badge && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleDot} />
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* Transición al contenido: la curva replica el fondo de la pantalla */}
      <View style={[styles.curve, { backgroundColor: contentBackground }]} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: '100%',
    overflow: 'hidden',
  },
  cyanTint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 212, 255, 0.04)',
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideSlot: { width: 44 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.element,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    transform: [{ scale: 0.94 }],
  },
  logoCapsule: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.element,
    backgroundColor: 'rgba(5, 18, 32, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.28)',
    // boxShadow sustituye a shadow* (deprecados)
    // @ts-ignore
    boxShadow: `0 0 14px 0 ${Colors.accent}33`,
  },
  logo: {
    width: 176,
    height: 42,
  },
  titleBlock: {
    marginTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: Colors.accent,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
  },
  title: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.extraBold,
    letterSpacing: letterSpacings.tight,
    // textShadow replaces textShadow* props
    // @ts-ignore
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginRight: 8,
    // @ts-ignore
    boxShadow: `0 0 4px 0 ${Colors.accent}CC`,
  },
  subtitle: {
    color: 'rgba(232,240,248,0.75)',
    fontSize: fontSizes.small,
  },
  curve: {
    height: 24,
    // Radio mayor que la altura → arco suave y amplio (no un semicírculo)
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
});

export default AdminImageHeader;
