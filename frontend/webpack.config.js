const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  devtool: 'source-map',
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      '@react-native/assets-registry/registry': path.resolve(
        __dirname,
        'config',
        'asset-registry.stub.js',
      ),
      // En el build web la App usa la URL del host de Expo solo en
      // dispositivos; en web siempre es localhost, así que se usa un stub.
      'expo-constants': path.resolve(__dirname, 'config', 'expo-constants.stub.js'),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        // Los paquetes de Expo se distribuyen como TS/ESM en parte; se
        // compilan con babel para garantizar compatibilidad con el build web.
        exclude:
          /node_modules[/\\](?!react-native-web|expo|expo-.*|@expo|react-native-svg)|node_modules[/\\]expo-modules-core[/\\]src[/\\]ts-declarations/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              'babel-preset-expo',
              ['@babel/preset-typescript', { onlyRemoveTypeImports: true }],
            ],
            cacheDirectory: true,
          },
        },
      },
      {
        // ts-declarations solo definen tipos ambientales (`declare global`);
        // se embeben como texto para que webpack no intente resolver sus
        // re-exports de únicamente-tipo ("module has no exports").
        test: /node_modules[/\\]expo-modules-core[/\\]src[/\\]ts-declarations[/\\]/,
        type: 'asset/source',
      },
      {
        test: /\.(png|jpe?g|jfif|gif|woff2?|ttf|eot|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    // React Native define `__DEV__` vía Metro; en el build web los módulos
    // de Expo (expo-modules-core, expo-location, …) lo usan en runtime, así
    // que hay que definirlo aquí o el bundle lanza ReferenceError.
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
    }),
    // Algunos módulos de Expo asumen el global `global` (normal en Metro).
    new webpack.ProvidePlugin({ global: 'globalThis' }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    port: 8081,
    host: '0.0.0.0',
    hot: true,
    compress: true,
    client: {
      overlay: false,
    },
  },
};