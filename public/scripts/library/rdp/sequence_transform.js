import _ from 'underscore';
import data from '../../common/lib/synbio_data';

import SequenceRange from '../sequence-model/range';
import RdpSequenceFeature from './rdp_sequence_feature';
import RdpEdit from './rdp_edit';


var CONTEXT_BASE_PAIRS = 9;
var CODON_CONTEXT_BASE_PAIRS = (CONTEXT_BASE_PAIRS - 3) / 2;


var getLen = function(sequenceModel) {
 return sequenceModel.getLength(sequenceModel.STICKY_END_ANY);
};


var getSubSeq = function(sequenceModel, frm, size) {
 return sequenceModel.getSubSeqExclusive(frm, size, sequenceModel.STICKY_END_ANY);
};


var getContext = function(sequenceModel, frm, size, context=CONTEXT_BASE_PAIRS) {
  var flankingContextBasePairs = (context - size) / 2;
  var maxContextualFrom = Math.ceil(frm - flankingContextBasePairs);
  var contextualFrom = Math.max(0, maxContextualFrom);
  var diffContextualFrom = (maxContextualFrom < contextualFrom) ? (contextualFrom - maxContextualFrom) : 0;

  var maxContextualTo = Math.ceil(frm + size + flankingContextBasePairs + diffContextualFrom);
  var contextualTo = Math.min(getLen(sequenceModel), maxContextualTo);
  var diffContextualTo = (maxContextualTo > contextualTo) ? (maxContextualTo - contextualTo) : 0;
  contextualFrom = Math.max(0, contextualFrom - diffContextualTo);

  var sequence = getSubSeq(sequenceModel, contextualFrom, contextualTo);
  return {contextualFrom, contextualTo, sequence};
};


var isMultipleOf3 = function(sequenceModel) {
  return getLen(sequenceModel) % 3 === 0;
};


var warnIfNotMultipleOf3 = function(sequenceModel, rdpEditType) {
  var rdpEdit;
  if(!isMultipleOf3(sequenceModel)) {
    var message = `Requires sequence to be a mutliple of 3 but is "${getLen(sequenceModel)}" long.`;
    rdpEdit = new RdpEdit({
      type: RdpEdit.types.NOT_MULTIPLE_OF_3,
      subType: rdpEditType,
      level: RdpEdit.levels.WARN,
      message
    });
  }
  return rdpEdit;
};


var warnIfStickyEndsPresent = function(sequenceModel, rdpEditType) {
  var rdpEdit;
  if(sequenceModel.getStickyEnds(false)) {
    var message = `Sequence can not have stickyEnds.`;
    rdpEdit = new RdpEdit({
      type: RdpEdit.types.STICKY_ENDS_PRESENT,
      subType: rdpEditType,
      level: RdpEdit.levels.WARN,
      message
    });
  }
  return rdpEdit;
};


/**
 * @function warnIfShortSequence  This function is used to ensure a minimum of 3
 * base pairs is present, which is required by some of the functions.
 * In reality this will likely never error because the RDP oligo part creation
 * should be triggered for short sequences.
 * @param  {SequenceModel} sequenceModel
 * @param  {String} rdpEditType
 * @return {RdpEdit}
 */
var warnIfShortSequence = function(sequenceModel, rdpEditType) {
  var rdpEdit;
  var length = getLen(sequenceModel);
  if(length < 3) {
    var message = `Requires sequence to be at least 3 base pairs long but is "${length}" long.`;
    rdpEdit = new RdpEdit({
      type: RdpEdit.types.SEQUENCE_TOO_SHORT,
      subType: rdpEditType,
      level: RdpEdit.levels.WARN,
      message
    });
  }
  return rdpEdit;
};


var throwErrorIfPresent = function(requirementFunction, sequenceModel, rdpEditType) {
  var rdpEdit = requirementFunction(sequenceModel, rdpEditType);
  if(rdpEdit && rdpEdit.message) throw new Error(rdpEdit.message);
};


class TransformationFunction {
  /**
   * constructor
   * @param  {function} transformFunction A function that accepts a sequenceModel
   *                                      and returns array<RdpEdit>
   * @param  {array<function>} requirements
   * @param  {string} rdpEditType
   */
  constructor(transformFunction, requirements, rdpEditType) {
    if(!_.isFunction(transformFunction)) throw new Error('transformFunction must be a function');
    if(!_.isArray(requirements)) throw new Error('Requirements must be an array of functions');
    if(!_.isString(rdpEditType)) throw new Error('rdpEditType must be a String');
    this.transformFunction = transformFunction;
    this.requirements = requirements;
    this.rdpEditType = rdpEditType;
  }

  /**
   * @method process  Check if the requirements are met.
   * @param  {SequenceModel}  sequenceModel
   * @return {array<RdpEdit>}
   */
  check(sequenceModel) {
    var rdpEdits = [];
    _.each(this.requirements, (requirementFunction) => {
      var rdpEdit = requirementFunction(sequenceModel, this.rdpEditType);
      if(rdpEdit) rdpEdits.push(rdpEdit);
    });
    return rdpEdits;
  }

  /**
   * @method process
   * @param  {SequenceModel}  sequenceModel
   * @throws {Error} If sequenceModel has condition that violates a requirement.
   * @return {array<RdpEdit>}
   */
  process(sequenceModel) {
    // Do a runtime check to ensure the requirements have actually been met.
    _.each(this.requirements, (requirementFunction) => {
      throwErrorIfPresent(requirementFunction, sequenceModel, this.rdpEditType);
    });
    return this.transformFunction(sequenceModel);
  }
}

var requirements, rdpEditType;


/**
 * @function  makeNthCodonIsAaFn
 * @param  {Integer}  codonPosition  The position of the codon, 0 indexed when
 *                                   positive, can be negative.
 *                                   If codon at position is incorrect and
 *                                   codonPosition is positive, codon will be
 *                                   inserted before this position.  If
 *                                   codonPosition is negative, codon will be
 *                                   inserted after this position.
 * @param  {String}  aA  Amino acid short code
 * @param  {Object} types  Has keys: CONVERTED, ADDED
 * @param  {array<String>} convertableFromCodons  list of codons
 * @return {function}  takes `SequenceModel` and returns `array<RdpEdit>`
 */
var makeNthCodonIsAaFn = function(codonPosition, aA, types={}, convertableFromCodons=[]) {
  aA = aA.toUpperCase();
  convertableFromCodons = _.map(convertableFromCodons, (s) => s.toUpperCase());

  var codonPositionDescription = `codon ${codonPosition+1}`;
  if(codonPosition === 0) {
    codonPositionDescription = 'first codon';
  } else if(codonPosition === -1) {
    codonPositionDescription = 'last codon';
  }

  var nthCodonIsAaFn = function(sequenceModel) {
    var rdpEdit;
    var length = getLen(sequenceModel);
    var codonPositionInBases = ((codonPosition >= 0) ? 0 : length) + (codonPosition * 3);
    var codonInsertPositionInBases = (codonPosition >= 0) ? codonPositionInBases : (codonPositionInBases + 3);
    var sequenceBases = getSubSeq(sequenceModel, codonPositionInBases, 3);
    var aminoAcidData = _.find(data.aa, (aa) => aa.short === aA);
    const DESIRED_CODONS = aminoAcidData.codons;

    if(!_.contains(DESIRED_CODONS, sequenceBases)) {
      var DESIRED_CODON = DESIRED_CODONS[0];
      var type, name, desc, contextBefore, contextAfter;
      var ranges = [];
      var options = {stickyEndFormat: sequenceModel.STICKY_END_ANY};

      if(_.contains(convertableFromCodons, sequenceBases)) {
        type = types.CONVERTED;
        name = 'Will modify ' + sequenceBases;
        desc = `Will modify ${codonPositionDescription} to be ${DESIRED_CODON} (${aminoAcidData.extended})`;
        ranges = [new SequenceRange({
          name: name,
          from: codonPositionInBases,
          size: 3,
        })];
        // Get a sequence snippet before
        let {contextualFrom, contextualTo, sequence} = getContext(sequenceModel, codonPositionInBases, 3);
        contextBefore = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});

        sequenceModel.changeBases(codonPositionInBases, DESIRED_CODON, options);

        name = 'Modified ' + sequenceBases;
        desc = `Modified ${codonPositionDescription} to be ${DESIRED_CODON} (${aminoAcidData.extended})`;
        ranges = [new SequenceRange({
          name: name,
          from: codonPositionInBases,
          size: 3,
        })];
        // Get a sequence snippet after
        sequence = getSubSeq(sequenceModel, contextualFrom, contextualTo);
        contextAfter = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});
      } else {
        type = types.ADDED;
        name = `Will insert ${DESIRED_CODON}`;
        desc = `Will insert ${DESIRED_CODON} (${aminoAcidData.extended}) as ${codonPositionDescription}`;
        let {contextualFrom, contextualTo, sequence} = getContext(sequenceModel, codonPositionInBases, 0, CONTEXT_BASE_PAIRS - 3);
        contextBefore = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});

        sequenceModel.insertBases(DESIRED_CODON, codonInsertPositionInBases, options);

        name = `Inserted ${DESIRED_CODON}`;
        desc = `Inserted ${DESIRED_CODON} (${aminoAcidData.extended}) as ${codonPositionDescription}`;
        ranges = [new SequenceRange({
          name: name,
          from: codonPositionInBases,
          size: 3,
        })];
        // Get a sequence snippet after
        var vals = getContext(sequenceModel, codonPositionInBases, 3);
        // TODO: updated ES6 parser otherwise Destructuring Assignment errors
        // with `Duplicate declaration "contextualFrom"`
        contextAfter = new RdpSequenceFeature({name, desc, ranges, _type: type,
          sequence: vals.sequence,
          contextualFrom: vals.contextualFrom,
          contextualTo: vals.contextualTo,
        });
      }

      rdpEdit = new RdpEdit({type, contextBefore, contextAfter});
    }
    return rdpEdit ? [rdpEdit] : [];
  };

  return nthCodonIsAaFn;
};


var makeFirstCodonIsAaFn = _.partial(makeNthCodonIsAaFn, 0);
var makeLastCodonIsAaFn = _.partial(makeNthCodonIsAaFn, -1);


requirements = [
  warnIfStickyEndsPresent,
  warnIfShortSequence,
];
rdpEditType = RdpEdit.types.METHIONINE_START_CODON;
var convertableFromCodons = ['GTG', 'TTG'];
var types = {
  CONVERTED: RdpEdit.types.METHIONINE_START_CODON_CONVERTED,
  ADDED: RdpEdit.types.METHIONINE_START_CODON_ADDED,
};
/**
 * @function  firstCodonIsMethionineFn
 * @param  {SequenceModel}  sequenceModel
 * @return {array<RdpEdit>}  May return RdpEdits in normal or error state
 */
var firstCodonIsMethionineFn = makeFirstCodonIsAaFn('M', types, convertableFromCodons);
var firstCodonIsMethionine = new TransformationFunction(firstCodonIsMethionineFn, requirements, rdpEditType);



requirements = [
  warnIfNotMultipleOf3,
  warnIfStickyEndsPresent,
];
rdpEditType = RdpEdit.types.LAST_STOP_CODONS_REMOVED;
/**
 * @method lastStopCodonsRemovedFn
 * @param  {SequenceModel}  sequenceModel
 * @return {array<RdpEdit>}
 */
var lastStopCodonsRemovedFn = function(sequenceModel) {
  var rdpEdit, frm;
  var length = getLen(sequenceModel);
  var aAsToRemove = [];

  while(true) {
    var newFrom = length - (3 * (aAsToRemove.length + 1));
    newFrom = Math.max(0, newFrom);
    if(newFrom === frm) {
      // We've run out of sequence to search
      break;
    }
    var aAs = sequenceModel.getAAs(newFrom, 3, sequenceModel.STICKY_END_ANY);
    if(aAs.length === 1 && aAs[0] === 'X') {
      aAsToRemove.push(newFrom);
      frm = newFrom;
    } else {
      // aAsToRemove has remained unaltered.
      break;
    }
  }

  if(aAsToRemove.length) {
    var type = RdpEdit.types.LAST_STOP_CODONS_REMOVED;
    var name = 'Will remove stop codons';
    var desc = `Will remove ${aAsToRemove.length} stop codon(s)`;
    var ranges = _.map(aAsToRemove, (frmBase) => {
      return new SequenceRange({
        name: 'Stop codon',
        from: frmBase,
        size: 3,
      });
    });

    // Get a sequence snippet before transform
    var {contextualFrom, contextualTo, sequence} = getContext(sequenceModel, frm, 3 * aAsToRemove.length);

    // var contextualFrom = Math.max(0, frm - CONTEXT_BASE_PAIRS);
    // var numberOfBasesToRemove = 3 * aAsToRemove.length;
    // var numberOfBasesInContextBefore = Math.min(length - contextualFrom, CONTEXT_BASE_PAIRS + numberOfBasesToRemove);
    // var sequence = getSubSeq(sequenceModel, contextualFrom, numberOfBasesInContextBefore);
    // var contextualTo = frm + numberOfBasesToRemove;
    var contextBefore = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});

    // Transform sequence
    _.each(aAsToRemove, (frmBase) => {
      sequenceModel.deleteBases(frmBase, 3, {stickyEndFormat: sequenceModel.STICKY_END_ANY});
    });

    // Remove terminal stop codon
    name = 'Removed stop codons';
    desc = `Removed ${aAsToRemove.length} terminal stop codons`;
    ranges = [];

    // Get a sequence snippet after
    var vals = getContext(sequenceModel, frm, 0);
    var contextAfter = new RdpSequenceFeature({name, desc, ranges, _type: type,
      sequence: vals.sequence,
      contextualFrom: vals.contextualFrom,
      contextualTo: vals.contextualTo,
    });

    rdpEdit = new RdpEdit({type, contextBefore, contextAfter});
  }

  return rdpEdit ? [rdpEdit] : [];
};
var lastStopCodonsRemoved = new TransformationFunction(lastStopCodonsRemovedFn, requirements, rdpEditType);



var lastBaseIsCAaMapConservativeChange = {
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

var lastBaseIsCAaMap = _.extend(_.clone(lastBaseIsCAaMapConservativeChange), {
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


var lastBaseIsGAaMapConservativeChange = {
  // Asparagine -> Glutamine
  "AAT": "CAG",
  "AAC": "CAG",
  // Aspartic acid -> Glutamic acid
  "GAT": "GAG",
  "GAC": "GAG",
  // Phenylalanine -> Leucine
  "TTT": "TTG",
  "TTC": "TTG",
  // Cysteine -> Serine
  "TGT": "TCG",
  "TGC": "TCG",
  // Histidine -> Glutamine
  "CAT": "CAG",
  "CAC": "CAG",
  // Tyrosine -> Tryptophan
  "TAT": "TGG",
  "TAC": "TGG",
  // Isoleucine -> Leucine
  "ATT": "CTG",
  "ATC": "CTG",
  "ATA": "CTG",
};

var lastBaseIsGAaMap = _.extend(_.clone(lastBaseIsGAaMapConservativeChange), {
  // Alanine
  "GCT": "GCG",
  "GCC": "GCG",
  "GCA": "GCG",
  // Leucine
  "TTA": "TTG",
  "CTT": "CTG",
  "CTC": "CTG",
  "CTA": "CTG",
  // Arginine
  "CGT": "CGG",
  "CGC": "CGG",
  "CGA": "CGG",
  "AGA": "AGG",
  // Lysine
  "AAA": "AAG",
  // Methionine
  "ATG": "ATG",
  // Proline
  "CCT": "CCG",
  "CCC": "CCG",
  "CCA": "CCG",
  // Glutamine
  "CAA": "CAG",
  // Serine
  "TCT": "TCG",
  "TCC": "TCG",
  "TCA": "TCG",
  "AGT": "TCG",
  "AGC": "TCG",
  // Glutamic acid
  "GAA": "GAG",
  // Threonine
  "ACT": "ACG",
  "ACC": "ACG",
  "ACA": "ACG",
  // Glycine
  "GGT": "GGG",
  "GGC": "GGG",
  "GGA": "GGG",
  // Tryptophan
  "TGG": "TGG",
  // Valine
  "GTT": "GTG",
  "GTC": "GTG",
  "GTA": "GTG",
  // Stop codons (we never need to convert to a TAG stop codon, if the sequence
  //              is CDS_WITH_STOP, the frame doesn't matter so the G doesn't
  //              need to be part of the last two codons being X', and there are
  //              not other protein coding sequence partTypes which contain a
  //              stop as the last codon)
  // "TGA": "TAG",
  // "TAA": "TAG",
  "TGA": undefined,
  "TAA": undefined,
  "TAG": undefined,
});


var baseMappingData = {
  'C': {
    aaMap: lastBaseIsCAaMap,
    aaConversativeMap: lastBaseIsCAaMapConservativeChange,
    type: RdpEdit.types.LAST_BASE_IS_C,
    type_no_change: RdpEdit.types.LAST_BASE_IS_C_NO_AA_CHANGE,
  },
  'G': {
    aaMap: lastBaseIsGAaMap,
    aaConversativeMap: lastBaseIsGAaMapConservativeChange,
    type: RdpEdit.types.LAST_BASE_IS_G,
    type_no_change: RdpEdit.types.LAST_BASE_IS_G_NO_AA_CHANGE,
  }
};


var ensureLastBaseIsRequirements = [
  warnIfNotMultipleOf3,
  warnIfShortSequence,
  warnIfStickyEndsPresent,
];
/**
 * @method ensureLastBaseIs returns an instance of TransformationFunction
 * @param {String} ensureBase  The base to ensure is present on the forward
 *                             strand as the last base.
 * @return {TransformationFunction} transformFunction
 */
var ensureLastBaseIs = function(ensureBase) {
  var data = baseMappingData[ensureBase];
  if(!data) throw new TypeError(`ensureLastBaseIs does not yet support base of: "${ensureBase}"`);

  var ensureLastBaseIsRdpEditType = data.type;
  var transformFunction = function(sequenceModel) {
    var type = data.type;
    var length = getLen(sequenceModel);
    var rdpEdit;

    // Due to validation from `warnIfNotMultipleOf3` and `warnIfShortSequence`,
    // length will be >= 3 and a multiple of 3.
    let frm = length - 3;
    let lastCodon = getSubSeq(sequenceModel, frm, 3);
    if(lastCodon[2] !== ensureBase) {
      let replacement = data.aaMap[lastCodon];
      // Check to see if amino acid changed
      var aaChanged = !!data.aaConversativeMap[lastCodon];
      if(replacement && !aaChanged) type = data.type_no_change;
      var name = `Last base should be "${ensureBase}"`;
      var desc = '';
      var message;
      var level;

      var ranges = [new SequenceRange({
        name: `Not "${ensureBase}"`,
        from: frm + 2,
        size: 1
      })];

      // Get a sequence snippet before
      var {contextualFrom, contextualTo, sequence} = getContext(sequenceModel, frm, 3);
      var contextBefore = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});

      var rangeName;
      if(replacement) {
        sequenceModel.changeBases(frm, replacement, {stickyEndFormat: sequenceModel.STICKY_END_ANY});

        name = `Last base changed to "${ensureBase}".`;
        desc = `The last base of sequence must be "${ensureBase}".  Codon has been automatically transform from "${lastCodon}" to "${replacement}".`;
        rangeName = `Changed to "${ensureBase}"`;
      } else {
        // This should never be reached if the `transformSequenceForRdp` is
        // called as all the stop codons at the end will already have been
        // removed
        name = `Last base not "${ensureBase}"`;
        rangeName = `Not "${ensureBase}"`;
        desc = message = `The last base of sequence must be "${ensureBase}" but there is no replacement for the codon: "${lastCodon}".`;
        level = RdpEdit.levels.ERROR;
      }
      ranges = [new SequenceRange({
        name: rangeName,
        from: frm + 2,
        size: 1
      })];

      sequence = getContext(sequenceModel, frm, 3).sequence;
      var contextAfter = new RdpSequenceFeature({name, desc, ranges, _type: type, sequence, contextualFrom, contextualTo});

      rdpEdit = new RdpEdit({type, contextBefore, contextAfter, message, level});
    }
    return rdpEdit ? [rdpEdit] : [];
  };

  return new TransformationFunction(transformFunction, ensureLastBaseIsRequirements, ensureLastBaseIsRdpEditType);
};



requirements = [
  warnIfStickyEndsPresent,
  warnIfShortSequence,
];
rdpEditType = RdpEdit.types.FIRST_CODON_IS_STOP;
types = {
  ADDED: RdpEdit.types.FIRST_CODON_IS_STOP_ADDED,
};
/**
 * @function  firstCodonIsStopFn
 * @param  {SequenceModel}  sequenceModel
 * @return {array<RdpEdit>}  May return RdpEdits in normal or error state
 */
var firstCodonIsStopFn = makeFirstCodonIsAaFn('X', types, []);
var firstCodonIsStop = new TransformationFunction(firstCodonIsStopFn, requirements, rdpEditType);



requirements = [
  warnIfStickyEndsPresent,
  warnIfShortSequence,
];
rdpEditType = RdpEdit.types.LAST_CODON_IS_STOP;
types = {
  ADDED: RdpEdit.types.LAST_CODON_IS_STOP_ADDED,
};
/**
 * @function  lastCodonIsStopFn
 * @param  {SequenceModel}  sequenceModel
 * @return {array<RdpEdit>}  May return RdpEdits in normal or error state
 */
var lastCodonIsStopFn = makeLastCodonIsAaFn('X', types, []);
var lastCodonIsStop = new TransformationFunction(lastCodonIsStopFn, requirements, rdpEditType);



requirements = [
  warnIfNotMultipleOf3,
  warnIfStickyEndsPresent
];
rdpEditType = RdpEdit.types.EARLY_STOP_CODON;
/**
 * @function  warnIfEarlyStopCodonsFn
 * @param  {SequenceModel} sequenceModel
 * @return {array<RdpEdit>}
 */
var warnIfEarlyStopCodonsFn = function(sequenceModel) {
  var type = RdpEdit.types.EARLY_STOP_CODON;

  var aAs = sequenceModel.getAAs(0, getLen(sequenceModel), sequenceModel.STICKY_END_ANY);
  var startOfCurrentRunOfStops;
  var rdpWarningsOfEarlyStopCodons = _.reduce(aAs, (memo, aa, index) => {
    if(aa === 'X') {
      // This allows us to discount adjacent stop codons at the end.  Useful for
      // not warning about stop codons present in CDS_WITH_STOP RDP parts.
      if(startOfCurrentRunOfStops === undefined) {
        startOfCurrentRunOfStops = index;
      }

      var level = RdpEdit.levels.WARN;
      var position = index * 3;
      var name = `Stop codon`;
      var message = `Early stop codon at base ${position+1}-${position+3}.`;
      var ranges = [new SequenceRange({
        name: name,
        from: position,
        size: 3
      })];
      var {contextualFrom, contextualTo, sequence} = getContext(sequenceModel, position, 3);
      var contextBefore = new RdpSequenceFeature({name, desc: message, ranges, _type: type, sequence, contextualFrom, contextualTo});
      var rdpEdit = new RdpEdit({type, contextBefore, level});
      memo.push(rdpEdit);
    } else {
      startOfCurrentRunOfStops = undefined;
    }
    return memo;
  }, []);

  if(startOfCurrentRunOfStops) {
    var stopsToRemove = aAs.length - startOfCurrentRunOfStops;
    for (var i = 0; i < stopsToRemove; ++i) {
      rdpWarningsOfEarlyStopCodons.pop();
    }
  }

  return rdpWarningsOfEarlyStopCodons;
};
var warnIfEarlyStopCodons = new TransformationFunction(warnIfEarlyStopCodonsFn, requirements, rdpEditType);



export default {
  firstCodonIsMethionine,
  lastStopCodonsRemoved,
  ensureLastBaseIs,
  firstCodonIsStop,
  lastCodonIsStop,
  warnIfEarlyStopCodons,
};
