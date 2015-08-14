import _ from 'underscore';
import {transformSequenceForRdp} from './rdp_sequence_transform';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';
import RdpEdit from './rdp_edit';


class WipRdpReadyAbstractSequence extends WipRdpAbstractSequence {
  constructor(attributes, options={}) {
    // Validate loudly as model must be valid.
    options.validateLoudly = true;
    // Store a copy of the original sequence bases for use later (used by PCR
    // RDP model when primers are being calculated to work out more precise
    // melting temperatures).
    attributes.originalSequenceBases = attributes.sequence;
    super(attributes, options);
    this._transformSequenceForRdp();
  }

  get requiredFields() {
    var fields = super.requiredFields.concat([
      // A copy of the original template sequence
      'originalSequenceBases',
      'shortName',
      'sourceSequenceName',
      'desiredStickyEnds',
      'frm',
      'size',
      'partType',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  get optionalFields() {
    var fields = super.optionalFields.concat([
      'rdpEdits',
    ]);
    return _.reject(fields, (field) => field === 'stickyEnds');
  }

  validateFields(attributes) {
    var errors = super.validateFields(attributes);
    if(!this.validPartType(attributes.partType)) {
      errors.push(`Invalid partType: "${attributes.partType}"`);
    }
    var name = attributes.desiredStickyEnds && attributes.desiredStickyEnds.name;
    if(!_.contains(this.availableStickyEndNames, name)) {
      errors.push(`Invalid desiredStickyEnds: "${name}"`);
    }
    return errors;
  }

  /**
   * @method  _transformSequenceForRdp
   * @throw  {TypeError} If the sequence is invalid
   * @return {Undefined}
   */
  _transformSequenceForRdp() {
    var attributes = this.attributes;

    // Delete the bases
    var topFrm = attributes.frm + attributes.size;
    var remainingAt3Prime = attributes.originalSequenceBases.length - topFrm;
    var deleteBasesOptions = {
      updateHistory: false,
      stickyEndFormat: this.STICKY_END_ANY,
    };
    if(remainingAt3Prime > 0) this.deleteBases(topFrm, remainingAt3Prime, deleteBasesOptions);
    if(attributes.frm > 0 ) this.deleteBases(0, attributes.frm, deleteBasesOptions);

    var rdpEdits = transformSequenceForRdp(this);
    this.set({rdpEdits});
  }

  errors() {
    var rdpEdits = this.get('rdpEdits');
    return _.filter(rdpEdits, (rdpEdit) => rdpEdit.level === RdpEdit.levels.ERROR);
  }
}

export default WipRdpReadyAbstractSequence;
