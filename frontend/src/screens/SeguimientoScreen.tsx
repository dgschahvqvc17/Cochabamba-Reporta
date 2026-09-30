/**
 * Pantalla: Seguimiento del reporte del ciudadano (MVC - View).
 *
 * HU14 — Consultar el seguimiento del incidente:
 *   - Estado actual y fecha del último cambio (GET /api/v1/incidents/:id).
 *   - Historial completo de estados con quién realizó cada cambio
 *     (GET /api/v1/incidents/:id/history).
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import AppDialog from '../components/AppDialog';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import { fondo3 } from '../assets/images';
import { useDialog } from '../hooks/useDialog';
import {
  loadIncidentById,
  loadIncidentHistory,
  reopenIncidentById,
} from '../controllers/incidentController';
import type {
  Incident,
  IncidentHistoryEntry,
  IncidentStatus,
} from '../models/Incident';
import {
  Colors,
  fontSizes,
  fontWeights,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { formatDateTime } from '../utils/format';

type SeguimientoScreenProps = {
  incidentId: number;
  onBack: () => void;
  onEdit?: (incidentId: number) => void;
};

const STATUS_OPTIONS: {
  value: IncidentStatus;
  label: string;
  tone: PillTone;
}[] = [
  { value: 'REPORTADO', label: 'Reportado', tone: 'accent' },
  { value: 'RECIBIDO', label: 'Recibido', tone: 'primary' },
  { value: 'EN_VERIFICACION', label: 'En verificación', tone: 'warning' },
  { value: 'VERIFICADO', label: 'Verificado', tone: 'info' },
  { value: 'ASIGNADO_PARA_SOLUCION', label: 'En asignación', tone: 'info' },
  { value: 'EN_ATENCION', label: 'En atención', tone: 'warning' },
  { value: 'ATENDIDO', label: 'Atendido', tone: 'success' },
  { value: 'CERRADO', label: 'Cerrado', tone: 'neutral' },
  { value: 'RECHAZADO', label: 'Rechazado', tone: 'danger' },
];

const STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTADO: Colors.accent,
  RECIBIDO: Colors.primaryLight,
  EN_VERIFICACION: Colors.warning,
  VERIFICADO: Colors.info,
  ASIGNADO_PARA_SOLUCION: Colors.info,
  EN_ATENCION: Colors.warning,
  ATENDIDO: Colors.success,
  CERRADO: Colors.textSecondary,
  RECHAZADO: Colors.danger,
};

const statusMeta = (status: IncidentStatus) =>
  STATUS_OPTIONS.find((o) => o.value === status) ?? {
    value: status,
    label: status,
    tone: 'neutral' as PillTone,
  };

function SeguimientoScreen({
  incidentId,
  onBack,
  onEdit,
}: SeguimientoScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    dialog,
    confirm,
    success,
    error: showError,
    close,
  } = useDialog();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<IncidentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);

      const [incidentResult, historyResult] = await Promise.all([
        loadIncidentById(incidentId),
        loadIncidentHistory(incidentId),
      ]);

      refreshing ? setIsRefreshing(false) : setIsLoading(false);

      if (!incidentResult.success || !incidentResult.data) {
        setErrorMessage(incidentResult.message);
        return;
      }

      setIncident(incidentResult.data);

      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
      }
    },
    [incidentId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const requestReopen = () => {
    if (!incident) return;

    confirm({
      title: 'Reabrir reporte',
      message: `Tu reporte ${incident.code} fue rechazado por el municipio. Al reabrirlo volverá a estar en estado "Reportado" y podrás mejorar su información una sola vez.`,
      confirmLabel: 'Reabrir',
      tone: 'danger',
      onConfirm: () => performReopen(incident.id),
    });
  };

  const performReopen = async (id: number) => {
    if (isReopening) return;

    setIsReopening(true);

    const result = await reopenIncidentById(id);

    setIsReopening(false);

    if (!result.success) {
      showError({
        title: 'No se pudo reabrir el reporte',
        message: result.message,
      });
      return;
    }

    success({
      title: 'Reporte reabierto',
      message:
        'Tu reporte volvió a estar en estado "Reportado" y ahora puedes mejorar su información. Tienes una sola oportunidad de edición.',
      onAccept: () => {
        if (onEdit) {
          onEdit(id);
          return;
        }
        load();
      },
    });
  };

  const meta = incident ? statusMeta(incident.status) : null;
  const statusColor = incident ? STATUS_COLORS[incident.status] : Colors.accent;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={incident ? incident.code : 'Seguimiento del reporte'}
        subtitle={
          isLoading
            ? 'Consultando el avance…'
            : incident
              ? `${meta ? meta.label : incident.status} · Último cambio: ${formatDateTime(incident.updatedAt)}`
              : ''
        }
        badge="SEGUIMIENTO"
        contentBackground={Colors.background}
        onBack={onBack}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
            colors={[Colors.accent]}
            tintColor={Colors.accent}
          />
        }
      >
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Icon name="warning" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => load()} hitSlop={8}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isLoading || !incident ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando seguimiento…</Text>
          </View>
        ) : (
          <>
            {/* Estado actual y fechas */}
            <View style={[styles.card, { borderLeftColor: statusColor }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>ESTADO ACTUAL</Text>
                  <PillBadge
                    label={meta ? meta.label : incident.status}
                    tone={meta ? meta.tone : 'neutral'}
                    dot
                  />
                </View>
                <Icon
                  name={incident.rejectedReason ? 'warning' : 'bell'}
                  size={20}
                  color={statusColor}
                />
              </View>

              <Text style={styles.incidentTitle} numberOfLines={2}>
                {incident.title}
              </Text>
              <Text style={styles.incidentDescription} numberOfLines={3}>
                {incident.description}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CATEGORÍA</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {incident.category?.name ?? 'Sin categoría'}
                </Text>
              </View>

              {incident.rejectedReason ? (
                <View style={styles.rejectedBox}>
                  <Icon name="warning" size={15} color={Colors.danger} />
                  <Text style={styles.rejectedText}>
                    Motivo del rechazo: {incident.rejectedReason}
                  </Text>
                </View>
              ) : null}

              {incident.canReopen ? (
                <View style={styles.reopenBox}>
                  <Icon name="refresh" size={18} color={Colors.danger} />
                  <Text style={styles.reopenText}>
                    Puedes reabrir este reporte una sola vez para corregirlo o
                    mejorar su información y volver a ponerlo en proceso.
                  </Text>
                  <Pressable
                    onPress={requestReopen}
                    disabled={isReopening}
                    style={({ pressed }) => [
                      styles.reopenButton,
                      pressed && styles.reopenButtonPressed,
                    ]}
                  >
                    <Text style={styles.reopenButtonText}>
                      {isReopening ? 'Reabriendo…' : 'Reabrir y editar'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {incident.status === 'CERRADO' ? (
                <View style={styles.completedBox}>
                  <Icon name="checkCircle" size={22} color={Colors.success} />
                  <View style={styles.completedTextWrap}>
                    <Text style={styles.completedTitle}>
                      ¡Reporte completado!
                    </Text>
                    <Text style={styles.completedText}>
                      Tu reporte fue atendido y cerrado por el municipio.
                      Gracias por reportar.
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.datesRow}>
              <View style={styles.dateChip}>
                <Icon name="clock" size={15} color={Colors.textSecondary} />
                <View style={styles.dateTextWrap}>
                  <Text style={styles.dateLabel}>Registrado</Text>
                  <Text style={styles.dateValue}>
                    {formatDateTime(incident.createdAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.dateChip}>
                <Icon name="refresh" size={15} color={Colors.accent} />
                <View style={styles.dateTextWrap}>
                  <Text style={styles.dateLabel}>ÚLTIMO CAMBIO</Text>
                  <Text style={styles.dateValue}>
                    {formatDateTime(incident.updatedAt)}
                  </Text>
                </View>
              </View>
            </View>

            {incident.responseDeadlineAt ? (
              <View style={styles.deadlineBox}>
                <Icon name="clock" size={16} color={Colors.successDim} />
                <View style={styles.deadlineTextWrap}>
                  <Text style={styles.deadlineLabel}>
                    PLAZO MÁXIMO DE RESPUESTA
                  </Text>
                  <Text style={styles.deadlineValue}>
                    Te responderemos antes del{' '}
                    {formatDateTime(incident.responseDeadlineAt)}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Historial de estados */}
            <Text style={styles.timelineTitle}>HISTORIAL DE ESTADOS</Text>
            {history.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Aún no hay cambios de estado registrados.
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {history.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    isLast={index === history.length - 1}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

function TimelineItem({
  entry,
  isLast,
}: {
  entry: IncidentHistoryEntry;
  isLast: boolean;
}) {
  const fromMeta = entry.fromStatus ? statusMeta(entry.fromStatus) : null;
  const toMeta = statusMeta(entry.toStatus);
  const toColor = STATUS_COLORS[entry.toStatus] ?? Colors.accent;
  const changedByName = entry.changedBy
    ? `${entry.changedBy.firstName} ${entry.changedBy.lastName}`.trim()
    : '';

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: toColor }]} />
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <Text style={[styles.timelineStatus, { color: toColor }]}>
            {fromMeta
              ? `${fromMeta.label} → ${toMeta.label}`
              : `Inicio · ${toMeta.label}`}
          </Text>
          <Text style={styles.timelineDate}>
            {formatDateTime(entry.createdAt)}
          </Text>
        </View>

        {changedByName ? (
          <View style={styles.timelineChangedBy}>
            <Icon name="person" size={13} color={Colors.textSecondary} />
            <Text style={styles.timelineChangedByText}>
              Realizado por: {changedByName}
            </Text>
          </View>
        ) : null}

        {entry.comment ? (
          <Text style={styles.timelineComment}>{entry.comment}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(194,73,79,0.08)',
    borderColor: 'rgba(194,73,79,0.25)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: fontSizes.caption,
  },
  retryText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderLeftWidth: 4,
    borderRadius: radius.card,
    padding: spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryItem: {
    gap: spacing.xs,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  incidentTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    marginTop: spacing.base,
    lineHeight: 24,
  },
  incidentDescription: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  metaLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  metaValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(194,73,79,0.08)',
    borderColor: 'rgba(194,73,79,0.25)',
    borderWidth: 1,
    borderRadius: radius.element,
    padding: spacing.sm,
    marginTop: spacing.base,
  },
  rejectedText: {
    flex: 1,
    color: Colors.danger,
    fontSize: fontSizes.caption,
  },
  reopenBox: {
    gap: spacing.sm,
    backgroundColor: 'rgba(194,73,79,0.08)',
    borderColor: 'rgba(194,73,79,0.3)',
    borderWidth: 1,
    borderRadius: radius.element,
    padding: spacing.sm,
    marginTop: spacing.base,
  },
  reopenText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    lineHeight: 17,
  },
  reopenButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  reopenButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  reopenButtonText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(47, 156, 110, 0.09)',
    borderColor: 'rgba(47, 156, 110, 0.35)',
    borderWidth: 1,
    borderRadius: radius.element,
    padding: spacing.sm,
    marginTop: spacing.base,
  },
  completedTextWrap: {
    flex: 1,
  },
  completedTitle: {
    color: Colors.success,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  completedText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    lineHeight: 16,
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: radius.card,
    padding: spacing.base,
  },
  dateTextWrap: {
    flex: 1,
  },
  dateLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  dateValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(47, 156, 110, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(47, 156, 110, 0.3)',
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  deadlineTextWrap: {
    flex: 1,
  },
  deadlineLabel: {
    color: Colors.successDim,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  deadlineValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
  },
  timelineTitle: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  timeline: {
    marginBottom: spacing.base,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  timelineRail: {
    alignItems: 'center',
    width: 12,
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
    marginTop: spacing.sm,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(59,130,184,0.2)',
    marginVertical: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  timelineHeader: {
    gap: spacing.xs,
  },
  timelineStatus: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  timelineDate: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
  },
  timelineChangedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },
  timelineChangedByText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  timelineComment: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
});

export default SeguimientoScreen;