/**
 * Pantalla de Registro de Ciudadano (MVC - View).
 *
 * HU01 — Como ciudadano, quiero crear una cuenta proporcionando mis
 * datos personales para poder acceder al sistema y realizar reportes
 * de incidentes urbanos.
 *
 * Diseño moderno: fondo con fotografía de la ciudad (cbba1.jfif),
 * degradado institucional, logo de la Alcaldía, tarjeta flotante y
 * calendario para la fecha de nacimiento.
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
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground } from '../assets/images';
import { handleRegister, type FieldErrors } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import type { CitizenRegistration } from '../models/Citizen';
import { Colors, fontSizes, fontWeights, layout, spacing } from '../theme';
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

function RegisterScreen({ onGoToLogin }: RegisterScreenProps) {
  const { dialog, info, close } = useDialog();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

    const birthDate = isValidAdultBirthDate(form.birthDate);
    if (!birthDate) {
      fieldErrors.birthDate =
        'Elige una fecha válida siendo mayor de 18 años.';
    }

    if (!form.identityNumber.trim()) {
      fieldErrors.identityNumber = 'El documento de identidad es obligatorio.';
    } else if (!isValidIdentityNumber(form.identityNumber)) {
      fieldErrors.identityNumber =
        'El documento debe contener entre 5 y 8 dígitos.';
    }

    if (!form.phone.trim()) {
      fieldErrors.phone = 'El número de teléfono es obligatorio.';
    } else if (!isValidPhone(form.phone)) {
      fieldErrors.phone = 'El teléfono debe contener entre 7 y 8 dígitos.';
    }

    if (!form.email.trim()) {
      fieldErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isValidEmail(form.email)) {
      fieldErrors.email = 'El correo no tiene un formato válido.';
    }

    if (!form.password) {
      fieldErrors.password = 'La contraseña es obligatoria.';
    } else if (!isValidPassword(form.password)) {
      fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (!form.confirmPassword) {
      fieldErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (form.confirmPassword !== form.password) {
      fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
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
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
      info({ title: 'Error', message: result.message });
      return;
    }

    info({
      title: '¡Cuenta creada!',
      message: 'Tu cuenta se registró correctamente. Ya puedes iniciar sesión.',
      onAccept: onGoToLogin,
    });
    setForm(EMPTY_FORM);
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

  return (
    <View style={styles.flex}>
      <ImageBackground
        source={cityBackground}
        style={styles.flex}
        resizeMode="cover"
      >
        <GradientOverlay
          colors={[
            'rgba(6, 48, 67, 0.94)',
            'rgba(7, 52, 74, 0.88)',
            'rgba(3, 18, 32, 0.96)',
          ]}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <BrandHeader
              title="Crear cuenta"
              subtitle="Regístrate para reportar incidentes urbanos en Cochabamba"
            />

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
              <AppDateField
                label="Fecha de nacimiento *"
                value={form.birthDate}
                onPress={() => setIsCalendarOpen(true)}
                error={errors.birthDate}
              />

              <SectionTitle>Identificación y contacto</SectionTitle>
              <AppTextInput
                label="Número de documento de identidad *"
                value={form.identityNumber}
                onChangeText={onChangeField('identityNumber')}
                placeholder="Ej. 7654321"
                keyboardType="number-pad"
                maxLength={8}
                error={errors.identityNumber}
              />
              <AppTextInput
                label="Teléfono *"
                value={form.phone}
                onChangeText={onChangeField('phone')}
                placeholder="Ej. 78901234"
                keyboardType="phone-pad"
                maxLength={8}
                error={errors.phone}
              />
              <AppTextInput
                label="Correo electrónico *"
                value={form.email}
                onChangeText={onChangeField('email')}
                placeholder="tucorreo@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <SectionTitle>Seguridad</SectionTitle>
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
                placeholder="Repite tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmPassword}
              />

              <SectionTitle>Ubicación de referencia</SectionTitle>
              <AppTextInput
                label="Dirección o referencia (opcional)"
                value={form.address}
                onChangeText={onChangeField('address')}
                placeholder="Ej. Av. Heroínas, zona..."
              />

              <PrimaryButton
                label="Crear cuenta"
                onPress={handleSubmit}
                loading={isSubmitting}
              />

              <Pressable onPress={onGoToLogin} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.loginLinkBold}>Inicia sesión</Text>
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
    paddingBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 16,
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
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
  loginLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: fontSizes.body,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    color: Colors.accent,
    fontWeight: fontWeights.semiBold,
  },
});

export default RegisterScreen;