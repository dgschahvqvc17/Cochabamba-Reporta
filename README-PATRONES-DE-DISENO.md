# Patrones de Diseño en el Proyecto

**Alcaldía Municipal de Cochabamba — Sistema de Reporte y Gestión de Incidentes**

Este documento describe los patrones de diseño implementados en el proyecto,
dónde se aplica cada uno y cómo se ve en el código real. Su propósito es servir
como referencia técnica para el equipo (y para la sustentación del proyecto).

---

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Patrones creacionales](#patrones-creacionales)
3. [Patrones estructurales](#patrones-estructurales)
4. [Patrones de comportamiento](#patrones-de-comportamiento)
5. [Patrones de arquitectura / capas](#patrones-de-arquitectura--capas)
6. [Principios asociados aplicados](#principios-asociados-aplicados)
7. [Mapa de ubicación de los patrones](#mapa-de-ubicación-de-los-patrones)

---

## Resumen ejecutivo

| Patrón | Tipo | Dónde se aplica |
|---|---|---|
| **MVC** | Arquitectura | `backend/src/{controllers,services,models,routes}` y `frontend/src/screens` |
| **Repository / DAO** | Estructural | `backend/src/repositories/*.repository.js` |
| **Singleton** | Creacional | `backend/src/config/supabase.js`, `frontend/src/utils/session.ts` |
| **Middleware (Pipeline)** | Comportamiento | `backend/src/middlewares/*` |
| **Facade** | Estructural | `frontend/src/controllers/*`, `backend/src/services/*` |
| **DTO (Transferencia de datos)** | Estructural | Funciones `toPublic*` en los services |
| **State (Máquina de estados)** | Comportamiento | `backend/src/utils/incidentStatus.js` + `incident.service.js` |
| **Observer (aplicado / parcial)** | Comportamiento | Transiciones de estado que generan notificaciones |
| **Adapter** | Estructural | Helper HTTP `api`, `imagePicker.ts`, `location.ts`, middlewares de auth |

---

## Patrones creacionales

### Singleton

Garantiza una **única instancia** de un recurso compartido en toda la aplicación.

En Node.js, el mecanismo de *cache de módulos* hace que cada módulo se cargue
una sola vez: si el módulo expone un objeto ya construido, todas las partes que
lo requieran reciben **la misma instancia**.

**Ejemplo 1 — Clientes de Supabase** (`backend/src/config/supabase.js:27-34`):

```js
const supabasePublic = createClient(supabaseUrl, supabasePublishableKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { supabasePublic, supabaseAdmin };
```

Cualquier repositorio que haga `require('../config/supabase')` obtiene el mismo
`supabaseAdmin`, evitando crear cientos de conexiones HTTP. Ejemplo de uso en
`backend/src/repositories/incident.repository.js:12`.

**Ejemplo 2 — Almacén de sesión** (`frontend/src/utils/session.ts:33-34`):

```ts
const memoryStore = new Map<string, string>();
```

Las funciones `saveSession`, `clearSession` y `getStoredSession` operan siempre
sobre esa misma estructura compartida, un único punto de verdad para la sesión.

---

## Patrones estructurales

### Repository / DAO (Data Access Object)

Separa la **lógica de acceso a datos** (queries a Supabase/PostgreSQL) de la
**lógica de negocio** ubicada en los services. Si cambia la base de datos, solo
cambian los repositorios.

Todos los accesos a datos viven en `backend/src/repositories/`:

- `incident.repository.js`
- `user.repository.js`
- `category.repository.js`
- `notification.repository.js`
- `assignment.repository.js`
- `evidence.repository.js`
- `history.repository.js`
- `location.repository.js`

**Ejemplo** (`backend/src/repositories/incident.repository.js:14-33`):

```js
const create = async ({ code, userId, categoryId, title, description }) => {
  const { data, error } = await supabaseAdmin
    .from('incidents')
    .insert({ code, user_id: userId, category_id: categoryId, title, description, status: 'REPORTADO' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};
```

El service **no conoce** el cliente de Supabase: solo invoca al repositorio
(`backend/src/services/incident.service.js:339`):

```js
const created = await incidentRepository.create({ code, userId, categoryId, title, description });
```

### MVC (Model-View-Controller)

Patrón arquitectónico que separa los datos (Model), la presentación (View) y la
coordinación (Controller). En este proyecto se aplica **en las dos caras**:

**Backend (API REST) — MVC invertido:**

| Capa | Carpeta | Rol |
|---|---|---|
| **Routes** | `backend/src/routes/` | Enrutamiento sin lógica de negocio |
| **Controller** | `backend/src/controllers/` | Recibe la petición HTTP y responde |
| **Service** | `backend/src/services/` | Lógica de negocio |
| **Repository** | `backend/src/repositories/` | Acceso a datos |
| **Model** | `backend/src/models/` + schema SQL | Definición de datos |

Cada archivo lo declara explícitamente en su cabecera, por ejemplo
`backend/src/controllers/incident.controller.js:1`:

```js
/**
 * Controlador de incidentes (MVC - Controller).
 */
```

**Frontend (App React Native):**

```ts
// frontend/src/screens/IncidentsScreen.tsx:1
/**
 * Pantalla: Incidentes — consulta y gestión (MVC - View).
 */
```

| Capa | Carpeta | Rol |
|---|---|---|
| **View** | `frontend/src/screens/` | Pantallas / UI |
| **Controller** | `frontend/src/controllers/` | Orquesta servicios y traduce resultados |
| **Service** | `frontend/src/services/` | Comunicación HTTP con la API |
| **Model** | `frontend/src/models/` | Tipos de dominio (Incident, User, ...) |

### Facade (Fachada)

Ofrece una **interfaz simplificada** por encima de un subsistema complejo.

**Ejemplo — Controladores del frontend** (`frontend/src/controllers/incidentController.ts:81-102`):

El componente (`IncidentsScreen.tsx`) solo ve una función simple
`loadManagedIncidents(params)`; por dentro la fachada obtiene el token,
llama al servicio HTTP, mapea los errores de campo y devuelve un `ActionResult`
uniforme:

```ts
export async function registerIncident(payload: IncidentPayload): Promise<ActionResult<Incident>> {
  const accessToken = getAccessToken();
  const result = await createIncidentRequest(accessToken, payload);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      ...(toFieldErrors(result.error?.details) && {
        fieldErrors: toFieldErrors(result.error?.details),
      }),
    };
  }

  return { success: true, message: result.message, data: result.data?.incident };
}
```

**Ejemplo — Services del backend** (`backend/src/services/incident.service.js:308-348`):

`createIncident` expone una única operación pero internamente valida el payload,
consulta la categoría, genera el código (`INC-AAAAMMDD-NNN`), cuenta los
incidentes del día y escribe en el repositorio.

### DTO (Data Transfer Object)

Los objetos de la base de datos (con `snake_case`, relaciones y campos internos)
se transforman en **objetos públicos** con la forma exacta que consume la API/móvil.

**Ejemplo** — Mapeadores `toPublic*` en `backend/src/services/incident.service.js:232-304`:

```js
const toPublicIncident = (incident) => ({
  id: incident.id,
  code: incident.code,
  userId: incident.user_id,
  categoryId: incident.category_id,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  createdAt: incident.created_at,
  updatedAt: incident.updated_at,
  canEdit: isEditable(incident),
  canDelete: incident.status === EDITABLE_STATUS,
  reporter: toPublicReporter(incident.citizen),
});
```

En el frontend se replica el mismo concepto con **tipos** (`frontend/src/models/Incident.ts`,
`Category.ts`, `User.ts`), que son el contrato de datos entre la API y las pantallas.

### Adapter

Convierte la interfaz de un componente/libreía externa en la interfaz que
necesita la aplicación de negocio.

**Ejemplo 1 — Helper HTTP** (`frontend/src/services/incidentService.ts:58-129`):

Unifica `fetch` en un solo sitio: agrega `Content-Type`, `Authorization`,
maneja el timeout con `AbortController`, limpia la sesión en 401, y convierte
cualquier respuesta atípica (HTML, vacía, servidor caído) en un `ApiResponse`
con `success:false` en vez de lanzar errores que cuelguen la UI.

**Ejemplo 2 — Utilidades del dispositivo**:

- `frontend/src/utils/imagePicker.ts` → adapta la librería de cámara/galería.
- `frontend/src/utils/location.ts` → adapta el GPS del dispositivo.

**Ejemplo 3 — Autenticación** (`backend/src/middlewares/auth.middleware.js:27-80`):

`authenticate` adapta el token JWT de Supabase y lo convierte en el objeto
`req.user` (con `id`, `role`, etc.) que los controllers esperan:

```js
req.user = {
  id: appUser.id,
  authId: appUser.auth_id,
  email: appUser.email,
  firstName: appUser.first_name,
  lastName: appUser.last_name,
  role: appUser.roles.name,
};
```

---

## Patrones de comportamiento

### Middleware (cadena / pipeline)

En Express, cada petición pasa por una **cadena de funciones intermedias**
antes de llegar al controller. Cada middleware decide si deja pasar la petición
(`next()`) o la detiene con una respuesta.

Los middlewares viven en `backend/src/` `middlewares/`:

| Archivo | Responsabilidad |
|---|---|
| `auth.middleware.js` | Valida el token JWT y adjunta `req.user` |
| `role.middleware.js` | Valida el rol del usuario (RBAC) |
| `validation.middleware.js` | Valida el body/query con los validators |
| `upload.middleware.js` | Procesa el upload de imágenes (multipart) |
| `error.middleware.js` | Centraliza la respuesta de errores |

**Ejemplo real** — Cadena de un endpoint (`backend/src/routes/incident.routes.js:69-75`):

```js
router.post(
  '/',
  authenticate,                            // 1. ¿Quién es?
  requireRole(ROLES.CIUDADANO),             // 2. ¿Puede?  (RBAC)
  validate(createIncidentValidation),       // 3. ¿Es válido?
  incidentController.createIncident,        // 4. Ejecuta la acción
);
```

**Ejemplo — Manejo centralizado de errores** (`backend/src/middlewares/error.middleware.js:13-30`):

```js
const errorMiddleware = (err, req, res, _next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const body = { success: false, message };
  if (err.code) body.error = { code: err.code };
  res.status(statusCode).json(body);
};
```

Se monta al final de la cadena en `backend/src/app.js:68`.

### State (Máquina de estados)

El incidente tiene un **ciclo de vida** con estados y transiciones válidas:

> `REPORTADO → RECIBIDO → EN_VERIFICACION → VERIFICADO → ASIGNADO_PARA_SOLUCION → EN_ATENCION → ATENDIDO → CERRADO`
> más `RECHAZADO` cuando la verificación determina que el reporte no es válido.

**Definición central** (`backend/src/utils/incidentStatus.js:24-34` y `64-93`):

```js
const INCIDENT_STATUS = {
  REPORTADO: 'REPORTADO',
  RECIBIDO: 'RECIBIDO',
  EN_VERIFICACION: 'EN_VERIFICACION',
  // ...
};

// Grafo completo de transiciones permitidas del ciclo de vida.
const ALLOWED_TRANSITIONS = {
  [INCIDENT_STATUS.REPORTADO]: [INCIDENT_STATUS.RECIBIDO, INCIDENT_STATUS.EN_VERIFICACION],
  [INCIDENT_STATUS.RECIBIDO]: [INCIDENT_STATUS.EN_VERIFICACION],
  [INCIDENT_STATUS.EN_VERIFICACION]: [INCIDENT_STATUS.VERIFICADO, INCIDENT_STATUS.RECHAZADO],
  // ...
};
```

**Aplicación de la transición** — `applyStatusChange` en
`backend/src/services/incident.service.js:516-548`:

```js
async applyStatusChange(incident, toStatus, changedBy, comment = null, extraFields = {}) {
  const updated = await incidentRepository.updateStatus(incident.id, toStatus, extraFields);

  await historyRepository.create({
    incidentId: incident.id,
    fromStatus: incident.status,
    toStatus,
    changedBy,
    comment: normalizedComment,
  });

  await notificationRepository.create({ /* notifica al ciudadano */ });
  return updated;
}
```

**Validación de transición por rol** — `changeIncidentStatus`
(`backend/src/services/incident.service.js:904-951`): consulta
`ROLE_STATUS_TRANSITIONS[user.role]` y rechaza cualquier transición no permitida
con `INVALID_TRANSITION`.

### Observer (aplicado / parcial)

El patrón Observer original implica que varios "observadores" se suscriben a un
"sujeto" y son notificados de los cambios. Aquí se aplica un **equivalente
práctico orientado a eventos de negocio**: cada vez que el estado de un
incidente cambia, se ejecutan **efectos secundarios** — registrar historial y
generar notificaciones a los usuarios interesados — sin que el llamador tenga
que hacerlo de forma explícita.

`applyStatusChange` (`backend/src/services/incident.service.js:539-545`):

```js
await notificationRepository.create({
  incidentId: incident.id,
  userId: incident.user_id,
  message: `Su reporte ${incident.code} cambió de estado a ${INCIDENT_STATUS_LABELS[toStatus] ?? toStatus}.`,
});
```

Otros ejemplos:

- Asignación a verificación (`incident.service.js:678-682`): notifica al
  funcionario asignado **y** al ciudadano.
- Verificación rechazada (`incident.service.js:878-886`): notifica el motivo de rechazo.

Este es el patrón *"event-driven notification"* / **Publisher-Subscriber
simplificado**, donde el sistema de incidentes actúa como emisor y los usuarios
(ciudadano y personal municipal) como suscriptores implícitos.

---

## Patrones de arquitectura / capas

### Arquitectura por capas (Layered Architecture)

Todo el proyecto está organizado en **capas con dependencia de una sola vía**:

```
routes → controllers → services → repositories → Supabase (PostgreSQL)
   │
   ├── middlewares (auth, role, validation, error, upload)
   └── validators  /  utils (reglas y helpers compartidos)
```

En el frontend:

```
screens (View) → controllers (Facade) → services (HTTP) → API REST
```

Cada capa solo conoce a la inmediatamente inferior, lo que facilita el
mantenimiento y las pruebas ([Dependency Rule](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)).

---

## Principios asociados aplicados

Además de los patrones, el código usa buenas prácticas:

- **DRY (Don't Repeat Yourself)** — validators exportan constantes
  (`MIN_TITLE_LENGTH`, etc.) que reutilizan services y validadores
  (`backend/src/services/incident.service.js:66-76`).
- **Inversión de Dependencias** — los services dependen de los repositories
  (abstracciones), no del cliente de Supabase directamente.
- **Separación de responsabilidades** — cada carpeta cumple exactamente una
  función (rutas no tienen lógica; services no tocan la BD).
- **Fuente única de verdad** — `incidentStatus.js` centraliza estados,
  etiquetas y transiciones; `roles.js` centraliza los roles (RBAC).
- **Manejo uniforme de errores** — `error.middleware.js` responde todo error con
  la misma estructura `{ success, message, error }`.

---

## Mapa de ubicación de los patrones

| Archivo / ruta | Patrón | Referencia |
|---|---|---|
| `backend/src/config/supabase.js` | Singleton | `:27-34` |
| `frontend/src/utils/session.ts` | Singleton | `:33-34` |
| `backend/src/repositories/incident.repository.js` | Repository/DAO | `:14-33`, `:245-255` |
| `backend/src/repositories/*.js` | Repository/DAO | — |
| `backend/src/routes/incident.routes.js` | MVC (Routes) + Middleware | `:1`, `:69-75` |
| `backend/src/controllers/incident.controller.js` | MVC (Controller) | `:1` |
| `backend/src/services/incident.service.js` | MVC (Service) + Facade + State + Observer | `:308`, `:516`, `:904` |
| `backend/src/middlewares/error.middleware.js` | Middleware | `:13-30` |
| `backend/src/middlewares/auth.middleware.js` | Middleware + Adapter | `:27-80` |
| `backend/src/utils/incidentStatus.js` | State | `:24-34`, `:64-93` |
| `backend/src/services/incident.service.js` | DTO (`toPublic*`) | `:232-304` |
| `frontend/src/screens/IncidentsScreen.tsx` | MVC (View) | `:1-2` |
| `frontend/src/controllers/incidentController.ts` | Facade | `:81-102` |
| `frontend/src/services/incidentService.ts` | Adapter (HTTP) | `:58-129` |
| `frontend/src/utils/imagePicker.ts` / `location.ts` | Adapter | — |
| `frontend/src/models/Incident.ts` | DTO (tipos) | — |

---

*Documento técnico generado para el Proyecto Final de Programación IV.*