/**
 * Pantalla: Registro de ciudadano (MVC - View).
 *
 * HU01 — Diseño premium de alto contraste: banda hero navy con base
 * curva, tarjeta blanca flotante, secciones de color y campos claros
 * con acentos azules y dorados.
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
import { cityBackground, fondo3 } from '../assets/images';
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
    <ImageBackground source={fondo3} style={styles.root} resizeMode="cover">
      {/* Light blue-grey watermark overlay so the photo shows through */}
      <GradientOverlay
        colors={[
          'rgba(204, 224, 240, 0.66)',
          'rgba(222, 236, 248, 0.78)',
        ]}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Navy hero band with curved bottom */}
          <ImageBackground
            source={cityBackground}
            style={styles.hero}
            resizeMode="cover"
          >
            <GradientOverlay
              colors={[
                'rgba(7, 16, 30, 0.96)',
                'rgba(10, 24, 40, 0.9)',
                'rgba(9, 20, 34, 0.96)',
              ]}
            />
            <View style={styles.heroGlow} />
            <BrandHeader
              title="Crear cuenta"
              subtitle="Regístrate para reportar incidentes urbanos en Cochabamba"
            />
          </ImageBackground>

          {/* Floating white card */}
          <View style={styles.cardWrap}>
            <View style={styles.formCard}>
              {/* Gold gradient top bar */}
              <GradientOverlay
                colors={['#9C7A31', '#E8CB82', '#C9A24B']}
                style={styles.goldBar}
              />
              <GradientOverlay
                colors={[
                  'rgba(201, 162, 75, 0.12)',
                  'rgba(59, 130, 184, 0.05)',
                  'rgba(14, 61, 99, 0)',
                ]}
                style={styles.goldShine}
              />

              {/* Section 0: Datos personales */}
              <SectionHeader config={SECTIONS[0]} index={1} total={4} />
              <AppTextInput
                label="Nombres *"
                value={form.firstName}
                onChangeText={(v) => { onChangeField('firstName')(v); clearError('firstName'); }}
                placeholder="Ej. Juan Carlos"
                error={errors.firstName}
                icon="person"
              />
              <AppTextInput
                label="Apellidos *"
                value={form.lastName}
                onChangeText={(v) => { onChangeField('lastName')(v); clearError('lastName'); }}
                placeholder="Ej. Pérez Mamani"
                error={errors.lastName}
                icon="person"
              />
              <AppDateField
                label="Fecha de nacimiento *"
                value={form.birthDate}
                onPress={() => setIsCalendarOpen(true)}
                error={errors.birthDate}
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
              />

              {/* Section 3: Ubicación */}
              <SectionHeader config={SECTIONS[3]} index={4} total={4} />
              <AppTextInput
                label="Dirección o referencia (opcional)"
                value={form.address}
                onChangeText={onChangeField('address')}
                placeholder="Ej. Av. Heroínas, zona..."
                icon="pin"
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
    </ImageBackground>
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
    borderBottomColor: 'rgba(59, 130, 184, 0.08)',
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
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#DCEAF7',
  },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },

  // Navy hero band
  hero: {
    width: '100%',
    minHeight: 348,
    overflow: 'hidden',
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  heroGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(201, 162, 75, 0.12)',
    top: -100,
    right: -75,
  },

  // Floating white card
  cardWrap: {
    marginTop: -34,
    paddingHorizontal: spacing.base,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.cardLg,
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
    overflow: 'hidden',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.25)',
    // boxShadow replaces deprecated shadow* props
    // @ts-ignore
    boxShadow: '0 34px 70px -30px rgba(9, 27, 45, 0.5)',
  },
  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 0,
  },
  goldShine: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 96,
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
    color: Colors.textSecondary,
  },
  loginLinkAccent: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
  },
});

export default RegisterScreen;