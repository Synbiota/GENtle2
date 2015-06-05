import {extend} from 'underscore';
import Memoizable from 'gentle-utils/memoizable';

/**
Base Line class from which to extend. 

@class Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
class Line extends Memoizable {
  constructor(sequenceCanvas, options) {
    super();
    this.sequenceCanvas = sequenceCanvas;
    this.type = this.constructor.name;
    extend(this, options);
    this.memoize('visible', 'change');
  }

  memoize(methodName, eventName) {
    super.memoize(methodName, eventName, this.sequenceCanvas.sequence);
  }
}

export default Line;
