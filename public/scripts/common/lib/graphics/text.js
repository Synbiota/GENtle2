/**
@class Text
@extends Shape
**/
define(function(require) {
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

  return Text;
});