const path = require('path');
const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "events": false
    },
    alias: {
      // Force ESM version of Supabase where possible
      '@supabase/postgrest-js': path.resolve(__dirname, '../../node_modules/@supabase/postgrest-js/dist/esm/index.js'),
    }
  },
  
  module: {
    rules: [
      {
        test: /\.m?js$/,
        include: /node_modules/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.js$/,
        include: /node_modules\/@supabase/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false, // Keep ES modules for tree shaking
                targets: {
                  esmodules: true
                }
              }]
            ]
          }
        }
      }
    ]
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
          priority: 30,
          enforce: true
        },
        primeng: {
          test: /[\\/]node_modules[\\/]primeng[\\/]/,
          name: 'primeng',
          chunks: 'all', 
          priority: 20,
          enforce: true
        },
        angular: {
          test: /[\\/]node_modules[\\/]@angular[\\/]/,
          name: 'angular',
          chunks: 'all',
          priority: 15,
          enforce: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          enforce: true
        }
      }
    },
    
    usedExports: true,
    sideEffects: false,
    
    // Minimize bundle size
    minimize: true
  },

  plugins: [
    // Define environment variables for dead code elimination
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global': 'globalThis'
    }),

    // Ignore CommonJS warnings for specific modules
    new webpack.ContextReplacementPlugin(
      /(@supabase|tslib)/,
      (data) => {
        delete data.dependencies[0].critical;
        return data;
      }
    )
  ]
};