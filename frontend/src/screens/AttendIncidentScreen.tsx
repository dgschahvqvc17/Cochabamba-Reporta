/**
 * Pantalla: Atender y cerrar incidente (MVC - View).
 *
 * HU13 — Atender y cerrar incidente (Personal de solución).
 * Muestra el detalle completo del incidente asignado (seguimiento,
 * descripción, ciudadano, ubicación y evidencia), permite registrar las
 * acciones realizadas y observaciones y adjuntar la evidencia del trabajo
 * realizado. Según el estado avanza la atención:
 * - ASIGNADO_PARA_SOLUCION → "Iniciar atención"   (EN_ATENCION,
 *   acciones realizadas obligatorias).
 * - EN_ATENCION            → "Marcar como atendido" (ATENDIDO).
 * - ATENDIDO               → "Cerrar solicitud"      (CERRADO).
 * Al confirmar, el backend registra el historial y notifica al ciudadano.
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
  attendIncidentById,
  attachEvidenceToIncident,
  closeIncidentById,
  loadIncidentById,
  markIncidentAttendedById,
  pickEvidence,
} from '../controllers/incidentController';
import { useDialog } from '../hooks/useDialog';
import type {
  Incident,
  IncidentStatus,
  AttendIncidentPayload,
} from '../models/Incident';
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

type AttendIncidentScreenProps = {
  incidentId: number;
  onBack: () => void;
  onProcessed: () => void;
};

type Action = 'attend' | 'mark-attended' | 'close' | null;

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

const ACTION_BY_STATUS: Record<string, Action> = {
  ASIGNADO_PARA_SOLUCION: 'attend',
  EN_ATENCION: 'mark-attended',
  ATENDIDO: 'close',
};

function AttendIncidentScreen({
  incidentId,
  onBack,
  onProcessed,
}: AttendIncidentScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, confirm, close, error, success } = useDialog();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [actions, setActions] = useState('');
  const [observations, setObservations] = useState('');
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
      error({
        title: 'Límite de imágenes',
        message:
          'Ya adjuntaste el máximo de 5 imágenes de trabajo para este momento.',
      });
      return;
    }

    setPickedEvidence((current) => [...current, result.evidence as PickedEvidence]);
  };

  const removeEvidence = (index: number) => {
    setPickedEvidence((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const actionForStatus = incident
    ? (ACTION_BY_STATUS[incident.status] ?? null)
    : null;

  const actionLabel = (action: Action) =>
    action === 'attend'
      ? 'Iniciar atención'
      : action === 'mark-attended'
        ? 'Marcar como atendido'
        : action === 'close'
          ? 'Cerrar solicitud'
          : '';

  const runAction = async (
    action: NonNullable<Action>,
    payload: AttendIncidentPayload,
  ): Promise<{
    ok: boolean;
    message?: string;
    code?: string;
    fieldErrors?: { actions?: string; observations?: string };
  }> => {
    const result =
      action === 'attend'
        ? await attendIncidentById(incidentId, payload)
        : action === 'mark-attended'
          ? await markIncidentAttendedById(incidentId, payload)
          : await closeIncidentById(incidentId, payload);

    if (!result.success) {
      return {
        ok: false,
        message: result.message,
        code: result.code,
        ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
      };
    }

    return { ok: true };
  };

  const handleSubmit = () => {
    if (!incident) {
      return;
    }

    const action = actionForStatus;

    if (!action) {
      return;
    }

    if (action === 'attend' && !actions.trim()) {
      error({
        title: 'Acciones obligatorias',
        message:
          'Debes registrar las acciones realizadas para iniciar la atención del incidente.',
      });
      return;
    }

    const description: Record<NonNullable<Action>, string> = {
      attend: `¿Iniciar la atención del incidente ${incident.code}? El estado cambiará a "En atención" y se notificará al ciudadano.`,
      'mark-attended': `¿Marcar el incidente ${incident.code} como atendido? El estado cambiará a "Atendido" y se notificará al ciudadano.`,
      close: `¿Cerrar la solicitud ${incident.code}? El estado cambiará a "Cerrado" y se notificará al ciudadano.`,
    };

    confirm({
      title: `Confirmar ${actionLabel(action)}`,
      message: description[action],
      confirmLabel: actionLabel(action) ?? 'Confirmar',
      tone: action === 'mark-attended' ? 'success' : 'accent',
      onConfirm: async () => {
        setIsSubmitting(true);

        // HU07/HU13: sube las evidencias del trabajo realizado una a una.
        for (const evidence of pickedEvidence) {
          const upload = await attachEvidenceToIncident(incidentId, evidence);

          if (!upload.success) {
            setIsSubmitting(false);
            error({
              title: 'No se pudo adjuntar la evidencia',
              message:
                upload.message ??
                'Ocurrió un error al subir una imagen del trabajo realizado.',
            });
            return;
          }
        }

        const result = await runAction(action, {
          actions: actions.trim() || undefined,
          observations: observations.trim() || undefined,
        });

        setIsSubmitting(false);

        if (!result.ok) {
          const conflict = result.code === 'INVALID_TRANSITION';
          error({
            title: conflict ? 'Ya no está pendiente' : 'No se pudo procesar',
            message: conflict
              ? `${incident.code} ya fue gestionado en otra ventana. Al volver, la lista se actualizará.`
              : result.fieldErrors?.actions ??
                result.fieldErrors?.observations ??
                result.message ??
                'Ocurrió un error inesperado.',
            onAccept: conflict ? onBack : undefined,
          });
          return;
        }

        success({
          title: 'Atención registrada',
          message:
            action === 'close'
              ? `${incident.code} fue cerrado. La solicitud terminó y se notificó al ciudadano.`
              : `${incident.code} cambió de estado. El historial se actualizó y se notificó al ciudadano.`,
          onAccept: onProcessed,
        });
      },
    });
  };

  const meta = incident ? statusMeta(incident.status) : null;
  const isActionable = incident ? actionForStatus !== null : false;
  const reporterName = incident?.reporter
    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`.trim()
    : '';
  const canSubmit = actionForStatus !== null && !isSubmitting;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={incident ? incident.code : 'Atender incidente'}
        subtitle={
          isLoading || !incident
            ? 'Cargando…'
            : `${incident.title} · ${reporterName || 'Sin reportante'}`
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
        ) : !isActionable ? (
          <View style={styles.notPendingBox}>
            <View style={styles.notPendingIcon}>
              <Icon name="warning" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.notPendingTitle}>Ya no está en atención</Text>
            <Text style={styles.notPendingText}>
              El incidente {incident.code} tiene el estado "
              {meta ? meta.label : incident.status}" y ya no puede gestionarse.
              Vuelve a la lista para ver su estado actualizado.
            </Text>
            <PrimaryButton label="Volver a la lista" onPress={onBack} />
          </View>
        ) : (
          <>
            {/* Trabajo realizado */}
            <DetailCard title="Trabajo realizado" icon="shieldCheck" color={Colors.success}>
              <Text style={styles.decisionHint}>
                Registra las acciones realizadas y las observaciones de la
                atención. Las acciones son obligatorias al iniciar la atención.
              </Text>

              <Text style={styles.fieldLabel}>
                Acciones realizadas {actionForStatus === 'attend' ? '*' : '(opcional)'}
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={actions}
                  onChangeText={setActions}
                  placeholder="Describe las acciones realizadas para resolver el incidente…"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={1000}
                />
                <Text style={styles.inputCounter}>{actions.length}/1000</Text>
              </View>
              {actionForStatus === 'attend' && !actions.trim() ? (
                <Text style={styles.fieldError}>
                  Las acciones son obligatorias para iniciar la atención.
                </Text>
              ) : null}

              <Text style={styles.fieldLabel}>Observaciones (opcional)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={observations}
                  onChangeText={setObservations}
                  placeholder="Detalle, hallazgos o información adicional…"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.inputCounter}>
                  {observations.length}/500
                </Text>
              </View>
            </DetailCard>

            {/* Evidencia del trabajo realizado */}
            <DetailCard title="Evidencia del trabajo" icon="photo" color={Colors.warning}>
              <Text style={styles.decisionHint}>
                Adjunta fotografías del trabajo realizado para dejar constancia.
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
              label={actionLabel(actionForStatus) ?? 'Confirmar'}
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
    backgroundColor: 'rgba(217,164,65,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,164,65,0.30)',
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
  decisionHint: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    lineHeight: 18,
    marginBottom: spacing.base,
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
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    padding: spacing.base,
  },
  input: {
    minHeight: 72,
    color: Colors.textPrimary,
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

export default AttendIncidentScreen;