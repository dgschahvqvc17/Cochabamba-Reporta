/**
 * Pantalla de inicio de sesión (MVC - View).
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../assets/colors';

function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.message}>
        Esta pantalla se implementará según la historia HU02.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.primary,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});

export default LoginScreen;