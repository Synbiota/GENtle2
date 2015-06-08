import data from '../../common/lib/synbio_data';

import SequenceRange from '../sequence-model/range';
import SequenceFeature from '../sequence-model/feature';
import ValidationResponse from './validation_response';


/**
 * @method  validateMultipleOf3
 * Does not transform by default.
 *
 * @param  {SequenceModel}  sequenceModel
 * @param  {Boolean} allowTransform=false
 * @return {ValidationResponse}
 */
var validateMultipleOf3 = function(sequenceModel, allowTransform=false) {
  let errors = [];
  let transforms = [];
  let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let len = sequenceModel.getLength(sequenceModel.STICKY_END_NONE);
  let size = len % 3;
  if(size !== 0) {
    let errored = false;
    let frm = offset + len - size;
    var name;
    let desc;
    if(allowTransform) {
      name = 'Removed bases';
      desc = 'Sequence was not a multiple of 3';
      sequenceModel.deleteBases(frm, size, {stickyEndFormat: sequenceModel.STICKY_END_FULL});
    } else {
      name = 'Extra bases';
      desc = 'Sequence not a multiple of 3';
      errored = true;
    }
    let ranges = [new SequenceRange({
      name: name,
      from: frm,
      size: size,
    })];
    let _type = errored ? 'error' : 'note';
    let feature = new SequenceFeature({name, desc, ranges, _type});
    if(errored) {
      errors = [feature];
    } else {
      transforms = [feature];
    }
  }
  return new ValidationResponse(errors, transforms);
};


/**
 * @method  validateMethionineStartCodon
 * @param  {SequenceModel}  sequenceModel
 * @param  {Boolean} allowTransform=true
 * @return {ValidationResponse}
 */
var validateMethionineStartCodon = function(sequenceModel, allowTransform=true) {
  let errors = [];
  let transforms = [];
  let frm = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let sequenceBases = sequenceModel.getSubSeq(frm, frm + 2, sequenceModel.STICKY_END_FULL);
  const METHIONINE = _.find(data.aa, (aa) => aa.short === 'M').codons[0];
  if(sequenceBases !== METHIONINE) {
    var name;
    let desc;
    let errored = false;
    if(allowTransform) {
      let options = {stickyEndFormat: sequenceModel.STICKY_END_FULL};
      if(sequenceBases === 'GTG' || sequenceBases === 'TTG') {
        name = 'Modfied ATG';
        desc = 'Modfied start codon to be ATG (Methionine)';
        sequenceModel.changeBases(frm, METHIONINE, options);
      } else {
        name = 'Inserted ATG';
        desc = 'Inserted ATG (Methionine) start codon';
        sequenceModel.insertBases(METHIONINE, frm, options);
      }
    } else {
      name = 'Not ATG';
      desc = 'Not a Methionine start codon';
      errored = true;
    }
    let ranges = [new SequenceRange({
      name: name,
      from: frm,
      size: 3
    })];
    let _type = errored ? 'error' : 'note';
    let feature = new SequenceFeature({name, desc, ranges, _type});
    if(errored) {
      errors = [feature];
    } else {
      transforms = [feature];
    }
  }
  return new ValidationResponse(errors, transforms);
};


/**
 * @method validateNoStopCodon
 * @param  {SequenceModel}  sequenceModel
 * @param  {Boolean} allowTransform=true
 * @return {ValidationResponse}
 */
var validateNoStopCodon = function(sequenceModel, allowTransform=true) {
  let validationResponse = validateMultipleOf3(sequenceModel, allowTransform);
  if(!validationResponse.success) return validationResponse;

  let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let len = sequenceModel.getLength(sequenceModel.STICKY_END_NONE);
  let aAs = sequenceModel.getAAs(offset, len, sequenceModel.STICKY_END_FULL);

  let indexes = [];
  _.each(aAs, (codon, i) => {
    if(codon === 'X') {
      indexes.push(offset + i*3);
    }
  });
  // Sort indexes in reverse order so that when we remove them, we remove the
  // correct bases
  indexes = _.sortBy(indexes, (index) => len - index);

  let errors = [];
  let transforms = [];
  if(indexes.length) {
    let errored = false;
    var name;
    let desc;
    if(allowTransform) {
      // Remove stop codons
      name = 'Removed stop codon(s)';
      desc = `Removed ${indexes.length} stop codons`;
      _.each(indexes, function(index) {
        sequenceModel.deleteBases(index, 3, {stickyEndFormat: sequenceModel.STICKY_END_FULL});
      });
    } else {
      name = 'Stop codon(s) present';
      desc = `Stop codons should not be present in RDP parts but ${indexes.length} present`;
      errored = true;
    }
    let ranges = [];
    _.each(indexes, function(index) {
      ranges.push(new SequenceRange({
        name: name,
        from: index,
        size: 3,
      }));
    });
    let _type = errored ? 'error' : 'note';
    let feature = new SequenceFeature({name, desc, ranges, _type});
    if(errored) {
      errors = [feature];
    } else {
      transforms = [feature];
    }
  }

  return new ValidationResponse(errors, transforms);
};


var terminalCBaseAaMap = {
  // Tryptophan -> Tyrosine
  "TGG": "TAC",
  // Glutamine -> Asparagine
  "CAA": "AAC",
  "CAG": "AAC",
  // Methionine -> Leucine
  "ATG": "CTC",
  // Lysine -> Arginine
  "AAA": "CGC",
  "AAG": "CGC",
  // Glutamic acid -> Aspartic acid
  "GAA": "GAC",
  "GAG": "GAC",

  // Alanine
  "GCT": "GCC",
  "GCA": "GCC",
  "GCG": "GCC",
  // Leucine
  "TTA": "CTC",
  "TTG": "CTC",
  "CTT": "CTC",
  "CTA": "CTC",
  "CTG": "CTC",
  // Arginine
  "CGT": "CGC",
  "CGA": "CGC",
  "CGG": "CGC",
  "AGA": "CGC",
  "AGG": "CGC",
  // Asparagine
  "AAT": "AAC",
  // Aspartic acid
  "GAT": "GAC",
  // Phenylalanine
  "TTT": "TTC",
  // Cysteine
  "TGT": "TGC",
  // Proline
  "CCT": "CCC",
  "CCA": "CCC",
  "CCG": "CCC",
  // Serine
  "TCT": "TCC",
  "TCA": "TCC",
  "TCG": "TCC",
  "AGT": "AGC",
  // Threonine
  "ACT": "ACC",
  "ACA": "ACC",
  "ACG": "ACC",
  // Glycine
  "GGT": "GGC",
  "GGA": "GGC",
  "GGG": "GGC",
  // Histidine
  "CAT": "CAC",
  // Tyrosine
  "TAT": "TAC",
  // Isoleucine
  "ATT": "ATC",
  "ATA": "ATC",
  // Valine
  "GTT": "GTC",
  "GTA": "GTC",
  "GTG": "GTC",

  // Stop codons (no conversion available, should not be present)
  "TAG": undefined,
  "TGA": undefined,
  "TAA": undefined,
};


/**
 * @method validateTerminalCBase
 * @param  {SequenceModel}  sequenceModel
 * @param  {Boolean} allowTransform=true
 * @return {ValidationResponse}
 */
var validateTerminalCBase = function(sequenceModel, allowTransform=true) {
  let validationResponse = validateMultipleOf3(sequenceModel, allowTransform);
  if(!validationResponse.success) return validationResponse;

  let len = sequenceModel.getLength(sequenceModel.STICKY_END_NONE);

  let errors = [];
  let transforms = [];
  if(len !== 0) {
    // Due to validation from `validateMultipleOf3` length will either be 0 or
    // a multiple of 3.
    let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
    let frm = offset + len - 3;
    let lastCodon = sequenceModel.getSubSeq(frm, frm + 2, sequenceModel.STICKY_END_FULL);
    // console.log(offset, len, frm, lastCodon)
    if(lastCodon[2] !== 'C') {
      let replacement = terminalCBaseAaMap[lastCodon];
      let errored;
      var name;
      let desc;
      if(replacement) {
        if(allowTransform) {
          name = 'Last base changed to "C".';
          desc = `The last base of sequence must be "C".  Codon has been automatically transform from "${lastCodon}" to "${replacement}".`;
          sequenceModel.changeBases(frm, replacement, {stickyEndFormat: sequenceModel.STICKY_END_FULL});
        } else {
          errored = true;
          name = 'Last base not "C"';
          desc = 'The last base of sequence must be "C" but automatic transform disabled.';
        }
      } else {
        errored = true;
        name = 'Last base not "C"';
        desc = `The last base of sequence must be "C" but there is not replacement for the codon: "${lastCodon}".`;
      }
      let ranges = [new SequenceRange({
        name: name,
        from: frm,
        size: 3
      })];
      let _type = errored ? 'error' : 'note';
      let feature = new SequenceFeature({name, desc, ranges, _type});
      if(errored) {
        errors = [feature];
      } else {
        transforms = [feature];
      }
    }
  }
  return new ValidationResponse(errors, transforms);
};


/**
 * @method  validateRDPSequence
 * @param  {SequenceModel}  sequenceModel
 * @param  {Boolean} allowTransform=undefined
 * @return {ValidationResponse}
 */
var validateRDPSequence = function(sequenceModel, allowTransform=undefined) {
  let functions = [
    validateMultipleOf3,
    validateMethionineStartCodon,
    validateNoStopCodon,
    validateTerminalCBase,
  ];
  let response;
  _.some(functions, function(validation) {
    let tempResponse = validation(sequenceModel, allowTransform);
    if(response) {
      tempResponse = ValidationResponse.merge(response, tempResponse);
    }
    response = tempResponse;
    return !response.success;
  });
  return response;
};


export default {
  validateMultipleOf3,
  validateMethionineStartCodon,
  validateNoStopCodon,
  validateTerminalCBase,
  validateRDPSequence,
};
