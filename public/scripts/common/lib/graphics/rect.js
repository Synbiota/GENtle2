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
        var offset = yOffset;
        if(offset !== undefined)
        this.y = this.y + offset;
  };

  Rect.prototype.isVisible = function(){
    
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if((0<=(this.y+this.height)<=(visibleCanvas))){
          return true;
        }
        else if((0<=(this.y)<=(visibleCanvas))){
          return true;
        }
          
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){

  var posX = x, posY = y;

  if(posX !== undefined && posY !== undefined)
  if(posX<=(this.x+this.width))
  {
      if(this.y<=posY && posY<=(this.y+10))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});