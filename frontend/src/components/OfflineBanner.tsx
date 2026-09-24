/**
 * Componente: Aviso de sin conexión (MVC - componentes).
 *
 * Barra flotante que aparece en la parte superior de la app cuando el
 * dispositivo pierde la conexión a internet. Se desliza hacia dentro
 * y hacia fuera con una animación; permanece en overay pero no bloquea
 * la interacción salvo que esté visible.
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { Colors, fontSizes, fontWeights, letterSpacings, spacing } from '../theme';

type OfflineBannerProps = {
  visible: boolean;
  topInset: number;
};

const OFFSET = -70;

function OfflineBanner({ visible, topInset }: OfflineBannerProps) {
  const translateY = useRef(new Animated.Value(OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : OFFSET,
        speed: 18,
        bounciness: 6,
        useNativeDriver: false, // web compat
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 170,
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible, translateY, opacity]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        { top: topInset, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name="wifiOff" size={16} color={Colors.warning} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Sin conexión a internet</Text>
        <Text style={styles.sub}>No podrás enviar ni guardar datos.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1608',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 164, 65, 0.55)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    // @ts-ignore — web only
    boxShadow: '0 14px 28px -14px rgba(0, 0, 0, 0.55)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 164, 65, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.35)',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Colors.textOnDark,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    marginTop: 1,
    letterSpacing: 0.2,
  },
});

export default OfflineBanner;