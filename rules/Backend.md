# Backend — Guía de Arquitectura y Desarrollo

Este documento define la arquitectura, estructura, convenciones y estándares del **backend** del *Sistema Multiplataforma de Reporte y Seguimiento de Incidentes Urbanos* para la **Alcaldía Municipal de Cochabamba**.

El backend es una **API REST** independiente, organizada bajo el patrón **MVC** con una separación adicional por capas (Routes → Controller → Service → Repository), permitiendo un sistema modular, seguro, escalable y fácil de mantener.

---

## 1. Tecnología y stack sugerido

| Área | Tecnología |
|---|---|
| Runtime | **Node.js** |
| Framework | **Express.js** |
| Lenguaje | **JavaScript** (o **TypeScript** si el equipo lo decide) |
| Base de datos | **MySQL / PostgreSQL** (relacional) |
| ORM | **Sequelize** o **Prisma** |
| Autenticación | **JSON Web Tokens (JWT)** |
| Hash de contraseñas | **bcrypt** (o Argon2) |
| Validación | **express-validator** / **Joi** |
| Logs | **Winston** / **Morgan** |
| Almacenamiento de evidencias | Almacenamiento externo (local/bucket/S3), referencia URL en BD |
| Entorno | Variables de entorno (`.env`) |

> Si el equipo prefiere **TypeScript + NestJS**, la estructura por capas se mantiene equivalente. La decisión debe quedar registrada aquí antes de iniciar el Sprint 1.

---

## 2. Arquitectura por capas (MVC + capas)

El backend sigue una estricta separación de responsabilidades.

```text
         FRONTEND (React Native)
                │
                │ HTTP / HTTPS (JSON)
                ▼
             ROUTES
                │
                ▼
          MIDDLEWARE   (auth, roles, validación, errores)
                │
                ▼
           CONTROLLER  (recibe request / responde)
                │
                ▼
            SERVICE     (lógica de negocio)
                │
                ▼
         REPOSITORY     (acceso a datos)
                │
                ▼
           DATABASE
```

**Regla fundamental:** cada capa hace una sola cosa y comunica con la siguiente mediante responsabilidades definidas.

- **Routes:** definen endpoints, sin lógica de negocio.
- **Middleware:** autenticación, autorización por roles, validación y manejo de errores.
- **Controller:** ligero, recibe la petición, llama al service y devuelve la respuesta.
- **Service:** contiene la lógica de negocio (validaciones de reglas, cambios de estado, trazabilidad).
- **Repository:** consultas y operaciones sobre la base de datos.
- **Model:** definición y estructura de los datos.

---

## 3. Estructura de carpetas

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── database.js        → Conexión a la BD
│   │   └── environment.js     → Lectura de variables de entorno
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── incident.controller.js
│   │   ├── category.controller.js
│   │   └── notification.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── incident.service.js
│   │   ├── category.service.js
│   │   └── notification.service.js
│   │
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── incident.repository.js
│   │   ├── category.repository.js
│   │   └── notification.repository.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── incident.model.js
│   │   ├── category.model.js
│   │   ├── evidence.model.js
│   │   ├── location.model.js
│   │   ├── assignment.model.js
│   │   ├── history.model.js
│   │   └── notification.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── incident.routes.js
│   │   ├── category.routes.js
│   │   └── notification.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js    → Verifica JWT
│   │   ├── role.middleware.js    → Autorización por rol
│   │   ├── validation.middleware.js → Valida request
│   │   ├── upload.middleware.js  → Validación de archivos
│   │   └── error.middleware.js   → Manejo centralizado de errores
│   │
│   ├── validators/
│   │   ├── user.validator.js
│   │   ├── incident.validator.js
│   │   └── category.validator.js
│   │
│   ├── utils/
│   │   ├── response.js
│   │   ├── logger.js
│   │   └── password.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 4. Modelos de datos (Model)

Modelos principales:

| Modelo | Descripción |
|---|---|
| `User` | Ciudadanos y funcionarios (nombres, apellidos, CI, teléfono, email, password_hash, rol) |
| `Role` | Roles del sistema (Ciudadano, Recepción, Verificación, Solución, Encargado, Administrador) |
| `Category` | Categorías de incidentes (Residuos, Baches, Alumbrado, Espacios públicos, Infraestructura, Otros) |
| `Incident` | Reporte del ciudadano (categoría, título, descripción, estado, fecha, usuario, ubicación) |
| `Evidence` | Evidencia fotográfica (URL / referencia, tipo, tamaño, asociada al incidente) |
| `Location` | Ubicación (latitud, longitud, dirección, fecha de captura) |
| `Assignment` | Asignaciones (incidente, funcionario asignado, encargado, tipo asignación, fecha) |
| `History` | Historial de cambios de estado (incidente, estado anterior, estado nuevo, usuario, fecha, observación) |
| `Notification` | Notificaciones al ciudadano (incidente, mensaje, leída, fecha) |

### Convenciones de modelos

- Usar nombres en **camelCase** para campos y **plural** para tablas.
- Relaciones definidas explícitamente (Incident → User, Incident → Category, Incident → History, etc.).
- Timestamps automáticos (`created_at`, `updated_at`).
- Índices para búsquedas frecuentes (estado, categoría, fecha, usuario).

---

## 5. API REST — Convenciones de endpoints

### 5.1 Base y versionado

```text
/api/v1/...
```

### 5.2 Métodos y recursos

| Método | Uso |
|---|---|
| GET | Consultar información |
| POST | Crear información |
| PUT | Actualizar completamente |
| PATCH | Actualizar parcialmente |
| DELETE | Eliminar información |

### 5.3 Endpoints principales

```text
# Autenticación
POST   /api/v1/auth/register            # Registrar ciudadano (HU01)
POST   /api/v1/auth/login               # Iniciar sesión (HU02)
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh

# Usuarios / Roles (HU03)
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users                    # (admin, usuarios internos)
PATCH  /api/v1/users/:id
PATCH  /api/v1/users/:id/status         # activar/desactivar
PATCH  /api/v1/users/:id/role           # asignar rol

# Categorías (HU04)
GET    /api/v1/categories
POST   /api/v1/categories
PATCH  /api/v1/categories/:id
PATCH  /api/v1/categories/:id/status

# Incidentes (HU06, HU09, ...)
GET    /api/v1/incidents               # listar (filtros: estado, categoría, fecha)
GET    /api/v1/incidents/:id
POST   /api/v1/incidents               # registrar incidente (HU06)
PATCH  /api/v1/incidents/:id/status    # cambiar estado (asignación, etc.)
POST   /api/v1/incidents/:id/evidence  # evidencia fotográfica (HU07)
POST   /api/v1/incidents/:id/location  # ubicación (HU08)
POST   /api/v1/incidents/:id/assign-verification   # (HU10)
POST   /api/v1/incidents/:id/verify                # (HU11)
POST   /api/v1/incidents/:id/assign-solution       # (HU12)
POST   /api/v1/incidents/:id/complete              # atender/cerrar (HU13)
GET    /api/v1/incidents/:id/history    # historial de cambios

# Notificaciones (HU14)
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/read
```

### 5.4 Filtros y paginación

- Listas con **paginación** (`page`, `limit`).
- Filtros tipo query: `?status=VERIFICADO&category=1&from=2026-01-01&to=2026-09-08`.

---

## 6. Formato estándar de respuestas

El backend debe **siempre** devolver un formato consistente.

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Incidente registrado correctamente",
  "data": {
    "id": 125,
    "status": "REPORTED"
  }
}
```

### Respuesta de error

```json
{
  "success": false,
  "message": "No se pudo registrar el incidente",
  "error": {
    "code": "INCIDENT_CREATION_ERROR"
  }
}
```

**Reglas:**
- No enviar contraseñas, tokens, ni stack traces internos al cliente.
- Usar códigos HTTP apropiados (200, 201, 400, 401, 403, 404, 409, 422, 500).
- Mensajes comprensibles para el frontend.

---

## 7. Estados oficiales de los incidentes

```text
REPORTADO
    ↓
RECIBIDO
    ↓
EN_VERIFICACION
    ↓
VERIFICADO
    ↓
ASIGNADO_PARA_SOLUCION
    ↓
EN_ATENCION
    ↓
ATENDIDO
    ↓
CERRADO
```

También existe **RECHAZADO** (cuando la verificación determina que el reporte no es válido).

**Todos los estados como constantes en `utils/incidentStatus.js`** (evitar valores mágicos, principio DRY).

```js
const INCIDENT_STATUS = {
  REPORTADO: 'REPORTADO',
  RECIBIDO: 'RECIBIDO',
  EN_VERIFICACION: 'EN_VERIFICACION',
  VERIFICADO: 'VERIFICADO',
  ASIGNADO_PARA_SOLUCION: 'ASIGNADO_PARA_SOLUCION',
  EN_ATENCION: 'EN_ATENCION',
  ATENDIDO: 'ATENDIDO',
  CERRADO: 'CERRADO',
  RECHAZADO: 'RECHAZADO',
};
```

### Flujo de cambio de estado (transiciones válidas)

Cada transición debe ser validada para impedir saltos inválidos.

```text
Transición válida?  sí → 1. Actualizar incidente
                      │      2. Registrar historial
                      │      3. Registrar usuario responsable
                      │      4. Registrar fecha y hora
                      │      5. Generar notificación
                      │      6. Notificar al ciudadano
                      no → 400 Bad Request
```

---

## 8. Roles y autorización

| Rol | Permisos principales |
|---|---|
| **CIUDADANO** | Crear/consultar sus propios incidentes, recibir notificaciones |
| **RECEPCION** | Recibir y asignar incidentes para verificación |
| **VERIFICADOR** | Verificar incidentes asignados (confirmar/rechazar) |
| **ENCARGADO_SOLUCION** | Asignar incidentes verificados para su solución |
| **PERSONAL_SOLUCION** | Atender incidentes asignados, marcar atendido/cerrado |
| **ADMINISTRADOR** | Gestionar usuarios, roles, categorías, supervisar |

La autorización se aplica en el **middleware de roles** por cada ruta protegida.

```text
GET /api/v1/incidents                 → autenticado
POST /api/v1/incidents                → CIUDADANO
POST /api/v1/incidents/:id/verify     → VERIFICADOR
PATCH /api/v1/users/:id/role          → ADMINISTRADOR
```

---

## 9. Autenticación y seguridad

- **JWT** para autenticación, firmado con secreto de variables de entorno.
- **bcrypt** (o Argon2) para hash de contraseñas; **nunca** almacenar en texto plano.
- Middleware de autenticación valida el token y adjunta el usuario a la petición.
- Middleware de roles verifica si el usuario tiene permiso.
- **Validar toda entrada** en el backend, nunca confiar solo en las validaciones del frontend.
- Validar archivos (formato, tamaño, cantidad) antes de almacenar evidencias.

---

## 10. Gestión de evidencias (imágenes)

```text
Ciudadano → Fotografía → Backend (upload.middleware) → Almacenamiento → URL/ref → BD
```

- Validar tipo MIME y extensión permitidas (`.jpg`, `.png`, `.webp`).
- Limitar tamaño máximo (constante `MAX_IMAGE_SIZE`).
- Limitar número de imágenes por incidente.
- Almacenar referencia/URL en `Evidence`, no el binario en la BD.

---

## 11. Notificaciones y trazabilidad

Cada cambio de estado debe:

1. Actualizar el incidente.
2. Registrar en `History` (incidente, estado anterior, estado nuevo, usuario, fecha, observación).
3. Insertar en `Notification` (incidente, mensaje, leída=false) dirigida al ciudadano.

Esto garantiza que el ciudadano conozca el avance y que exista total trazabilidad.

---

## 12. Manejo de errores y logs

- **error.middleware.js** centraliza el manejo de errores.
- Se registran errores, solicitudes importantes, cambios de estado y fallos de conexión con **Winston**.
- Nunca registrar contraseñas, tokens ni datos sensibles.

### Códigos HTTP de referencia

```text
200 → Éxito
201 → Creado
400 → Solicitud incorrecta
401 → No autenticado
403 → Sin permisos
404 → No encontrado
409 → Conflicto
422 → Datos inválidos
500 → Error interno
```

---

## 13. Variables de entorno

```env
PORT=3000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=urban_reports
DATABASE_USER=root
DATABASE_PASSWORD=********

JWT_SECRET=********
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3000
```

- El archivo **`.env` no se sube a Git**.
- **`.env.example`** contiene solo los nombres de variables, sin valores reales.
- Todo secreto debe leerse desde el entorno a través de `config/environment.js`.

---

## 14. Estándares de código y calidad

Se aplican los principios del documento *Buenas Prácticas y Estándares de Desarrollo*:

- **Clean Code** (nombres descriptivos).
- **SOLID, DRY, KISS.**
- Separación de responsabilidades por capas.
- Controllers ligeros (sin mezclar lógica de negocio).
- Repositories aislados del negocio.
- Validación de datos en backend.
- Manejo centralizado de errores.
- Commit style: `feat:`, `fix:`, `refactor:`, `docs:`.

### Ejemplo de controller ligero

```js
// incident.controller.js
async function createIncident(req, res, next) {
  try {
    const incident = await incidentService.createIncident(req.user.id, req.body);
    ok(res, 201, 'Incidente registrado correctamente', incident);
  } catch (error) {
    next(error);
  }
}
```

### Ejemplo de service (lógica de negocio)

```js
// incident.service.js
async function createIncident(userId, payload) {
  const incident = await incidentRepository.create({ ...payload, userId, status: INCIDENT_STATUS.REPORTADO });
  await historyRepository.create({ incidentId: incident.id, from: null, to: INCIDENT_STATUS.REPORTADO });
  await notificationService.create(incident.id, 'Su reporte fue recibido.');
  return incident;
}
```

---

## 15. Pruebas

- Carpeta `tests/` separada.
- Probar al menos: autenticación, creación de incidentes, transiciones de estado, validación de permisos, validación de archivos.
- Objetivo: código **testeable** gracias a la separación por capas y la inyección de dependencias.

---

## 16. Resumen de reglas no negociables

1. **Nunca** guardar contraseñas en texto plano.
2. **Nunca** confiar solo en validaciones del frontend.
3. **Nunca** subir `.env` a Git.
4. **Controladores ligeros** — no meter lógica de negocio ahí.
5. **Cambios de estado siempre validados**, con historial y notificación.
6. **Formato de respuesta consistente** (`success/message/data`).
7. **Separación por capas** (Routes → Controller → Service → Repository).
8. Todo endpoint crítico protegido por **autenticación y roles**.
