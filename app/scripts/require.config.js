require.config({
  paths: {
    'jquery': 'vendor/jquery-1.10.2',
    'underscore': 'vendor/underscore',
    'Handlebars': 'vendor/handlebars',
    'hbars': 'vendor/hbars',
    'domReady': 'vendor/domReady',
    'text': 'vendor/text'
  },
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