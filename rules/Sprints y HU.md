# Plan de Sprints — Sistema de Reporte y Seguimiento de Incidentes Urbanos

## Información general

El desarrollo del **Sistema Multiplataforma de Reporte y Seguimiento de Incidentes Urbanos para la Alcaldía Municipal de Cochabamba** se organizará en tres Sprints.

La planificación busca implementar progresivamente las funcionalidades principales del sistema, comenzando por la gestión de ciudadanos y usuarios, continuando con el registro y gestión de incidentes, y finalizando con el seguimiento, notificaciones, asignaciones y administración.

El sistema estará disponible para diferentes plataformas:

- Android.
- iOS.
- Web.
- Escritorio.

### Distribución

| Sprint | Enfoque | Historias |
|---|---|---:|
| Sprint 1 | Usuarios, autenticación y configuración | 5 |
| Sprint 2 | Reporte y gestión de incidentes | 5 |
| Sprint 3 | Seguimiento, asignaciones, notificaciones y administración | 5 |

---

# Sprint 1 — Usuarios, autenticación y configuración

## Descripción

El primer Sprint estará enfocado en construir la base funcional del sistema.

Se implementará el registro e inicio de sesión de ciudadanos, gestión de usuarios y roles, categorías de incidentes y configuración inicial necesaria para que posteriormente puedan registrarse y gestionarse los reportes.

También se establecerán las primeras validaciones y alertas generales del sistema.

### Historias incluidas

- HU01 — Registrar ciudadano
- HU02 — Iniciar sesión
- HU03 — Gestionar usuarios y roles
- HU04 — Gestionar categorías de incidentes
- HU05 — Validar formularios y mostrar alertas

---

# HU01 — Registrar ciudadano

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como ciudadano, quiero crear una cuenta proporcionando mis datos personales para poder acceder al sistema y realizar reportes de incidentes urbanos.**

### Contexto

El ciudadano necesita disponer de una cuenta personal para utilizar las funcionalidades del sistema y realizar seguimiento de los incidentes que haya reportado.

### Evento

El ciudadano accede a la opción de registro y completa el formulario con sus datos personales.

### Resultado

El sistema valida la información proporcionada, registra al ciudadano y permite que posteriormente pueda iniciar sesión.

### Criterios de aceptación

- Mostrar un formulario de registro.
- Solicitar nombres.
- Solicitar apellidos.
- Solicitar fecha de nacimiento.
- Solicitar número de documento de identidad.
- Solicitar número de teléfono.
- Solicitar correo electrónico.
- Solicitar contraseña.
- Solicitar confirmación de contraseña.
- Solicitar dirección o información de referencia cuando corresponda.
- Validar que los campos obligatorios estén completos.
- Validar el formato del correo electrónico.
- Validar el formato del número de teléfono.
- Validar la fecha de nacimiento.
- Validar que el documento de identidad tenga un formato válido.
- Validar que las contraseñas coincidan.
- Evitar registrar correos duplicados.
- Evitar registrar documentos de identidad duplicados.
- Mostrar alertas cuando exista información incorrecta.
- Mostrar un mensaje cuando el registro sea exitoso.
- Almacenar la información de manera segura.
- No almacenar contraseñas en texto plano.
- Crear la cuenta del ciudadano.
- Permitir posteriormente iniciar sesión.

---

# HU02 — Iniciar sesión

**Prioridad:** Alta

**Story Points:** 5

**Tiempo estimado:** 8 horas

## Historia de usuario

**Como usuario registrado, quiero iniciar sesión utilizando mis credenciales para acceder a las funcionalidades correspondientes a mi rol.**

### Contexto

El usuario posee una cuenta registrada y habilitada en el sistema.

### Evento

El usuario ingresa su correo electrónico y contraseña desde la pantalla de inicio de sesión.

### Resultado

El sistema valida las credenciales y permite el acceso de acuerdo con el rol asignado.

### Criterios de aceptación

- Mostrar pantalla de inicio de sesión.
- Permitir ingresar correo electrónico.
- Permitir ingresar contraseña.
- Validar campos obligatorios.
- Validar formato del correo.
- Validar las credenciales.
- Verificar que el usuario se encuentre activo.
- Identificar el rol del usuario.
- Mostrar una alerta cuando las credenciales sean incorrectas.
- Mostrar una alerta cuando el usuario esté inactivo.
- Crear el mecanismo de autenticación.
- Redirigir al usuario al módulo correspondiente.
- Mantener la sesión mientras corresponda.
- Permitir cerrar sesión.
- Proteger las funcionalidades que requieren autenticación.

---

# HU03 — Gestionar usuarios y roles

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como administrador, quiero gestionar los usuarios y sus roles para controlar el acceso y las funcionalidades disponibles para cada usuario del sistema.**

### Contexto

El sistema será utilizado por ciudadanos y funcionarios municipales con diferentes responsabilidades.

### Evento

El administrador accede al módulo de usuarios y realiza una operación sobre una cuenta.

### Resultado

El sistema permite administrar las cuentas y asignar los permisos correspondientes.

### Criterios de aceptación

- Mostrar usuarios registrados.
- Registrar usuarios internos.
- Consultar usuarios.
- Consultar el detalle de un usuario.
- Editar usuarios.
- Activar usuarios.
- Desactivar usuarios.
- Asignar roles.
- Validar campos obligatorios.
- Evitar usuarios duplicados.
- Mostrar alertas de confirmación.
- Mostrar alertas de errores.
- Restringir estas operaciones al administrador.
- Registrar los cambios realizados.
- Aplicar los permisos correspondientes a cada rol.

### Roles considerados

- Ciudadano.
- Encargado de recepción.
- Personal de verificación.
- Encargado de solución.
- Personal de solución.
- Administrador.

---

# HU04 — Gestionar categorías de incidentes

**Prioridad:** Alta

**Story Points:** 5

**Tiempo estimado:** 8 horas

## Historia de usuario

**Como administrador, quiero gestionar las categorías de incidentes para organizar y clasificar correctamente los problemas urbanos reportados por los ciudadanos.**

### Contexto

Los incidentes urbanos pueden corresponder a diferentes tipos de problemas.

### Evento

El administrador accede al módulo de categorías y registra, modifica o desactiva una categoría.

### Resultado

El sistema mantiene actualizadas las categorías disponibles para realizar reportes.

### Criterios de aceptación

- Mostrar categorías registradas.
- Permitir crear categorías.
- Permitir editar categorías.
- Permitir activar o desactivar categorías.
- Validar que el nombre sea obligatorio.
- Evitar categorías duplicadas.
- Mostrar alertas de validación.
- Mostrar alertas de confirmación.
- Registrar las categorías en la base de datos.
- Mostrar únicamente categorías activas al ciudadano.

### Categorías iniciales

- Residuos.
- Baches.
- Alumbrado público.
- Espacios públicos.
- Infraestructura urbana.
- Otros.

---

# HU05 — Validar formularios y mostrar alertas

**Prioridad:** Alta

**Story Points:** 5

**Tiempo estimado:** 8 horas

## Historia de usuario

**Como usuario, quiero recibir validaciones y alertas claras cuando ingrese información incorrecta o cuando ocurra una acción importante para saber qué debo corregir o qué resultado tuvo mi operación.**

### Contexto

El sistema contará con múltiples formularios y operaciones que requieren información válida.

### Evento

El usuario completa un formulario o realiza una operación.

### Resultado

El sistema valida la información y muestra mensajes claros sobre errores, advertencias, confirmaciones o resultados exitosos.

### Criterios de aceptación

- Validar campos obligatorios.
- Validar formatos.
- Validar rangos permitidos.
- Mostrar mensajes junto a los campos incorrectos.
- Mostrar alertas de error.
- Mostrar alertas de advertencia.
- Mostrar alertas de confirmación.
- Mostrar alertas de operación exitosa.
- Evitar enviar formularios inválidos.
- Indicar claramente qué campo debe corregirse.
- Validar nuevamente la información en el backend.
- Evitar depender únicamente de las validaciones del frontend.
- Utilizar mensajes comprensibles para el usuario.

---

# Sprint 2 — Reporte y gestión de incidentes

## Descripción

El segundo Sprint estará enfocado en la funcionalidad principal del sistema: **el reporte de incidentes urbanos**.

Los ciudadanos podrán registrar problemas, seleccionar categorías, proporcionar descripciones, adjuntar fotografías como evidencia y enviar la ubicación del incidente.

Posteriormente, los funcionarios podrán consultar y gestionar los reportes recibidos.

### Historias incluidas

- HU06 — Registrar incidente
- HU07 — Adjuntar evidencia fotográfica
- HU08 — Registrar ubicación del incidente
- HU09 — Consultar y gestionar incidentes
- HU10 — Asignar incidente para verificación

---

# HU06 — Registrar incidente

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como ciudadano, quiero registrar un incidente urbano seleccionando su categoría y proporcionando una descripción para informar a la Alcaldía sobre un problema que requiere atención.**

### Contexto

El ciudadano encuentra un problema urbano que necesita ser comunicado a la Alcaldía.

### Evento

El ciudadano inicia un nuevo reporte y completa la información solicitada.

### Resultado

El sistema registra el incidente y genera una solicitud con un estado inicial.

### Criterios de aceptación

- Permitir crear un nuevo incidente.
- Mostrar las categorías disponibles.
- Permitir seleccionar una categoría.
- Permitir ingresar un título.
- Permitir ingresar una descripción.
- Validar que la categoría sea obligatoria.
- Validar que el título sea obligatorio.
- Validar que la descripción sea obligatoria.
- Validar la longitud de los campos.
- Permitir adjuntar evidencia.
- Permitir registrar ubicación.
- Registrar automáticamente fecha y hora.
- Asociar el incidente con el ciudadano autenticado.
- Generar un identificador único para el incidente.
- Asignar estado inicial "Reportado".
- Mostrar una alerta de confirmación.
- Mostrar una alerta si existe información inválida.
- Evitar enviar reportes incompletos.
- Guardar el incidente en la base de datos.

---

# HU07 — Adjuntar evidencia fotográfica

**Prioridad:** Alta

**Story Points:** 5

**Tiempo estimado:** 10 horas

## Historia de usuario

**Como ciudadano, quiero adjuntar fotografías del problema urbano para proporcionar evidencia que ayude a la Alcaldía a verificar el incidente reportado.**

### Contexto

Una fotografía permite aportar evidencia visual del problema informado.

### Evento

El ciudadano selecciona o captura una fotografía al momento de realizar el reporte.

### Resultado

La fotografía queda asociada al incidente como evidencia.

### Criterios de aceptación

- Permitir seleccionar una imagen desde el dispositivo.
- Permitir utilizar la cámara cuando la plataforma lo permita.
- Mostrar una vista previa.
- Permitir eliminar una imagen antes de enviar.
- Validar el formato de la imagen.
- Validar el tamaño máximo permitido.
- Validar la cantidad máxima de imágenes.
- Mostrar alertas cuando la imagen no sea válida.
- Almacenar la evidencia de manera segura.
- Asociar la evidencia con el incidente.
- Permitir consultar posteriormente la evidencia.

---

# HU08 — Registrar ubicación del incidente

**Prioridad:** Alta

**Story Points:** 5

**Tiempo estimado:** 10 horas

## Historia de usuario

**Como ciudadano, quiero registrar la ubicación del incidente para que el personal municipal pueda identificar dónde se encuentra el problema.**

### Contexto

La ubicación precisa es necesaria para realizar posteriormente la verificación y atención del incidente.

### Evento

El ciudadano registra la ubicación del problema desde su dispositivo.

### Resultado

El sistema almacena la ubicación asociada al incidente.

### Criterios de aceptación

- Solicitar permiso de ubicación cuando corresponda.
- Obtener la ubicación actual.
- Registrar latitud.
- Registrar longitud.
- Mostrar la ubicación antes de enviar el reporte.
- Permitir confirmar la ubicación.
- Validar que exista una ubicación antes de enviar.
- Mostrar una alerta si no se puede obtener la ubicación.
- Asociar la ubicación al incidente.
- Permitir consultar la ubicación posteriormente.

---

# HU09 — Consultar y gestionar incidentes

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como encargado de recepción, quiero consultar los incidentes reportados para revisar la información proporcionada por los ciudadanos y gestionar las solicitudes recibidas.**

### Contexto

Los incidentes registrados por los ciudadanos deben ser revisados por personal de la Alcaldía.

### Evento

El encargado accede al módulo de incidentes.

### Resultado

El sistema muestra los reportes disponibles y permite revisar su información.

### Criterios de aceptación

- Mostrar lista de incidentes.
- Mostrar identificador.
- Mostrar categoría.
- Mostrar descripción.
- Mostrar ciudadano que realizó el reporte.
- Mostrar fecha y hora.
- Mostrar ubicación.
- Mostrar evidencia.
- Mostrar estado.
- Permitir buscar incidentes.
- Permitir filtrar por categoría.
- Permitir filtrar por estado.
- Permitir filtrar por fecha.
- Permitir consultar el detalle.
- Mostrar alertas cuando una operación no pueda realizarse.
- Restringir las funcionalidades según el rol.

---

# HU10 — Asignar incidente para verificación

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como encargado de recepción, quiero asignar un incidente a un funcionario de verificación para que compruebe físicamente si el problema reportado existe.**

### Contexto

Los reportes recibidos deben ser comprobados antes de ser enviados al área responsable de solucionarlos.

### Evento

El encargado selecciona un incidente y asigna un funcionario de verificación.

### Resultado

El incidente queda asignado al funcionario correspondiente y cambia su estado.

### Criterios de aceptación

- Mostrar incidentes pendientes de verificación.
- Mostrar información del incidente.
- Mostrar ubicación.
- Mostrar evidencia.
- Mostrar funcionarios disponibles.
- Permitir seleccionar un funcionario.
- Registrar quién realizó la asignación.
- Registrar fecha y hora.
- Cambiar el estado a "En verificación".
- Notificar al funcionario asignado.
- Notificar al ciudadano sobre el cambio de estado.
- Mostrar alertas de confirmación.
- Mostrar alertas cuando no sea posible realizar la asignación.
- Registrar la asignación en el historial.

---

# Sprint 3 — Seguimiento, solución, notificaciones y administración

## Descripción

El tercer Sprint estará enfocado en completar el ciclo de atención del incidente.

Se implementará la verificación del problema, asignación al personal encargado de solucionarlo, seguimiento del trabajo, cambios de estado, notificaciones al ciudadano e historial completo.

También se incorporarán funcionalidades de administración y supervisión.

### Historias incluidas

- HU11 — Verificar incidente
- HU12 — Asignar incidente para solución
- HU13 — Atender y cerrar incidente
- HU14 — Recibir notificaciones y consultar seguimiento
- HU15 — Administrar y supervisar el sistema

---

# HU11 — Verificar incidente

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como personal de verificación, quiero revisar y verificar un incidente en el lugar indicado para determinar si el problema reportado realmente existe.**

### Contexto

Un ciudadano ha reportado un problema y el encargado de recepción lo ha asignado para verificación.

### Evento

El funcionario consulta el incidente y se dirige a la ubicación registrada.

### Resultado

El funcionario registra el resultado de la verificación.

### Criterios de aceptación

- Mostrar incidentes asignados.
- Mostrar ubicación.
- Mostrar descripción.
- Mostrar fotografías.
- Permitir registrar observaciones.
- Permitir indicar si el problema fue verificado.
- Permitir indicar si el problema no fue encontrado.
- Permitir adjuntar evidencia de la verificación.
- Registrar fecha y hora.
- Registrar el funcionario que realizó la verificación.
- Si el problema existe, cambiar a "Verificado".
- Si el problema no existe, cambiar a "Rechazado".
- Solicitar motivo cuando corresponda.
- Mostrar alertas de confirmación.
- Notificar al ciudadano el resultado.
- Registrar el resultado en el historial.

---

# HU12 — Asignar incidente para solución

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como encargado de solución, quiero asignar los incidentes verificados al personal responsable para que puedan realizar las acciones necesarias para solucionar el problema.**

### Contexto

Un incidente fue verificado y requiere una acción por parte de un área municipal.

### Evento

El encargado consulta los incidentes verificados y asigna uno a un responsable.

### Resultado

El incidente queda asignado al personal encargado de solucionarlo.

### Criterios de aceptación

- Mostrar incidentes verificados.
- Mostrar información completa del incidente.
- Mostrar resultado de la verificación.
- Mostrar funcionarios disponibles.
- Permitir seleccionar responsable.
- Registrar la asignación.
- Registrar fecha y hora.
- Cambiar el estado a "Asignado para solución".
- Notificar al responsable.
- Notificar al ciudadano sobre el cambio.
- Mostrar alertas de confirmación.
- Mostrar alertas de error.
- Registrar la acción en el historial.

---

# HU13 — Atender y cerrar incidente

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 16 horas

## Historia de usuario

**Como personal de solución, quiero registrar la atención realizada para dejar constancia de que el problema fue solucionado.**

### Contexto

El incidente ha sido asignado a un funcionario responsable de solucionar el problema.

### Evento

El funcionario realiza las acciones necesarias para solucionar el incidente.

### Resultado

El sistema registra la atención y permite cerrar la solicitud.

### Criterios de aceptación

- Mostrar incidentes asignados.
- Mostrar ubicación.
- Mostrar descripción.
- Mostrar evidencia inicial.
- Permitir registrar observaciones.
- Permitir registrar las acciones realizadas.
- Permitir adjuntar evidencia del trabajo realizado.
- Registrar fecha y hora.
- Registrar funcionario responsable.
- Cambiar el estado a "En atención".
- Permitir marcar como "Atendido".
- Permitir posteriormente cerrar la solicitud.
- Registrar el historial.
- Notificar al ciudadano.
- Mostrar alerta de confirmación.
- Mostrar alerta cuando falten datos necesarios.
- Evitar cerrar un incidente sin registrar la información requerida.

---

# HU14 — Recibir notificaciones y consultar seguimiento

**Prioridad:** Alta

**Story Points:** 8

**Tiempo estimado:** 14 horas

## Historia de usuario

**Como ciudadano, quiero recibir notificaciones cada vez que cambie el estado de mi incidente para conocer el avance de la atención realizada por la Alcaldía.**

### Contexto

El ciudadano necesita conocer qué sucede con su solicitud después de realizar el reporte.

### Evento

Un funcionario realiza una acción que modifica el estado del incidente.

### Resultado

El sistema registra el cambio y notifica automáticamente al ciudadano que realizó el reporte.

### Criterios de aceptación

- Mostrar los incidentes reportados por el ciudadano.
- Mostrar el estado actual.
- Mostrar la fecha del último cambio.
- Mostrar el historial de estados.
- Mostrar quién realizó cada cambio cuando corresponda.
- Generar una notificación ante cada cambio de estado.
- Enviar la notificación al ciudadano correspondiente.
- Mostrar notificaciones dentro del sistema.
- Mostrar alertas de nuevos cambios.
- Permitir consultar el detalle de una notificación.
- Permitir marcar notificaciones como leídas.
- Mantener historial de notificaciones.
- Evitar notificar a ciudadanos que no correspondan al incidente.
- Notificar estados como:
  - Reportado.
  - Recibido.
  - En verificación.
  - Verificado.
  - Asignado para solución.
  - En atención.
  - Atendido.
  - Cerrado.
  - Rechazado.
- Mostrar un mensaje claro sobre el cambio realizado.

### Flujo de notificación

```text
Funcionario cambia estado
          ↓
Sistema valida el cambio
          ↓
Actualiza el incidente
          ↓
Registra historial
          ↓
Genera notificación
          ↓
Notifica al ciudadano
          ↓
Ciudadano consulta el avance
```

---

# HU15 — Administrar y supervisar el sistema

**Prioridad:** Media

**Story Points:** 8

**Tiempo estimado:** 16 horas

## Historia de usuario

**Como administrador, quiero supervisar y administrar la información del sistema para controlar usuarios, categorías, incidentes y el funcionamiento general de la plataforma.**

### Contexto

El sistema necesita un usuario administrador que pueda gestionar los elementos principales de la plataforma.

### Evento

El administrador accede al panel de administración.

### Resultado

El administrador puede consultar y gestionar la información de acuerdo con sus permisos.

### Criterios de aceptación

- Mostrar un panel administrativo.
- Consultar cantidad de ciudadanos registrados.
- Consultar cantidad de incidentes.
- Consultar incidentes por estado.
- Consultar incidentes por categoría.
- Consultar incidentes atendidos.
- Consultar incidentes pendientes.
- Gestionar usuarios.
- Gestionar roles.
- Gestionar categorías.
- Consultar incidentes.
- Consultar historial de cambios.
- Consultar información de atención.
- Filtrar información.
- Mostrar alertas importantes.
- Mostrar indicadores generales.
- Restringir el acceso exclusivamente al administrador.
- Registrar acciones administrativas importantes.

---

# Requisitos transversales para todas las Historias de Usuario

Además de los criterios específicos de cada HU, **todas las funcionalidades del sistema deberán cumplir con las siguientes reglas**.

## Validación de campos

Todos los formularios deberán validar:

- Campos obligatorios.
- Tipos de datos.
- Longitud mínima y máxima.
- Formatos.
- Rangos.
- Valores permitidos.
- Datos duplicados cuando corresponda.

La validación deberá realizarse tanto en el **Frontend** como en el **Backend**.

---

## Sistema de alertas

El sistema deberá utilizar alertas y mensajes para informar al usuario sobre:

### Éxito

```text
"Incidente registrado correctamente."
```

### Error

```text
"No se pudo registrar el incidente."
```

### Advertencia

```text
"Debe seleccionar una categoría antes de continuar."
```

### Confirmación

```text
"¿Está seguro de que desea cerrar este incidente?"
```

### Notificación

```text
"El estado de su reporte #125 cambió a En atención."
```

---

# Estados oficiales de un incidente

El flujo general de estados será:

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

También podrá existir:

```text
RECHAZADO
```

cuando durante la verificación se determine que el problema no corresponde a un incidente válido o no pueda ser confirmado.

Cada cambio de estado deberá:

1. Validar que la transición sea permitida.
2. Actualizar el estado.
3. Registrar el cambio en el historial.
4. Registrar usuario responsable.
5. Registrar fecha y hora.
6. Generar una notificación.
7. Informar al ciudadano.

---

# Resumen general de los Sprints

## Sprint 1 — Usuarios y configuración

```text
HU01 → Registrar ciudadano
HU02 → Iniciar sesión
HU03 → Gestionar usuarios y roles
HU04 → Gestionar categorías
HU05 → Validar formularios y mostrar alertas
```

**Objetivo:** construir la base de usuarios, autenticación, roles, categorías y validaciones del sistema.

---

## Sprint 2 — Reporte y gestión de incidentes

```text
HU06 → Registrar incidente
HU07 → Adjuntar evidencia fotográfica
HU08 → Registrar ubicación
HU09 → Consultar y gestionar incidentes
HU10 → Asignar incidente para verificación
```

**Objetivo:** permitir que los ciudadanos reporten problemas urbanos y que la Alcaldía pueda recibirlos y asignarlos para su verificación.

---

## Sprint 3 — Seguimiento y atención

```text
HU11 → Verificar incidente
HU12 → Asignar incidente para solución
HU13 → Atender y cerrar incidente
HU14 → Recibir notificaciones y consultar seguimiento
HU15 → Administrar y supervisar el sistema
```

**Objetivo:** completar el ciclo del incidente desde la verificación hasta su atención, cierre y comunicación permanente con el ciudadano.

---

# Flujo completo del sistema

```text
                     CIUDADANO
                         │
                         ▼
                 Crear una cuenta
                         │
                         ▼
                     Iniciar sesión
                         │
                         ▼
                 Registrar incidente
                         │
              ┌──────────┴──────────┐
              │                     │
           Evidencia            Ubicación
              │                     │
              └──────────┬──────────┘
                         ▼
                    REPORTADO
                         │
                         ▼
                     RECIBIDO
                         │
                         ▼
                 EN VERIFICACIÓN
                         │
                         ▼
                    VERIFICADO
                         │
                         ▼
             ASIGNADO PARA SOLUCIÓN
                         │
                         ▼
                    EN ATENCIÓN
                         │
                         ▼
                     ATENDIDO
                         │
                         ▼
                      CERRADO
                         │
                         ▼
                     CIUDADANO
                         │
                         ▼
                  Recibe notificaciones
                  durante todo el proceso
```

# Objetivo de la planificación

La división en tres Sprints permitirá desarrollar el sistema de manera incremental.

El **Sprint 1** establecerá la base de usuarios y seguridad.

El **Sprint 2** implementará la funcionalidad principal de reporte de incidentes.

El **Sprint 3** completará el proceso de atención mediante verificación, asignación, solución, seguimiento, notificaciones y administración.

Todas las historias deberán implementar **validaciones de campos, manejo de errores, alertas y control de permisos**, garantizando una experiencia clara para los ciudadanos y funcionarios.