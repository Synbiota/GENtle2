/**
@module Sequence
@submodule Views
@class ToolsView
**/
define(function(require) {
  var template        = require('hbars!../templates/tools_view'),
      Backbone        = require('backbone.mixed'),
      ToolsView;
  
  ToolsView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click .radio': 'changePrimaryView',
    },

    changePrimaryView: function(event) {
      var $element = this.$(event.currentTarget).find('input');
      this.parentView(2).changePrimaryView($element.val());
      this.render();
      event.preventDefault();
    },

    serialize: function() {
      var primaryViewName = this.parentView(2).primaryView.name;
      return {
        tools: _.map(this.parentView(2).primaryViews, function(view) {
          return _.extend({
            active: view.name == primaryViewName
          }, view);
        })
      };
    }

  });

  return ToolsView;
});