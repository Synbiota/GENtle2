/**
Line class for displaying bases on SequenceCanvas.
Options are:

- `this.height`: line height.
- `this.baseLine`: text baseline.
- `this.textColour`: colour of the text. can be a function taking the character as argument.
- `this.textFont`: font style of the text.
- `this.transformUnit` _(optional, default: `base`)_: argument passed to the `transform` function. Either `base` or `codon`.
- `this.transform` _(optional)_: function transforming a `transformUnit` into another (e.g. complement..)
@class Lines.DNA_XY
@module Sequence
@submodule SequenceCanvas
@extends Lines.Line
**/
// define(function(require) {
  var Line = require('./line'),
      DNA_XY;

  DNA_XY = function(sequenceCanvas, options) {
    this.type = 'dna';
    this.sequenceCanvas = sequenceCanvas;
    this.cachedProperties = ['visible'];
    _.extend(this, options);
  };
  _.extend(DNA_XY.prototype, Line.prototype);

  DNA_XY.prototype.setTextColour = function(base, pos) {
    var artist = this.sequenceCanvas.artist;
    if(_.isFunction(this.textColour)) {
      artist.updateStyle({fillStyle: this.textColour(base, pos)});
    } else {
      artist.updateStyle({fillStyle: this.textColour});
    }
  };

  DNA_XY.prototype.getHighlightColour = function(base, pos) {
    return this.highlightColour && this.highlightColour(base, pos);
  };

  DNA_XY.prototype.draw = function(x, y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        k, x, subSequence, character;

    artist.updateStyle({font: this.textFont});

    // x = x || ls.pageMargins.left + (this.leftMargin || 0);

    subSequence = (_.isFunction(this.getSubSeq) ?
      this.getSubSeq :
      sequence.getSubSeq
    ).apply(sequence, baseRange);

    var peaks = sequence.get('chromatogramPeaks'),
        quality = sequence.get('chromatogramQuality');
    var peakSubSequence = peaks.slice(baseRange[0], baseRange[1]+1);
    var _this = this;

    if(subSequence) {

      _.each(subSequence, function(nucleotide, k){

        if(!subSequence[k]) return;


        var baseWidth = _.isFunction(_this.baseWidth) ?
                     _this.baseWidth(k) :
                     (_this.baseWidth || 0);

        var baseIndex = baseRange[0] + k;

        // baseWidth = peakSubSequence[k] - (peakSubSequence[k-1] || peaks[baseRange[0]+k-1] || 0);
        // baseWidth = ls.chromatographDims.width;

        // baseWidth is the width of the entire base (including padding)
        // basePairDims is the width of the actual letter.


        // x += baseWidth/2 - ls.basePairDims.width/2;
        x += baseWidth - ls.basePairDims.width/2;

        character = _.isFunction(_this.transform) ?
          _this.transform.call(sequence, k+baseRange[0]) :
          subSequence[k];



        if( _this.selectionColour &&
            selection &&
            k+baseRange[0] <= selection[1] &&
            k+baseRange[0] >= selection[0]) {

          artist.rect(x, y+3, ls.basePairDims.width, _this.height, {
            fillStyle: _this.selectionColour
          });

          if(_this.selectionTextColour) {
            artist.updateStyle({fillStyle: _this.selectionTextColour});
          } else {
            _this.setTextColour(character, k+baseRange[0]);
          }

        } else {
          var highlightColour = _this.getHighlightColour(character, k + baseRange[0]);
          if(highlightColour) {
            artist.rect(x, y+3, ls.basePairDims.width, _this.height, {
              fillStyle: highlightColour
            });
          }

          _this.setTextColour(character, k+baseRange[0]);
        }

        if (quality[baseIndex] < 30) {
          artist.updateStyle({fillStyle: "red"});
        }

        artist.text(_.isObject(character) ? character.sequence[character.position] : character,
                    x,
                    y + (_this.baseLine === undefined ? _this.height : _this.baseLine));

        // Debug printing value for quality scores.
        // artist.text(quality[baseIndex],
        //             x,
        //             y + (_this.baseLine === undefined ? _this.height : _this.baseLine) + 30);

        // x += ls.basePairDims.width/2 + baseWidth/2;
        x += ls.basePairDims.width/2;

        if ((k + 1) % ls.basesPerBlock === 0) x += ls.gutterWidth;
      });
    }

  };

  export default DNA_XY;
  // return DNA_XY;
// });
