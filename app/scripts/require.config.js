require.config({
  paths: {
    'jquery':       'lib/vendor/jquery-1.10.2',
    'underscore':   'lib/vendor/underscore',
    'Handlebars':   'lib/vendor/handlebars',
    'hbars':        'lib/vendor/hbars',
    'domReady':     'lib/vendor/domReady',
    'text':         'lib/vendor/text',
    'promise':      'lib/vendor/promise-3.2.0',
    'backbone':     'lib/vendor/backbone-1.1.2',
    'layoutmanager':'lib/vendor/backbone.layoutmanager-0.9.5'
  },
  deps: [
    'lib/utils/polyfills',
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
  }
});