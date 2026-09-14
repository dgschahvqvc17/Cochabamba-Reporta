/**
 * Modelo de Categoría (MVC - Model).
 *
 * Define la estructura de datos de una categoría de incidente en el
 * frontend (HU04 — Gestionar categorías de incidentes). Incluye los
 * tipos para su registro, edición y listado.
 *
 * @format
 */

export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}

export interface CategoryListParams {
  search?: string;
}

export interface CategoryListData {
  categories: Category[];
  onlyActive: boolean;
}