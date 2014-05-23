/**
Line class for displaying bases on SequenceCanvas. 
Options are: 

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text. 
- `this.transformUnit` _(optional, default: `base`)_: argument passed to the `transform` function. Either `base` or `codon`.  
- `this.transform` _(optional)_: function transforming a `transformUnit` into another (e.g. complement..)
@class Lines.DNA
@extends Lines.Line
**/
define(function(require) {
  var Line = require('sequence/lib/lines/line'),
      DNA;

  DNA = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  };
  _.extend(DNA.prototype, Line.prototype);

  DNA.prototype.setTextColour = function(base) {
    var context = this.sequenceCanvas.artist.context;
    if(_.isFunction(this.textColour)) {
      context.fillStyle = this.textColour(base);
    } else {
      context.fillStyle = this.textColour;
    }
  };

  DNA.prototype.draw = function(svg, innerYOffset, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        selection       = sequenceCanvas.selection,
        basesPerBlock   = ls.basesPerBlock,
        chunkRegexp     = new RegExp('.{1,'+basesPerBlock+'}', 'g'),
        _this           = this,
        subSequence, character, group;

    subSequence = (_.isFunction(this.getSubSeq) ? 
      this.getSubSeq : 
      sequence.getSubSeq
    ).apply(sequence, baseRange);

    group = svg.group().y(innerYOffset).x(ls.pageMargins.left);

    group.text(function(text) {

      _.each(subSequence.match(chunkRegexp), function(chunk, i) {
        var tspan;

        if(_.isFunction(_this.transform)) {
          tspan = text.tspan(function(_tspan) {
            for(var j = 0; j < ls.basesPerBlock; j++) {
              var codon = _this.transform.call(sequence, i * basesPerBlock + j + baseRange[0]),
                  character = codon.sequence[codon.position].replace(' ', "\u00A0");
              _tspan.tspan(character).attr({
                class: _this.transformedClassName(codon)
              });
            }
          }).dx((i > 0) * ls.gutterWidth);
        } else {
          tspan = text.tspan(chunk).dx((i > 0) * ls.gutterWidth);
        }
        
        if(i === 0) tspan.newLine();
      });


    }).attr({
      class: this.className
    }).leading(this.leading);
            
  };

  return DNA;
});