/**
 * Pantalla: Registro de ciudadano (MVC - View).
 *
 * HU01 — Diseño dark glassmorphic con secciones visuales separadas
 * por encabezados de color neon, stepper de progreso y cards de sección.
 *
 * @format
 */

import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppDateField from '../components/AppDateField';
import AppDialog from '../components/AppDialog';
import AppTextInput from '../components/AppTextInput';
import BrandHeader from '../components/BrandHeader';
import CalendarModal from '../components/CalendarModal';
import GradientOverlay from '../components/GradientOverlay';
import Icon, { type IconName } from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground } from '../assets/images';
import { handleRegister, type FieldErrors } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import type { CitizenRegistration } from '../models/Citizen';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import {
  isValidAdultBirthDate,
  isValidEmail,
  isValidIdentityNumber,
  isValidPassword,
  isValidPhone,
} from '../utils/validators';

type RegisterScreenProps = {
  onGoToLogin: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  birthDate: string;
  identityNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  birthDate: '',
  identityNumber: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: '',
};

type SectionConfig = {
  title: string;
  icon: IconName;
  color: string;
};

const SECTIONS: SectionConfig[] = [
  { title: 'Datos personales', icon: 'person', color: Colors.accent },
  { title: 'Identificación y contacto', icon: 'badge', color: Colors.warning },
  { title: 'Seguridad', icon: 'shield', color: Colors.success },
  { title: 'Ubicación', icon: 'pin', color: Colors.info },
];

function RegisterScreen({ onGoToLogin }: RegisterScreenProps) {
  const { dialog, info, close } = useDialog();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const onChangeField = (field: keyof FormState) => (value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const clearError = (field: string) =>
    setErrors((c) => { const n = { ...c }; delete n[field]; return n; });

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!form.firstName.trim()) errs.firstName = 'El nombre es obligatorio.';
    if (!form.lastName.trim()) errs.lastName = 'El apellido es obligatorio.';
    if (!isValidAdultBirthDate(form.birthDate)) errs.birthDate = 'Elige una fecha válida siendo mayor de 18 años.';
    if (!form.identityNumber.trim()) errs.identityNumber = 'El documento de identidad es obligatorio.';
    else if (!isValidIdentityNumber(form.identityNumber)) errs.identityNumber = 'El documento debe contener entre 5 y 8 dígitos.';
    if (!form.phone.trim()) errs.phone = 'El teléfono es obligatorio.';
    else if (!isValidPhone(form.phone)) errs.phone = 'El teléfono debe contener entre 7 y 8 dígitos.';
    if (!form.email.trim()) errs.email = 'El correo electrónico es obligatorio.';
    else if (!isValidEmail(form.email)) errs.email = 'El correo no tiene un formato válido.';
    if (!form.password) errs.password = 'La contraseña es obligatoria.';
    else if (!isValidPassword(form.password)) errs.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (!form.confirmPassword) errs.confirmPassword = 'Confirma tu contraseña.';
    else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Las contraseñas no coinciden.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    const payload: CitizenRegistration = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthDate: isValidAdultBirthDate(form.birthDate) as string,
      identityNumber: form.identityNumber.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      address: form.address.trim() || undefined,
    };

    const result = await handleRegister(payload);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      info({ title: 'No se pudo registrar', message: result.message, tone: 'danger' });
      return;
    }

    info({
      title: '¡Cuenta creada!',
      message: 'Tu cuenta se registró correctamente. Ya puedes iniciar sesión.',
      tone: 'success',
      onAccept: onGoToLogin,
    });
    setForm(EMPTY_FORM);
  };

  const handleConfirmBirthDate = (displayDate: string) => {
    setForm((c) => ({ ...c, birthDate: displayDate }));
    clearError('birthDate');
    setIsCalendarOpen(false);
  };

  return (
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.97)',
            'rgba(5, 14, 26, 0.94)',
            'rgba(3, 9, 18, 0.98)',
          ]}
        />
        {/* Decorative orbs */}
        <View style={styles.orbCyan} />
        <View style={styles.orbGold} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <BrandHeader
              title="Crear cuenta"
              subtitle="Regístrate para reportar incidentes urbanos en Cochabamba"
            />

            <View style={styles.formCard}>
              {/* Card top accent */}
              <View style={styles.cardBar} />

              {/* Section 0: Datos personales */}
              <SectionHeader config={SECTIONS[0]} index={1} total={4} />
              <AppTextInput
                label="Nombres *"
                value={form.firstName}
                onChangeText={(v) => { onChangeField('firstName')(v); clearError('firstName'); }}
                placeholder="Ej. Juan Carlos"
                error={errors.firstName}
                icon="person"
                dark
              />
              <AppTextInput
                label="Apellidos *"
                value={form.lastName}
                onChangeText={(v) => { onChangeField('lastName')(v); clearError('lastName'); }}
                placeholder="Ej. Pérez Mamani"
                error={errors.lastName}
                icon="person"
                dark
              />
              <AppDateField
                label="Fecha de nacimiento *"
                value={form.birthDate}
                onPress={() => setIsCalendarOpen(true)}
                error={errors.birthDate}
                dark
              />

              {/* Section 1: Identificación */}
              <SectionHeader config={SECTIONS[1]} index={2} total={4} />
              <AppTextInput
                label="Documento de identidad *"
                value={form.identityNumber}
                onChangeText={(v) => { onChangeField('identityNumber')(v); clearError('identityNumber'); }}
                placeholder="Ej. 7654321"
                keyboardType="number-pad"
                maxLength={8}
                error={errors.identityNumber}
                icon="badge"
                dark
              />
              <AppTextInput
                label="Teléfono *"
                value={form.phone}
                onChangeText={(v) => { onChangeField('phone')(v); clearError('phone'); }}
                placeholder="Ej. 78901234"
                keyboardType="phone-pad"
                maxLength={8}
                error={errors.phone}
                icon="bell"
                dark
              />
              <AppTextInput
                label="Correo electrónico *"
                value={form.email}
                onChangeText={(v) => { onChangeField('email')(v); clearError('email'); }}
                placeholder="tucorreo@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                icon="person"
                dark
              />

              {/* Section 2: Seguridad */}
              <SectionHeader config={SECTIONS[2]} index={3} total={4} />
              <AppTextInput
                label="Contraseña *"
                value={form.password}
                onChangeText={(v) => { onChangeField('password')(v); clearError('password'); }}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
                icon="lock"
                hint="Mínimo 8 caracteres"
                dark
              />
              <AppTextInput
                label="Confirmar contraseña *"
                value={form.confirmPassword}
                onChangeText={(v) => { onChangeField('confirmPassword')(v); clearError('confirmPassword'); }}
                placeholder="Repite tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmPassword}
                icon="shieldCheck"
                dark
              />

              {/* Section 3: Ubicación */}
              <SectionHeader config={SECTIONS[3]} index={4} total={4} />
              <AppTextInput
                label="Dirección o referencia (opcional)"
                value={form.address}
                onChangeText={onChangeField('address')}
                placeholder="Ej. Av. Heroínas, zona..."
                icon="pin"
                dark
              />

              <View style={styles.submitGap} />
              <PrimaryButton
                label="Crear cuenta"
                onPress={handleSubmit}
                loading={isSubmitting}
              />

              <Pressable onPress={onGoToLogin} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.loginLinkAccent}>Inicia sesión</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

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

function SectionHeader({
  config,
  index,
  total,
}: {
  config: SectionConfig;
  index: number;
  total: number;
}) {
  return (
    <View style={sectionStyles.container}>
      <View style={[sectionStyles.iconWrap, { borderColor: config.color + '50', backgroundColor: config.color + '14' }]}>
        <Icon name={config.icon} size={16} color={config.color} />
      </View>
      <View style={sectionStyles.textWrap}>
        <Text style={[sectionStyles.title, { color: config.color }]}>{config.title}</Text>
      </View>
      <Text style={sectionStyles.counter}>{index}/{total}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  counter: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  orbCyan: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    top: -60,
    right: -60,
  },
  orbGold: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 184, 0, 0.04)',
    bottom: 300,
    left: -40,
  },
  formCard: {
    backgroundColor: 'rgba(7, 22, 36, 0.88)',
    borderRadius: radius.cardLg,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    paddingTop: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
  },
  cardBar: {
    height: 3,
    backgroundColor: Colors.accent,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.sm,
  },
  submitGap: {
    height: spacing.base,
  },
  loginLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: fontSizes.small,
    color: Colors.textMuted,
  },
  loginLinkAccent: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
  },
});

export default RegisterScreen;
