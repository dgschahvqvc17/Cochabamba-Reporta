/**
 * Pantalla: Panel de administración (MVC - View).
 *
 * HU03 — Command center: fondo dark con foto, tarjeta de perfil
 * premium, cards de módulos con iconos neon y animaciones de entrada.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientOverlay from '../components/GradientOverlay';
import Icon, { type IconName } from '../components/Icon';
import PillBadge from '../components/PillBadge';
import { cityBackground } from '../assets/images';
import type { User } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';

type AdminScreenProps = {
  user: User;
  onGoToUsers: () => void;
  onGoToCategories: () => void;
};

type ModuleCard = {
  icon: IconName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
};

function AdminScreen({ user, onGoToUsers, onGoToCategories }: AdminScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, easing: Easing.out(Easing.back(1.1)), useNativeDriver: false }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim]);

  const modules: ModuleCard[] = [
    {
      icon: 'users',
      label: 'Usuarios y roles',
      description: 'Registrar, consultar, editar, activar o desactivar cuentas y asignar roles.',
      color: Colors.accent,
      onPress: onGoToUsers,
    },
    {
      icon: 'category',
      label: 'Categorías',
      description: 'Registrar, consultar, editar y activar o desactivar categorías de incidentes.',
      color: Colors.success,
      onPress: onGoToCategories,
    },
  ];

  return (
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.96)',
            'rgba(5, 14, 26, 0.9)',
            'rgba(4, 9, 18, 0.97)',
          ]}
        />
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.eyebrow}>⬡ PANEL ADMINISTRATIVO</Text>
            <Text style={styles.heroTitle}>Centro de{'\n'}administración</Text>
            <Text style={styles.heroSub}>
              Gestiona los usuarios, roles y configuración del sistema.
            </Text>
          </Animated.View>

          {/* Profile card */}
          <Animated.View
            style={[
              styles.profileCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.cardBar} />
            <View style={styles.cardShimmer} />

            <View style={styles.profileContent}>
              {/* Avatar */}
              <View style={styles.avatarOuter}>
                <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.statusDot} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileRole}>ADMINISTRADOR</Text>
                <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
                <View style={styles.badgeRow}>
                  <PillBadge label="Admin" tone="primary" dot />
                  <PillBadge label={user.active ? 'Activo' : 'Inactivo'} tone={user.active ? 'success' : 'neutral'} dot />
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCell label="Módulos" value="2" color={Colors.accent} />
              <View style={styles.statDivider} />
              <StatCell label="Acceso total" value="Sí" color={Colors.success} />
              <View style={styles.statDivider} />
              <StatCell label="Rol" value="Admin" color={Colors.warning} />
            </View>
          </Animated.View>

          {/* Section label */}
          <Text style={styles.sectionLabel}>MÓDULOS DEL SISTEMA</Text>

          {/* Module cards */}
          {modules.map((mod, i) => (
            <ModuleCardView key={i} module={mod} delay={i * 100} />
          ))}

          {/* System info */}
          <View style={styles.sysInfoCard}>
            <Icon name="shieldCheck" size={18} color={Colors.success} />
            <Text style={styles.sysInfoText}>
              Sistema seguro · Cochabamba Reporta v1.0
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={statStyles.cell}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  value: { fontSize: fontSizes.h3, fontWeight: fontWeights.extraBold },
  label: { color: Colors.textMuted, fontSize: fontSizes.micro, marginTop: 2, letterSpacing: 0.5 },
});

function ModuleCardView({ module: mod, delay }: { module: ModuleCard; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false, speed: 40, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <Pressable
        onPress={mod.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[modStyles.card, { borderColor: mod.color + '30' }]}
      >
        {/* Left accent bar */}
        <View style={[modStyles.accentBar, { backgroundColor: mod.color }]} />

        {/* Icon */}
        <View style={[modStyles.iconWrap, { backgroundColor: mod.color + '14', borderColor: mod.color + '35' }]}>
          <Icon name={mod.icon} size={26} color={mod.color} />
        </View>

        {/* Text */}
        <View style={modStyles.textWrap}>
          <Text style={modStyles.label}>{mod.label}</Text>
          <Text style={modStyles.description} numberOfLines={2}>{mod.description}</Text>
        </View>

        {/* Arrow */}
        <View style={[modStyles.arrowWrap, { borderColor: mod.color + '40', backgroundColor: mod.color + '0C' }]}>
          <Icon name="arrowRight" size={18} color={mod.color} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const modStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 22, 36, 0.85)',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.element,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  textWrap: {
    flex: 1,
    marginHorizontal: spacing.base,
  },
  label: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  description: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  arrowWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  orbTL: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    top: -80,
    left: -80,
  },
  orbBR: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    bottom: 150,
    right: -50,
  },
  content: {
    paddingHorizontal: spacing.base,
    // Extra bottom padding so last content clears the navbar (~72px) + safe area buffer
    paddingBottom: spacing.huge,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.extraBold,
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroSub: {
    color: Colors.textMuted,
    fontSize: fontSizes.small,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(7, 22, 36, 0.88)',
    borderRadius: radius.cardLg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    overflow: 'hidden',
  },
  cardBar: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  cardShimmer: {
    height: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.03)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.base,
  },
  avatarOuter: {
    position: 'relative',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.accent,
    opacity: 0.35,
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accentDim,
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.extraBold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.bgMid,
  },
  profileInfo: { flex: 1 },
  profileRole: {
    color: Colors.accent,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
  },
  profileName: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  profileEmail: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 255, 0.1)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginTop: spacing.xl,
    marginBottom: spacing.base,
  },
  sysInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successSoft,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: 'rgba(0, 232, 150, 0.2)',
    padding: spacing.base,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sysInfoText: {
    color: Colors.success,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});

export default AdminScreen;
