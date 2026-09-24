/**
 * Pantalla: Mi perfil (MVC - View).
 *
 * Muestra la información personal del ciudadano autenticado (solo lectura)
 * y permite cambiar la contraseña verificando la contraseña actual
 * (PATCH /api/v1/auth/change-password).
 *
 * @format
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import AppDialog from '../components/AppDialog';
import AppTextInput from '../components/AppTextInput';
import Icon, { type IconName } from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { fondo4 } from '../assets/images';
import { handleChangePassword } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import type { User } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { formatDate } from '../utils/format';

type ProfileScreenProps = {
  user: User;
  onBack: () => void;
};

const MIN_PASSWORD_LENGTH = 8;

function ProfileScreen({ user, onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, error, success, close } = useDialog();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: { label: string; value: string; icon: IconName }[] = [
    {
      label: 'Nombre completo',
      value: `${user.firstName} ${user.lastName}`,
      icon: 'person',
    },
    { label: 'Correo electrónico', value: user.email, icon: 'badge' },
    { label: 'Teléfono', value: user.phone || '—', icon: 'badge' },
    {
      label: 'Carnet de identidad',
      value: user.identityNumber || '—',
      icon: 'badge',
    },
    {
      label: 'Fecha de nacimiento',
      value: formatDate(user.birthDate),
      icon: 'calendar',
    },
    { label: 'Dirección', value: user.address || '—', icon: 'map' },
  ];

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Ingresa tu contraseña actual.';
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Ingresa la nueva contraseña.';
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await handleChangePassword(currentPassword, newPassword);

    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }

      error({
        title: 'No se pudo actualizar la contraseña',
        message: result.error,
      });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});

    success({
      title: 'Contraseña actualizada',
      message: 'Tu contraseña se actualizó correctamente.',
    });
  };

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo4}
        title="Mi perfil"
        subtitle="Información personal y seguridad"
        badge="CUENTA"
        contentBackground={Colors.background}
        onBack={onBack}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Información personal</Text>
        <View style={styles.card}>
          {fields.map((field) => (
            <View key={field.label} style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Icon name={field.icon} size={17} color={Colors.accent} />
              </View>
              <View style={styles.fieldText}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {field.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            Verifica tu contraseña actual y define una nueva para tu cuenta.
          </Text>

          <AppTextInput
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            icon="lock"
            error={errors.currentPassword}
          />
          <AppTextInput
            label="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            secureTextEntry
            autoCapitalize="none"
            icon="lock"
            error={errors.newPassword}
          />
          <AppTextInput
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite la nueva contraseña"
            secureTextEntry
            autoCapitalize="none"
            icon="lock"
            error={errors.confirmPassword}
          />

          <PrimaryButton
            label="Actualizar contraseña"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: radius.card,
    padding: spacing.base,
  },
  cardHint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginBottom: spacing.base,
    lineHeight: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.element,
    backgroundColor: 'rgba(59,130,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldText: { flex: 1 },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
  },
});

export default ProfileScreen;