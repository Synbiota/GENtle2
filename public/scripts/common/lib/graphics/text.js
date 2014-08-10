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

   Text.prototype.moveVertically = function(offset, yOffset){
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

  Text.prototype.isVisible = function(){

    var  artist = this.artist,
         visibleCanvas = artist.canvas.height;

        if((this.yOffset<=(this.refY) && (this.refY)<=(visibleCanvas+this.yOffset))){
          return true;
        }
        else if((this.yOffset<=(this.refY+this.styleOptions.lineHeight) && (this.refY+this.styleOptions.lineHeight)<=(visibleCanvas+this.yOffset))){
          return true;
        }

        return false;
  };

  Text.prototype.includesPoint = function(x,y){

  if((this.x<=x<=(this.x+this.textWidth)) || ((this.x+this.textWidth)<=x<=this.x)){
      if((this.y<=y<=(this.y+this.styleOptions.lineHeight)) || ((this.y+this.styleOptions.lineHeight)<=y<=this.y))
        return true;
  }
  else
    return false;
  };

  return Text;
});