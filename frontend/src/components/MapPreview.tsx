/**
 * Componente: Vista previa de mapa (MVC - componentes).
 *
 * HU08 — Registrar ubicación del incidente.
 *
 * Muestra una grilla de tiles Web Mercator (OpenStreetMap/CARTO dark)
 * centrada en la latitud/longitud capturada, con un marcador de pin en
 * el centro. Funciona en web y móvil usando solo <Image> remoto — sin
 * SDKs de mapas nativos ni claves de API.
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
import { Colors, fontSizes, radius, spacing } from '../theme';
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

      <View style={styles.shade} pointerEvents="none" />

      <View style={styles.marker} pointerEvents="none">
        <Icon name="pin" size={30} color={Colors.accent} />
      </View>

      <Text style={styles.attribution} pointerEvents="none">
        © OpenStreetMap · © CARTO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: MAP_HEIGHT,
    borderRadius: radius.element,
    overflow: 'hidden',
    backgroundColor: Colors.bgDeep,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
  },
  tile: {
    position: 'absolute',
    width: MAP_TILE_SIZE,
    height: MAP_TILE_SIZE,
  },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 9, 18, 0.25)',
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
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    color: 'rgba(232, 240, 248, 0.7)',
    fontSize: fontSizes.micro,
    // @ts-ignore — type aún no incluye textShadow (RN 0.87)
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
  },
});