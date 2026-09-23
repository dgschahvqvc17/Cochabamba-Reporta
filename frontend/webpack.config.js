const path = require('path');
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
        exclude: /node_modules[/\\](?!react-native-web|expo|expo-.*|@expo|react-native-svg)/,
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
        test: /\.(png|jpe?g|jfif|gif|woff2?|ttf|eot|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
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