/**
 * Componente: Encabezado de pantallas administrativas (MVC - componentes).
 *
 * Barra clara con línea de acento dorado, botón back refinado y título limpio.
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
        colors={['#E7EEF6', Colors.surface]}
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

      {/* Gold accent line */}
      <View style={styles.accentLine}>
        <GradientOverlay
          colors={['transparent', Colors.gold, Colors.goldDim, 'transparent']}
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(59, 130, 184, 0.22)',
    transform: [{ scale: 0.94 }],
  },
  titles: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    color: Colors.textSecondary,
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
