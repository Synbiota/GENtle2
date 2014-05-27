/**
Gentle app definition.
**/

require([
    'require',
    'text!config.json',
    'common/views/layout',
    'domReady',
    'router',
    'sequence/models/sequences',
    'underscore.mixed',
    'backbone.mixed',
    'gentle',
    // Just loading libraries, no object created
    'bootstrap',
    'jquery.ui',
    'common/lib/polyfills',
    'jquery.ui.touch-punch',
    'Blob'
  ], function(require, config, Layout, domReady, Router, Sequences, _, Backbone, Gentle) {

  var plugins = [];

  config = JSON.parse(config);

  if(_.isArray(config.plugins)) {
    plugins = _.map(config.plugins, function(plugin) {
      return 'plugins/' + plugin + '/plugin';
    });
  }

  require(plugins, function() {

    Gentle = Gentle();

    Gentle.sequences = new Sequences();

    Gentle.sequences.fetch();
    
    Gentle.router = new Router();
    window.gentle = Gentle;

    domReady(function() {
      Gentle.layout = new Layout();
      Backbone.history.start();
    });
  });

});