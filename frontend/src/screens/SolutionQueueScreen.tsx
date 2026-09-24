/**
 * Pantalla: Incidentes asignados para atención (MVC - View).
 *
 * HU13 — Atender y cerrar incidente (Personal de solución).
 * Lista los incidentes que se le asignaron al responsable de solución
 * autenticado (asignación SOLUCION activa) con búsqueda y paginación,
 * para seleccionar uno e iniciar su atención, marcar como atendido o
 * cerrarlo.
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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import { fondo3 } from '../assets/images';
import { loadAssignedSolution } from '../controllers/incidentController';
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

type SolutionQueueScreenProps = {
  onBack: () => void;
  onOpenIncident: (incidentId: number) => void;
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

function SolutionQueueScreen({
  onBack,
  onOpenIncident,
}: SolutionQueueScreenProps) {
  const insets = useSafeAreaInsets();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);

      const result = await loadAssignedSolution({
        page: targetPage,
        limit: PAGE_SIZE,
        search: appliedSearch.trim() || undefined,
      });

      refreshing ? setIsRefreshing(false) : setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      const data = result.data;
      setIncidents(data?.incidents ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? targetPage);
      setPages(data?.pages ?? 1);
    },
    [appliedSearch],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const applySearch = useCallback(() => {
    setAppliedSearch(searchInput);
  }, [searchInput]);

  const hasSearch = appliedSearch.trim().length > 0;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Mis atenciones"
        subtitle={
          isLoading
            ? 'Consultando incidentes…'
            : `${total} incidente${total !== 1 ? 's' : ''} asignado${
                total !== 1 ? 's' : ''
              } para atención`
        }
        badge="ATENCIÓN"
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
            <Text style={styles.emptyTitle}>Sin asignaciones</Text>
            <Text style={styles.emptyText}>
              {hasSearch
                ? 'No se encontraron incidentes asignados con esa búsqueda.'
                : 'No tienes incidentes asignados para atender en este momento.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              Página {page} de {pages} · {total} incidente
              {total !== 1 ? 's' : ''} asignado{total !== 1 ? 's' : ''}
            </Text>

            {incidents.map((incident) => {
              const meta = STATUS_META[incident.status];
              const statusColor = STATUS_COLORS[incident.status];
              const reporterName = incident.reporter
                ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                    .trim()
                : '';

              return (
                <Pressable
                  key={incident.id}
                  onPress={() => onOpenIncident(incident.id)}
                  style={({ pressed }) => [
                    styles.card,
                    { borderLeftColor: statusColor },
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

                  <View style={styles.cardFoot}>
                    <View style={styles.footLink}>
                      <Icon name="eye" size={14} color={Colors.accent} />
                      <Text style={styles.footLinkText}>
                        Atender incidente
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={18} color={Colors.accent} />
                  </View>
                </Pressable>
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
  cardPressed: {
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

export default SolutionQueueScreen;