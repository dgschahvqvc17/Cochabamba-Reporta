/**
 * Pantalla de detalle de usuario (MVC - View).
 *
 * HU03 — Consulta el detalle de un usuario, activa/desactiva su
 * cuenta, asigna roles y muestra el historial de cambios registrados.
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminHeader from '../components/AdminHeader';
import AppDialog from '../components/AppDialog';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import {
  assignUserRole,
  loadRoles,
  loadUserDetail,
  setUserActive,
} from '../controllers/userController';
import { useDialog } from '../hooks/useDialog';
import type { Role, RoleOption, User, UserAuditEntry } from '../models/User';
import { Colors, fontSizes, fontWeights, layout, radius, spacing } from '../theme';
import { formatDate, formatDateTime } from '../utils/format';
import { ROLE_LABELS, ROLES } from '../utils/roles';
import { getSessionUser } from '../utils/session';

type UserDetailScreenProps = {
  userId: number;
  onBack: () => void;
  onEdit: (userId: number) => void;
};

const ROLE_TONES: Record<Role, PillTone> = {
  CIUDADANO: 'accent',
  RECEPCION: 'neutral',
  VERIFICADOR: 'neutral',
  ENCARGADO_SOLUCION: 'neutral',
  PERSONAL_SOLUCION: 'neutral',
  ADMINISTRADOR: 'primary',
};

const AUDIT_ROLE_TONES: Record<UserAuditEntry['action'], PillTone> = {
  create: 'success',
  update: 'accent',
  activate: 'success',
  deactivate: 'danger',
  role_change: 'primary',
};

const ACTION_LABELS: Record<UserAuditEntry['action'], string> = {
  create: 'Registro',
  update: 'Edición',
  activate: 'Activación',
  deactivate: 'Desactivación',
  role_change: 'Cambio de rol',
};

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombres',
  lastName: 'Apellidos',
  phone: 'Teléfono',
  identityNumber: 'Documento de identidad',
  birthDate: 'Fecha de nacimiento',
  address: 'Dirección',
  role: 'Rol',
  active: 'Estado',
};

function UserDetailScreen({ userId, onBack, onEdit }: UserDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, info, close } = useDialog();
  const [user, setUser] = useState<User | null>(null);
  const [audit, setAudit] = useState<UserAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const currentUserId = getSessionUser()?.id;
  const isSelf = user ? Number(user.id) === Number(currentUserId) : false;

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const result = await loadUserDetail(userId);

    if (!result.success) {
      setLoadError(result.message);
      setIsLoading(false);
      return;
    }

    setUser(result.data?.user ?? null);
    setAudit(result.data?.audit ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await loadRoles();
      if (active && result.success && result.data) {
        setRoles(result.data);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading || !user) {
    return (
      <View style={styles.flex}>
        <AdminHeader title="Detalle del usuario" onBack={onBack} />
        {loadError ? (
          <View style={[styles.centerBox, styles.errorBox]}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando usuario…</Text>
          </View>
        )}
      </View>
    );
  }

  const handleToggleActive = async () => {
    if (!user) {
      return;
    }

    const targetState = !user.active;

    if (targetState === false) {
      confirm({
        title: 'Desactivar usuario',
        message: `¿Estás seguro de que deseas desactivar a ${user.firstName} ${user.lastName}? No podrá iniciar sesión.`,
        confirmLabel: 'Desactivar',
        cancelLabel: 'Cancelar',
        tone: 'danger',
        onConfirm: () => {
          confirmToggleActive(false);
        },
      });
      return;
    }

    confirm({
      title: 'Activar usuario',
      message: `¿Deseas activar a ${user.firstName} ${user.lastName}?`,
      confirmLabel: 'Activar',
      cancelLabel: 'Cancelar',
      tone: 'success',
      onConfirm: () => {
        confirmToggleActive(true);
      },
    });
  };

  const confirmToggleActive = async (active: boolean) => {
    if (!user) {
      return;
    }

    setIsUpdating(true);
    close();
    const result = await setUserActive(user.id, active);
    setIsUpdating(false);

    if (!result.success) {
      info({ title: 'Operación no realizada', message: result.message });
      return;
    }

    setUser(result.data ?? null);
    info({ title: 'Operación exitosa', message: result.message });
  };

  const roleOptions: RoleOption[] =
    roles.length > 0
      ? [...roles].sort((a, b) => (a.name < b.name ? -1 : 1))
      : ROLES.map((role, index) => ({ id: index + 1, name: role, description: null, active: true }));

  const confirmRoleChange = async (role: Role) => {
    if (!user) {
      return;
    }

    setIsUpdating(true);
    close();
    const result = await assignUserRole(user.id, role);
    setIsUpdating(false);

    if (!result.success) {
      info({ title: 'No se pudo asignar el rol', message: result.message });
      return;
    }

    setUser(result.data ?? null);
    setIsRoleModalOpen(false);
    info({ title: 'Rol asignado', message: result.message });
  };

  const proposeRole = (role: Role) => {
    setIsRoleModalOpen(false);
    if (!user) {
      return;
    }

    confirm({
      title: 'Asignar rol',
      message: `¿Asignar el rol "${ROLE_LABELS[role]}" a ${user.firstName} ${user.lastName}?`,
      confirmLabel: 'Asignar',
      cancelLabel: 'Cancelar',
      tone: 'accent',
      onConfirm: () => {
        confirmRoleChange(role);
      },
    });
  };

  return (
    <View style={styles.flex}>
      <AdminHeader title="Detalle del usuario" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.badgeRow}>
            <PillBadge label={ROLE_LABELS[user.role]} tone={ROLE_TONES[user.role]} />
            <PillBadge
              label={user.active ? 'Activo' : 'Inactivo'}
              tone={user.active ? 'success' : 'danger'}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>INFORMACIÓN</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Documento de identidad" value={user.identityNumber || '—'} />
          <InfoRow label="Teléfono" value={user.phone || '—'} />
          <InfoRow label="Fecha de nacimiento" value={user.birthDate ? formatDate(user.birthDate) : '—'} />
          <InfoRow label="Dirección" value={user.address || '—'} />
        </View>

        <Text style={styles.sectionLabel}>ACCIONES</Text>
        <View style={styles.actionsCard}>
          <Pressable
            onPress={() => onEdit(user.id)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <View style={styles.actionContent}>
              <Icon name="edit" size={18} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>Editar datos</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleToggleActive}
            disabled={isUpdating || isSelf}
            style={({ pressed }) => [
              styles.actionButton,
              user.active ? styles.actionDanger : styles.actionSuccess,
              pressed && styles.actionButtonPressed,
              (isUpdating || isSelf) && styles.actionButtonDisabled,
            ]}
          >
            <View style={styles.actionContent}>
              <Icon
                name="power"
                size={18}
                color={user.active ? Colors.danger : '#2E7D46'}
              />
              <Text
                style={[styles.actionButtonText, user.active ? styles.actionDangerText : styles.actionSuccessText]}
              >
                {user.active ? 'Desactivar cuenta' : 'Activar cuenta'}
              </Text>
            </View>
          </Pressable>
          {isSelf ? (
            <Text style={styles.actionHint}>No puedes desactivar tu propia cuenta.</Text>
          ) : null}

          <Pressable
            onPress={() => setIsRoleModalOpen(true)}
            disabled={isUpdating || isSelf}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              (isUpdating || isSelf) && styles.actionButtonDisabled,
            ]}
          >
            <View style={styles.actionContent}>
              <Icon name="badge" size={18} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>Cambiar rol</Text>
            </View>
          </Pressable>
          {isSelf ? (
            <Text style={styles.actionHint}>No puedes cambiar tu propio rol de administrador.</Text>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>HISTORIAL DE CAMBIOS</Text>
        {audit.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aún no se registraron cambios sobre este usuario.</Text>
          </View>
        ) : (
          audit.map((entry) => <AuditRow key={entry.id} entry={entry} />)
        )}
      </ScrollView>

      <RolePickerModal
        visible={isRoleModalOpen}
        currentRole={user.role}
        roles={roleOptions}
        onSelect={proposeRole}
        onClose={() => setIsRoleModalOpen(false)}
      />
      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

type AuditRowProps = {
  entry: UserAuditEntry;
};

function AuditRow({ entry }: AuditRowProps) {
  const changeSummary = (): string | null => {
    if (entry.action === 'create') {
      return null;
    }
    if (entry.action === 'role_change') {
      return `${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    }
    if (entry.action === 'update' && entry.fieldName) {
      const fieldLabel = FIELD_LABELS[entry.fieldName] ?? entry.fieldName;
      if (entry.oldValue === null) {
        return `${fieldLabel}: ${entry.newValue ?? ''}`;
      }
      return `${fieldLabel}: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    }
    if (entry.action === 'activate' || entry.action === 'deactivate') {
      return entry.newValue === 'true' ? 'Cuenta habilitada' : 'Cuenta deshabilitada';
    }
    return null;
  };

  return (
    <View style={styles.auditCard}>
      <View style={styles.auditHeader}>
        <PillBadge label={ACTION_LABELS[entry.action]} tone={AUDIT_ROLE_TONES[entry.action]} />
        <Text style={styles.auditDate}>{formatDateTime(entry.createdAt)}</Text>
      </View>
      {changeSummary() ? <Text style={styles.auditSummary}>{changeSummary()}</Text> : null}
      {entry.changedByName ? (
        <Text style={styles.auditActor}>Por: {entry.changedByName}</Text>
      ) : null}
    </View>
  );
}

type RolePickerModalProps = {
  visible: boolean;
  currentRole: Role;
  roles: RoleOption[];
  onSelect: (role: Role) => void;
  onClose: () => void;
};

function RolePickerModal({
  visible,
  currentRole,
  roles,
  onSelect,
  onClose,
}: RolePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Seleccionar rol</Text>
          <Text style={styles.modalSubtitle}>El usuario pasará a tener estos permisos.</Text>

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {roles.map((role) => {
              const isCurrent = role.name === currentRole;
              return (
                <Pressable
                  key={role.id}
                  onPress={() => onSelect(role.name)}
                  disabled={isCurrent}
                  style={[
                    styles.roleOption,
                    isCurrent && styles.roleOptionCurrent,
                  ]}
                >
                  <View style={styles.roleOptionInfo}>
                    <Text style={styles.roleOptionName}>
                      {ROLE_LABELS[role.name] ?? role.name}
                    </Text>
                    {role.description ? (
                      <Text style={styles.roleOptionDesc} numberOfLines={2}>
                        {role.description}
                      </Text>
                    ) : null}
                  </View>
                  {isCurrent ? (
                    <Text style={styles.roleOptionCurrentText}>Actual</Text>
                  ) : (
                    <Icon name="chevronRight" size={20} color={Colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.card + 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: spacing.lg,
    shadowColor: '#0B4A6F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    flexShrink: 1,
    marginLeft: spacing.lg,
    textAlign: 'right',
  },
  actionsCard: {
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(22, 163, 224, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionDanger: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(230, 57, 70, 0.06)',
  },
  actionSuccess: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(76, 168, 102, 0.08)',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  actionDangerText: {
    color: Colors.danger,
  },
  actionSuccessText: {
    color: '#2E7D46',
  },
  actionHint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  auditCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditDate: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
  },
  auditSummary: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    marginTop: spacing.sm,
  },
  auditActor: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 18, 32, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: Colors.primary,
  },
  modalSubtitle: {
    fontSize: fontSizes.caption,
    color: Colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  modalList: {
    maxHeight: 360,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.element,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  roleOptionCurrent: {
    opacity: 0.6,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  roleOptionDesc: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  roleOptionCurrentText: {
    color: Colors.success,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    marginLeft: spacing.sm,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  modalCancelText: {
    color: Colors.accent,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
});

export default UserDetailScreen;