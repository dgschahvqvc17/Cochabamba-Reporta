/**
 * Pantalla: Inicio del personal municipal (MVC - View).
 *
 * HU09 — Consultar y gestionar incidentes (Encargado de recepción).
 * HU10 — Asignar incidente para verificación (Encargado de recepción).
 * Dashboard del personal de atención (RECEPCION, VERIFICADOR,
 * ENCARGADO_SOLUCION, PERSONAL_SOLUCION): perfil del usuario y acceso
 * a los módulos de consulta de incidentes y, para recepción,
 * de asignación de incidentes para verificación.
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
import PillBadge, { type PillTone } from '../components/PillBadge';
import { cityBackground } from '../assets/images';
import type { Role, User } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { ROLE_LABELS } from '../utils/roles';

type StaffHomeScreenProps = {
  user: User;
  onGoToIncidents: () => void;
  onGoToPendingVerification: () => void;
};

const ROLE_TONES: Partial<Record<Role, PillTone>> = {
  RECEPCION: 'neutral',
  VERIFICADOR: 'warning',
  ENCARGADO_SOLUCION: 'info',
  PERSONAL_SOLUCION: 'success',
  ADMINISTRADOR: 'primary',
};

const ROLE_COLORS: Partial<Record<Role, string>> = {
  RECEPCION: Colors.textSecondary,
  VERIFICADOR: Colors.warning,
  ENCARGADO_SOLUCION: Colors.info,
  PERSONAL_SOLUCION: Colors.success,
  ADMINISTRADOR: Colors.danger,
};

function StaffHomeScreen({
  user,
  onGoToIncidents,
  onGoToPendingVerification,
}: StaffHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const roleTone = ROLE_TONES[user.role] ?? 'neutral';
  const roleColor = ROLE_COLORS[user.role] ?? Colors.accent;

  return (
    <View style={styles.flex}>
      <ImageBackground
        source={cityBackground}
        style={styles.flex}
        resizeMode="cover"
      >
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
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.eyebrow}>⬡ MÓDULO DE ATENCIÓN</Text>
            <Text style={styles.heroTitle}>Centro de{'\n'}recepción</Text>
            <Text style={styles.heroSub}>
              Consulta y gestiona los incidentes reportados por la ciudadanía.
            </Text>
          </Animated.View>

          {/* Profile card */}
          <Animated.View
            style={[
              styles.profileCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={[styles.cardBar, { backgroundColor: roleColor }]} />

            <View style={styles.profileContent}>
              <View style={styles.avatarOuter}>
                <View style={[styles.avatarRing, { borderColor: roleColor }]} />
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.statusDot} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileRole, { color: roleColor }]}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Text>
                <Text style={styles.profileName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user.email}
                </Text>
                <View style={styles.badgeRow}>
                  <PillBadge
                    label={ROLE_LABELS[user.role] ?? user.role}
                    tone={roleTone}
                    dot
                  />
                  <PillBadge
                    label={user.active ? 'Activo' : 'Inactivo'}
                    tone={user.active ? 'success' : 'neutral'}
                    dot
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Module */}
          <Text style={styles.sectionLabel}>MÓDULOS DISPONIBLES</Text>

          <ModuleCard
            icon="report"
            label="Consultar incidentes"
            description="Busca incidentes, filtra por estado, categoría y fecha, y consulta el detalle con el ciudadano, la ubicación y la evidencia."
            color={Colors.accent}
            onPress={onGoToIncidents}
          />

          {user.role === 'RECEPCION' ? (
            <ModuleCard
              icon="shieldCheck"
              label="Asignar a verificación"
              description="Asigna los incidentes pendientes (reportados o recibidos) a un funcionario de verificación para que verifique los hechos."
              color={Colors.success}
              onPress={onGoToPendingVerification}
            />
          ) : null}

          <View style={styles.sysInfoCard}>
            <Icon name="shieldCheck" size={18} color={Colors.success} />
            <Text style={styles.sysInfoText}>
              Sistema seguro · Cochabamba Reporta · Acceso restringido por rol
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function ModuleCard({
  icon,
  label,
  description,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleCard,
        { borderColor: color + '30' },
        pressed && styles.moduleCardPressed,
      ]}
    >
      <View style={[styles.moduleAccent, { backgroundColor: color }]} />
      <View
        style={[
          styles.moduleIconWrap,
          { backgroundColor: color + '14', borderColor: color + '35' },
        ]}
      >
        <Icon name={icon} size={26} color={color} />
      </View>
      <View style={styles.moduleTextWrap}>
        <Text style={styles.moduleLabel}>{label}</Text>
        <Text style={styles.moduleDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.moduleArrow,
          { borderColor: color + '40', backgroundColor: color + '0C' },
        ]}
      >
        <Icon name="arrowRight" size={18} color={color} />
      </View>
    </Pressable>
  );
}

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
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
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
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginTop: spacing.xl,
    marginBottom: spacing.base,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 22, 36, 0.85)',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  moduleCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  moduleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  moduleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.element,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  moduleTextWrap: {
    flex: 1,
    marginHorizontal: spacing.base,
  },
  moduleLabel: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  moduleDescription: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  moduleArrow: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

export default StaffHomeScreen;