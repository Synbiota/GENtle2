/**
@module Sequence
@submodule Views
@class DisplaySettingsView
**/
define(function(require) {
  var template        = require('hbars!sequence/templates/display_settings_view'),
      Gentle          = require('gentle')(),
      Backbone        = require('backbone.mixed'),
      DisplaySettingsView;
  
  DisplaySettingsView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'change input': 'updateDisplaySettings'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
    },

    updateDisplaySettings: function(event) {
      var $input = this.$(event.currentTarget);
      switch($input.attr('type')) {
        case 'checkbox':
          this.model.set($input.attr('name'), !!$input.is(':checked') && !$input.is(':disabled'));
          break;
        case 'radio':
          if(!!$input.is(':checked') && !$input.is(':disabled'))
            this.model.set($input.attr('name'), $input.val());
          break;
      }
      this.model.throttledSave();
    },

    populate: function() {
      var _this = this;
      this.$('input').each(function(i, element){
        var $element = $(element),
            modelValue = _this.model.get($element.attr('name'));
        switch($element.attr('type')) {
          case 'checkbox':
            if(!!modelValue) $element.attr('checked', 'checked');
            break;
          case 'radio':
            if($element.val() == modelValue) $element.attr('checked', 'checked');
            else $element.removeAttr('checked');
            break;
          case 'text':
            $element.val(modelValue);
            break;
        }
      }); 
    },

    afterRender: function() {
      this.populate();
    }

  });

  return DisplaySettingsView;
});