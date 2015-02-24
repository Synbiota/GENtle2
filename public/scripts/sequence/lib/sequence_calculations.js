import _ from 'underscore';
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
    A: 2.3,
    C: 0.1
  },
  entropy: {
    C: -2.8,
    A: 4.1
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


var complexSaltCorrection = function(sequence, naPlusConcentration, mg2PlusConcentration) {
  sequence = getStringSequence(sequence);

};

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

var meltingTemperature2 = function( sequence,
                                    concentration = 0.25e-6,
                                    naPlusConcentration = 50e-3,
                                    mg2PlusConcentration = 2e-3) {

  var basicMeltingTemperature = 1000 * deltaEnthalpy(sequence) / (
      deltaEntropy(sequence) +
      gasConstant * Math.log(concentration/2)
    );


  var R = Math.sqrt(mg2PlusConcentration) / naPlusConcentration;

  var logNaPlus = Math.log(naPlusConcentration);
  var logMg2Plus = Math.log(mg2PlusConcentration);

  var coeffA = function() {
    return R >= 6 ? 3.92 : 
      3.92 * (0.843 - 0.352 * Math.sqrt(naPlusConcentration) * logNaPlus);
  };

  var coeffD = function() {
    return R >= 6 ? 1.42 : 
      1.42 * (1.279 - 4.03e-3 * logNaPlus - 8.03e-3 * Math.pow(logNaPlus, 2));
  };

  var coeffG = function() {
    return R >= 6 ? 8.31 : 
      8.31 * (0.486 - 0.258 * logNaPlus + 5.25e-3 * Math.pow(logNaPlus, 3));
  };

  var correction;

  if(R >= 0.22) {
    correction = 1e-5 * (
      coeffA() - 
      0.911 * logMg2Plus + 
      gcContent(sequence) * (6.26 + coeffD() * logMg2Plus) + 
      1 / (2 * (sequence.length - 1)) * (
        -48.2 + 52.5 * logMg2Plus + 
        coeffG() * Math.pow(logMg2Plus, 2)
      )
    );
  } else {
    correction = 1e-5 * (
      (4.29 * gcContent(sequence) - 3.95) * logNaPlus + 
      0.940 * Math.pow(logNaPlus, 2)
    );
  }

  return 1/(1/basicMeltingTemperature + correction) - 273.15;
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
                                  concentration = 0.25e-6,
                                  naPlusConcentration = 50e-3,
                                  mg2PlusConcentration = 2e-3) {
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

window.calc = {
  deltaEnthalpy: deltaEnthalpy,
  deltaEntropy: deltaEntropy,
  saltCorrection: saltCorrection,
  correctedDeltaEntropy: correctedDeltaEntropy,
  meltingTemperature: meltingTemperature,
  meltingTemperature2: meltingTemperature2,
  gcContent: gcContent,
  molecularWeight: molecularWeight
};

export default {
  deltaEnthalpy: deltaEnthalpy,
  deltaEntropy: deltaEntropy,
  saltCorrection: saltCorrection,
  correctedDeltaEntropy: correctedDeltaEntropy,
  meltingTemperature: meltingTemperature2,
  meltingTemperature1: meltingTemperature,
  gcContent: gcContent,
  molecularWeight: molecularWeight,
  nearestNeighborsCalculator: nearestNeighborsCalculator
};
