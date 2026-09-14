/**
 * Pantalla: Inicio de sesión (MVC - View).
 *
 * HU02 — Diseño dark immersive: fondo degradado multicapa con orbes
 * de color, tarjeta glassmorphic con entrada animada, glow neon en
 * campos de foco, checkbox rediseñado y botón con pulso.
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
import { handleLogin, type FieldErrors } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import {
  Colors,
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
  const orb1Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Anim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(orb1Anim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    ).start();
  }, [cardAnim, orb1Anim]);

  const orbScale = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

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
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        {/* Multi-layer dark overlay */}
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.97)',
            'rgba(5, 14, 26, 0.93)',
            'rgba(3, 9, 18, 0.98)',
          ]}
        />

        {/* Animated color orbs */}
        <Animated.View style={[styles.orbCyan, { transform: [{ scale: orbScale }] }]} />
        <View style={styles.orbGold} />
        <View style={styles.orbPurple} />

        {/* Scan line decoration */}
        <View style={styles.scanLine} />
        <View style={[styles.scanLine, styles.scanLine2]} />

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
              title="Bienvenido de nuevo"
              subtitle="Ingresa para reportar y dar seguimiento a los incidentes de tu ciudad"
            />

            {/* Glass card */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardAnim,
                  transform: [
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Top accent line */}
              <View style={styles.cardTopBar} />
              <View style={styles.cardTopGlow} />

              {/* Card shimmer */}
              <View style={styles.cardShimmer} />

              <Text style={styles.eyebrow}>⬡ ACCESO CIUDADANO</Text>
              <Text style={styles.cardTitle}>Inicia sesión</Text>
              <Text style={styles.cardSub}>Escribe tus credenciales para continuar</Text>

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
                  dark
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
                  dark
                />
              </View>

              {/* Remember me */}
              <Pressable
                onPress={() => setRemember((v) => !v)}
                style={styles.rememberRow}
                hitSlop={8}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember && <Icon name="check" size={12} color={Colors.bgDeep} />}
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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },

  // Orbs
  orbCyan: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 212, 255, 0.07)',
    top: -80,
    right: -80,
  },
  orbGold: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 184, 0, 0.05)',
    top: 100,
    left: -60,
  },
  orbPurple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167, 139, 250, 0.04)',
    bottom: 200,
    right: -40,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    top: '30%',
  },
  scanLine2: {
    top: '65%',
    backgroundColor: 'rgba(255, 184, 0, 0.04)',
  },

  // Card
  card: {
    backgroundColor: 'rgba(7, 22, 36, 0.88)',
    borderRadius: radius.cardLg,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
  },
  cardTopBar: {
    height: 3,
    backgroundColor: Colors.accent,
    marginHorizontal: -spacing.lg,
    marginBottom: 0,
  },
  cardTopGlow: {
    height: 40,
    marginHorizontal: -spacing.lg,
    backgroundColor: 'rgba(0, 212, 255, 0.04)',
    marginBottom: spacing.lg,
  },
  cardShimmer: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textAlign: 'center',
  },
  cardTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.extraBold,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  cardSub: {
    color: Colors.textMuted,
    fontSize: fontSizes.small,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dividerH: {
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    marginVertical: spacing.base,
    marginHorizontal: -spacing.lg,
  },
  fields: {
    marginTop: spacing.sm,
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
    borderColor: 'rgba(0, 212, 255, 0.4)',
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  rememberText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.small,
    color: Colors.textMuted,
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
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  separatorText: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacings.widest,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
});

export default LoginScreen;
