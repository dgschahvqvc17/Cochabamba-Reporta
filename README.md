# Sistema de Reporte y Seguimiento de Incidentes Urbanos

**Alcaldía Municipal de Cochabamba — "Cochabamba, ciudad de todos"**

Sistema multiplataforma que permite a los ciudadanos de Cochabamba reportar problemas urbanos (baches, basura, alumbrado público, espacios públicos, infraestructura, entre otros), adjuntar evidencia fotográfica, indicar la ubicación exacta y realizar seguimiento del proceso de atención con total trazabilidad. El personal municipal recibe, verifica, asigna y resuelve cada reporte, y el ciudadano recibe notificaciones de cada cambio de estado.

---

## 1. Qué hace el sistema

### Ciudadano

| Funcionalidad | Detalle |
|---|---|
| **Registro e inicio de sesión** | Creación de cuenta con validación (mayor de edad, formato de CI/teléfono/correo), sesión persistente y cierre de sesión. (HU01, HU02) |
| **Reporte de incidentes** | Formulario con categoría (obligatoria), título y descripción. (HU06) |
| **Evidencia fotográfica** | Hasta 5 imágenes por reporte, desde cámara o galería, almacenadas en Supabase Storage. (HU07) |
| **Ubicación geográfica** | Captura automática por GPS + campo de dirección, con mapa. (HU08) |
| **Mis reportes** | Lista con filtro por estado, detalle (evidencia + ubicación), edición y eliminación limitadas al estado `REPORTADO` (edición única). (HU09) |
| **Notificaciones** | Avisos automáticos en cada cambio de estado del reporte. |
| **Perfil** | Consulta de datos personales y **cambio de contraseña** (verifica la contraseña actual). |

### Personal municipal

| Rol | Funcionalidad |
|---|---|
| **Encargado de recepción** | Recibe los reportes, los marca como `RECIBIDO` y los **asigna a un verificador**. (HU10) |
| **Personal de verificación** | Ve su cola de incidentes asignados, **verifica en sitio** el problema y decide `VERIFICADO` / `RECHAZADO` (con motivo). (HU11) |
| **Encargado de solución** | Asigna los incidentes **verificados** al personal de solución responsable. (HU12) |
| **Empleados municipales** | Consultan y gestionan incidentes con búsqueda, filtros por estado/categoría/fecha y paginación. (HU09) |

### Administrador

- **Gestión de usuarios y roles (HU03):** crea usuarios internos, edita datos, activa/desactiva cuentas, asigna rol y consulta el **auditoría de cambios** (`user_audit_log`).
- **Gestión de categorías (HU04):** crea, edita y activa/desactiva categorías de incidentes.
- **Supervisión general** del sistema.

### Transversal

- **Notificaciones e historial:** cada transición de estado se registra en `history` (trazabilidad: quién, cuándo, de qué a qué estado) y genera una notificación para el ciudadano.
- **Detección de conexión:** la app muestra un **banner "Sin conexión a internet"** en tiempo real; si el ciudadano está llenando el formulario de reporte y sale sin conexión, se le advierte que **los datos ingresados se perderán**.
- **Diseño responsive:** la interfaz se adapta a móvil, tablet y escritorio.

---

## 2. Roles y permisos

| Rol | Responsabilidad |
|---|---|
| **CIUDADANO** | Crea cuenta, reporta incidentes, adjunta evidencia y ubicación, recibe notificaciones |
| **RECEPCION** | Recibe, revisa y asigna incidentes para verificación |
| **VERIFICADOR** | Comprueba en sitio la existencia del problema |
| **ENCARGADO_SOLUCION** | Asigna los incidentes verificados al área responsable |
| **PERSONAL_SOLUCION** | Atiende y soluciona el incidente |
| **ADMINISTRADOR** | Gestiona usuarios, roles, categorías y supervisa el sistema |

---

## 3. Ciclo de vida de un incidente

```text
REPORTADO → RECIBIDO → EN_VERIFICACION → VERIFICADO
         → ASIGNADO_PARA_SOLUCION → EN_ATENCION → ATENDIDO → CERRADO
```

También existe **RECHAZADO** cuando la verificación determina que el reporte no es válido.

Transiciones autorizadas (validadas por rol en el backend):

| Transición | Quién la realiza |
|---|---|
| `REPORTADO → RECIBIDO` | Encargado de recepción / Administrador |
| `REPORTADO|RECIBIDO → EN_VERIFICACION` | Asignación a verificación (HU10) |
| `EN_VERIFICACION → VERIFICADO \| RECHAZADO` | Verificación en sitio (HU11) |
| `VERIFICADO → ASIGNADO_PARA_SOLUCION` | Asignación a solución (HU12) |
| `EN_ATENCION → ATENDIDO \| RECHAZADO`, `ATENDIDO → CERRADO` | Solución del incidente |

Cada cambio de estado genera **notificación al ciudadano** y queda registrado en el **historial** con trazabilidad completa.

---

## 4. Arquitectura

Sistema **MVC** con **frontend y backend totalmente separados**, comunicados mediante una **API REST (HTTP/HTTPS)** con formato **JSON**.

```text
         USUARIO
            │
            ▼
      ┌─────────────┐
      │   FRONTEND  │   React Native (View + Controller)
      └──────┬──────┘
             │  HTTP / HTTPS (JSON)
             ▼
      ┌─────────────┐
      │   BACKEND   │   API REST (Controller + Service)
      └──────┬──────┘
             ▼
      ┌─────────────┐
      │   SUPABASE  │   PostgreSQL + Auth + Storage (Model)
      └─────────────┘
```

### Capas del backend

```text
Routes → Middleware → Controller → Service → Repository → [Supabase]
```

- **Routes** — definen endpoints, autenticación y roles, sin lógica de negocio.
- **Middleware** — `authenticate` (JWT Supabase), `requireRole`, `validate` (express-validator), `upload` (multer), manejo de errores.
- **Controller** — recibe la petición HTTP y delega en el service.
- **Service** — lógica de negocio (reglas de transición, trazabilidad, asignaciones).
- **Repository** — acceso a datos contra Supabase.
- **Supabase** — PostgreSQL (datos), Auth (identidad JWT) y Storage (evidencias).

---

## 5. Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React Native 0.86 · Expo SDK 57 · TypeScript · react-native-web 0.21 (web) |
| **Backend** | Node.js (≥ 22.11) · Express 5 · express-validator · multer |
| **Base de datos** | Supabase (PostgreSQL en la nube) |
| **Autenticación** | Supabase Auth (JWT) |
| **Almacenamiento** | Supabase Storage (bucket `evidence`) |
| **Cliente DB** | @supabase/supabase-js 2 (clientes `supabasePublic` y `supabaseAdmin`) |
| **Mobile** | expo-image-picker, expo-location, @react-native-community/netinfo, react-native-safe-area-context, react-native-svg |
| **Calidad** | Jest + jest-expo, ESLint, TypeScript (`tsc --noEmit`) |

---

## 6. Estructura del proyecto

```text
.
│
├── frontend/                     → Aplicación React Native (MVC)
│   ├── src/
│   │   ├── components/           → Componentes reutilizables (AppNavBar, AdminImageHeader,
│   │   │                           AppTextInput, AppDialog, PrimaryButton, EvidencePicker,
│   │   │                           LocationPicker, OfflineBanner, Icon, …)
│   │   ├── screens/              → Pantallas (View):
│   │   │   ├── LoginScreen / RegisterScreen
│   │   │   ├── HomeScreen / ProfileScreen / NotificationsScreen
│   │   │   ├── IncidentFormScreen / ReportsScreen
│   │   │   ├── StaffHomeScreen / IncidentsScreen / IncidentDetailScreen
│   │   │   ├── PendingVerificationScreen / AssignVerificationScreen
│   │   │   ├── VerificationQueueScreen / VerifyIncidentScreen
│   │   │   ├── PendingSolutionScreen / AssignSolutionScreen
│   │   │   ├── AdminScreen / UsersScreen / UserFormScreen / UserDetailScreen
│   │   │   └── CategoriesScreen / CategoryFormScreen
│   │   ├── controllers/          → Lógica de interacción (auth, incident, category, user, notification)
│   │   ├── services/             → Consumo de la API REST
│   │   ├── models/               → Tipos y estructuras de datos
│   │   ├── navigation/           → AppNavigator (navegación por estado y rol)
│   │   ├── hooks/                → useDialog, useNetworkStatus
│   │   ├── utils/                → session, format, location, evidence, imagePicker, networkStatus…
│   │   ├── theme/                → Design tokens (colores, tipografía, espaciado, layout)
│   │   ├── assets/               → Recursos multimedia
│   │   └── types/                → Declaraciones de tipos (imágenes)
│   ├── img/                      → Imágenes de fondo y logo
│   ├── __tests__/                → Tests (Jest)
│   ├── App.tsx  · index.js · index.web.js
│   ├── webpack.config.js         → Build web
│   └── package.json
│
├── backend/                      → API REST (MVC por capas)
│   ├── src/
│   │   ├── config/               → environment, supabase
│   │   ├── controllers/          → Controladores HTTP
│   │   ├── routes/               → auth, users, categories, incidents, notifications
│   │   ├── services/             → Lógica de negocio
│   │   ├── repositories/         → Acceso a datos (Supabase)
│   │   ├── middlewares/          → Auth, roles, validación, upload, errores
│   │   └── validators/           → express-validator (usuarios, incidentes, categorías, ubicación)
│   ├── supabase/schema.sql       → Esquema SQL completo (tablas, RLS, triggers, seed)
│   ├── .env                      → Variables de entorno (NO se sube a Git)
│   ├── .env.example
│   └── package.json
│
├── rules/                        → Documentación técnica del proyecto
├── diagramas/                    → Diagramas UML (PlantUML)
├── README-PATRONES-DE-DISENO.md  → Patrones de diseño implementados
└── .gitignore
```

---

## 7. Requisitos previos

- **Node.js** ≥ 22.11 (definido en `engines`)
- **npm** ≥ 10
- Android Studio / emulador o dispositivo físico (para correr la app en Android)
- Cuenta de **Supabase** con el proyecto configurado (ver `backend/supabase/schema.sql`)

---

## 8. Configuración de variables de entorno

### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=tu-proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu-publishable-key
SUPABASE_SECRET_KEY=tu-secret-key
SUPABASE_JWKS_URL=tu-proyecto.supabase.co/auth/v1/.well-known/jwks.json
```

> ⚠️ **Seguridad:** el archivo `.env` **nunca debe subirse a Git** (ya está ignorado en `.gitignore`). Usa `.env.example` como plantilla de referencia sin valores reales.

### Frontend

El frontend no requiere variables de entorno: la URL del API se resuelve automáticamente en `src/config/api.ts` (localhost en web, host de Metro en dispositivo).

---

## 9. Instalación y ejecución

### Backend

```bash
cd backend
npm install
npm run dev        # desarrollo (nodemon)
# o
npm start          # producción
```

El API queda disponible en `http://localhost:3000`.

Verificar la conexión con Supabase:

```bash
curl http://localhost:3000/api/health
# → { "success": true, "data": { "status": "connected", "database": "Supabase", "environment": "development" } }
```

### Frontend

```bash
cd frontend
npm install
npm start            # levanta Metro (Expo Go)
npm run android      # ejecutar en Android
npm run web          # ejecutar en navegador (webpack, puerto 8081)
npm run web:build    # build web de producción
npm test             # tests (Jest)
npx tsc --noEmit     # verificación de tipos
npm run lint         # ESLint
```

### Base de datos

Ejecutar `backend/supabase/schema.sql` en el SQL Editor de Supabase para crear el esquema (tablas, índices, triggers, RLS, bucket de storage y datos semilla de roles y categorías).

---

## 10. API REST (endpoints)

Todas las rutas operan bajo `/api/v1`. Formato de respuesta: `{ success, message, data }`.

### Autenticación — `/auth`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/register` | Registrar ciudadano | Público |
| POST | `/auth/login` | Iniciar sesión | Público |
| GET | `/auth/me` | Datos del usuario autenticado | Autenticado |
| POST | `/auth/logout` | Cerrar sesión | Autenticado |
| PATCH | `/auth/change-password` | Cambiar contraseña (verifica la actual) | Autenticado |

### Usuarios — `/users` (solo ADMINISTRADOR)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/users` | Listar usuarios (búsqueda + paginación) |
| GET | `/users/roles` | Listar roles |
| GET | `/users/:id` | Detalle del usuario + auditoría |
| POST | `/users` | Crear usuario interno |
| PATCH | `/users/:id` | Editar datos del usuario |
| PATCH | `/users/:id/status` | Activar / desactivar |
| PATCH | `/users/:id/role` | Cambiar rol |

### Categorías — `/categories`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/categories` | Listar (admin: todas; ciudadano: solo activas) | Público opcional |
| POST | `/categories` | Crear categoría | Administrador |
| PATCH | `/categories/:id` | Editar categoría | Administrador |
| PATCH | `/categories/:id/status` | Activar / desactivar | Administrador |

### Incidentes — `/incidents`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/incidents` | Registrar incidente | Ciudadano |
| GET | `/incidents` | Listar (rol-aware: ciudadano ve sus reportes; staff ve todos con búsqueda/filtros/paginación) | Autenticado |
| GET | `/incidents/:id` | Detalle (incluye evidencia, ubicación y ciudadano) | Autenticado |
| PATCH | `/incidents/:id` | Editar (solo estado REPORTADO, edición única) | Ciudadano |
| DELETE | `/incidents/:id` | Eliminar (solo estado REPORTADO) | Ciudadano |
| POST | `/incidents/:id/evidence` | Adjuntar evidencia fotográfica (máx. 5) | Ciudadano/Verificador |
| POST | `/incidents/:id/location` | Registrar ubicación | Ciudadano |
| GET | `/incidents/verifiers` | Verificadores disponibles | Recepción/Admin |
| GET | `/incidents/pending-verification` | Incidentes pendientes de verificación | Recepción/Admin |
| POST | `/incidents/:id/assign-verification` | Asignar a verificación (→ EN_VERIFICACION) | Recepción/Admin |
| GET | `/incidents/assigned-verification` | Cola del verificador | Verificador/Admin |
| POST | `/incidents/:id/verify` | Verificar (VERIFICADO / RECHAZADO) | Verificador/Admin |
| GET | `/incidents/solution-staff` | Personal de solución disponible | Encargado solución/Admin |
| GET | `/incidents/pending-solution` | Incidentes verificados pendientes de solución | Encargado solución/Admin |
| POST | `/incidents/:id/assign-solution` | Asignar a solución (→ ASIGNADO_PARA_SOLUCION) | Encargado solución/Admin |
| PATCH | `/incidents/:id/status` | Cambiar estado genérico | Recepción/Admin |
| GET | `/incidents/:id/history` | Historial de estados | Personal municipal |

### Notificaciones — `/notifications`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/notifications` | Notificaciones del usuario (más recientes primero) | Autenticado |

### Servicio

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio y conexión a Supabase |

---

## 11. Base de datos (Supabase)

El esquema completo está en `backend/supabase/schema.sql`. Incluye:

| Tabla | Descripción |
|---|---|
| `roles` | Roles del sistema (seed con los 6 roles) |
| `users` | Ciudadanos y funcionarios (auth_id ligado a Supabase Auth) |
| `categories` | Categorías de incidentes (seed con 6 categorías) |
| `incidents` | Reportes con `code` único, estado y datos del incidente |
| `evidence` | Evidencia fotográfica (URL y ruta en Storage) |
| `locations` | Ubicaciones capturadas (lat/lng + dirección) |
| `assignments` | Asignaciones (a verificación y a solución) |
| `history` | Historial de cambios de estado (trazabilidad) |
| `notifications` | Notificaciones al ciudadano |
| `user_audit_log` | Auditoría de gestión de usuarios (HU03) |

Consideraciones de seguridad:

- **Row Level Security (RLS)** habilitado en todas las tablas sin políticas: el frontend **nunca** accede a la base directamente; todo pasa por el backend con la clave *service role*.
- Triggers `set_updated_at()` para mantener `updated_at` en roles, usuarios, categorías e incidentes.
- Bucket **`evidence`** público para las imágenes de los reportes.
- Tipos enumerados `incident_status` y `assignment_type`.

---

## 12. Conectividad y pérdida de datos (offline)

La app detecta la conexión a internet en tiempo real:

- **Web:** `navigator.onLine` + eventos `online`/`offline`.
- **Móvil:** `@react-native-community/netinfo`.
- Al perder la conexión se muestra un **banner global "Sin conexión a internet"** en todas las pantallas.
- Si el ciudadano está llenando el **formulario de reporte** y presiona "Atrás" sin conexión, se muestra un diálogo de advertencia: *"Estás elaborando un reporte sin conexión. Si sales ahora, los datos que ingresaste se perderán…"* con opciones **Salir de todos modos** / **Seguir en el formulario**.

---

## 13. Pruebas y calidad

- **Jest + jest-expo:** tests unitarios del frontend (`frontend/__tests__/`): App, evidencia, ubicación, mapas.
- **TypeScript:** `npx tsc --noEmit` sin errores.
- **ESLint:** `npm run lint` sin errores.
- **Webpack:** `npm run web:build` compila la versión web.
- Verificación de sintaxis del backend con `node --check`.

---

## 14. Diagramas

Los diagramas UML (secuencia, actividades, estados, arquitectura, componentes, entidad-relación y despliegue) están en `diagramas/` en formato **PlantUML**. Ver `diagramas/README.md` para renderizarlos.

---

## 15. Plan de desarrollo (Sprints)

| Sprint | Enfoque | Historias |
|---|---|---|
| **Sprint 1** | Usuarios, autenticación y configuración | HU01 a HU05 |
| **Sprint 2** | Reporte y gestión de incidentes | HU06 a HU10 |
| **Sprint 3** | Seguimiento, solución, notificaciones y administración | HU11 a HU15 |

Implementado hasta **HU12** (asignación para solución), más notificaciones, perfil/cambio de contraseña y detección offline. Detalle completo en `rules/Sprints y HU.md`.

---

## 16. Estándares de desarrollo

- **Clean Code, SOLID, DRY, KISS.** Separación estricta de responsabilidades (UI ≠ lógica ≠ datos).
- Patrones de diseño documentados en `README-PATRONES-DE-DISENO.md`.
- Validación en frontend **y** backend (express-validator).
- Contraseñas siempre con hash seguro en Supabase Auth; nunca en texto plano.
- Endpoints protegidos por autenticación y roles (`requireRole`).
- Formato de respuesta JSON consistente: `{ success, message, data }`.
- Commits convencionales: `feat:`, `fix:`, `refactor:`, `docs:`.

---

## 17. Documentación técnica

Toda la información detallada se encuentra en `rules/`:

- **Contexto del Problema.md** — problemática y solución propuesta.
- **Arquitectura del Proyecto.md** — arquitectura MVC y stack.
- **Sprints y HU.md** — historias de usuario y criterios de aceptación.
- **Buenas Prácticas y Estándares de Desarrollo.md** — estándares del equipo.
- **Frontend.md** — guía de diseño UI/UX (colores, tipografía, componentes).
- **Backend.md** — guía de arquitectura y desarrollo del backend.