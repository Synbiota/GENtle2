import Sequence from '../../../sequence/models/sequence';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import _ from 'underscore';

const INCOMPATIBLE_STICKY_ENDS = 'INCOMPATIBLE_STICKY_ENDS';
const CANNOT_CIRCULARIZE = 'CANNOT_CIRCULARIZE';

var detectAnchor = function(sequence) {
  var stickyEnds = sequence.getStickyEnds();
  return stickyEnds && stickyEnds.start && 
    stickyEnds.start.name.toLowerCase() === 'da20';
};

var detectCap = function(sequence) {
  var stickyEnds = sequence.getStickyEnds();
  return stickyEnds && stickyEnds.end && 
    stickyEnds.end.name.toLowerCase() === 'dt20';
};

export default class WipCircuit extends Sequence {
  constructor(attributes, ...other) {
    var wipCircuit = 'wip_circuit';
    if(attributes._type && attributes._type !== wipCircuit) {
      throw new TypeError(`WipCircuit expected _type of "${wipCircuit}" but was "${attributes._type}"`);
    }
    attributes._type = wipCircuit;
    super(attributes, ...other);
    this._initAvailableAnchorsAndCaps();
    this.diagnoseSequence();
  }

  defaults() {
    return _.extend(super.defaults(), {
      availableSequences: [],
      availableAnchors: [],
      availableCaps: [],
      sequences: [],
      isCircular: true,
      errors: []
    });
  }

  get requiredFields() {
    return _.without(super.requiredFields, 'sequence');
  }

  get optionalFields() {
    return super.optionalFields.concat(
      'errors'
    );
  }

  get nonEnumerableFields() {
    return super.nonEnumerableFields.concat(
      'errors'
    );
  }

  /**
   * Moves anchors and caps from the availableSequences array to the available Anchors and availableCaps arrays
   * @method  initAvailableAnchorsAndCaps
   * @return {undefined} 
   */
  _initAvailableAnchorsAndCaps() {
    var availableSequences = this.get('availableSequences');

    var moveSequence = function(targetArray) {
      return function(sequence) {
        var index = availableSequences.indexOf(sequence);
        availableSequences.splice(index, 1);
        targetArray.push(sequence);
      };
    };

    _.each(
      _.filter(availableSequences, detectAnchor), 
      moveSequence(this.get('availableAnchors'))
    );

    _.each(
      _.filter(availableSequences, detectCap), 
      moveSequence(this.get('availableCaps'))
    );
  }


  filterAvailableSequencesByStickyEnds(stickyEndNames, inverse = false) {
    if(!_.isArray(stickyEndNames)) stickyEndNames = [stickyEndNames];

    return () => {
      return _.filter(this.get('availableSequences'), function(sequence) {
        var stickyEnds = sequence.getStickyEnds();
        if(!stickyEnds) return false;
        var sequenceStickyEndName = `${stickyEnds.start.name}-${stickyEnds.end.name}`.toLowerCase();
        var hasMatchingStickyEnds = _.some(stickyEndNames, (stickyEndName) => {
          return  sequenceStickyEndName === stickyEndName;
        });
        return inverse ? !hasMatchingStickyEnds : hasMatchingStickyEnds;
      });
    };
  }

  addAvailableSequences(sequences) {
    var availableSequences = this.get('availableSequences');

    var existingSequences = availableSequences.concat(
      this.get('availableAnchors'),
      this.get('availableCaps')
    );

    var newSequences = _.reject(
      _.map(sequences, sequence => new TemporarySequence(sequence)), 
      function(sequence) {
        return _.some(existingSequences, function(existingSequence) {
          return existingSequence.getSequence() === sequence.getSequence();
        });
      }
    );

    availableSequences.push(...newSequences);
    this._initAvailableAnchorsAndCaps();
    this.throttledSave();
  }

  insertSequence(beforeIndex, sequence) {
    this.get('sequences').splice(beforeIndex, 0, sequence);
    this.diagnoseSequence();
  }

  removeSequenceAtIndex(index) {
    this.get('sequences').splice(index, 1);
    this.diagnoseSequence();
  }

  diagnoseSequence() {
    var output = [];
    var sequences = this.get('sequences');

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
      let length = sequences.length;
      let firstSequence = sequences[0];
      let lastSequence = sequences[length-1];
      let anchor = this.get('anchor');
      let cap = this.get('cap');

      if(sequences.length > 0 && anchor && cap && !cap.stickyEndConnects(anchor)) {
        output.push({
          type: CANNOT_CIRCULARIZE,
          index: 0
        });
      }

      if(anchor && firstSequence && !anchor.stickyEndConnects(firstSequence)) {
        output.push({
          type: INCOMPATIBLE_STICKY_ENDS,
          index: 0
        });
      }

      if(cap && lastSequence && !lastSequence.stickyEndConnects(cap)) {
        output.push({
          type: INCOMPATIBLE_STICKY_ENDS,
          index: length
        });
      }
    }

    this.set('errors', output);
    this.throttledSave();
  }




}

WipCircuit.registerAssociation(TemporarySequence, 'availableSequence', true);
WipCircuit.registerAssociation(TemporarySequence, 'availableCap', true);
WipCircuit.registerAssociation(TemporarySequence, 'availableAnchor', true);
WipCircuit.registerAssociation(TemporarySequence, 'cap', false);
WipCircuit.registerAssociation(TemporarySequence, 'anchor', false);
WipCircuit.registerAssociation(TemporarySequence, 'sequence', true);

WipCircuit.CANNOT_CIRCULARIZE = CANNOT_CIRCULARIZE;
WipCircuit.INCOMPATIBLE_STICKY_ENDS = INCOMPATIBLE_STICKY_ENDS;