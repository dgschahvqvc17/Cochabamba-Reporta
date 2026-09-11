/**
 * Componente compartido: Barra de navegación inferior (MVC - componentes).
 *
 * Se muestra a TODOS los usuarios autenticados, sin importar su rol.
 * Las secciones (íconos) dependen del rol del usuario autenticado:
 * la define AppNavigator según `session.user.role`. Incluye la acción
 * de cerrar sesión con confirmación (diálogo propio, funciona en web).
 *
 * Diseño responsive: el contenido se centra con un ancho máximo para
 * pantallas grandes y ocupa todo el ancho en dispositivos móviles.
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppDialog from './AppDialog';
import Icon, { type IconName } from './Icon';
import { handleLogout } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';

export type AppNavItem = {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
};

type AppNavBarProps = {
  items: AppNavItem[];
  activeKey: string;
  onLogout: () => void;
};

function AppNavBar({ items, activeKey, onLogout }: AppNavBarProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, info, close } = useDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  const doLogout = async () => {
    if (loggingOutRef.current) {
      return;
    }
    loggingOutRef.current = true;
    setIsLoggingOut(true);

    const result = await handleLogout();
    loggingOutRef.current = false;
    setIsLoggingOut(false);

    if (!result.success) {
      info({ title: 'Error', message: result.error });
      return;
    }

    onLogout();
  };

  const handleLogoutPress = () => {
    if (loggingOutRef.current) {
      return;
    }

    confirm({
      title: 'Cerrar sesión',
      message: `¿Deseas cerrar tu sesión en Cochabamba Reporta?`,
      confirmLabel: 'Salir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      onConfirm: () => {
        doLogout();
      },
    });
  };

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={styles.inner}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              testID={`nav-${item.key}`}
            >
              <View
                style={[
                  styles.iconSlot,
                  isActive && styles.iconSlotActive,
                ]}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  color={isActive ? Colors.accent : Colors.textSecondary}
                />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.divider} />

        <Pressable
          onPress={handleLogoutPress}
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
          ]}
          testID="nav-logout"
        >
          <View style={[styles.iconSlot, styles.iconSlotLogout]}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Icon name="logout" size={22} color={Colors.danger} />
            )}
          </View>
          <Text style={[styles.label, styles.logoutLabel]}>Salir</Text>
        </Pressable>
      </View>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.element,
    minWidth: 56,
  },
  itemActive: {
    backgroundColor: 'rgba(22, 163, 224, 0.09)',
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconSlot: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    backgroundColor: 'rgba(22, 163, 224, 0.16)',
  },
  iconSlotLogout: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
  },
  label: {
    marginTop: 2,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
  },
  logoutLabel: {
    color: Colors.danger,
    fontWeight: fontWeights.semiBold,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: spacing.xs,
  },
});

export default AppNavBar;