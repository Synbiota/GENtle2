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

    this.trigger('reverseComplement', this)


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
