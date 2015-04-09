import _ from 'underscore';


var filterPrimerOptions = function(opts) {
  return _.pick(opts, ...[
    // If set to true, returns the primer that best matches the specified
    // requirements if there is not one that matches exactly.
    'returnNearestIfNotBest',
    // Set to false if we want to find a primer from the 5' end
    'findFrom3PrimeEnd',
    // Set to false when we have to find a primer from the start.
    'allowShift',
    'maxPolyN',
    'minPrimerLength',
    'maxPrimerLength',
    'targetGcContent',
    'targetGcContentTolerance',
    'targetMeltingTemperature',
    'meltingTemperatureTolerance',
    'useIDT',
    // If we're within this many degrees of target melting temperature window,
    // chances are we'll be close enough
    'IDTmeltingTemperatureProximity',
  ]);
};


var defaultSequencingPrimerOptions = function(options={}) {
  _.defaults(options, {
    returnNearestIfNotBest: false,
    findFrom3PrimeEnd: true,
    allowShift: true,
    maxPolyN: 5,
    minPrimerLength: 20,
    maxPrimerLength: 30,
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
  _.defaults(options, {
    returnNearestIfNotBest: true,
    findFrom3PrimeEnd: false,
    allowShift: false,
    maxPolyN: 3,
    minPrimerLength: 20,
    maxPrimerLength: 30,
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
  filterPrimerOptions,
  defaultSequencingPrimerOptions,
  defaultPCRPrimerOptions
};
