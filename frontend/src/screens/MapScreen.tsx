/**
 * Pantalla: Mapa interactivo de incidentes (MVC - Screen).
 *
 * Cada rol entra a su propia sección de mapa y ve únicamente lo que le
 * corresponde (el alcance lo define el backend en utils/mapScope y aquí
 * se refleja en utils/mapScope):
 *   - CIUDADANO          → todos los reportes con ubicación, para ver si
 *                          el problema que quiere reportar ya fue reportado.
 *   - RECEPCION          → los reportes que le llegan (REPORTADO/RECIBIDO).
 *   - VERIFICADOR        → los incidentes que le asignaron para verificar.
 *   - ENCARGADO_SOLUCION → los verificados que debe revisar para asignar.
 *   - PERSONAL_SOLUCION  → los incidentes que le asignaron para atender.
 *   - ADMINISTRADOR      → todos los reportes.
 *
 * El mapa se arrastra con el dedo o el mouse, tiene zoom y un botón para
 * encuadrar todos los reportes de una vez. Usa el mismo sistema de tiles
 * Web Mercator (Esri) que MapPreview, sin SDKs nativos de mapas, por lo que
 * funciona igual en web y en móvil.
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '../components/Icon';
import PillBadge from '../components/PillBadge';
import { getMapIncidents } from '../services/incidentService';
import { getStoredSession } from '../utils/session';
import {
  DEFAULT_MAP_ZOOM,
  MAP_TILE_SIZE,
  MAX_TILE_ZOOM,
  MIN_TILE_ZOOM,
  esriStreetUrl,
  fitPointsToView,
  mercatorTile,
  panCenter,
} from '../utils/mapTiles';
import {
  MAP_STATUS_COLORS,
  MAP_STATUS_LABELS,
  MAP_STATUS_TONES,
  mapScopeFor,
} from '../utils/mapScope';
import type { Incident, IncidentStatus } from '../models/Incident';
import type { Role } from '../models/User';
import {
  Colors,
  fontSizes,
  fontWeights,
  radius,
  spacing,
} from '../theme';

// ── Configuración del mapa ────────────────────────────────────────────────────

/** Coordenadas de Cochabamba, Bolivia (punto de inicio del mapa) */
const COCHABAMBA_LAT = -17.3935;
const COCHABAMBA_LNG = -66.157;

/** Umbral de movimiento (px) para distinguir un arrastre de un toque. */
const PAN_THRESHOLD = 4;

// ── Helpers de mapas de tiles ─────────────────────────────────────────────────

/**
 * Posición en pantalla de una coordenada respecto al centro visible del
 * mapa, sumando el desplazamiento del arrastre en curso para que los pines
 * acompañen al mapa mientras el dedo todavía está en pantalla.
 */
function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  mapW: number,
  mapH: number,
): { x: number; y: number } {
  const center = mercatorTile(centerLat, centerLng, zoom);
  const point = mercatorTile(lat, lng, zoom);

  const scale = MAP_TILE_SIZE;
  const dx = (point.x + point.offsetX - center.x - center.offsetX) * scale;
  const dy = (point.y + point.offsetY - center.y - center.offsetY) * scale;

  return {
    x: mapW / 2 + dx,
    y: mapH / 2 + dy,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

type MapScreenProps = {
  onBack?: () => void;
  role: Role;
  /**
   * Abre el detalle del reporte seleccionado. El backend impide al
   * ciudadano abrir el detalle de un reporte ajeno, así que solo se
   * ofrece al personal municipal y al ciudadano en su propio reporte.
   */
  onOpenIncident?: (incidentId: number) => void;
  /** `true` cuando el reporte seleccionado es del ciudadano que consulta. */
  canOpenSelected?: (incident: Incident) => boolean;
};

export default function MapScreen({
  onBack,
  role,
  onOpenIncident,
  canOpenSelected,
}: MapScreenProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Mapa
  const [mapWidth, setMapWidth] = useState(0);
  const [mapHeight, setMapHeight] = useState(0);
  const [centerLat, setCenterLat] = useState(COCHABAMBA_LAT);
  const [centerLng, setCenterLng] = useState(COCHABAMBA_LNG);
  const [zoom, setZoom] = useState(DEFAULT_MAP_ZOOM);

  // Arrastre en curso: el desplazamiento vive en un ref (no provoca render)
  // y un contador de estado fuerza el repintado mientras se arrastra.
  const gestureRef = useRef<{ dx: number; dy: number } | null>(null);
  const [, setPanTick] = useState(0);

  const scope = mapScopeFor(role);
  const allowedStatuses: IncidentStatus[] = scope.statuses ?? [];

  const loadIncidents = useCallback(async () => {
    const session = getStoredSession();
    if (!session) return;

    setLoading(true);
    setError(null);

    const result = await getMapIncidents(session.accessToken, {
      status: filterStatus || undefined,
      search: search || undefined,
    });

    if (result.success && result.data?.incidents) {
      // Solo se marcan los reportes que tienen ubicación capturada.
      const withLoc = (result.data.incidents as Incident[]).filter(
        (inc) =>
          inc.location &&
          typeof inc.location.latitude === 'number' &&
          typeof inc.location.longitude === 'number',
      );
      setIncidents(withLoc);
      setTruncated(Boolean(result.data.truncated));
    } else {
      setError(result.message ?? 'No se pudieron cargar los reportes.');
    }

    setLoading(false);
  }, [filterStatus, search]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  /** Encuadra todos los reportes del alcance del rol de una sola vez. */
  const fitAllIncidents = useCallback(() => {
    if (incidents.length === 0 || mapWidth === 0 || mapHeight === 0) return;

    const view = fitPointsToView(
      incidents.map((inc) => ({
        latitude: inc.location!.latitude,
        longitude: inc.location!.longitude,
      })),
      mapWidth,
      mapHeight,
      { padding: 64 },
    );

    if (!view) return;

    setCenterLat(view.latitude);
    setCenterLng(view.longitude);
    setZoom(view.zoom);
  }, [incidents, mapWidth, mapHeight]);

  /**
   * Encuadre inicial: apenas llegan los reportes se ven todos juntos, para
   * que el usuario vea de un vistazo el alcance de lo que tiene asignado.
   */
  useEffect(() => {
    if (loading || incidents.length === 0 || mapWidth === 0 || mapHeight === 0) {
      return;
    }

    fitAllIncidents();
  }, [loading, incidents, mapWidth, mapHeight, fitAllIncidents]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > PAN_THRESHOLD ||
          Math.abs(gesture.dy) > PAN_THRESHOLD,
        onPanResponderMove: (_evt, gesture) => {
          gestureRef.current = { dx: gesture.dx, dy: gesture.dy };
          setPanTick((tick) => tick + 1);
        },
        onPanResponderRelease: (_evt, gesture) => {
          gestureRef.current = null;
          const next = panCenter(
            centerLat,
            centerLng,
            zoom,
            -gesture.dx,
            -gesture.dy,
          );
          setCenterLat(next.latitude);
          setCenterLng(next.longitude);
        },
        onPanResponderTerminate: () => {
          gestureRef.current = null;
        },
      }),
    [centerLat, centerLng, zoom],
  );

  const dragDx = gestureRef.current?.dx ?? 0;
  const dragDy = gestureRef.current?.dy ?? 0;

  const centerTile = mercatorTile(centerLat, centerLng, zoom);
  const range = mapWidth > 0 ? Math.ceil(mapWidth / (MAP_TILE_SIZE * 2)) + 1 : 2;
  const rangeY = mapHeight > 0 ? Math.ceil(mapHeight / (MAP_TILE_SIZE * 2)) + 1 : 2;

  const tiles: { key: string; uri: string; left: number; top: number }[] = [];

  for (let dx = -range; dx <= range; dx += 1) {
    for (let dy = -rangeY; dy <= rangeY; dy += 1) {
      tiles.push({
        key: `${dx}:${dy}`,
        uri: esriStreetUrl(centerTile.x + dx, centerTile.y + dy, centerTile.zoom),
        left: Math.round(
          mapWidth / 2 -
            centerTile.offsetX * MAP_TILE_SIZE +
            dx * MAP_TILE_SIZE +
            dragDx,
        ),
        top: Math.round(
          mapHeight / 2 -
            centerTile.offsetY * MAP_TILE_SIZE +
            dy * MAP_TILE_SIZE +
            dragDy,
        ),
      });
    }
  }

  // Calcular posición de cada pin en pantalla
  const pins = incidents.map((inc) => {
    if (!inc.location) return null;
    const pos = latLngToPixel(
      inc.location.latitude,
      inc.location.longitude,
      centerLat,
      centerLng,
      zoom,
      mapWidth,
      mapHeight,
    );
    return { incident: inc, x: pos.x + dragDx, y: pos.y + dragDy };
  }).filter(Boolean) as { incident: Incident; x: number; y: number }[];

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_TILE_ZOOM, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_TILE_ZOOM, z - 1));

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setSelected(null);
  };

  const openDetailEnabled = Boolean(
    onOpenIncident && selected && (!canOpenSelected || canOpenSelected(selected)),
  );

  return (
    <View style={styles.root}>
      {/* ── Cabecera ── */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} testID="map-back">
            <Icon name="chevronLeft" size={22} color={Colors.textOnDark} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{scope.title}</Text>
          <Text style={styles.headerSub}>
            {loading
              ? 'Cargando…'
              : `${incidents.length} reporte${incidents.length !== 1 ? 's' : ''} con ubicación`}
          </Text>
          {!loading && truncated ? (
            <Text style={styles.truncatedText} testID="map-truncated">
              Se muestran los más recientes
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => loadIncidents()} style={styles.refreshBtn} testID="map-refresh">
          <Icon name="refresh" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      {/* ── Alcance de lo que se está viendo ── */}
      <View style={styles.scopeBox}>
        <Icon name="info" size={14} color={Colors.accentDim} />
        <Text style={styles.scopeText}>{scope.description}</Text>
      </View>

      {/* ── Barra de búsqueda y filtros ── */}
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar código, título…"
              placeholderTextColor={Colors.textSecondary}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              testID="map-search-input"
            />
            {searchInput ? (
              <Pressable
                onPress={() => { setSearchInput(''); setSearch(''); }}
                testID="map-search-clear"
              >
                <Icon name="close" size={16} color={Colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={styles.searchBtn}
            onPress={handleSearchSubmit}
            testID="map-search-submit"
          >
            <Icon name="search" size={16} color={Colors.textOnPrimary} />
          </Pressable>
        </View>

        {/* Filtros de estado (solo si el rol ve más de un estado) */}
        {allowedStatuses.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Pressable
              onPress={() => { setFilterStatus(''); setSelected(null); }}
              style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
              testID="map-filter-all"
            >
              <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>
                Todos
              </Text>
            </Pressable>
            {allowedStatuses.map((st) => (
              <Pressable
                key={st}
                onPress={() => { setFilterStatus(st); setSelected(null); }}
                style={[
                  styles.filterChip,
                  filterStatus === st && styles.filterChipActive,
                  { borderColor: MAP_STATUS_COLORS[st] + '66' },
                  filterStatus === st && { backgroundColor: MAP_STATUS_COLORS[st] + '22' },
                ]}
                testID={`map-filter-${st}`}
              >
                <View style={[styles.filterDot, { backgroundColor: MAP_STATUS_COLORS[st] }]} />
                <Text style={[styles.filterChipText, filterStatus === st && { color: MAP_STATUS_COLORS[st] }]}>
                  {MAP_STATUS_LABELS[st] ?? st}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* ── Mapa ── */}
      <View
        style={styles.mapContainer}
        testID="map-canvas"
        {...panResponder.panHandlers}
        onLayout={(e) => {
          setMapWidth(e.nativeEvent.layout.width);
          setMapHeight(e.nativeEvent.layout.height);
        }}
      >
        {/* Tiles */}
        {mapWidth > 0 && tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            style={[styles.tile, { left: tile.left, top: tile.top }]}
            resizeMode="cover"
          />
        ))}

        {/* Overlay de carga */}
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Cargando incidentes…</Text>
          </View>
        ) : null}

        {/* Pins de incidentes */}
        {!loading && pins.map(({ incident, x, y }) => {
          const color = MAP_STATUS_COLORS[incident.status] ?? Colors.accent;
          const isSelected = selected?.id === incident.id;
          return (
            <Pressable
              key={incident.id}
              style={[
                styles.pin,
                isSelected ? styles.pinSelected : styles.pin,
                { left: x - 14, top: y - 28 },
              ]}
              onPress={() => {
                setSelected(isSelected ? null : incident);
                if (incident.location) {
                  setCenterLat(incident.location.latitude);
                  setCenterLng(incident.location.longitude);
                }
              }}
              testID={`map-pin-${incident.id}`}
            >
              <View style={[
                styles.pinBody,
                { backgroundColor: color },
                isSelected && styles.pinBodySelected,
              ]}>
                <Icon name="pin" size={isSelected ? 18 : 14} color="#FFFFFF" />
              </View>
              <View style={[styles.pinShadow, { backgroundColor: color + '44' }]} />
            </Pressable>
          );
        })}

        {/* Controles de zoom y encuadre */}
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn} onPress={handleZoomIn} testID="map-zoom-in">
            <Icon name="plus" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.zoomBtn} onPress={handleZoomOut} testID="map-zoom-out">
            <Text style={styles.zoomMinus}>−</Text>
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            style={styles.zoomBtn}
            onPress={fitAllIncidents}
            testID="map-fit-all"
          >
            <Icon name="map" size={18} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* Attribution */}
        <Text style={styles.attribution}>© Esri · Maxar · Earthstar Geographics</Text>

        {/* Error overlay */}
        {error && !loading ? (
          <View style={styles.errorOverlay}>
            <Icon name="warning" size={28} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadIncidents} style={styles.retryBtn}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Sin resultados */}
        {!loading && !error && incidents.length === 0 ? (
          <View style={styles.emptyOverlay}>
            <Icon name="map" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>
              {search || filterStatus
                ? 'No hay reportes que coincidan\ncon la búsqueda'
                : 'No hay reportes con\nubicación registrada'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Panel de detalle del pin seleccionado ── */}
      {selected ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.statusDot, { backgroundColor: MAP_STATUS_COLORS[selected.status] }]} />
            <Text style={styles.detailCode}>{selected.code}</Text>
            <PillBadge
              label={MAP_STATUS_LABELS[selected.status] ?? selected.status}
              tone={MAP_STATUS_TONES[selected.status] ?? 'neutral'}
            />
            <Pressable
              onPress={() => setSelected(null)}
              style={styles.detailClose}
              testID="map-detail-close"
            >
              <Icon name="close" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.detailTitle} numberOfLines={2}>
            {selected.title}
          </Text>

          {selected.category ? (
            <View style={styles.detailRow}>
              <Icon name="category" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailMeta}>{selected.category.name}</Text>
            </View>
          ) : null}

          {selected.location?.address ? (
            <View style={styles.detailRow}>
              <Icon name="pin" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailMeta} numberOfLines={1}>
                {selected.location.address}
              </Text>
            </View>
          ) : selected.location ? (
            <View style={styles.detailRow}>
              <Icon name="map" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailMeta}>
                {selected.location.latitude.toFixed(5)}, {selected.location.longitude.toFixed(5)}
              </Text>
            </View>
          ) : null}

          {selected.description ? (
            <Text style={styles.detailDesc} numberOfLines={3}>
              {selected.description}
            </Text>
          ) : null}

          {openDetailEnabled && onOpenIncident ? (
            <Pressable
              style={styles.detailAction}
              onPress={() => onOpenIncident(selected.id)}
              testID="map-open-detail"
            >
              <Text style={styles.detailActionText}>Ver el reporte completo</Text>
              <Icon name="chevronRight" size={16} color={Colors.textOnPrimary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── Leyenda ── */}
      {incidents.length > 0 && !selected ? (
        <View style={styles.legend}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...new Set(incidents.map((i) => i.status))].map((st) => (
              <View key={st} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MAP_STATUS_COLORS[st] }]} />
                <Text style={styles.legendText}>{MAP_STATUS_LABELS[st] ?? st}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    // @ts-ignore
    boxShadow: '0 2px 12px rgba(2,11,20,0.6)',
  },
  backBtn: {
    padding: spacing.xs,
    borderRadius: radius.element,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    marginTop: 2,
  },
  truncatedText: {
    color: Colors.accentDim,
    fontSize: fontSizes.micro,
    marginTop: 2,
  },
  refreshBtn: {
    padding: spacing.xs,
    borderRadius: radius.element,
    backgroundColor: Colors.accentSoft,
  },

  // Scope banner
  scopeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  scopeText: {
    flex: 1,
    color: Colors.accentDim,
    fontSize: fontSizes.micro,
    lineHeight: 15,
  },

  // Controls
  controls: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    // @ts-ignore
    outlineWidth: 0,
  },
  searchBtn: {
    backgroundColor: Colors.accent,
    borderRadius: radius.element,
    padding: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: spacing.xs,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  filterChipText: {
    fontSize: fontSizes.micro,
    color: Colors.textSecondary,
    fontWeight: fontWeights.semiBold,
  },
  filterChipTextActive: {
    color: Colors.accentDim,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: '#E3E9F0',
    overflow: 'hidden',
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    width: MAP_TILE_SIZE,
    height: MAP_TILE_SIZE,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(230, 236, 244, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 50,
  },
  loadingText: {
    color: Colors.accentDim,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(230, 236, 244, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    zIndex: 50,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.small,
    textAlign: 'center',
    fontWeight: fontWeights.semiBold,
  },
  retryBtn: {
    marginTop: spacing.xs,
    backgroundColor: Colors.accentSoft,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: Colors.accentDim,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(230, 236, 244, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 50,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.small,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Pins
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinSelected: {
    zIndex: 20,
  },
  pinBody: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  },
  pinBodySelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
  },
  pinShadow: {
    width: 14,
    height: 6,
    borderRadius: 3,
    marginTop: -2,
  },

  // Zoom controls
  zoomControls: {
    position: 'absolute',
    right: spacing.base,
    bottom: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.element,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    zIndex: 30,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  zoomMinus: {
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 26,
  },

  // Attribution
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    color: 'rgba(18,38,58,0.55)',
    fontSize: 10,
    // @ts-ignore
    textShadow: '0 1px 3px rgba(255,255,255,0.9)',
    zIndex: 20,
  },

  // Detail card
  detailCard: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    padding: spacing.base,
    gap: spacing.xs,
    // @ts-ignore
    boxShadow: '0 -4px 16px rgba(18,38,58,0.10)',
    maxHeight: 240,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailCode: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  detailClose: {
    marginLeft: 'auto',
    padding: 4,
  },
  detailTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semiBold,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailMeta: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    flex: 1,
  },
  detailDesc: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    lineHeight: 18,
    marginTop: 2,
  },
  detailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: radius.element,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  detailActionText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
  },

  // Legend
  legend: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: spacing.base,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
  },
});
