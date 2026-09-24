/**
 * Componente: Barra de navegación inferior refinada (MVC - componentes).
 *
 * Barra flotante clara con indicador activo azul, sombra sutil,
 * transiciones suaves, hover en web y logout estilizado.
 *
 * En móviles la barra es más compacta y, al abrir el teclado, se desliza
 * hacia abajo (queda oculta por el overflow del wrapper) para no tapar la
 * zona de escritura; al cerrarse el teclado siempre vuelve a su tamaño
 * natural, por lo que nunca queda oculta bajo la barra de navegación del
 * dispositivo. Su padding inferior usa la zona segura del dispositivo para
 * quedar siempre por encima de los botones del sistema.
 *
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
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
  compact,
  onPress,
}: {
  item: AppNavItem;
  isActive: boolean;
  compact?: boolean;
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
        compact && styles.itemCompact,
        isHovered && !isActive && styles.itemHovered,
      ]}
      // @ts-ignore
      cursor={Platform.OS === 'web' ? 'pointer' : undefined}
      testID={`nav-${item.key}`}
    >
      <Animated.View
        style={[
          styles.iconSlot,
          compact && styles.iconSlotCompact,
          isActive && styles.iconSlotActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {isActive ? <View style={styles.slotNotch} /> : null}
        <Icon
          name={item.icon}
          size={compact ? 20 : 22}
          color={
            isActive
              ? Colors.accentDim
              : isHovered
              ? Colors.accent
              : Colors.textPrimary
          }
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
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
  const compact = !isDesktop;

  // En móviles, al abrir el teclado toda la barra (fondo + iconos) se
  // contrae a altura 0 para no tapar la zona de escritura y al cerrarlo
  // vuelve a su tamaño natural. Se maneja con estado (no con Animated.Value)
  // para evitar errores de valores congelados en la nueva arquitectura.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      return undefined;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setCollapsed(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setCollapsed(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isDesktop]);

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

  // Zona segura inferior + holgura mínima para que la barra quede siempre
  // por encima de los botones del dispositivo (barra de gestos/navegación).
  // En web móvil env(safe-area-inset-bottom) suele ser 0, por eso sólo ahí
  // se reserva una holgura explícita mayor.
  const bPad = Math.max(
    insets.bottom,
    !isDesktop && Platform.OS === 'web' ? spacing.base : spacing.sm,
  );

  return (
    <View
      style={[
        styles.wrapper,
        compact && styles.wrapperCompact,
        collapsed && styles.wrapperCollapsed,
        {
          paddingLeft: hPad,
          paddingRight: hPad,
          paddingBottom: bPad,
          paddingTop: compact ? spacing.xs : spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          compact && styles.barCompact,
          isDesktop && styles.barDesktop,
          dimmed && styles.barDimmed,
        ]}
      >
        <View style={styles.barAccent} />
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={!dimmed && item.key === activeKey}
            compact={compact}
            onPress={item.onPress}
          />
        ))}

        <View style={[styles.divider, compact && styles.dividerCompact]} />

        <Pressable
          onPress={handleLogoutPress}
          onHoverIn={() => setLogoutHovered(true)}
          onHoverOut={() => setLogoutHovered(false)}
          style={[
            styles.item,
            compact && styles.itemCompact,
            logoutHovered && styles.itemLogoutHovered,
          ]}
          testID="nav-logout"
        >
          <View style={[styles.iconSlot, compact && styles.iconSlotCompact, styles.iconSlotLogout]}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Icon name="logout" size={18} color={Colors.danger} />
            )}
          </View>
          <Text style={[styles.logoutLabel, compact && styles.labelCompact]}>Salir</Text>
        </Pressable>
      </View>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Solid background so content behind doesn't bleed through
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // Premium hairline (soft gold) on top edge
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 75, 0.35)',
    // @ts-ignore
    boxShadow: '0 -8px 30px -18px rgba(18, 38, 58, 0.35)',
  },
  wrapperCompact: {
    borderTopColor: 'rgba(201, 162, 75, 0.28)',
  },
  wrapperCollapsed: {
    maxHeight: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cardLg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
    // @ts-ignore
    boxShadow: '0 18px 42px -18px rgba(18, 38, 58, 0.45)',
  },
  barCompact: {
    borderRadius: radius.card,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderColor: 'rgba(201, 162, 75, 0.22)',
  },
  barAccent: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    opacity: 0.7,
    // @ts-ignore
    pointerEvents: 'none',
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
  itemCompact: {
    minWidth: 0,
    paddingVertical: spacing.xs,
  },
  itemHovered: {
    backgroundColor: Colors.accentSoft,
  },
  itemLogoutHovered: {
    backgroundColor: Colors.dangerSoft,
  },
  iconSlot: {
    width: 48,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotCompact: {
    width: 42,
    height: 28,
  },
  iconSlotActive: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.35)',
    // @ts-ignore
    boxShadow: '0 10px 20px -10px rgba(30, 94, 143, 0.4)',
  },
  slotNotch: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  iconSlotLogout: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(194, 73, 79, 0.4)',
  },
  label: {
    marginTop: 3,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  labelCompact: {
    marginTop: 2,
    fontSize: 12,
  },
  labelActive: {
    color: Colors.accentDim,
    fontWeight: fontWeights.bold,
  },
  labelHovered: {
    color: Colors.accent,
  },
  logoutLabel: {
    marginTop: 3,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    color: Colors.danger,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderSoft,
    marginHorizontal: spacing.xs,
  },
  dividerCompact: {
    height: 24,
  },
});

export default AppNavBar;