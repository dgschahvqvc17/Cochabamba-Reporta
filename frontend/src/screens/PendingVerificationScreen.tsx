/**
 * Pantalla: Incidentes pendientes de verificación (MVC - View).
 *
 * HU10 — Asignar incidente para verificación (Encargado de recepción).
 * Lista los incidentes en REPORTADO/RECIBIDO con búsqueda y paginación
 * para que el encargado de recepción seleccione uno y lo asigne a un
 * funcionario de verificación.
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import { fondo3 } from '../assets/images';
import {
  loadInVerification,
  loadPendingVerification,
  rejectIncidentById,
} from '../controllers/incidentController';
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

type PendingVerificationScreenProps = {
  onBack: () => void;
  onOpenIncident: (incidentId: number) => void;
  /** Abre el incidente en verificación en modo reasignación. */
  onReassign?: (incident: Incident) => void;
};

const PAGE_SIZE = 10;

const STATUS_META: Record<IncidentStatus, { label: string; tone: PillTone }> = {
  REPORTADO: { label: 'Reportado', tone: 'accent' },
  RECIBIDO: { label: 'Recibido', tone: 'primary' },
  EN_VERIFICACION: { label: 'En verificación', tone: 'warning' },
  VERIFICADO: { label: 'Verificado', tone: 'info' },
  ASIGNADO_PARA_SOLUCION: { label: 'En asignación', tone: 'info' },
  EN_ATENCION: { label: 'En atención', tone: 'warning' },
  ATENDIDO: { label: 'Atendido', tone: 'success' },
  CERRADO: { label: 'Cerrado', tone: 'neutral' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

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

function PendingVerificationScreen({
  onBack,
  onOpenIncident,
  onReassign,
}: PendingVerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inVerification, setInVerification] = useState<Incident[]>([]);
  const [inVerificationTotal, setInVerificationTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rejecting, setRejecting] = useState<Incident | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const openRejectModal = useCallback((incident: Incident) => {
    setRejecting(incident);
    setRejectReason('');
    setRejectError(null);
  }, []);

  const closeRejectModal = useCallback(() => {
    if (isRejecting) {
      return;
    }
    setRejecting(null);
    setRejectReason('');
    setRejectError(null);
  }, [isRejecting]);

  const load = useCallback(
    async (targetPage: number, refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);

      const search = appliedSearch.trim() || undefined;

      const [pendingResult, inVerificationResult] = await Promise.all([
        loadPendingVerification({
          page: targetPage,
          limit: PAGE_SIZE,
          search,
        }),
        loadInVerification({ limit: 50, search }),
      ]);

      refreshing ? setIsRefreshing(false) : setIsLoading(false);

      if (!pendingResult.success) {
        setErrorMessage(pendingResult.message);
        return;
      }

      const data = pendingResult.data;
      setIncidents(data?.incidents ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? targetPage);
      setPages(data?.pages ?? 1);

      const inVerificationData = inVerificationResult.data;
      setInVerification(inVerificationData?.incidents ?? []);
      setInVerificationTotal(inVerificationData?.total ?? 0);
    },
    [appliedSearch],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const applySearch = useCallback(() => {
    setAppliedSearch(searchInput);
  }, [searchInput]);

  const submitReject = useCallback(async () => {
    if (!rejecting) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setRejectError(
        'Debe indicar el motivo por el que rechaza el reporte.',
      );
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    const result = await rejectIncidentById(rejecting.id, {
      rejectedReason: reason,
    });

    setIsRejecting(false);

    if (!result.success) {
      setRejectError(
        result.fieldErrors?.rejectedReason?.[0] ?? result.message,
      );
      return;
    }

    setRejecting(null);
    setRejectReason('');
    load(page);
  }, [rejecting, rejectReason, page, load]);

  const hasSearch = appliedSearch.trim().length > 0;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Pendientes de verificación"
        subtitle={
          isLoading
            ? 'Consultando incidentes…'
            : `${total} incidente${total !== 1 ? 's' : ''} pendiente${
                total !== 1 ? 's' : ''
              } de verificación`
        }
        badge="ASIGNACIÓN"
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
            onRefresh={() => load(page, true)}
            colors={[Colors.accent]}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Código, título o descripción…"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={applySearch}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={applySearch}
            style={({ pressed }) => [
              styles.searchBtn,
              pressed && styles.searchBtnPressed,
            ]}
          >
            <Icon name="search" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>

        {/* En verificación (reaAsignación del verificador) */}
        {!isLoading ? (
          <View style={styles.inVerificationSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderIcon}>
                <Icon name="refresh" size={15} color={Colors.warningDim} />
              </View>
              <Text style={styles.sectionHeaderTitle}>En verificación</Text>
              <View style={styles.sectionHeaderCount}>
                <Text style={styles.sectionHeaderCountText}>
                  {inVerificationTotal}
                </Text>
              </View>
            </View>

            {inVerification.length === 0 ? (
              <Text style={styles.sectionEmptyText}>
                {hasSearch
                  ? 'No hay incidentes en verificación con esa búsqueda.'
                  : 'No hay incidentes en verificación en este momento.'}
              </Text>
            ) : (
              inVerification.map((incident) => {
                const verifierName = incident.verifier
                  ? `${incident.verifier.firstName} ${incident.verifier.lastName}`.trim()
                  : '';

                return (
                  <View key={incident.id} style={styles.inVerifCard}>
                    <Pressable
                      onPress={() => onReassign?.(incident)}
                      style={({ pressed }) => [
                        styles.inVerifCardBody,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.inVerifTop}>
                        <Text style={styles.code}>{incident.code}</Text>
                        <PillBadge label="En verificación" tone="warning" dot />
                      </View>
                      <Text style={styles.inVerifTitle} numberOfLines={2}>
                        {incident.title}
                      </Text>
                      <View style={styles.verifierRow}>
                        <View style={styles.verifierAvatar}>
                          <Icon name="person" size={13} color={Colors.warningDim} />
                        </View>
                        <Text style={styles.verifierLabel}>Verificando:</Text>
                        <Text style={styles.verifierName} numberOfLines={1}>
                          {verifierName || 'Sin datos'}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.inVerifFoot}>
                      <Pressable
                        onPress={() => onReassign?.(incident)}
                        style={({ pressed }) => [
                          styles.reassignBtn,
                          pressed && styles.cardFootBtnPressed,
                        ]}
                      >
                        <Icon name="refresh" size={14} color={Colors.accent} />
                        <Text style={styles.reassignBtnText}>
                          Reasignar verificador
                        </Text>
                        <Icon name="chevronRight" size={16} color={Colors.accent} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Icon name="warning" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => load(page)} hitSlop={8}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando incidentes…</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon name="checkCircle" size={36} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>Sin pendientes</Text>
            <Text style={styles.emptyText}>
              {hasSearch
                ? 'No se encontraron incidentes pendientes con esa búsqueda.'
                : 'No hay incidentes pendientes de verificación en este momento.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              Página {page} de {pages} · {total} incidente
              {total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''}
            </Text>

            {incidents.map((incident) => {
              const meta = STATUS_META[incident.status];
              const statusColor = STATUS_COLORS[incident.status];
              const reporterName = incident.reporter
                ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                    .trim()
                : '';

              return (
                <View
                  key={incident.id}
                  style={[
                    styles.card,
                    { borderLeftColor: statusColor },
                  ]}
                >
                  <Pressable
                    onPress={() => onOpenIncident(incident.id)}
                    style={({ pressed }) => [
                      styles.cardBody,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.code}>{incident.code}</Text>
                      <PillBadge label={meta.label} tone={meta.tone} />
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {incident.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {incident.description}
                    </Text>

                    {reporterName ? (
                      <View style={styles.reporterRow}>
                        <View style={styles.reporterAvatar}>
                          <Icon name="person" size={14} color={Colors.accent} />
                        </View>
                        <Text style={styles.reporterText} numberOfLines={1}>
                          {reporterName}
                        </Text>
                      </View>
                    ) : null}

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
                      onPress={() => openRejectModal(incident)}
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        pressed && styles.cardFootBtnPressed,
                      ]}
                    >
                      <Icon name="warning" size={14} color={Colors.danger} />
                      <Text style={styles.rejectBtnText}>Rechazar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onOpenIncident(incident.id)}
                      style={({ pressed }) => [
                        styles.footLink,
                        pressed && styles.cardFootBtnPressed,
                      ]}
                    >
                      <Icon name="person" size={14} color={Colors.accent} />
                      <Text style={styles.footLinkText}>
                        Asignar a verificación
                      </Text>
                      <Icon name="chevronRight" size={16} color={Colors.accent} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* Pagination */}
            <View style={styles.pagination}>
              <Pressable
                onPress={() => page > 1 && load(page - 1)}
                disabled={page <= 1}
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              >
                <Icon
                  name="chevronLeft"
                  size={16}
                  color={page <= 1 ? Colors.textSecondary : Colors.accent}
                />
                <Text
                  style={[
                    styles.pageBtnText,
                    page <= 1 && styles.pageBtnTextDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>
              <View style={styles.pageInfo}>
                <Text style={styles.pageText}>{page}</Text>
                <Text style={styles.pageSep}>/</Text>
                <Text style={styles.pageTotalText}>{pages}</Text>
              </View>
              <Pressable
                onPress={() => page < pages && load(page + 1)}
                disabled={page >= pages}
                style={[styles.pageBtn, page >= pages && styles.pageBtnDisabled]}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    page >= pages && styles.pageBtnTextDisabled,
                  ]}
                >
                  Siguiente
                </Text>
                <Icon
                  name="chevronRight"
                  size={16}
                  color={page >= pages ? Colors.textSecondary : Colors.accent}
                />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Rechazo de un reporte no válido */}
      <Modal
        visible={rejecting !== null}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeRejectModal}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Icon name="warning" size={20} color={Colors.danger} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Rechazar reporte</Text>
                <Text style={styles.modalSubtitle}>
                  {rejecting ? `${rejecting.code} dejará de estar en recepción.` : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.modalHint}>
              Al rechazar, el ciudadano recibirá una notificación con el
              motivo para que pueda corregirlo si así lo desea.
            </Text>

            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={(value) => {
                setRejectReason(value);
                setRejectError(null);
              }}
              placeholder="Indica el motivo del rechazo…"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!isRejecting}
            />

            {rejectError ? (
              <View style={styles.rejectErrorBox}>
                <Icon name="warning" size={14} color={Colors.danger} />
                <Text style={styles.rejectErrorText}>{rejectError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeRejectModal}
                disabled={isRejecting}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnSecondary,
                  pressed && styles.modalBtnPressed,
                ]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={submitReject}
                disabled={isRejecting || !rejectReason.trim()}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnDanger,
                  (isRejecting || !rejectReason.trim()) &&
                    styles.modalBtnDisabled,
                  pressed && styles.modalBtnPressed,
                ]}
              >
                {isRejecting ? (
                  <ActivityIndicator color={Colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.modalBtnDangerText}>
                    Confirmar rechazo
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    minHeight: 52,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
    // @ts-ignore — web sólo (evita outline por defecto)
    outlineWidth: 0,
  },
  searchBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    borderRadius: radius.element,
    backgroundColor: Colors.primary,
  },
  searchBtnPressed: { opacity: 0.82 },
  searchBtnText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
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
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderLeftWidth: 4,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  cardBody: {},
  cardPressed: {
    opacity: 0.85,
  },
  cardFootBtnPressed: {
    opacity: 0.75,
  },
  inVerificationSection: {
    marginTop: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,214,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.extraBold,
    letterSpacing: letterSpacings.wide,
  },
  sectionHeaderCount: {
    minWidth: 26,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.warningDim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderCountText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
  },
  sectionEmptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  inVerifCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.35)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  inVerifCardBody: {},
  inVerifTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inVerifTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  verifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  verifierAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,214,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifierLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  verifierName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  inVerifFoot: {
    marginTop: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reassignBtnText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(194,73,79,0.45)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rejectBtnText: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
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
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 4,
    lineHeight: 17,
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  reporterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reporterText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  footLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footLinkText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 12, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    // @ts-ignore — web only
    boxShadow: '0 -24px 60px -24px rgba(2, 10, 18, 0.65)',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(87, 103, 122, 0.45)',
    marginBottom: spacing.sm,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.element,
    backgroundColor: 'rgba(194, 73, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  modalHint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  rejectInput: {
    minHeight: 110,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    padding: spacing.base,
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    textAlignVertical: 'top',
    // @ts-ignore — web sólo (evita outline por defecto)
    outlineWidth: 0,
    marginBottom: spacing.sm,
  },
  rejectErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rejectErrorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: fontSizes.caption,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  modalBtnSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
  },
  modalBtnDanger: {
    backgroundColor: Colors.dangerDim,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalBtnPressed: {
    opacity: 0.8,
  },
  modalBtnSecondaryText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  modalBtnDangerText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent + '50',
    gap: spacing.xs,
  },
  pageBtnDisabled: {
    borderColor: Colors.borderSoft,
    opacity: 0.5,
  },
  pageBtnText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  pageBtnTextDisabled: { color: Colors.textSecondary },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.extraBold,
  },
  pageSep: { color: Colors.textSecondary, fontSize: fontSizes.body },
  pageTotalText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
});

export default PendingVerificationScreen;