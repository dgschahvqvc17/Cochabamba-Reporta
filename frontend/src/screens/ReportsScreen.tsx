/**
 * Pantalla: Mis reportes (MVC - View).
 *
 * Lista los incidentes registrados por el ciudadano autenticado (GET
 * /api/v1/incidents), con filtro por estado, actualización por pull-to-
 * refresh, detalle expandible vía diálogo (evidencia + ubicación) y
 * acciones de editar/eliminar para reportes en estado REPORTADO
 * (edición limitada a una sola vez).
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
import PrimaryButton from '../components/PrimaryButton';
import { fondo3 } from '../assets/images';
import {
  deleteIncidentById,
  loadIncidentById,
  loadMyIncidents,
} from '../controllers/incidentController';
import { useDialog } from '../hooks/useDialog';
import type { Incident, IncidentStatus } from '../models/Incident';
import {
  Colors,
  fontSizes,
  fontWeights,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { formatDateTime } from '../utils/format';
import { formatCoordinates } from '../utils/location';

type ReportsScreenProps = {
  onBack: () => void;
  onNewReport: () => void;
  onEdit: (incidentId: number) => void;
};

const STATUS_OPTIONS: {
  value: '' | IncidentStatus;
  label: string;
  tone: PillTone;
}[] = [
  { value: '', label: 'Todos', tone: 'neutral' },
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

function ReportsScreen({ onBack, onNewReport, onEdit }: ReportsScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    dialog,
    confirm,
    info,
    success,
    error: showError,
    close,
  } = useDialog();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | IncidentStatus>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);

      const result = await loadMyIncidents(statusFilter || undefined);

      refreshing ? setIsRefreshing(false) : setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setIncidents(result.data ?? []);
    },
    [statusFilter],
  );

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (incident: Incident) => {
    setDetailLoadingId(incident.id);

    const result = await loadIncidentById(incident.id);

    setDetailLoadingId(null);

    if (!result.success || !result.data) {
      showError({
        title: 'No se pudo consultar el reporte',
        message: result.message,
      });
      return;
    }

    const detail = result.data;
    const location = detail.location
      ? detail.location.address && detail.location.address.trim()
        ? `${detail.location.address} — ${formatCoordinates(
            detail.location.latitude,
            detail.location.longitude,
          )}`
        : formatCoordinates(detail.location.latitude, detail.location.longitude)
      : 'Sin ubicación registrada.';

    const evidenceCount = detail.evidence?.length ?? 0;

    info({
      title: `${detail.code} · ${statusMeta(detail.status).label}`,
      tone: 'info',
      message: [
        detail.description,
        `Categoría: ${detail.category?.name ?? 'Sin categoría'}`,
        `Ubicación: ${location}`,
        `Evidencias: ${
          evidenceCount > 0
            ? `${evidenceCount} foto${evidenceCount !== 1 ? 's' : ''}`
            : 'Sin evidencias'
        }`,
        `Registrado: ${formatDateTime(detail.createdAt)}`,
      ].join('\n\n'),
    });
  };

  const confirmDelete = (incident: Incident) => {
    confirm({
      title: 'Eliminar reporte',
      message: `Se eliminará definitivamente el reporte ${incident.code}, junto con su evidencia y ubicación. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: () => performDelete(incident.id),
    });
  };

  const performDelete = async (id: number) => {
    if (deletingId) return;

    setDeletingId(id);

    const result = await deleteIncidentById(id);

    setDeletingId(null);

    if (!result.success) {
      showError({
        title: 'No se pudo eliminar el reporte',
        message: result.message,
      });
      return;
    }

    setIncidents((current) => current.filter((item) => item.id !== id));

    success({
      title: 'Reporte eliminado',
      message:
        'El reporte se eliminó correctamente y ya no aparecerá en tus reportes.',
    });
  };

  const totalCount = incidents.length;
  const editableCount = incidents.filter((i) => i.canEdit).length;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Mis reportes"
        subtitle={
          isLoading
            ? 'Consultando tus reportes…'
            : `${totalCount} reporte${totalCount !== 1 ? 's' : ''} registrado${
                totalCount !== 1 ? 's' : ''
              }`
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
        <PrimaryButton label="+ Nuevo reporte" onPress={onNewReport} />

        {editableCount > 0 ? (
          <View style={styles.editableBanner}>
            <Icon name="edit" size={18} color={Colors.accent} />
            <Text style={styles.editableBannerText}>
              Tienes <Text style={styles.editableBannerStrong}>{editableCount}</Text>{' '}
              reporte{editableCount !== 1 ? 's' : ''} en estado REPORTADO que
              puedes editar (una sola vez) o eliminar.
            </Text>
          </View>
        ) : null}

        {/* Filtro de estado */}
        <Text style={styles.filterLabel}>ESTADO</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = statusFilter === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setStatusFilter(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Icon name="warning" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => load()} hitSlop={8}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando reportes…</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon name="report" size={36} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>
              {statusFilter ? 'Sin reportes en este estado' : 'Aún no tienes reportes'}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter
                ? 'Prueba con otro estado o registra un nuevo reporte.'
                : 'Registra tu primer incidente para seguir su atención aquí.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {incidents.map((incident) => {
              const meta = statusMeta(incident.status);
              const statusColor = STATUS_COLORS[incident.status];
              const canEdit = Boolean(incident.canEdit);
              const canDelete = Boolean(incident.canDelete);
              const isDeleting = deletingId === incident.id;

              return (
                <View
                  key={incident.id}
                  style={[styles.card, { borderLeftColor: statusColor }]}
                >
                  <Pressable
                    onPress={() => openDetail(incident)}
                    style={({ pressed }) => [
                      styles.cardMain,
                      pressed && styles.cardMainPressed,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.code}>{incident.code}</Text>
                      <PillBadge label={meta.label} tone={meta.tone} />
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {incident.title}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Icon
                          name="category"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {incident.category?.name ?? 'Sin categoría'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Icon
                          name="clock"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          {formatDateTime(incident.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <View style={styles.cardFoot}>
                    <Pressable
                      onPress={() => openDetail(incident)}
                      style={({ pressed }) => [
                        styles.footLink,
                        pressed && styles.footLinkPressed,
                      ]}
                    >
                      {detailLoadingId === incident.id ? (
                        <ActivityIndicator color={Colors.accent} size="small" />
                      ) : (
                        <>
                          <Text style={styles.footLinkText}>Ver seguimiento</Text>
                          <Icon
                            name="chevronRight"
                            size={18}
                            color={Colors.accent}
                          />
                        </>
                      )}
                    </Pressable>

                    {canEdit || canDelete ? (
                      <View style={styles.cardActions}>
                        {canEdit ? (
                          <Pressable
                            onPress={() => onEdit(incident.id)}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              { borderColor: 'rgba(59, 130, 184, 0.4)' },
                              pressed && styles.actionPressed,
                            ]}
                            hitSlop={6}
                          >
                            <Icon name="edit" size={15} color={Colors.accent} />
                            <Text style={[styles.actionText, styles.actionEditText]}>
                              Editar
                            </Text>
                          </Pressable>
                        ) : null}
                        {canDelete ? (
                          <Pressable
                            onPress={() => confirmDelete(incident)}
                            disabled={isDeleting}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              { borderColor: 'rgba(194, 73, 79, 0.4)' },
                              pressed && styles.actionPressed,
                            ]}
                            hitSlop={6}
                          >
                            {isDeleting ? (
                              <ActivityIndicator
                                color={Colors.danger}
                                size="small"
                              />
                            ) : (
                              <Icon name="trash" size={15} color={Colors.danger} />
                            )}
                            <Text style={[styles.actionText, styles.actionDeleteText]}>
                              Eliminar
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : incident.status === 'REPORTADO' ? (
                      <View style={styles.editedTag}>
                        <Icon name="check" size={13} color={Colors.success} />
                        <Text style={styles.editedTagText}>Editado</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
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
  editableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(59, 130, 184, 0.07)',
    borderColor: 'rgba(59, 130, 184, 0.22)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.base,
  },
  editableBannerText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  editableBannerStrong: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceSubtle,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(59,130,184,0.12)',
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
  chipTextSelected: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  list: {
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderLeftWidth: 4,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  cardMain: {
    padding: spacing.base,
    paddingBottom: 0,
  },
  cardMainPressed: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  code: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  footLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footLinkPressed: {
    opacity: 0.7,
  },
  footLinkText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  actionEditText: {
    color: Colors.accent,
  },
  actionDeleteText: {
    color: Colors.danger,
  },
  editedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(47,156,110,0.10)',
    borderColor: 'rgba(47,156,110,0.3)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  editedTagText: {
    color: Colors.success,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
});

export default ReportsScreen;