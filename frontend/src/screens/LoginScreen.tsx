/**
 * Pantalla de inicio de sesión (MVC - View).
 *
 * HU02 — La autenticación se implementará en su historia correspondiente.
 * Por ahora es un formulario visual coherente con el diseño del registro.
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppTextInput from '../components/AppTextInput';
import BrandHeader from '../components/BrandHeader';
import GradientOverlay from '../components/GradientOverlay';
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground } from '../assets/images';
import { Colors, fontSizes, fontWeights, spacing } from '../theme';

type LoginScreenProps = {
  onGoToRegister: () => void;
};

function LoginScreen({ onGoToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    Alert.alert(
      'Próximamente',
      'El inicio de sesión se habilitará con la historia HU02.',
    );
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

            <View style={styles.formCard}>
              <AppTextInput
                label="Correo electrónico *"
                value={email}
                onChangeText={setEmail}
                placeholder="tucorreo@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppTextInput
                label="Contraseña *"
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                secureTextEntry
                autoCapitalize="none"
              />

              <PrimaryButton label="Iniciar sesión" onPress={handleSubmit} />

              <Pressable onPress={onGoToRegister} style={styles.link}>
                <Text style={styles.linkText}>
                  ¿Aún no tienes cuenta?{' '}
                  <Text style={styles.linkBold}>Regístrate</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
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
  },
  link: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  linkText: {
    fontSize: fontSizes.body,
    color: Colors.textSecondary,
  },
  linkBold: {
    color: Colors.accent,
    fontWeight: fontWeights.semiBold,
  },
});

export default LoginScreen;