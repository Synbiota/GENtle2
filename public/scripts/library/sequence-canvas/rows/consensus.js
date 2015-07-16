import Row from './row';
import Styles from '../../../styles.json';

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

export default class Consensus extends Row {

  constructor(sequenceCanvas, options = {}){

    options.lines = {
      consensusSequence: ['DNA_XY', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.dna.text.font,
        textColour: "#414",
        getSubSeq: function(){
          return this.getConsensusSubSeq.apply(this, arguments)
        }
      }],
      consensus: ['Consensus', {
        height: 65,
        baseLine: 15,
      }],
      dna: ['DNA_XY', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.dna.text.font,
        textColour: "blue"
      }],
      };

    super(sequenceCanvas, options);

  }


};
