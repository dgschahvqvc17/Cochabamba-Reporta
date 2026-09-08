/**
 * Componente compartido: Campo de fecha (MVC - componentes).
 *
 * Misma estética que AppTextInput pero abre un calendario
 * (CalendarModal) para elegir la fecha.
 *
 * @format
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';

type AppDateFieldProps = {
  label: string;
  value: string; // formato visible DD/MM/AAAA
  onPress: () => void;
  error?: string;
};

function AppDateField({ label, value, onPress, error }: AppDateFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.fieldWrapper,
          error && styles.fieldWrapperError,
          pressed && styles.fieldWrapperPressed,
        ]}
        testID="date-field"
      >
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value || 'Elige una fecha'}
        </Text>
        <View style={styles.chevronBadge}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  fieldWrapperError: {
    borderColor: Colors.danger,
  },
  fieldWrapperPressed: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  chevronBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(22,163,224,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  chevron: {
    color: Colors.accent,
    fontSize: 20,
    lineHeight: 22,
    marginTop: -1,
  },
  error: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
});

export default AppDateField;