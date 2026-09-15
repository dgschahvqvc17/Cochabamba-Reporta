/**
 * Componente: Selector de evidencia fotográfica (MVC - componentes).
 *
 * HU07 — Adjuntar evidencia fotográfica.
 *
 * Tarjeta glassmorphic que permite:
 *   - Adjuntar hasta MAX_EVIDENCE_COUNT imágenes (cámara o galería).
 *   - Previsualizar cada imagen en miniatura con su peso (formatFileSize).
 *   - Eliminar una imagen antes de enviar.
 * Valida formato y tamaño en el controlador (utils/evidence.ts) y muestra
 * los errores vía el diálogo de la pantalla.
 *
 * @format
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon from './Icon';
import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';
import { formatFileSize, type PickedEvidence } from '../utils/evidence';

type EvidencePickerProps = {
  /** Imágenes ya seleccionadas (pendientes de subir). */
  evidence: PickedEvidence[];
  onAdd: (source: 'camera' | 'gallery') => void;
  onRemove: (index: number) => void;
  /** true mientras hay una captura/adjunto en curso. */
  picking?: boolean;
};

export default function EvidencePicker({
  evidence,
  onAdd,
  onRemove,
  picking = false,
}: EvidencePickerProps) {
  const limitReached = evidence.length >= MAX_EVIDENCE_COUNT;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Evidencia fotográfica</Text>
          <Text style={styles.hint}>
            JPG, JFIF, PNG o WebP · máx. 5 MB por imagen
          </Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {evidence.length}/{MAX_EVIDENCE_COUNT}
          </Text>
        </View>
      </View>

      {evidence.length > 0 ? (
        <View style={styles.grid}>
          {evidence.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              <View style={styles.thumbOverlay} />
              <Text style={styles.thumbSize} numberOfLines={1}>
                {formatFileSize(item.sizeBytes)}
              </Text>
              <Pressable
                style={styles.removeBtn}
                onPress={() => onRemove(index)}
                hitSlop={10}
              >
                <Icon name="trash" size={14} color={Colors.textOnDark} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={() => onAdd('camera')}
          disabled={limitReached || picking}
        >
          <Icon name="photo" size={18} color={Colors.accent} />
          <Text style={styles.actionText}>Cámara</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnSecondary,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={() => onAdd('gallery')}
          disabled={limitReached || picking}
        >
          <Icon name="folder" size={18} color={Colors.accent} />
          <Text style={styles.actionText}>Galería</Text>
        </Pressable>
      </View>

      {picking ? (
        <Text style={styles.pickingText}>Obteniendo imagen…</Text>
      ) : null}

      {limitReached ? (
        <Text style={styles.limitText}>
          Límite alcanzado: solo puedes adjuntar hasta {MAX_EVIDENCE_COUNT}{' '}
          imágenes.
        </Text>
      ) : null}
    </View>
  );
}

const MAX_EVIDENCE_COUNT = 5;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(7, 22, 36, 0.6)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.14)',
    padding: spacing.base,
    marginTop: spacing.base,
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
  counter: {
    backgroundColor: Colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  counterText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  thumbWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.element,
    overflow: 'hidden',
  },
  thumb: {
    width: 96,
    height: 96,
  },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 8, 16, 0.3)',
  },
  thumbSize: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    color: Colors.textOnDark,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    // textShadow reemplaza a las props textShadow* (deprecadas en RN 0.87)
    // @ts-ignore — type aún no incluye textShadow (RN 0.87)
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 48,
    borderRadius: radius.element,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.35)',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(3, 12, 22, 0.4)',
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  actionText: {
    color: Colors.accent,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  pickingText: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  limitText: {
    color: Colors.warning,
    fontSize: fontSizes.caption,
    marginTop: spacing.sm,
  },
});