/**
 * Componente compartido: Diálogo de la aplicación (MVC - componentes).
 *
 * Sustituye al `Alert` nativo (no implementado en react-native-web) por
 * un modal centrado con icono, título, mensaje y botones. Se usa a través
 * del hook `useDialog` y funciona igual en web y en dispositivo móvil.
 *
 * @format
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon, { type IconName } from './Icon';
import {
  type DialogState,
  type DialogTone,
} from '../hooks/useDialog';
import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';

type AppDialogProps = {
  dialog: DialogState;
  onCancel: () => void;
};

const TONE_ICON: Record<DialogTone, IconName> = {
  accent: 'badge',
  success: 'check',
  danger: 'warning',
  warning: 'warning',
  info: 'info',
};

const TONE_COLOR: Record<DialogTone, string> = {
  accent: Colors.accent,
  success: Colors.success,
  danger: Colors.danger,
  warning: Colors.warning,
  info: Colors.primary,
};

const TONE_BACKGROUND: Record<DialogTone, string> = {
  accent: 'rgba(22, 163, 224, 0.12)',
  success: 'rgba(76, 168, 102, 0.14)',
  danger: 'rgba(230, 57, 70, 0.12)',
  warning: 'rgba(242, 183, 5, 0.18)',
  info: 'rgba(11, 74, 111, 0.10)',
};

function AppDialog({ dialog, onCancel }: AppDialogProps) {
  if (!dialog.visible) {
    return null;
  }

  const isConfirm = !dialog.isInfo;
  const toneColor = TONE_COLOR[dialog.tone];
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
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.card}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: TONE_BACKGROUND[dialog.tone] },
            ]}
          >
            <Icon name={TONE_ICON[dialog.tone]} size={30} color={toneColor} />
          </View>

          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? (
            <Text style={styles.message}>{dialog.message}</Text>
          ) : null}

          {isConfirm ? (
            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSecondary,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonSecondaryText}>
                  {dialog.cancelLabel ?? 'Cancelar'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleMain}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  { backgroundColor: toneColor },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonPrimaryText}>{mainLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleMain}
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                styles.buttonFull,
                { backgroundColor: Colors.primary },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonPrimaryText}>{mainLabel}</Text>
            </Pressable>
          )}
        </View>
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
    backgroundColor: 'rgba(3, 18, 32, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.card + 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 36,
    elevation: 20,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
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
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  buttonFull: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  buttonSecondary: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  buttonPrimary: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonSecondaryText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  buttonPrimaryText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});

export default AppDialog;