import classMixin from 'gentle-utils/class_mixin';
import Core from './core';
import EventHandlers from './event_handlers';
import Utilities from './utilities';
import ContextMenu from './context_menu';

var SequenceCanvasMixin = classMixin(Core, ContextMenu, EventHandlers, Utilities);

export default class SequenceCanvas extends SequenceCanvasMixin {
  constructor(...args) {
    super(...args)
    console.log(...args)
  }
}

window.seqeuencecanvas  =SequenceCanvas
