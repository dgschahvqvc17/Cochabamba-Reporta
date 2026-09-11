/**
 * Pantalla de inicio del administrador (MVC - View).
 *
 * HU03 — El administrador ingresa al panel y accede a la gestión
 * de usuarios y roles del sistema.
 *
 * @format
 */

import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import PillBadge from '../components/PillBadge';
import { cityBackground } from '../assets/images';
import type { User } from '../models/User';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';

type AdminScreenProps = {
  user: User;
  onGoToUsers: () => void;
};

function AdminScreen({ user, onGoToUsers }: AdminScreenProps) {
  const insets = useSafeAreaInsets();

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(6, 48, 67, 0.94)',
            'rgba(7, 52, 74, 0.88)',
            'rgba(3, 18, 32, 0.96)',
          ]}
        />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg },
          ]}
        >
          <Text style={styles.eyebrow}>PANEL ADMINISTRATIVO</Text>
          <Text style={styles.title}>Administración del sistema</Text>
          <Text style={styles.subtitle}>
            Gestiona los usuarios, roles y permisos de Cochabamba Reporta.
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.greeting}>
              Hola, {user.firstName} {user.lastName}
            </Text>
            <View style={styles.badgeRow}>
              <PillBadge label={user.role} tone="primary" />
              <PillBadge label={user.active ? 'Activo' : 'Inactivo'} tone="success" />
            </View>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <Pressable
            onPress={onGoToUsers}
            style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
          >
            <View style={styles.optionIcon}>
              <Icon name="users" size={26} color={Colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Gestionar usuarios y roles</Text>
              <Text style={styles.optionDescription}>
                Registrar, consultar, editar, activar o desactivar cuentas y asignar roles.
              </Text>
            </View>
            <Icon name="chevronRight" size={20} color={Colors.accent} />
          </Pressable>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    color: Colors.warning,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  subtitle: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radius.card + 14,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: layout.cardMaxWidth,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radius.card + 8,
    marginTop: spacing.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
    maxWidth: layout.cardMaxWidth,
  },
  optionCardPressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.element + 4,
    backgroundColor: 'rgba(22, 163, 224, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
});

export default AdminScreen;