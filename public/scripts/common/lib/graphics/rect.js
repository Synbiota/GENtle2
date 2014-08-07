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
    var artist = this.artist, offset = yOffset, imageData;

    imageData = artist.context.getImageData(this.x,this.y,this.width, this.height);
    artist.context.clearRect(this.x,this.y,this.width, this.height);

    artist.context.clearRect(this.x,this.y+offset,this.width, this.height);
    artist.putImageData(imageData, this.x, (this.y+offset)*pixelRatio);

    //this.y = this.y + offset;
  };

  Rect.prototype.isVisible = function(){
    
    var artist = this.artist,
        context = artist.context,
        yOffset = this.model.get('displaySettings').yOffset,
        $scrollingParent = $('div.scrolling-parent').first();
        visibleCanvas = $scrollingParent.height();

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

  if(this.x<=x && x<=(this.x+(this.width)))
  {
      if((this.y<=(y-10)))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});