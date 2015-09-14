import SequencesCollection from '../../../sequence/models/sequences';
import _ from 'underscore';
import Nt from 'ntseq';
import smartMemoizeAndClear from 'gentledna-utils/dist/smart_memoize_and_clear';


var classType = 'chromatogramFragment';

class ChromatogramFragments extends SequencesCollection {
  constructor(attrs, ...args) {
    super(attrs, ...args);

    var options = args[0];

    var parentSequence = this.parentSequence = options.parentSequence;

    var _this = this;

    var bubbleEvents = ['add', 'remove', 'reverseComplement']

    smartMemoizeAndClear(this, {
      getConsensus: 'add remove reverseComplement'
    })

    this.on('all', function(eventName ,...args){
      if (_.contains(bubbleEvents, eventName)) {
        parentSequence.trigger(eventName + ':chromatogramFragments', ...args)
      }
    })

    this.on('add', function(fragment){
      var parentSequence = _this.parentSequence,
          seq1 = parentSequence.ntSeq || new Nt.Seq().read(parentSequence.getSequence()),
          seq2 = new Nt.Seq().read(fragment.getSequence()),
          map  = seq1.mapSequence(seq2).best();

      fragment.set({
        position: map.position,
        mask: map.alignmentMask().sequence(),
      }, {
        silent: true
      })

    });

    this.on('add remove reverseComplement', function(){
      parentSequence.throttledSave();
    })

  }

  model(attrs, ...args){
    attrs = _.defaults(attrs, {
      _type: classType
    })
    return super.model(attrs, ...args);
  }

  getConsensus(){
    // var consensus = this.parentSequence.getSequence();
    // consensus = _.map(consensus, )

    var consensus = ''
    for (var i = 0; i < this.parentSequence.getLength(); i++){
      consensus += ' '
    }

    this.each(function(fragment){
      consensus = fragment.applyConsensus(consensus);
    });

    return consensus;

    // return super.get('consensus') || this.getSequence();
  }

  getConsensusSubSeq(startBase, endBase){
    return this.getConsensus().slice(startBase, endBase+1);
  }

}


export default ChromatogramFragments;
