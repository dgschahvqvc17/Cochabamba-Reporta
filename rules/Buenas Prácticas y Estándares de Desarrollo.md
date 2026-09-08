# Buenas Prácticas y Estándares de Desarrollo

## 1. Objetivo

El presente documento establece las buenas prácticas y estándares que se aplicarán durante el desarrollo del **Sistema Multiplataforma de Reporte y Seguimiento de Incidentes Urbanos para la Alcaldía Municipal de Cochabamba**.

El objetivo es mantener un código:

- Limpio.
- Legible.
- Seguro.
- Escalable.
- Mantenible.
- Reutilizable.
- Fácil de probar.
- Fácil de comprender por cualquier integrante del equipo.

Estas buenas prácticas serán aplicadas tanto en el **Frontend** como en el **Backend**.

---

# 2. Principios generales

Durante el desarrollo se seguirán los siguientes principios:

- Clean Code.
- SOLID.
- DRY.
- KISS.
- Separación de responsabilidades.
- Modularidad.
- Reutilización de código.
- Validación de datos.
- Seguridad desde el desarrollo.
- Manejo adecuado de errores.
- Control de versiones mediante Git.
- Documentación del código cuando sea necesario.
- Uso consistente de nombres y estructuras.

---

# 3. Clean Code

Se aplicarán principios de **Clean Code** para mantener el código claro y fácil de mantener.

## 3.1 Nombres descriptivos

Las variables, funciones, clases y archivos deberán tener nombres que permitan comprender claramente su propósito.

### Incorrecto

```javascript
const x = 10;
const d = getData();
```

### Correcto

```javascript
const maxReportAttempts = 10;
const incidentData = getIncidentData();
```

Los nombres deberán evitar abreviaciones innecesarias.

### Incorrecto

```javascript
const usr = getUsr();
```

### Correcto

```javascript
const user = getUser();
```

---

# 4. Manejo de variables

Las variables deberán utilizar nombres descriptivos y representar una única responsabilidad.

Se evitarán nombres genéricos como:

```text
data
info
value
x
y
temp
obj
```

cuando exista la posibilidad de utilizar un nombre más específico.

### Ejemplo

```javascript
const incidentDescription = "Bache ubicado en la avenida...";
const incidentLatitude = -17.3935;
const incidentLongitude = -66.1570;
```

En lugar de:

```javascript
const desc = "...";
const lat = -17.3935;
const lon = -66.1570;
```

## 4.1 Constantes

Los valores que no deberían cambiar deberán declararse como constantes.

```javascript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const INCIDENT_STATUS_REPORTED = "REPORTED";
```

Se evitará utilizar valores mágicos directamente dentro del código.

### Incorrecto

```javascript
if (image.size > 5242880) {
    // ...
}
```

### Correcto

```javascript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

if (image.size > MAX_IMAGE_SIZE) {
    // ...
}
```

---

# 5. Funciones

Las funciones deberán tener una responsabilidad específica.

### Evitar

Una función que:

```text
- Valide al usuario
- Consulte la base de datos
- Suba una imagen
- Envíe una notificación
- Actualice el incidente
```

### Preferir

Separar las responsabilidades:

```text
validateIncident()
createIncident()
uploadIncidentEvidence()
updateIncidentStatus()
sendIncidentNotification()
```

Esto facilita las pruebas, mantenimiento y reutilización.

---

# 6. Principios SOLID

El proyecto aplicará los principios **SOLID** para mejorar la organización y mantenibilidad del código.

## S — Single Responsibility Principle

**Principio de Responsabilidad Única.**

Cada clase, módulo o componente deberá tener una responsabilidad específica.

Ejemplo:

```text
IncidentController
        ↓
Gestiona solicitudes HTTP de incidentes

IncidentService
        ↓
Gestiona la lógica de negocio

IncidentRepository
        ↓
Gestiona el acceso a datos
```

No se deberá colocar toda la lógica del sistema dentro de los controladores.

---

## O — Open/Closed Principle

Las clases y módulos deberán estar abiertos a extensión, pero cerrados a modificaciones innecesarias.

Por ejemplo, si posteriormente se agrega una nueva categoría de incidente, el sistema deberá permitir incorporarla sin modificar grandes cantidades de código existente.

---

## L — Liskov Substitution Principle

Las implementaciones derivadas deberán poder utilizarse sin romper el comportamiento esperado de las clases o interfaces base.

Se evitarán herencias innecesarias y se utilizarán abstracciones únicamente cuando aporten valor al sistema.

---

## I — Interface Segregation Principle

Las interfaces deberán ser específicas y no obligar a una clase a implementar funcionalidades que no necesita.

Se preferirán interfaces pequeñas y enfocadas.

---

## D — Dependency Inversion Principle

Los componentes de alto nivel no deberán depender directamente de implementaciones concretas.

Por ejemplo:

```text
Controller
    ↓
Service
    ↓
Repository
```

El servicio podrá depender de una abstracción del repositorio en lugar de estar acoplado directamente a una implementación específica.

Esto facilita realizar pruebas y cambiar componentes posteriormente.

---

# 7. Principio DRY

**DRY — Don't Repeat Yourself.**

No se deberá duplicar código innecesariamente.

### Evitar

Repetir la misma validación en:

```text
UserController
IncidentController
AdminController
```

Si una validación puede reutilizarse, deberá convertirse en una función, servicio o middleware reutilizable.

---

# 8. Principio KISS

**KISS — Keep It Simple, Stupid.**

Las soluciones deberán mantenerse lo más simples posible.

Se evitará:

- Complejidad innecesaria.
- Abstracciones que no aporten valor.
- Código excesivamente complicado.
- Dependencias innecesarias.
- Funciones demasiado extensas.

La solución más sencilla que cumpla correctamente el requerimiento será preferida.

---

# 9. Separación de responsabilidades

El sistema estará dividido en diferentes capas.

```text
                 FRONTEND
                     │
                     │ HTTP/HTTPS
                     ▼
              ┌───────────────┐
              │     ROUTES    │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │  CONTROLLER   │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │    SERVICE    │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │  REPOSITORY   │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │    DATABASE   │
              └───────────────┘
```

Cada capa tendrá una responsabilidad definida.

---

# 10. Arquitectura del Backend

El backend funcionará como una **API REST** que recibirá solicitudes del frontend y procesará las operaciones necesarias.

El backend será responsable de:

- Autenticación.
- Autorización.
- Gestión de usuarios.
- Gestión de incidentes.
- Gestión de categorías.
- Gestión de ubicaciones.
- Gestión de evidencias.
- Gestión de estados.
- Gestión de asignaciones.
- Gestión de notificaciones.
- Gestión del historial.
- Acceso a la base de datos.

---

# 11. Estructura del Backend

Se utilizará una estructura organizada por responsabilidades.

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── incident.controller.js
│   │   └── notification.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── incident.service.js
│   │   └── notification.service.js
│   │
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── incident.repository.js
│   │   └── notification.repository.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── incident.model.js
│   │   └── notification.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── incident.routes.js
│   │   └── notification.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── validators/
│   │   ├── user.validator.js
│   │   └── incident.validator.js
│   │
│   ├── utils/
│   │   ├── response.js
│   │   └── logger.js
│   │
│   └── app.js
│
├── tests/
│
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

# 12. Responsabilidad de cada capa

## Routes

Define los endpoints disponibles en la API.

Ejemplo:

```text
POST   /api/auth/login
POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id/status
```

Las rutas no deberán contener lógica de negocio.

---

## Controllers

Reciben las solicitudes HTTP y devuelven las respuestas.

El controlador deberá ser ligero.

```text
Request
   ↓
Controller
   ↓
Service
   ↓
Response
```

No se deberá colocar toda la lógica del sistema dentro del controller.

---

## Services

Contendrán la **lógica de negocio**.

Por ejemplo:

```text
IncidentService

- Crear incidente
- Validar reglas de negocio
- Cambiar estado
- Asignar funcionario
- Registrar historial
- Generar notificación
```

---

## Repositories

Serán responsables del acceso a la base de datos.

```text
IncidentRepository

- create()
- findById()
- findAll()
- update()
- delete()
```

De esta manera, la lógica de negocio no estará directamente mezclada con las consultas a la base de datos.

---

# 13. API REST

La comunicación entre frontend y backend se realizará mediante una API REST.

Se utilizarán métodos HTTP según la operación.

| Método | Uso |
|---|---|
| GET | Consultar información |
| POST | Crear información |
| PUT | Actualizar completamente |
| PATCH | Actualizar parcialmente |
| DELETE | Eliminar información |

Ejemplo:

```text
GET    /api/incidents
GET    /api/incidents/25
POST   /api/incidents
PATCH  /api/incidents/25
```

---

# 14. Respuestas de la API

Las respuestas deberán mantener un formato consistente.

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

No se deberán enviar mensajes internos, contraseñas, tokens u otra información sensible al cliente.

---

# 15. Validación de datos

Toda información recibida desde el frontend deberá ser validada en el backend.

Nunca se deberá confiar únicamente en las validaciones del frontend.

Se validarán, entre otros:

- Nombres.
- Apellidos.
- Correo electrónico.
- Número de documento.
- Contraseña.
- Descripción del incidente.
- Categoría.
- Coordenadas.
- Archivos.
- Tamaño de imágenes.
- Formatos permitidos.

La validación deberá realizarse antes de procesar o almacenar la información.

---

# 16. Autenticación y autorización

El sistema contará con autenticación para identificar a los usuarios.

Después del inicio de sesión, el backend proporcionará un mecanismo seguro para mantener la sesión autenticada.

Además, se implementará **autorización basada en roles**.

Ejemplo:

```text
CIUDADANO
    ↓
Puede crear y consultar sus propios incidentes.

RECEPCIONISTA
    ↓
Puede recibir y asignar incidentes para verificación.

VERIFICADOR
    ↓
Puede verificar incidentes asignados.

ENCARGADO_SOLUCION
    ↓
Puede asignar incidentes para su solución.

PERSONAL_SOLUCION
    ↓
Puede atender incidentes asignados.

ADMINISTRADOR
    ↓
Puede administrar usuarios, roles y configuraciones.
```

Un usuario no deberá poder ejecutar operaciones que no correspondan a su rol.

---

# 17. Seguridad de contraseñas

Las contraseñas nunca deberán almacenarse directamente en la base de datos.

Se utilizará un algoritmo de **hash seguro para contraseñas**, como bcrypt o Argon2.

### Nunca hacer:

```text
password = "123456"
```

almacenado directamente en la base de datos.

### En su lugar:

```text
Contraseña
     ↓
Hash seguro
     ↓
Base de datos
```

---

# 18. Variables de entorno

Las credenciales y configuraciones sensibles deberán almacenarse mediante variables de entorno.

Ejemplo:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_NAME=urban_reports
DATABASE_USER=root
DATABASE_PASSWORD=********
JWT_SECRET=********
```

El archivo `.env` **no deberá subirse a GitHub**.

Se utilizará:

```text
.env
.env.example
```

El archivo `.env.example` contendrá únicamente los nombres de las variables necesarias, sin credenciales reales.

---

# 19. Manejo de errores

El backend tendrá un sistema centralizado para manejar errores.

Se evitará repetir bloques de manejo de errores innecesariamente.

Los errores deberán:

- Ser registrados.
- Tener mensajes claros.
- Utilizar códigos HTTP apropiados.
- No revelar información sensible.
- Permitir identificar el problema durante el desarrollo.

Ejemplos de códigos HTTP:

```text
200 → Operación exitosa
201 → Recurso creado
400 → Solicitud incorrecta
401 → No autenticado
403 → Sin permisos
404 → Recurso no encontrado
409 → Conflicto
422 → Datos inválidos
500 → Error interno
```

---

# 20. Gestión de estados de los incidentes

El cambio de estado de un incidente deberá realizarse mediante reglas definidas.

Ejemplo:

```text
REPORTADO
    ↓
RECIBIDO
    ↓
EN_VERIFICACION
    ↓
VERIFICADO
    ↓
ASIGNADO_SOLUCION
    ↓
EN_ATENCION
    ↓
ATENDIDO
    ↓
CERRADO
```

Cuando exista un cambio de estado:

```text
Cambio de estado
       ↓
Actualizar incidente
       ↓
Registrar historial
       ↓
Generar notificación
       ↓
Notificar al ciudadano
```

Esto garantizará la trazabilidad del proceso.

---

# 21. Historial de cambios

Cada cambio importante realizado sobre un incidente deberá quedar registrado.

El historial podrá almacenar:

```text
ID del incidente
Estado anterior
Estado nuevo
Usuario que realizó el cambio
Fecha y hora
Comentario u observación
```

Ejemplo:

```text
Incidente #125

Estado anterior: EN_VERIFICACION
Estado nuevo: VERIFICADO

Usuario: funcionario_25
Fecha: 10/09/2026 09:30
Observación: Se confirmó la existencia del bache.
```

---

# 22. Gestión de evidencias

Las fotografías enviadas por los ciudadanos deberán validarse antes de almacenarse.

Se deberán controlar:

- Tipo de archivo.
- Extensión.
- Tamaño.
- Nombre del archivo.
- Cantidad de archivos permitidos.

Las imágenes no deberán almacenarse directamente en la base de datos como archivos binarios si existe un servicio de almacenamiento apropiado.

La base de datos podrá almacenar la referencia o URL de la evidencia.

```text
Ciudadano
    ↓
Fotografía
    ↓
Backend
    ↓
Almacenamiento
    ↓
URL / referencia
    ↓
Base de datos
```

---

# 23. Logs

El backend deberá utilizar registros (**logs**) para facilitar el diagnóstico de problemas.

Los logs podrán registrar:

- Errores.
- Solicitudes importantes.
- Cambios de estado.
- Errores de autenticación.
- Fallos de conexión.
- Eventos importantes del sistema.

No deberán registrarse datos sensibles como:

- Contraseñas.
- Tokens.
- Información privada innecesaria.

---

# 24. Frontend

El frontend desarrollado con React Native también deberá seguir buenas prácticas.

Se aplicará:

- Componentes reutilizables.
- Separación de componentes.
- Servicios para comunicación con la API.
- Validación de formularios.
- Manejo de estados.
- Manejo de errores.
- Variables con nombres descriptivos.
- Evitar componentes excesivamente grandes.
- Separación entre UI y lógica de negocio.

Ejemplo:

```text
screens/
    IncidentScreen

components/
    IncidentCard
    IncidentForm
    StatusBadge

services/
    incidentService

models/
    Incident

controllers/
    IncidentController
```

---

# 25. Control de versiones

El proyecto utilizará **Git** para el control de versiones.

Se recomienda trabajar con ramas:

```text
main
│
└── develop
      │
      ├── feature/login
      ├── feature/incidents
      ├── feature/notifications
      └── feature/users
```

Las ramas `feature` deberán utilizarse para desarrollar funcionalidades específicas.

Antes de integrar código a `develop` se deberá revisar que:

- El código compile.
- Las pruebas correspondientes funcionen.
- No existan errores conocidos.
- Se respeten las convenciones del proyecto.
- No se incluyan credenciales.
- El código sea comprensible.

---

# 26. Commits

Los commits deberán ser claros y descriptivos.

### Recomendado

```text
feat: agregar registro de incidentes
fix: corregir validación de ubicación
feat: implementar notificaciones de cambios de estado
refactor: separar lógica del controlador de incidentes
docs: actualizar documentación del backend
```

### Evitar

```text
cambios
final
final2
arreglo
cosas
prueba
```

---

# 27. Principio de seguridad

La seguridad será considerada desde el diseño y no únicamente al finalizar el proyecto.

Se aplicarán medidas como:

- Validación de entradas.
- Autenticación.
- Autorización por roles.
- Hash de contraseñas.
- Variables de entorno.
- Protección de endpoints.
- Validación de archivos.
- Manejo seguro de errores.
- HTTPS en producción.
- Control de acceso a recursos.
- Protección de información personal.

---

# 28. Flujo general del Backend

El procesamiento de una solicitud seguirá una estructura similar a:

```text
             FRONTEND
                 │
                 │ HTTP Request
                 ▼
              ROUTES
                 │
                 ▼
            MIDDLEWARE
                 │
          ┌──────┴──────┐
          │             │
     Autenticación   Validación
          │             │
          └──────┬──────┘
                 ▼
             CONTROLLER
                 │
                 ▼
              SERVICE
                 │
                 ▼
            REPOSITORY
                 │
                 ▼
             DATABASE
                 │
                 ▼
            REPOSITORY
                 │
                 ▼
              SERVICE
                 │
                 ▼
             CONTROLLER
                 │
                 ▼
             JSON Response
                 │
                 ▼
              FRONTEND
```

---

# 29. Flujo para registrar un incidente

Cuando un ciudadano registre un incidente:

```text
1. Ciudadano completa el formulario
              ↓
2. React Native valida los datos básicos
              ↓
3. Se envía la solicitud al Backend
              ↓
4. Middleware verifica autenticación
              ↓
5. Backend valida los datos
              ↓
6. Controller recibe la solicitud
              ↓
7. Service aplica las reglas de negocio
              ↓
8. Repository almacena la información
              ↓
9. Se registra el historial
              ↓
10. Se genera la notificación
              ↓
11. Backend responde al frontend
              ↓
12. Ciudadano recibe confirmación
```

---

# 30. Principio fundamental del proyecto

La regla principal será:

> **Cada componente debe hacer una cosa, hacerla bien y comunicarse con los demás componentes mediante responsabilidades claramente definidas.**

El proyecto buscará mantener una arquitectura organizada, evitando mezclar:

```text
Interfaz de usuario
        ≠
Lógica de negocio
        ≠
Acceso a datos
        ≠
Configuración
```

La separación de estas responsabilidades permitirá que el sistema pueda crecer progresivamente sin convertirse en un código difícil de mantener.

---

# 31. Resultado esperado

La aplicación de estas buenas prácticas permitirá desarrollar un sistema:

- **Mantenible:** fácil de modificar.
- **Escalable:** preparado para agregar nuevas funcionalidades.
- **Seguro:** protege la información de ciudadanos y funcionarios.
- **Modular:** dividido en componentes independientes.
- **Testeable:** facilita la creación de pruebas.
- **Legible:** cualquier desarrollador podrá comprender el código.
- **Reutilizable:** evita duplicación de funcionalidades.
- **Organizado:** cada componente tendrá una responsabilidad definida.

El uso combinado de **Clean Code, SOLID, DRY, KISS, MVC, separación por capas, API REST, validaciones, seguridad y control de versiones** permitirá establecer una base sólida para el desarrollo del sistema de reporte y seguimiento de incidentes urbanos.