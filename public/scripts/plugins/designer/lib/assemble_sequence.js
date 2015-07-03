import SequenceModel from '../../../sequence/models/sequence';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import {getPcrProductsFromSequence} from '../../pcr/lib/utils';
import _ from 'underscore';

var INCOMPATIBLE_STICKY_ENDS = 'INCOMPATIBLE_STICKY_ENDS';
var CANNOT_CIRCULARIZE = 'CANNOT_CIRCULARIZE';

class AssembleSequenceModel {
  constructor (sequence) {
    this.model = sequence;
    // Set up proxy methods to underlying backbone model.
    var methodNames = ['get', 'set'];
    _.each(methodNames, (methodName) => {
      this._proxy(methodName);
    });

    this._setupSequenceForAssembling();
  }

  _setupSequenceForAssembling () {
    this.sequences = this._parseAssembleSequences();
    // Dictionary of sequence ids and the positions they can be inserted into.
    this.insertabilityState = {};
    this.updateInsertabilityState();
  }

  _parseAssembleSequences () {
    var assembleSequencesJSON = this.get('meta.designer.assembleSequences') || '[]';
    var attributesOfSequences = JSON.parse(assembleSequencesJSON);
    return _.map(attributesOfSequences, (sequenceAttributes) => new SequenceModel(sequenceAttributes));
  }

  addSequences(sequences) {
    // sequences is expected to be an array of POJO
    var existingSequences = this.model.get('meta.designer.sequences');
    var addableSequences = _.reject(sequences, function(sequence) {
      return _.some(existingSequences, function(existingSequence) {
        return existingSequence.sequence === sequence.sequence;
      });
    });

    this.model.set('meta.designer.sequences', existingSequences.concat(addableSequences));
    this.model.save();
    this.updateInsertabilityState();
  }

  updateInsertabilityState () {
    // 
    // this.allSequences = Gentle.sequences.without(this.model);
    this.allSequences = _.map(
      _.sortBy(this.model.get('meta.designer.sequences'), sequence => sequence.shortName || sequence.name), 
      (sequence) => new TemporarySequence(sequence)
    );
    
    // Add any PCR product sequences within the model
    this.allSequences = _.reduce(this.allSequences, (memo, sequence) => {
      var pcrProducts = getPcrProductsFromSequence(sequence);
      return memo.concat(pcrProducts);
    }, this.allSequences);
    [this.availableSequences, this.lackStickyEndSequences] = _.partition(this.allSequences, (seq) => seq.hasBothStickyEnds());

    _.each(this.availableSequences, (availableSequence) => {
      var acceptableDropIndices = [];
      _.each(_.range(this.sequences.length+1), (index) => {
        if(this._canInsert(availableSequence, index)) {
          acceptableDropIndices.push(index);
        }
      });
      this.insertabilityState[availableSequence.get('id')] = acceptableDropIndices;
    });

    [this.insertableSequences, this.incompatibleSequences] = _.partition(this.availableSequences, _.bind(this.isInsertable, this));
  }

  // Proxy to Backbone model
  _proxy (methodName) {
    this[methodName] = (...args) => {
      var returnValue = this.model[methodName](...args);
      return (returnValue === this.model) ? this : returnValue;
    };
  }

  throttledSave () {
    if(!this.get('sequence')) {
      this.model.set('meta.designer.assembleSequences', JSON.stringify(this.sequences));
    }
    return this.model.throttledSave();
  }
  
  isInsertable (sequence) {
    var state = this.insertabilityState[sequence.get('id')];
    return state && state.length > 0;
  }

  _canInsert (sequence, beforeIndex, previousIndex) {
    var output = true;

    if(sequence) {
      if(beforeIndex > 0) {
        output = output && this.sequences[beforeIndex-1].stickyEndConnects(sequence);
      }

      if(beforeIndex < this.sequences.length) {
        output = output && sequence.stickyEndConnects(this.sequences[beforeIndex]);
      }

      if(previousIndex && previousIndex > 0 && previousIndex < this.sequences.length -1) {
        output = output && this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]);
      }
    }

    return output;
  }

  canTrash (previousIndex) {
    return previousIndex <= 0 || previousIndex >= this.sequences.length -1 ||
        this.sequences[previousIndex - 1].stickyEndConnects(this.sequences[previousIndex + 1]);
  }

  insertSequence (beforeIndex, sequence) {
    this.sequences.splice(beforeIndex, 0, sequence);
  }

  moveSequence (oldIndex, newIndex) {
    if(oldIndex === newIndex) return;
    if(oldIndex < newIndex) newIndex++;
    var sequence = this.sequences[oldIndex];
    this.sequences[oldIndex] = null;
    this.sequences.splice(newIndex, 0, sequence);
    this.sequences = _.compact(this.sequences);
  }

  removeSequenceAtIndex (index) {
    this.sequences.splice(index, 1);
  }

  incompatibleStickyEnds () {
    var incompatibleEnds = false;
    if(this.get('isCircular') && this.sequences.length > 0) {
      var lastSequence = this.sequences[this.sequences.length-1];
      incompatibleEnds = !lastSequence.stickyEndConnects(this.sequences[0]);
    }
    return incompatibleEnds;
  }

  assembleSequences () {
    var finalSequence = SequenceModel.concatenateSequences(this.sequences, this.model.get('isCircular'));

    this.set({
      sequence: finalSequence.getSequence(),
      features: finalSequence.getFeatures(),
      stickyEnds: finalSequence.getStickyEnds(false),
      meta: undefined
    });

    return this;
  }

  processSequences () {
    return _.map(this.sequences, function(sequence, i) {
      var name = sequence.get('shortName');
      var type;

      if(!name) name = sequence.get('name');

      return {
        name: name,
        type: type,
        partType: sequence.get('partType') || '__default',
        index: i,
        id: sequence.get('id')
      };
    });
  }

  diagnoseSequence() {
    var output = [];
    var sequences = this.sequences;

    _.each(sequences, (sequence, i) => {
      if(i > 0) {
        var previousSequence = sequences[i-1];
        if(!previousSequence.stickyEndConnects(sequence)) {
          output.push({
            type: INCOMPATIBLE_STICKY_ENDS,
            index: i
          });
        }
      }
    });

    if(this.get('isCircular')) {
      let firstSequence = sequences[0];
      let lastSequence = sequences[sequences.length-1];
      if(!lastSequence.stickyEndConnects(firstSequence)) {
        output.push({
          type: CANNOT_CIRCULARIZE,
          index: 0
        });
      }
    }

    return output;
  }
}

AssembleSequenceModel.INCOMPATIBLE_STICKY_ENDS = INCOMPATIBLE_STICKY_ENDS;
AssembleSequenceModel.CANNOT_CIRCULARIZE = CANNOT_CIRCULARIZE;


export default AssembleSequenceModel;
