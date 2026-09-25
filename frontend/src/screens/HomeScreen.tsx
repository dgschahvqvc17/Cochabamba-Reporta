/**
 * Pantalla: Principal del ciudadano (MVC - View).
 *
 * HU02 — Dashboard premium: fondo con foto + overlay,
 * tarjeta de perfil con marco dorado, grid de acciones refinado
 * y sección de estado.
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientOverlay from '../components/GradientOverlay';
import Icon, { type IconName } from '../components/Icon';
import PillBadge from '../components/PillBadge';
import { cityBackground } from '../assets/images';
import { loadUnreadNotificationCount } from '../controllers/notificationController';
import type { User } from '../models/User';
import {
  Colors,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';

type HomeScreenProps = {
  user: User;
  onNewIncident?: () => void;
  onViewReports?: () => void;
  onViewNotifications?: () => void;
  onViewProfile?: () => void;
};

type QuickAction = {
  icon: IconName;
  label: string;
  sub: string;
  color: string;
  bg: string;
};

const ACTIONS: QuickAction[] = [
  { icon: 'report', label: 'Nuevo reporte', sub: 'Registrar incidente', color: Colors.accent, bg: Colors.accentSoft },
  { icon: 'map', label: 'Mis reportes', sub: 'Ver seguimiento', color: Colors.success, bg: Colors.successSoft },
  { icon: 'bell', label: 'Notificaciones', sub: 'Alertas recientes', color: Colors.warning, bg: Colors.warningSoft },
  { icon: 'settings', label: 'Perfil', sub: 'Mis datos', color: Colors.info, bg: 'rgba(108,92,176,0.12)' },
];

function HomeScreen({
  user,
  onNewIncident,
  onViewReports,
  onViewNotifications,
  onViewProfile,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= layout.breakpointMd;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    let mounted = true;

    // HU14 — Alerta de nuevos cambios: badge con las no leídas.
    loadUnreadNotificationCount().then((result) => {
      if (mounted && result.success) {
        setUnreadCount(result.data ?? 0);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim]);

  return (
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.95)',
            'rgba(5, 14, 26, 0.88)',
            'rgba(4, 9, 18, 0.96)',
          ]}
        />
        {/* Orbs */}
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header text */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.eyebrow}>⬡ COCHABAMBA REPORTA</Text>
            <Text style={styles.heroTitle}>Sistema de{'\n'}Reportes Urbanos</Text>
            <Text style={styles.heroSub}>
              Reporta, rastrea y contribuye a mejorar tu ciudad.
            </Text>
          </Animated.View>

          {/* Profile card */}
          <Animated.View
            style={[
              styles.profileCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Card bar */}
            <View style={styles.cardBar} />

            <View style={styles.profileRow}>
              {/* Avatar with pulse ring */}
              <View style={styles.avatarOuter}>
                <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileGreeting}>Bienvenido,</Text>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user.firstName} {user.lastName}
                </Text>
                <View style={styles.badgeRow}>
                  <PillBadge label={user.role} tone="accent" dot />
                  <PillBadge label={user.active ? 'Activo' : 'Inactivo'} tone={user.active ? 'success' : 'neutral'} dot />
                </View>
              </View>
            </View>

            {/* Info grid */}
            <View style={styles.infoGrid}>
              <InfoChip label="Correo" value={user.email} icon="person" />
              <InfoChip label="Teléfono" value={user.phone || '—'} icon="bell" />
            </View>
          </Animated.View>

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View
            style={[
              styles.actionsGrid,
              !isDesktop && styles.actionsGridVertical,
            ]}
          >
            {ACTIONS.map((action, i) => (
              <ActionCard
                key={i}
                action={action}
                delay={i * 80}
                vertical={!isDesktop}
                badge={i === 2 ? unreadCount : undefined}
                onPress={
                  i === 0
                    ? onNewIncident
                    : i === 1
                    ? onViewReports
                    : i === 2
                    ? onViewNotifications
                    : i === 3
                    ? onViewProfile
                    : undefined
                }
              />
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function InfoChip({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <View style={chipStyles.container}>
      <Icon name={icon} size={14} color={Colors.accent} />
      <View style={chipStyles.text}>
        <Text style={chipStyles.label}>{label}</Text>
        <Text style={chipStyles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.element,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.1)',
  },
  text: { flex: 1 },
  label: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.textOnDark,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
  },
});

function ActionCard({
  action,
  delay,
  onPress,
  vertical = false,
  badge,
}: {
  action: QuickAction;
  delay: number;
  onPress?: () => void;
  vertical?: boolean;
  badge?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        vertical ? actionStyles.wrapperVertical : actionStyles.wrapperGrid,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          actionStyles.card,
          vertical && actionStyles.cardVertical,
          { borderColor: action.color + '30' },
          pressed && actionStyles.pressed,
        ]}
      >
        <View style={[actionStyles.iconWrap, { backgroundColor: action.bg, borderColor: action.color + '40' }]}>
          <Icon name={action.icon} size={22} color={action.color} />
        </View>
        <View
          style={[
            actionStyles.textWrap,
            vertical && actionStyles.textWrapVertical,
          ]}
        >
          <Text style={actionStyles.label}>{action.label}</Text>
          <Text style={actionStyles.sub}>{action.sub}</Text>
        </View>
        <View style={[actionStyles.dot, { backgroundColor: action.color }]} />
        {badge && badge > 0 ? (
          <View style={actionStyles.notifBadge}>
            <Text style={actionStyles.notifBadgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const actionStyles = StyleSheet.create({
  wrapperGrid: {
    flex: 1,
  },
  wrapperVertical: {
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(10, 30, 48, 0.75)',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    minHeight: 120,
    justifyContent: 'space-between',
    // @ts-ignore
    boxShadow: '0 14px 28px -16px rgba(2, 10, 18, 0.8)',
    overflow: 'hidden',
  },
  cardVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    minHeight: 88,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  textWrap: {
    flex: 1,
    marginTop: spacing.sm,
  },
  textWrapVertical: {
    marginTop: 0,
  },
  label: {
    color: Colors.textOnDark,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    marginTop: 2,
  },
  dot: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notifBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  notifBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  orbTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 184, 0.06)',
    top: -80,
    right: -60,
  },
  orbBottom: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(217, 164, 65, 0.04)',
    bottom: 100,
    left: -50,
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
    fontFamily: fonts.heading,
    letterSpacing: -1,
    lineHeight: 40,
    // textShadow replaces deprecated textShadow* props
    // @ts-ignore
    textShadow: '0 2px 18px rgba(2, 10, 18, 0.65)',
  },
  heroSub: {
    color: Colors.textMuted,
    fontSize: fontSizes.small,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(6, 22, 38, 0.88)',
    borderRadius: radius.cardLg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.3)',
    // boxShadow replaces deprecated shadow* props
    // @ts-ignore
    boxShadow: '0 18px 40px -18px rgba(2, 10, 18, 0.85)',
    overflow: 'hidden',
  },
  cardBar: {
    height: 3,
    backgroundColor: Colors.gold,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.base,
  },
  avatarOuter: {
    position: 'relative',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: Colors.accent,
    opacity: 0.4,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  profileInfo: { flex: 1 },
  profileGreeting: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase',
  },
  profileName: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  sectionTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.base,
    letterSpacing: -0.2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionsGridVertical: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
});

export default HomeScreen;
