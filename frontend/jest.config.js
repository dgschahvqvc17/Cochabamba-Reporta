module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '\\.(jfif|jpg|jpeg|png|gif|webp|woff2?|ttf|eot|svg)$': '<rootDir>/__mocks__/staticAsset.js',
  },
};