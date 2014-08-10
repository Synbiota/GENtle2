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

   Rect.prototype.moveVertically = function(offset, yOffset){
       if(yOffset !== undefined)
        this.yOffset = yOffset;
        this.offset = offset;

      if(yOffset !== undefined)
      {
        if(this.refY === undefined)
          this.refY = this.y + this.yOffset;
        this.refY = this.refY + this.offset;
      }
      else
      {
        this.refY = this.refY + this.offset;
        this.yOffset = this.yOffset + this.offset;
      }
  };

  Rect.prototype.isVisible = function(){
    
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if((this.yOffset<=(this.refY+this.height) && (this.refY+this.height)<=(visibleCanvas+this.yOffset))){
          return true;
        }
        else if((this.yOffset<=(this.refY) && (this.refY)<=(visibleCanvas+this.yOffset))){
          return true;
        }
          
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){

  var posX = x, posY = y;

  if(posX !== undefined && posY !== undefined)
  if(posX>=(this.x) && posX<=(this.x+this.width))
  {
          console.log(posY-this.y);

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