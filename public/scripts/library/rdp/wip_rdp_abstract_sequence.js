import _ from 'underscore';
import Sequence from '../../sequence/models/sequence';
import {transformSequenceForRdp} from './rdp_sequence_transform';
import RdpTypes from './rdp_types';
import RdpEdit from './rdp_edit';


class WipRdpAbstractSequence extends Sequence {
  constructor(attributes, options={}) {
    attributes.readOnly = true;
    // We haven't registered `rdpEdits` as an association and we should never
    // have any stored that we instantiate the WipRdp__Sequences from so set it
    // to an empty list just in case:
    attributes.rdpEdits = [];
    super(attributes, options);
  }

  preValidationSetup(attributes, options) {
    if(!options.Klass) throw new TypeError('Must provide options with "Klass" key');
    if(!options.types) throw new TypeError('Must provide options with "types" key');
    this.Klass = options.Klass;
    this.types = _.clone(options.types);
    delete options.Klass;
    delete options.types;
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

  get optionalFields() {
    var fields = super.optionalFields.concat([
      // obtains 'shortName' from Sequence Factory
      'sourceSequenceName',
      'desiredStickyEnds',
      // Define the portion of the template sequence that should be used in
      // the final product
      'frm', // inclusive
      'size',
      // A copy of the original template sequence
      'originalSequenceBases',
      // We need rdpEdits to instantiate the non-WIP RDP SequenceModel
      'rdpEdits',
      'partType'
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
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

  getWipRdpCompliantSequenceModel(attributes) {
    var desiredWipRdpSequence = this._getDesiredSequenceModel(attributes);
    desiredWipRdpSequence.transformSequenceForRdp();
    return desiredWipRdpSequence;
  }

  _getDesiredSequenceModel(attributes) {
    if(attributes.stickyEnds) {
      throw new TypeError('attributes for _getDesiredSequenceModel must not contain "stickyEnds"');
    }
    if(attributes.frm === undefined || attributes.size === undefined) {
      throw new TypeError('attributes for _getDesiredSequenceModel must specify "frm" and "size"');
    }
    attributes.originalSequenceBases = attributes.sequence;
    var newSequenceModel = new this.Klass(attributes);

    // Delete the bases
    var topFrm = attributes.frm + attributes.size;
    var remaining = attributes.originalSequenceBases.length - topFrm;
    if(remaining > 0) newSequenceModel.deleteBases(topFrm, remaining, this.STICKY_END_ANY);
    if(attributes.frm > 0 ) newSequenceModel.deleteBases(0, attributes.frm, this.STICKY_END_ANY);
    return newSequenceModel;
  }

  /**
   * @method  transformSequenceForRdp
   * @throw  {TypeError} If the sequence is invalid
   * @return {array<RdpEdit>}
   */
  transformSequenceForRdp() {
    this.validationBeforeTransform();

    var rdpEdits = transformSequenceForRdp(this);
    this.set({rdpEdits});
    return rdpEdits;
  }

  validationBeforeTransform() {
    var desiredStickyEnds = this.get('desiredStickyEnds');
    if(!(desiredStickyEnds && desiredStickyEnds.start && desiredStickyEnds.end)) {
      throw new TypeError('Must provide "desiredStickyEnds"');
    }
    var partType = this.get('partType');
    if(!this.validPartType(partType)) {
      throw new TypeError(`Invalid partType: "${partType}"`);
    }
    if(!_.contains(this.availableStickyEndNames, desiredStickyEnds.name)) {
      throw new TypeError(`Invalid desiredStickyEnd: "${desiredStickyEnds.name}"`);
    }
  }

  errors() {
    var rdpEdits = this.get('rdpEdits');
    return _.filter(rdpEdits, (rdpEdit) => rdpEdit.level === RdpEdit.levels.ERROR);
  }
}


export default WipRdpAbstractSequence;
