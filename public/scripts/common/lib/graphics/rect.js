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

        console.log('moved :'+this.y);
  };

  Rect.prototype.isVisible = function(){  
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if(this.y>=0 || (this.y+this.height)>=0) 
          if(this.y<visibleCanvas || (this.y+this.height)<visibleCanvas){
            return true;
         }
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){
  
  var posX = x, posY = y, visibleCanvas = this.artist.canvas.height;
  if(posX !== undefined && posY !== undefined)
  if(posX>=(this.x))
  {   
    if((this.prevYoffset-this.yOffset)<0)
      if(posY>=((this.prevYoffset-this.yOffset) + visibleCanvas - 20) && posY<=((this.prevYoffset-this.yOffset) + visibleCanvas - 10))
        {
          console.log('reverse moved :'+((this.prevYoffset-this.yOffset) - 50 + visibleCanvas));
          return true;
        }
    if((this.prevYoffset-this.yOffset)==0)
      if(posY>=(this.y+50) && posY<=(this.y+60))
      {
        return true;
      }
    if((this.prevYoffset-this.yOffset)>0)
      if(posY>=(this.y+25) && posY<=(this.y+35))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});