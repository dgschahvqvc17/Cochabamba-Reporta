# Diagramas UML del sistema (PlantUML)

Diagramas del Sistema de Reporte y Seguimiento de Incidentes Urbanos.
Cada archivo `.puml` contiene código listo para renderizar.

## Cómo dibujarlos

**Opción 1 — PlantUML Online (sin instalar nada):**
1. Abre https://www.plantuml.com/plantuml
2. Pega el contenido del archivo `.puml` y se dibuja al instante.

**Opción 2 — PlantText:**
1. Abre https://www.planttext.com/
2. Pega el contenido y click en "Render".

**Opción 3 — VSCode (local):**
1. Instala la extensión **PlantUML** (jebbs.plantuml).
2. Abre un `.puml` y usa `Alt+D` para previsualizar o `Ctrl+Shift+P` → "Export Current Diagram".

## Contenido

| # | Archivo | Tipo | Alcance |
|---|---------|------|---------|
| 01 | `01_asignacion_y_seguimiento_inicial.puml` | Secuencia | HU10: asignación a verificación + seguimiento, historial y notificaciones. |
| 02 | `02_flujo_funcional_verificacion.puml` | Actividad | HU11: decisión VERIFICADO/RECHAZADO con validaciones (422/403/409). |
| 03 | `03_diagrama_de_estados_incidente.puml` | Estados | Ciclo de vida completo REPORTADO → … → CERRADO / RECHAZADO (HU12-14 como estados futuros). |
| 04 | `04_arquitectura_tecnica_hasta_verificacion.puml` | Arquitectura | Capas Frontend → API REST → Services → Repositories → Supabase, avance hasta HU11. |
| 05 | `05_componentes_sistema_actual.puml` | Componentes | Controllers/Services/Repositories por dominio y sus dependencias con Supabase. |
| 06 | `06_modelo_entidad_relacion.puml` | Entidad-Relación | 10 tablas del esquema con claves y relaciones generales. |
| 07 | `07_diagrama_de_despliegue.puml` | Despliegue | Nodos físicos: app móvil, backend Node/Express y Supabase Cloud. |

## Nota de avance

Las historias verificadas en el avance actual son **HU01, HU02, HU03, HU06,
HU07, HU08, HU09, HU10 y HU11**. La etapa de solución (HU12-HU14) aparece
marcada como *futuro* en los diagramas 03 y 04; cuando se implemente, solo
se agregan componentes/estados sin cambiar la estructura.