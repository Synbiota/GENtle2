define(function(require) {
  var Backbone        = require('backbone'),
      template        = require('hbars!../../templates/sequence_view'),
      Sequence        = require('models/sequence'),
      SequenceCanvas  = require('lib/graphics/sequence_canvas'),
      SequenceView;
  
  SequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;
      this.model = Gentle.currentSequence;

      this.on('afterRender', function() {
        _this.sequenceCanvas = new SequenceCanvas({
          view: _this,
          $canvas: _this.$('canvas').first()
        });
      });
      
      $(window).on('resize', function() { 
        _this.trigger('resize'); 
      });
    }

  });

  return SequenceView;
});