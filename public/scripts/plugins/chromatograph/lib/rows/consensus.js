import Row from './row';
import Styles from '../../../../styles.json';

const LineStyles = Styles.sequences.lines;

export default class Consensus extends Row {

  constructor(sequenceCanvas, options = {}){

    options.lines = {
      consensusSequence: ['DNA_XY', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.dna.text.font,
        textColour: "#414",
        getSubSeq: function(...args){
          return this.get('chromatogramFragments').getConsensusSubSeq(...args)
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
