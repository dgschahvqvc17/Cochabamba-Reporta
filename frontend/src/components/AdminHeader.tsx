/**
 * Componente compartido: Encabezado de pantallas administrativas
 * (MVC - componentes).
 *
 * Barra superior blanca con botón de retroceso, título y subtítulo.
 * Usado en las pantallas de gestión de usuarios (HU03).
 *
 * @format
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, fontSizes, fontWeights, spacing } from '../theme';
import Icon from './Icon';

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

function AdminHeader({ title, subtitle, onBack }: AdminHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
        testID="admin-back"
      >
        <Icon name="chevronLeft" size={24} color={Colors.primary} />
      </Pressable>

      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  backPressed: {
    backgroundColor: 'rgba(22, 163, 224, 0.12)',
  },
  titles: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  spacer: {
    width: 42,
  },
});

export default AdminHeader;