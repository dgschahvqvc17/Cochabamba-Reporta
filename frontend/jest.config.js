module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.jfif$': '<rootDir>/__mocks__/staticAsset.js',
  },
  // HU07: react-native-image-picker se publica como TS (src/); babel debe
  // transformarlo en los tests.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-image-picker)/)',
  ],
};