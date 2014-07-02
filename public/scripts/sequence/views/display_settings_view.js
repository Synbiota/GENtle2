/**
@module Sequence
@submodule Views
@class DisplaySettingsView
**/
define(function(require) {
  var template        = require('hbars!sequence/templates/display_settings_view'),
      Gentle          = require('gentle')(),
      Backbone        = require('backbone.mixed'),
      _               = require('underscore.mixed'),
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
      var $input = this.$(event.currentTarget),
          attr = $input.attr('name'),
          modelValue = this.model.get(attr);

      switch($input.attr('type')) {
        case 'checkbox':
          if(_.isArray(modelValue)) {
            if(~modelValue.indexOf($input.val())) {
              if(!$input.is(':checked'))
                this.model.set(attr, _.without(modelValue, $input.val()));  
            } else {
              if(!!$input.is(':checked')) {
                modelValue.push($input.val());
                this.model.set(attr, modelValue, $input.val());  
              }
            }
          } else {
            this.model.set(attr, !!$input.is(':checked') && !$input.is(':disabled'));
          }
          break;
        case 'radio':
          if(!!$input.is(':checked') && !$input.is(':disabled'))
            this.model.set(attr, $input.val());
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
            if(_.isArray(modelValue)) {
              if($element.attr('name') == 'displaySettings.rows.res.lengths')
                console.log(modelValue, $element.val())
              if(~modelValue.indexOf($element.val())) 
                $element.attr('checked', 'checked');
            } else {
              if(!!modelValue) $element.attr('checked', 'checked');
            }
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
    },

    serialize: function() {
      return {
        recognitionSites: _.range(1,10)
      };
    }

  });

  return DisplaySettingsView;
});