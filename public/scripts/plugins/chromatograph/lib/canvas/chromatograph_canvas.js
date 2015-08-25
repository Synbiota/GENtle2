import _ from 'underscore';
import ContextMenu from '../../../../sequence/lib/_sequence_canvas_context_menu';

import classMixin from 'gentledna-utils/dist/class_mixin';
import Core from './core';
import EventHandlers from 'gentle-sequence-canvas/event_handlers';
import ChromatogramEventHandlers from './event_handlers';
import Utilities from './utilities';
import Memoizable from 'gentledna-utils/dist/memoizable';


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

    this.view.listenTo(this.sequence, 'add:chromatogramFragment', function(fragments, fragment){
      _this.addChromatograph(fragment)
    });

    this.view.listenTo(this.sequence, 'remove:chromatogramFragment', function(fragments, index){
      _this.removeChromatograph(index);
    });

    this.view.listenTo(this.sequence, 'reverseComplement:chromatogramFragment', function(fragments, index){

      index = parseInt(index)

      _.extend(_this.rows[index + 1].sequence, fragments[index])

      _this.scrollToBase(fragments[index].position)

      _this.display2d();
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

  removeChromatograph(index, options = {silent: false}){

    // var index = fragment.index;
    this.removeRow(index);

    if (!options.silent) this.display2d();

  }

}
