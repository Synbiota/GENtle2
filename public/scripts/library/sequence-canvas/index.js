import classMixin from 'gentle-utils/class_mixin';
import Core from './core';
import EventHandlers from './event_handlers';
import Utilities from './utilities';
import Memoizable from 'gentle-utils/memoizable';

var SequenceCanvasMixin = classMixin(EventHandlers, Core, Utilities, Memoizable);

export default class SequenceCanvas extends SequenceCanvasMixin {
  constructor(...args) {
    super(...args);
  }
}
