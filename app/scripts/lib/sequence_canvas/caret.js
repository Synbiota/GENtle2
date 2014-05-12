define(function(require) {
  var Caret;

  Caret = function(sequenceCanvas) {
    this.sequenceCanvas = sequenceCanvas;
    this.context = sequenceCanvas.artist.context;
    this.visible = false;
    this.paddingTop = 2;
    this.paddingBottom = 0;
    this.bufferPadding = 5;
    this.frequency = 500;

    _.bindAll(this, 'display',
                    'hide');
  };

  Caret.prototype.move = function(posX, posY) {
    this.posX = posX;
    this.posY = posY + this.sequenceCanvas.layoutHelpers.yOffset;

    if(this.caretId) {
      this.hide();
      this.buffer = undefined;
    }

    this.caretId = +(new Date());
    this.display();
  };

  Caret.prototype.remove = function() {
    this.posX = this.posY = undefined;
    this.hide();
    this.caretId = this.buffer = undefined;
  };

  Caret.prototype.display = function() {
    if(this.posX && this.posY) {
      var layoutSettings  = this.sequenceCanvas.layoutSettings,
          layoutHelpers   = this.sequenceCanvas.layoutHelpers,
          baseHeight      = layoutSettings.lines.dna.height,
          context         = this.context,
          caretX          = this.posX - 1,
          caretY          = this.posY - this.paddingTop,
          caretW          = 1,
          caretH          = baseHeight + this.paddingBottom,
          yOffset         = layoutHelpers.yOffset,
          bufferPadding   = this.bufferPadding,
          _this           = this;

      if(!this.buffer) {
        this.buffer = {
          left: caretX - bufferPadding,
          top: caretY - bufferPadding  ,
          width: caretW + 2 * bufferPadding,
          height: caretH + 2 * bufferPadding
        };

        this.buffer.imageData = context.getImageData( this.buffer.left,
                                                      this.buffer.top - yOffset,
                                                      this.buffer.width, 
                                                      this.buffer.height);
      }

      context.fillStyle = '#000';
      context.fillRect( caretX, 
                        caretY - yOffset, 
                        caretW, 
                        caretH);
      

      this.enqueueHide(this.caretId);
    }
  };

  Caret.prototype.enqueueHide = function(enqueuedCaretId) {
    var _this = this;

    setTimeout(function() {
      if(enqueuedCaretId == _this.caretId) {
        _this.hide();
        setTimeout(_this.display, _this.frequency);
      }
    }, this.frequency);
  };


  Caret.prototype.hide = function() {
    var context = this.context,
        yOffset = this.sequenceCanvas.layoutHelpers.yOffset;

    context.putImageData( this.buffer.imageData,
                          this.buffer.left,
                          this.buffer.top - yOffset);

  };

  return Caret;
});