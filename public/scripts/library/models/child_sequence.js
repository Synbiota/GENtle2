/**
 * @module gentle-models
 */
import _ from 'underscore';
import BaseSequenceModel from './sequence';
import {assertion, assertIsNumber} from '../../common/lib/testing_utils';

/**
 * A SequenceModel that is a child (belongs to) another SequenceModel.  For
 * example a `PcrPrimerModel` or a `PcrProductSequenceModel`.
 * @class  ChildSequenceModel
 * @constructor
 */
class ChildSequenceModel extends BaseSequenceModel {
  requiredFields () {
    var fields = super.requiredFields();
    return _.unique(fields.concat([
      'reverse',
      'from',
      'to'
    ]));
  }

  validate () {
    super.validate();
    assertIsNumber(this.from, 'from');
    assertIsNumber(this.to, 'to');

    var msg = `Invalid \`from\`, \`to\` and \`reverse\` values: '${this.from}', '${this.to}', '${this.reverse}'`;
    if(this.reverse) {
      assertion(this.from >= this.to, msg);
    } else {
      assertion(this.from <= this.to, msg);
    }

    var len = (this.to >= this.from) ? (this.to - this.from + 1) : (this.from - this.to);
    var actualLen = this.getLength();
    assertion((len <= actualLen), `length of sequence '${actualLen}' does not accommodate \`from\` '${this.from}' and \`to\` '${this.to}' (length should be: '${len}')`);
  }

  /**
   * @method shift  Move the from/to attributes of a sequenceModel by N
   * @param  {Integer} shiftBy
   * @return {undefined}
   */
  shift (shiftBy) {
    this.to += shiftBy;
    this.from += shiftBy;
  }
}


export default ChildSequenceModel;
