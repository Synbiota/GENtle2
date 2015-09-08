import _ from 'underscore';


var defaultSequencingPrimerOptions = function(options={}) {
  _.defaults(options, {
    returnNearestIfNotBest: false,
    findFrom3PrimeEnd: true,
    allowShift: true,
    maxPolyN: 5,
    minPrimerLength: 20,
    maxPrimerLength: 30,
    maxSearchSpace: 500,
    // Maximum size of DNA sequence that will become useful products.
    maxSequencedSize: 500,
    // The number of bases after the end of a sequencing primer which are
    // garbage (due to current limitations in Sanger sequencing techniques).
    garbageSequenceDna: 80,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 63.5,
    meltingTemperatureTolerance: 1.5,
    useIDT: true,
    IDTmeltingTemperatureProximity: 0.5,
    checkSelfDimers: true,
    selfDimersRejectionThreshold: 4
  });
  return options;
};


var defaultPCRPrimerOptions = function(options={}) {
  // Max primer length set to 91 as TAT[AT]x44 is melting temp is 67.2 (i.e.
  // just within target Tm of 68.0 +/- 1.0)
  var maxPrimerLength = options.maxPrimerLength || 91;
  _.defaults(options, {
    returnNearestIfNotBest: true,
    findFrom3PrimeEnd: false,
    allowShift: false,
    maxPolyN: maxPrimerLength,
    // minPrimerLength set to 12 due to [GC]x6 having a Tm of 66.8, and the
    // longer sequence having a Tm of 71
    minPrimerLength: 12,
    maxPrimerLength: maxPrimerLength,
    maxSearchSpace: maxPrimerLength,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.5,
    targetMeltingTemperature: 68.0,
    meltingTemperatureTolerance: 1.0,
    useIDT: true,
    IDTmeltingTemperatureProximity: 0.5,
  });
  return options;
};


export {
  defaultSequencingPrimerOptions,
  defaultPCRPrimerOptions
};
