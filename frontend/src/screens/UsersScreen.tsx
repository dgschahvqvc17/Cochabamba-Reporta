/**
 * Pantalla de gestión de usuarios (MVC - View).
 *
 * HU03 — Lista los usuarios registrados con búsqueda, filtros por rol
 * y estado, y paginación. Desde aquí se consulta el detalle y se crea
 * un nuevo usuario interno. Todas las operaciones requieren rol
 * ADMINISTRADOR (restringido también en el backend).
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

import AdminHeader from '../components/AdminHeader';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import { loadUsers } from '../controllers/userController';
import type { User } from '../models/User';
import type { Role } from '../models/User';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';
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
  VERIFICADOR: 'neutral',
  ENCARGADO_SOLUCION: 'neutral',
  PERSONAL_SOLUCION: 'neutral',
  ADMINISTRADOR: 'primary',
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
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const result = await loadUsers({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchInput.trim() || undefined,
        role: roleFilter || undefined,
        active: activeFilter === '' ? undefined : activeFilter === 'true',
      });

      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      const data = result.data;
      setUsers(data?.users ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? targetPage);
      setPages(data?.pages ?? 1);
    },
    [searchInput, roleFilter, activeFilter],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const applySearch = () => {
    load(1);
  };

  const selectRole = (role?: Role) => {
    setRoleFilter(role ?? '');
  };

  const selectActive = (value: ActiveFilter) => {
    setActiveFilter(value);
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > pages) {
      return;
    }
    load(targetPage);
  };

  const initialsOf = (user: User): string =>
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase().slice(0, 2);

  return (
    <View style={styles.flex}>
      <AdminHeader
        title="Usuarios"
        subtitle={`${total} usuarios registrados`}
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

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Buscar por nombre, correo o CI"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={applySearch}
            returnKeyType="search"
          />
          <Pressable
            onPress={applySearch}
            style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>

        <Text style={styles.filterLabel}>ROL</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <FilterChip label="Todos" selected={roleFilter === ''} onPress={() => selectRole()} />
          {ROLES.map((role) => (
            <FilterChip
              key={role}
              label={ROLE_LABELS[role]}
              selected={roleFilter === role}
              onPress={() => selectRole(roleFilter === role ? undefined : role)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>ESTADO</Text>
        <View style={styles.chipRow}>
          <FilterChip
            label="Todos"
            selected={activeFilter === ''}
            onPress={() => selectActive('')}
          />
          <FilterChip
            label="Activos"
            selected={activeFilter === 'true'}
            onPress={() => selectActive(activeFilter === 'true' ? '' : 'true')}
          />
          <FilterChip
            label="Inactivos"
            selected={activeFilter === 'false'}
            onPress={() => selectActive(activeFilter === 'false' ? '' : 'false')}
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => load(page)} hitSlop={8}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando usuarios…</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centerBox}>
            <Icon name="folder" size={44} color={Colors.border} />
            <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
            <Text style={styles.emptyText}>
              Ajusta los filtros o registra un nuevo usuario interno.
            </Text>
          </View>
        ) : (
          <>
            {users.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => onOpenDetail(user.id)}
                style={({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initialsOf(user)}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={styles.badgeRow}>
                    <PillBadge
                      label={ROLE_LABELS[user.role]}
                      tone={ROLE_TONES[user.role]}
                    />
                    <PillBadge
                      label={user.active ? 'Activo' : 'Inactivo'}
                      tone={user.active ? 'success' : 'danger'}
                    />
                  </View>
                </View>

                <Icon name="chevronRight" size={22} color={Colors.accent} />
              </Pressable>
            ))}

            <View style={styles.pagination}>
              <Pressable
                onPress={() => goToPage(page - 1)}
                disabled={page <= 1}
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
              >
                <View style={styles.pageButtonContent}>
                  <Icon name="chevronLeft" size={14} color={Colors.accent} />
                  <Text style={styles.pageButtonText}>Anterior</Text>
                </View>
              </Pressable>
              <Text style={styles.pageInfo}>
                Página {page} de {pages}
              </Text>
              <Pressable
                onPress={() => goToPage(page + 1)}
                disabled={page >= pages}
                style={[styles.pageButton, page >= pages && styles.pageButtonDisabled]}
              >
                <View style={styles.pageButtonContent}>
                  <Text style={styles.pageButtonText}>Siguiente</Text>
                  <Icon name="chevronRight" size={14} color={Colors.accent} />
                </View>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.element,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: spacing.base,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  searchButton: {
    marginLeft: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    borderRadius: radius.element,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonPressed: {
    backgroundColor: Colors.navy,
  },
  searchButtonText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 1,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  chipTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: fontWeights.bold,
  },
  errorBox: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radius.element,
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.body,
  },
  retryText: {
    color: Colors.accent,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 1.4,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
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
    borderColor: Colors.border,
    padding: spacing.base,
    marginTop: spacing.base,
    shadowColor: '#0B4A6F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  userCardPressed: {
    backgroundColor: Colors.surfaceSubtle,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
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
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  pageButton: {
    minHeight: 44,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.35,
  },
  pageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pageButtonText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  pageInfo: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});

export default UsersScreen;