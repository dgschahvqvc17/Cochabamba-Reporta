/**
 * Pantalla: Asignar incidente para verificación (MVC - View).
 *
 * HU10 — Asignar incidente para verificación (Encargado de recepción).
 * Muestra la información completa del incidente pendiente (seguimiento,
 * descripción, ciudadano, ubicación y evidencia), los funcionarios de
 * verificación disponibles y permite asignar uno con una nota opcional.
 * Al confirmar cambia el estado a EN_VERIFICACION y notifica al
 * funcionario y al ciudadano (lo resuelve el backend).
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
  assignIncidentForVerification,
  loadIncidentById,
  loadVerifiers,
  reassignIncidentVerifier,
} from '../controllers/incidentController';
import { useDialog } from '../hooks/useDialog';
import type { Incident, IncidentStatus, VerifierUser } from '../models/Incident';
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

type AssignVerificationScreenProps = {
  incidentId: number;
  onBack: () => void;
  onAssigned: () => void;
  /** Modo reasignación: incidente ya EN_VERIFICACION, cambia de verificador. */
  reassign?: boolean;
  /** Verificador asignado actualmente (solo útil en modo reasignación). */
  currentVerifier?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
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
  STATUS_OPTIONS.find((o) => o.value === status) ?? {
    value: status,
    label: status,
    tone: 'neutral' as PillTone,
  };

const PENDING_STATUSES: IncidentStatus[] = ['REPORTADO', 'RECIBIDO'];
const IN_VERIFICATION_STATUS: IncidentStatus = 'EN_VERIFICACION';

function AssignVerificationScreen({
  incidentId,
  onBack,
  onAssigned,
  reassign = false,
  currentVerifier = null,
}: AssignVerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, close, error, success } = useDialog();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [verifiers, setVerifiers] = useState<VerifierUser[]>([]);
  const [selectedVerifierId, setSelectedVerifierId] = useState<number | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [incidentResult, verifiersResult] = await Promise.all([
      loadIncidentById(incidentId),
      loadVerifiers(),
    ]);

    setIsLoading(false);

    if (!incidentResult.success || !incidentResult.data) {
      setErrorMessage(incidentResult.message);
      return;
    }

    setIncident(incidentResult.data);

    if (verifiersResult.success && verifiersResult.data) {
      setVerifiers(verifiersResult.data);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const meta = incident ? statusMeta(incident.status) : null;
  const isPending = incident
    ? reassign
      ? incident.status === IN_VERIFICATION_STATUS
      : PENDING_STATUSES.includes(incident.status)
    : false;
  const currentVerifierName = currentVerifier
    ? `${currentVerifier.firstName} ${currentVerifier.lastName}`.trim()
    : '';
  const currentVerifierInitials = currentVerifier
    ? `${currentVerifier.firstName.charAt(0)}${currentVerifier.lastName.charAt(0)}`.toUpperCase()
    : '?';
  const reporterName = incident?.reporter
    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`.trim()
    : '';
  const selectedVerifier = verifiers.find(
    (verifier) => verifier.id === selectedVerifierId,
  );

  const handleAssign = () => {
    if (!incident || !selectedVerifier) {
      return;
    }

    const targetVerifier = selectedVerifier;
    const targetName = `${targetVerifier.firstName} ${targetVerifier.lastName}`.trim();

    confirm({
      title: reassign ? 'Reasignar verificador' : 'Asignar a verificación',
      message: reassign
        ? `¿Reasignar el incidente ${incident.code} de ${currentVerifierName ||
            'su verificador actual'} a ${targetName}?`
        : `¿Asignar el incidente ${incident.code} a ${targetName} para su verificación?`,
      confirmLabel: reassign ? 'Reasignar' : 'Asignar',
      tone: 'accent',
      onConfirm: async () => {
        setIsSubmitting(true);
        const result = reassign
          ? await reassignIncidentVerifier(incidentId, {
              assignedToId: selectedVerifierId ?? targetVerifier.id,
              note: note.trim() || undefined,
            })
          : await assignIncidentForVerification(incidentId, {
              assignedToId: selectedVerifierId ?? targetVerifier.id,
              note: note.trim() || undefined,
            });
        setIsSubmitting(false);

        if (!result.success) {
          const conflict =
            result.code === 'ALREADY_ASSIGNED' ||
            result.code === 'ASSIGNMENT_NOT_FOUND' ||
            result.code === 'INVALID_TRANSITION';
          error({
            title: conflict
              ? reassign
                ? 'Ya no está en verificación'
                : 'Ya no está pendiente'
              : reassign
                ? 'No se pudo reasignar'
                : 'No se pudo asignar',
            message: conflict
              ? `${incident.code} ya fue verificado, reasignado o ya no está en verificación (fue gestionado en otra ventana). Al volver, la lista se actualizará.`
              : result.fieldErrors?.assignedToId ??
                result.message ??
                'Ocurrió un error inesperado.',
            onAccept: conflict ? onBack : undefined,
          });
          return;
        }

        success({
          title: reassign ? 'Verificador reasignado' : 'Incidente asignado',
          message: reassign
            ? `${incident.code} fue reasignado de ${currentVerifierName ||
                'su verificador actual'} a ${targetName}. Se notificó al funcionario saliente, al nuevo y al ciudadano.`
            : `${incident.code} fue asignado a ${targetName}. El estado cambió a En verificación y se notificó al funcionario y al ciudadano.`,
          onAccept: onAssigned,
        });
      },
    });
  };

  const canAssign = selectedVerifierId !== null && !isSubmitting;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={
          incident
            ? incident.code
            : reassign
              ? 'Reasignar verificador'
              : 'Asignar a verificación'
        }
        subtitle={
          isLoading || !incident
            ? 'Cargando…'
            : reassign
              ? `${incident.title} · ${currentVerifierName || 'Sin verificador'}`
              : `${incident.title} · ${reporterName || 'Sin reportante'}`
        }
        badge={reassign ? 'REASIGNACIÓN' : 'ASIGNACIÓN'}
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
        ) : !isPending ? (
          <View style={styles.notPendingBox}>
            <View style={styles.notPendingIcon}>
              <Icon name="warning" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.notPendingTitle}>
              {reassign ? 'Ya no está en verificación' : 'Ya no está pendiente'}
            </Text>
            <Text style={styles.notPendingText}>
              El incidente {incident.code} tiene el estado "
              {meta ? meta.label : incident.status}" y
              {reassign
                ? ' ya no puede reasignarse el verificador.'
                : ' ya no puede asignarse a verificación.'}{' '}
              Vuelve a la lista para ver su estado actualizado.
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

            {reassign ? (
              <DetailCard title="Verificador actual" icon="person" color={Colors.warning}>
                <View style={styles.currentVerifierRow}>
                  <View style={styles.currentVerifierAvatar}>
                    <Text style={styles.currentVerifierAvatarText}>
                      {currentVerifierInitials}
                    </Text>
                  </View>
                  <View style={styles.verifierInfo}>
                    <Text style={styles.verifierName}>
                      {currentVerifierName || 'Sin datos del verificador'}
                    </Text>
                    <Text style={styles.verifierEmail} numberOfLines={1}>
                      {currentVerifier?.email ?? '—'}
                    </Text>
                  </View>
                </View>
              </DetailCard>
            ) : null}

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
              {/* El documento del reportante solo lo recibe el propio
                  ciudadano o el administrador, así que puede no venir. */}
              {incident.reporter?.identityNumber ? (
                <InfoRow icon="badge" label="Documento de identidad" value={incident.reporter.identityNumber} />
              ) : null}
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

            {/* Funcionarios disponibles */}
            <DetailCard
              title={reassign ? 'Nuevo verificador' : 'Funcionarios disponibles'}
              icon="person"
              color={Colors.primaryLight}
            >
              {verifiers.length === 0 ? (
                <>
                  <Text style={styles.mutedText}>
                    No hay funcionarios de verificación activos.
                  </Text>
                  <Text style={styles.mutedTextSmall}>
                    Un administrador debe registrar un usuario con el rol
                    "Personal de verificación".
                  </Text>
                </>
              ) : (
                <>
                  {verifiers.map((verifier) => {
                    const selected = selectedVerifierId === verifier.id;
                    const isCurrent =
                      reassign && currentVerifier?.id === verifier.id;
                    return (
                      <Pressable
                        key={verifier.id}
                        onPress={() => {
                          if (!isCurrent) {
                            setSelectedVerifierId(verifier.id);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.verifierCard,
                          selected && styles.verifierCardSelected,
                          isCurrent && styles.verifierCardCurrent,
                          pressed && !isCurrent && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.verifierAvatar,
                            selected && styles.verifierAvatarSelected,
                          ]}
                        >
                          <Text style={styles.verifierAvatarText}>
                            {`${verifier.firstName.charAt(0)}${verifier.lastName.charAt(0)}`.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.verifierInfo}>
                          <Text style={styles.verifierName}>
                            {verifier.firstName} {verifier.lastName}
                          </Text>
                          <Text style={styles.verifierEmail} numberOfLines={1}>
                            {verifier.email}
                          </Text>
                        </View>
                        {isCurrent ? (
                          <View
                            style={[
                              styles.radioOuter,
                              styles.radioOuterCurrent,
                            ]}
                          >
                            <Text style={styles.currentText}>Actual</Text>
                          </View>
                        ) : (
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
                        )}
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
                  placeholder={
                    reassign
                      ? 'Motivo de la reasignación…'
                      : 'Instrucciones para la verificación…'
                  }
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={255}
                />
                <Text style={styles.noteCounter}>{note.length}/255</Text>
              </View>
            </DetailCard>

            <PrimaryButton
              label={reassign ? 'Reasignar verificador' : 'Asignar a verificación'}
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
  currentVerifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceSubtle,
  },
  currentVerifierAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,214,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentVerifierAvatarText: {
    color: Colors.warningDim,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  verifierCard: {
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
  verifierCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(59,130,184,0.10)',
  },
  verifierCardCurrent: {
    opacity: 0.72,
  },
  verifierAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifierAvatarSelected: {
    backgroundColor: Colors.accentDim,
  },
  verifierAvatarText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  verifierInfo: {
    flex: 1,
  },
  verifierName: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  verifierEmail: {
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
  radioOuterCurrent: {
    borderColor: 'rgba(255,214,0,0.55)',
    backgroundColor: 'rgba(255,214,0,0.12)',
    width: 'auto',
    paddingHorizontal: spacing.sm,
  },
  currentText: {
    color: Colors.warningDim,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
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

export default AssignVerificationScreen;