# Manual de Usuario e Instalación

**Sistema de Reporte y Seguimiento de Incidentes Urbanos**
Alcaldía Municipal de Cochabamba — *"Cochabamba, ciudad de todos"*

Este documento es la guía para **instalar el sistema** (Parte I) y para **usarlo**
(Parte II), rol por rol. Es independiente del `README.md`, que contiene la
documentación técnica (arquitectura, endpoints, base de datos, diagramas).

---

# PARTE I — INSTALACIÓN

## 1. Requisitos previos

| Requisito | Versión / detalle |
|---|---|
| Node.js | ≥ 22.11.0 (obligatorio, está definido en `engines`) |
| npm | ≥ 10 |
| Cuenta de Supabase | Proyecto gratuito o de pago, con el script `backend/supabase/schema.sql` ejecutado |
| Editor de código | Visual Studio Code (recomendado) |
| Para probar en celular | Android Studio + emulador, o un teléfono con **Expo Go** |
| Para probar en computadora | Navegador (Chrome, Edge o Firefox) |

Verifica Node y npm en una terminal:

```bash
node -v
npm -v
```

## 2. Estructura del proyecto

```text
Proyecto_Final_Progrmacion IV/
├── backend/      → API REST (Node.js + Express + Supabase)
├── frontend/     → Aplicación (React Native + Expo + TypeScript)
├── rules/        → Documentación técnica del proyecto
├── diagramas/    → Diagramas UML (PlantUML)
├── README.md     → Documentación técnica
└── MANUAL-DE-USUARIO.md  → Este manual
```

## 3. Instalación paso a paso

### Paso 1 · Base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (o usa uno existente).
2. Ve al **SQL Editor**, abre el archivo `backend/supabase/schema.sql`, copia todo
   su contenido, pégalo y presiona **Run**.
3. El script crea:
   - Las tablas: `roles`, `users`, `categories`, `incidents`, `evidence`,
     `locations`, `assignments`, `history`, `notifications`, `user_audit_log`.
   - Los índices, las políticas de seguridad (RLS) y el trigger de `updated_at`.
   - El bucket de almacenamiento **`evidence`** para las fotos.
   - Los datos iniciales: los **6 roles** y las **6 categorías** de incidentes.
4. No se crean usuarios: los ciudadanos se registran desde la app y las cuentas
   del personal municipal las crea el administrador (ver Parte II, sección 9).

### Paso 2 · Credenciales del backend

1. En Supabase ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL`
   - **Publishable key** → `SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** → `SUPABASE_SECRET_KEY`
   - La URL de llaves: `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` → `SUPABASE_JWKS_URL`
2. En la carpeta `backend` copia la plantilla y renómbrala:

   **Windows (PowerShell)**
   ```powershell
   Copy-Item .env.example .env
   ```
   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```
3. Abre `backend/.env` y reemplaza los valores:

   ```env
   PORT=3000
   NODE_ENV=development

   SUPABASE_URL=https://tuproyecto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_JWKS_URL=https://tuproyecto.supabase.co/auth/v1/.well-known/jwks.json
   ```

> ⚠️ **Importante:** el archivo `.env` contiene la clave secreta del proyecto.
> Nunca lo subas a Git (ya está ignorado en `.gitignore`) ni lo compartas.

### Paso 3 · Instalar y arrancar el backend

```bash
cd backend
npm install
npm run dev
```

| Script | Uso |
|---|---|
| `npm run dev` | Desarrollo, con recarga automática (nodemon) |
| `npm start` | Ejecución normal (producción) |

El API queda disponible en `http://localhost:3000`. **Deja esta terminal abierta.**

Comprueba que todo esté bien:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "status": "connected",
    "database": "Supabase",
    "environment": "development"
  }
}
```

### Paso 4 · Instalar y arrancar el frontend

```bash
cd frontend
npm install
```

Luego elige cómo quieres verlo:

| Comando | Cómo se abre | Notas |
|---|---|---|
| `npm run web` | Navegador en `http://localhost:8081` | Requiere **backend arrancado** |
| `npm run android` | Emulador o teléfono Android | Requiere **backend arrancado** |
| `npm start` | Menú de Expo (código QR) | Escanea el QR con **Expo Go** en el celular |
| `npm run ios` | Simulador iOS (solo macOS) | |
| `npm run web:build` | Genera la versión web de producción en `frontend/dist` | |

> 📱 **En el celular:** el teléfono y la computadora deben estar en la **misma
> red Wi-Fi**. La app detecta solo la dirección de la computadora, por eso no
> necesitas configurar nada; si no conecta, revisa la sección 6 de esta parte.

### Paso 5 · Primer arranque y cuentas

1. Abre la app y regístrate como **ciudadano** (ver Parte II, sección 2).
2. Para probar los otros roles necesitas que un **administrador** cree las
   cuentas del personal municipal y les asigne el rol correspondiente
   (Parte II, sección 9).

### Paso 6 · Comprobaciones de calidad (opcional)

```bash
cd frontend
npm test          # pruebas automáticas (Jest)
npx tsc --noEmit  # verificación de tipos
npm run lint      # análisis de estilo (ESLint)
```

## 4. Puesta en marcha rápida (resumen)

```text
1. Supabase  → ejecutar backend/supabase/schema.sql
2. backend   → cp .env.example .env  y completar los datos
3. backend   → npm install && npm run dev      (API en :3000)
4. frontend  → npm install
5. frontend  → npm run web  (o npm run android)  (app en :8081)
```

## 5. Estructura de la base de datos (resumen)

| Tabla | Qué guarda |
|---|---|
| `roles` | Los 6 roles del sistema |
| `users` | Ciudadanos y funcionarios, ligados a Supabase Auth |
| `categories` | Categorías de incidentes (Baches, Residuos, etc.) |
| `incidents` | Reportes: código único, categoría, título, descripción y estado |
| `evidence` | Fotos de evidencia (URL y ruta en Storage) |
| `locations` | Coordenadas GPS y dirección de cada incidente |
| `assignments` | Asignaciones a verificación y a solución |
| `history` | Historial de cambios de estado (trazabilidad) |
| `notifications` | Avisos que recibe el ciudadano |
| `user_audit_log` | Auditoría de la gestión de usuarios |

## 6. Problemas frecuentes de instalación

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Error: Faltan variables de entorno de Supabase` | Falta el `.env` o está incompleto | Repite el Paso 2 y reinicia `npm run dev` |
| `ECONNREFUSED` o la app no carga datos | El backend no está corriendo | Mantén abierta la terminal del backend |
| El celular no conecta con la API | Redes Wi-Fi distintas o firewall | Conecta celular y PC al mismo Wi-Fi y permite Node.js en el firewall de Windows |
| La pantalla sale en blanco en web | Falta recompilar o el puerto 8081 está ocupado | Cierra el proceso del puerto y ejecuta `npm run web` de nuevo |
| La app abre pero no hay datos | El `schema.sql` no se ejecutó en Supabase | Vuelve al Paso 1 y revisa las tablas en el Table Editor |
| `EADDRINUSE: puerto 3000 ya en uso` | Otro proceso usa el puerto | Cambia `PORT` en `backend/.env` (y el puerto en `frontend/src/config/api.ts`) |
| La cuenta se registra pero no puede.reportar | La cuenta quedó inactiva | El administrador debe activarla en **Usuarios** |

---

# PARTE II — MANUAL DE USUARIO

## 1. Acceso y navegación

### 1.1 Iniciar sesión

1. Abre la app.
2. Ingresa tu **correo electrónico** y **contraseña**.
3. Presiona **Iniciar sesión**.

Si olvidaste la contraseña, no hay recuperación automática: solicita al
administrador que restablezca tu cuenta.

### 1.2 Barra de navegación según el rol

La barra inferior cambia según el rol con el que inicies sesión:

| Rol | Secciones disponibles |
|---|---|
| **Ciudadano** | Inicio · Reportes · Mapa |
| **Personal municipal** (recepción, verificador, encargado de solución, personal de solución) | Inicio · Incidentes · Mapa |
| **Administrador** | Panel · Usuarios · Categorías · Mapa |

Cada rol ve además su **Inicio**, que muestra solo los módulos que le
corresponden.

### 1.3 Estados de un incidente

| Estado | Significado |
|---|---|
| `REPORTADO` | El ciudadano acaba de reportarlo |
| `RECIBIDO` | Recepción lo recibió y está pendiente de asignar |
| `EN_VERIFICACION` | Un verificador fue asignado y lo está comprobando |
| `VERIFICADO` | El problema existe en campo |
| `ASIGNADO_PARA_SOLUCION` | Ya tiene responsable asignado |
| `EN_ATENCION` | El personal está trabajando en el incidente |
| `ATENDIDO` | Se solucionó |
| `CERRADO` | Proceso finalizado |
| `RECHAZADO` | El reporte no era válido (con motivo) |

El recorrido normal es:

```text
REPORTADO → RECIBIDO → EN_VERIFICACION → VERIFICADO
         → ASIGNADO_PARA_SOLUCION → EN_ATENCION → ATENDIDO → CERRADO
```

---

## 2. Ciudadano

### 2.1 Crear mi cuenta

Desde **Inicio → Crear cuenta**. Todos los campos son obligatorios:

| Campo | Regla |
|---|---|
| Nombres | 2 a 30 caracteres, solo letras |
| Apellidos | 2 a 40 caracteres, solo letras |
| Fecha de nacimiento | Formato `AAAA-MM-DD`, y debes ser **mayor de 18 años** |
| Documento de identidad | 5 a 8 dígitos |
| Teléfono | 7 a 8 dígitos (sin el prefijo del país) |
| Correo electrónico | Formato válido; es tu usuario de acceso |
| Dirección de residencia | Hasta 200 caracteres |
| Contraseña | Mínimo 8 caracteres |
| Confirmar contraseña | Debe coincidir |

No puedes registrarte si ya existe una cuenta con el mismo correo, el mismo
documento de identidad, o el mismo nombre + apellido + teléfono.

### 2.2 Reportar un incidente

1. En **Inicio** presiona **+ Nuevo reporte**.
2. Completa el formulario:

   | Campo | Regla |
   |---|---|
   | **Categoría** | Obligatoria. Ejemplos: Baches, Residuos, Alumbrado público, Espacios públicos, Infraestructura urbana, Otros |
   | **Título** | 8 a 120 caracteres (resumen del problema) |
   | **Descripción** | 15 a 2000 caracteres (detalla qué pasa) |
   | **Evidencia** | Hasta **5 fotos**, desde la cámara o la galería |
   | **Ubicación** | Se captura con el GPS; puedes escribir la dirección |

3. **Antes de reportar, revisa el mapa**: presiona el enlace *"¿Ya fue reportado
   antes?"* para abrir el mapa y ver si ya hay un reporte similar cerca.
   - Si ves un marcador de otra persona, solo puedes ver su **código, categoría y
     estado** (por privacidad no se muestra su descripción ni sus datos).
   - Si el marcador es tuyo, puedes abrir el seguimiento de ese reporte.
   - Al volver del mapa **no pierdes lo que ya escribiste**.
4. Presiona **Guardar**.

> **Reportes duplicados:** si el sistema detecta un reporte muy similar en la
> misma categoría de los últimos 30 días, **no deja guardarlo** y te indica el
> código del reporte existente para que consultes su seguimiento. Esto mantiene
> la base de datos sin repetidos.

**Aviso sin conexión:** si pierdes internet mientras llenas el formulario y
presionas **Atrás**, la app te advierte que los datos se perderán. Puedes
**Salir de todos modos** o **Seguir en el formulario**.

### 2.3 El mapa (sección 3 de esta parte)

Está disponible en la barra inferior, en **Mapa**.

### 2.4 Mis reportes

En **Reportes** ves todos tus incidentes. Desde ahí puedes:

- **Filtrar** por estado para ver, por ejemplo, solo los que están en atención.
- **Abrir el detalle**: descripción, evidencia (fotos) y ubicación en el mapa.
- **Editar o eliminar**: solo mientras el estado sea `REPORTADO`, y solo una vez.
  En cuanto recepción lo recibe, el reporte ya no se puede modificar.

### 2.5 Seguimiento y notificaciones

- En el detalle de cada reporte, el **historial** muestra en qué estado está y
  todos los cambios que tuvo.
- Cada vez que el estado cambia, recibes una **notificación** (señal en la
  pantalla de inicio; también puedes verlas en la lista de notificaciones).

### 2.6 Mi perfil

**Inicio → Perfil** muestra tu información y permite **cambiar la contraseña**
(ingresas la actual, la nueva y la confirmación). Si sales sin conexión se te
recuerda que los datos se perderán.

---

## 3. El mapa interactivo

Disponible en **Mapa** para todos los roles, y cada uno ve **solo lo que le
corresponde**:

| Rol | Qué muestra el mapa |
|---|---|
| **Ciudadano** | Todos los reportes con ubicación, para comprobar si el problema ya fue reportado |
| **Recepción** | Los reportes que le llegan (`REPORTADO` y `RECIBIDO`) |
| **Verificador** | Únicamente los incidentes que le asignaron |
| **Encargado de solución** | Los incidentes verificados pendientes de asignar |
| **Personal de solución** | Únicamente los incidentes que le asignaron |
| **Administrador** | Todos los reportes |

### 3.1 Cómo usar el mapa

| Acción | Cómo se hace |
|---|---|
| **Mover el mapa** | Arrastra con el dedo (celular) o con el mouse (computadora) |
| **Acercar / alejar** | Botones **+** y **−** de la pantalla |
| **Ver todos los reportes** | Botón de **encuadre**: ubica todos los marcadores a la vez |
| **Buscar** | Campo de búsqueda por código o título |
| **Filtrar** | Chips de estado (solo los estados que te corresponden) |
| **Ver un reporte** | Presiona el marcador: se abre una tarjeta con código, categoría, estado y dirección |
| **Abrir el detalle** | Botón **Ver detalle** de la tarjeta (solo en tus propios reportes si eres ciudadano) |
| **Actualizar** | Botón de **recarga** en la esquina superior derecha |

Al entrar, el mapa encuadra automáticamente todos los reportes de tu alcance, y
un aviso bajo el título indica cuántos hay con ubicación.

### 3.2 Colores de los marcadores

| Color | Estado |
|---|---|
| Celeste | `REPORTADO`, `RECIBIDO` |
| Amarillo | `EN_VERIFICACION`, `ASIGNADO_PARA_SOLUCION`, `EN_ATENCION` |
| Verde | `VERIFICADO`, `ATENDIDO` |
| Gris | `CERRADO` |
| Rojo | `RECHAZADO` |

La leyenda en la parte inferior del mapa muestra el significado de cada color.

### 3.3 Privacidad en el mapa

- El **ciudadano** ve de los reportes ajenos únicamente código, categoría, estado
  y ubicación. La descripción y los datos personales del reportante **nunca** se
  envían a otro ciudadano.
- El personal municipal y el administrador sí ven el detalle completo de los
  incidentes de su alcance.

---

## 4. Recepción

Objetivo: recibir los reportes y asignarlos a un verificador.

1. Entra con tu cuenta de recepción y presiona **Asignar a verificación** en
   **Inicio**.
2. En la lista de pendientes verás los reportes `REPORTADO` y `RECIBIDO`.
3. Presiona **Ver detalle** para revisar la información, la evidencia y la
   ubicación antes de asignar.
4. Asigna el incidente al funcionario de verificación que corresponda
   (seleccionándolo de la lista). El incidente pasa a `EN_VERIFICACION`
   automáticamente.
5. En **Incidentes** puedes buscar y filtrar por estado, categoría y rango de
   fechas.
6. En **Mapa** ves los reportes que te llegan, con sus marcadores por color de
   estado.

> Cada asignación queda registrada en el historial del incidente.

---

## 5. Verificador

Objetivo: comprobar en campo si el problema existe.

1. En **Inicio → Verificar incidentes** aparece tu cola: solo los incidentes que
   te asignaron.
2. Abre uno y revisa la dirección, las fotos y la ubicación en el mapa.
3. Acércate al lugar y decide:

   | Decisión | Cuándo usarla |
   |---|---|
   | **Verificado** | El problema existe tal como se reportó |
   | **Rechazado** | El reporte no corresponde a la realidad; **escribe el motivo** (obligatorio) |

4. Si hace falta, **adjunta evidencia fotográfica** del estado real del lugar.
5. El incidente pasa a `VERIFICADO` o a `RECHAZADO`, y el ciudadano recibe la
   notificación correspondiente.

En **Mapa** solo aparecen los incidentes que te asignaron.

---

## 6. Encargado de solución

Objetivo: asignar los incidentes verificados al personal que los atenderá.

1. En **Inicio → Asignar para solución** están los incidentes `VERIFICADO`.
2. Revisa el detalle y selecciona al **personal de solución** responsable.
3. El incidente pasa a `ASIGNADO_PARA_SOLUCION` con su responsable asignado.
4. En **Mapa** verás los incidentes verificados pendientes de asignar.

---

## 7. Personal de solución

Objetivo: atender y cerrar los incidentes que te asignaron.

1. En **Inicio → Atender incidentes** está tu cola de trabajo.
2. Abre el incidente, revisa la dirección y la evidencia del verificador.
3. Prescciona **Iniciar atención**: el estado pasa a `EN_ATENCION`.
4. Al terminar, marca el incidente como **Atendido** y, si corresponde, adjunta
   **evidencia del trabajo realizado** (por ejemplo, la foto de la calle
   reparada).
5. Cierra la solicitud cuando el trabajo esté confirmado (`CERRADO`).

En **Mapa** solo aparecen los incidentes que te asignaron.

---

## 8. Panel del administrador

### 8.1 Panel

La pantalla **Panel** muestra los indicadores de la situación actual:

- **Ciudadanos** registrados, **incidentes totales**, los atendidos, pendientes
  y cerrados, y los **de hoy**.
- **Personal activo por rol** (recepción, verificación y solución).
- **Distribución por estado** y **por categoría**.
- **Alertas de gestión** e **incidentes recientes**.

### 8.2 Usuarios

**Usuarios → Crear usuario** para registrar al personal municipal:

| Campo | Regla |
|---|---|
| Nombres y apellidos | Obligatorios, solo letras |
| Correo electrónico | Obligatorio, es el usuario de acceso |
| Contraseña | Mínimo 8 caracteres |
| Rol | `RECEPCION`, `VERIFICADOR`, `ENCARGADO_SOLUCION`, `PERSONAL_SOLUCION` o `ADMINISTRADOR` |
| Teléfono, identidad, fecha de nacimiento, dirección | Opcionales |

Además puedes:

- **Editar** los datos de un usuario.
- **Activar / desactivar** una cuenta (un usuario desactivado no puede entrar).
- **Cambiar el rol** de un usuario.
- Consultar la **auditoría** de cambios, que registra quién modificó qué y cuándo.

### 8.3 Categorías

**Categorías** permite crear, editar y **activar o desactivar** las categorías de
incidentes. Al desactivar una categoría, deja de aparecer en el formulario de
reportes, sin borrar los incidentes que ya la usan.

### 8.4 Mapa

El administrador ve **todos los incidentes** del sistema en el mapa.

---

## 9. Gestión de usuarios (resumen para el administrador)

Flujo habitual para dar de alta al personal:

```text
Administrador → Usuarios → + Crear usuario
   → completar nombre, correo, contraseña y rol
   → el usuario entra con su correo y contraseña
   → "Mis módulos" ya muestra solo lo que le corresponde
```

> ⚠️ Los ciudadanos **no** se crean desde aquí: se registran ellos mismos desde
> la app.

---

## 10. Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Por qué no puedo editar mi reporte? | Solo se puede editar y eliminar mientras el estado sea `REPORTADO`, y una sola vez. |
| ¿Por qué el sistema no me deja reportar? | Existe un reporte muy similar en la misma categoría de los últimos 30 días. El mensaje te indica el código del reporte existente: revisa su seguimiento. |
| ¿Puedo ver la foto y el nombre de quien reportó? | El personal municipal y el administrador sí. Otro ciudadano no: por privacidad solo ve el hecho de que el reporte existe. |
| ¿Cómo sé a quién le asignaron mi reporte? | En el detalle del reporte, el historial registra cada cambio de estado, quién lo hizo y en qué fecha. |
| ¿Qué pasa si el verificador rechaza mi reporte? | El estado pasa a `RECHAZADO` y se muestra el motivo. El historial conserva todos los pasos. |
| ¿El mapa necesita internet? | Sí. Sin conexión la app muestra el banner de "Sin conexión a internet". |
| ¿Cuántos reportes se ven en el mapa? | Todos los de tu alcance. Si son más de 500, se muestran los más recientes y se indica en pantalla. |
| ¿Quién puede ver todos los incidentes? | Solo el administrador. Cada rol ve únicamente lo que le corresponde. |
| ¿Puedo usar la app en el celular sin ser desarrollador? | Sí, con **Expo Go** escaneando el código QR que muestra `npm start`. |

---

## 11. Resumen de roles y permisos

| Acción | Ciudadano | Recepción | Verificador | Enc. solución | Pers. solución | Administrador |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Reportar incidente | ✅ | — | — | — | — | — |
| Ver todos los reportes en el mapa | ✅ | — | — | — | — | ✅ |
| Ver solo lo recibido/asignado | — | ✅ | ✅ | ✅ | ✅ | — |
| Editar o eliminar su reporte (`REPORTADO`) | ✅ | — | — | — | — | — |
| Marcar como recibido | — | ✅ | — | — | — | ✅ |
| Asignar a verificación | — | ✅ | — | — | — | ✅ |
| Verificar en campo | — | — | ✅ | — | — | ✅ |
| Asignar para solución | — | — | — | ✅ | — | ✅ |
| Atender y cerrar | — | — | — | — | ✅ | ✅ |
| Gestionar usuarios y categorías | — | — | — | — | — | ✅ |
