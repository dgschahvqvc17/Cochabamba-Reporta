/**
 * Componente: Selector de ubicación (MVC - componentes).
 *
 * HU08 — Registrar ubicación del incidente.
 *
 * Tarjeta glassmorphic que permite:
 *   - Obtener la ubicación actual del dispositivo (permiso + GPS).
 *   - Previsualizar las coordenadas obtenidas antes de enviar.
 *   - Capturar una dirección descriptiva opcional.
 *   - Actualizar o quitar la ubicación capturada.
 * La ubicación es obligatoria para enviar el reporte.
 *
 * @format
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppTextInput from './AppTextInput';
import Icon from './Icon';
import MapPreview from './MapPreview';
import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';
import {
  formatCoordinates,
  MAX_ADDRESS_LENGTH,
  type CurrentPosition,
} from '../utils/location';

type LocationPickerProps = {
  /** Ubicación ya obtenida (pendiente de enviar). */
  position: CurrentPosition | null;
  /** Dirección descriptiva opcional escrita por el usuario. */
  address: string;
  onCapture: () => void;
  onClear: () => void;
  onChangeAddress: (address: string) => void;
  /** true mientras se está obteniendo la ubicación. */
  locating?: boolean;
  /** Error de validación (ej.: no capturó la ubicación). */
  error?: string;
};

export default function LocationPicker({
  position,
  address,
  onCapture,
  onClear,
  onChangeAddress,
  locating = false,
  error,
}: LocationPickerProps) {
  return (
    <View style={[styles.card, error && styles.cardError]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Ubicación del incidente</Text>
          <Text style={styles.hint}>Permiso + GPS · obligatoria</Text>
        </View>
        <View style={styles.statusBadge}>
          <Icon
            name="pin"
            size={16}
            color={position ? Colors.success : Colors.textMuted}
          />
          <Text
            style={[
              styles.statusText,
              position && styles.statusTextCaptured,
            ]}
          >
            {position ? 'Capturada' : 'Pendiente'}
          </Text>
        </View>
      </View>

      {position ? (
        <View style={styles.captured}>
          <MapPreview
            latitude={position.latitude}
            longitude={position.longitude}
          />

          <View style={styles.coordsRow}>
            <Icon name="map" size={20} color={Colors.accent} />
            <View style={styles.coordsTextWrap}>
              <Text style={styles.coordsLabel}>Coordenadas</Text>
              <Text style={styles.coords}>
                {formatCoordinates(position.latitude, position.longitude)}
              </Text>
            </View>
          </View>

          <AppTextInput
            label="Dirección (opcional)"
            value={address}
            onChangeText={onChangeAddress}
            placeholder="Ej.: Av. Principal, frente a la plaza"
            maxLength={MAX_ADDRESS_LENGTH}
            icon="pin"
            dark
          />

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={onCapture}
              disabled={locating}
            >
              <Icon name="refresh" size={18} color={Colors.accent} />
              <Text style={styles.actionText}>Actualizar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnSecondary,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={onClear}
            >
              <Icon name="trash" size={18} color={Colors.danger} />
              <Text style={styles.actionTextDanger}>Quitar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.captureBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={onCapture}
          disabled={locating}
        >
          <Icon name="pin" size={20} color={Colors.accent} />
          <Text style={styles.captureText}>
            {locating ? 'Obteniendo ubicación…' : 'Obtener mi ubicación'}
          </Text>
        </Pressable>
      )}

      {locating ? (
        <Text style={styles.locatingText}>Solicitando permiso y ubicación…</Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(7, 22, 36, 0.6)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.14)',
    padding: spacing.base,
    marginTop: spacing.base,
  },
  cardError: {
    borderColor: Colors.danger,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  label: {
    color: Colors.textOnDark,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hint: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: Colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
  },
  statusTextCaptured: {
    color: Colors.success,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.element,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 184, 0.35)',
    backgroundColor: 'rgba(59, 130, 184, 0.08)',
  },
  captureText: {
    color: Colors.accent,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  captured: {
    gap: spacing.sm,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(3, 12, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(47, 156, 110, 0.25)',
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  coordsTextWrap: {
    flex: 1,
  },
  coordsLabel: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coords: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radius.element,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 184, 0.35)',
    backgroundColor: 'rgba(59, 130, 184, 0.08)',
  },
  actionBtnSecondary: {
    borderColor: 'rgba(194, 73, 79, 0.35)',
    backgroundColor: 'rgba(194, 73, 79, 0.06)',
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  actionText: {
    color: Colors.accent,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  actionTextDanger: {
    color: Colors.danger,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  locatingText: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.sm,
  },
});