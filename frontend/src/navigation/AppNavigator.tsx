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

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EdgeInsets } from 'react-native-safe-area-context';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AdminScreen from '../screens/AdminScreen';
import StaffHomeScreen from '../screens/StaffHomeScreen';
import UsersScreen from '../screens/UsersScreen';
import UserFormScreen from '../screens/UserFormScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryFormScreen from '../screens/CategoryFormScreen';
import IncidentFormScreen from '../screens/IncidentFormScreen';
import ReportsScreen from '../screens/ReportsScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import PendingVerificationScreen from '../screens/PendingVerificationScreen';
import AssignVerificationScreen from '../screens/AssignVerificationScreen';
import VerificationQueueScreen from '../screens/VerificationQueueScreen';
import VerifyIncidentScreen from '../screens/VerifyIncidentScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AppNavBar from '../components/AppNavBar';
import {
  clearSession,
  getStoredSession,
  type StoredSession,
} from '../utils/session';
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
  | { name: 'user-detail'; userId: number }
  | { name: 'categories' }
  | { name: 'category-create' }
  | { name: 'category-edit'; categoryId: number };

type CitizenRoute =
  | { name: 'home' }
  | { name: 'incident-create' }
  | { name: 'incident-edit'; incidentId: number }
  | { name: 'my-reports' }
  | { name: 'notifications' };

/** Roles municipales que usan el módulo de recepción/consulta (HU09). */
type StaffRoute =
  | { name: 'home' }
  | { name: 'incidents' }
  | { name: 'incident-detail'; incidentId: number }
  | { name: 'pending-verification' }
  | { name: 'assign-verification'; incidentId: number }
  | { name: 'verification-queue' }
  | { name: 'verify-incident'; incidentId: number };

const STAFF_ROLES: string[] = [
  'RECEPCION',
  'VERIFICADOR',
  'ENCARGADO_SOLUCION',
  'PERSONAL_SOLUCION',
];

const SESSION_CHECK_INTERVAL_MS = 10000;

function AppNavigator({ safeAreaInsets: _safeAreaInsets }: AppNavigatorProps) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    getStoredSession(),
  );
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [adminRoute, setAdminRoute] = useState<AdminRoute>({ name: 'dashboard' });
  const [citizenRoute, setCitizenRoute] = useState<CitizenRoute>({ name: 'home' });
  const [staffRoute, setStaffRoute] = useState<StaffRoute>({ name: 'home' });

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (!getStoredSession()) {
        clearSession();
        setAdminRoute({ name: 'dashboard' });
        setStaffRoute({ name: 'home' });
        setSession(null);
        setAuthScreen('login');
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session]);

  const goToLogin = () => setAuthScreen('login');
  const goToRegister = () => setAuthScreen('register');

  const handleLoginSuccess = (newSession: StoredSession) => {
    setAdminRoute({ name: 'dashboard' });
    setStaffRoute({ name: 'home' });
    setCitizenRoute({ name: 'home' });
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    setAdminRoute({ name: 'dashboard' });
    setStaffRoute({ name: 'home' });
    setAuthScreen('login');
  };

  if (session) {
    if (session.user.role === 'ADMINISTRADOR') {
      // Sub-routes where the navbar is still shown but "back" is the only action
      const isSubRoute =
        adminRoute.name === 'user-create' ||
        adminRoute.name === 'user-edit' ||
        adminRoute.name === 'user-detail' ||
        adminRoute.name === 'category-create' ||
        adminRoute.name === 'category-edit';

      // Active key for the navbar
      const navActiveKey =
        adminRoute.name === 'users' ||
        adminRoute.name === 'user-create' ||
        adminRoute.name === 'user-edit' ||
        adminRoute.name === 'user-detail'
          ? 'users'
          : adminRoute.name === 'categories' ||
              adminRoute.name === 'category-create' ||
              adminRoute.name === 'category-edit'
            ? 'categories'
            : 'panel';

      return (
        <View style={styles.container}>
          {/* Screen slot always shrinks to give the navbar its height */}
          <View style={styles.screenSlot}>
            {adminRoute.name === 'dashboard' ? (
              <AdminScreen
                user={session.user}
                onGoToUsers={() => setAdminRoute({ name: 'users' })}
                onGoToCategories={() => setAdminRoute({ name: 'categories' })}
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
                onBack={() =>
                  setAdminRoute({ name: 'user-detail', userId: adminRoute.userId })
                }
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

            {adminRoute.name === 'categories' ? (
              <CategoriesScreen
                onBack={() => setAdminRoute({ name: 'dashboard' })}
                onCreate={() => setAdminRoute({ name: 'category-create' })}
                onOpenEdit={(categoryId) =>
                  setAdminRoute({ name: 'category-edit', categoryId })
                }
              />
            ) : null}

            {adminRoute.name === 'category-create' ? (
              <CategoryFormScreen
                mode="create"
                onBack={() => setAdminRoute({ name: 'categories' })}
                onSaved={() => setAdminRoute({ name: 'categories' })}
              />
            ) : null}

            {adminRoute.name === 'category-edit' ? (
              <CategoryFormScreen
                mode="edit"
                categoryId={adminRoute.categoryId}
                onBack={() => setAdminRoute({ name: 'categories' })}
                onSaved={() => setAdminRoute({ name: 'categories' })}
              />
            ) : null}
          </View>

          {/* Navbar always visible — dimmed on sub-routes */}
          <AppNavBar
            items={[
              {
                key: 'panel',
                label: 'Panel',
                icon: 'dashboard',
                onPress: () => !isSubRoute && setAdminRoute({ name: 'dashboard' }),
              },
              {
                key: 'users',
                label: 'Usuarios',
                icon: 'users',
                onPress: () => !isSubRoute && setAdminRoute({ name: 'users' }),
              },
              {
                key: 'categories',
                label: 'Categorías',
                icon: 'category',
                onPress: () => !isSubRoute && setAdminRoute({ name: 'categories' }),
              },
            ]}
            activeKey={navActiveKey}
            dimmed={isSubRoute}
            onLogout={handleLogout}
          />
        </View>
      );
    }

    const isStaff = STAFF_ROLES.includes(session.user.role);

    if (isStaff) {
      const isStaffSubRoute =
        staffRoute.name === 'incident-detail' ||
        staffRoute.name === 'pending-verification' ||
        staffRoute.name === 'assign-verification' ||
        staffRoute.name === 'verification-queue' ||
        staffRoute.name === 'verify-incident';

      const staffNavActiveKey =
        staffRoute.name === 'incidents' || staffRoute.name === 'incident-detail'
          ? 'incidents'
          : 'home';

      return (
        <View style={styles.container}>
          <View style={styles.screenSlot}>
            {staffRoute.name === 'incidents' ? (
              <IncidentsScreen
                onBack={() => setStaffRoute({ name: 'home' })}
                onOpenDetail={(incidentId) =>
                  setStaffRoute({ name: 'incident-detail', incidentId })
                }
              />
            ) : staffRoute.name === 'incident-detail' ? (
              <IncidentDetailScreen
                incidentId={staffRoute.incidentId}
                onBack={() => setStaffRoute({ name: 'incidents' })}
              />
            ) : staffRoute.name === 'pending-verification' ? (
              <PendingVerificationScreen
                onBack={() => setStaffRoute({ name: 'home' })}
                onOpenIncident={(incidentId) =>
                  setStaffRoute({ name: 'assign-verification', incidentId })
                }
              />
            ) : staffRoute.name === 'assign-verification' ? (
              <AssignVerificationScreen
                incidentId={staffRoute.incidentId}
                onBack={() => setStaffRoute({ name: 'pending-verification' })}
                onAssigned={() => setStaffRoute({ name: 'pending-verification' })}
              />
            ) : staffRoute.name === 'verification-queue' ? (
              <VerificationQueueScreen
                onBack={() => setStaffRoute({ name: 'home' })}
                onOpenIncident={(incidentId) =>
                  setStaffRoute({ name: 'verify-incident', incidentId })
                }
              />
            ) : staffRoute.name === 'verify-incident' ? (
              <VerifyIncidentScreen
                incidentId={staffRoute.incidentId}
                onBack={() => setStaffRoute({ name: 'verification-queue' })}
                onVerified={() => setStaffRoute({ name: 'verification-queue' })}
              />
            ) : (
              <StaffHomeScreen
                user={session.user}
                onGoToIncidents={() => setStaffRoute({ name: 'incidents' })}
                onGoToPendingVerification={() =>
                  setStaffRoute({ name: 'pending-verification' })
                }
                onGoToVerificationQueue={() =>
                  setStaffRoute({ name: 'verification-queue' })
                }
              />
            )}
          </View>

          <AppNavBar
            items={[
              {
                key: 'home',
                label: 'Inicio',
                icon: 'home',
                onPress: () => setStaffRoute({ name: 'home' }),
              },
              {
                key: 'incidents',
                label: 'Incidentes',
                icon: 'report',
                onPress: () => setStaffRoute({ name: 'incidents' }),
              },
            ]}
            activeKey={staffNavActiveKey}
            dimmed={isStaffSubRoute}
            onLogout={handleLogout}
          />
        </View>
      );
    }

    // Citizen home — navbar always visible
    const isCitizenSubRoute = citizenRoute.name !== 'home';
    const citizenNavActiveKey =
      citizenRoute.name === 'my-reports' ? 'reports' : 'home';
    return (
      <View style={styles.container}>
        <View style={styles.screenSlot}>
          {citizenRoute.name === 'incident-create' ? (
            <IncidentFormScreen
              mode="create"
              onBack={() => setCitizenRoute({ name: 'home' })}
              onSaved={() => setCitizenRoute({ name: 'home' })}
            />
          ) : citizenRoute.name === 'incident-edit' ? (
            <IncidentFormScreen
              mode="edit"
              incidentId={citizenRoute.incidentId}
              onBack={() => setCitizenRoute({ name: 'my-reports' })}
              onSaved={() => setCitizenRoute({ name: 'my-reports' })}
            />
          ) : citizenRoute.name === 'my-reports' ? (
            <ReportsScreen
              onBack={() => setCitizenRoute({ name: 'home' })}
              onNewReport={() => setCitizenRoute({ name: 'incident-create' })}
              onEdit={(incidentId) =>
                setCitizenRoute({ name: 'incident-edit', incidentId })
              }
            />
          ) : citizenRoute.name === 'notifications' ? (
            <NotificationsScreen
              onBack={() => setCitizenRoute({ name: 'home' })}
            />
          ) : (
            <HomeScreen
              user={session.user}
              onNewIncident={() => setCitizenRoute({ name: 'incident-create' })}
              onViewReports={() => setCitizenRoute({ name: 'my-reports' })}
              onViewNotifications={() =>
                setCitizenRoute({ name: 'notifications' })
              }
            />
          )}
        </View>
        <AppNavBar
          items={[
            {
              key: 'home',
              label: 'Inicio',
              icon: 'home',
              onPress: () => setCitizenRoute({ name: 'home' }),
            },
            {
              key: 'reports',
              label: 'Reportes',
              icon: 'report',
              onPress: () => setCitizenRoute({ name: 'my-reports' }),
            },
          ]}
          activeKey={citizenNavActiveKey}
          dimmed={isCitizenSubRoute}
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
    backgroundColor: Colors.bgDeep,
  },
  /**
   * screenSlot: flex:1 + minHeight:0 (web key!) forces the screen to shrink
   * when its sibling AppNavBar needs height, instead of pushing it off screen.
   */
  screenSlot: {
    flex: 1,
    // @ts-ignore — minHeight:0 is needed on web to allow flex children to shrink
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default AppNavigator;