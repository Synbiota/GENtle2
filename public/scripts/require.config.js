require.config({
  baseUrl: './scripts/',
  paths: {
    'jquery':                 '../vendor/scripts/jquery-1.10.2',
    'jquery.ui':              '../vendor/scripts/jquery-ui-1.10.4.custom',
    'jquery.ui.touch-punch':  '../vendor/scripts/jquery.ui.touch-punch-0.2.3',
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
    'Blob':                   '../vendor/scripts/blob',
    'saveAs':                 '../vendor/scripts/filesaver',
    'BrowserDetect':          '../vendor/scripts/browserdetect',
    'gentle':                 'common/models/gentle',
    'backbone.mixed':         'common/lib/backbone.mixed',
    'underscore.mixed':       'common/lib/underscore.mixed',
    'Handlebars':             'common/lib/handlebars.mixed',
  },
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
    'jquery.ui': {
      deps: ['jquery']
    },
    'Handlebars.base': {
      exports: 'Handlebars'
    },
    bootstrap: {
      deps: ['jquery']
    },
    'bootstrap-confirmation': {
      deps: ['jquery', 'bootstrap']
    },
    'deepmodel': {
      deps: ['underscore.mixed']
    },
    'jquery.ui.touch-punch': {
      deps: ['jquery']
    }
  }
});