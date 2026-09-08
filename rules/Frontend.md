# Frontend — Guía de Diseño y Desarrollo UI/UX

Este documento define la **identidad visual**, la **tipografía**, los **componentes** y las **convenciones de desarrollo** del frontend del *Sistema Multiplataforma de Reporte y Seguimiento de Incidentes Urbanos* para la **Alcaldía Municipal de Cochabamba**.

El frontend está construido con **React Native** (Android, iOS, Web y Escritorio) siguiendo una arquitectura **MVC** (View–Controller separados de la lógica).

> **Filosofía de diseño:** moderno, elegante, sorprendente y llamativo. Cada pantalla debe transmitir confianza institucional pero con una experiencia ágil, limpia y contemporánea.

---

## 1. Identidad y personalidad visual

El diseño debe evocar la **llajta**: los Andes, el valle, el cielo celeste de Cochabamba, la frescura del verde andino y la calidez de su gente.

Buscaremos un estilo **"institucional moderno"**:

- Superficies limpias con **mucho aire (espacios en blanco)**.
- **Esquinas redondeadas** y sombras suaves para dar profundidad.
- **Gradientes sutiles** para destacar momentos clave.
- Micro-interacciones animadas y fluyentes.
- Foco en la **usabilidad** del ciudadano: todo debe ser obvio y rápido.

---

## 2. Sistema de colores

El color es la identidad más fuerte. Se toma como base el **celeste andino** y el **verde andino**, propios de la región, con una paleta moderna y optimizada para contraste.

### 2.1 Paleta principal (Primarios)

| Nombre | Hex | Uso |
|---|---|---|
| **Azul Cochabamba** | `#0B4A6F` | Color institucional principal (encabezados, navbar, botones primarios) |
| **Celeste Andino** | `#16A3E0` | Acentos, enlaces, resaltados, gradientes |
| **Verde Andino** | `#4Ca866` | Éxito, estados "verificado/atendido", acentos secundarios |
| **Dorado Sol** | `#F2B705` | Acentos llamativos, premios, resaltes de atención (amarillo bandera) |
| **Rojo Granadilla** | `#E63946` | Errores, alertas, incidentes graves (rojo bandera) |

### 2.2 Paleta neutra (Fondos y textos)

| Nombre | Hex | Uso |
|---|---|---|
| **Blanco Puro** | `#FFFFFF` | Fondo principal de paneles |
| **Gris Nieve** | `#F4F7FA` | Fondo de pantalla / áreas secundarias |
| **Gris Suave** | `#E6ECF1` | Bordes suaves, separadores |
| **Gris Medio** | `#8A94A2` | Texto secundario, placeholders |
| **Gris Oscuro** | `#33404D` | Texto primario sobre claro |
| **Tinta** | `#141B22` | Títulos principales, alta jerarquía |

### 2.3 Uso recomendado

- **Superficie clara** como base (blanco / gris nieve) para legibilidad.
- **Azul Cochabamba** como color dominante de marca (navbar, logo, CTA).
- **Celeste Andino** en hover, enlaces y gradientes de iluminación.
- **Verde / Dorado** solo como acentos de estado y elementos de felicitación.
- **Rojo** reservado exclusivamente para errores y alertas críticas.

> **Regla:** nunca usar colores primarios sobre otros primarios sin contraste suficiente. Mantener al menos un 4.5:1 de relación de contraste para textos (WCAG AA).

---

## 3. Tipografía

Usa una familia **geométrica sans-serif** moderna y legible en pantallas móviles, buscando calidez sin perder elegancia.

### 3.1 Familia de letras

**Poppins** — para títulos, encabezados y elementos destacados.

**Inter** — para textos con mucho contenido, descripciones y formularios.

> Al ser React Native, ambas familias se integran vía fuentes de Google Fonts (o bundles locales con `@expo-google-fonts/poppins` e `@expo-google-fonts/inter`).

### 3.2 Escala tipográfica

| Nivel | Fuente | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| **Display / H1** | Poppins | 34 | Bold (700) | 1.1 | Pantalla de bienvenida, títulos de login |
| **Título H2** | Poppins | 24 | SemiBold (600) | 1.2 | Encabezados de sección |
| **Título H3** | Poppins | 18 | SemiBold (600) | 1.3 | Títulos de tarjetas |
| **Cuerpo** | Inter | 15 | Regular (400) | 1.5 | Texto general |
| **Cuerpo fuerte** | Inter | 15 | Medium (500) | 1.4 | Párrafos clave, descripciones |
| **Caption** | Inter | 12 | Regular (400) | 1.4 | Notas, metadatos, timestamps |
| **Label / Botón** | Poppins | 14 | Medium (500) | 1 | Etiquetas y botones |

---

## 4. Layout y espaciado

### 4.1 Sistema de espaciado (8 pt)

Usar una escala base de 8 px: **4, 8, 12, 16, 24, 32, 48, 64**.

- **Margen lateral de pantalla:** 24 px (móvil), 32 px (tablet/desktop).
- **Espacio entre tarjetas:** 16 px.
- **Espacio interno de tarjetas (padding):** 16–20 px.
- **Radio de esquinas:** 12 px (elementos), 16 px (tarjetas), 28 px (botones píldora).

### 4.2 Sombra / elevación

Sombras suaves y difusas para dar una sensación premium:

```js
shadowColor: '#0B4A6F',
shadowOpacity: 0.10,
shadowRadius: 12,
elevation: 4,
```

---

## 5. Diseño de pantallas clave

### 5.1 Pantalla de Inicio (Splash)

- Fondo con **gradiente azul Cochabamba → celeste andino**.
- **Logo de la Alcaldía** centrado con un sutil desvanecimiento/animação de entrada.
- Eslogan: *"Cochabamba, ciudad de todos"* en tipografía Poppins blanca.
- Un *spinner* o línea de progreso minimalista en color dorado.

### 5.2 Login (Inicio de sesión — HU02)

Diseño **a una columna, centrado y elegante**:

- Mitad superior con una **tarjeta fundida en gradiente** de marca + logo + saludo ("¡Hola! Bienvenido de nuevo").
- Mitad inferior sobre fondo blanco con el formulario:
  - Campo **Correo electrónico** (icono de sobre).
  - Campo **Contraseña** (icono de candado + botón mostrar/ocultar).
  - Checkbox **"Recordarme"**.
  - Botón **"Ingresar"** (primario, píldora, lleno, Azul Cochabamba).
  - Enlace inferior: *"¿No tienes cuenta? **Regístrate**"*.
- Estados de error: borde rojo en el campo + mensaje de validación bajo el campo.
- Carga: botón muestra un spinner y se deshabilita.

### 5.3 Registro (Registrar ciudadano — HU01)

Formulario en scroll, con campos agrupados por secciones:

1. **Datos personales:** nombres, apellidos, fecha de nacimiento (pickers de fecha).
2. **Identificación:** número de documento de identidad.
3. **Contacto:** teléfono, correo electrónico.
4. **Seguridad:** contraseña + confirmación de contraseña (con barra de fortaleza).
5. **Ubicación de referencia:** dirección o referencia opcional.

- Usar **avance por pasos (stepper)** si el formulario es largo, con indicador de progreso.
- Botón principal **"Crear cuenta"** al final, + enlace a login.
- Validaciones en vivo por campo (formato, obligatoriedad).

### 5.4 Barra de navegación (Navbar)

- **Arriba:** cabecera con logo a la izquierda + avatar/menú a la derecha.
- **Abajo (móvil):** barra de navegación con íconos y etiquetas. Ítems principales:
  - **Inicio** (Home)
  - **Reportar** (botón central destacado, flotante y de color)
  - **Mis incidentes** (Actividad)
  - **Notificaciones** (Campana con badge de nuevos)
  - **Perfil / Menú** (Avatar)
- El botón **Reportar** central debe sobresalir visualmente (FAB) en Azul Cochabamba con borde dorado.
- Ítem activo resaltado en **Celeste Andino** con indicador.
- Notificaciones marcan *badge* rojo con la cantidad no leída.

### 5.5 Home / Dashboard ciudadano

- Saludo personalizado: *"Hola, [Nombre] 👋"*.
- Tarjetas de resumen (contadores): Total, En atención, Atendidos.
- Acceso rápido: gran tarjeta **"Reportar un incidente"**.
- Feed con las últimas notificaciones / estados recientes.

### 5.6 Panel de incidentes (lista y detalle)

- Lista con **tarjetas**: categoría (icono + color), título, dirección, estado (badge de color), fecha.
- Filtros y búsqueda (categoría, estado, fecha).
- **Detalle:** galería de evidencia fotográfica, mapa con la ubicación, descripción, línea de tiempo (historial de estados), y badge del estado actual.

### 5.7 Estados → Color/Icono (SS)

| Estado | Color | Icono sugerido |
|---|---|---|
| Reportado | Celeste Andino | 📤 (nube) |
| Recibido | Gris Medio | 📥 (bandeja) |
| En verificación | Dorado Sol | 🔍 (lupa) |
| Verificado | Verde Andino | ✓ (check) |
| Asignado para solución | Azul Cochabamba | 📋 (clipboard) |
| En atención | Dorado Sol | 🔧 (herramienta) |
| Atendido | Verde Andino | ✅ (check doble) |
| Cerrado | Gris Oscuro | 🔒 (candado) |
| Rechazado | Rojo Granadilla | ⛔ (prohibido) |

---

## 6. Componentes reutilizables (`src/components/`)

| Componente | Descripción |
|---|---|
| `AppButton` | Botón primario / secundario / ghost con estados de carga |
| `AppTextInput` | Campo de texto con etiqueta, icono, error y validación |
| `AppCard` | Contenedor con sombra y radio uniformes |
| `StatusBadge` | Píldora de estado con color e icono |
| `CategoryChip` | Chip de categoría selectable |
| `Header` / `Navbar` | Barra superior y de navegación inferior |
| `FloatingReportButton` | FAB para reportar incidentes |
| `AlertBanner` | Alertas: éxito / error / advertencia / confirmación |
| `EmptyState` | Estado vacío amigable con ilustración |
| `LoadingIndicator` | Spinner / skeleton con marca de color |
| `ImagePicker` | Selector de evidencia fotográfica con preview |
| `LocationPicker` | Componente de mapa para ubicación |

**Todos los componentes** deben ser centralizados y con una fuente de verdad única (design system), para mantener consistencia (Principio DRY).

---

## 7. Estructura de archivos

```text
frontend/
│
├── src/
│   ├── components/        → Componentes reutilizables (design system)
│   ├── screens/           → Pantallas (Login, Registro, Dashboard, Incidentes, ...)
│   ├── controllers/       → Lógica de interacción (MVC)
│   ├── models/            → Estructuras de datos
│   ├── services/          → Consumo de la API REST
│   ├── navigation/        → Configuración de navegación
│   ├── theme/             → Paleta de colores, tipografía, espaciado (design tokens)
│   ├── assets/            → Imágenes, logos, íconos
│   ├── utils/             → Validaciones y helpers
│   └── App.jsx
│
└── package.json
```

### Design tokens (`src/theme/`)

Toda la configuración visual se debe centralizar:

```js
// colors.js
export const colors = {
  primary: '#0B4A6F',
  accent: '#16A3E0',
  success: '#4CA866',
  warning: '#F2B705',
  danger: '#E63946',
  background: '#F4F7FA',
  surface: '#FFFFFF',
  textPrimary: '#141B22',
  textSecondary: '#8A94A2',
  // ...
};

// typography.js
export const fonts = { heading: 'Poppins', body: 'Inter' };
export const fontSizes = { display: 34, h2: 24, h3: 18, body: 15, caption: 12 };
```

> **Nunca** colocar colores o tamaños "mágicos" esparcidos en componentes; deben venir del `theme` (ver Buenas Prácticas, valores mágicos).

---

## 8. Navegación

- Usar **React Navigation** (Stack + Bottom Tabs).
- Autenticación: **Auth Stack** (Login/Registro) vs **App Stack** (autenticado).
- Proteger las rutas que requieren sesión.
- Los **roles** determinan qué pantallas se muestran (ciudadano vs funcionario vs admin).

---

## 9. Servicios y comunicación con la API

- Los `services/` agrupan llamadas por recurso (`authService`, `incidentService`, `notificationService`, `userService`).
- Base URL configurada por entorno.
- Manejo uniforme de respuestas (`{ success, message, data }`) y de errores de red.
- Adjuntar **token de autenticación** en los encabezados de las peticiones que lo requieran.
- Subida de evidencias por `multipart/form-data`.

---

## 10. Consejos de accesibilidad y experiencia

- **Contraste adecuado** en todos los textos.
- **Área táctil mínima** de 48 px de alto para botones e ítems.
- **Estados focus / pressed** visibles.
- Mensajes de error descriptivos y junto al campo.
- Feedback de carga en todas las operaciones asíncronas.
- Compatible con distintos tamaños de pantalla (responsive para web/desktop).

---

## 11. Resumen del estilo "firma" del frontend

- **Azul profundo + celeste andino** como identidad de marca.
- **Poppins para títulos + Inter para cuerpo.**
- **Superficie clara, tarjetas redondeadas, sombras suaves.**
- **Gradientes sutiles** en pantallas de entrada (login, splash).
- **FAB "Reportar"** central destacado en la navegación.
- **Badges de estado codificados por color** para seguimiento visual inmediato.
- Micro-animaciones fluidas que hacen la app sentirse **sorpRendente y viva**.

El resultado debe sentirse como una app institucional moderna: **confiable pero ágil, elegante pero cercana**.
