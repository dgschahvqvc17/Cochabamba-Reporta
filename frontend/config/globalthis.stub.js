/**
 * Stub de reemplazo del paquete npm `globalthis` para el build web (webpack).
 *
 * Problema original: webpack resuelve `global` (ProvidePlugin "globalThis")
 * al paquete `globalthis`, cuyo `getPolyfill()` devuelve un "implementation"
 * reducido (solo globals JS ES2016+, SIN APIs del navegador como
 * `cancelAnimationFrame` o `requestAnimationFrame`) porque en el navegador
 * no existe una variable `global`. Eso rompía RN Animated
 * (`global.cancelAnimationFrame is not a function`) al detener/arrancar
 * animaciones, dejando la pantalla en blanco tras desmontar el LoginScreen.
 *
 * Este stub exporta el `globalThis` real del runtime, es decir, `window`.
 *
 * @format
 */

'use strict';

/* global globalThis */

module.exports = globalThis;