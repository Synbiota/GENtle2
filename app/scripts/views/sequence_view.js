define(function(require) {
  var Backbone        = require('backbone'),
      template        = require('hbars!templates/sequence_view'),
      Sequence        = require('models/sequence'),
      SequenceCanvas  = require('lib/sequence_canvas/sequence_canvas'),
      Gentle          = require('gentle'),
      SequenceView;

  Gentle = Gentle();
  
  SequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      this.model = Gentle.currentSequence;

      this.on('afterRender', this.setupSequenceCanvas, this);

      
      this.handleResize = _.bind(this.handleResize, this);
      $(window).on('resize', this.handleResize);
      this.handleResize(false);
    },

    setupSequenceCanvas: function() {
      this.sequenceCanvas = new SequenceCanvas({
        view: this,
        $canvas: this.$('canvas').first()
      });
    },

    handleResize: function(trigger) {
      if(trigger !== false) this.trigger('resize');
      // this.$el.height($(window).height() - $('#navbar .navbar').outerHeight()); 
    },

    remove: function() {
      $(window).off('resize', this.handleResize);
      Backbone.View.prototype.remove.apply(this, arguments);
    }

  });

  return SequenceView;
});