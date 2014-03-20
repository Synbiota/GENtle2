define(function(require) {
  var Backbone      = require('backbone'),
      LayoutMgr     = require('layoutmanager'),
      template      = require('hbars!templates/layout'),
      NavbarView    = require('views/navbar_view'),
      Layout;
      // Settings  = require('model/settings');


  Layout = LayoutMgr.extend({
    el: '#wrapper',
    template: template,

    initialize: function() {
      this.setView('#navbar', new NavbarView());
    }

  });

  return Layout;
});