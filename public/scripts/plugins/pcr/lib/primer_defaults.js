

var defaultSequencingPrimerOptions = function(options={}) {
  _.defaults(options, {
    // -N for sequencing primers, as they have their "universal primers" in
    // their plasmid
    firstPrimerPosition: 0,
    lastReversePrimerPosition: 0,

    maxPolyN: 5,
    minPrimerLength: 20,
    maxPrimerLength: 30,
    targetGcContent: 0.5,
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
    maxPolyN: 10000,
    minPrimerLength: 10,
    maxPrimerLength: 40,
    targetGcContent: 0.5,
    targetGcContentTolerance: 0.1,
    targetMeltingTemperature: 68,
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
