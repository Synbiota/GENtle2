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

    var fragments = this.sequence.get('chromatogramFragments');

    this.view.listenTo(fragments, 'add', function(fragment){
      _this.addChromatograph(fragment)
    });
    this.view.listenTo(fragments, 'remove', function(fragment, fragments, options){
      _this.removeChromatograph(options.index + 1)
    })
    this.view.listenTo(fragments, 'reverseComplement', function(fragment){
      var index = fragments.indexOf(fragment)

      _.extend(_this.rows[index + 1].sequence, fragment)
      _this.display2d();
    })

    this.sequence.get('chromatogramFragments').forEach(function(fragment){
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

    this.removeRow(index);

    if (!options.silent) this.display2d();
  }

}
