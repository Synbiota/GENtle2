// TODO require dependency on underscore.mixin
import _ from 'underscore';
import Q from 'q';
import {transformSequenceForRdp} from './rdp_sequence_transform';
import WipRdpAbstractSequence from './wip_rdp_abstract_sequence';
import RdpEdit from './rdp_edit';
import SequenceTransforms from 'gentle-sequence-transforms';


// stickyEnds will never be present on transformedSequence so we don't need to
// specify any stickyEnd format
var stickyEndFormat = WipRdpAbstractSequence.STICKY_END_ANY;

var modifyBasesOptions = {
  updateHistory: false,
  stickyEndFormat,
};

/**
 * Should be generated from calling `getWipRdpCompliantSequenceModel`
 * subclases of WipRdpAbstractSequence class
 */
class WipRdpReadyAbstractSequence extends WipRdpAbstractSequence {
  constructor(attributes, options={}) {
    // Validate loudly as model must be valid.
    options.validateLoudly = true;
    // Store a copy of the original sequence bases for use later (used by PCR
    // RDP model when primers are being calculated to work out more precise
    // melting temperatures).
    attributes.originalSequenceBases = attributes.sequence;
    attributes.originalToCurrentSequenceOffset = 0; // can be negative
    attributes.sameBasesFrm = 0;
    attributes.sameBasesSize = attributes.sequence.length;
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
   * @method  expandSameBases  The `sameBasesFrm`, `sameBasesSize` and
   *          `originalToCurrentSequenceOffset` attributes describe a
   *          sub sequence shared by both the `sequence` and `originalSequenceBases`
   *          attributes.  If there are adjacent bases in the sequence which are
   *          the same between `sequence` and `originalSequenceBases` then
   *          change (increase) the values of `sameBasesFrm` and `sameBasesSize`
   *          to include these.
   * @return {undefined}
   */
  expandSameBases() {
    var originalSequenceBases = this.get('originalSequenceBases');
    var sequence = this.getSequence(stickyEndFormat);
    var originalToCurrentSequenceOffset = this.get('originalToCurrentSequenceOffset');
    var sameBasesFrm = this.get('sameBasesFrm');
    var sameBasesSize = this.get('sameBasesSize');
    var forwardSimilar = SequenceTransforms.numberOfSimilarBases(
      originalSequenceBases, sequence,
      originalToCurrentSequenceOffset,
      originalToCurrentSequenceOffset + sameBasesFrm + sameBasesSize, true);
    var reverseSimilar = SequenceTransforms.numberOfSimilarBases(
      originalSequenceBases, sequence,
      originalToCurrentSequenceOffset,
      originalToCurrentSequenceOffset + sameBasesFrm - 1, false);
    this.set({
      sameBasesFrm: sameBasesFrm - reverseSimilar,
      sameBasesSize: sameBasesSize + reverseSimilar + forwardSimilar,
    });
  }

  deleteBases(firstBase, length, options={}) {
    var value = super.deleteBases(firstBase, length, options);

    var totalLength = this.getLength();
    var originalToCurrentSequenceOffset = this.get('originalToCurrentSequenceOffset');
    var sameBasesFrm = this.get('sameBasesFrm');
    var sameBasesSize = this.get('sameBasesSize');
    var untouchedTo = sameBasesFrm + sameBasesSize;
    var deleteTo = firstBase + length;
    if(firstBase <= sameBasesFrm) {
      originalToCurrentSequenceOffset += length;
      if(deleteTo <= sameBasesFrm) {
        sameBasesFrm -= length;
      } else if (deleteTo <= untouchedTo) {
        sameBasesSize -= deleteTo - sameBasesFrm;
        sameBasesFrm -= firstBase;
      } else {
        sameBasesSize = 0;
        sameBasesFrm -= length;
      }
    } else if(firstBase < untouchedTo) {
      if(deleteTo >= untouchedTo) {
        // We're trimming the end off the untouched sequence
        sameBasesSize -= (untouchedTo - firstBase);
      } else {
        // We're deleting from the middle of the sequence.  Currently set
        // sameBasesFrm and sameBasesSize to 0, though in future, could choose
        // the largest sequence to left or right of deletion.
        sameBasesFrm = 0;
        sameBasesSize = 0;
      }
    }
    if(sameBasesFrm < 0) {
      throw RangeError(`Runtime error: sameBasesFrm is < 0 : ${sameBasesFrm}`);
    }
    if((sameBasesFrm + sameBasesSize - length) > totalLength) {
      throw RangeError(`Runtime error: sameBasesSize is too large: ${sameBasesSize}, sameBasesFrm: ${sameBasesFrm}, totalLength: ${totalLength}`);
    }
    this.set({originalToCurrentSequenceOffset, sameBasesFrm, sameBasesSize});
    this.expandSameBases();
    return value;
  }

  insertBases(bases, beforeBase, options={}) {
    var value = super.insertBases(bases, beforeBase, options);

    var originalToCurrentSequenceOffset = this.get('originalToCurrentSequenceOffset');
    var sameBasesFrm = this.get('sameBasesFrm');
    var sameBasesSize = this.get('sameBasesSize');
    var untouchedTo = sameBasesFrm + sameBasesSize;
    var length = bases.length;
    if(beforeBase <= sameBasesFrm) {
      sameBasesFrm += length;
      originalToCurrentSequenceOffset -= length;
    } else if(beforeBase < untouchedTo) {
      var diff = untouchedTo - beforeBase;
      if((diff / sameBasesSize) > 0.5) {
        // Take the first half as it's bigger
        diff = beforeBase - sameBasesFrm;
        sameBasesFrm += diff + length;
        sameBasesSize -= diff;
      } else {
        sameBasesSize -= diff;
      }
    }
    this.set({originalToCurrentSequenceOffset, sameBasesFrm, sameBasesSize});
    this.expandSameBases();
    return value;
  }

  changeBases(firstBase, newBases, options={}) {
    var value = super.changeBases(firstBase, newBases, options);

    var sameBasesFrm = this.get('sameBasesFrm');
    var sameBasesSize = this.get('sameBasesSize');
    var untouchedTo = sameBasesFrm + sameBasesSize;
    var length = newBases.length;
    var changeUpTo = firstBase + length;
    if(firstBase <= sameBasesFrm) {
      // Calculate overlap
      if(changeUpTo <= sameBasesFrm) {
        // Do nothing
      } else if(changeUpTo < untouchedTo) {
        var val = changeUpTo - sameBasesFrm;
        sameBasesFrm += val;
        sameBasesSize -= val;
      } else {
        // All bases have been changed
        // TODO: handle case where there are 1 or more adjacent bases that
        // despite being "changed" are actually the same as the original
        // sequence.
        sameBasesFrm = 0;
        sameBasesSize = 0;
      }
    } else if(firstBase < untouchedTo) {
      if(changeUpTo < untouchedTo) {
        // We have changed bases in the middle of the sequence.  Currently set
        // sameBasesFrm and sameBasesSize to 0, though in future, could choose
        // the largest sequence to left or right of deletion.
        sameBasesFrm = 0;
        sameBasesSize = 0;
      } else {
        sameBasesSize = firstBase - sameBasesFrm;
      }
    } else {
      // Do nothing
    }
    this.set({sameBasesFrm, sameBasesSize});
    this.expandSameBases();
    return value;
  }

  /**
   * @method  _transformSequenceForRdp
   * @throw  {TypeError} If the sequence is invalid
   * @return {Undefined}
   */
  _transformSequenceForRdp() {
    var originalSequenceBases = this.get('originalSequenceBases');
    var frm = this.get('frm');
    var size = this.get('size');

    // Delete the bases not included in the ROI (Region of interest) i.e. not
    // desired in the final RDP sequence
    var topFrm = frm + size;
    var remainingAt3Prime = originalSequenceBases.length - topFrm;
    if(remainingAt3Prime > 0) this.deleteBases(topFrm, remainingAt3Prime, modifyBasesOptions);
    if(frm > 0 ) this.deleteBases(0, frm, modifyBasesOptions);

    var rdpEdits = transformSequenceForRdp(this);
    var desiredStickyEnds = this.get('desiredStickyEnds');
    var shortName = (
      desiredStickyEnds.start.name + '-' +
      this.get('shortName') + '-' +
      desiredStickyEnds.end.name
    );
    this.set({
      rdpEdits,
      shortName,
    });
  }

  errors() {
    var rdpEdits = this.get('rdpEdits');
    return _.filter(rdpEdits, (rdpEdit) => rdpEdit.level === RdpEdit.levels.ERROR);
  }

  /**
   * @method  getRdpSequenceModel  Not idempotent.  Checks the model has
   *          successfully been transformed to have an RDP compliant sequence
   *          (minus the RDP sticky ends).
   *          Checks the model then has the correct attributes before modifying
   *          the sequence to add the desiredStickyEnd sequences (essential for
   *          calculating correct PCR primers and melting temperatures).
   *          Subclasses return a Rejected Promise or a Promise that resolves
   *          with the rdpSequenceModel.
   *          TODO: refactor transformSequenceForRdp to accept models with
   *          stickyEnds and move this code into the constructor so that
   *          `getRdpSequenceModel` can become idempotent.  Would be useful
   *          if the PCR primer calculation fails, then only that part needs
   *          to be rerun.
   * @return {Rejected Promise or undefined}
   */
  getRdpSequenceModel() {
    var error;
    if(this.errors().length) {
      error = Q.reject('Can not call getRdpSequenceModel if there were errors making this into an RDP sequence');
    }
    if(this.getStickyEnds(false)) {
      error = Q.reject('sequenceModel can not have stickyEnds');
    }
    var desiredStickyEnds = _.deepClone(this.get('desiredStickyEnds'));
    if(!desiredStickyEnds || !desiredStickyEnds.start || !desiredStickyEnds.end) {
      error = Q.reject('sequenceModel must have desiredStickyEnds');
    }
    if(error) return error;

    if(this.isProteinCoding) {
      if(desiredStickyEnds.start.name === 'X') {
        // the ATG has been added / or has been confirmed as being already
        // present, so don't add it again in the form of the
        // ATG from the GATG of the X stickyEnd
        var seq = desiredStickyEnds.start.sequence;
        desiredStickyEnds.start.sequence = seq.substr(0, seq.length - 3);
      }
      if(!this.isCdsWithStop) {
        // Remove the first base of the stickyEnd to ensure the correct reading
        // frame is maintained
        desiredStickyEnds.end.sequence = desiredStickyEnds.end.sequence.slice(1);
      }
    }
    this.insertBases(desiredStickyEnds.start.sequence, 0, modifyBasesOptions);
    var len = this.getLength(stickyEndFormat);
    this.insertBases(desiredStickyEnds.end.sequence, len, modifyBasesOptions);
    this.set({
      stickyEnds: desiredStickyEnds,
      desiredStickyEnds: undefined,
    });
    return undefined;
  }
}

export default WipRdpReadyAbstractSequence;
