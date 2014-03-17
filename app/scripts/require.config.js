require.config({
  paths: {
    'jquery': 'vendor/jquery-1.10.2',
    'underscore': 'vendor/underscore',
    'Handlebars': 'vendor/handlebars',
    'hbars': 'vendor/hbars',
    'domReady': 'vendor/domReady',
    'text': 'vendor/text',
    'promise': 'vendor/promise-0.1.1',
    'eventEmitter': 'vendor/EventEmitter'
  },
  deps: ['utils/polyfills'],
  hbars: {
    extension: '.hbs'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    Handlebars: {
      exports: 'Handlebars'
    }
  }
});