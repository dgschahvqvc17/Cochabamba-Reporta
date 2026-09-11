/**
 * Design tokens — Layout responsive (src/theme).
 *
 * Anchos máximos para que la interfaz se vea proporcionada tanto en
 * teléfonos como en pantallas grandes (web).
 *
 * @format
 */

export const layout = {
  // Contenido de pantallas con listas/formularios (móvil-first).
  contentMaxWidth: 720,
  // Tarjetas de autenticación y de perfil (login, registro, home).
  cardMaxWidth: 480,
} as const;