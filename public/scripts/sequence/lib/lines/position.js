/**
Line class for displaying base position on SequenceCanvas. 
Options are: 

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text. can be a function taking the character as argument.
- `this.transform` _(optional)_: function tranforming the position text into another (e.g. number formatting)
@class Lines.Position
@extends Lines.Line
**/
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      Position;

  Position = function(sequenceCanvas, options) {
    this.type = 'position';
    this.cache = {};
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(Position.prototype, Line.prototype);

  Position.prototype.draw = function(svg, innerYOffset, baseRange) {
    var ls          = this.sequenceCanvas.layoutSettings,
        sequence    = this.sequenceCanvas.sequence,
        x = 0,
        _this = this,
        k;

    group = svg.group().y(innerYOffset).x(ls.pageMargins.left);

    group.text(function(text) {
      var position, tspan;
      for(k = baseRange[0]; k <= baseRange[1]; k += ls.basesPerBlock){
        position = typeof _this.transform == 'function' ? _this.transform(k+1) : k+1;
        tspan = text.tspan(position).x(x);
        if(k == baseRange[0]) tspan.newLine();
        x += ls.basesPerBlock*ls.basePairDims.width + ls.gutterWidth;
      }
      // _.each(subSequence.match(/.{1,10}/g), function(chunk, i) {
      //   var tspan = text.tspan(chunk).dx((i > 0) * ls.gutterWidth);
      //   if(i === 0) tspan.newLine();
      // });
    }).attr({
      class: this.className
    }).leading(this.leading);

    // context.fillStyle = this.textColour;
    // context.font = this.textFont;
    
    // x = ls.pageMargins.left;
    // for(k = baseRange[0]; k <= baseRange[1]; k += ls.basesPerBlock){
    //   text = typeof this.transform == 'function' ? this.transform(k+1) : k+1;
    //   context.fillText(text, x, y + (this.baseLine === undefined ? this.height : this.baseLine));
    //   x += ls.basesPerBlock*ls.basePairDims.width + ls.gutterWidth;
    // }
  };

  return Position;
});