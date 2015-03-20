

var defaultSequencingPrimerOptions = function(options={}) {
  _.defaults(options, {
    // If set to true, returns the primer that best matches the specified
    // requirements if there is not one that matches exactly.
    returnNearestIfNotBest: false,
    // Set to false if we want to find a primer from the 5' end
    findFrom3PrimeEnd: true,
    // Set to false when we have to find a primer from the start.
    allowShift: true,
    reverseSequence: false,
    maxPolyN: 5,
    minPrimerLength: 20,
    maxPrimerLength: 30,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 63.5,
    meltingTemperatureTolerance: 1.5,
    useIDT: true,
    // If we're within this many degrees of target melting temperature window,
    // chances are we'll be close enough
    IDTmeltingTemperatureProximity: 0.5,
  });
  return options;
};


var defaultPCRPrimerOptions = function(options={}) {
  _.defaults(options, {
    // If set to true, returns the primer that best matches the specified
    // requirements if there is not one that matches exactly.
    returnNearestIfNotBest: true,
    // Set to false as we want to find a primer from the 5' end
    findFrom3PrimeEnd: false,
    // Set to false when we have to find a primer from the start.
    allowShift: false,
    reverseSequence: false,
    maxPolyN: 3,
    minPrimerLength: 20,
    maxPrimerLength: 30,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 60,
    meltingTemperatureTolerance: 1.5,
    useIDT: true,
    // If we're within this many degrees of target melting temperature window,
    // chances are we'll be close enough
    IDTmeltingTemperatureProximity: 0.5,
  });
  return options;
};


export {
  defaultSequencingPrimerOptions,
  defaultPCRPrimerOptions
};
