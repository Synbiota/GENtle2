import _ from 'underscore';
import Lines from '../lines';

import Styles from '../../../styles.json';

var LineStyles = Styles.sequences.lines;

export default class Row {

  constructor(sequenceCanvas, options = {}){

    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options)
    this.lines = this._initLines(options.lines)

    this.height = 0;
    _.forEach(options.lines, ([type, lineOptions], key) => {
      this.height += lineOptions.height
    })

  }

  _initLines(lines) {
    return _.mapObject(lines, (value) => {
      var lineOptions = value[1] || {};
      lineOptions.sequence = this.sequence;
      return new Lines[value[0]](this.sequenceCanvas, value[1] || {});
    });
  }

  draw(x, y, baseRange){
    var lines = this.lines,
        sequenceCanvas = this.sequenceCanvas,
        sequence = this.sequence || sequenceCanvas.sequence,
        artist = sequenceCanvas.artist,
        ls = sequenceCanvas.layoutSettings,
        baseWidth = ls.basePairDims.width,
        lineOffset = 15;

    if (baseRange[0] < sequence.getLength()) {
      // artist.clear(x, y, (baseRange[1] - baseRange[0]) * baseWidth, ls.canvasDims.height - y)
      // artist.clear(x, y, (baseRange[1] - baseRange[0]) * baseWidth, this.height)

      _.each(lines, function(line) {
        if (line.visible === undefined || line.visible()) {
          if(line.floating) {
            line.draw(x, y, baseRange);
          } else {
            line.draw(x, y + lineOffset, baseRange);
            lineOffset += line.height;
          }
        }
      });
    }

    // _.each(lines, function(line, key) {
    //   if (line.visible === undefined || line.visible()) {
    //     if(line.floating) {
    //       line.draw(y, baseRange);
    //     } else {
    //       line.draw(y, baseRange);
    //       yOffset += line.height;
    //     }
    //   }
    // });
  }
}
