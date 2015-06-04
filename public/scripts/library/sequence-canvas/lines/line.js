import {extend} from 'underscore';
import smartMemoizeAndClear from 'gentle-utils/smart_memoize_and_clear';

/**
Base Line class from which to extend. 

@class Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
class Line {
  constructor(sequenceCanvas, options) {
    this.sequenceCanvas = sequenceCanvas;
    this.type = this.constructor.name;
    extend(this, options);
    this.smartMemoize('visible', 'change');
  }

  smartMemoize(methodName, eventName) {
    smartMemoizeAndClear(this, methodName, eventName, this.sequenceCanvas.sequence); 
  }
}

export default Line;
