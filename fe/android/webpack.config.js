const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const chalk = require('chalk');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const name = '[name].[ext]?[sha512:hash:base64:6]';
module.exports = (env, argv) => {
  let plugins;
  let sasscPlugins;
  let options = require(`./android.json`);
  let webpackOptions = {
    hash: true,
    template: './android/index.ejs',
    inject: false
  };
  plugins = [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([
      {from: './src/assets/smileys', to: 'smileys'},
    ]),
    new webpack.DefinePlugin({
      PYCHAT_CONSTS: JSON.stringify(options),
    }),
    new HtmlWebpackPlugin(webpackOptions),
  ];
  const MiniCssExtractPlugin = require("mini-css-extract-plugin");
  plugins.push(new CleanWebpackPlugin('./www'));
  plugins.push(new MiniCssExtractPlugin());
  sasscPlugins = [
    MiniCssExtractPlugin.loader,
    'css-loader',
    {
      loader: "sass-loader",
      options: {
        indentedSyntax: true,
        includePaths: [path.resolve(__dirname, '../src/assets/sass')]
      }
    }
  ];

  const conf =  {
    entry: ['./android/main.ts'],
    plugins,
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        'vue': 'vue/dist/vue.js',
        '~': path.resolve(__dirname, '../src'),
        'Sass': path.resolve(__dirname, '../src/assets/sass')
      }
    },
    output: {
      path: __dirname + "/www",
      publicPath: '/' //https://github.com/webpack/webpack-dev-server/issues/851#issuecomment-399227814
    },
    optimization: { minimize: false},
    devtool: '#source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/]
          }
        },
        {
          exclude: /node_modules/,
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.sass$/,
          use: sasscPlugins
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: 'file-loader',
          options: {
            outputPath: 'font',
            publicPath: './font/',
            name,
          }
        },
        {
          test: /favicon\.ico$/,
          loader: 'file-loader',
          options: {
            outputPath: '',
            name,
          }
        },
        {
          test: /\.(mp3|wav)$/,
          loader: 'file-loader',
          options: {
            outputPath: 'sounds',
            publicPath: './sounds/',
            name,
          }
        },
        {
          test: /\.(png|jpg|svg)$/,
          loader: 'file-loader',
          options: {
            outputPath: 'img',
            publicPath: './img/',
            name,
          }
        }
      ],
    },
  };

    // create vendor.js file for development so webpack doesn't need to reassemble it every time
    // you can remove `argv.mode === 'development'` if you want it for prod. Or remove this if at all
    // conf.optimization = {
    //   splitChunks: {
    //     chunks: 'all',
    //     minSize: 0,
    //     maxAsyncRequests: Infinity,
    //     maxInitialRequests: Infinity,
    //     name: true,
    //     cacheGroups: {
    //       vendor: {
    //         name: 'vendor',
    //         chunks: 'initial',
    //         reuseExistingChunk: true,
    //         priority: -5,
    //         enforce: true,
    //         test: /[\\/]node_modules[\\/]/ // this also creates single css
    //       },
    //     }
    //   }
    // };
    // conf.
  // }
  return conf;
};
