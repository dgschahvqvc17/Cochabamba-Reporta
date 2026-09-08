/**
 * Módulo principal de la aplicación (Frontend - React Native).
 *
 * Arquitectura MVC según "Arquitectura del Proyecto":
 *   - src/controllers → Lógica de interacción (Controller)
 *   - src/models      → Modelos y estructuras de datos (Model)
 *   - src/screens     → Pantallas de la aplicación (View)
 *   - src/services    → Consumo de la API REST
 *   - src/navigation  → Navegación de la aplicación
 *   - src/components  → Componentes reutilizables
 *   - src/assets      → Recursos multimedia
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppNavigator safeAreaInsets={safeAreaInsets} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;