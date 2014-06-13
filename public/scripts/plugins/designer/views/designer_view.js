define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/designer_view_template'),
      DesignerView;

  DesignerView = Backbone.View.extend({
    template: template,
    manage: true
  });

  return DesignerView;
});