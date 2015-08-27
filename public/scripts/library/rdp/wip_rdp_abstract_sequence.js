import _ from 'underscore';
import Sequence from '../../sequence/models/sequence';
import RdpTypes from './rdp_types';


/**
 * @class WipRdpAbstractSequence used to hold state whilst preparing to generate
 * a valid RDP sequence model.
 * WipRdpAbstractSequence (this class)
 *     * can have invalid state.
 *     * `getWipRdpCompliantSequenceModel` should be idempotent.
 *     * can be used to persist current progress of generating a new Rdp Sequence.
 * WipRdpReadyAbstractSequence
 *     * must have valid state for the transformSequenceForRdp function.
 *     * should be generated from WipRdpAbstractSequence class.
 *     * should not be persisted (currently just to save a small amount of
 *       complexity in having to instantiate RdpEdits).
 * RdpXxxSequence
 *     * is a valid RDP sequence model.
 *     * should be persisted like normal.
 */
class WipRdpAbstractSequence extends Sequence {
  constructor(attributes, options={}) {
    if(attributes.stickyEnds) {
      // The transformSequenceForRdp will raise an error so we either raise one
      // here or later.
      throw new TypeError('attributes for WipRdpSequence and subclasses must not contain "stickyEnds"');
    }

    attributes.readOnly = true;
    // We haven't registered `rdpEdits` as an association and we should never
    // have any stored that we instantiate the WipRdp__Sequences from so set it
    // to an empty list just in case:
    attributes.rdpEdits = [];
    super(attributes, options);
  }

  preValidationSetup(attributes, options) {
    if(!options.NextClass) throw new TypeError('Must provide options with "NextClass" key');
    if(!options.types) throw new TypeError('Must provide options with "types" key');
    this.NextClass = options.NextClass;
    this.types = _.clone(options.types);
    delete options.NextClass;
    delete options.types;
  }

  get optionalFields() {
    var fields = super.optionalFields.concat([
      // obtains 'name', 'shortName' and 'desc' from Sequence Factory
      'sourceSequenceName',
      'desiredStickyEnds',
      // Define the portion of the template sequence that should be used in
      // the final product
      'frm', // inclusive
      'size',
      'partType',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  get availablePartTypes() {
    return _.keys(this.types);
  }

  validPartType(partType) {
    return _.contains(this.availablePartTypes, partType);
  }

  get availableStickyEndNames() {
    var partType = this.get('partType');
    var partTypeInfo = this.types[partType] || {stickyEndNames: []};
    return _.clone(partTypeInfo.stickyEndNames);
  }

  get isProteinCoding() {
    var partType = this.get('partType');
    return _.contains(RdpTypes.meta.proteinCoding, partType);
  }

  get isCdsWithStop() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.CDS_WITH_STOP;
  }

  get isRBS() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.RBS;
  }

  get isTerminator() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.TERMINATOR;
  }

  get isOtherPartType() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.OTHER;
  }

  getWipRdpCompliantSequenceModel() {
    return new this.NextClass(this.toJSON());
  }
}


export default WipRdpAbstractSequence;
