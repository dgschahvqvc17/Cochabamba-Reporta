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
import FloatingOrbs from '../components/FloatingOrbs';
import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground, fondoNew } from '../assets/images';
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
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [cardAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [ringAnim]);

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
    <ImageBackground source={fondoNew} style={styles.root} resizeMode="cover">
      {/* Deep institutional navy overlay so the photo reads as a premium backdrop */}
      {/* Fondo inferior (azul oscuro) aplicado uniformemente a toda la imagen */}
      <GradientOverlay
        colors={[
          'rgba(3, 15, 28, 0.97)',
          'rgba(3, 15, 28, 0.97)',
          'rgba(3, 15, 28, 0.97)',
        ]}
      />
      {/* Esferas decorativas que se desplazan por todo el fondo */}
      <FloatingOrbs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Navy hero band with curved bottom + animated gold rings */}
          <ImageBackground
            source={cityBackground}
            style={styles.hero}
            resizeMode="cover"
          >
            <GradientOverlay
              colors={[
                'rgba(4, 12, 22, 0.97)',
                'rgba(9, 24, 40, 0.92)',
                'rgba(8, 20, 33, 0.94)',
              ]}
            />

            {/* Breathing decorative rings */}
            <Animated.View
              style={[
                styles.ring,
                styles.ringOuter,
                {
                  opacity: ringAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0.12],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                styles.ringInner,
                {
                  opacity: ringAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.55],
                  }),
                },
              ]}
            />

            <BrandHeader
              title="Bienvenido de nuevo"
              subtitle="Ingresa para reportar y dar seguimiento a los incidentes de tu ciudad"
            />

            {/* Feature chips */}
            <View style={styles.badgesRow}>
              <View style={styles.badgeChip}>
                <Icon name="report" size={14} color={Colors.gold} />
                <Text style={styles.badgeText}>Reporta</Text>
              </View>
              <View style={styles.badgeChip}>
                <Icon name="clock" size={14} color={Colors.gold} />
                <Text style={styles.badgeText}>Seguimiento</Text>
              </View>
              <View style={styles.badgeChip}>
                <Icon name="shieldCheck" size={14} color={Colors.gold} />
                <Text style={styles.badgeText}>Colabora</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Floating white card with brand medallion */}
          <Animated.View
            style={[
              styles.cardWrap,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [70, 0],
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

              {/* Trust footer */}
              <View style={styles.trustRow}>
                <Icon name="shield" size={13} color={Colors.success} />
                <Text style={styles.trustText}>
                  Datos protegidos · Plataforma oficial de Cochabamba
                </Text>
              </View>
            </View>

            {/* Golden medallion straddling the card top edge */}
            <View style={styles.medallion}>
              <GradientOverlay
                colors={['#0E3D63', Colors.accentDim, '#0A243C']}
                style={styles.medallionBg}
              />
              <View style={styles.medallionRing} />
              <Icon name="shieldCheck" size={26} color={Colors.gold} />
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
    backgroundColor: '#030F1C',
  },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },

  // Navy hero band
  hero: {
    width: '100%',
    minHeight: 398,
    overflow: 'hidden',
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  ringOuter: {
    width: 320,
    height: 320,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    top: -120,
    right: -70,
  },
  ringInner: {
    width: 190,
    height: 190,
    borderWidth: 1,
    borderColor: Colors.accent,
    bottom: -70,
    left: -45,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.35)',
  },
  badgeText: {
    color: Colors.textOnDark,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.4,
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.3)',
    // boxShadow replaces deprecated shadow* props
    // @ts-ignore
    boxShadow: '0 34px 70px -30px rgba(3, 15, 28, 0.75)',
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

  // Brand medallion
  medallion: {
    position: 'absolute',
    top: -38,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDim,
    overflow: 'hidden',
    zIndex: 5,
    // @ts-ignore
    boxShadow: '0 14px 30px -10px rgba(3, 15, 28, 0.7)',
  },
  medallionBg: {
    borderRadius: 38,
  },
  medallionRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.5)',
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
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  trustText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
  },
});

export default LoginScreen;