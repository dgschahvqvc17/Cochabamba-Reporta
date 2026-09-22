/**
 * Punto de entrada para web (react-native-web + webpack).
 *
 * Inyecta las fuentes premium (Poppins headings + Inter body) vía @font-face.
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { createRoot } from 'react-dom/client';

import App from './App';
import { name as appName } from './app.json';
import poppinsLight from '@fontsource/poppins/files/poppins-latin-400-normal.woff2';
import poppinsSemi from '@fontsource/poppins/files/poppins-latin-600-normal.woff2';
import poppinsBold from '@fontsource/poppins/files/poppins-latin-700-normal.woff2';
import poppinsExtra from '@fontsource/poppins/files/poppins-latin-800-normal.woff2';
import interRegular from '@fontsource/inter/files/inter-latin-400-normal.woff2';
import interMedium from '@fontsource/inter/files/inter-latin-500-normal.woff2';
import interSemi from '@fontsource/inter/files/inter-latin-600-normal.woff2';
import interBold from '@fontsource/inter/files/inter-latin-700-normal.woff2';

const fontFaces = [
  ['Poppins', 400, poppinsLight],
  ['Poppins', 600, poppinsSemi],
  ['Poppins', 700, poppinsBold],
  ['Poppins', 800, poppinsExtra],
  ['Inter', 400, interRegular],
  ['Inter', 500, interMedium],
  ['Inter', 600, interSemi],
  ['Inter', 700, interBold],
];

function injectFonts() {
  const css = fontFaces
    .map(
      ([family, weight, url]) =>
        `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('woff2')}`,
    )
    .join('\n');
  const style = document.createElement('style');
  style.setAttribute('data-fonts', 'cochabamba-reporta');
  style.textContent = css;
  document.head.appendChild(style);
}

injectFonts();

AppRegistry.registerComponent(appName, () => App);
createRoot(document.getElementById('root')).render(<App />);