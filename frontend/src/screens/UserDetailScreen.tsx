/**
 * Pantalla: Detalle de usuario (MVC - View).
 *
 * HU03 — Dark immersive layout: cityBackground + overlay, profile hero
 * con anillo de color por rol, info cards glassmorphic, acciones y timeline.
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
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
import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import PillBadge, { type PillTone } from '../components/PillBadge';
import { cityBackground } from '../assets/images';
import {
  assignUserRole,
  loadRoles,
  loadUserDetail,
  setUserActive,
} from '../controllers/userController';
import { useDialog } from '../hooks/useDialog';
import type { Role, RoleOption, User, UserAuditEntry } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
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

const AUDIT_TONES: Record<UserAuditEntry['action'], PillTone> = {
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
  identityNumber: 'Documento',
  birthDate: 'Fecha de nacimiento',
  address: 'Dirección',
  role: 'Rol',
  active: 'Estado',
};

function UserDetailScreen({ userId, onBack, onEdit }: UserDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, error, success, close } = useDialog();
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
    if (!result.success) { setLoadError(result.message); setIsLoading(false); return; }
    setUser(result.data?.user ?? null);
    setAudit(result.data?.audit ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadRoles();
      if (active && result.success && result.data) setRoles(result.data);
    })();
    return () => { active = false; };
  }, []);

  if (isLoading || !user) {
    return (
      <View style={styles.flex}>
        <AdminHeader title="Detalle del usuario" onBack={onBack} />
        {loadError ? (
          <View style={styles.centerBox}>
            <Icon name="warning" size={36} color={Colors.danger} />
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

  const handleToggleActive = () => {
    const target = !user.active;
    confirm({
      title: target ? 'Activar usuario' : 'Desactivar usuario',
      message: target
        ? `¿Activar a ${user.firstName} ${user.lastName}?`
        : `¿Desactivar a ${user.firstName} ${user.lastName}? No podrá iniciar sesión.`,
      confirmLabel: target ? 'Activar' : 'Desactivar',
      cancelLabel: 'Cancelar',
      tone: target ? 'success' : 'danger',
      onConfirm: () => doToggleActive(target),
    });
  };

  const doToggleActive = async (active: boolean) => {
    setIsUpdating(true);
    close();
    const result = await setUserActive(user.id, active);
    setIsUpdating(false);
    if (!result.success) { error({ title: 'Error', message: result.message }); return; }
    setUser(result.data ?? null);
    success({ title: 'Operación exitosa', message: result.message });
  };

  const roleOptions: RoleOption[] =
    roles.length > 0
      ? [...roles].sort((a, b) => (a.name < b.name ? -1 : 1))
      : ROLES.map((r, i) => ({ id: i + 1, name: r, description: null, active: true }));

  const proposeRole = (role: Role) => {
    setIsRoleModalOpen(false);
    confirm({
      title: 'Asignar rol',
      message: `¿Asignar "${ROLE_LABELS[role]}" a ${user.firstName} ${user.lastName}?`,
      confirmLabel: 'Asignar',
      cancelLabel: 'Cancelar',
      tone: 'accent',
      onConfirm: () => doAssignRole(role),
    });
  };

  const doAssignRole = async (role: Role) => {
    setIsUpdating(true);
    close();
    const result = await assignUserRole(user.id, role);
    setIsUpdating(false);
    if (!result.success) { error({ title: 'Error', message: result.message }); return; }
    setUser(result.data ?? null);
    success({ title: 'Rol asignado', message: result.message });
  };

  const roleColor = ROLE_COLORS[user.role];
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.flex}>
      {/* Dark immersive background — absoluteFill under everything */}
      <ImageBackground source={cityBackground} style={styles.bgAbsolute} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.96)',
            'rgba(5, 14, 26, 0.92)',
            'rgba(3, 9, 18, 0.97)',
          ]}
        />
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />
      </ImageBackground>

      <AdminHeader title="Detalle del usuario" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { borderColor: roleColor + '30' }]}>
          <View style={[styles.heroTop, { backgroundColor: roleColor + '0C' }]}>
            <View style={[styles.avatarRing, { borderColor: roleColor + '60' }]}>
              <View style={[styles.avatarInner, { backgroundColor: roleColor + '1A' }]}>
                <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
              </View>
            </View>
            {user.active && (
              <View style={styles.onlineDot} />
            )}
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.heroEmail}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <PillBadge label={ROLE_LABELS[user.role]} tone={ROLE_TONES[user.role]} dot />
              <PillBadge
                label={user.active ? 'Activo' : 'Inactivo'}
                tone={user.active ? 'success' : 'danger'}
                dot
              />
            </View>
          </View>
        </View>

        {/* Info */}
        <SectionLabel label="INFORMACIÓN PERSONAL" />
        <View style={styles.infoCard}>
          <InfoRow label="Documento" value={user.identityNumber || '—'} icon="badge" />
          <InfoRow label="Teléfono" value={user.phone || '—'} icon="bell" last={false} />
          <InfoRow label="Fecha de nacimiento" value={user.birthDate ? formatDate(user.birthDate) : '—'} icon="calendar" last={false} />
          <InfoRow label="Dirección" value={user.address || '—'} icon="pin" last />
        </View>

        {/* Actions */}
        <SectionLabel label="ACCIONES" />
        <View style={styles.actionsCard}>
          <ActionButton
            icon="edit"
            label="Editar datos"
            color={Colors.accent}
            onPress={() => onEdit(user.id)}
          />
          <ActionButton
            icon="power"
            label={user.active ? 'Desactivar cuenta' : 'Activar cuenta'}
            color={user.active ? Colors.danger : Colors.success}
            disabled={isUpdating || isSelf}
            onPress={handleToggleActive}
          />
          <ActionButton
            icon="badge"
            label="Cambiar rol"
            color={Colors.info}
            disabled={isUpdating || isSelf}
            onPress={() => setIsRoleModalOpen(true)}
          />
          {isSelf && (
            <View style={styles.selfNote}>
              <Icon name="info" size={14} color={Colors.textSecondary} />
              <Text style={styles.selfNoteText}>
                No puedes modificar tu propia cuenta de administrador.
              </Text>
            </View>
          )}
        </View>

        {/* Audit */}
        <SectionLabel label="HISTORIAL DE CAMBIOS" />
        {audit.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="clock" size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Aún no se registraron cambios.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {audit.map((entry, i) => (
              <AuditRow key={entry.id} entry={entry} isLast={i === audit.length - 1} />
            ))}
          </View>
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

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={sLabelStyles.label}>{label}</Text>
  );
}

const sLabelStyles = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
});

function InfoRow({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon: Parameters<typeof Icon>[0]['name'];
  last?: boolean;
}) {
  return (
    <View style={[infoStyles.row, !last && infoStyles.rowBorder]}>
      <View style={infoStyles.iconWrap}>
        <Icon name={icon} size={16} color={Colors.accent} />
      </View>
      <View style={infoStyles.text}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.1)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    marginTop: 2,
  },
});

function ActionButton({
  icon,
  label,
  color,
  disabled,
  onPress,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        actionBtnStyles.btn,
        { borderColor: color + '40', backgroundColor: color + '08' },
        pressed && actionBtnStyles.pressed,
        disabled && actionBtnStyles.disabled,
      ]}
    >
      <View style={[actionBtnStyles.iconWrap, { backgroundColor: color + '14' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={[actionBtnStyles.label, { color }]}>{label}</Text>
      <Icon name="chevronRight" size={16} color={color + '80'} />
    </Pressable>
  );
}

const actionBtnStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.element,
    borderWidth: 1.5,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.85 },
  disabled: { opacity: 0.35 },
});

function AuditRow({ entry, isLast }: { entry: UserAuditEntry; isLast: boolean }) {
  const changeSummary = (): string | null => {
    if (entry.action === 'create') return null;
    if (entry.action === 'role_change') return `${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    if (entry.action === 'update' && entry.fieldName) {
      const fl = FIELD_LABELS[entry.fieldName] ?? entry.fieldName;
      return entry.oldValue === null ? `${fl}: ${entry.newValue ?? ''}` : `${fl}: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
    }
    if (entry.action === 'activate' || entry.action === 'deactivate') {
      return entry.newValue === 'true' ? 'Cuenta habilitada' : 'Cuenta deshabilitada';
    }
    return null;
  };

  return (
    <View style={timelineStyles.row}>
      {/* Line + dot */}
      <View style={timelineStyles.lineCol}>
        <View style={timelineStyles.dot} />
        {!isLast && <View style={timelineStyles.line} />}
      </View>
      {/* Content */}
      <View style={timelineStyles.card}>
        <View style={timelineStyles.cardHeader}>
          <PillBadge label={ACTION_LABELS[entry.action]} tone={AUDIT_TONES[entry.action]} />
          <Text style={timelineStyles.date}>{formatDateTime(entry.createdAt)}</Text>
        </View>
        {changeSummary() ? <Text style={timelineStyles.summary}>{changeSummary()}</Text> : null}
        {entry.changedByName ? <Text style={timelineStyles.actor}>Por: {entry.changedByName}</Text> : null}
      </View>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  lineCol: { alignItems: 'center', width: 20, paddingTop: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  line: { flex: 1, width: 2, backgroundColor: 'rgba(0, 212, 255, 0.15)', marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: 'rgba(7, 22, 36, 0.82)',
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    padding: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  date: { color: Colors.textMuted, fontSize: fontSizes.micro },
  summary: {
    color: Colors.textOnDark,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginTop: spacing.xs,
  },
  actor: { color: Colors.textMuted, fontSize: fontSizes.micro, marginTop: 2 },
});

function RolePickerModal({
  visible,
  currentRole,
  roles,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentRole: Role;
  roles: RoleOption[];
  onSelect: (role: Role) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.headerIcon}>
              <Icon name="badge" size={20} color={Colors.accent} />
            </View>
            <View>
              <Text style={modalStyles.title}>Seleccionar rol</Text>
              <Text style={modalStyles.subtitle}>El usuario adoptará este nuevo rol.</Text>
            </View>
          </View>

          <ScrollView style={modalStyles.list} showsVerticalScrollIndicator={false}>
            {roles.map((role) => {
              const isCurrent = role.name === currentRole;
              const rc = ROLE_COLORS[role.name];
              return (
                <Pressable
                  key={role.id}
                  onPress={() => !isCurrent && onSelect(role.name)}
                  style={[
                    modalStyles.roleOption,
                    { borderColor: rc + '25' },
                    isCurrent && modalStyles.roleOptionCurrent,
                  ]}
                >
                  <View style={[modalStyles.roleOptionDot, { backgroundColor: rc }]} />
                  <View style={modalStyles.roleOptionText}>
                    <Text style={[modalStyles.roleOptionName, { color: isCurrent ? rc : Colors.textPrimary }]}>
                      {ROLE_LABELS[role.name] ?? role.name}
                    </Text>
                    {role.description ? (
                      <Text style={modalStyles.roleOptionDesc} numberOfLines={2}>{role.description}</Text>
                    ) : null}
                  </View>
                  {isCurrent
                    ? <PillBadge label="Actual" tone="success" />
                    : <Icon name="chevronRight" size={18} color={Colors.textSecondary} />
                  }
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={onClose} style={modalStyles.cancel}>
            <Text style={modalStyles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 9, 18, 0.75)',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 212, 255, 0.25)',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSizes.h3, fontWeight: fontWeights.bold, color: Colors.textOnDark },
  subtitle: { fontSize: fontSizes.caption, color: Colors.textMuted, marginTop: 2 },
  list: { maxHeight: 360 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.element,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  roleOptionCurrent: { opacity: 0.55 },
  roleOptionDot: { width: 10, height: 10, borderRadius: 5 },
  roleOptionText: { flex: 1 },
  roleOptionName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  roleOptionDesc: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { color: Colors.accent, fontSize: fontSizes.body, fontWeight: fontWeights.semiBold },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgDeep },
  bgAbsolute: { ...StyleSheet.absoluteFillObject },
  orbTL: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    top: -40,
    left: -40,
  },
  orbBR: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(167, 139, 250, 0.04)',
    bottom: 100,
    right: -40,
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
    gap: spacing.base,
    padding: spacing.xxl,
  },
  centerText: { color: Colors.textMuted, fontSize: fontSizes.body },
  errorText: { color: Colors.danger, fontSize: fontSizes.body, textAlign: 'center' },
  heroCard: {
    backgroundColor: 'rgba(7, 22, 36, 0.88)',
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroTop: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.extraBold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: spacing.base + 2,
    right: '42%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: 'rgba(7, 22, 36, 0.9)',
  },
  heroBody: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  heroName: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.extraBold,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroEmail: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(7, 22, 36, 0.82)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.14)',
    padding: spacing.base,
  },
  actionsCard: {
    gap: 0,
  },
  selfNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  selfNoteText: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    flex: 1,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(7, 22, 36, 0.75)',
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    padding: spacing.base,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
  },
  timeline: { gap: 0 },
});

export default UserDetailScreen;
