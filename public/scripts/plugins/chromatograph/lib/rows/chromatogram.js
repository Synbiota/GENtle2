import Styles from '../../../../styles';
import Row from './row';

const LineStyles = Styles.sequences.lines;

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
        textColour: function(){
          return this.sequence.get('isComplement') ? "#d3d3d3" : "#414";
        }
      }],
      chromatogram_dna_complement: ['DNA_XY', {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.dna.text.font,
        textColour: function(){
          return this.sequence.get('isComplement') ? "#414" : "#fff";
        },
        getSubSeq: function(startBase, endBase){
          return this.getComplement().substr(startBase, endBase - startBase + 1)
          // return this.get('chromatogramFragments').getConsensusSubSeq(...args)
        }
        // selectionColour: LineStyles.dna.selection.fill,
        // selectionTextColour: LineStyles.dna.selection.color
      }],
      }

    super(sequenceCanvas, options);

  }

};
