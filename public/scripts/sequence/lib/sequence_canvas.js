import classMixin from 'gentle-utils/class_mixin';
import Core from 'gentle-sequence-canvas/core';
import EventHandlers from 'gentle-sequence-canvas/event_handlers';
import Utilities from 'gentle-sequence-canvas/utilities';
import Memoizable from 'gentle-utils/memoizable';

import ContextMenu from './_sequence_canvas_context_menu';

var SequenceCanvasMixin = classMixin(ContextMenu, Core, EventHandlers, Utilities, Memoizable);

export default class SequenceCanvas extends SequenceCanvasMixin {
  constructor(options = {}) {
    super(options);
  }
}