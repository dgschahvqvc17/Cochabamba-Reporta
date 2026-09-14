/**
 * Pantalla: Gestión de usuarios (MVC - View).
 *
 * HU03 — Lista usuarios con diseño de tabla moderna: avatares con
 * anillo de color por rol, dot de estado con glow, búsqueda y filtros
 * en glassmorphic chips, paginación rediseñada.
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
import PrimaryButton from '../components/PrimaryButton';
import { fondo3 } from '../assets/images';
import { loadUsers } from '../controllers/userController';
import type { Role, User } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import { ROLE_LABELS, ROLES } from '../utils/roles';

type UsersScreenProps = {
  onBack: () => void;
  onCreate: () => void;
  onOpenDetail: (userId: number) => void;
};

type ActiveFilter = '' | 'true' | 'false';

const PAGE_SIZE = 10;

const ROLE_TONES: Record<Role, PillTone> = {
  CIUDADANO: 'accent',
  RECEPCION: 'neutral',
  VERIFICADOR: 'warning',
  ENCARGADO_SOLUCION: 'info',
  PERSONAL_SOLUCION: 'success',
  ADMINISTRADOR: 'primary',
};

const ROLE_COLORS: Record<Role, string> = {
  CIUDADANO: Colors.accent,
  RECEPCION: Colors.textSecondary,
  VERIFICADOR: Colors.warning,
  ENCARGADO_SOLUCION: Colors.info,
  PERSONAL_SOLUCION: Colors.success,
  ADMINISTRADOR: Colors.danger,
};

function UsersScreen({ onBack, onCreate, onOpenDetail }: UsersScreenProps) {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, refreshing = false) => {
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setErrorMessage(null);
      const result = await loadUsers({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchInput.trim() || undefined,
        role: roleFilter || undefined,
        active: activeFilter === '' ? undefined : activeFilter === 'true',
      });
      refreshing ? setIsRefreshing(false) : setIsLoading(false);
      if (!result.success) { setErrorMessage(result.message); return; }
      const d = result.data;
      setUsers(d?.users ?? []);
      setTotal(d?.total ?? 0);
      setPage(d?.page ?? targetPage);
      setPages(d?.pages ?? 1);
    },
    [searchInput, roleFilter, activeFilter],
  );

  useEffect(() => { load(1); }, [load]);

  const initialsOf = (u: User) =>
    `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase().slice(0, 2);

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Usuarios y roles"
        subtitle={`${total} usuarios registrados`}
        badge="GESTIÓN"
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
        <PrimaryButton label="+ Nuevo usuario" onPress={onCreate} />

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Nombre, correo o CI..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => load(1)}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={() => load(1)}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
          >
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <FilterLabel label="ROL" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="Todos" selected={roleFilter === ''} onPress={() => setRoleFilter('')} />
          {ROLES.map((role) => (
            <Chip
              key={role}
              label={ROLE_LABELS[role]}
              selected={roleFilter === role}
              color={ROLE_COLORS[role]}
              onPress={() => setRoleFilter(roleFilter === role ? '' : role)}
            />
          ))}
        </ScrollView>

        <FilterLabel label="ESTADO" />
        <View style={styles.chipRow}>
          <Chip label="Todos" selected={activeFilter === ''} onPress={() => setActiveFilter('')} />
          <Chip label="Activos" selected={activeFilter === 'true'} color={Colors.success} onPress={() => setActiveFilter(activeFilter === 'true' ? '' : 'true')} />
          <Chip label="Inactivos" selected={activeFilter === 'false'} color={Colors.danger} onPress={() => setActiveFilter(activeFilter === 'false' ? '' : 'false')} />
        </View>

        {/* Count */}
        {!isLoading && !errorMessage && (
          <Text style={styles.resultCount}>
            {total} usuario{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </Text>
        )}

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
            <Text style={styles.centerText}>Cargando usuarios…</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon name="users" size={36} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Ajusta los filtros o registra un nuevo usuario.</Text>
          </View>
        ) : (
          <>
            {users.map((user) => {
              const roleColor = ROLE_COLORS[user.role];
              return (
                <Pressable
                  key={user.id}
                  onPress={() => onOpenDetail(user.id)}
                  style={({ pressed }) => [
                    styles.userCard,
                    { borderColor: roleColor + '25' },
                    pressed && styles.userCardPressed,
                  ]}
                >
                  {/* Left accent */}
                  <View style={[styles.userAccent, { backgroundColor: roleColor }]} />

                  {/* Avatar */}
                  <View style={[styles.avatarRing, { borderColor: roleColor + '60' }]}>
                    <View style={[styles.avatarInner, { backgroundColor: roleColor + '22' }]}>
                      <Text style={[styles.avatarText, { color: roleColor }]}>{initialsOf(user)}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                    <View style={styles.badgeRow}>
                      <PillBadge label={ROLE_LABELS[user.role]} tone={ROLE_TONES[user.role]} />
                      <PillBadge
                        label={user.active ? 'Activo' : 'Inactivo'}
                        tone={user.active ? 'success' : 'danger'}
                        dot
                      />
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={styles.chevronWrap}>
                    <Icon name="chevronRight" size={18} color={Colors.textSecondary} />
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
                <Icon name="chevronLeft" size={16} color={page <= 1 ? Colors.textSecondary : Colors.accent} />
                <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>Anterior</Text>
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
                <Text style={[styles.pageBtnText, page >= pages && styles.pageBtnTextDisabled]}>Siguiente</Text>
                <Icon name="chevronRight" size={16} color={page >= pages ? Colors.textSecondary : Colors.accent} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FilterLabel({ label }: { label: string }) {
  return (
    <Text style={styles.filterLabel}>{label}</Text>
  );
}

function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const activeColor = color ?? Colors.accent;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { borderColor: activeColor, backgroundColor: activeColor + '18' },
      ]}
    >
      {selected && <View style={[styles.chipDot, { backgroundColor: activeColor }]} />}
      <Text style={[styles.chipText, selected && { color: activeColor, fontWeight: fontWeights.bold }]}>
        {label}
      </Text>
    </Pressable>
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
  searchBtnText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.medium,
  },
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
    flexWrap: 'wrap',
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
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    marginTop: spacing.base,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  userCardPressed: {
    backgroundColor: Colors.surfaceSubtle,
    transform: [{ scale: 0.99 }],
  },
  userAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.card,
    borderBottomLeftRadius: radius.card,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  avatarInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.extraBold,
  },
  userInfo: { flex: 1, marginLeft: spacing.base },
  userName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: Colors.borderLight,
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
    color: Colors.primary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.extraBold,
  },
  pageSep: { color: Colors.textSecondary, fontSize: fontSizes.body },
  pageTotalText: { color: Colors.textSecondary, fontSize: fontSizes.body, fontWeight: fontWeights.medium },
});

export default UsersScreen;
