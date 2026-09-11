/**
 * Pantalla de inicio de sesión (MVC - View).
 *
 * HU02 — Como ciudadano, quiero iniciar sesión con mi correo y
 * contraseña para acceder al sistema y reportar incidentes.
 *
 * Diseño moderno sobre la foto de la ciudad con degradado institucional:
 * tarjeta flotante con animación de entrada, encabezado de acceso,
 * campos de 56 px, "Recordarme", validación en vivo y botón secundario
 * de registro.
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppDialog from '../components/AppDialog';
import AppTextInput from '../components/AppTextInput';
import BrandHeader from '../components/BrandHeader';
import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground } from '../assets/images';
import {
  handleLogin,
  type FieldErrors,
} from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';
import { isValidEmail } from '../utils/validators';
import type { StoredSession } from '../utils/session';

type LoginScreenProps = {
  onGoToRegister: () => void;
  onLoginSuccess: (session: StoredSession) => void;
};

function LoginScreen({
  onGoToRegister,
  onLoginSuccess,
}: LoginScreenProps) {
  const { dialog, info, close } = useDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const validateForm = (): FieldErrors => {
    const fieldErrors: FieldErrors = {};

    if (!email.trim()) {
      fieldErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'El correo no tiene un formato válido.';
    }

    if (!password) {
      fieldErrors.password = 'La contraseña es obligatoria.';
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
    const result = await handleLogin(email, password, remember);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
      info({ title: 'No pudimos iniciar sesión', message: result.error });
      return;
    }

    if (result.session) {
      onLoginSuccess(result.session);
    }
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
              title="Bienvenido de nuevo"
              subtitle="Ingresa para reportar y dar seguimiento a los incidentes de tu ciudad"
            />

            <Animated.View
              style={[
                styles.card,
                {
                  opacity: entrance,
                  transform: [
                    {
                      translateY: entrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [28, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.cardAccentBar}>
                <GradientOverlay
                  colors={[Colors.warning, Colors.accent]}
                  style={styles.cardAccentGradient}
                />
              </View>

              <Text style={styles.cardEyebrow}>ACCESO CIUDADANO</Text>
              <Text style={styles.cardTitle}>Inicia sesión</Text>
              <Text style={styles.cardSubtitle}>
                Escribe tus credenciales para continuar
              </Text>

              <View style={styles.fields}>
                <AppTextInput
                  label="Correo electrónico *"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.email;
                      return next;
                    });
                  }}
                  placeholder="tucorreo@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                <AppTextInput
                  label="Contraseña *"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.password;
                      return next;
                    });
                  }}
                  placeholder="Tu contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password}
                />
              </View>

              <Pressable
                onPress={() => setRemember((value) => !value)}
                style={styles.rememberRow}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.checkbox,
                    remember && styles.checkboxChecked,
                  ]}
                >
                  {remember ? (
                    <Icon name="check" size={14} color={Colors.textOnPrimary} />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>
                  Mantener mi sesión iniciada
                </Text>
              </Pressable>

              <PrimaryButton
                label="Iniciar sesión"
                onPress={handleSubmit}
                loading={isSubmitting}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>¿NUEVO EN COCHABAMBA REPORTA?</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={onGoToRegister}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  Crear una cuenta
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <AppDialog dialog={dialog} onCancel={close} />
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
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 36,
    elevation: 18,
    overflow: 'hidden',
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
  },
  cardAccentBar: {
    height: 6,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  cardAccentGradient: {
    height: 6,
  },
  cardEyebrow: {
    color: Colors.warning,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fields: {
    marginTop: spacing.lg,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  rememberText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.body,
    color: Colors.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.8,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(22, 163, 224, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(22, 163, 224, 0.14)',
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
});

export default LoginScreen;