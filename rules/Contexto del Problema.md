# Contexto del Problema

## 1. Contexto general

La **Alcaldía Municipal de Cochabamba** tiene entre sus responsabilidades la atención y mantenimiento de diferentes aspectos de la infraestructura y los espacios públicos de la ciudad. Entre estos se encuentran la limpieza urbana, el mantenimiento de calles, la reparación de luminarias, el cuidado de espacios públicos y la atención de diferentes problemas que afectan directamente a los ciudadanos.

Actualmente, los ciudadanos pueden encontrarse con diferentes problemas urbanos, como:

- Acumulación de residuos o basura.
- Baches y deterioro de calles.
- Luminarias públicas dañadas.
- Deterioro de parques y espacios públicos.
- Daños en infraestructura urbana.
- Problemas relacionados con la limpieza y mantenimiento de áreas públicas.
- Otros incidentes que requieran atención municipal.

El principal problema identificado es la **dificultad para reportar estos incidentes y realizar un seguimiento adecuado de las solicitudes realizadas por los ciudadanos**, debido a la falta de un mecanismo digital accesible, centralizado y orientado específicamente a la gestión y seguimiento de este tipo de problemas.

---

# 2. Problema identificado

Los ciudadanos necesitan una forma sencilla y accesible de comunicar a la Alcaldía Municipal de Cochabamba los problemas urbanos que encuentran en diferentes puntos de la ciudad.

La ausencia de una plataforma centralizada puede dificultar aspectos como:

- Registrar formalmente un incidente.
- Identificar con precisión el lugar donde ocurre el problema.
- Adjuntar evidencia fotográfica.
- Clasificar correctamente el incidente.
- Conocer quién está atendiendo la solicitud.
- Realizar seguimiento al estado del reporte.
- Recibir información sobre los avances de la atención.
- Mantener un historial de los incidentes reportados por cada ciudadano.
- Facilitar la asignación de los incidentes al personal municipal correspondiente.

Como consecuencia, puede existir una falta de comunicación entre los ciudadanos y los responsables de atender los problemas urbanos, dificultando el seguimiento desde el momento en que se realiza el reporte hasta su solución.

---

# 3. Solución propuesta

Para solucionar esta problemática se propone desarrollar un **Sistema Multiplataforma de Reporte y Seguimiento de Incidentes Urbanos para la Alcaldía Municipal de Cochabamba**.

El sistema permitirá que los ciudadanos puedan reportar problemas urbanos desde diferentes dispositivos y plataformas:

- 📱 Android.
- 📱 iOS.
- 🌐 Aplicación web.
- 💻 Aplicación para escritorio.

El objetivo principal será establecer un canal digital centralizado mediante el cual los ciudadanos puedan **registrar incidentes, proporcionar evidencia, indicar su ubicación y realizar seguimiento al proceso de atención**.

---

# 4. Registro de ciudadanos

Cada ciudadano contará con una cuenta personal dentro del sistema.

Para crear una cuenta se solicitarán datos necesarios para identificar al usuario y permitir una correcta gestión de los reportes.

Entre los datos considerados se encuentran:

- Nombres.
- Apellidos.
- Fecha de nacimiento.
- Número de documento de identidad.
- Número de teléfono.
- Correo electrónico.
- Contraseña.
- Datos de ubicación o dirección de referencia.

La información personal será utilizada para identificar al ciudadano responsable del reporte y permitir que la Alcaldía pueda mantener una comunicación relacionada con sus solicitudes.

El ciudadano podrá iniciar sesión posteriormente utilizando sus credenciales.

---

# 5. Registro de incidentes

Una vez que el ciudadano haya iniciado sesión, podrá registrar un nuevo incidente urbano.

Para realizar un reporte deberá proporcionar información relacionada con el problema encontrado.

Cada incidente deberá clasificarse de acuerdo con una **categoría**, permitiendo organizar y distribuir correctamente las solicitudes.

Algunas categorías pueden ser:

- **Residuos:** acumulación de basura, contenedores llenos, residuos en espacios públicos, etc.
- **Baches:** calles deterioradas, huecos o daños en la calzada.
- **Alumbrado público:** luminarias dañadas, apagadas o con problemas.
- **Espacios públicos:** parques, plazas y otras áreas públicas deterioradas.
- **Infraestructura urbana:** daños en elementos de infraestructura municipal.
- **Otros:** incidentes que no correspondan a las categorías anteriores.

---

# 6. Información del reporte

Cada reporte deberá contener información suficiente para que el personal municipal pueda identificar y verificar el problema.

El ciudadano podrá proporcionar:

- Categoría del incidente.
- Título o descripción del problema.
- Descripción detallada.
- Fotografía del incidente.
- Ubicación exacta del incidente.
- Fecha y hora del reporte.
- Información del ciudadano que realizó el reporte.

La **fotografía funcionará como evidencia del incidente**, permitiendo al personal encargado verificar visualmente el problema reportado.

La ubicación permitirá identificar exactamente el lugar donde se encuentra el incidente.

---

# 7. Geolocalización

El sistema utilizará la ubicación del dispositivo para registrar la posición donde se encuentra el incidente.

La ubicación podrá incluir:

- Latitud.
- Longitud.
- Dirección o referencia aproximada.
- Fecha y hora de captura de la ubicación.

Esto permitirá que los responsables municipales puedan conocer con mayor precisión el lugar donde deben realizar la verificación y posteriormente la atención correspondiente.

---

# 8. Flujo de atención de un incidente

Después de que un ciudadano registre un incidente, este pasará por diferentes etapas dentro de la Alcaldía.

El flujo general será:

```text
Ciudadano
    │
    │ Registra incidente
    ▼
Solicitud recibida
    │
    ▼
Encargado de recepción
    │
    │ Asigna verificación
    ▼
Personal de verificación
    │
    │ Verifica el problema
    ▼
Incidente verificado
    │
    │ Envía resultado
    ▼
Encargado de solución
    │
    │ Asigna responsable
    ▼
Personal encargado de solucionar
    │
    │ Realiza el trabajo
    ▼
Incidente atendido
    │
    ▼
Ciudadano notificado
```

---

# 9. Estados de los incidentes

Cada solicitud tendrá un **estado** que permitirá conocer en qué etapa del proceso se encuentra.

Los estados pueden ser:

### 1. Reportado

El ciudadano acaba de registrar el incidente.

El sistema almacena la información, evidencia, ubicación y datos del ciudadano.

### 2. Recibido

La Alcaldía ha recibido formalmente la solicitud y esta se encuentra pendiente de revisión.

### 3. En verificación

El encargado ha asignado el incidente a un funcionario para comprobar físicamente si el problema existe.

### 4. Verificado

El personal encargado realizó la inspección y confirmó que el problema reportado existe.

### 5. Asignado para solución

El incidente fue enviado al área correspondiente y se asignó a un responsable para realizar la solución.

### 6. En atención

El personal responsable se encuentra realizando las actividades necesarias para solucionar el problema.

### 7. Atendido

El problema fue solucionado o atendido por el personal municipal.

### 8. Cerrado

La atención fue finalizada y el incidente queda registrado en el historial del sistema.

### 9. Rechazado

En caso de que durante la verificación se determine que el reporte no corresponde a un problema municipal válido, la solicitud podrá ser rechazada indicando el motivo.

---

# 10. Notificaciones y seguimiento

Una característica fundamental del sistema será mantener informado al ciudadano durante todo el proceso.

**Cada vez que el estado de un incidente cambie, el ciudadano que realizó el reporte deberá recibir una notificación.**

Por ejemplo:

```text
Reporte realizado
       ↓
🔔 "Su reporte fue recibido."
       ↓
🔔 "Su reporte está en proceso de verificación."
       ↓
🔔 "El problema fue verificado."
       ↓
🔔 "Se asignó personal para atender el problema."
       ↓
🔔 "El problema se encuentra en proceso de atención."
       ↓
🔔 "Su reporte ha sido atendido."
       ↓
🔔 "La solicitud ha sido cerrada."
```

De esta manera, el ciudadano no tendrá que comunicarse constantemente con la Alcaldía para conocer el estado de su solicitud.

El sistema mantendrá un **historial de cambios de estado**, permitiendo conocer las diferentes etapas por las que pasó cada incidente.

---

# 11. Roles del sistema

El sistema contará con diferentes tipos de usuarios para organizar el proceso de atención.

## Ciudadano

El ciudadano podrá:

- Crear una cuenta.
- Iniciar sesión.
- Actualizar sus datos.
- Registrar incidentes.
- Seleccionar categorías.
- Adjuntar fotografías.
- Registrar la ubicación del incidente.
- Consultar sus reportes.
- Consultar el estado de sus solicitudes.
- Recibir notificaciones.
- Consultar el historial de atención.

---

## Encargado de recepción

Será responsable de recibir y revisar los incidentes registrados por los ciudadanos.

Sus funciones podrán incluir:

- Consultar nuevos reportes.
- Revisar la información proporcionada.
- Revisar fotografías y ubicación.
- Clasificar o validar la categoría.
- Asignar un funcionario para realizar la verificación.
- Actualizar el estado del incidente.

---

## Personal de verificación

Será el funcionario encargado de acudir al lugar indicado por el ciudadano para comprobar la existencia del problema.

Podrá:

- Consultar la ubicación del incidente.
- Revisar la evidencia fotográfica.
- Realizar la verificación en el lugar.
- Registrar observaciones.
- Adjuntar evidencia de la verificación.
- Confirmar o rechazar la existencia del problema.
- Enviar el resultado al encargado correspondiente.

---

## Encargado de solución

Será responsable de gestionar los incidentes que hayan sido verificados y requieran una solución.

Sus funciones podrán incluir:

- Consultar incidentes verificados.
- Revisar la información del problema.
- Determinar el área responsable.
- Asignar personal para solucionar el incidente.
- Cambiar el estado de la solicitud.
- Supervisar el proceso de atención.

---

## Personal de solución

Será responsable de ejecutar las actividades necesarias para solucionar el problema urbano.

Podrá:

- Consultar los incidentes asignados.
- Revisar la ubicación.
- Revisar la descripción del problema.
- Realizar las actividades de mantenimiento o reparación.
- Registrar observaciones.
- Adjuntar evidencia del trabajo realizado.
- Marcar el incidente como atendido.

---

## Administrador del sistema

El administrador tendrá funciones relacionadas con la administración y configuración de la plataforma.

Podrá:

- Gestionar usuarios.
- Gestionar roles y permisos.
- Gestionar categorías de incidentes.
- Administrar cuentas del personal municipal.
- Gestionar configuraciones del sistema.
- Consultar información general.
- Supervisar el funcionamiento de la plataforma.

---

# 12. Trazabilidad de los incidentes

Cada incidente tendrá un historial que permitirá conocer todas las acciones realizadas durante su atención.

Por ejemplo:

```text
INCIDENTE #000125

08/09/2026  10:15
→ Reportado por ciudadano

08/09/2026  11:00
→ Solicitud recibida por la Alcaldía

08/09/2026  14:30
→ Asignado a personal de verificación

09/09/2026  09:20
→ Problema verificado

09/09/2026  11:00
→ Asignado al área responsable

10/09/2026  08:00
→ En atención

10/09/2026  15:30
→ Incidente atendido

10/09/2026  16:00
→ Solicitud cerrada
```

Esto permitirá mantener transparencia y trazabilidad sobre el proceso de atención.

---

# 13. Arquitectura tecnológica

El sistema será desarrollado utilizando una arquitectura separada entre **Frontend y Backend**.

### Frontend

Se utilizará **React Native** para desarrollar la aplicación móvil multiplataforma para Android e iOS.

Además, se contará con una interfaz web y una aplicación de escritorio, según las necesidades definidas para el proyecto.

### Backend

El backend proporcionará una **API REST**, encargada de:

- Autenticación.
- Gestión de usuarios.
- Gestión de incidentes.
- Gestión de categorías.
- Gestión de ubicaciones.
- Gestión de evidencias.
- Gestión de estados.
- Gestión de asignaciones.
- Gestión de notificaciones.
- Gestión de historial.
- Comunicación con la base de datos.

### Arquitectura MVC

El sistema utilizará el patrón **MVC (Model-View-Controller)** para organizar las responsabilidades del software.

```text
                 SISTEMA
                    │
        ┌───────────┴───────────┐
        │                       │
     FRONTEND                 BACKEND
        │                       │
   React Native              API REST
        │                       │
      View                  Controller
        │                       │
   Controller                 Model
        │                       │
        └───────────┬───────────┘
                    │
               BASE DE DATOS
```

---

# 14. Objetivo del sistema

El objetivo del proyecto es proporcionar a los ciudadanos de Cochabamba un **medio digital accesible, centralizado y multiplataforma para reportar problemas urbanos**, permitiendo adjuntar evidencia fotográfica, registrar la ubicación exacta del incidente y realizar seguimiento de la solicitud.

Al mismo tiempo, el sistema permitirá a la Alcaldía Municipal de Cochabamba **organizar, verificar, asignar y gestionar los incidentes reportados**, manteniendo un historial completo del proceso y notificando al ciudadano cada vez que exista un cambio en el estado de su solicitud.

De esta manera, se busca mejorar la comunicación entre los ciudadanos y la Alcaldía, facilitar la gestión de los problemas urbanos y proporcionar mayor **trazabilidad, transparencia y eficiencia en la atención de los incidentes**.