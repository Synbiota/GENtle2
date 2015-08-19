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
        textColour: "#414",
        // selectionColour: LineStyles.dna.selection.fill,
        // selectionTextColour: LineStyles.dna.selection.color
      }],
      }

    super(sequenceCanvas, options);

  }

};
