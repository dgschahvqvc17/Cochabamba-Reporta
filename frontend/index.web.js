/**
 * Punto de entrada para web (react-native-web + webpack).
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { createRoot } from 'react-dom/client';

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
createRoot(document.getElementById('root')).render(<App />);