/**
 * Punto de entrada de la aplicación (Expo).
 *
 * `registerRootComponent` es el reemplazo de Expo para
 * `AppRegistry.registerComponent` y configura el entorno de Expo
 * (mensajes, splash, refresco rápido) al arrancar.
 *
 * @format
 */

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);