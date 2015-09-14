import SequenceModel from '../../../sequence/models/sequence';
import SequencesCollection from '../../../sequence/models/sequences';
import ChromatogramFragments from './chromatogram_fragments';

import Nt from 'ntseq';
import smartMemoizeAndClear from 'gentledna-utils/dist/smart_memoize_and_clear';


var classType = 'chromatogramFragment';

class ChromatogramFragment extends SequenceModel {

  constructor(attrs, ...args) {
    super(attrs, ...args);
    this.set({_type: classType}, {silent: true});

    smartMemoizeAndClear(this, {
      getSequence: 'change:sequence'
    })

  }

  getComplement(){
    var sequence = this.getSequence();

    return new Nt.Seq().read(sequence).complement().sequence();

    // return isComplement ?
    //   this.getSequence() :
    //   new Nt.Seq().read()
  }

  getSequence(){
    var sequence = super.getSequence();

    return sequence.replace(/N/g, '-');

    //     isComplement = this.get('isComplement');

    // return (isComplement || !abc) ?
    //         new Nt.Seq().read(sequence).complement().sequence() :
    //         sequence;
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
                              var maskPoint = _this.get('mask')[i];
                              if ((point == maskPoint) || (point == ' ')) {
                                return maskPoint;
                              } else {
                                return '-';
                              }

                            }).join('');

    var updatedConsensus = consensus.slice(0, fragmentStart) + updatedFragment + consensus.slice(fragmentEnd);

    return updatedConsensus;
  }

}


// SequencesCollection.registerConstructor(ChromatogramFragment, classType);
ChromatogramFragments.registerConstructor(ChromatogramFragment, classType);

export default ChromatogramFragment;
