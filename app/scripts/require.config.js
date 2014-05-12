require.config({
  baseUrl: './scripts/',
  paths: {
    'jquery':       '../vendor/scripts/jquery-1.10.2',
    'underscore':   '../vendor/scripts/underscore-1.6.0',
    'Handlebars':   '../vendor/scripts/handlebars',
    'hbars':        '../vendor/scripts/hbars',
    'domReady':     '../vendor/scripts/domReady',
    'text':         '../vendor/scripts/text',
    'q':            '../vendor/scripts/q-1.0.1',
    'backbone':     '../vendor/scripts/backbone-1.1.2',
    'layoutmanager':'../vendor/scripts/backbone.layoutmanager-0.9.5',
    'backbone-relational':
                    '../vendor/scripts/backbone-relational-0.8.8',
    'deepmodel':    '../vendor/scripts/backbone.deepmodel-0.10.4',
    'localstorage': '../vendor/scripts/backbone.localStorage-1.1.7',
    'bootstrap':    '../vendor/bootstrap/js/bootstrap',
    'gentle':       'models/gentle'
  },
  deps: [
    'lib/polyfills',
    'underscore',
    'backbone',
    'deepmodel',
    'layoutmanager',
    'deepmodel',
    'lib/utilities'
  ],
  hbars: {
    extension: '.hbs'
  },
  shim: {
    backbone: {
      deps: [
        'underscore', 
        'jquery', 
      ],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    deepmodel: {
      deps: ['underscore']
    },
    jquery: {
      exports: '$'
    },
    Handlebars: {
      exports: 'Handlebars'
    },
    bootstrap: {
      deps: ['jquery']
    },
    'lib/utilities': {
      deps: ['underscore']
    }
  }
});