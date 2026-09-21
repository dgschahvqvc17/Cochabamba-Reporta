/**
 * Pantalla: Verificar incidente (MVC - View).
 *
 * HU11 — Verificar incidente (Personal de verificación).
 * Muestra el detalle completo del incidente asignado (seguimiento,
 * descripción, ciudadano, ubicación y evidencia), permite adjuntar
 * evidencia de la constatación en campo y registrar la decisión:
 * - Verificado (el problema existe)   → estado VERIFICADO.
 * - Rechazado (no se comprobó)        → estado RECHAZADO (motivo obligatorio).
 * Al confirmar, el backend completa la asignación, registra el historial
 * y notifica al ciudadano.
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
import EvidencePicker from '../components/EvidencePicker';
import Icon, { type IconName } from '../components/Icon';
import MapPreview from '../components/MapPreview';
import PillBadge, { type PillTone } from '../components/PillBadge';
import PrimaryButton from '../components/PrimaryButton';
import { fondo3 } from '../assets/images';
import {
  attachEvidenceToIncident,
  loadIncidentById,
  pickEvidence,
  verifyIncidentById,
} from '../controllers/incidentController';
import { useDialog } from '../hooks/useDialog';
import type { Incident, IncidentStatus } from '../models/Incident';
import type { PickedEvidence } from '../utils/evidence';
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

type VerifyIncidentScreenProps = {
  incidentId: number;
  onBack: () => void;
  onVerified: () => void;
};

type Decision = 'verified' | 'rejected' | null;

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

const VERIFIABLE_STATUS: IncidentStatus = 'EN_VERIFICACION';

function VerifyIncidentScreen({
  incidentId,
  onBack,
  onVerified,
}: VerifyIncidentScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, close, error, success } = useDialog();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [observations, setObservations] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [pickedEvidence, setPickedEvidence] = useState<PickedEvidence[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loadIncidentById(incidentId);

    setIsLoading(false);

    if (!result.success || !result.data) {
      setErrorMessage(result.message);
      return;
    }

    setIncident(result.data);
  };

  // Reasigna el incidente si cambia la prop (evita estados viejos).
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const handleAddEvidence = async (source: 'camera' | 'gallery') => {
    setIsPicking(true);
    const result = await pickEvidence(source);
    setIsPicking(false);

    if (result.cancelled) {
      return;
    }

    if (!result.ok || !result.evidence) {
      error({
        title: 'No se pudo adjuntar la imagen',
        message: result.message ?? 'Ocurrió un error al obtener la imagen.',
      });
      return;
    }

    if (pickedEvidence.length >= 5) {
      warnEvidenceLimit();
      return;
    }

    setPickedEvidence((current) => [...current, result.evidence as PickedEvidence]);
  };

  const warnEvidenceLimit = () => {
    error({
      title: 'Límite de imágenes',
      message:
        'Ya adjuntaste el máximo de 5 imágenes de verificación para este momento.',
    });
  };

  const removeEvidence = (index: number) => {
    setPickedEvidence((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = () => {
    if (!incident) {
      return;
    }

    if (!decision) {
      error({
        title: 'Selecciona el resultado',
        message:
          'Indica si el incidente fue verificado (el problema existe) o rechazado (no se comprobó).',
      });
      return;
    }

    if (decision === 'rejected' && !rejectedReason.trim()) {
      error({
        title: 'Motivo de rechazo obligatorio',
        message:
          'Debes indicar el motivo por el que rechazas el incidente (no se comprobó el problema).',
      });
      return;
    }

    const isVerified = decision === 'verified';

    confirm({
      title: isVerified ? 'Confirmar verificación' : 'Confirmar rechazo',
      message: isVerified
        ? `¿Confirmas que el incidente ${incident.code} fue verificado (el problema existe)? El estado cambiará a "Verificado".`
        : `¿Confirmas el rechazo del incidente ${incident.code}? El estado cambiará a "Rechazado" y se informará al ciudadano.`,
      confirmLabel: isVerified ? 'Verificado' : 'Rechazar',
      tone: isVerified ? 'success' : 'danger',
      onConfirm: async () => {
        setIsSubmitting(true);

        // HU07/HU11: sube las imágenes de verificación una a una.
        for (const evidence of pickedEvidence) {
          const upload = await attachEvidenceToIncident(incidentId, evidence);

          if (!upload.success) {
            setIsSubmitting(false);
            error({
              title: 'No se pudo adjuntar la evidencia',
              message:
                upload.message ??
                'Ocurrió un error al subir una imagen de verificación.',
            });
            return;
          }
        }

        const result = await verifyIncidentById(incidentId, {
          verified: isVerified,
          observations: observations.trim() || undefined,
          rejectedReason: isVerified ? undefined : rejectedReason.trim(),
        });

        setIsSubmitting(false);

        if (!result.success) {
          const conflict =
            result.code === 'INVALID_TRANSITION' ||
            result.code === 'ALREADY_ASSIGNED';
          error({
            title: conflict ? 'Ya no está en verificación' : 'No se pudo verificar',
            message: conflict
              ? `${incident.code} ya no está en verificación (fue gestionado en otra ventana). Al volver, la lista se actualizará.`
              : result.fieldErrors?.rejectedReason ??
                result.fieldErrors?.observations ??
                result.message ??
                'Ocurrió un error inesperado.',
            onAccept: conflict ? onBack : undefined,
          });
          return;
        }

        success({
          title: isVerified ? 'Incidente verificado' : 'Incidente rechazado',
          message: isVerified
            ? `${incident.code} fue verificado. El estado cambió a "Verificado" y se notificó al ciudadano.`
            : `${incident.code} fue rechazado. El estado cambió a "Rechazado" y se notificó al ciudadano el motivo.`,
          onAccept: onVerified,
        });
      },
    });
  };

  const meta = incident ? statusMeta(incident.status) : null;
  const isVerifiable =
    incident !== null && incident.status === VERIFIABLE_STATUS;
  const reporterName = incident?.reporter
    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`.trim()
    : '';
  const canSubmit = decision !== null && !isSubmitting;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={incident ? incident.code : 'Verificar incidente'}
        subtitle={
          isLoading || !incident
            ? 'Cargando…'
            : `${incident.title} · ${reporterName || 'Sin reportante'}`
        }
        badge="VERIFICACIÓN"
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
        ) : !isVerifiable ? (
          <View style={styles.notPendingBox}>
            <View style={styles.notPendingIcon}>
              <Icon name="warning" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.notPendingTitle}>Ya no está en verificación</Text>
            <Text style={styles.notPendingText}>
              El incidente {incident.code} tiene el estado "
              {meta ? meta.label : incident.status}" y ya no puede verificarse.
              Vuelve a la lista para ver su estado actualizado.
            </Text>
            <PrimaryButton label="Volver a la lista" onPress={onBack} />
          </View>
        ) : (
          <>
            {/* Resultado de la verificación */}
            <DetailCard title="Resultado de la verificación" icon="shieldCheck" color={Colors.accent}>
              <Text style={styles.decisionHint}>
                Define si el problema reportado existe o no, según la
                constatación en campo.
              </Text>

              <Pressable
                onPress={() => setDecision('verified')}
                style={({ pressed }) => [
                  styles.decisionCard,
                  decision === 'verified' && styles.decisionCardVerified,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.decisionIcon, decision === 'verified' && styles.decisionIconVerified]}>
                  <Icon
                    name="checkCircle"
                    size={20}
                    color={decision === 'verified' ? Colors.success : Colors.textSecondary}
                  />
                </View>
                <View style={styles.decisionTextWrap}>
                  <Text style={styles.decisionTitle}>Verificado</Text>
                  <Text style={styles.decisionSubtitle}>
                    El problema existe. El incidente pasará a "Verificado".
                  </Text>
                </View>
                {decision === 'verified' ? (
                  <Icon name="check" size={18} color={Colors.success} />
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setDecision('rejected')}
                style={({ pressed }) => [
                  styles.decisionCard,
                  decision === 'rejected' && styles.decisionCardRejected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.decisionIcon, decision === 'rejected' && styles.decisionIconRejected]}>
                  <Icon
                    name="close"
                    size={20}
                    color={decision === 'rejected' ? Colors.danger : Colors.textSecondary}
                  />
                </View>
                <View style={styles.decisionTextWrap}>
                  <Text style={styles.decisionTitle}>Rechazado</Text>
                  <Text style={styles.decisionSubtitle}>
                    No se comprobó el problema. El incidente pasará a
                    "Rechazado" (motivo obligatorio).
                  </Text>
                </View>
                {decision === 'rejected' ? (
                  <Icon name="check" size={18} color={Colors.danger} />
                ) : null}
              </Pressable>

              {/* Observaciones */}
              <Text style={styles.fieldLabel}>Observaciones</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={observations}
                  onChangeText={setObservations}
                  placeholder="Detalle de la constatación en campo (opcional)…"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.inputCounter}>{observations.length}/500</Text>
              </View>

              {/* Motivo de rechazo */}
              <Text style={styles.fieldLabel}>
                Motivo de rechazo {decision === 'rejected' ? '*' : '(opcional)'}
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={rejectedReason}
                  onChangeText={setRejectedReason}
                  placeholder="¿Por qué no se comprobó el problema?"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.inputCounter}>
                  {rejectedReason.length}/500
                </Text>
              </View>
              {decision === 'rejected' && !rejectedReason.trim() ? (
                <Text style={styles.fieldError}>
                  El motivo es obligatorio para rechazar el incidente.
                </Text>
              ) : null}
            </DetailCard>

            {/* Evidencia de la constatación */}
            <DetailCard title="Evidencia de verificación" icon="photo" color={Colors.warning}>
              <Text style={styles.decisionHint}>
                Adjunta fotografías de la constatación realizada en campo.
              </Text>
              <EvidencePicker
                evidence={pickedEvidence}
                onAdd={handleAddEvidence}
                onRemove={removeEvidence}
                picking={isPicking}
              />
            </DetailCard>

            {/* Seguimiento */}
            <DetailCard title="Seguimiento" icon="bell" color={Colors.accent}>
              <View style={styles.statusRow}>
                <PillBadge label={meta ? meta.label : incident.status} tone={meta ? meta.tone : 'neutral'} dot />
              </View>
              <InfoRow icon="clock" label="Registrado" value={formatDateTime(incident.createdAt)} />
              <InfoRow icon="refresh" label="Última actualización" value={formatDateTime(incident.updatedAt)} />
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

            {/* Evidencia del ciudadano */}
            <DetailCard title="Evidencia del reporte" icon="photo" color={Colors.accent}>
              {incident.evidence && incident.evidence.length > 0 ? (
                <>
                  <Text style={styles.evidenceCount}>
                    {incident.evidence.length} foto
                    {incident.evidence.length !== 1 ? 's' : ''} adjunta
                    {incident.evidence.length !== 1 ? 's' : ''} por el
                    ciudadano
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

            <PrimaryButton
              label="Confirmar verificación"
              onPress={handleSubmit}
              disabled={!canSubmit}
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
  },
  content: {
    padding: spacing.base,
  },
  pressed: { opacity: 0.82 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,69,96,0.08)',
    borderColor: 'rgba(255,69,96,0.25)',
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
    backgroundColor: 'rgba(255,184,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.30)',
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
    backgroundColor: 'rgba(10, 30, 48, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.12)',
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
    color: Colors.textOnDark,
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
  decisionHint: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    lineHeight: 18,
    marginBottom: spacing.base,
  },
  decisionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.element,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: spacing.sm,
  },
  decisionCardVerified: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(0,232,150,0.10)',
  },
  decisionCardRejected: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(255,69,96,0.10)',
  },
  decisionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionIconVerified: {
    backgroundColor: Colors.successSoft,
  },
  decisionIconRejected: {
    backgroundColor: Colors.dangerSoft,
  },
  decisionTextWrap: {
    flex: 1,
  },
  decisionTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  decisionSubtitle: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: 2,
    lineHeight: 17,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.element,
    padding: spacing.base,
  },
  input: {
    minHeight: 72,
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    textAlignVertical: 'top',
    // @ts-ignore — web sólo (evita outline por defecto)
    outlineWidth: 0,
  },
  inputCounter: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  fieldError: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  incidentTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
  },
  incidentDescription: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  reporterName: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  mutedText: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
  },
  captureText: {
    color: Colors.textMuted,
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
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: Colors.bgDeep,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: Colors.textOnDark,
    fontSize: fontSizes.small,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default VerifyIncidentScreen;