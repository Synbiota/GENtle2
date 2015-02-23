define(function(require) {
  var Gentle    = require('gentle')(),
      DesignerView  = require('./views/designer_view'),
      HomeDesignerView = require('./views/home_designer_view');

  Gentle.addPlugin('sequence-primary-view', {
    name: 'designer',
    title: 'Combine sequences',
    view: DesignerView
  });

  Gentle.addPlugin('home', {
    name: 'designer',
    title: 'Designer',
    view: HomeDesignerView
  });

  return Gentle;
});