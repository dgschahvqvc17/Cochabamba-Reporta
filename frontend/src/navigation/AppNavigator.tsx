/**
 * Configuración de navegación de la aplicación (MVC - src/navigation).
 *
 * En este módulo se definen las rutas y la estructura de navegación
 * entre las diferentes pantallas de la aplicación.
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { EdgeInsets } from 'react-native-safe-area-context';
import { Colors } from '../assets/colors';

type AppNavigatorProps = {
  safeAreaInsets: EdgeInsets;
};

function AppNavigator({ safeAreaInsets }: AppNavigatorProps) {
  return (
    <View
      style={[
        styles.container,
        { paddingTop: safeAreaInsets.top, paddingBottom: safeAreaInsets.bottom },
      ]}
    >
      <Text style={styles.title}>Alcaldía de Cochabamba</Text>
      <Text style={styles.subtitle}>Reporte de Incidentes Urbanos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default AppNavigator;