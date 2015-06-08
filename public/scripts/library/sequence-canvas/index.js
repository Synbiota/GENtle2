import classMixin from 'gentle-utils/class_mixin';
import Core from './core';
import EventHandlers from './event_handlers';
import Utilities from './utilities';
import ContextMenu from './context_menu';
import Memoizable from 'gentle-utils/memoizable';

var SequenceCanvasMixin = classMixin(ContextMenu, EventHandlers, Core, Utilities, Memoizable);

export default class SequenceCanvas extends SequenceCanvasMixin {
  constructor(...args) {
    super(...args);
  }
}
