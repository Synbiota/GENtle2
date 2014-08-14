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
    var artist = this.artist, visibleCanvas = this.artist.canvas.height;

    artist.updateStyle(styleOptions);
    artist.context.fillRect(this.x, this.y, this.width, this.height);

    if(this.y>0 && this.y<=visibleCanvas)
       this.initialOffset = -50;
    else 
    if(this.y<=0 || this.y>visibleCanvas)
       this.initialOffset = 0;

     console.log('Y1 '+this.y);
  };

   Rect.prototype.moveVertically = function(yOffset){
        this.yOffset = yOffset;
        var visibleCanvas = this.artist.canvas.height;

       if(this.prevYoffset !== undefined){
 
             if((this.prevYoffset-this.yOffset)>0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
             if((this.prevYoffset-this.yOffset)<0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
          
        }
        if(this.prevYoffset === undefined){
            this.prevYoffset = this.yOffset;
              if(this.refY === undefined)
                this.refY = this.y;
        }

        console.log('Y2 :'+(this.y));
  };

  Rect.prototype.isVisible = function(){  
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if(this.y>=(-30) || (this.y+this.height)>=(-30)) 
          if(this.y<(visibleCanvas+30) || (this.y+this.height)<(visibleCanvas+30)){
            return true;
         }
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){

    console.log('Y5 '+ this.y+'     '+(y-50));
  
  var posX = x, posY = y, visibleCanvas = this.artist.canvas.height;
  if(posX !== undefined && posY !== undefined)
  if(posX>=(this.x))
  {   
    if((this.prevYoffset-this.yOffset)<0)
      if(posY>=(this.y+50) && posY<=(this.y+60))
        {
          console.log('reverse moved :'+((this.prevYoffset-this.yOffset) - 50 + visibleCanvas));
          return true;
        }
    if((this.prevYoffset-this.yOffset)==0)
      if(posY>=(this.y+50) && posY<=(this.y+60))
      {
        console.log('Y4 :'+(this.y));

        return true;
      }
    if((this.prevYoffset-this.yOffset)>0)
      if((posY)>=(this.y) && (posY)<=(this.y+10))
      {
        console.log('Bingo :'+(this.y));
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});