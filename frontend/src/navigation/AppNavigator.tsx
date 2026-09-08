/**
 * Configuración de navegación de la aplicación (MVC - src/navigation).
 *
 * Auth Stack: mientras no exista sesión se muestra Registro / Inicio.
 * (Con HU02 se completará con la autenticación real.)
 *
 * @format
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EdgeInsets } from 'react-native-safe-area-context';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { Colors } from '../theme';

type AppNavigatorProps = {
  safeAreaInsets: EdgeInsets;
};

type AuthScreen = 'register' | 'login';

function AppNavigator({ safeAreaInsets: _safeAreaInsets }: AppNavigatorProps) {
  const [screen, setScreen] = useState<AuthScreen>('register');

  const goToLogin = () => setScreen('login');
  const goToRegister = () => setScreen('register');

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <LoginScreen onGoToRegister={goToRegister} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RegisterScreen onGoToLogin={goToLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;