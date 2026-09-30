/**
 * Pantalla: Dashboard de supervisión (MVC - View, HU15).
 *
 * Panel exclusivo del ADMINISTRADOR con los indicadores del sistema,
 * personal activo por rol, distribución por estado y categoría, alertas
 * de gestión y el historial reciente de incidentes. Consume
 * `dashboardController.loadDashboard` (Controller) y no habla con HTTP
 * directamente. Incluye pull-to-refresh, estados de carga/error/vacío
 * y respeto de la zona segura (safe area).
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientOverlay from '../components/GradientOverlay';
import Icon, { type IconName } from '../components/Icon';
import { cityBackground } from '../assets/images';
import type { DashboardSnapshot } from '../models/Dashboard';
import { loadDashboard } from '../controllers/dashboardController';
import {
  Colors,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacings,
  radius,
  spacing,
} from '../theme';

type DashboardScreenProps = {
  onBack: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  REPORTADO: 'Reportado',
  RECIBIDO: 'Recibido',
  EN_VERIFICACION: 'En verificación',
  VERIFICADO: 'Verificado',
  ASIGNADO_PARA_SOLUCION: 'En asignación',
  EN_ATENCION: 'En atención',
  ATENDIDO: 'Atendido',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};

const STATUS_COLORS: Record<string, string> = {
  REPORTADO: Colors.warning,
  RECIBIDO: Colors.accent,
  EN_VERIFICACION: Colors.warning,
  VERIFICADO: Colors.info,
  ASIGNADO_PARA_SOLUCION: Colors.info,
  EN_ATENCION: Colors.warning,
  ATENDIDO: Colors.success,
  CERRADO: Colors.gold,
  RECHAZADO: Colors.danger,
};

type MetricTileProps = {
  icon: IconName;
  label: string;
  value: number;
  color: string;
};

function MetricTile({ icon, label, value, color }: MetricTileProps) {
  return (
    <View style={[styles.metricTile, { borderColor: color + '59' }]}>
      <View style={[styles.metricAccent, { backgroundColor: color }]} />
      <Icon name={icon} size={20} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

type StaffTileProps = {
  icon: IconName;
  label: string;
  value: number;
  color: string;
};

function StaffTile({ icon, label, value, color }: StaffTileProps) {
  return (
    <View style={[styles.staffTile, { borderColor: color + '59' }]}>
      <View style={[styles.staffIcon, { backgroundColor: color + '1F' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={styles.staffInfo}>
        <Text style={styles.staffValue}>{value}</Text>
        <Text style={styles.staffLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function DashboardScreen({ onBack }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const result = await loadDashboard();

    if (!result.success || !result.data) {
      setError(result.message);
      return;
    }

    setSnapshot(result.data);
    setError(null);
  }, []);

  useEffect(() => {
    fetchDashboard().finally(() => setLoading(false));
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  const indicators = snapshot?.indicators;
  const alerts = snapshot?.alerts ?? [];
  const recent = snapshot?.recent ?? [];
  const byStatus = snapshot?.byStatus ?? [];
  const byCategory = snapshot?.byCategory ?? [];
  const maxStatus = byStatus.reduce((max, entry) => Math.max(max, entry.count), 0) || 1;
  const statusCount = (status: string) =>
    byStatus.find((entry) => entry.status === status)?.count ?? 0;

  return (
    <View style={styles.flex}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.97)',
            'rgba(5, 14, 26, 0.93)',
            'rgba(4, 9, 18, 0.98)',
          ]}
        />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.gold]}
              tintColor={Colors.gold}
            />
          }
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
              <Icon name="chevronLeft" size={22} color={Colors.textOnDark} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>SUPERVISIÓN DEL SISTEMA</Text>
              <Text style={styles.title}>Indicadores y control</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.gold} />
              <Text style={styles.centerHint}>Cargando indicadores…</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Icon name="warning" size={40} color={Colors.danger} />
              <Text style={styles.centerHint}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchDashboard}>
                <Text style={styles.retryLabel}>Reintentar</Text>
              </Pressable>
            </View>
          ) : indicators ? (
            <>
              <View style={styles.metricsGrid}>
                <MetricTile
                  icon="users"
                  label="Ciudadanos"
                  value={indicators.totalCitizens}
                  color={Colors.accent}
                />
                <MetricTile
                  icon="folder"
                  label="Incidentes totales"
                  value={indicators.totalIncidents}
                  color={Colors.info}
                />
                <MetricTile
                  icon="calendar"
                  label="De hoy"
                  value={indicators.incidentsToday}
                  color={Colors.warning}
                />
                <MetricTile
                  icon="checkCircle"
                  label="Atendidos"
                  value={indicators.attendedIncidents}
                  color={Colors.success}
                />
                <MetricTile
                  icon="warning"
                  label="Pendientes"
                  value={indicators.pendingIncidents}
                  color={Colors.danger}
                />
                <MetricTile
                  icon="star"
                  label="Cerrados"
                  value={statusCount('CERRADO')}
                  color={Colors.gold}
                />
              </View>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Personal activo por rol</Text>
                <View style={styles.staffRow}>
                  <StaffTile
                    icon="users"
                    label="Recepción"
                    value={indicators.activeReceptionStaff}
                    color={Colors.accent}
                  />
                  <StaffTile
                    icon="shieldCheck"
                    label="Verificación"
                    value={indicators.activeVerifiers}
                    color={Colors.warning}
                  />
                  <StaffTile
                    icon="star"
                    label="Solución"
                    value={indicators.activeSolutionStaff}
                    color={Colors.success}
                  />
                </View>
              </View>

              {byStatus.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Distribución por estado</Text>
                  <View style={styles.cardList}>
                    {byStatus.map((entry) => {
                      const color = STATUS_COLORS[entry.status] ?? Colors.accent;
                      const pct = Math.round((entry.count / maxStatus) * 100);
                      return (
                        <View key={entry.status} style={styles.statusRow}>
                          <View style={styles.statusHeader}>
                            <View style={styles.statusDotRow}>
                              <View
                                style={[styles.statusDot, { backgroundColor: color }]}
                              />
                              <Text style={styles.statusName}>
                                {STATUS_LABELS[entry.status] ?? entry.status}
                              </Text>
                            </View>
                            <Text style={styles.statusCount}>{entry.count}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${pct}%`, backgroundColor: color },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {byCategory.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Por categoría</Text>
                  <View style={styles.categoryWrap}>
                    {byCategory.map((entry) => (
                      <View key={entry.name} style={styles.categoryChip}>
                        <Icon name="category" size={14} color={Colors.gold} />
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {entry.name}
                        </Text>
                        <View style={styles.categoryCount}>
                          <Text style={styles.categoryCountText}>{entry.count}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {alerts.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Alertas de gestión</Text>
                  {alerts.map((alert, index) => (
                    <View
                      key={`alert-${index}`}
                      style={[
                        styles.alertRow,
                        alert.severity === 'warning' ? styles.alertWarning : styles.alertInfo,
                      ]}
                    >
                      <Icon
                        name={alert.severity === 'warning' ? 'warning' : 'info'}
                        size={18}
                        color={alert.severity === 'warning' ? Colors.warning : Colors.accent}
                      />
                      <Text style={styles.alertText} numberOfLines={3}>
                        {alert.message}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Incidentes recientes</Text>
                {recent.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Aún no hay incidentes en el sistema.
                  </Text>
                ) : (
                  recent.map((incident) => {
                    const statusColor = STATUS_COLORS[incident.status] ?? Colors.accent;
                    return (
                      <View key={incident.id} style={styles.incidentRow}>
                        <View style={styles.incidentBadge}>
                          <Text style={styles.incidentCode}>{incident.code}</Text>
                        </View>
                        <View style={styles.incidentInfo}>
                          <Text style={styles.incidentTitle} numberOfLines={1}>
                            {incident.title}
                          </Text>
                          <Text style={styles.incidentMeta}>
                            {new Date(incident.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.incidentStatus,
                            { borderColor: statusColor + '59' },
                          ]}
                        >
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.incidentStatusText, { color: statusColor }]}>
                            {STATUS_LABELS[incident.status] ?? incident.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const { width: windowWidth } = Dimensions.get('window');
const tileWidth = (Math.min(windowWidth, 500) - spacing.lg * 2 - spacing.md) / 2;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.45)',
    backgroundColor: 'rgba(6, 22, 38, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: Colors.gold,
    fontFamily: fonts.heading,
    fontSize: fontSizes.small,
    letterSpacing: letterSpacings.wide,
    marginBottom: spacing.xs,
  },
  title: {
    color: Colors.textOnDark,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.semiBold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricTile: {
    width: tileWidth,
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 10px 24px -14px rgba(2, 10, 18, 0.8)',
  },
  metricAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
  },
  sectionBlock: { marginTop: spacing.xl },
  sectionTitle: {
    color: Colors.textOnDark,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semiBold,
    marginBottom: spacing.md,
  },
  staffRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  staffTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.sm,
    minHeight: 64,
  },
  staffIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.element,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInfo: { flex: 1 },
  staffValue: {
    color: Colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  staffLabel: {
    color: Colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: fontSizes.caption,
    marginTop: 1,
  },
  cardList: {
    gap: spacing.sm,
  },
  statusRow: {
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: spacing.base,
    gap: spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusName: {
    color: Colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  statusCount: {
    color: Colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 75, 0.45)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  categoryName: {
    color: Colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
    flexShrink: 1,
  },
  categoryCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  categoryCountText: {
    color: Colors.goldDim,
    fontFamily: fonts.heading,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  centerHint: {
    color: Colors.textOnDark,
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.element,
    backgroundColor: Colors.accent,
  },
  retryLabel: {
    color: Colors.textOnPrimary,
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  alertWarning: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(217, 164, 65, 0.5)',
  },
  alertInfo: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(59, 130, 184, 0.5)',
  },
  alertText: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  incidentBadge: {
    borderColor: Colors.gold,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  incidentCode: {
    color: Colors.goldDim,
    fontFamily: fonts.heading,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  incidentInfo: { flex: 1, gap: spacing.xs },
  incidentTitle: {
    color: Colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  incidentMeta: {
    color: Colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: fontSizes.caption,
  },
  incidentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  incidentStatusText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
  },
});

export default DashboardScreen;