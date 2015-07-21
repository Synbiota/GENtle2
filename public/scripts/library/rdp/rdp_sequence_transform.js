import _ from 'underscore';
import RdpEdit from './rdp_edit';
import {
  methionineStartCodon,
  noTerminalStopCodons,
  ensureLastBaseIs,
  warnIfEarlyStopCodons,
} from './sequence_transform';



var calculateTransformationFunctionInstances = function(sequenceModel) {
  var transforms = [];
  var partType = sequenceModel.get('partType');
  var desiredStickyEnds = sequenceModel.get('desiredStickyEnds');

  if(sequenceModel.isProteinCoding) {
    if(desiredStickyEnds.start.name === 'X') {
      transforms = [
        methionineStartCodon
      ];
    }
    transforms.push(noTerminalStopCodons);
  }

  var lastBaseMustBe = desiredStickyEnds.end.sequence.substr(0, 1);
  transforms.push(ensureLastBaseIs(lastBaseMustBe));

  if(sequenceModel.isProteinCoding) {
    transforms.push(warnIfEarlyStopCodons);
  }

  return transforms;
};



var checkForFatalErrors = function(sequenceModel, transformationFunctionInstances, returnAllErrors) {
  var fatalErrorRdpEdits = [];
  _.each(transformationFunctionInstances, (funcInstance) => {
    var rdpEdits = funcInstance.check(sequenceModel);
    _.each(rdpEdits, (rdpEdit) => {
      var errorTypeNotAlreadyPresent = !_.some(fatalErrorRdpEdits, (existingRdpEdit) => existingRdpEdit.type === rdpEdit.type);
      if(returnAllErrors || errorTypeNotAlreadyPresent) {
        // We are not deduplicating errors or there is not already an error
        // of the same type.
        rdpEdit.level = RdpEdit.levels.ERROR;
        fatalErrorRdpEdits.push(rdpEdit);
      }
    });
  });

  return fatalErrorRdpEdits;
};



/**
 * @function  transformSequenceForRdp  Should not be called directly.  Instead
 *            use the sequenceModel's transformSequenceForRdp
 * @param  {SequenceModel}  sequenceModel
 * @return {Array<RdpEdit>}
 */
var transformSequenceForRdp = function(sequenceModel, returnAllErrors=false) {
  var transformationFunctionsInstances = calculateTransformationFunctionInstances(sequenceModel);

  var fatalErrorRdpEdits = checkForFatalErrors(sequenceModel, transformationFunctionsInstances, returnAllErrors);
  // If there are any warnings (which would result in errors being thrown by the
  // transform functions) then return these straight away.
  if(fatalErrorRdpEdits.length) return fatalErrorRdpEdits;

  var rdpEdits = [];
  _.each(transformationFunctionsInstances, (transformationFunctionInstance) => {
    var moreRdpEdits = transformationFunctionInstance.process(sequenceModel);
    if(moreRdpEdits.length) rdpEdits = rdpEdits.concat(moreRdpEdits);
  });

  return rdpEdits;
};


export default {
  transformSequenceForRdp,
  // exposed for testing
  calculateTransformationFunctionInstances,
};
