/**
@class Text
@extends Shape
**/
define(function(require) {
  var Shape = require('./shape'),
      Gentle = require('gentle')(),
      Text;

  Text = function() {
    var args = _.toArray(arguments),
        styleOptions;

    this.artist = args.shift();
    this.text = args.shift();
    this.x = args.shift();
    this.y = args.shift();
    this.model = Gentle.currentSequence;

    styleOptions = args.shift() || {};
    styleOptions.lineHeight = styleOptions.lineHeight || 0;
    styleOptions.textPadding = styleOptions.textPadding || 0;
    this.styleOptions = styleOptions;
  };

  _.extend(Text.prototype, Shape.prototype);

   Text.prototype.draw = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,
        textWidth;

    if(styleOptions.backgroundFillStyle) {
      artist.updateStyle({
        fillStyle: styleOptions.backgroundFillStyle,
        font: styleOptions.font
      });
      textWidth = context.measureText(this.text).width + 2 * styleOptions.textPadding;
      context.fillRect(this.x, this.y, textWidth, styleOptions.height);
    }

    artist.updateStyle(styleOptions);
    artist.context.fillText(this.text, this.x + styleOptions.textPadding, this.y + styleOptions.lineHeight);
  };


  Text.prototype.rotateAndWriteText = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,               
        textWidth;

    context.rotate(Math.PI);
    context.fillText(this.text,this.x+styleOptions.textPadding,(this.y+styleOptions.lineHeight));
    context.rotate(-Math.PI);

  };

  Text.prototype.reverseText = function(text){
    return text.split("").reverse().join("");
  };

   Text.prototype.moveVertically = function(yOffset){
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

  Text.prototype.isVisible = function(){
  var artist = this.artist,
      visibleCanvas = artist.canvas.height;

        if(this.y>=0 || (this.y+this.lineHeight)>=0) 
          if(this.y<visibleCanvas || (this.y+this.lineHeight)<visibleCanvas){
            return true;
         }
        return false;
  };

  Text.prototype.includesPoint = function(x,y){

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

  return Text;
});