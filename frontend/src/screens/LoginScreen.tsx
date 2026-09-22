/**
 * Pantalla: Inicio de sesión (MVC - View).
 *
 * HU02 — Diseño premium de alto contraste: banda hero navy con base
 * curva y tarjeta blanca flotante, acentos dorados del escudo, campos
 * claros y botón degradado institucional.
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
import { cityBackground, fondo3 } from '../assets/images';
import { handleLogin, type FieldErrors } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import {
  Colors,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { isValidEmail } from '../utils/validators';
import type { StoredSession } from '../utils/session';

type LoginScreenProps = {
  onGoToRegister: () => void;
  onLoginSuccess: (session: StoredSession) => void;
};

function LoginScreen({ onGoToRegister, onLoginSuccess }: LoginScreenProps) {
  const { dialog, error, close } = useDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [cardAnim]);

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = 'El correo electrónico es obligatorio.';
    else if (!isValidEmail(email)) errs.email = 'El correo no tiene un formato válido.';
    if (!password) errs.password = 'La contraseña es obligatoria.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    const result = await handleLogin(email, password, remember);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      const tone =
        result.code === 'USER_INACTIVE' ? 'warning' : 'danger';
      error({
        title: 'No pudimos iniciar sesión',
        message: result.error,
        tone,
      });
      return;
    }
    if (result.session) onLoginSuccess(result.session);
  };

  const clearError = (field: keyof FieldErrors) =>
    setErrors((c) => { const n = { ...c }; delete n[field]; return n; });

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
              title="Bienvenido de nuevo"
              subtitle="Ingresa para reportar y dar seguimiento a los incidentes de tu ciudad"
            />
          </ImageBackground>

          {/* Floating white card */}
          <Animated.View
            style={[
              styles.cardWrap,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [64, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.card}>
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
                style={styles.heroShine}
              />

              {/* Gold eyebrow pill */}
              <View style={styles.eyebrowPill}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrow}>ACCESO CIUDADANO</Text>
                <View style={styles.eyebrowDot} />
              </View>

              <Text style={styles.cardTitle}>Inicia sesión</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.cardSub}>
                Escribe tus credenciales para continuar
              </Text>

              <View style={styles.dividerH} />

              <View style={styles.fields}>
                <AppTextInput
                  label="Correo electrónico"
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError('email'); }}
                  placeholder="tucorreo@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  icon="person"
                />
                <AppTextInput
                  label="Contraseña"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError('password'); }}
                  placeholder="Tu contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.password}
                  icon="lock"
                />
              </View>

              {/* Remember me */}
              <Pressable
                onPress={() => setRemember((v) => !v)}
                style={styles.rememberRow}
                hitSlop={8}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember && <Icon name="check" size={12} color={Colors.textOnPrimary} />}
                </View>
                <Text style={styles.rememberText}>Mantener mi sesión iniciada</Text>
              </Pressable>

              <PrimaryButton
                label="Iniciar sesión"
                onPress={handleSubmit}
                loading={isSubmitting}
              />

              {/* Divider */}
              <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>¿NUEVO AQUÍ?</Text>
                <View style={styles.separatorLine} />
              </View>

              <PrimaryButton
                label="Crear una cuenta"
                onPress={onGoToRegister}
                variant="ghost"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppDialog dialog={dialog} onCancel={close} />
    </ImageBackground>
  );
}

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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: radius.cardLg,
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  heroShine: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 96,
  },

  // Eyebrow
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.32)',
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.gold,
    opacity: 0.85,
    marginHorizontal: spacing.xs,
  },
  eyebrow: {
    color: Colors.goldDim,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textAlign: 'center',
  },

  // Title
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.extraBold,
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginTop: spacing.base,
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 54,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    opacity: 0.85,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: fontSizes.small,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
    alignSelf: 'center',
    lineHeight: 19,
  },

  dividerH: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginVertical: spacing.base,
    marginHorizontal: -spacing.lg,
  },
  fields: {
    marginTop: spacing.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 184, 0.45)',
    backgroundColor: 'rgba(59, 130, 184, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    // @ts-ignore
    boxShadow: '0 4px 12px -4px rgba(59, 130, 184, 0.7)',
  },
  rememberText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.small,
    color: Colors.textSecondary,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  separatorText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacings.widest,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
});

export default LoginScreen;