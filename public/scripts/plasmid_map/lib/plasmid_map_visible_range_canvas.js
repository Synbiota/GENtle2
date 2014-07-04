define(function(require) {
  var PlasmidMapCanvas = require('./plasmid_map_canvas'),
      Artist = require('common/lib/graphics/artist'),
      PlasmidMapVisibleRangeCanvas;

  PlasmidMapVisibleRangeCanvas = function(options) {
    var throttledRender;
    this.view = options.view;
    this.$el = options.view.$el;
    this.model = options.view.model;
    this.$canvas = options.$canvas;
    this.sequenceCanvas = options.view.parentView().sequenceCanvas;
    this.artist = new Artist(options.$canvas);

    _.bindAll(this, 'render');
    throttledRender = _.throttle(this.render, 30);

    this.sequenceCanvas.on('scroll', throttledRender);
    this.model.on('change', throttledRender)

    this.setupCanvas();
    this.artist.setOpacity(0.5);
    this.render();
  };

  PlasmidMapVisibleRangeCanvas.prototype.setupCanvas = PlasmidMapCanvas.prototype.setupCanvas;
  PlasmidMapVisibleRangeCanvas.prototype.clear = PlasmidMapCanvas.prototype.clear;

  PlasmidMapVisibleRangeCanvas.prototype.render = function() {
    this.clear();
    this.drawVisibleRange();
  };

  PlasmidMapVisibleRangeCanvas.prototype.drawVisibleRange = function() {
    var sequenceCanvas = this.sequenceCanvas,
        parentHeight = sequenceCanvas.$scrollingParent.height(),
        childHeight = sequenceCanvas.layoutHelpers.pageDims.height,
        visibleOffset = sequenceCanvas.layoutHelpers.yOffset / childHeight,
        visibleRange = parentHeight / childHeight,
        startAngle = Math.PI * 2 * visibleOffset - Math.PI,
        endAngle = startAngle + Math.PI * 2 * visibleRange,
        artist = this.artist;

    if(childHeight > parentHeight) {

      artist.washer(0, 0, 50, 165, startAngle, endAngle, false, false, false, {
        fillStyle: 'rgb(180, 180, 180)',
      });

    }


  };

  return PlasmidMapVisibleRangeCanvas;
}); 