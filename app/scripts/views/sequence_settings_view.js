define(function(require) {
  var template        = require('hbars!templates/sequence_settings_view'),
      Sequence        = require('models/sequence'),
      SequenceCanvas  = require('lib/sequence_canvas/sequence_canvas'),
      Gentle          = require('gentle'),
      FeaturesView    = require('views/features_view'),
      SequenceSettingsView;

  Gentle = Gentle();
  
  SequenceSettingsView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click .sequence-settings-tab-link': 'toggleTabs',
      'change #sequence-display-settings-tab input': 'updateDisplaySettings',
      'click .undo-history-step': 'undoAfter'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.listenTo(this.model.getHistory(), 'add remove', this.render, this);
      this.reinsertViews();
    },

    toggleTabs: function(event) {
      event.preventDefault();
      var $link = this.$(event.currentTarget),
          wasActive = this.$el.hasClass('active');

      if($link.hasClass('active')) {
        this.$('.active').removeClass('active');
        this.$el.removeClass('active');
        this.openTab = undefined;
      } else {
        this.$('.active').removeClass('active');
        $($link.attr('href')).addClass('active');
        this.openTab = $link.attr('href');
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
    },

    serialize: function() {
      return {
        historySteps: this.model.getHistory().serialize(),
        openTab: this.openTab,
        features: this.model.get('features')
      };
    },

    restoreOpenTab: function() {
      if(this.openTab !== undefined) {
        this.$el.addClass('active');
        this.$('[href='+this.openTab+']').addClass('active');
        $(this.openTab).addClass('active');
      }
    },

    afterRender: function() {
      this.populate();
      this.restoreOpenTab();
      this.reinsertViews();
    },

    reinsertViews: function() {
      this.insertView('#sequence-features-outlet', new FeaturesView());
    },

    undoAfter: function(event) {
      var timestamp = $(event.currentTarget).data('timestamp');
      this.model.undoAfter(timestamp);
    }

  });

  return SequenceSettingsView;
});