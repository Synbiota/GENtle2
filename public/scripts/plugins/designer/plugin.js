var Gentle    = require('gentle'),
    DesignerView  = require('./views/designer_view'),
    HomeDesignerView = require('./views/home_designer_view');

Gentle.addPlugin('sequence-primary-view', {
  name: 'designer',
  title: 'Assemble sequences',
  view: DesignerView,
  maximize: true,
  visible: () => false
});

Gentle.addPlugin('home', {
  name: 'designer',
  title: 'Designer',
  view: HomeDesignerView,
  order: 10
});