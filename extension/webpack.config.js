const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.ts',
    popup: './src/popup.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'src/[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/popup.html', to: 'src/' },
        { from: 'public', to: 'public', noErrorOnMissing: true },
        { 
          from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
          to: 'vendor/',
          noErrorOnMissing: true
        }
      ],
    }),
  ],
  optimization: {
    minimize: true
  }
}; 