define(function(require) {
  var Backbone      = require('backbone'),
      LayoutMgr     = require('layoutmanager'),
      template      = require('hbars!../../templates/layout'),
      SequenceView  = require('views/sequence_view'),
      Layout;
      // Settings  = require('model/settings');


  Layout = LayoutMgr.extend({
    el: '#wrapper',
    template: template
  });

  return Layout;
});