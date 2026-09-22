/**
 * Pantalla: Incidentes — consulta y gestión (MVC - View).
 *
 * HU09 — Consultar y gestionar incidentes (Encargado de recepción).
 * Lista todos los incidentes con búsqueda por código/título/descripción,
 * filtros por estado, categoría y fecha (desde/hasta), paginación y
 * acceso al detalle completo (ciudadano, ubicación y evidencia).
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
import { loadCategories } from '../controllers/categoryController';
import { loadManagedIncidents } from '../controllers/incidentController';
import type { Category } from '../models/Category';
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

type IncidentsScreenProps = {
  onBack: () => void;
  onOpenDetail: (incidentId: number) => void;
};

const PAGE_SIZE = 10;

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

const pad = (value: number) => String(value).padStart(2, '0');

const toDateStr = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const validateDates = (fromValue: string, toValue: string): string | null => {
  if (fromValue && !DATE_RE.test(fromValue)) {
    return 'La fecha "desde" debe tener el formato AAAA-MM-DD.';
  }
  if (toValue && !DATE_RE.test(toValue)) {
    return 'La fecha "hasta" debe tener el formato AAAA-MM-DD.';
  }
  if (fromValue && toValue && fromValue > toValue) {
    return 'La fecha "desde" no puede ser posterior a "hasta".';
  }
  return null;
};

const QUICK_RANGES = (): { label: string; from: string; to: string }[] => {
  const today = toDateStr(new Date());
  return [
    { label: 'Hoy', from: today, to: today },
    { label: 'Últ. 7 días', from: toDateStr(addDays(new Date(), -7)), to: today },
    { label: 'Últ. 30 días', from: toDateStr(addDays(new Date(), -30)), to: today },
    { label: 'Todo', from: '', to: '' },
  ];
};

function IncidentsScreen({ onBack, onOpenDetail }: IncidentsScreenProps) {
  const insets = useSafeAreaInsets();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | IncidentStatus>('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);

      const result = await loadManagedIncidents({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchInput.trim() || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter ?? undefined,
        from: appliedFrom || undefined,
        to: appliedTo || undefined,
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
    [searchInput, statusFilter, categoryFilter, appliedFrom, appliedTo],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await loadCategories({});
      if (mounted && result.success) {
        setCategories(result.data?.categories ?? []);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const applyDates = useCallback(() => {
    const error = validateDates(fromInput, toInput);
    setDateError(error);
    if (error) {
      return;
    }
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
  }, [fromInput, toInput]);

  const applyQuickRange = useCallback((from: string, to: string) => {
    setDateError(null);
    setFromInput(from);
    setToInput(to);
    setAppliedFrom(from);
    setAppliedTo(to);
  }, []);

  const hasFilters =
    Boolean(searchInput.trim()) ||
    statusFilter !== '' ||
    categoryFilter !== null ||
    Boolean(appliedFrom) ||
    Boolean(appliedTo);

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Incidentes"
        subtitle={
          isLoading
            ? 'Consultando incidentes…'
            : `${total} incidente${total !== 1 ? 's' : ''} encontrado${
                total !== 1 ? 's' : ''
              }`
        }
        badge="CONSULTA"
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
              onSubmitEditing={() => load(1)}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={() => load(1)}
            style={({ pressed }) => [
              styles.searchBtn,
              pressed && styles.searchBtnPressed,
            ]}
          >
            <Icon name="search" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>

        {/* Estado */}
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
                onPress={() =>
                  setStatusFilter(option.value)
                }
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

        {/* Categoría */}
        <Text style={styles.filterLabel}>CATEGORÍA</Text>
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              key="all"
              onPress={() => setCategoryFilter(null)}
              style={({ pressed }) => [
                styles.chip,
                categoryFilter === null && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  categoryFilter === null && styles.chipTextSelected,
                ]}
              >
                Todas
              </Text>
            </Pressable>
            {categories.map((category) => {
              const selected = categoryFilter === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryFilter(selected ? null : category.id)}
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
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Fecha */}
        <Text style={styles.filterLabel}>FECHA</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {QUICK_RANGES().map((range) => {
            const selected =
              appliedFrom === range.from && appliedTo === range.to;
            return (
              <Pressable
                key={range.label}
                onPress={() => applyQuickRange(range.from, range.to)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                {selected && <Icon name="check" size={12} color={Colors.accent} />}
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.dateRow}>
          <View style={styles.dateInputWrap}>
            <Icon name="calendar" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={fromInput}
              onChangeText={(value) => {
                setFromInput(value);
                setDateError(null);
              }}
              placeholder="Desde (AAAA-MM-DD)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={applyDates}
              returnKeyType="done"
            />
          </View>
          <View style={styles.dateInputWrap}>
            <Icon name="calendar" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={toInput}
              onChangeText={(value) => {
                setToInput(value);
                setDateError(null);
              }}
              placeholder="Hasta (AAAA-MM-DD)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={applyDates}
              returnKeyType="done"
            />
          </View>
        </View>
        <View style={styles.dateActionsRow}>
          <Pressable
            onPress={applyDates}
            style={({ pressed }) => [
              styles.applyBtn,
              pressed && styles.applyBtnPressed,
            ]}
          >
            <Icon name="filter" size={14} color={Colors.accent} />
            <Text style={styles.applyBtnText}>Aplicar fechas</Text>
          </Pressable>
          {(appliedFrom || appliedTo) && (
            <Pressable
              onPress={() => applyQuickRange('', '')}
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && styles.applyBtnPressed,
              ]}
            >
              <Icon name="refresh" size={14} color={Colors.textSecondary} />
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </Pressable>
          )}
        </View>
        {dateError ? (
          <View style={styles.dateErrorRow}>
            <Icon name="warning" size={14} color={Colors.danger} />
            <Text style={styles.dateErrorText}>{dateError}</Text>
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
              <Icon name="report" size={36} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              {hasFilters
                ? 'Ajusta la búsqueda o los filtros para encontrar incidentes.'
                : 'Aún no hay incidentes registrados en el sistema.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              Página {page} de {pages} · {total} incidente
              {total !== 1 ? 's' : ''}
            </Text>

            {incidents.map((incident) => {
              const meta = statusMeta(incident.status);
              const statusColor = STATUS_COLORS[incident.status];
              const reporterName = incident.reporter
                ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                    .trim()
                : '';

              return (
                <Pressable
                  key={incident.id}
                  onPress={() => onOpenDetail(incident.id)}
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
                      <Icon
                        name="eye"
                        size={14}
                        color={Colors.accent}
                      />
                      <Text style={styles.footLinkText}>Ver detalle</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
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
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dateInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    minHeight: 50,
    gap: spacing.sm,
  },
  dateActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.4)',
    backgroundColor: 'rgba(59,130,184,0.12)',
  },
  applyBtnPressed: { opacity: 0.8 },
  applyBtnText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  clearBtnText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
  dateErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(194,73,79,0.08)',
    borderColor: 'rgba(194,73,79,0.25)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
  },
  dateErrorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: fontSizes.caption,
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
    backgroundColor: Colors.accentSoft,
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
    borderColor: Colors.borderSoft,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.base,
    // @ts-ignore
    boxShadow: '0 14px 30px -20px rgba(18, 38, 58, 0.35)',
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
    color: Colors.textSecondary,
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

export default IncidentsScreen;