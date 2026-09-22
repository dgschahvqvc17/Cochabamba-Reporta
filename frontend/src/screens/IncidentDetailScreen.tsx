/**
 * Pantalla: Detalle de incidente (MVC - View).
 *
 * HU09 — Consultar y gestionar incidentes (Encargado de recepción).
 * Muestra la información completa de un incidente: estado, categoría,
 * descripción, ciudadano que reportó, fecha/hora, ubicación (con mapa)
 * y evidencias fotográficas.
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import Icon, { type IconName } from '../components/Icon';
import MapPreview from '../components/MapPreview';
import PillBadge, { type PillTone } from '../components/PillBadge';
import { fondo3 } from '../assets/images';
import { loadIncidentById } from '../controllers/incidentController';
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
import { formatCoordinates } from '../utils/location';

type IncidentDetailScreenProps = {
  incidentId: number;
  onBack: () => void;
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

function IncidentDetailScreen({
  incidentId,
  onBack,
}: IncidentDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const meta = incident ? statusMeta(incident.status) : null;

  const reporterName = incident?.reporter
    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`.trim()
    : '';

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title={incident ? incident.code : 'Detalle del incidente'}
        subtitle={
          incident
            ? `${meta ? meta.label : incident.status} · ${reporterName || 'Sin reportante'}`
            : 'Consultando…'
        }
        badge="DETALLE"
        contentBackground={Colors.background}
        onBack={onBack}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
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
            <Text style={styles.centerText}>Cargando detalle…</Text>
          </View>
        ) : (
          <>
            {/* Estado y fechas */}
            <DetailCard title="Seguimiento" icon="bell" color={Colors.accent}>
              <View style={styles.statusRow}>
                {meta ? (
                  <PillBadge label={meta.label} tone={meta.tone} dot />
                ) : (
                  <Text style={styles.statusRaw}>{incident.status}</Text>
                )}
              </View>
              <InfoRow
                icon="clock"
                label="Registrado"
                value={formatDateTime(incident.createdAt)}
              />
              <InfoRow
                icon="refresh"
                label="Última actualización"
                value={formatDateTime(incident.updatedAt)}
              />
            </DetailCard>

            {/* Descripción */}
            <DetailCard title="Incidente" icon="report" color={Colors.warning}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>
              <Text style={styles.incidentDescription}>{incident.description}</Text>
              <View style={styles.detailGrid}>
                <InfoRow
                  icon="category"
                  label="Categoría"
                  value={incident.category?.name ?? 'Sin categoría'}
                />
                <InfoRow icon="badge" label="Código" value={incident.code} />
              </View>
            </DetailCard>

            {/* Ciudadano que reportó */}
            <DetailCard title="Ciudadano que reportó" icon="person" color={Colors.success}>
              <Text style={styles.reporterName}>{reporterName || '—'}</Text>
              <InfoRow
                icon="badge"
                label="Documento de identidad"
                value={incident.reporter?.identityNumber || '—'}
              />
              <InfoRow
                icon="bell"
                label="Teléfono"
                value={incident.reporter?.phone || '—'}
              />
              <InfoRow
                icon="send"
                label="Correo electrónico"
                value={incident.reporter?.email || '—'}
              />
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
          </>
        )}
      </ScrollView>
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
  pressed: { opacity: 0.7 },
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
  statusRaw: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
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
  detailGrid: {
    marginTop: spacing.xs,
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

export default IncidentDetailScreen;