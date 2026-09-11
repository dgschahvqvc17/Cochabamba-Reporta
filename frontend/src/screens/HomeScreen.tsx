/**
 * Pantalla principal del módulo de ciudadano (MVC - View).
 *
 * HU02 — Tras iniciar sesión se redirige aquí: saluda al ciudadano,
 * muestra su rol y permite cerrar sesión. Los incidentes y el resto
 * de funcionalidades se agregan en las historias del Sprint 2.
 *
 * @format
 */

import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GradientOverlay from '../components/GradientOverlay';
import { cityBackground } from '../assets/images';
import type { User } from '../models/User';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';

type HomeScreenProps = {
  user: User;
};

function HomeScreen({ user }: HomeScreenProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.flex}>
      <ImageBackground
        source={cityBackground}
        style={styles.flex}
        resizeMode="cover"
      >
        <GradientOverlay
          colors={[
            'rgba(6, 48, 67, 0.94)',
            'rgba(7, 52, 74, 0.88)',
            'rgba(3, 18, 32, 0.96)',
          ]}
        />

        <View style={styles.content}>
          <Text style={styles.welcome}>Bienvenido a Cochabamba Reporta</Text>
          <Text style={styles.subtitle}>
            Tu canal para reportar y dar seguimiento a los incidentes urbanos.
          </Text>

          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.greeting}>
              Hola, {user.firstName} {user.lastName}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>

            <View style={styles.placeholder}>
              <Text style={styles.placeholderTitle}>Sesión iniciada</Text>
              <Text style={styles.placeholderText}>
                Aquí podrás reportar y dar seguimiento a tus incidentes
                (Sprint 2).
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  welcome: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    opacity: 0.85,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(242, 183, 5, 0.16)',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  roleBadgeText: {
    color: Colors.primary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  infoBlock: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.element,
    backgroundColor: Colors.surfaceSubtle,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: spacing.xs,
  },
  placeholder: {
    alignSelf: 'stretch',
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: Colors.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});

export default HomeScreen;