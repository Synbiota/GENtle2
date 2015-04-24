import _ from 'underscore';
import BaseSequenceModel from './sequence';
import {assertion, assertIsNumber} from '../../common/lib/testing_utils';


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
    var actualLen = this.length();
    assertion((len <= actualLen), `length of sequence '${actualLen}' does not accommodate \`from\` '${this.from}' and \`to\` '${this.to}' (length should be: '${len}')`);
  }

  shift (count) {
    this.to += count;
    this.from += count;
  }
}


ChildSequenceModel.className = 'ChildSequenceModel';


export default ChildSequenceModel;
