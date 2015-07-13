import Sequence from '../../../sequence/models/sequence';
import _ from 'underscore';

export default class Circuit extends Sequence {
  constructor(attributes, ...other) {
    var circuitType = 'circuit';
    if(attributes._type && attributes._type !== circuitType) {
      throw new TypeError(`Circuit expected _type of "${circuitType}" but was "${attributes._type}"`);
    }
    attributes._type = circuitType;
    super(attributes, ...other);
  }

  defaults() {
    return _.deepExtend({}, super.defaults(), {
      displaySettings: {
        rows: {
          res: {
            custom: []
          }
        }
      }
    });
  }
}