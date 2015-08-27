import SequenceModel from '../../../sequence/models/sequence';
import SequencesCollection from '../../../sequence/models/sequences';
import ChromatogramFragments from './chromatogram_fragments';

import Nt from 'ntseq';

var classType = 'chromatogramFragment';

class ChromatogramFragment extends SequenceModel {

  constructor(attrs, ...args) {
    super(attrs, ...args);
    this.set({_type: classType}, {silent: true});
  }

  // constructor(attributes, options={}) {
  //   // FIXME:  `uniqueId` does not work across browser sessions.
  //   var id = _.uniqueId();
  //   _.defaults(attributes, {
  //     id: id,
  //     name: `Child sequence ${id}`,
  //     version: 0,
  //   });

  //   _.each(this.allFields, (field) => {
  //     let writable = true;
  //     let configurable = true;
  //     let enumerable = !_.contains(this.nonEnumerableFields, field);
  //     if(_.has(attributes, field) || !enumerable) {
  //       // Makes non-enumerable fields we want to remain hidden and only used by
  //       // the class instance.  e.g. Which won't be found with `for(x of this)`
  //       if(!enumerable) {
  //         configurable = false;
  //       }
  //       let value = attributes[field];
  //       Object.defineProperty(this, field, {enumerable, value, writable, configurable});
  //     }
  //   });

  //   // Run any setup required
  //   this.setup(options);

  //   _.defaults(options, {allowValidation: true});

  //   // Data validation, unless we're skipping it.
  //   if(options.allowValidation) this.validate();
  // }

  complement(){

    var parentSequence = this.collection.parentSequence,
        sequence = this.getSequence(),
        isComplement = this.get('isComplement');

    var seq1 = parentSequence.ntseq || new Nt.Seq().read(parentSequence.getSequence()),
        seq2 = isComplement ?
                new Nt.Seq().read(sequence) :
                new Nt.Seq().read(sequence).complement(),
        map = seq1.mapSequence(seq2).best();

    this.set('isComplement', !isComplement)
    this.set('position', map.position)
    this.set('mask', map.alignmentMask().sequence())

    this.throttledSave();
    this.trigger('reverseComplement:chromatogramFragment', this)


  }

  applyConsensus(consensus) {
    var _this         = this,
        fragmentStart = this.get('position'),
        fragmentEnd   = fragmentStart + this.getLength();

    var updatedFragment = _.map(
                            consensus.slice(fragmentStart, fragmentEnd),
                            function(point, i){
                              if ( point != _this.get('mask')[i] ){
                                return '-';
                              } else {
                                return point;
                              }

                            }).join('');

    var updatedConsensus = consensus.slice(0, fragmentStart) + updatedFragment + consensus.slice(fragmentEnd);

    return updatedConsensus;
  }

  //consensus can go under collections?

  // toJSON() {
  //   console.log(123)
  //   let attributes = _.reduce(this.allFields, ((memo, field) => {
  //     if(_.contains(this.nonEnumerableFields, field)) {
  //       // skip
  //     } else {
  //       memo[field] = this[field];
  //     }
  //     return memo;
  //   }), {});
  //   return attributes;
  // }

}


// SequencesCollection.registerConstructor(ChromatogramFragment, classType);
ChromatogramFragments.registerConstructor(ChromatogramFragment, classType);

export default ChromatogramFragment;
