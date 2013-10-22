/**
  Handles displaying the currentSequence sequence in a canvas

  @class SequenceCanvas
**/ 
define(['jquery', 'graphics/artist', 'utils/functional', 'utils/evented_object'], function($, Artist, fun, EventedObject) {

  var SequenceCanvas = fun.extend(EventedObject, function() {
    var this_ = this;
    this.$element = $('<canvas></canvas>').attr('id', 'sequence_canvas_'+Date.now());

    /**
    Instance of {{#crossLink "Artist"}}{{/crossLink}} used to draw on the canvas.
    @property {Artist} artist 
    **/
    this.artist = new Artist(this.$element[0]);

    /**
    @property visible
    @type Boolean
    @default false
    **/
    this.visible = false;

    this.on('visible', function(){
      this_.visible = true;
      this_.display();
    });

    this.on('hidden', function() {
      this_.visible = false;
    });

  });

  /** 
    If `this.visible`, displays the sequence in the initiated canvas.
    @method display
  **/ 
  SequenceCanvas.prototype.display = function() {
    if(this.visible) {
      this.artist.text(gentle.currentSequence.get(0,5), 10, 10);
    }
  };

  return SequenceCanvas;
});