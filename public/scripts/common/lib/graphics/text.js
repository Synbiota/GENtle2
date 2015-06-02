/**
@class Text
@extends Shape
**/
// define(function(require) {
  var Shape = require('./shape'),
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
  };

  _.extend(Text.prototype, Shape.prototype);

   Text.prototype.draw = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,
        text = this.text,
        {backgroundFillStyle, textOverflow, maxWidth, textPadding} = styleOptions,
        textWidth;
    var chomped = 0;

    if(backgroundFillStyle || textOverflow) {
      do {
        artist.updateStyle({
          font: styleOptions.font
        });
        if(chomped > 0) text = this.text.substr(0, this.text.length - chomped) + " \u2026";
        textWidth = context.measureText(text).width + 2 * textPadding;
        chomped++;
      } while(textOverflow && textWidth > maxWidth - textPadding && chomped < 100)
    }

    if(backgroundFillStyle) {
      artist.updateStyle({
        fillStyle: backgroundFillStyle,
      });
      context.fillRect(this.x, this.y, textWidth, styleOptions.height);
    }

    artist.updateStyle(styleOptions);
    artist.context.fillText(text, this.x + styleOptions.textPadding, this.y + styleOptions.lineHeight);
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
export default Text;
  // return Text;
// });