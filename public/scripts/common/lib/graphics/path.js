/**
@class Path
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      Path;

  Path = function(artist, points) {
    
    this.artist = artist;
    this.points = [];

    for(var i = 0; i < points.length - 1; i+=2) {
      this.points.push([Math.floor(points[i])+0.5, Math.floor(points[i+1])+0.5]);
    }
  };

  _.extend(Path.prototype, Shape.prototype);

  Path.prototype.draw = function(styleOptions) {
    var artist = this.artist,
        context = artist.context;

    artist.updateStyle(styleOptions);

    context.beginPath();
    context.moveTo(this.points[0][0], this.points[0][1]);

    for(var i = 1; i < this.points.length; i++) {
      context.lineTo(this.points[i][0], this.points[i][1]);
    }

    context.stroke();
  };

  return Path;
});