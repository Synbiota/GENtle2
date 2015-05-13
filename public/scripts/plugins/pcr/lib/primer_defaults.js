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
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 63.5,
    meltingTemperatureTolerance: 1.5,
    useIDT: true,
    IDTmeltingTemperatureProximity: 0.5,
  });
  return options;
};


var defaultPCRPrimerOptions = function(options={}) {
  var maxPrimerLength = 30;
  _.defaults(options, {
    returnNearestIfNotBest: true,
    findFrom3PrimeEnd: false,
    allowShift: false,
    maxPolyN: 3,
    minPrimerLength: 20,
    maxPrimerLength: maxPrimerLength,
    maxSearchSpace: maxPrimerLength,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 60,
    meltingTemperatureTolerance: 1.5,
    useIDT: true,
    IDTmeltingTemperatureProximity: 0.5,
  });
  return options;
};


export {
  defaultSequencingPrimerOptions,
  defaultPCRPrimerOptions
};
