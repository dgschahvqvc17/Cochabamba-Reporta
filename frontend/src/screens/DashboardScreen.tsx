/**
 * Pantalla: Dashboard de supervisión (MVC - View, HU15).
 *
 * Panel exclusivo del ADMINISTRADOR con los indicadores del sistema,
 * alertas de gestión y el historial reciente de incidentes. Consume
 * `dashboardController.loadDashboard` (Controller) y no habla con HTTP
 * directamente. Incluye pull-to-refresh, estados de carga/error/vacío
 * y respeto de la zona segura (safe area).
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import PillBadge from '../components/PillBadge';
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

type MetricTileProps = {
  icon: IconName;
  label: string;
  value: string;
  color: string;
};

function MetricTile({ icon, label, value, color }: MetricTileProps) {
  return (
    <View style={[styles.metricTile, { borderColor: color }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
              <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
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
                  value={String(indicators.totalCitizens)}
                  color={Colors.accent}
                />
                <MetricTile
                  icon="folder"
                  label="Incidentes totales"
                  value={String(indicators.totalIncidents)}
                  color={Colors.info}
                />
                <MetricTile
                  icon="calendar"
                  label="De hoy"
                  value={String(indicators.incidentsToday)}
                  color={Colors.warning}
                />
                <MetricTile
                  icon="checkCircle"
                  label="Atendidos"
                  value={String(indicators.attendedIncidents)}
                  color={Colors.success}
                />
                <MetricTile
                  icon="warning"
                  label="Pendientes"
                  value={String(indicators.pendingIncidents)}
                  color={Colors.danger}
                />
                <MetricTile
                  icon="star"
                  label="Personal activo"
                  value={String(indicators.activeSolutionStaff)}
                  color={Colors.gold}
                />
              </View>

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
                  recent.map((incident) => (
                    <View key={incident.id} style={styles.incidentRow}>
                      <View style={styles.incidentBadge}>
                        <Text style={styles.incidentCode}>{incident.code}</Text>
                      </View>
                      <View style={styles.incidentInfo}>
                        <Text style={styles.incidentTitle} numberOfLines={1}>
                          {incident.title}
                        </Text>
                        <Text style={styles.incidentMeta}>
                          {incident.status} ·{' '}
                          {new Date(incident.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))
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
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
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
  },
  metricValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  centerHint: {
    color: Colors.textSecondary,
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
  sectionBlock: { marginTop: spacing.xl },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semiBold,
    marginBottom: spacing.md,
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
    borderColor: Colors.warningSoft,
  },
  alertInfo: {
    backgroundColor: Colors.surface,
    borderColor: Colors.accentSoft,
  },
  alertText: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSizes.small,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.gold,
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
});

export default DashboardScreen;
