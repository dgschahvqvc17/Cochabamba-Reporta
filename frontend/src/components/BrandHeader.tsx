/**
 * Componente compartido: Encabezado de marca (MVC - componentes).
 *
 * Hero sobre el fondo institucional (foto + gradiente oscuro):
 *   - Logo institucional de la Alcaldía (img/cbbaLogo.png)
 *   - Eslogan dorado, línea de acento y título
 *
 * @format
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { brandLogo } from '../assets/images';
import { Colors, fontSizes, fontWeights, spacing } from '../theme';

type BrandHeaderProps = {
  title: string;
  subtitle: string;
};

const LOGO_ASPECT_RATIO = 4246 / 1026; // cbbaLogo.png

function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          source={brandLogo}
          style={styles.logo}
          resizeMode="contain"
          testID="brand-logo"
        />
      </View>

      <Text style={styles.slogan}>COCHABAMBA · CIUDAD DE TODOS</Text>
      <View style={styles.accentLine} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  logoWrap: {
    width: '94%',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  logo: {
    width: '100%',
    aspectRatio: LOGO_ASPECT_RATIO,
  },
  slogan: {
    color: Colors.warning,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 3,
    marginTop: spacing.lg,
  },
  accentLine: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warning,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  title: {
    color: Colors.textOnPrimary,
    fontSize: 28,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
    opacity: 0.85,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 22,
  },
});

export default BrandHeader;