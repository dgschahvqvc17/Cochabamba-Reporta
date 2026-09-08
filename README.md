# Sistema de Reporte y Seguimiento de Incidentes Urbanos

**Alcaldía Municipal de Cochabamba — "Cochabamba, ciudad de todos"**

Sistema multiplataforma que permite a los ciudadanos de Cochabamba reportar problemas urbanos (baches, basura, alumbrado público, espacios públicos, infraestructura, entre otros), adjuntar evidencia fotográfica, indicar la ubicación exacta y realizar seguimiento del proceso de atención con total trazabilidad.

---

## 1. Alcance

Plataformas soportadas:

- 📱 Android
- 📱 iOS
- 🌐 Web
- 💻 Escritorio

Roles del sistema:

| Rol | Responsabilidad |
|---|---|
| **Ciudadano** | Crea cuenta, reporta incidentes, adjunta evidencia y ubicación, recibe notificaciones |
| **Encargado de recepción** | Recibe, revisa y asigna incidentes para verificación |
| **Personal de verificación** | Comprueba en sitio la existencia del problema |
| **Encargado de solución** | Asigna los incidentes verificados al área responsable |
| **Personal de solución** | Atiende y soluciona el incidente |
| **Administrador** | Gestiona usuarios, roles, categorías y supervisa el sistema |

### Estados de un incidente

```text
REPORTADO → RECIBIDO → EN_VERIFICACION → VERIFICADO
         → ASIGNADO_PARA_SOLUCION → EN_ATENCION → ATENDIDO → CERRADO
```

También existe **RECHAZADO** cuando la verificación determina que el reporte no es válido. Cada cambio de estado genera **notificación al ciudadano** y queda registrado en el **historial**.

---

## 2. Arquitectura

El sistema sigue el patrón **MVC** con **frontend y backend totalmente separados**, comunicados mediante una **API REST (HTTP/HTTPS)** con formato **JSON**.

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
Routes → Middleware → Controller → Service → [Supabase: PostgreSQL/Auth/Storage]
```

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React Native 0.87 + TypeScript, arquitectura MVC |
| **Backend** | Node.js + Express (API REST) |
| **Base de datos** | Supabase (PostgreSQL en la nube) |
| **Autenticación** | Supabase Auth (JWT) |
| **Almacenamiento de evidencias** | Supabase Storage |
| **ORM/Cliente** | @supabase/supabase-js |

---

## 4. Estructura del proyecto

```text
.
│
├── frontend/                    → Aplicación React Native (MVC)
│   ├── src/
│   │   ├── components/          → Componentes reutilizables
│   │   ├── screens/             → Pantallas (View)
│   │   ├── controllers/         → Lógica de interacción (Controller)
│   │   ├── models/              → Estructuras de datos (Model)
│   │   ├── services/            → Consumo de la API REST
│   │   ├── navigation/          → Navegación de la app
│   │   └── assets/              → Recursos, logos, colores
│   ├── App.tsx
│   └── package.json
│
├── backend/                     → API REST (MVC por capas)
│   ├── src/
│   │   ├── config/              → environment, database, supabase
│   │   ├── controllers/         → Controladores HTTP
│   │   ├── models/              → Modelos de datos
│   │   ├── routes/              → Endpoints de la API
│   │   ├── services/            → Lógica de negocio
│   │   └── middlewares/         → Auth, roles, validación, errores
│   ├── .env                     → Variables de entorno (NO se sube a Git)
│   ├── .env.example
│   └── package.json
│
├── rules/                       → Documentación técnica del proyecto
│   ├── Contexto del Problema.md
│   ├── Arquitectura del Proyecto.md
│   ├── Sprints y HU.md
│   ├── Buenas Prácticas y Estándares de Desarrollo.md
│   ├── Frontend.md              → Guía de diseño UI/UX
│   └── Backend.md               → Guía de arquitectura y desarrollo
│
└── .gitignore
```

---

## 5. Requisitos previos

- **Node.js** ≥ 20 (desarrollado con Node 24)
- **npm** ≥ 10
- Android Studio / emulador o dispositivo (para correr la app en Android)
- Cuenta de **Supabase** con el proyecto configurado

---

## 6. Configuración de variables de entorno

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

---

## 7. Instalación y ejecución

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
# → { "success": true, "data": { "status": "connected", "database": "Supabase" } }
```

### Frontend

```bash
cd frontend
npm install
npm start                       # levanta Metro
npm run android                 # ejecutar en Android
npm test                        # tests (Jest)
npx tsc --noEmit                # verificación de tipos
```

---

## 8. API REST (endpoints principales)

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/auth/register` | Registrar ciudadano |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/health` | Estado del servicio y Supabase |
| GET | `/api/v1/incidents` | Listar incidentes |
| POST | `/api/v1/incidents` | Registrar incidente |
| GET | `/api/v1/incidents/:id` | Detalle de incidente |
| POST | `/api/v1/incidents/:id/evidence` | Adjuntar evidencia |
| POST | `/api/v1/incidents/:id/location` | Registrar ubicación |
| PATCH | `/api/v1/incidents/:id/status` | Cambiar estado |
| GET | `/api/v1/incidents/:id/history` | Historial |
| GET | `/api/v1/categories` | Categorías activas |
| GET | `/api/v1/notifications` | Notificaciones del usuario |

> El versionado de endpoints se realiza bajo `/api/v1`. Las rutas actuales de arranque del proyecto se encuentran en `backend/src/routes/`.

---

## 9. Supabase

El proyecto utiliza **Supabase** como backend de datos:

- **PostgreSQL:** base de datos principal (tablas a definir: `users`, `incidents`, `categories`, `evidence`, `locations`, `assignments`, `history`, `notifications`).
- **Auth:** autenticación de ciudadanos y funcionarios (JWT).
- **Storage:** almacenamiento de las evidencias fotográficas de los incidentes.

La conexión se centraliza en `backend/src/config/supabase.js`, que expone:

- `supabasePublic` → cliente con clave **publishable** (anon).
- `supabaseAdmin` → cliente con clave **secret** (service role), para operaciones privilegiadas del backend.

Solo la clave **publishable** (o un JWT de sesión) debe usarse directamente desde el frontend. La clave **secret** es únicamente para el servidor.

---

## 10. Base de datos propuesta (Supabase)

| Tabla | Descripción |
|---|---|
| `users` | Ciudadanos y funcionarios (nombres, CI, teléfono, email, rol, activo) |
| `roles` | Roles del sistema (Ciudadano, Recepción, Verificación, Solución, Administrador) |
| `categories` | Categorías de incidentes (Residuos, Baches, Alumbrado, Espacios públicos, Infraestructura, Otros) |
| `incidents` | Reportes (`status`, título, descripción, lat/lng, fechas) |
| `evidence` | Evidencia fotográfica (URL en Storage) |
| `locations` | Ubicaciones capturadas |
| `assignments` | Asignaciones a verificadores y personal de solución |
| `history` | Historial de cambios de estado (trazabilidad) |
| `notifications` | Notificaciones enviadas al ciudadano |

---

## 11. Plan de desarrollo (Sprints)

| Sprint | Enfoque | Historias |
|---|---|---|
| **Sprint 1** | Usuarios, autenticación y configuración | HU01 a HU05 |
| **Sprint 2** | Reporte y gestión de incidentes | HU06 a HU10 |
| **Sprint 3** | Seguimiento, solución, notificaciones y administración | HU11 a HU15 |

Detalle completo en `rules/Sprints y HU.md`.

---

## 12. Estándares de desarrollo

- **Clean Code, SOLID, DRY, KISS.**
- Separación estricta de responsabilidades (UI ≠ lógica ≠ datos).
- Validación en frontend **y** backend.
- Contraseñas siempre con hash seguro; nunca en texto plano.
- Endpoints protegidos por autenticación y roles.
- Formato de respuesta JSON consistente: `{ success, message, data }`.
- Commits convencionales: `feat:`, `fix:`, `refactor:`, `docs:`.
- Control de versiones con Git (ramas `feature/`).

---

## 13. Documentación

Toda la información técnica se encuentra en la carpeta `rules/`:

- **Contexto del Problema.md** — problemática y solución propuesta.
- **Arquitectura del Proyecto.md** — arquitectura MVC y stack.
- **Sprints y HU.md** — historias de usuario y criterios de aceptación.
- **Buenas Prácticas y Estándares de Desarrollo.md** — estándares del equipo.
- **Frontend.md** — guía de diseño UI/UX (colores, tipografía, componentes).
- **Backend.md** — guía de arquitectura y desarrollo del backend.