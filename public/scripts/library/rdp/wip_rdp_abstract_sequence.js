import _ from 'underscore';
import Sequence from '../../sequence/models/sequence';
import {transformSequenceForRdp} from './rdp_sequence_transform';
import RdpTypes from './rdp_types';
import RdpEdit from './rdp_edit';


class WipRdpAbstractSequence extends Sequence {
  constructor(attributes, ...other) {
    if(!attributes.Klass) throw new TypeError('Must provide Klass attribute');
    if(!attributes.types) throw new TypeError('Must provide types attribute');
    var Klass = attributes.Klass;
    var types = _.clone(attributes.types);
    delete attributes.Klass;
    delete attributes.types;

    attributes.readOnly = true;
    super(attributes, ...other);
    this.Klass = Klass;
    this.types = types;
  }

  get availablePartTypes() {
    return _.keys(this.types);
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
      // TODO: add an association for rdpEdits ?
      'rdpEdits',
      'partType',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  get isProteinCoding() {
    var partType = this.get('partType');
    return _.contains(RdpTypes.meta.proteinCoding, partType);
  }

  get isTerminator() {
    var partType = this.get('partType');
    return partType === RdpTypes.types.TERMINATOR;
  }

  getRdpCompliantSequenceModel(attributes) {
    var desiredWipRdpSequence = this.getDesiredSequenceModel(attributes);
    desiredWipRdpSequence.transformSequenceForRdp();
    return desiredWipRdpSequence;
  }

  getDesiredSequenceModel(attributes) {
    if(attributes.stickyEnds) {
      throw new TypeError('attributes for getDesiredSequenceModel must not contain stickyEnds');
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
    if(!_.contains(this.availablePartTypes, partType)) {
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
