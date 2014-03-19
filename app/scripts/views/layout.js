define(function(require) {
  var Backbone      = require('backbone'),
      LayoutMgr     = require('layoutmanager'),
      template      = require('hbars!templates/layout'),
      // SequenceView  = require('views/sequence_view'),
      NavbarView    = require('scripts/views/navbar_view.js'),
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