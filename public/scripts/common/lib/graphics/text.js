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

    styleOptions = args.shift() || {};
    styleOptions.lineHeight = styleOptions.lineHeight || 0;
    styleOptions.textPadding = styleOptions.textPadding || 0;
    this.styleOptions = styleOptions;
    this.model = Gentle.currentSequence;
    };

  _.extend(Text.prototype, Shape.prototype);

   Text.prototype.draw = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions;

    if(styleOptions.backgroundFillStyle) {
      artist.updateStyle({
        fillStyle: styleOptions.backgroundFillStyle,
        font: styleOptions.font
      });
      this.textWidth = context.measureText(this.text).width + 2 * styleOptions.textPadding;
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

  Text.prototype.moveVertically = function(yOffset, pixelRatio){
     var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,               
        textHeight, imageData, offset = yOffset, styleOptions = this.styleOptions;

    imageData = artist.context.getImageData(this.x,this.y,this.textWidth, this.styleOptions.lineHeight);
    artist.context.clearRect(this.x,this.y,this.textWidth, this.styleOptions.lineHeight);

    artist.context.clearRect(this.x,this.y + offset,this.textWidth, this.styleOptions.lineHeight);
    artist.putImageData(imageData, this.x, (this.y + offset)*pixelRatio);

    //this.y = this.y + offset;
  };

  Text.prototype.isVisible = function(){
    var artist = this.artist,
        context = artist.context,
        yOffset = this.model.get('displaySettings.yOffset'),
        $scrollingParent = $('scrolling-parent').first(),
        visibleCanvas = $scrollingParent.height();

    if(this.yOffset === undefined)
          this.yOffset = yOffset;

        if((yOffset<=(this.y+this.styleOptions.lineHeight)<=(visibleCanvas+yOffset)) && (yOffset>this.yOffset)){
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