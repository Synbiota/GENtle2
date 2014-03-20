require.config({
  baseUrl: './scripts/',
  paths: {
    'jquery':       '../vendor/scripts/jquery-1.10.2',
    'underscore':   '../vendor/scripts/underscore',
    'Handlebars':   '../vendor/scripts/handlebars',
    'hbars':        '../vendor/scripts/hbars',
    'domReady':     '../vendor/scripts/domReady',
    'text':         '../vendor/scripts/text',
    'promise':      '../vendor/scripts/promise-3.2.0',
    'backbone':     '../vendor/scripts/backbone-1.1.2',
    'layoutmanager':'../vendor/scripts/backbone.layoutmanager-0.9.5',
    'bootstrap':    '../vendor/bootstrap/js/bootstrap',
    'gentle':       'models/gentle'
  },
  deps: [
    'lib/polyfills',
    'lib/common'
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
    Handlebars: {
      exports: 'Handlebars'
    },
    bootstrap: {
      deps: ['jquery']
    }
  }
});