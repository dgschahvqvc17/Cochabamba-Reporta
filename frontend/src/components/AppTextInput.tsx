/**
 * Componente: Campo de texto (MVC - componentes).
 *
 * Diseño refinado dark/light: borde fino con acento azul al foco,
 * fondo semitransparente, icono opcional, toggle contraseña estilizado,
 * y mensaje de error animado.
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Icon, { type IconName } from './Icon';
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
  icon?: IconName;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  /** Si true, usa el modo dark (fondo oscuro) */
  dark?: boolean;
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
  icon,
  hint,
  style,
  dark = false,
}: AppTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // must be false — animating border/shadow (layout props)
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.danger : dark ? Colors.border : Colors.borderSoft,
      error ? Colors.danger : Colors.accent,
    ],
  });

  const effectiveSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>

      <Animated.View
        style={[
          styles.wrapper,
          dark ? styles.wrapperDark : styles.wrapperLight,
          !editable && styles.wrapperDisabled,
          { borderColor },
        ]}
      >
        {icon && (
          <View style={styles.iconWrap}>
            <Icon
              name={icon}
              size={18}
              color={isFocused ? Colors.accent : (dark ? Colors.textMuted : Colors.textSecondary)}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            dark && styles.inputDark,
            icon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={dark ? 'rgba(232,240,248,0.3)' : Colors.textSecondary}
          secureTextEntry={effectiveSecure}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          selectionColor={Colors.accent}
          editable={editable}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={12}
            style={styles.toggleBtn}
          >
            <Text style={[styles.toggle, dark && styles.toggleDark]}>
              {isPasswordVisible ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Icon name="warning" size={12} color={Colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, dark && styles.hintDark]}>{hint}</Text>
      ) : null}
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
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  labelDark: {
    color: 'rgba(232,240,248,0.7)',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    minHeight: 56,
    elevation: 0,
  },
  wrapperLight: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.borderSoft,
  },
  wrapperDark: {
    backgroundColor: 'rgba(10, 30, 48, 0.6)',
    borderColor: Colors.border,
  },
  wrapperDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
    paddingVertical: spacing.sm,
    // @ts-ignore — web only
    outlineWidth: 0,
  },
  inputDark: {
    color: Colors.textOnDark,
  },
  inputWithIcon: {
    // room for the icon already handled via iconWrap margin
  },
  toggleBtn: {
    paddingLeft: spacing.sm,
  },
  toggle: {
    color: Colors.accentDim,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.3,
  },
  toggleDark: {
    color: Colors.accent,
  },
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
  hint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 5,
  },
  hintDark: {
    color: Colors.textMuted,
  },
});

export default AppTextInput;
