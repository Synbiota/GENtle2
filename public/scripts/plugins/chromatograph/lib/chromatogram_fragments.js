import SequencesCollection from '../../../sequence/models/sequences';
import _ from 'underscore';

var classType = 'chromatogramFragment';

class ChromatogramFragments extends SequencesCollection {
  constructor(attrs, ...args) {
    super(attrs, ...args);

    var options = args[0];

    this.parentSequence = options.parentSequence;

    window.b = this;

  }

  model(attrs, ...args){
    attrs = _.defaults(attrs, {
      _type: classType
    })
    return super.model(attrs, ...args);
  }

  getConsensus(){
    var consensus = this.parentSequence.getSequence();

    this.each(function(fragment){
      consensus = fragment.applyConsensus(consensus)
    })

    return consensus;

    // return super.get('consensus') || this.getSequence();
  }

  getConsensusSubSeq(startBase, endBase){
    return this.getConsensus().slice(startBase, endBase+1);
  }

  // resetConsensus(fragment){
  //   var consensus = this.getSequence(),
  //       fragments = this.get('chromatogramFragments'),
  //       _this = this;

  //   _.forEach(fragments, function(fragment){
  //     consensus = _this.applyConsensus(consensus, fragment)
  //   });

  //   this.set('consensus', consensus)
  // }

  // updateConsensus(fragment){
  //   var consensus = this.getConsensus(),
  //       updatedConsensus = this.applyConsensus(consensus, fragment);

  //   this.set('consensus', updatedConsensus);
  // }
}


export default ChromatogramFragments;
