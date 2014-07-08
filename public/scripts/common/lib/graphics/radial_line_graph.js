/**
@class Radial Line Graph
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      RadialLineGraph;

  RadialLineGraph = function(artist, centreX, centreY, radius, offset, lineData){
  this.centreX = centreX || 0;
  this.centreY = centreY || 0;
  this.radius = radius || 100;
  this.offset = offset || 10;
  this.lineData = lineData;
  this.artist = artist;
  };

  _.extend(RadialLineGraph.prototype, Shape.prototype);

  RadialLineGraph.prototype.draw = function(styleOptions){
  var artist = this.artist;
  var ctx = artist.context;
  artist.updateStyle(styleOptions);
  ctx.beginPath();
  //draw arc going arround, ccw
  ctx.arc(this.centreX, this.centreY, this.radius, 0,2*Math.PI, true);
  //determine angle between data points
  var resAngle = 2*Math.PI/this.lineData.length;
  var p0x = this.radius + (this.lineData[0] - 0.5) * this.offset,
  ld, rad, angle, px, py;
  ctx.lineTo(p0x,0);
  for (var i=1; i<this.lineData.length; i++){
    //given data between 0 and 1
    ld = this.lineData[i]; 
    rad = this.radius + (ld - 0.5) * this.offset;
    angle = i*resAngle;
    px = rad * Math.cos(angle);
    py = rad * Math.sin(angle);
    ctx.lineTo(px,py);
  }
  ctx.lineTo(p0x,0);
  ctx.closePath();
  ctx.fillStyle = this.fill;
  ctx.fill();
};

  return RadialLineGraph;
});