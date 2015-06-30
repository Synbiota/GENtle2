import _ from 'underscore';
import SequenceCanvas from '../lib/sequence_canvas';
import BiDirectional from 'gentle-sequence-canvas/bi_directional';

import classMixin from 'gentle-utils/class_mixin';
import Core from 'gentle-sequence-canvas/core';
import EventHandlers from 'gentle-sequence-canvas/event_handlers';
import Utilities from 'gentle-sequence-canvas/utilities';
import Memoizable from 'gentle-utils/memoizable';

import ContextMenu from './_sequence_canvas_context_menu';

var SequenceCanvasMixin = classMixin(ContextMenu, EventHandlers, Utilities, Core, Memoizable);
// var SequenceCanvasMixin = classMixin(ContextMenu, EventHandlers, Utilities, BiDirectional, Core, Memoizable);
// var SequenceCanvasMixin = classMixin(EventHandlers, Utilities, BiDirectional, Memoizable);

import Styles from '../../styles';
const LineStyles = Styles.sequences.lines;

// export default class ChromatographCanvas extends SequenceCanvas {}
// export default class ChromatographCanvas extends SequenceCanvasMixin {}
// export default class ChromatographCanvas extends BiDirectional {}

export default class ChromatographCanvas extends SequenceCanvasMixin {

  constructor(options = {}) {

    // var abc = new Row;

    function dnaStickyEndTextColour (){
      return "#414"
    }

    var sequence = options.sequence;
    _.defaults(options, {
      rows: {
        consensus: ['Consensus', {}],
        chromatogram: ['Chromatogram', {}]
      },

      // Remove lines later, rows are the new thing.
      lines: {
        consensus: ['Consensus', {
          height: 80,
          baseLine: 15,
          // textFont: LineStyles.dna.text.font,
          // textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.dna.text.color),
          // selectionColour: LineStyles.dna.selection.fill,
          // selectionTextColour: LineStyles.dna.selection.color
        }],
        dna: ['DNA_XY', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.dna.text.font,
          textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.dna.text.color),
          selectionColour: LineStyles.dna.selection.fill,
          selectionTextColour: LineStyles.dna.selection.color
        }],
        chromatogram: ['Chromatogram', {
          height: 80,
          baseLine: 15
        }],
        chromatogram_dna: ['DNA_XY', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.dna.text.font,
          textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.dna.text.color),
          selectionColour: LineStyles.dna.selection.fill,
          selectionTextColour: LineStyles.dna.selection.color
        }],
      },
      // lines: defaultLines(sequence),
      editable: !sequence.get('readOnly'),
      layoutSettings: {
        gutterWidth: sequence.get('displaySettings.rows.hasGutters') ? 30 : 0
      }
    });

    super(options);

    this.view.listenTo(this.view, 'resize', this.refreshFromResize);
    this.sequence.on('change:displaySettings.*', this.refresh);

  }

  addChromatograph(fragment){

    this.addRows({
      chromatogram: ['Chromatogram', {
        sequence: fragment
      }]
    })

    this.display2d()
  }

}
