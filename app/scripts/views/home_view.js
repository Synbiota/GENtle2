define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('hbars!templates/home_view'),
      HomeView;

  HomeView = Backbone.View.extend({
    manage: true,
    template: template
  });

  return HomeView;
});