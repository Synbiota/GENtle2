/**
@class TextArc
@extends Shape
@module Graphics
**/
// define(function(require) {
  var Shape = require('./shape'),
      TextArc;

  TextArc = function(artist, text, x, y, radius, startAngle, maxAngle) {
    
    this.artist = artist;
    this.text = text;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.startAngle = startAngle; 
    this.maxAngle = maxAngle;

  };

  _.extend(TextArc.prototype, Shape.prototype);

  TextArc.prototype.draw = function(styleOptions) {
    var artist = this.artist,
        context = artist.context,
        text,
        textLen = this.text.length,
        angle,
        i = textLen;

    artist.updateStyle(styleOptions);

    do {
      text = this.text.substr(0,i) + ((i == textLen) ? '' : '...');
      angle = this.measureAndOrDraw(text, false);
      i-= 3;
    } while(angle > this.maxAngle && i > 0);

    angle = 3 * Math.PI / 2 - this.startAngle - Math.max(this.maxAngle - angle, 0) / 2 - 3 / 115;

    artist.rotate(-angle);
    this.measureAndOrDraw(text, true);
    artist.rotate(angle);
  };

  TextArc.prototype.measureAndOrDraw = function(text, draw) {
    var angle =  0,
        totalAngle = 0,
        _this = this,
        len = text.length,
        radius = this.radius,
        chr;

    this.artist.onTemporaryTransformation(function() {
      for(var i = 0; i < len; i++) {
        chr = text[i];
        angle = 2 * 0.5 * (this.context.measureText(chr).width / radius);
        totalAngle += angle;
        if(draw !== false) {
          this.context.fillText(chr, 0, -radius);
          this.rotate(angle);
        }
      }
    });

    return totalAngle;
  };
export default TextArc;
  // return TextArc;
// });