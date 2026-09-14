/**
 * Componente: Campo de fecha (MVC - componentes).
 *
 * Misma estética que AppTextInput (dark/light) pero abre un CalendarModal.
 *
 * @format
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Colors,
  fontSizes,
  fontWeights,
  radius,
  spacing,
} from '../theme';
import Icon from './Icon';

type AppDateFieldProps = {
  label: string;
  value: string;
  onPress: () => void;
  error?: string;
  dark?: boolean;
};

function AppDateField({ label, value, onPress, error, dark = false }: AppDateFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrapper,
          dark ? styles.wrapperDark : styles.wrapperLight,
          error && styles.wrapperError,
          pressed && styles.wrapperPressed,
        ]}
        testID="date-field"
      >
        <Icon
          name="calendar"
          size={18}
          color={value ? Colors.accent : (dark ? Colors.textMuted : Colors.textSecondary)}
        />
        <Text
          style={[
            styles.value,
            dark && styles.valueDark,
            !value && (dark ? styles.placeholderDark : styles.placeholder),
          ]}
          numberOfLines={1}
        >
          {value || 'Elige una fecha'}
        </Text>
        <View style={[styles.calIcon, dark && styles.calIconDark]}>
          <Icon name="chevronDown" size={16} color={dark ? Colors.accent : Colors.accentDim} />
        </View>
      </Pressable>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="warning" size={12} color={Colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    color: Colors.textPrimary,
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  labelDark: { color: 'rgba(232,240,248,0.7)' },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    minHeight: 56,
    gap: spacing.sm,
  },
  wrapperLight: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.borderSoft,
  },
  wrapperDark: {
    backgroundColor: 'rgba(10, 30, 48, 0.6)',
    borderColor: Colors.border,
  },
  wrapperError: { borderColor: Colors.danger },
  wrapperPressed: { borderColor: Colors.accent },
  value: {
    flex: 1,
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
  },
  valueDark: { color: Colors.textOnDark },
  placeholder: { color: Colors.textSecondary },
  placeholderDark: { color: 'rgba(232,240,248,0.3)' },
  calIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calIconDark: { backgroundColor: 'rgba(0, 212, 255, 0.1)' },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  error: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    flexShrink: 1,
  },
});

export default AppDateField;
