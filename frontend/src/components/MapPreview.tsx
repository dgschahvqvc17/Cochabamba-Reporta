/**
 * Componente: Vista previa de mapa (MVC - componentes).
 *
 * HU08 — Registrar ubicación del incidente.
 *
 * Muestra una grilla de tiles Web Mercator (CARTO light) centrada en la
 * latitud/longitud capturada, con un marcador de precisión (punto central
 * + pin) en el centro. Usa un mapa claro, legible e intuitivo que funciona
 * en web y móvil usando solo <Image> remoto — sin SDKs nativos ni claves.
 *
 * @format
 */

import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon from './Icon';
import { Colors, fontSizes, fontWeights, radius, spacing } from '../theme';
import {
  MAP_TILE_SIZE,
  mercatorTile,
  tileUrl,
} from '../utils/mapTiles';

const MAP_ZOOM = 16;
const NEIGHBOR_RANGE = 1;
const MAP_HEIGHT = 200;

type MapPreviewProps = {
  latitude: number;
  longitude: number;
};

export default function MapPreview({ latitude, longitude }: MapPreviewProps) {
  const [width, setWidth] = useState(0);

  const tile = mercatorTile(latitude, longitude, MAP_ZOOM);
  const centerX = width / 2;
  const centerY = MAP_HEIGHT / 2;

  const tiles: { key: string; uri: string; left: number; top: number }[] = [];

  for (let dx = -NEIGHBOR_RANGE; dx <= NEIGHBOR_RANGE; dx += 1) {
    for (let dy = -NEIGHBOR_RANGE; dy <= NEIGHBOR_RANGE; dy += 1) {
      tiles.push({
        key: `${dx}:${dy}`,
        uri: tileUrl(tile.x + dx, tile.y + dy, tile.zoom),
        left: Math.round(centerX - tile.offsetX * MAP_TILE_SIZE + dx * MAP_TILE_SIZE),
        top: Math.round(centerY - tile.offsetY * MAP_TILE_SIZE + dy * MAP_TILE_SIZE),
      });
    }
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0
        ? tiles.map((item) => (
            <Image
              key={item.key}
              source={{ uri: item.uri }}
              style={[styles.tile, { left: item.left, top: item.top }]}
            />
          ))
        : null}

      {/* Marcador de precisión: punto de mira + pin */}
      <View style={[styles.marker, styles.noPointer]}>
        <View style={styles.halo} />
        <View style={styles.crosshair}>
          <View style={styles.crosshairCenter} />
        </View>
        <View style={styles.pin}>
          <Icon name="pin" size={20} color={Colors.textOnPrimary} />
        </View>
      </View>

      {/* Etiqueta que aclara que es una referencia aproximada */}
      <View style={[styles.badge, styles.noPointer]}>
        <Icon name="map" size={11} color={Colors.accentDim} />
        <Text style={styles.badgeText}>Ubicación aproximada</Text>
      </View>

      <Text style={[styles.attribution, styles.noPointer]}>
        © OpenStreetMap · © CARTO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noPointer: {
    // @ts-ignore — pointerEvents as style is the new API (evita la deprecación en web)
    pointerEvents: 'none',
  },
  wrap: {
    height: MAP_HEIGHT,
    borderRadius: radius.element,
    overflow: 'hidden',
    backgroundColor: '#E3E9F0',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.28)',
  },
  tile: {
    position: 'absolute',
    width: MAP_TILE_SIZE,
    height: MAP_TILE_SIZE,
  },
  marker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(59, 130, 184, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 184, 0.45)',
  },
  crosshair: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore — sombra sutil para separar el punto del mapa
    boxShadow: '0 1px 6px rgba(3, 15, 28, 0.35)',
  },
  crosshairCenter: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accentDim,
  },
  pin: {
    position: 'absolute',
    top: -8,
    right: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.textOnPrimary,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 184, 0.3)',
  },
  badgeText: {
    color: Colors.accentDim,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.2,
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    color: 'rgba(18, 38, 58, 0.65)',
    fontSize: fontSizes.micro,
    // @ts-ignore — type aún no incluye textShadow (RN 0.87)
    textShadow: '0 1px 3px rgba(255,255,255,0.9)',
  },
});