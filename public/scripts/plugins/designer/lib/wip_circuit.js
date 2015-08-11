import Sequence from '../../../sequence/models/sequence';
import TemporarySequence from '../../../sequence/models/temporary_sequence';
import preloadedAnchorsAndCaps from './anchors_and_caps.json';
import _ from 'underscore';
import Gentle from 'gentle';

const INCOMPATIBLE_STICKY_ENDS = 'INCOMPATIBLE_STICKY_ENDS';
const CANNOT_CIRCULARIZE = 'CANNOT_CIRCULARIZE';
const MISSING_CAP = 'MISSING_CAP';
const MISSING_ANCHOR = 'MISSING_ANCHOR';

const MISSING_EITHER_STICKY_END = 'MISSING_EITHER_STICKY_END';

const currentUserKey = 'designer.availableSequences';

var detectAnchor = function(sequence) {
  var stickyEnds = sequence.getStickyEnds();
  return stickyEnds && stickyEnds.start && /^da(20|18)$/i.test(stickyEnds.start.name);
};

var detectCap = function(sequence) {
  var stickyEnds = sequence.getStickyEnds();
  return stickyEnds && stickyEnds.end && /^dt(20|18)$/i.test(stickyEnds.end.name);
};

var isValidPart = function(sequence) {
  var stickyEnds = sequence.getStickyEnds();
  return _.isObject(stickyEnds) && _.isObject(stickyEnds.start) && _.isObject(stickyEnds.end);
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

    this.on(
      'change:sequences change:cap change:anchor', 
      _.bind(this.diagnoseSequence, this)
    );

    if(this.get('availableSequences').length === 0) {
      if(Gentle.currentUser.loaded) {
        this.loadAvailableSequencesFromCurrentUser();
      } else {
        this.listenToOnce(Gentle.currentUser, 'loaded', () => {
          this.loadAvailableSequencesFromCurrentUser();
        });
      }
    }

    if(
      this.get('availableAnchors').length === 0 ||
      this.get('availableCaps').length === 0
    ) {
      this.addAvailableSequences(preloadedAnchorsAndCaps.anchors, 'anchors');
      this.addAvailableSequences(preloadedAnchorsAndCaps.caps, 'caps');
    }
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


  filterAvailableSequencesByStickyEnds(stickyEndNames, excludeNames = [], inverse = false) {
    if(!_.isArray(stickyEndNames)) stickyEndNames = [stickyEndNames];

    return () => {
      return _.filter(this.get('availableSequences'), function(sequence) {
        if(_.includes(excludeNames, sequence.get('name'))) return inverse;
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

  addAvailableSequences(sequences, sequencesType, saveToCurrentUser = true) {
    var availableSequences, existingSequences;

    switch(sequencesType) {
      case 'cap':
      case 'caps':
        availableSequences = existingSequences = this.get('availableCaps');
        break;

      case 'anchor':
      case 'anchors':
        availableSequences = existingSequences = this.get('availableAnchors');
        break;

      default:
        availableSequences = this.get('availableSequences');
        existingSequences = availableSequences.concat(
          this.get('availableAnchors'),
          this.get('availableCaps')
        );
        break;
    }

    var newSequences = _.reject(
      _.map(sequences, sequence => new TemporarySequence(sequence)), 
      function(sequence) {
        return _.some(existingSequences, function(existingSequence) {
          return existingSequence.getSequence() === sequence.getSequence();
        });
      }
    );

    var rejectedSequences = _.reject(newSequences, isValidPart);

    availableSequences.push(..._.difference(newSequences, rejectedSequences));

    if(!sequencesType) {
      this._initAvailableAnchorsAndCaps();
    }

    this.throttledSave();

    if(saveToCurrentUser) {
      this.saveAvailableSequencesToCurrentUser();
    }

    return _.map(rejectedSequences, function(sequence) {
      return {
        name: sequence.get('name'),
        type: MISSING_EITHER_STICKY_END
      };
    });
  }

  clearAvailableSequences() {
    this.set('availableSequences', []);
    this.saveAvailableSequencesToCurrentUser();
  }

  removeAvailableSequenceAtIndex(index) {
    console.log("removeAvailableSequenceAtIndex");
    console.log(this.get('availableSequences'));
    console.log(index);
    this.get('availableSequences').splice(index, 1);
     
    //this.set('availableSequences', nowAvailable);
    console.log(this.get('availableSequences'));
    this.saveAvailableSequencesToCurrentUser();
    
  }

  removeAvailableSequenceBySequenceId(id) {
    //console.log("remove by id");
    //console.log("looking for: ", id);
    console.log("before");
    console.log(this.get("availableSequences"));
    var remainder = _.reject(this.get('availableSequences'), function(seq) {
      //console.log(seq.get('id'));
      return seq.get('id') == id;
    });

    //this.get('availableSequences').indexOf(rejected);
    this.set("availableSequences", remainder);
    console.log("after");
    console.log(this.get("availableSequences"))
    //console.log("found:");
    //console.log(output);
    //console.log("end");
  }

  insertSequence(beforeIndex, sequence) {
    this.get('sequences').splice(beforeIndex, 0, sequence);
    this.diagnoseSequence();
  }

  removeSequenceAtIndex(index) {
    this.get('sequences').splice(index, 1);
    this.diagnoseSequence();
  }

  

  moveSequence(oldIndex, newIndex) {
    if(oldIndex === newIndex) return;
    if(oldIndex < newIndex) newIndex++;
    var sequences = this.get('sequences');
    var sequence = sequences[oldIndex];
    sequences[oldIndex] = null;
    sequences.splice(newIndex, 0, sequence);
    this.set('sequences', _.compact(sequences));
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

      if(!anchor) {
        output.push({
          type: MISSING_ANCHOR
        });
      }

      if(cap && lastSequence && !lastSequence.stickyEndConnects(cap)) {
        output.push({
          type: INCOMPATIBLE_STICKY_ENDS,
          index: length
        });
      }

      if(!cap) {
        output.push({
          type: MISSING_CAP
        })
      }
    }

    this.set('errors', output);
    this.throttledSave();
  }

  assembleSequences() {
    var sequences = [];
    var anchor = this.get('anchor');
    var cap = this.get('cap');
    var isCircular = this.get('isCircular');

    if(anchor) sequences.push(anchor);
    sequences = sequences.concat(this.get('sequences'));
    if(cap) sequences.push(cap);
    
    var finalSequence = Sequence.concatenateSequences(
      sequences, 
      isCircular
    );

    finalSequence.set({
      _type: 'circuit',
      name: this.get('name') + '-RDP',
      isCircular
    });

    return finalSequence.toJSON();
  }

  loadAvailableSequencesFromCurrentUser() {
    var sequences = Gentle.currentUser.get(currentUserKey) || [];
    if(_.isArray(sequences) && sequences.length) {
      this.addAvailableSequences(sequences, null, false);
    }
  }

  saveAvailableSequencesToCurrentUser() {
    var sequences = _.map(this.get('availableSequences'), function(sequence) {
      return sequence.toJSON();
    });
    Gentle.currentUser.set(currentUserKey, sequences);
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
WipCircuit.MISSING_CAP = MISSING_CAP;
WipCircuit.MISSING_ANCHOR = MISSING_ANCHOR;
WipCircuit.MISSING_EITHER_STICKY_END = MISSING_EITHER_STICKY_END;
