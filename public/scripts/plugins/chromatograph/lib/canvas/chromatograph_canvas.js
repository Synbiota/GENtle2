import _ from 'underscore';
import ContextMenu from '../../../../sequence/lib/_sequence_canvas_context_menu';

import classMixin from 'gentle-utils/class_mixin';
import Core from './core';
import EventHandlers from 'gentle-sequence-canvas/event_handlers';
import ChromatogramEventHandlers from './event_handlers';
import Utilities from './utilities';
import Memoizable from 'gentle-utils/memoizable';


var SequenceCanvasMixin = classMixin(ContextMenu, ChromatogramEventHandlers, EventHandlers, Utilities, Core, Memoizable);

import Styles from '../../../../styles';
const LineStyles = Styles.sequences.lines;

export default class ChromatographCanvas extends SequenceCanvasMixin {

  constructor(options = {}) {

    var sequence = options.sequence;
    _.defaults(options, {
      selectable: false,
      editable: false,
      rows: {
        consensus: ['Consensus', {}],
      },
      layoutSettings: {
        gutterWidth: 0
      }
    });

    super(options);

    this.view.listenTo(this.view, 'resize', this.refreshFromResize);
    this.sequence.on('change:displaySettings.*', this.refresh);

    var _this = this;

    this.view.listenTo(this.sequence, 'change:chromatogramFragments', function(sequence, fragments){
      var fragment = fragments[fragments.length-1];
      _this.addChromatograph(fragment)
    });

    _.forEach(this.sequence.get('chromatogramFragments'), function(fragment){
      _this.addChromatograph(fragment, {silent: true});
    });

  }

  addChromatograph(fragment, options = {silent: false}){

    this.addRows({
      chromatogram: ['Chromatogram', {
        sequence: fragment
      }]
    });

    if (!options.silent) this.display2d();
  }

}
