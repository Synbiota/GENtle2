/**
@class Rect
@extends Shape
@module Graphics
**/
define(function(require) {
  var Shape = require('./shape'),
      Rect;

  Rect = function(artist, x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.artist = artist;
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
        yOffset = this.model.get('displaySettings.yOffset'),
        $scrollingParent = $('scrolling-parent').first();
        visibleCanvas = $scrollingParent.height();
       
        if(this.yOffset === undefined)
          this.yOffset = yOffset;

        if((yOffset<=(this.y+this.height)<=(visibleCanvas+yOffset)) && (yOffset>this.yOffset)){
          this.yOffset = yOffset;
          return true;
        }
        else if((yOffset<=(this.y)<=(visibleCanvas+yOffset)) && (yOffset<this.yOffset)){
          this.yOffset = yOffset;
          return true;
        }
          
        this.yOffset = yOffset;
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){

  if((this.x<=x<=(this.x+this.width)) || ((this.x+this.width)<=x<=this.x)){
      if((this.y<=y<=(this.y+this.height)) || ((this.y+this.height)<=y<=this.y))
        return true;
  }
  else
    return false;
  };

  return Rect;
});