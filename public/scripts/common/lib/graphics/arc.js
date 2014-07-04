/**
@class Arc
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      Arc;

  Arc = function(artist, x, y, radius, startAngle, endAngle, anticlockwise) {
    
    this.artist = artist;
    this.params = [x, y, radius, startAngle, endAngle, anticlockwise];
  };

  _.extend(Arc.prototype, Shape.prototype);

  Arc.prototype.draw = function(styleOptions) {
    var artist = this.artist,
        context = artist.context;

    artist.updateStyle(styleOptions);

    context.beginPath();
    context.arc.apply(context, this.params);

    context.stroke();
  };

  return Arc;
});