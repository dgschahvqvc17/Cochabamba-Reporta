/**
 * Mock automático de @react-native-community/geolocation para los tests.
 *
 * En Jest el resolvedor usa el campo `react-native` (js/index), que accede
 * al módulo nativo RNCGeolocation (TurboModule) y lanza el error "doesn't
 * seem to be linked". Este mock simula la misma interface pública del
 * paquete sin tocar native code.
 *
 * @format
 */

module.exports = {
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(() => 0),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
    requestAuthorization: jest.fn(),
    setRNConfiguration: jest.fn(),
  },
};