/**
Gentle app definition.
**/

require([
    'common/views/layout',
    'domReady',
    'router',
    'sequence/models/sequences',
    'backbone.mixed',
    'gentle',
    'bootstrap'
  ], function(Layout, domReady, Router, Sequences, Backbone, Gentle) {

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