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
  };

   Rect.prototype.moveVertically = function(yOffset){
        this.yOffset = yOffset;
        //Visible canvas height
        var visibleCanvas = this.artist.canvas.height;

       if(this.prevYoffset !== undefined){
            //No change in Y offset
             if((this.prevYoffset-this.yOffset)===0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
            //Scroll down
             if((this.prevYoffset-this.yOffset)>0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
            //Scroll up
             if((this.prevYoffset-this.yOffset)<0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
          
        }
        if(this.prevYoffset === undefined){
            //Setting previous Y offset
            this.prevYoffset = this.yOffset;
            //Setting Initial Y position for reference.
              if(this.refY === undefined)
                this.refY = this.y;
        }
  };

  Rect.prototype.isVisible = function(){  
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;
        //Visibility set from -30 to  artist.canvas.height + 30
        if(this.y>=(-30) || (this.y+this.height)>=(-30)) 
          if(this.y<(visibleCanvas+30) || (this.y+this.height)<(visibleCanvas+30)){
            return true;
         }
        return false;
  };

  Rect.prototype.includesPoint = function(x,y){
  var posX = x, 
  //Accounting for navbar height
  posY = y-50, 
  visibleCanvas = this.artist.canvas.height;
  if(posX !== undefined && posY !== undefined)
  //X pos greater than this.x
  if(posX>=(this.x))
  {   
    //Scroll up
    if((this.prevYoffset-this.yOffset)<0)
      //Cover full height of rect
      if(posY>=(this.y) && posY<=(this.y+this.height))
        {
          return true;
        }
    //No change in Y offset
    if((this.prevYoffset-this.yOffset)==0)
      //Cover full height of rect
      if(posY>=(this.y) && posY<=(this.y+this.height))
      {
        return true;
      }
    //Scroll down
    if((this.prevYoffset-this.yOffset)>0)
      //Cover full height of rect 
      if((posY)>=(this.y) && (posY)<=(this.y+this.height))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Rect;
});