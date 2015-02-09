import _ from 'underscore.mixed';
import SequenceTransforms from './sequence_transforms';

var compose = _.compose;
var partial = _.partial;

var molecularWeights = {
  'A': 313.209,
  'C': 289.184,
  'G': 329.208,
  'T': 304.196
}

var getStringSequence = function(sequence) {
  if(_.isString(sequence)) {
    return sequence;
  } else {
    return sequence.get('sequence');
  }
};

var gcContent = function(sequence) {
  sequence = getStringSequence(sequence);
  return _.reduce(sequence, function(memo, base) {
    return /[CG]/.test(base) ? memo + 1 : memo;
  }, 0) / sequence.length;
};

var saltCorrection = function(sequence, naPlusConcentration, mg2PlusConcentration) {
  sequence = getStringSequence(sequence);
  var concentration = naPlusConcentration + 140 * mg2PlusConcentration;
  return 0.368 * (sequence.length - 1) * Math.log(concentration);
};

// Following data from
// http://www.ncbi.nlm.nih.gov/pmc/articles/PMC19045/table/T2/

// cal/K.mol
var gasConstant = 1.987;

// 5'–3'
// Enthalpy is in kcal/mol
// Entropy is in cal/(mol·K)
// From http://www.ncbi.nlm.nih.gov/pmc/articles/PMC19045/table/T2/
var nearestNeighborsData = {
  enthalpy: {
    AA: -7.9,
    AC: -8.4,
    AG: -7.8,
    AT: -7.2,
    CA: -8.5,
    CC: -8.0,
    CG: -10.6,
    CT: -7.8,
    GA: -8.2,
    GC: -9.8,
    GG: -8.0,
    GT: -8.4,
    TA: -7.2,
    TC: -8.2,
    TG: -8.5,
    TT: -7.9
  },
  entropy: {
    AA: -22.2,
    AC: -22.4,
    AG: -21.0,
    AT: -20.4,
    CA: -22.7,
    CC: -19.9,
    CG: -27.2,
    CT: -21.0,
    GA: -22.2,
    GC: -24.4,
    GG: -19.9,
    GT: -22.4,
    TA: -21.3,
    TC: -22.2,
    TG: -22.7,
    TT: -22.2
  }
};

var terminalCorrectionData = {
  enthalpy: {
    A: 0.1,
    C: 2.3
  },
  entropy: {
    A: -2.8,
    C: 4.1
  }
};

var getThermodynamicsData = function(data, sequence) {
  return data[sequence] || data[SequenceTransforms.toReverseComplements(sequence)];
};

var nearestNeighborsCalculator = function(dataType, sequence) {
  sequence = getStringSequence(sequence);
  return _.reduce(sequence, function(memo, base, i) {
    if(i === 0) {
      memo += getThermodynamicsData(terminalCorrectionData[dataType], base);
    }

    if(i < sequence.length-1) {
      memo += getThermodynamicsData(nearestNeighborsData[dataType], base + sequence[i+1]);
    } else {
      memo += getThermodynamicsData(terminalCorrectionData[dataType], base);
    }

    return memo;
  }, 0);
};


/**
 * We use the [Nearest neighbor method](https://en.wikipedia.org/wiki/Nucleic_acid_thermodynamics#Nearest-neighbor_method)  to approximate the change in
 * enthalpy of a sequence
 * https://en.wikipedia.org/wiki/Nucleic_acid_thermodynamics#Nearest-neighbor_method
 * @function deltaEnthalpy
 * @param  {String or Sequence object} sequence Sequence as string
 * @return {Number} Returns ΔH for a given sequence
 */
var deltaEnthalpy = partial(nearestNeighborsCalculator, 'enthalpy');

/**
 * We use the [Nearest neighbor method](https://en.wikipedia.org/wiki/Nucleic_acid_thermodynamics#Nearest-neighbor_method) to approximate the change in
 * entropy of a sequence
 * https://en.wikipedia.org/wiki/Nucleic_acid_thermodynamics#Nearest-neighbor_method
 * @function deltaEntropy
 * @param  {String or Sequence object} sequence Sequence as string
 * @return {Number} Returns ΔS for a given sequence
 */
var deltaEntropy = partial(nearestNeighborsCalculator, 'entropy');

/**
 * Calculates the change in entropy of a sequence corrected for the presence of
 * salt in the solution
 *
 * http://www.ncbi.nlm.nih.gov/pmc/articles/PMC19045/
 * @function correctedDeltaEntropy
 * @param  {String or Sequence object} sequence Sequence as string
 * @param {Number in mol, optional} naPlusConcentration concentration in Na+
 * @return {Number} Returns the corrected ΔS for a given sequence
 */
var correctedDeltaEntropy = function(sequence, naPlusConcentration, mg2PlusConcentration) {
  return deltaEntropy(sequence) + saltCorrection(sequence, naPlusConcentration, mg2PlusConcentration);
};


/**
 * Calculates the melting temperature of a sequence
 *
 * @param {String or Sequence object} sequence
 * @param {Number (mol)} concentration Concentration of the sequence. Defaults
 *                       to 50µmol
 * @return {Number (Celsius)} melting temperature
 */
var meltingTemperature = function(sequence,
                                  concentration = 50e-6,
                                  naPlusConcentration = 50e-3,
                                  mg2PlusConcentration = 0) {
  return 1000 * deltaEnthalpy(sequence) / (
      correctedDeltaEntropy(sequence, naPlusConcentration, mg2PlusConcentration) +
      gasConstant * Math.log(concentration/2)
    ) - 273.15;
};

var molecularWeight = function(sequence) {

  sequence = getStringSequence(sequence)
  return _.reduce(sequence, function(memo, base){
    return memo + molecularWeights[base]
  }, 0);

}

export default {
  deltaEnthalpy: deltaEnthalpy,
  deltaEntropy: deltaEntropy,
  saltCorrection: saltCorrection,
  correctedDeltaEntropy: correctedDeltaEntropy,
  meltingTemperature: meltingTemperature,
  gcContent: gcContent,
  molecularWeight: molecularWeight,
};
