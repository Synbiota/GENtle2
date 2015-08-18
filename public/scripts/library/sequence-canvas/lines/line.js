import {extend, defaults} from 'underscore';
import Memoizable from 'gentledna-utils/dist/memoizable';

/**
Base Line class from which to extend.

@class Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
class Line extends Memoizable {
  constructor(sequenceCanvas, options = {}) {
    super();
    this.sequenceCanvas = sequenceCanvas;
    this.type = this.constructor.name;
    extend(this, defaults(options, {
      visible: () => true
    }));
    this.memoize('visible', 'change');
  }

  memoize(methodName, eventName) {
    super.memoize(methodName, eventName, this.sequenceCanvas.sequence);
  }
}

export default Line;
