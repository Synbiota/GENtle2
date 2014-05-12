require.config({
  baseUrl: './scripts/',
  paths: {
    'jquery':       '../vendor/scripts/jquery-1.10.2',
    'underscore':   '../vendor/scripts/underscore-1.6.0',
    'Handlebars':   '../vendor/scripts/handlebars',
    'hbars':        '../vendor/scripts/hbars',
    'domReady':     '../vendor/scripts/domReady',
    'text':         '../vendor/scripts/text',
    'promise':      '../vendor/scripts/promise-4.0.0',
    'backbone':     '../vendor/scripts/backbone-1.1.2',
    'layoutmanager':'../vendor/scripts/backbone.layoutmanager-0.9.5',
    'deepmodel':    '../vendor/scripts/backbone.deepmodel-0.10.4',
    'localstorage': '../vendor/scripts/backbone.localStorage-1.1.7',
    'bootstrap':    '../vendor/bootstrap/js/bootstrap',
    'gentle':       'models/gentle'
  },
  deps: [
    'lib/polyfills',
    'lib/utilities'
  ],
  hbars: {
    extension: '.hbs'
  },
  shim: {
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    jquery: {
      exports: '$'
    },
    promise: {
      exports: 'Promise',
    },
    Handlebars: {
      exports: 'Handlebars'
    },
    bootstrap: {
      deps: ['jquery']
    }
  }
});