import Line from './line';
import {isFunction, isUndefined} from 'underscore';

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
@module Sequence
@submodule SequenceCanvas
**/

class Position extends Line {
  draw(y, [baseFrom, baseTo]) {
    const ls          = this.sequenceCanvas.layoutSettings;
    const artist      = this.sequenceCanvas.artist;

    var x = ls.pageMargins.left;

    for(let k = baseFrom; k <= baseTo; k += ls.basesPerBlock){
      let text = isFunction(this.transform) ? this.transform(k+1) : k+1;
      let baseLine = isUndefined(this.baseLine) ? this.height : this.baseLine;

      artist.text(text, x, y + baseLine, {
        fillStyle: this.textColour,
        font: this.textFont
      });

      x += ls.basesPerBlock*ls.basePairDims.width + ls.gutterWidth;
    }
  }
}

export default Position;
