/**
 * Alcance del mapa por rol (MVC - utils).
 *
 * Espejo de `backend/src/utils/mapScope.js`: el backend decide qué
 * incidentes devuelve y el frontend solo describe esa vista para pintar
 * los filtros y explicar al usuario qué está viendo. Ambos archivos
 * mantienen los mismos estados por rol para que los chips del mapa
 * correspondan siempre con lo que realmente llega del servidor.
 *
 *   - CIUDADANO          → todos los reportes: para comprobar si el
 *                          problema que quiere reportar ya fue reportado.
 *   - RECEPCION          → los reportes que le llegan (pendientes de
 *                          verificación).
 *   - VERIFICADOR        → los que le asignaron para verificar.
 *   - ENCARGADO_SOLUCION → los verificados que debe revisar para asignar.
 *   - PERSONAL_SOLUCION  → los que le asignaron para atender.
 *   - ADMINISTRADOR      → todos los reportes.
 *
 * @format
 */

import type { IncidentStatus } from '../models/Incident';
import type { Role } from '../models/User';
import type { PillTone } from '../components/PillBadge';
import { Colors } from '../theme';

export interface MapRoleScope {
  /** Título de la pantalla del mapa para ese rol. */
  title: string;
  /** Explicación breve de qué se está viendo. */
  description: string;
  /**
   * Estados visibles en el mapa. `null` significa que el rol ve todos los
   * estados posibles (porque su alcance lo define la asignación, no el
   * estado), por lo que no se pintan chips de filtro.
   */
  statuses: IncidentStatus[] | null;
}

const TODOS_LOS_ESTADOS: IncidentStatus[] = [
  'REPORTADO',
  'RECIBIDO',
  'EN_VERIFICACION',
  'VERIFICADO',
  'ASIGNADO_PARA_SOLUCION',
  'EN_ATENCION',
  'ATENDIDO',
  'CERRADO',
  'RECHAZADO',
];

export const MAP_ROLE_SCOPES: Record<Role, MapRoleScope> = {
  CIUDADANO: {
    title: 'Mapa de la ciudad',
    description:
      'Todos los reportes con ubicación. Revisa el mapa para ver si el problema que quieres reportar ya fue registrado.',
    statuses: TODOS_LOS_ESTADOS,
  },
  RECEPCION: {
    title: 'Mapa — Reportes recibidos',
    description:
      'Los reportes que te llegan y están pendientes de verificación.',
    statuses: ['REPORTADO', 'RECIBIDO'],
  },
  VERIFICADOR: {
    title: 'Mapa — Verificaciones asignadas',
    description: 'Los incidentes que te asignaron para verificar.',
    statuses: null,
  },
  ENCARGADO_SOLUCION: {
    title: 'Mapa — Pendientes de solución',
    description:
      'Los incidentes verificados que tienes que revisar para asignar la solución.',
    statuses: ['VERIFICADO'],
  },
  PERSONAL_SOLUCION: {
    title: 'Mapa — Casos asignados',
    description: 'Los incidentes que te asignaron para atender.',
    statuses: null,
  },
  ADMINISTRADOR: {
    title: 'Mapa global de incidentes',
    description: 'Todos los incidentes con ubicación registrada.',
    statuses: TODOS_LOS_ESTADOS,
  },
};

/** Colores de los marcadores por estado (leyenda del mapa). */
export const MAP_STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTADO: Colors.accent,
  RECIBIDO: Colors.accent,
  EN_VERIFICACION: Colors.warning,
  VERIFICADO: Colors.success,
  ASIGNADO_PARA_SOLUCION: Colors.warning,
  EN_ATENCION: Colors.warningDim,
  ATENDIDO: Colors.success,
  CERRADO: Colors.textSecondary,
  RECHAZADO: Colors.danger,
};

export const MAP_STATUS_LABELS: Record<IncidentStatus, string> = {
  REPORTADO: 'Reportado',
  RECIBIDO: 'Recibido',
  EN_VERIFICACION: 'En verificación',
  VERIFICADO: 'Verificado',
  ASIGNADO_PARA_SOLUCION: 'Asignado para solución',
  EN_ATENCION: 'En atención',
  ATENDIDO: 'Atendido',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};

export const MAP_STATUS_TONES: Record<IncidentStatus, PillTone> = {
  REPORTADO: 'accent',
  RECIBIDO: 'accent',
  EN_VERIFICACION: 'warning',
  VERIFICADO: 'success',
  ASIGNADO_PARA_SOLUCION: 'warning',
  EN_ATENCION: 'warning',
  ATENDIDO: 'success',
  CERRADO: 'neutral',
  RECHAZADO: 'danger',
};

/** Alcance del mapa de un rol; si el rol no existe, se muestra la vista completa. */
export function mapScopeFor(role: Role | undefined | null): MapRoleScope {
  if (role && MAP_ROLE_SCOPES[role]) {
    return MAP_ROLE_SCOPES[role];
  }

  return MAP_ROLE_SCOPES.ADMINISTRADOR;
}
