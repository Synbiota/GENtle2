require.config({
  paths: {
    'jquery': 'vendor/jquery-1.10.2',
    'underscore': 'vendor/underscore',
    'handlebars': 'vendor/handlebars',
    'domReady': 'vendor/domReady'
  },
  shim: {
    underscore: {
      exports: '_'
    }
  }
});