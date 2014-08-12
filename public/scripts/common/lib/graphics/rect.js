/**
@class Rect
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      Gentle = require('gentle')(),
      Rect;

  Rect = function(artist, x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.artist = artist;
    this.model = Gentle.currentSequence;
  };

  _.extend(Rect.prototype, Shape.prototype);

  Rect.prototype.draw = function(styleOptions) {
    var artist = this.artist;

    artist.updateStyle(styleOptions);
    artist.context.fillRect(this.x, this.y, this.width, this.height);
  };

   Rect.prototype.moveVertically = function(yOffset){
        this.yOffset = yOffset;
        var visibleCanvas = this.artist.canvas.height;

       if(this.prevYoffset !== undefined){
           if((this.prevYoffset-this.yOffset)>0)
           this.y = (this.prevYoffset-this.yOffset) + 50;
           if((this.prevYoffset - this.yOffset)<0)
           this.y = Math.abs(this.prevYoffset - this.yOffset) + 50;
        }
        if(this.prevYoffset === undefined){
            this.prevYoffset = this.yOffset;
        }
  };

  Rect.prototype.isVisible = function(){  
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if(this.y>=0 || (this.y+this.height)>=0) 
          if(this.y<visibleCanvas || (this.y+this.height)<visibleCanvas){
            console.log('tracking');
            return true;
         }
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){
  
  var posX = x, posY = y;
  if(posX !== undefined && posY !== undefined)
  if(posX>=(this.x))
  {   
      if(posY>=(this.y+50) && posY<=(this.y+60))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});