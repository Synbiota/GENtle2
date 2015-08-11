import _ from 'underscore';
import RdpEdit from './rdp_edit';
import WipRdpReadyAbstractSequence from './wip_rdp_ready_abstract_sequence';
import {
  firstCodonIsMethionine,
  lastStopCodonsRemoved,
  ensureLastBaseIs,
  firstCodonIsStop,
  lastCodonIsStop,
  warnIfEarlyStopCodons,
} from './sequence_transform';



var calculateTransformationFunctionInstances = function(sequenceModel) {
  if(!(sequenceModel instanceof WipRdpReadyAbstractSequence)) {
    throw new TypeError(`Expected instance of class derived from WipRdpReadyAbstractSequence but got: ${sequenceModel.constructor.name}`);
  }
  var transforms = [];
  var desiredStickyEnds = sequenceModel.get('desiredStickyEnds');

  if(sequenceModel.isProteinCoding) {
    if(desiredStickyEnds.start.name === 'X') {
      transforms.push(firstCodonIsMethionine);
    }

    if(sequenceModel.isCdsWithStop) {
      transforms.push(lastCodonIsStop);
    } else {
      transforms.push(lastStopCodonsRemoved);

      var lastBaseMustBe = desiredStickyEnds.end.sequence.substr(0, 1);
      transforms.push(ensureLastBaseIs(lastBaseMustBe));
    }

    transforms.push(warnIfEarlyStopCodons);
  } else if(sequenceModel.isRBS || sequenceModel.isTerminator) {
    transforms.push(firstCodonIsStop);
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
