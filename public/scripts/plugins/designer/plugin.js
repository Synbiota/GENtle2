define(function(require) {
  var Gentle    = require('gentle')(),
      DesignerView  = require('./views/designer_view');

  Gentle.addPlugin('sequence-primary-view', {
    name: 'designer',
    title: 'Designer',
    view: DesignerView
  });

  return Math;
});