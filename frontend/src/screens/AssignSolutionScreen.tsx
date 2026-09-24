/**
 * Pantalla: Asignar incidente para solución (MVC - View).
 *
 * HU12 — Asignar incidente para solución (Encargado de solución).
 * Muestra la información completa del incidente verificado (seguimiento,
 * resultado de la verificación, descripción, ciudadano, ubicación y
 * evidencia), el personal de solución disponible y permite asignar un
 * responsable con una nota opcional. Al confirmar cambia el estado a
 * ASIGNADO_PARA_SOLUCION y notifica al responsable y al ciudadano (lo
 * resuelve el backend).
 *
 * @format
 */

import React, { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import AppDialog from '../components/AppDialog';
import Icon, { type IconName } from '../components/Icon';
import MapPreview from '../components/MapPreview';
import PillBadge, { type PillTone } from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import { fondo3 } from '../assets/images';
import {
  assignIncidentForSolution,
  loadIncidentById,
  loadIncidentHistory,
  loadSolutionStaff,
} from '../controllers/incidentController';
import { useDialog } from '../hooks/useDialog';
import type {
  Incident,
  IncidentHistoryEntry,
  IncidentStatus,
  SolutionUser,
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
import { formatCoordinates } from '../utils/location';

type AssignSolutionScreenProps = {
  incidentId: number;
  onBack: () => void;
  onAssigned: () => void;
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

const statusMeta = (status: IncidentStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status) ?? {
    value: status,
    label: status,
    tone: 'neutral' as PillTone,
  };

const ASSIGNABLE_TO_SOLUTION: IncidentStatus[] = ['VERIFICADO'];

/**
 * Entrada del historial que registra la verificación (transición a
 * VERIFICADO); su comentario contiene las observaciones del verificador.
 */
const findVerificationEntry = (
  history: IncidentHistoryEntry[],
): IncidentHistoryEntry | null =>
  history.find((entry) => entry.toStatus === 'VERIFICADO') ?? null;

function AssignSolutionScreen({
  incidentId,
  onBack,
  onAssigned,
}: AssignSolutionScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, close, error, success } = useDialog();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [staff, setStaff] = useState<SolutionUser[]>([]);
  const [verification, setVerification] =
    useState<IncidentHistoryEntry | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [incidentResult, staffResult, historyResult] = await Promise.all([
      loadIncidentById(incidentId),
      loadSolutionStaff(),
      loadIncidentHistory(incidentId),
    ]);

    setIsLoading(false);

    if (!incidentResult.success || !incidentResult.data) {
      setErrorMessage(incidentResult.message);
      return;
    }

    setIncident(incidentResult.data);

    if (staffResult.success && staffResult.data) {
      setStaff(staffResult.data);
    }

    if (historyResult.success && historyResult.data) {
      setVerification(findVerificationEntry(historyResult.data));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const meta = incident ? statusMeta(incident.status) : null;
  const isAssignable = incident
    ? ASSIGNABLE_TO_SOLUTION.includes(incident.status)
    : false;
  const reporterName = incident?.reporter
    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`.trim()
    : '';
  const selectedStaff = staff.find(
    (staffMember) => staffMember.id === selectedStaffId,
  );

  const verificationChangedBy = verification?.changedBy
    ? `${verification.changedBy.firstName} ${verification.changedBy.lastName}`.trim()
    : '';

  const handleAssign = () => {
    if (!incident || !selectedStaff) {
      return;
    }

    const targetStaff = selectedStaff;

    confirm({
      title: 'Asignar para solución',
      message: `¿Asignar el incidente ${incident.code} a ${targetStaff.firstName} ${targetStaff.lastName} para su atención?`,
      confirmLabel: 'Asignar',
      tone: 'accent',
      onConfirm: async () => {
        setIsSubmitting(true);
        const result = await assignIncidentForSolution(incidentId, {
          assignedToId: selectedStaffId ?? targetStaff.id,
          note: note.trim() || undefined,
        });
        setIsSubmitting(false);

        if (!result.success) {
          const conflict =
            result.code === 'ALREADY_ASSIGNED' ||
            result.code === 'INVALID_TRANSITION';
          error({
            title: conflict ? 'Ya no está pendiente' : 'No se pudo asignar',
            message: conflict
              ? `${incident.code} ya fue asignado o ya no está verificado (fue gestionado en otra ventana). Al volver, la lista se actualizará.`
              : result.fieldErrors?.assignedToId ??
                result.message ??
                'Ocurrió un error inesperado.',
            onAccept: conflict ? onBack : undefined,
          });
          return;
        }

        success({
          title: 'Incidente asignado',
          message: `${incident.code} fue asignado a ${targetStaff.firstName} ${targetStaff.lastName}. El estado cambió a "Asignado para solución" y se notificó al responsable y al ciudadano.`,
          onAccept: onAssigned,
        });
      },
    });
  };

  const canAssign = selectedStaffId !== null && !isSubmitting;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={incident ? incident.code : 'Asignar para solución'}
        subtitle={
          isLoading || !incident
            ? 'Cargando…'
            : `${incident.title} · ${reporterName || 'Sin reportante'}`
        }
        badge="SOLUCIÓN"
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
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Icon name="warning" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={load} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isLoading || !incident ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.centerText}>Cargando información…</Text>
          </View>
        ) : !isAssignable ? (
          <View style={styles.notPendingBox}>
            <View style={styles.notPendingIcon}>
              <Icon name="warning" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.notPendingTitle}>Ya no está pendiente</Text>
            <Text style={styles.notPendingText}>
              El incidente {incident.code} tiene el estado "
              {meta ? meta.label : incident.status}" y ya no puede asignarse
              para solución. Vuelve a la lista para ver su estado actualizado.
            </Text>
            <PrimaryButton label="Volver a la lista" onPress={onBack} />
          </View>
        ) : (
          <>
            {/* Seguimiento */}
            <DetailCard title="Seguimiento" icon="bell" color={Colors.accent}>
              <View style={styles.statusRow}>
                <PillBadge label={meta ? meta.label : incident.status} tone={meta ? meta.tone : 'neutral'} dot />
              </View>
              <InfoRow icon="clock" label="Registrado" value={formatDateTime(incident.createdAt)} />
              <InfoRow icon="refresh" label="Última actualización" value={formatDateTime(incident.updatedAt)} />
            </DetailCard>

            {/* Resultado de la verificación */}
            <DetailCard title="Resultado de la verificación" icon="shieldCheck" color={Colors.success}>
              {verification ? (
                <>
                  <Text style={styles.verifiedTitle}>
                    {verification.comment || 'El problema fue verificado.'}
                  </Text>
                  <InfoRow
                    icon="person"
                    label="Verificado por"
                    value={verificationChangedBy || '—'}
                  />
                  <InfoRow
                    icon="clock"
                    label="Fecha de verificación"
                    value={formatDateTime(verification.createdAt)}
                  />
                </>
              ) : (
                <Text style={styles.mutedText}>
                  El incidente fue verificado, pero no se registraron
                  observaciones adicionales.
                </Text>
              )}
            </DetailCard>

            {/* Incidente */}
            <DetailCard title="Incidente" icon="report" color={Colors.warning}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>
              <Text style={styles.incidentDescription}>{incident.description}</Text>
              <InfoRow icon="category" label="Categoría" value={incident.category?.name ?? 'Sin categoría'} />
              <InfoRow icon="badge" label="Código" value={incident.code} />
            </DetailCard>

            {/* Ciudadano que reportó */}
            <DetailCard title="Ciudadano que reportó" icon="person" color={Colors.success}>
              <Text style={styles.reporterName}>{reporterName || '—'}</Text>
              <InfoRow icon="badge" label="Documento de identidad" value={incident.reporter?.identityNumber || '—'} />
              <InfoRow icon="bell" label="Teléfono" value={incident.reporter?.phone || '—'} />
              <InfoRow icon="send" label="Correo electrónico" value={incident.reporter?.email || '—'} />
            </DetailCard>

            {/* Ubicación */}
            <DetailCard title="Ubicación" icon="pin" color={Colors.info}>
              {incident.location ? (
                <>
                  <InfoRow
                    icon="map"
                    label="Dirección o referencia"
                    value={incident.location.address || 'Sin dirección registrada.'}
                  />
                  <InfoRow
                    icon="pin"
                    label="Coordenadas"
                    value={formatCoordinates(
                      incident.location.latitude,
                      incident.location.longitude,
                    )}
                  />
                  <MapPreview
                    latitude={incident.location.latitude}
                    longitude={incident.location.longitude}
                  />
                  <Text style={styles.captureText}>
                    Capturada: {formatDateTime(incident.location.capturedAt)}
                  </Text>
                </>
              ) : (
                <Text style={styles.mutedText}>Sin ubicación registrada.</Text>
              )}
            </DetailCard>

            {/* Evidencia */}
            <DetailCard title="Evidencia fotográfica" icon="photo" color={Colors.accent}>
              {incident.evidence && incident.evidence.length > 0 ? (
                <>
                  <Text style={styles.evidenceCount}>
                    {incident.evidence.length} foto
                    {incident.evidence.length !== 1 ? 's' : ''} adjunta
                    {incident.evidence.length !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.evidenceGrid}>
                    {incident.evidence.map((evidence) => (
                      <Image
                        key={evidence.id}
                        source={{ uri: evidence.url }}
                        style={styles.evidenceImage}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.mutedText}>Sin evidencias adjuntas.</Text>
              )}
            </DetailCard>

            {/* Responsables disponibles */}
            <DetailCard title="Responsables disponibles" icon="person" color={Colors.primaryLight}>
              {staff.length === 0 ? (
                <>
                  <Text style={styles.mutedText}>
                    No hay personal de solución activo.
                  </Text>
                  <Text style={styles.mutedTextSmall}>
                    Un administrador debe registrar un usuario con el rol
                    "Personal de solución".
                  </Text>
                </>
              ) : (
                <>
                  {staff.map((staffMember) => {
                    const selected = selectedStaffId === staffMember.id;
                    return (
                      <Pressable
                        key={staffMember.id}
                        onPress={() => setSelectedStaffId(staffMember.id)}
                        style={({ pressed }) => [
                          styles.staffCard,
                          selected && styles.staffCardSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.staffAvatar,
                            selected && styles.staffAvatarSelected,
                          ]}
                        >
                          <Text style={styles.staffAvatarText}>
                            {`${staffMember.firstName.charAt(0)}${staffMember.lastName.charAt(0)}`.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.staffInfo}>
                          <Text style={styles.staffName}>
                            {staffMember.firstName} {staffMember.lastName}
                          </Text>
                          <Text style={styles.staffEmail} numberOfLines={1}>
                            {staffMember.email}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected ? (
                            <Icon name="check" size={14} color={Colors.textOnPrimary} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </DetailCard>

            {/* Nota */}
            <DetailCard title="Nota (opcional)" icon="edit" color={Colors.warning}>
              <View style={styles.noteInputWrap}>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Instrucciones para la atención…"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={255}
                />
                <Text style={styles.noteCounter}>{note.length}/255</Text>
              </View>
            </DetailCard>

            <PrimaryButton
              label="Asignar para solución"
              onPress={handleAssign}
              disabled={!canAssign}
              loading={isSubmitting}
            />
          </>
        )}
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

function DetailCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: IconName;
  color: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: color + '14', borderColor: color + '35' }]}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={15} color={Colors.textSecondary} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
    padding: spacing.base,
  },
  pressed: { opacity: 0.82 },
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
    fontSize: fontSizes.small,
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
  notPendingBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  notPendingIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,214,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  notPendingTitle: {
    color: Colors.warning,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  notPendingText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: radius.card,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: spacing.base,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  verifiedTitle: {
    color: Colors.success,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    lineHeight: 21,
    marginBottom: spacing.base,
  },
  incidentTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
  },
  incidentDescription: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  reporterName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  mutedText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
  },
  mutedTextSmall: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  captureText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  evidenceCount: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.sm,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  evidenceImage: {
    width: 112,
    height: 112,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.background,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceSubtle,
    marginTop: spacing.sm,
  },
  staffCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(59,130,184,0.10)',
  },
  staffAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarSelected: {
    backgroundColor: Colors.accentDim,
  },
  staffAvatarText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  staffEmail: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  noteInputWrap: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    padding: spacing.base,
  },
  noteInput: {
    minHeight: 80,
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    textAlignVertical: 'top',
    // @ts-ignore — web sólo (evita outline por defecto)
    outlineWidth: 0,
  },
  noteCounter: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default AssignSolutionScreen;