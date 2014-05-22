define(function(require) {
  var _ = require('underscore.mixed'),
      LinearMapCanvas;

  LinearMapCanvas = function(args) {
    this.$canvas = args.$canvas;
    this.maxBase = args.maxBase;
    this.options = {
      textColour: '#005',
      textFont: '10px Monospace',
      lineColour: '#888',
      minIntervalHeight: 60
    };

    this.recalculate();
    _.bindAll(this, 'recalculate', 'debouncedRecalculate');
    $(window).on('resize', this.debouncedRecalculate);
  };

  LinearMapCanvas.prototype.recalculate = function() {
    var magnitudeOrder = Math.floor(Math.log10(this.maxBase)),
        divider = Math.pow(10, magnitudeOrder - 1),
        maxBaseForCalc = Math.ceil(this.maxBase / divider) * divider,
        $canvas = this.$canvas, 
        height, width, calculatedHeight;

    height = $canvas.parent().height();
    width = $canvas.parent().width();

    if($canvas[0].width != width || $canvas[0].height != height) {
        $canvas[0].width = width;
        $canvas[0].height = height;
      }

    this.interval = Math.max(1, maxBaseForCalc / 10);

    while(this.interval / this.maxBase * $canvas.height() < this.options.minIntervalHeight) {
      this.interval = Math.floor(this.interval * 2);
    }

    this.redraw();
  };

  LinearMapCanvas.prototype.debouncedRecalculate = 
    _.debounce(LinearMapCanvas.prototype.recalculate, 200);

  LinearMapCanvas.prototype.redraw = function() {
    var $canvas = this.$canvas,
        context = $canvas[0].getContext('2d'),
        canvasHeight = $canvas.height(),
        options = this.options,
        x, y, text;

    context.clearRect(0,0,context.canvas.width, context.canvas.height);

    x = 10;

    for(var i = 0; i < this.maxBase; i += this.interval) {
      y = Math.floor(i / this.maxBase * canvasHeight);

      if(i > 0) {
        context.fillStyle = options.lineColour;
        context.fillRect(x, y, 30, 1);
      }

      context.font = options.textFont;
      context.fillStyle = options.textColour;
      text = _.formatThousands(i+1);
      context.fillText(text, x, y + 12);
    }
  };

  LinearMapCanvas.prototype.unbind = function() {
    $(window).off('resize', this.debouncedRecalculate);
  };

  return LinearMapCanvas;
});