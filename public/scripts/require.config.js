require.config({
  baseUrl: './scripts/',
  paths: {
    'jquery':                 '../vendor/scripts/jquery-1.10.2',
    'underscore':             '../vendor/scripts/underscore-1.6.0',
    'Handlebars.base':        '../vendor/scripts/handlebars',
    'hbars':                  '../vendor/scripts/hbars',
    'domReady':               '../vendor/scripts/domReady',
    'text':                   '../vendor/scripts/text',
    'q':                      '../vendor/scripts/q-1.0.1',
    'backbone':               '../vendor/scripts/backbone-1.1.2',
    'layoutmanager':          '../vendor/scripts/backbone.layoutmanager-0.9.5',
    'deepmodel':              '../vendor/scripts/backbone.deepmodel-0.10.4',
    'localstorage':           '../vendor/scripts/backbone.localStorage-1.1.7',
    'bootstrap':              '../vendor/bootstrap/js/bootstrap',
    'bootstrap-confirmation': '../vendor/scripts/bootstrap-confirmation-fork',
    'gentle':                 'models/gentle',
    'backbone.mixed':         'lib/backbone.mixed',
    'underscore.mixed':       'lib/underscore.mixed',
    'Handlebars':             'lib/handlebars.mixed'
  },
  deps: [
    'lib/polyfills',
  ],
  hbars: {
    extension: '.hbs'
  },
  shim: {
    backbone: {
      deps: ['underscore.mixed', 'jquery'],
      exports: 'Backbone'
    },
    jquery: {
      exports: '$'
    },
    'Handlebars.base': {
      exports: 'Handlebars'
    },
    bootstrap: {
      deps: ['jquery']
    },
    'lib/utilities': {
      deps: ['underscore']
    },
    'bootstrap-confirmation': {
      deps: ['jquery', 'bootstrap']
    },
    'underscore.mixed': {
      exports: '_',
    },
    'deepmodel': {
      deps: ['underscore.mixed']
    }
  }
});