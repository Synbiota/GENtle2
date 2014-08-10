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
    console.log("3");
    console.log(this.artist);

    this.relativeRadii = {
      r: 50 / 250,
      R: 165 / 250
    };
    this.radii = {};

    _.bindAll(this, 'render', 'refresh');
    throttledRender = _.throttle(this.render, 30);

    this.sequenceCanvas.on('scroll', throttledRender);
    this.model.on('change', throttledRender);
    this.view.parentView().on('resize', _.debounce(this.refresh, 200));;

    this.artist.setOpacity(0.5);
    this.refresh();
  };

  PlasmidMapVisibleRangeCanvas.prototype.setupCanvas = PlasmidMapCanvas.prototype.setupCanvas;
  PlasmidMapVisibleRangeCanvas.prototype.clear = PlasmidMapCanvas.prototype.clear;
  PlasmidMapVisibleRangeCanvas.prototype.updateRadii = PlasmidMapCanvas.prototype.updateRadii;

  PlasmidMapVisibleRangeCanvas.prototype.refresh = function() {
    this.setupCanvas().then(this.render);
  };

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

      artist.washer(0, 0, this.radii.r, this.radii.R, startAngle, endAngle, false, false, false, {
        fillStyle: 'rgb(180, 180, 180)',
      });

    }


  };

  return PlasmidMapVisibleRangeCanvas;
}); 