/**
 * Configuración de navegación de la aplicación (MVC - src/navigation).
 *
 * HU02 — Navegación por estado:
 *   - Sin sesión: pantallas de Registro / Inicio de sesión.
 *   - Con sesión: módulo principal del ciudadano.
 * La sesión se restaura al abrir la app y se limpia al cerrar sesión.
 *
 * @format
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EdgeInsets } from 'react-native-safe-area-context';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import { getStoredSession, type StoredSession } from '../utils/session';
import { Colors } from '../theme';

type AppNavigatorProps = {
  safeAreaInsets: EdgeInsets;
};

type AuthScreen = 'register' | 'login';

function AppNavigator({ safeAreaInsets: _safeAreaInsets }: AppNavigatorProps) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    getStoredSession(),
  );
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  const goToLogin = () => setAuthScreen('login');
  const goToRegister = () => setAuthScreen('register');

  const handleLoginSuccess = (newSession: StoredSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    setAuthScreen('login');
  };

  if (session) {
    return (
      <View style={styles.container}>
        <HomeScreen user={session.user} onLogout={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {authScreen === 'login' ? (
        <LoginScreen
          onGoToRegister={goToRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <RegisterScreen onGoToLogin={goToLogin} />
      )}
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