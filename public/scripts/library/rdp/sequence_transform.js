import _ from 'underscore';
import data from '../../common/lib/synbio_data';

import SequenceRange from '../sequence-model/range';
import RdpSequenceFeature from './rdp_sequence_feature';
import RdpEdit from './rdp_edit';


var CONTEXT_BASE_PAIRS = 9;


var len = function(sequenceModel) {
 return sequenceModel.getLength(sequenceModel.STICKY_END_NONE);
};


var isMultipleOf3 = function(sequenceModel) {
  return len(sequenceModel) % 3 === 0;
};


var errorOnNotMultipleOf3 = function(sequenceModel, rdpEditType) {
  var error;
  if(!isMultipleOf3(sequenceModel)) {
    var errorMsg = `Requires sequence to be a mutliple of 3 but is "${len(sequenceModel)}" long.`;
    error = new RdpEdit({type: rdpEditType, error: errorMsg});
  }
  return error;
};


/**
 * @method  multipleOf3
 * Does not transform by default.
 *
 * @param  {SequenceModel}  sequenceModel
 * @return {RdpEdit}
 */
var multipleOf3 = function(sequenceModel) {
  let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let length = len(sequenceModel);
  let size = length % 3;
  var rdp_edit;
  if(size !== 0) {
    let frm = offset + length - size;
    let _type = RdpEdit.types.MULTIPLE_OF_3;
    var name = 'Will remove bases';
    var desc = 'Will remove bases to make a multiple of 3';
    var ranges = [new SequenceRange({
      name: name,
      from: frm,
      size: size,
    })];

    // Get a snippet of sequence to show the situation before the edit.
    var contextualFrom = Math.max(0, frm - CONTEXT_BASE_PAIRS);
    var contextualTo = frm + size;
    var sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
    var contextBefore = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

    sequenceModel.deleteBases(frm, size, {stickyEndFormat: sequenceModel.STICKY_END_FULL});

    name = 'Removed bases';
    desc = 'Sequence was not a multiple of 3';
    ranges = [];

    // Get a snippet of sequence to show the situation after the edit.
    contextualTo = frm;
    sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);

    var contextAfter = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});
    rdp_edit = new RdpEdit({type: _type, contextBefore, contextAfter});
  }
  return rdp_edit;
};


/**
 * @method  methionineStartCodon
 * @param  {SequenceModel}  sequenceModel
 * @return {RdpEdit}
 */
var methionineStartCodon = function(sequenceModel) {
  var _type = RdpEdit.types.METHIONINE_START_CODON;
  var length = len(sequenceModel);
  if(length < 3) {
    var error = `Requires sequence to at least 3 base pairs long but is "{len(sequenceModel)}" long.`;
    return new RdpEdit({type: _type, error});
  }

  var rdpEdit;
  var offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let sequenceBases = sequenceModel.getSubSeq(offset, offset + 2, sequenceModel.STICKY_END_FULL);
  const METHIONINE = _.find(data.aa, (aa) => aa.short === 'M').codons[0];

  if(sequenceBases !== METHIONINE) {
    var name, desc, sequence, contextBefore, contextAfter, contextualTo;
    var ranges = [];
    var size = 3;
    var contextualFrom = offset;

    let options = {stickyEndFormat: sequenceModel.STICKY_END_FULL};
    if(sequenceBases === 'GTG' || sequenceBases === 'TTG') {
      name = 'Will modify ' + sequenceBases;
      desc = 'Will modify start codon to be ATG (Methionine)';
      ranges = [new SequenceRange({
        name: name,
        from: offset,
        size: size,
      })];

      // Get a sequence snippet before
      contextualTo = offset + size + CONTEXT_BASE_PAIRS;
      sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      contextBefore = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

      sequenceModel.changeBases(offset, METHIONINE, options);

      name = 'Modified ' + sequenceBases;
      desc = 'Modified start codon to be ATG (Methionine)';
      ranges = [new SequenceRange({
        name: name,
        from: offset,
        size: size,
      })];

      // Get a sequence snippet after
      sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      contextAfter = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});
    } else {
      name = 'Will insert ATG';
      desc = 'Will insert ATG (Methionine) start codon';

      // Get a sequence snippet before
      contextualTo = offset + CONTEXT_BASE_PAIRS;
      sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      contextBefore = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});
      
      name = 'Inserted ATG';
      desc = 'Inserted ATG (Methionine) start codon';
      sequenceModel.insertBases(METHIONINE, offset, options);

      ranges = [new SequenceRange({
        name: name,
        from: offset,
        size: size,
      })];
      // Get a sequence snippet after
      contextualTo = offset + size + CONTEXT_BASE_PAIRS;
      sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      contextAfter = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});
    }

    rdpEdit = new RdpEdit({type: _type, contextBefore, contextAfter});
  }
  return rdpEdit;
};


/**
 * @method noTerminalStopCodon
 * @param  {SequenceModel}  sequenceModel
 * @return {RdpEdit}
 */
var noTerminalStopCodon = function(sequenceModel) {
  var _type = RdpEdit.types.NO_TERMINAL_STOP_CODON;
  var error = errorOnNotMultipleOf3(sequenceModel, _type);
  if(error) return error;

  var rdpEdit;
  let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
  let length = len(sequenceModel);
  var frm = Math.max(offset, offset + length - 3);
  let aAs = sequenceModel.getAAs(frm, 3, sequenceModel.STICKY_END_FULL);

  if(aAs.length === 1 && aAs[0] === 'X') {
    var name = 'Will remove stop codon';
    var desc = 'Will remove terminal stop codon';
    var ranges = [new SequenceRange({
      name: 'Stop codon',
      from: frm,
      size: 3,
    })];

    // Get a sequence snippet before
    var contextualFrom = Math.max(offset, frm - CONTEXT_BASE_PAIRS);
    var contextualTo = frm + 3;
    var sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
    var contextBefore = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

    sequenceModel.deleteBases(frm, 3, {stickyEndFormat: sequenceModel.STICKY_END_FULL});

    // Remove terminal stop codon
    name = 'Removed stop codon';
    desc = `Removed terminal stop codon`;
    ranges = [];

    // Get a sequence snippet after
    contextualTo = frm;
    sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
    var contextAfter = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

    rdpEdit = new RdpEdit({type: _type, contextBefore, contextAfter});
  }

  return rdpEdit;
};


var terminalCBaseAaMapConservativeChange = {
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
};

var terminalCBaseAaMap = _.extend(_.clone(terminalCBaseAaMapConservativeChange), {
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
});


/**
 * @method terminalCBase
 * @param  {SequenceModel}  sequenceModel
 * @return {RdpEdit}
 */
var terminalCBase = function(sequenceModel) {
  var _type = RdpEdit.types.TERMINAL_C_BASE;
  var error = errorOnNotMultipleOf3(sequenceModel, _type);
  if(error) return error;

  var length = len(sequenceModel);
  var rdpEdit;

  if(len !== 0) {
    // Due to validation from `multipleOf3` length will either be 0 or
    // a multiple of 3.
    let offset = sequenceModel.getOffset(sequenceModel.STICKY_END_NONE);
    let frm = offset + length - 3;
    let lastCodon = sequenceModel.getSubSeq(frm, frm + 2, sequenceModel.STICKY_END_FULL);
    if(lastCodon[2] !== 'C') {
      let replacement = terminalCBaseAaMap[lastCodon];
      // Check to see if amino acid changed
      var aaChanged = !!terminalCBaseAaMapConservativeChange[lastCodon];
      _type = (replacement && !aaChanged) ? RdpEdit.types.TERMINAL_C_BASE_NO_AA_CHANGE : _type;
      var name = 'Last base should be "C"';
      var desc = '';

      var ranges = [new SequenceRange({
        name: 'Not C',
        from: frm + 2,
        size: 1
      })];

      // Get a sequence snippet before
      var contextualFrom = Math.max(offset, frm - CONTEXT_BASE_PAIRS);
      var contextualTo = frm + 3;
      var sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      var contextBefore = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

      var rangeName;
      if(replacement) {
        sequenceModel.changeBases(frm, replacement, {stickyEndFormat: sequenceModel.STICKY_END_FULL});

        name = 'Last base changed to "C".';
        desc = `The last base of sequence must be "C".  Codon has been automatically transform from "${lastCodon}" to "${replacement}".`;
        rangeName = 'Changed to C';
      } else {
        name = 'Last base not C';
        rangeName = 'Not C';
        desc = error = `The last base of sequence must be "C" but there is no replacement for the codon: "${lastCodon}".`;
      }
      ranges = [new SequenceRange({
        name: rangeName,
        from: frm + 2,
        size: 1
      })];

      sequence = sequenceModel.getSubSeq(contextualFrom, contextualTo - 1, sequenceModel.STICKY_END_FULL);
      var contextAfter = new RdpSequenceFeature({name, desc, ranges, _type, sequence, contextualFrom, contextualTo});

      rdpEdit = new RdpEdit({type: _type, contextBefore, contextAfter, error});
    }
  }
  return rdpEdit;
};


/**
 * @method  transformSequenceForRdp
 * @param  {SequenceModel}  sequenceModel
 * @return {Array}  array of RdpEdit instances
 */
var transformSequenceForRdp = function(sequenceModel) {
  let transformationFunctions = [
    multipleOf3,
    methionineStartCodon,
    noTerminalStopCodon,
    terminalCBase,
  ];
  var rdpEdits = [];
  _.each(transformationFunctions, function(transformation) {
    var rdpEdit = transformation(sequenceModel);
    if(rdpEdit) {
      rdpEdits.push(rdpEdit);
    }
  });

  return rdpEdits;
};


export default {
  multipleOf3,
  methionineStartCodon,
  noTerminalStopCodon,
  terminalCBase,
  transformSequenceForRdp,
};
