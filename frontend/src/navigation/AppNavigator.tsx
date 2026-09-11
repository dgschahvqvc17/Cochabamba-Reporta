/**
 * Configuración de navegación de la aplicación (MVC - src/navigation).
 *
 * HU02 — Navegación por estado:
 *   - Sin sesión: pantallas de Registro / Inicio de sesión.
 *   - Con sesión: módulo principal (ciudadano) y, si el rol es
 *     ADMINISTRADOR, el panel de gestión de usuarios (HU03).
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
import AdminScreen from '../screens/AdminScreen';
import UsersScreen from '../screens/UsersScreen';
import UserFormScreen from '../screens/UserFormScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import AppNavBar from '../components/AppNavBar';
import { getStoredSession, type StoredSession } from '../utils/session';
import { Colors } from '../theme';

type AppNavigatorProps = {
  safeAreaInsets: EdgeInsets;
};

type AuthScreen = 'register' | 'login';

type AdminRoute =
  | { name: 'dashboard' }
  | { name: 'users' }
  | { name: 'user-create' }
  | { name: 'user-edit'; userId: number }
  | { name: 'user-detail'; userId: number };

function AppNavigator({ safeAreaInsets: _safeAreaInsets }: AppNavigatorProps) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    getStoredSession(),
  );
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [adminRoute, setAdminRoute] = useState<AdminRoute>({ name: 'dashboard' });

  const goToLogin = () => setAuthScreen('login');
  const goToRegister = () => setAuthScreen('register');

  const handleLoginSuccess = (newSession: StoredSession) => {
    setAdminRoute({ name: 'dashboard' });
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    setAdminRoute({ name: 'dashboard' });
    setAuthScreen('login');
  };

  if (session) {
    if (session.user.role === 'ADMINISTRADOR') {
      const isAdminMain = adminRoute.name === 'dashboard' || adminRoute.name === 'users';

      return (
        <View style={styles.container}>
          {adminRoute.name === 'dashboard' ? (
            <AdminScreen
              user={session.user}
              onGoToUsers={() => setAdminRoute({ name: 'users' })}
            />
          ) : null}

          {adminRoute.name === 'users' ? (
            <UsersScreen
              onBack={() => setAdminRoute({ name: 'dashboard' })}
              onCreate={() => setAdminRoute({ name: 'user-create' })}
              onOpenDetail={(userId) => setAdminRoute({ name: 'user-detail', userId })}
            />
          ) : null}

          {adminRoute.name === 'user-create' ? (
            <UserFormScreen
              mode="create"
              onBack={() => setAdminRoute({ name: 'users' })}
              onSaved={() => setAdminRoute({ name: 'users' })}
            />
          ) : null}

          {adminRoute.name === 'user-edit' ? (
            <UserFormScreen
              mode="edit"
              userId={adminRoute.userId}
              onBack={() => setAdminRoute({ name: 'user-detail', userId: adminRoute.userId })}
              onSaved={() => setAdminRoute({ name: 'users' })}
            />
          ) : null}

          {adminRoute.name === 'user-detail' ? (
            <UserDetailScreen
              userId={adminRoute.userId}
              onBack={() => setAdminRoute({ name: 'users' })}
              onEdit={(userId) => setAdminRoute({ name: 'user-edit', userId })}
            />
          ) : null}

          {isAdminMain ? (
            <AppNavBar
              items={[
                {
                  key: 'panel',
                  label: 'Panel',
                  icon: 'dashboard',
                  onPress: () => setAdminRoute({ name: 'dashboard' }),
                },
                {
                  key: 'users',
                  label: 'Usuarios',
                  icon: 'users',
                  onPress: () => setAdminRoute({ name: 'users' }),
                },
              ]}
              activeKey={adminRoute.name === 'users' ? 'users' : 'panel'}
              onLogout={handleLogout}
            />
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <HomeScreen user={session.user} />
        <AppNavBar
          items={[
            {
              key: 'home',
              label: 'Inicio',
              icon: 'home',
              onPress: () => {},
            },
          ]}
          activeKey="home"
          onLogout={handleLogout}
        />
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