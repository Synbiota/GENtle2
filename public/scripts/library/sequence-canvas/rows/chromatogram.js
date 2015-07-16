import Styles from '../../../styles';
import Row from './row';

const LineStyles = Styles.sequences.lines;


var dnaStickyEndTextColour = function(reverse, defaultColour, base, pos) {
  var selectableRange = sequence.selectableRange(reverse);
  var selectable = pos >= selectableRange[0] && pos <= selectableRange[1];

  if(selectable) {
    if(sequence.isBaseEditable(pos, true)) {
      return defaultColour;
    } else {
      return LineStyles.RES.text.color;
    }
  } else {
    return '#fff';
  }
};

export default class Chromatogram extends Row {

  constructor(sequenceCanvas, options = {}){

    options.lines = {
      chromatogram: ['Chromatogram', {
        height: 80,
        baseLine: 15
      }],
      chromatogram_dna: ['DNA_XY', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.dna.text.font,
        textColour: "#414",
        getSubSeq: function(){
          return this.sequence.slice(arguments[0], arguments[1] + 1);
        }
        // textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.dna.text.color),
        // selectionColour: LineStyles.dna.selection.fill,
        // selectionTextColour: LineStyles.dna.selection.color
      }],
      }

    super(sequenceCanvas, options);

  }

};
