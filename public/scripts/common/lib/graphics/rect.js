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

   Rect.prototype.moveVertically = function(yOffset, pixelRatio){
    var artist = this.artist;
        this.y = this.y + offset;
  };

  Rect.prototype.isVisible = function(){
    
    var artist = this.artist;

        if((0<=(this.y+this.height)<=(visibleCanvas))){
          return true;
        }
        else if((0<=(this.y)<=(visibleCanvas))){
          return true;
        }
          
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){

  var yOffset = this.model.get('displaySettings').yOffset;

  if(x<=(this.x+this.width))
  {
      if(this.y<=y && y<=(this.y+10))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});