/**
 * Componente: Encabezado de pantallas administrativas (MVC - componentes).
 *
 * Barra oscura con línea de acento neon, botón back glassmorphic y título limpio.
 *
 * @format
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, fontSizes, fontWeights, spacing } from '../theme';
import GradientOverlay from './GradientOverlay';
import Icon from './Icon';

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
};

function AdminHeader({ title, subtitle, onBack, rightAction }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <GradientOverlay
        colors={[Colors.bgDeep, Colors.bgMid]}
        style={styles.bg}
      />

      <View style={styles.inner}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          testID="admin-back"
        >
          <Icon name="chevronLeft" size={22} color={Colors.accent} />
        </Pressable>

        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {rightAction ?? null}
        </View>
      </View>

      {/* Neon accent line */}
      <View style={styles.accentLine}>
        <GradientOverlay
          colors={['transparent', Colors.accent, Colors.accentDim, 'transparent']}
          style={styles.accentGrad}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.sm,
    zIndex: 10,
    overflow: 'hidden',
  },
  bg: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(0, 212, 255, 0.18)',
    transform: [{ scale: 0.94 }],
  },
  titles: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: Colors.textOnDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rightSlot: {
    width: 40,
    alignItems: 'center',
  },
  accentLine: {
    height: 2,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  accentGrad: {
    // fill handled by GradientOverlay direction simulation: horizontal
  },
});

export default AdminHeader;
