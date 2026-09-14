/**
 * Pantalla: Gestión de categorías (MVC - View).
 *
 * HU04 — Cards de categorías con color-coding, iconos neon,
 * filtros glassmorphic y acciones con press feedback.
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import AppDialog from '../components/AppDialog';
import Icon from '../components/Icon';
import PillBadge from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import { fondo4 } from '../assets/images';
import { loadCategories, setCategoryActive } from '../controllers/categoryController';
import { useDialog } from '../hooks/useDialog';
import type { Category } from '../models/Category';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';

type CategoriesScreenProps = {
  onBack: () => void;
  onCreate: () => void;
  onOpenEdit: (categoryId: number) => void;
};

type ActiveFilter = '' | 'true' | 'false';

// Each category gets a cycling accent color for visual variety
const CATEGORY_COLORS = [
  Colors.accent,
  Colors.success,
  Colors.warning,
  Colors.info,
  Colors.danger,
  '#F472B6',
];

function CategoriesScreen({ onBack, onCreate, onOpenEdit }: CategoriesScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, error, success, close } = useDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (search = appliedSearch, refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);
      const result = await loadCategories({ search: search.trim() || undefined });
      refreshing ? setIsRefreshing(false) : setIsLoading(false);
      if (!result.success) { setErrorMessage(result.message); return; }
      setCategories(result.data?.categories ?? []);
    },
    [appliedSearch],
  );

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (activeFilter === '') return categories;
    return categories.filter((c) => c.active === (activeFilter === 'true'));
  }, [categories, activeFilter]);

  const applySearch = () => { setAppliedSearch(searchInput); load(searchInput); };

  const handleToggleActive = (cat: Category) => {
    const target = !cat.active;
    confirm({
      title: target ? 'Activar categoría' : 'Desactivar categoría',
      message: target
        ? `¿Activar "${cat.name}"? Volverá a estar disponible para reportes.`
        : `¿Desactivar "${cat.name}"? Ya no estará disponible para nuevos reportes.`,
      confirmLabel: target ? 'Activar' : 'Desactivar',
      cancelLabel: 'Cancelar',
      tone: target ? 'success' : 'warning',
      onConfirm: () => doToggle(cat, target),
    });
  };

  const doToggle = async (cat: Category, active: boolean) => {
    setIsUpdatingId(cat.id);
    close();
    const result = await setCategoryActive(cat.id, active);
    setIsUpdatingId(null);
    if (!result.success) { error({ title: 'Error', message: result.message }); return; }
    setCategories((prev) => prev.map((c) => c.id === cat.id ? (result.data ?? c) : c));
    success({ title: active ? 'Categoría activada' : 'Categoría desactivada', message: result.message });
  };

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo4}
        title="Categorías de incidentes"
        subtitle={`${categories.length} categorías registradas`}
        badge="CONFIGURACIÓN"
        onBack={onBack}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(appliedSearch, true)}
            colors={[Colors.accent]}
            tintColor={Colors.accent}
          />
        }
      >
        <PrimaryButton label="+ Nueva categoría" onPress={onCreate} />

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Buscar categoría..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={applySearch}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={applySearch}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
          >
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>

        {/* Filter chips */}
        <Text style={styles.filterLabel}>ESTADO</Text>
        <View style={styles.chipRow}>
          {(['', 'true', 'false'] as ActiveFilter[]).map((v) => {
            const label = v === '' ? 'Todas' : v === 'true' ? 'Activas' : 'Inactivas';
            const color = v === 'true' ? Colors.success : v === 'false' ? Colors.danger : Colors.accent;
            const sel = activeFilter === v;
            return (
              <Pressable
                key={v}
                onPress={() => setActiveFilter(v)}
                style={[styles.chip, sel && { borderColor: color, backgroundColor: color + '16' }]}
              >
                {sel && <View style={[styles.chipDot, { backgroundColor: color }]} />}
                <Text style={[styles.chipText, sel && { color, fontWeight: fontWeights.bold }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

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
            <Text style={styles.centerText}>Cargando categorías…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon name="category" size={32} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Sin categorías</Text>
            <Text style={styles.emptyText}>Ajusta los filtros o crea una nueva categoría.</Text>
          </View>
        ) : (
          filtered.map((cat, i) => {
            const accent = cat.active
              ? CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              : Colors.textSecondary;
            const updating = isUpdatingId === cat.id;
            return (
              <View
                key={cat.id}
                style={[styles.catCard, { borderColor: accent + '30' }]}
              >
                {/* Left accent bar */}
                <View style={[styles.catAccent, { backgroundColor: accent }]} />

                {/* Header row */}
                <View style={styles.catHeader}>
                  <View style={[styles.catIcon, { backgroundColor: accent + '16', borderColor: accent + '35' }]}>
                    <Icon name="category" size={20} color={accent} />
                  </View>
                  <View style={styles.catText}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    <Text
                      style={[styles.catDesc, !cat.description && styles.catDescEmpty]}
                      numberOfLines={2}
                    >
                      {cat.description || 'Sin descripción'}
                    </Text>
                  </View>
                  <PillBadge
                    label={cat.active ? 'Activa' : 'Inactiva'}
                    tone={cat.active ? 'success' : 'neutral'}
                    dot
                  />
                </View>

                {/* Actions */}
                <View style={styles.catActions}>
                  <Pressable
                    onPress={() => onOpenEdit(cat.id)}
                    style={({ pressed }) => [styles.actionBtn, styles.actionEdit, pressed && styles.actionBtnPressed]}
                  >
                    <Icon name="edit" size={15} color={Colors.accent} />
                    <Text style={[styles.actionText, { color: Colors.accent }]}>Editar</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleToggleActive(cat)}
                    disabled={updating}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      cat.active ? styles.actionDeactivate : styles.actionActivate,
                      pressed && styles.actionBtnPressed,
                      updating && styles.actionDisabled,
                    ]}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color={cat.active ? Colors.danger : Colors.success} />
                    ) : (
                      <Icon name="power" size={15} color={cat.active ? Colors.danger : Colors.success} />
                    )}
                    <Text style={[styles.actionText, { color: cat.active ? Colors.danger : Colors.success }]}>
                      {cat.active ? 'Desactivar' : 'Activar'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    minHeight: 52,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
    // @ts-ignore
    outlineWidth: 0,
  },
  searchBtn: {
    minHeight: 52,
    paddingHorizontal: spacing.base,
    borderRadius: radius.element,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnPressed: { opacity: 0.82 },
  searchBtnText: { color: Colors.textOnPrimary, fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    gap: 5,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { color: Colors.textPrimary, fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.danger + '50',
    borderRadius: radius.element,
    padding: spacing.base,
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  errorText: { color: Colors.dangerDim, fontSize: fontSizes.body, flex: 1 },
  retryText: { color: Colors.accent, fontWeight: fontWeights.bold, fontSize: fontSizes.caption },
  centerBox: { alignItems: 'center', paddingVertical: 60 },
  centerText: { color: Colors.textSecondary, fontSize: fontSizes.body, marginTop: spacing.sm },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: fontSizes.h3, fontWeight: fontWeights.bold, marginTop: spacing.base },
  emptyText: { color: Colors.textSecondary, fontSize: fontSizes.body, marginTop: spacing.xs, textAlign: 'center' },
  catCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  catAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  catIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.element,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: { flex: 1, marginHorizontal: spacing.sm },
  catName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  catDesc: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 2,
    lineHeight: 16,
  },
  catDescEmpty: { fontStyle: 'italic' },
  catActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 42,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  actionEdit: {
    borderColor: Colors.accent + '60',
    backgroundColor: Colors.accentSoft,
  },
  actionDeactivate: {
    borderColor: Colors.danger + '60',
    backgroundColor: Colors.dangerSoft,
  },
  actionActivate: {
    borderColor: Colors.success + '60',
    backgroundColor: Colors.successSoft,
  },
  actionBtnPressed: { transform: [{ scale: 0.97 }] },
  actionDisabled: { opacity: 0.5 },
  actionText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
});

export default CategoriesScreen;
