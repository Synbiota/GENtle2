/**
@class Washer
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      Rect;

  Washer =  function(artist,centreX, centreY, innerRadius, outerRadius, startAngle, endAngle, fill, stroke, counterClockwise, arrowHead){
  this.centreX = centreX || 0;
  this.centreY = centreY || 0;
  this.innerRadius = innerRadius || 0;
  this.outerRadius = outerRadius || 100;
  this.startAngle = artist.normaliseAngle(startAngle) || 0;
  this.endAngle = artist.normaliseAngle(endAngle) || 2* Math.PI;
  this.counterClockwise = counterClockwise != undefined? counterClockwise : true;
  this.fill = fill || '#FF0000';
  this.stroke = stroke || '#00FF00';
  this.highlight = false;
  this.arrowHead = arrowHead || false;
  this.artist = artist;
  };

  _.extend(Washer.prototype, Shape.prototype);
  

  Washer.prototype.draw = function(artist){
  //draws the washer segment on the canvas context provided.
  var ctx = artist.context,
  midRad, temp, angOffset;
  ctx.beginPath();
    
  if (this.arrowHead){
   angOffset = 5/this.innerRadius;
  
    if (angOffset > this.endAngle - this.startAngle){
      angOffset = this.endAngle - this.startAngle;
    }

    if (this.arrowHead == 'front'){
      midRad = (this.innerRadius + this.outerRadius)/2 ;
      ctx.arc(this.centreX, this.centreY, this.innerRadius, this.startAngle, this.endAngle - angOffset, this.counterClockwise);
      ctx.lineTo(midRad*Math.cos(this.endAngle), midRad*Math.sin(this.endAngle));
      ctx.lineTo(this.outerRadius*Math.cos(this.endAngle - angOffset), this.outerRadius*Math.sin(this.endAngle - angOffset));
      temp = !this.counterClockwise;
      ctx.arc(this.centreX, this.centreY, this.outerRadius, this.endAngle - angOffset, this.startAngle, temp);
    }else {
      midRad = (this.innerRadius + this.outerRadius)/2 ;
      ctx.arc(this.centreX, this.centreY, this.innerRadius, this.endAngle, this.startAngle + angOffset, !this.counterClockwise);
      ctx.lineTo(midRad*Math.cos(this.startAngle), midRad*Math.sin(this.startAngle));
      ctx.lineTo(this.outerRadius*Math.cos(this.startAngle + angOffset), this.outerRadius*Math.sin(this.startAngle + angOffset));
      temp = !this.counterClockwise;
      ctx.arc(this.centreX, this.centreY, this.outerRadius, this.startAngle + angOffset, this.endAngle, this.counterClockwise);     
    }
  }else{
    ctx.arc(this.centreX, this.centreY, this.innerRadius, this.startAngle, this.endAngle, this.counterClockwise);
    ctx.lineTo(this.outerRadius*Math.cos(this.endAngle), this.outerRadius*Math.sin(this.endAngle));
    temp = !this.counterClockwise;
    ctx.arc(this.centreX, this.centreY, this.outerRadius, this.endAngle, this.startAngle, temp);
  }

  ctx.closePath();
  ctx.strokeStyle = this.stroke;
  ctx.lineWidth = 2;
  ctx.fillStyle = this.fill;
  ctx.stroke();
  ctx.fill();
};

Washer.prototype.pointWithin = function(point){
  //returns true if the given point is within the Washer Segment.

  var rel_p = {x: point.x - this.centreX,
         y: point.y - this.centreY}, rad_p, s, e,t,t_in_ccw,
         rad_p = { r: Math.sqrt(rel_p.x*rel_p.x + rel_p.y*rel_p.y),
           theta: normaliseAngle(Math.atan2(rel_p.y,rel_p.x))} ; 

  if ( rad_p.r > this.outerRadius || rad_p.r < this.innerRadius ) return false ;

  s = this.startAngle ;
  e =  this.endAngle ;
  t = rad_p.theta ;

  t_in_ccw = false;
  if ( s < e && (t < s || e < t) || (e < t && t < s)) t_in_ccw = true;
  if ( this.counterClockwise != t_in_ccw) return false;

  return true;
};

Washer.prototype.setHighLight = function(highlight, fill, stroke){
  if ( highlight ) {
    if ( ! this.highlight ){ 
      this.highlight = true;
      if  ( fill ) {
        this.oldFill = this.fill;
        this.fill = fill;
      }
      if ( stroke ){
        this.oldStroke = this.stroke;
        this.stroke = stroke;
      }
    }
  }else{
    if ( this.highlight ){
      this.highlight = false;
      if ( this.oldFill ){
        this.fill = this.oldFill;
        this.oldFill = false;
      }
      if ( this.oldStroke ){
        this.stroke = this.oldStroke;
        this.oldStroke = false;
      }
    }
  }
};

  return Washer;
});