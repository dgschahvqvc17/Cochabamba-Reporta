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
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules[/\\](?!react-native-web)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@react-native/babel-preset',
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