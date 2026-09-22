/**
 * Componente: Diálogo de la aplicación (MVC - componentes).
 *
 * Modal centrado refinado con icono animado de entrada, backdrop oscuro
 * y marco dorado premium; botones estilizados según el tono del mensaje.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon, { type IconName } from './Icon';
import { type DialogState, type DialogTone } from '../hooks/useDialog';
import {
  Colors,
  fontSizes,
  fontWeights,
  radius,
  spacing,
} from '../theme';

type AppDialogProps = {
  dialog: DialogState;
  onCancel: () => void;
};

const TONE_ICON: Record<DialogTone, IconName> = {
  accent: 'info',
  success: 'checkCircle',
  danger: 'warning',
  warning: 'warning',
  info: 'info',
};

type TonePalette = {
  icon: string;
  bg: string;
  border: string;
  glow: string;
  btn: string;
};

const TONE_PALETTE: Record<DialogTone, TonePalette> = {
  accent: { icon: Colors.accent, bg: Colors.accentSoft, border: 'rgba(59,130,184,0.3)', glow: Colors.accent, btn: Colors.accentDim },
  success: { icon: Colors.success, bg: Colors.successSoft, border: 'rgba(47,156,110,0.3)', glow: Colors.success, btn: Colors.successDim },
  danger: { icon: Colors.danger, bg: Colors.dangerSoft, border: 'rgba(194,73,79,0.3)', glow: Colors.danger, btn: Colors.dangerDim },
  warning: { icon: Colors.warning, bg: Colors.warningSoft, border: 'rgba(217,164,65,0.3)', glow: Colors.warning, btn: Colors.warningDim },
  info: { icon: Colors.info, bg: 'rgba(108,92,176,0.12)', border: 'rgba(108,92,176,0.3)', glow: Colors.info, btn: Colors.primary },
};

function DialogContent({
  dialog,
  onCancel,
}: {
  dialog: DialogState;
  onCancel: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false, // web compat
        speed: 22,
        bounciness: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(iconBounce, {
        toValue: 1,
        useNativeDriver: false,
        delay: 100,
        speed: 18,
        bounciness: 14,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, iconBounce]);

  const palette = TONE_PALETTE[dialog.tone];
  const isConfirm = !dialog.isInfo;
  const mainLabel = dialog.confirmLabel ?? 'Aceptar';

  const handleMain = () => {
    const action = dialog.onConfirm;
    if (isConfirm) {
      action?.();
    } else {
      action?.();
      onCancel();
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Shimmer top */}
      <View style={styles.cardShimmer} />

      {/* Icon badge */}
      <Animated.View
        style={[
          styles.iconBadge,
          { backgroundColor: palette.bg, borderColor: palette.border, transform: [{ scale: iconBounce }] },
        ]}
      >
        <Icon name={TONE_ICON[dialog.tone]} size={32} color={palette.icon} />
      </Animated.View>

      <Text style={styles.title}>{dialog.title}</Text>
      {dialog.message ? (
        <Text style={styles.message}>{dialog.message}</Text>
      ) : null}

      {isConfirm ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnSecondaryText}>
              {dialog.cancelLabel ?? 'Cancelar'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleMain}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { backgroundColor: palette.btn },
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnPrimaryText}>{mainLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleMain}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            styles.btnFull,
            { backgroundColor: palette.btn },
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.btnPrimaryText}>{mainLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function AppDialog({ dialog, onCancel }: AppDialogProps) {
  if (!dialog.visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <DialogContent dialog={dialog} onCancel={onCancel} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(3, 9, 18, 0.75)',
  },
  card: {
    width: '100%',
    maxWidth: 370,
    alignItems: 'center',
    backgroundColor: 'rgba(9, 30, 50, 0.98)',
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.35)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    // @ts-ignore
    boxShadow: '0 24px 50px -20px rgba(2, 10, 18, 0.9)',
    overflow: 'hidden',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(201, 162, 75, 0.8)',
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  btn: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  btnFull: {
    alignSelf: 'stretch',
    flex: 0,
    marginTop: spacing.lg,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  btnSecondaryText: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  btnPrimaryText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
});

export default AppDialog;
