/**
 * Componente compartido: Campo de texto (MVC - componentes).
 *
 * Estilo moderno: caja de entrada suave con borde, sombra sutil y
 * resaltado de foco (huella de acento). Soporta contraseña visible/oculta
 * y mensaje de error por campo.
 *
 * @format
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';

type AppTextInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  editable?: boolean;
};

function AppTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'words',
  editable = true,
}: AppTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const showPasswordToggle = secureTextEntry;
  const effectiveSecure = secureTextEntry && !isPasswordVisible;

  const wrapperStyles = [
    styles.inputWrapper,
    isFocused && styles.inputWrapperFocused,
    error && styles.inputWrapperError,
    !editable && styles.inputWrapperDisabled,
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={wrapperStyles}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={effectiveSecure}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          selectionColor={Colors.accent}
          editable={editable}
        />
        {showPasswordToggle && (
          <Pressable
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={12}
          >
            <Text style={styles.toggle}>
              {isPasswordVisible ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        )}
      </View>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputWrapperFocused: {
    backgroundColor: Colors.surface,
    borderColor: Colors.accent,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  inputWrapperDisabled: {
    backgroundColor: 'rgba(230, 236, 241, 0.5)',
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: spacing.sm,
    outlineWidth: 0,
  },
  toggle: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
  error: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
});

export default AppTextInput;