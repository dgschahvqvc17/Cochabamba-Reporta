/**
 * Pantalla de formulario de usuario (MVC - View).
 *
 * HU03 — Registro de usuarios internos y edición de usuarios.
 * En modo creación se solicita el rol; en edición el correo no se
 * puede modificar y el rol se administra desde el detalle.
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminHeader from '../components/AdminHeader';
import AppDateField from '../components/AppDateField';
import AppDialog from '../components/AppDialog';
import AppTextInput from '../components/AppTextInput';
import CalendarModal from '../components/CalendarModal';
import PrimaryButton from '../components/PrimaryButton';
import {
  createUser,
  editUser,
  loadUserDetail,
  type FieldErrors,
} from '../controllers/userController';
import { useDialog } from '../hooks/useDialog';
import type { Role } from '../models/User';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';
import { ROLE_LABELS, ROLES } from '../utils/roles';
import { isValidEmail, isValidIdentityNumber, isValidPhone, parseBirthDate } from '../utils/validators';

type UserFormScreenProps = {
  mode: 'create' | 'edit';
  userId?: number;
  onBack: () => void;
  onSaved: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  identityNumber: string;
  birthDate: string;
  address: string;
  role: Role | '';
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  identityNumber: '',
  birthDate: '',
  address: '',
  role: '',
};

function UserFormScreen({ mode, userId, onBack, onSaved }: UserFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, info, close } = useDialog();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isEdit || userId === undefined) {
      return;
    }

    (async () => {
      const result = await loadUserDetail(userId);

      if (!result.success) {
        setLoadError(result.message);
        setIsLoading(false);
        return;
      }

      const user = result.data?.user;
      if (user) {
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          phone: user.phone || '',
          identityNumber: user.identityNumber || '',
          birthDate: user.birthDate ? formatDate(user.birthDate) : '',
          address: user.address || '',
          role: user.role,
        });
      }

      setIsLoading(false);
    })();
  }, [isEdit, userId]);

  const onChangeField = (field: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = (): FieldErrors => {
    const fieldErrors: FieldErrors = {};

    if (!form.firstName.trim()) {
      fieldErrors.firstName = 'El nombre es obligatorio.';
    }

    if (!form.lastName.trim()) {
      fieldErrors.lastName = 'El apellido es obligatorio.';
    }

    if (!form.email.trim()) {
      fieldErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isValidEmail(form.email)) {
      fieldErrors.email = 'El correo no tiene un formato válido.';
    }

    if (!isEdit) {
      if (form.role === '') {
        fieldErrors.role = 'Debes seleccionar un rol.';
      }
      if (!form.password) {
        fieldErrors.password = 'La contraseña es obligatoria.';
      } else if (form.password.length < 8) {
        fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
      }
      if (!form.confirmPassword) {
        fieldErrors.confirmPassword = 'Confirma la contraseña.';
      } else if (form.confirmPassword !== form.password) {
        fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    if (form.phone.trim() && !isValidPhone(form.phone)) {
      fieldErrors.phone = 'El teléfono debe contener entre 7 y 8 dígitos.';
    }

    if (form.identityNumber.trim() && !isValidIdentityNumber(form.identityNumber)) {
      fieldErrors.identityNumber = 'El documento debe contener entre 5 y 8 dígitos.';
    }

    if (form.birthDate.trim() && !parseBirthDate(form.birthDate)) {
      fieldErrors.birthDate = 'Elige una fecha válida.';
    }

    return fieldErrors;
  };

  const handleSubmit = async () => {
    const fieldErrors = validateForm();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    if (isEdit && userId !== undefined) {
      const result = await editUser(userId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        identityNumber: form.identityNumber.trim() || undefined,
        birthDate: form.birthDate.trim() ? (parseBirthDate(form.birthDate) ?? undefined) : undefined,
        address: form.address.trim() || undefined,
      });

      setIsSubmitting(false);

      if (!result.success) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        info({ title: 'No se pudo actualizar', message: result.message });
        return;
      }

      info({
        title: 'Usuario actualizado',
        message: 'Los datos del usuario se actualizaron correctamente.',
        onAccept: onSaved,
      });
      return;
    }

    if (form.role === '') {
      setIsSubmitting(false);
      return;
    }

    const result = await createUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim() || undefined,
      identityNumber: form.identityNumber.trim() || undefined,
      birthDate: form.birthDate.trim()
        ? (parseBirthDate(form.birthDate) ?? undefined)
        : undefined,
      address: form.address.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
      info({ title: 'No se pudo registrar', message: result.message });
      return;
    }

    info({
      title: 'Usuario registrado',
      message: 'El usuario interno se registró correctamente.',
      onAccept: onSaved,
    });
  };

  const handleConfirmBirthDate = (displayDate: string) => {
    setForm((current) => ({ ...current, birthDate: displayDate }));
    setErrors((current) => {
      const next = { ...current };
      delete next.birthDate;
      return next;
    });
    setIsCalendarOpen(false);
  };

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <AdminHeader title="Editar usuario" onBack={onBack} />
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.centerText}>Cargando usuario…</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.flex}>
        <AdminHeader title="Editar usuario" onBack={onBack} />
        <View style={[styles.centerBox, styles.errorBox]}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <AdminHeader
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle={isEdit ? form.email : 'Registrar un usuario interno'}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <SectionTitle>Datos personales</SectionTitle>
            <AppTextInput
              label="Nombres *"
              value={form.firstName}
              onChangeText={onChangeField('firstName')}
              placeholder="Ej. Juan Carlos"
              error={errors.firstName}
            />
            <AppTextInput
              label="Apellidos *"
              value={form.lastName}
              onChangeText={onChangeField('lastName')}
              placeholder="Ej. Pérez Mamani"
              error={errors.lastName}
            />

            <SectionTitle>Acceso</SectionTitle>
            <AppTextInput
              label="Correo electrónico *"
              value={form.email}
              onChangeText={onChangeField('email')}
              placeholder="tucorreo@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEdit}
              error={errors.email}
            />

            {!isEdit ? (
              <>
                <AppTextInput
                  label="Contraseña *"
                  value={form.password}
                  onChangeText={onChangeField('password')}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password}
                />
                <AppTextInput
                  label="Confirmar contraseña *"
                  value={form.confirmPassword}
                  onChangeText={onChangeField('confirmPassword')}
                  placeholder="Repite la contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.confirmPassword}
                />
              </>
            ) : null}

            <SectionTitle>Contacto e identificación</SectionTitle>
            <AppTextInput
              label="Teléfono"
              value={form.phone}
              onChangeText={onChangeField('phone')}
              placeholder="Ej. 78901234"
              keyboardType="phone-pad"
              maxLength={8}
              error={errors.phone}
            />
            <AppTextInput
              label="Documento de identidad"
              value={form.identityNumber}
              onChangeText={onChangeField('identityNumber')}
              placeholder="Ej. 7654321"
              keyboardType="number-pad"
              maxLength={8}
              error={errors.identityNumber}
            />
            <AppDateField
              label="Fecha de nacimiento"
              value={form.birthDate}
              onPress={() => setIsCalendarOpen(true)}
              error={errors.birthDate}
            />
            <AppTextInput
              label="Dirección o referencia"
              value={form.address}
              onChangeText={onChangeField('address')}
              placeholder="Ej. Av. Heroínas, zona..."
              error={errors.address}
            />

            {isEdit ? (
              <View style={styles.roleDisplay}>
                <Text style={styles.roleDisplayLabel}>Rol actual</Text>
                <Text style={styles.roleDisplayValue}>
                  {form.role ? ROLE_LABELS[form.role] : '—'}
                </Text>
                <Text style={styles.roleDisplayHint}>
                  Para cambiar el rol, abre el detalle del usuario.
                </Text>
              </View>
            ) : (
              <>
                <SectionTitle>Rol del usuario *</SectionTitle>
                <View style={styles.roleGrid}>
                  {ROLES.map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => {
                        setForm((current) => ({ ...current, role }));
                        setErrors((current) => {
                          const next = { ...current };
                          delete next.role;
                          return next;
                        });
                      }}
                      style={[
                        styles.roleChip,
                        form.role === role && styles.roleChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          form.role === role && styles.roleChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {ROLE_LABELS[role]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.role ? <Text style={styles.roleError}>{errors.role}</Text> : null}
              </>
            )}

            <PrimaryButton
              label={isEdit ? 'Guardar cambios' : 'Registrar usuario'}
              onPress={handleSubmit}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={isCalendarOpen}
        value={form.birthDate}
        onConfirm={handleConfirmBirthDate}
        onClose={() => setIsCalendarOpen(false)}
      />
      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card + 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: spacing.base,
    shadowColor: '#0B4A6F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
    marginTop: spacing.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.warning,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semiBold,
    color: Colors.primary,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  roleChip: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  roleChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  roleChipText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  roleChipTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: fontWeights.bold,
  },
  roleError: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  roleDisplay: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radius.element,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleDisplayLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roleDisplayValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  roleDisplayHint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
});

export default UserFormScreen;