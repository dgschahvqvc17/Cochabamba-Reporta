/**
 * Pantalla: Formulario de usuario (MVC - View).
 *
 * HU03 — Dark immersive layout: cityBackground + overlay, glassmorphic
 * section cards con inputs dark mode, rol picker con chips, AnimatedHeader.
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
import Icon, { type IconName } from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import {
  createUser,
  editUser,
  loadUserDetail,
  type FieldErrors,
} from '../controllers/userController';
import { useDialog } from '../hooks/useDialog';
import type { Role } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { formatDate } from '../utils/format';
import { ROLE_LABELS, ROLES } from '../utils/roles';
import {
  isValidEmail,
  isValidIdentityNumber,
  isValidPhone,
  parseBirthDate,
} from '../utils/validators';

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

const ROLE_COLORS: Record<Role, string> = {
  CIUDADANO: Colors.accent,
  RECEPCION: Colors.textSecondary,
  VERIFICADOR: Colors.warning,
  ENCARGADO_SOLUCION: Colors.info,
  PERSONAL_SOLUCION: Colors.success,
  ADMINISTRADOR: Colors.danger,
};

function UserFormScreen({ mode, userId, onBack, onSaved }: UserFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, error, success, close } = useDialog();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isEdit || userId === undefined) return;
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

  const field = (key: keyof FormState) => (v: string) => {
    setForm((c) => ({ ...c, [key]: v }));
    setErrors((c) => { const n = { ...c }; delete n[key]; return n; });
  };

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!form.firstName.trim()) errs.firstName = 'El nombre es obligatorio.';
    if (!form.lastName.trim()) errs.lastName = 'El apellido es obligatorio.';
    if (!form.email.trim()) errs.email = 'El correo electrónico es obligatorio.';
    else if (!isValidEmail(form.email)) errs.email = 'El correo no tiene un formato válido.';
    if (!isEdit) {
      if (form.role === '') errs.role = 'Debes seleccionar un rol.';
      if (!form.password) errs.password = 'La contraseña es obligatoria.';
      else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
      if (!form.confirmPassword) errs.confirmPassword = 'Confirma la contraseña.';
      else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Las contraseñas no coinciden.';
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) errs.phone = 'Entre 7 y 8 dígitos.';
    if (form.identityNumber.trim() && !isValidIdentityNumber(form.identityNumber))
      errs.identityNumber = 'Entre 5 y 8 dígitos.';
    if (form.birthDate.trim() && !parseBirthDate(form.birthDate)) errs.birthDate = 'Fecha inválida.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
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
        if (result.fieldErrors) setErrors(result.fieldErrors);
        error({ title: 'No se pudo actualizar', message: result.message });
        return;
      }
      success({ title: 'Usuario actualizado', message: 'Datos actualizados correctamente.', onAccept: onSaved });
      return;
    }

    if (form.role === '') { setIsSubmitting(false); return; }

    const result = await createUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim() || undefined,
      identityNumber: form.identityNumber.trim() || undefined,
      birthDate: form.birthDate.trim() ? (parseBirthDate(form.birthDate) ?? undefined) : undefined,
      address: form.address.trim() || undefined,
    });
    setIsSubmitting(false);
    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      error({ title: 'No se pudo registrar', message: result.message });
      return;
    }
    success({ title: 'Usuario registrado', message: 'El usuario se registró correctamente.', onAccept: onSaved });
  };

  // ── Loading / Error states ────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.root}>
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
      <View style={styles.root}>
        <AdminHeader title="Editar usuario" onBack={onBack} />
        <View style={styles.centerBox}>
          <Icon name="warning" size={36} color={Colors.danger} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      <AdminHeader
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle={isEdit ? form.email : 'Registrar usuario interno'}
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
            { paddingBottom: insets.bottom + spacing.huge },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Datos personales */}
          <DarkSectionCard title="Datos personales" icon="person" color={Colors.accent}>
            <AppTextInput label="Nombres *" value={form.firstName} onChangeText={field('firstName')} placeholder="Ej. Juan Carlos" error={errors.firstName} icon="person" />
            <AppTextInput label="Apellidos *" value={form.lastName} onChangeText={field('lastName')} placeholder="Ej. Pérez Mamani" error={errors.lastName} icon="person" />
          </DarkSectionCard>

          {/* Acceso */}
          <DarkSectionCard title="Acceso" icon="lock" color={Colors.warning}>
            <AppTextInput
              label="Correo electrónico *"
              value={form.email}
              onChangeText={field('email')}
              placeholder="tucorreo@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEdit}
              error={errors.email}
              icon="person"

            />
            {!isEdit && (
              <>
                <AppTextInput label="Contraseña *" value={form.password} onChangeText={field('password')} placeholder="Mínimo 8 caracteres" secureTextEntry autoCapitalize="none" error={errors.password} icon="lock" />
                <AppTextInput label="Confirmar contraseña *" value={form.confirmPassword} onChangeText={field('confirmPassword')} placeholder="Repite la contraseña" secureTextEntry autoCapitalize="none" error={errors.confirmPassword} icon="shieldCheck" />
              </>
            )}
          </DarkSectionCard>

          {/* Contacto */}
          <DarkSectionCard title="Contacto e identificación" icon="badge" color={Colors.success}>
            <AppTextInput label="Teléfono" value={form.phone} onChangeText={field('phone')} placeholder="Ej. 78901234" keyboardType="phone-pad" maxLength={8} error={errors.phone} icon="bell" />
            <AppTextInput label="Documento de identidad" value={form.identityNumber} onChangeText={field('identityNumber')} placeholder="Ej. 7654321" keyboardType="number-pad" maxLength={8} error={errors.identityNumber} icon="badge" />
            <AppDateField label="Fecha de nacimiento" value={form.birthDate} onPress={() => setIsCalendarOpen(true)} error={errors.birthDate} />
            <AppTextInput label="Dirección o referencia" value={form.address} onChangeText={field('address')} placeholder="Ej. Av. Heroínas, zona..." icon="pin" />
          </DarkSectionCard>

          {/* Rol */}
          {isEdit ? (
            <View style={styles.roleDisplayCard}>
              <Text style={styles.roleDisplayLabel}>ROL ACTUAL</Text>
              <Text style={styles.roleDisplayValue}>
                {form.role ? ROLE_LABELS[form.role] : '—'}
              </Text>
              <Text style={styles.roleDisplayHint}>
                Para cambiar el rol, abre el detalle del usuario.
              </Text>
            </View>
          ) : (
            <DarkSectionCard title="Rol del usuario *" icon="badge" color={Colors.info}>
              <View style={styles.roleGrid}>
                {ROLES.map((role) => {
                  const active = form.role === role;
                  const rc = ROLE_COLORS[role];
                  return (
                    <Pressable
                      key={role}
                      onPress={() => field('role')(role)}
                      style={[
                        styles.roleChip,
                        active && { borderColor: rc, backgroundColor: rc + '1A' },
                      ]}
                    >
                      {active && <View style={[styles.roleChipDot, { backgroundColor: rc }]} />}
                      <Text
                        style={[
                          styles.roleChipText,
                          active && { color: rc, fontWeight: fontWeights.bold },
                        ]}
                        numberOfLines={1}
                      >
                        {ROLE_LABELS[role]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.role && (
                <View style={styles.roleErrorRow}>
                  <Icon name="warning" size={12} color={Colors.danger} />
                  <Text style={styles.roleError}>{errors.role}</Text>
                </View>
              )}
            </DarkSectionCard>
          )}

          <PrimaryButton
            label={isEdit ? 'Guardar cambios' : 'Registrar usuario'}
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={isCalendarOpen}
        value={form.birthDate}
        onConfirm={(d) => {
          setForm((c) => ({ ...c, birthDate: d }));
          setErrors((c) => { const n = { ...c }; delete n.birthDate; return n; });
          setIsCalendarOpen(false);
        }}
        onClose={() => setIsCalendarOpen(false)}
      />
      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

// ── Dark glassmorphic section card ─────────────────────────────────────────
function DarkSectionCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: IconName;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[dsc.card, { borderColor: color + '30' }]}>
      <View style={[dsc.header, { borderBottomColor: color + '20' }]}>
        <View style={[dsc.iconWrap, { backgroundColor: color + '16', borderColor: color + '35' }]}>
          <Icon name={icon} size={15} color={color} />
        </View>
        <Text style={[dsc.title, { color }]}>{title}</Text>
      </View>
      <View style={dsc.body}>{children}</View>
    </View>
  );
}

const dsc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    gap: spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase',
  },
  body: { padding: spacing.base },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  flex: { flex: 1, backgroundColor: Colors.background },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.base,
  },
  centerText: { color: Colors.textSecondary, fontSize: fontSizes.body },
  errorText: { color: Colors.danger, fontSize: fontSizes.body, textAlign: 'center' },
  content: {
    padding: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    gap: 5,
  },
  roleChipDot: { width: 6, height: 6, borderRadius: 3 },
  roleChipText: {
    color: 'rgba(232,240,248,0.65)',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  roleErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  roleError: { color: Colors.danger, fontSize: fontSizes.caption, flexShrink: 1 },
  roleDisplayCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.18)',
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  roleDisplayLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
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
