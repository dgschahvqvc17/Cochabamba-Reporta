/**
 * Componente: Barra de navegación inferior glassmorphic (MVC - componentes).
 *
 * Barra flotante con fondo glass oscuro, indicador activo con glow neon,
 * transiciones suaves, hover en web, y botón de logout estilizado.
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppDialog from './AppDialog';
import Icon, { type IconName } from './Icon';
import { handleLogout } from '../controllers/AuthController';
import { useDialog } from '../hooks/useDialog';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  radius,
  spacing,
} from '../theme';

const DESKTOP_BREAKPOINT = layout.breakpointMd;

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
  /** When true, items are visually dimmed (on sub-route screens) but logout still works */
  dimmed?: boolean;
};

function NavItem({
  item,
  isActive,
  onPress,
}: {
  item: AppNavItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: false,
      speed: 40,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.item,
        isHovered && !isActive && styles.itemHovered,
      ]}
      // @ts-ignore
      cursor={Platform.OS === 'web' ? 'pointer' : undefined}
      testID={`nav-${item.key}`}
    >
      <Animated.View
        style={[
          styles.iconSlot,
          isActive && styles.iconSlotActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Icon
          name={item.icon}
          size={20}
          color={
            isActive
              ? Colors.bgDeep
              : isHovered
              ? Colors.accent
              : Colors.textSecondary
          }
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
          isHovered && !isActive && styles.labelHovered,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function AppNavBar({ items, activeKey, onLogout, dimmed = false }: AppNavBarProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, error, close } = useDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);
  const { width } = useWindowDimensions();
  const [logoutHovered, setLogoutHovered] = useState(false);

  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const doLogout = async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);
    const result = await handleLogout();
    loggingOutRef.current = false;
    setIsLoggingOut(false);
    if (!result.success) {
      error({ title: 'Error', message: result.error });
      return;
    }
    onLogout();
  };

  const handleLogoutPress = () => {
    if (loggingOutRef.current) return;
    confirm({
      title: 'Cerrar sesión',
      message: '¿Deseas cerrar tu sesión en Cochabamba Reporta?',
      confirmLabel: 'Salir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      onConfirm: doLogout,
    });
  };

  const hPad = isDesktop
    ? Math.max(insets.left, spacing.base)
    : Math.max(insets.left, spacing.sm);

  // Bottom safe-area + visual padding so the bar sits above the home indicator
  const bPad = Math.max(insets.bottom, spacing.sm);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingLeft: hPad,
          paddingRight: hPad,
          paddingBottom: bPad,
          paddingTop: spacing.sm,
        },
      ]}
    >
      <View style={[styles.bar, isDesktop && styles.barDesktop, dimmed && styles.barDimmed]}>
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={!dimmed && item.key === activeKey}
            onPress={item.onPress}
          />
        ))}

        <View style={styles.divider} />

        <Pressable
          onPress={handleLogoutPress}
          onHoverIn={() => setLogoutHovered(true)}
          onHoverOut={() => setLogoutHovered(false)}
          style={[
            styles.item,
            logoutHovered && styles.itemLogoutHovered,
          ]}
          testID="nav-logout"
        >
          <View style={[styles.iconSlot, styles.iconSlotLogout]}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Icon name="logout" size={18} color={Colors.danger} />
            )}
          </View>
          <Text style={styles.logoutLabel}>Salir</Text>
        </Pressable>
      </View>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Solid background so content behind doesn't bleed through
    backgroundColor: Colors.bgDeep,
    // Separator line at top
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 255, 0.12)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 22, 36, 0.98)',
    borderRadius: radius.cardLg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  barDesktop: {
    paddingHorizontal: spacing.md,
  },
  barDimmed: {
    opacity: 0.45,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.element,
    minWidth: 52,
  },
  itemHovered: {
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  itemLogoutHovered: {
    backgroundColor: 'rgba(255, 69, 96, 0.08)',
  },
  iconSlot: {
    width: 40,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    backgroundColor: Colors.accent,
  },
  iconSlotLogout: {
    backgroundColor: 'rgba(255, 69, 96, 0.12)',
  },
  label: {
    marginTop: 3,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
  },
  labelHovered: {
    color: Colors.accent,
  },
  logoutLabel: {
    marginTop: 3,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    color: Colors.danger,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    marginHorizontal: spacing.xs,
  },
});

export default AppNavBar;
