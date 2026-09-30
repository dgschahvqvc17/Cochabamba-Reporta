/**
 * Componente: Vista previa de mapa (MVC - componentes).
 *
 * HU08 — Registrar ubicación del incidente.
 *
 * Muestra una grilla de tiles Web Mercator de Esri "World Street Map"
 * (estilo colorido tipo Google Maps: calles, manzanas, parques y agua)
 * centrada en la latitud/longitud capturada, con un marcador tipo
 * "punto azul" en el centro que indica exactamente dónde se está.
 * Funciona en web y móvil usando solo <Image> remoto — sin SDKs nativos
 * ni claves.
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
  esriStreetUrl,
  mercatorTile,
} from '../utils/mapTiles';

const MAP_ZOOM = 18;
const MAP_HEIGHT = 220;

type MapPreviewProps = {
  latitude: number;
  longitude: number;
};

export default function MapPreview({ latitude, longitude }: MapPreviewProps) {
  const [width, setWidth] = useState(0);

  const tile = mercatorTile(latitude, longitude, MAP_ZOOM);
  const centerX = width / 2;
  const centerY = MAP_HEIGHT / 2;

  // Cobertura mínima para que nunca queden bordes en blanco: por cada lado
  // se necesitan tiles hasta cubrir la mitad del ancho del contenedor.
  const range = Math.ceil(width / (MAP_TILE_SIZE * 2));

  const tiles: { key: string; uri: string; left: number; top: number }[] = [];

  for (let dx = -range; dx <= range; dx += 1) {
    for (let dy = -range; dy <= range; dy += 1) {
      tiles.push({
        key: `${dx}:${dy}`,
        uri: esriStreetUrl(tile.x + dx, tile.y + dy, tile.zoom),
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
              resizeMode="cover"
            />
          ))
        : null}

      {/* Marcador de precisión: "punto azul" como Google Maps */}
      <View style={[styles.marker, styles.noPointer]}>
        <View style={styles.halo} />
        <View style={styles.ring}>
          <View style={styles.dot} />
        </View>
      </View>

      {/* Etiqueta que aclara que es una referencia aproximada */}
      <View style={[styles.badge, styles.noPointer]}>
        <Icon name="map" size={11} color={Colors.accentDim} />
        <Text style={styles.badgeText}>Ubicación aproximada</Text>
      </View>

      <Text style={[styles.attribution, styles.noPointer]}>
        © Esri · Maxar · Earthstar Geographics
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 184, 0.22)',
  },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore — sombra sutil para separar el punto del mapa
    boxShadow: '0 1px 6px rgba(3, 15, 28, 0.45)',
    backgroundColor: 'rgba(59, 130, 184, 0.25)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
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