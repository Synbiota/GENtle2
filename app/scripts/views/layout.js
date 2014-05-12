define(function(require) {
  var template      = require('hbars!templates/layout'),
      NavbarView    = require('views/navbar_view'),
      Layout;
      // Settings  = require('model/settings');


  Layout = Backbone.Layout.extend({
    el: '#wrapper',
    template: template,

    initialize: function() {
      this.setView('#navbar', new NavbarView());
    }

  });

  return Layout;
});