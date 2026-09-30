/**
 * Stub de `@react-native/assets-registry/registry` para la compilación web.
 *
 * react-native-svg lo importa para resolver assets por ID numérico en la web
 * (SvgImage con `source={{ uri }}`), pero react-native-web no expone
 * `AssetRegistry`. La app no usa assets numerados dentro de SVG (solo
 * Path), por lo que se satisface con un registro vacío.
 *
 * @format
 */

'use strict';

module.exports = {
  registerAsset: (asset) => asset,
  getAssetByID: () => undefined,
};