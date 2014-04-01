define(function(require) {
  var Backbone        = require('backbone'),
      template        = require('hbars!templates/sequence_settings_view'),
      Sequence        = require('models/sequence'),
      SequenceCanvas  = require('lib/sequence_canvas/sequence_canvas'),
      Gentle          = require('gentle'),
      _               = require('underscore'),
      SequenceSettingsView;

  Gentle = Gentle();
  
  SequenceSettingsView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click .sequence-settings-tab-link': 'toggleTabs',
      'change #sequence-display-settings-tab input': 'updateDisplaySettings'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      _.bindAll(this, 'populate')
      this.on('afterRender', this.populate);
    },

    toggleTabs: function(event) {
      event.preventDefault();
      var $link = this.$(event.currentTarget),
          wasActive = this.$el.hasClass('active');

      if($link.hasClass('active')) {
        this.$('.active').removeClass('active');
        this.$el.removeClass('active');
      } else {
        this.$('.active').removeClass('active');
        $($link.attr('href')).addClass('active');
        if(!wasActive) {
          this.$el.addClass('active');
        }
        $link.addClass('active');
      }

      if((wasActive && !this.$el.hasClass('active')) ||
        !wasActive && this.$el.hasClass('active')) 
          this.trigger('resize');
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

    remove: function() {
      // $(window).off('resize', this.handleResize);
      Backbone.View.prototype.remove.apply(this, arguments);
    }

  });

  return SequenceSettingsView;
});