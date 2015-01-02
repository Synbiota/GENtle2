/**
@module Common
@submodule Views
**/
define(function(require) {
  var template      = require('../templates/layout.hbs'),
      NavbarView    = require('./navbar_view'),
      Backbone      = require('backbone.mixed'),
      Layout;

  Layout = Backbone.Layout.extend({
    el: '#wrapper',
    template: template,

    initialize: function() {
      this.setView('#navbar', new NavbarView());
    },

  });

  return Layout;
});