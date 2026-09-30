/**
 * Pruebas unitarias — Mapa interactivo (utils/mapScope.ts + mapTiles.ts).
 *
 * Verifica que cada rol vea en el mapa lo que le corresponde (el mismo
 * alcance que aplica el backend en utils/mapScope.js) y que el arrastre y
 * el encuadre de puntos usen correctamente la proyección Web Mercator.
 *
 * @format
 */

import type { Role } from '../src/models/User';
import {
  MAP_ROLE_SCOPES,
  MAP_STATUS_LABELS,
  mapScopeFor,
} from '../src/utils/mapScope';
import {
  DEFAULT_MAP_ZOOM,
  MAX_TILE_ZOOM,
  fitPointsToView,
  lonLatToWorld,
  panCenter,
  worldToLonLat,
} from '../src/utils/mapTiles';

const COCHABAMBA = { latitude: -17.3935, longitude: -66.157 };

describe('mapScope utils', () => {
  test('el ciudadano ve todos los estados del ciclo de vida', () => {
    const scope = mapScopeFor('CIUDADANO');
    expect(scope.statuses).toEqual(
      expect.arrayContaining(['REPORTADO', 'CERRADO', 'RECHAZADO']),
    );
  });

  test('recepción solo ve los reportes que le llegan', () => {
    expect(MAP_ROLE_SCOPES.RECEPCION.statuses).toEqual([
      'REPORTADO',
      'RECIBIDO',
    ]);
  });

  test('el encargado de solución ve los verificados que debe revisar', () => {
    expect(MAP_ROLE_SCOPES.ENCARGADO_SOLUCION.statuses).toEqual(['VERIFICADO']);
  });

  test('verificador y personal de solución no filtran por estado (manda la asignación)', () => {
    expect(MAP_ROLE_SCOPES.VERIFICADOR.statuses).toBeNull();
    expect(MAP_ROLE_SCOPES.PERSONAL_SOLUCION.statuses).toBeNull();
  });

  test('el administrador ve todos los estados', () => {
    expect(mapScopeFor('ADMINISTRADOR').statuses).toContain('VERIFICADO');
  });

  test('un rol desconocido cae en la vista completa, nunca en una vacía', () => {
    const scope = mapScopeFor('ROL_INEXISTENTE' as Role);
    expect(scope.statuses).toContain('REPORTADO');
  });

  test('cada estado visible tiene etiqueta y color para la leyenda', () => {
    Object.values(MAP_ROLE_SCOPES).forEach((scope) => {
      (scope.statuses ?? []).forEach((status) => {
        expect(MAP_STATUS_LABELS[status]).toBeTruthy();
      });
    });
  });
});

describe('mapTiles — arrastre y encuadre', () => {
  test('lonLatToWorld y worldToLonLat son inversas', () => {
    const world = lonLatToWorld(COCHABAMBA.latitude, COCHABAMBA.longitude);
    const back = worldToLonLat(world.x, world.y);

    expect(back.latitude).toBeCloseTo(COCHABAMBA.latitude, 6);
    expect(back.longitude).toBeCloseTo(COCHABAMBA.longitude, 6);
  });

  test('panCenter sin desplazamiento devuelve el mismo centro', () => {
    const same = panCenter(
      COCHABAMBA.latitude,
      COCHABAMBA.longitude,
      13,
      0,
      0,
    );

    expect(same.latitude).toBeCloseTo(COCHABAMBA.latitude, 6);
    expect(same.longitude).toBeCloseTo(COCHABAMBA.longitude, 6);
  });

  test('desplazar el centro a la derecha lo lleva hacia el este', () => {
    const moved = panCenter(
      COCHABAMBA.latitude,
      COCHABAMBA.longitude,
      13,
      200,
      0,
    );

    expect(moved.longitude).toBeGreaterThan(COCHABAMBA.longitude);
    expect(moved.latitude).toBeCloseTo(COCHABAMBA.latitude, 6);
  });

  test('desplazar el centro hacia abajo lo lleva hacia el sur', () => {
    const moved = panCenter(
      COCHABAMBA.latitude,
      COCHABAMBA.longitude,
      13,
      0,
      200,
    );

    expect(moved.latitude).toBeLessThan(COCHABAMBA.latitude);
    expect(moved.longitude).toBeCloseTo(COCHABAMBA.longitude, 6);
  });

  test('fitPointsToView sin puntos ni viewport devuelve null', () => {
    expect(fitPointsToView([], 400, 300)).toBeNull();
    expect(fitPointsToView([COCHABAMBA], 0, 0)).toBeNull();
  });

  test('fitPointsToView centra el conjunto de reportes y respeta el zoom máximo', () => {
    const view = fitPointsToView(
      [
        { latitude: -17.38, longitude: -66.17 },
        { latitude: -17.41, longitude: -66.14 },
      ],
      400,
      300,
    );

    expect(view).not.toBeNull();
    expect(view!.zoom).toBeLessThanOrEqual(MAX_TILE_ZOOM);

    // El centro cae entre los dos puntos extremos del conjunto.
    expect(view!.latitude).toBeGreaterThan(-17.41);
    expect(view!.latitude).toBeLessThan(-17.38);
    expect(view!.longitude).toBeGreaterThan(-66.17);
    expect(view!.longitude).toBeLessThan(-66.14);
  });

  test('un solo reporte se encuadra con el zoom de partida (sin acercar al máximo)', () => {
    const view = fitPointsToView([COCHABAMBA], 400, 300);

    expect(view!.zoom).toBe(DEFAULT_MAP_ZOOM);
    expect(view!.latitude).toBeCloseTo(COCHABAMBA.latitude, 6);
    expect(view!.longitude).toBeCloseTo(COCHABAMBA.longitude, 6);
  });

  test('varios reportes en el mismo punto no fuerzan el zoom máximo', () => {
    const view = fitPointsToView([COCHABAMBA, COCHABAMBA, COCHABAMBA], 400, 300);

    expect(view!.zoom).toBe(DEFAULT_MAP_ZOOM);
  });
});
