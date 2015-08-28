import SequencesCollection from '../../../sequence/models/sequences';
import _ from 'underscore';
import Nt from 'ntseq';


var classType = 'chromatogramFragment';

class ChromatogramFragments extends SequencesCollection {
  constructor(attrs, ...args) {
    super(attrs, ...args);

    var options = args[0];

    this.parentSequence = options.parentSequence;

    var _this = this;

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
      _this.parentSequence.throttledSave();
    })

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

  // addChromatogram(chromatogram){
  //   // var fragment = new Sequence(chromatogram)
  //   // var fragments = this.get('chromatogramFragments')
  //   // var fragment = chromatogram;

  //   var fragments = this.getChromatogramFragments();
  //   var fragment = new Sequence(chromatogram);

  //   var seq1 = this.ntSeq || new Nt.Seq().read(this.getSequence());
  //   var seq2 = new Nt.Seq().read(chromatogram.sequence);

  //   var map = seq1.mapSequence(seq2).best();

  //   // fragment.set('map', {
  //   //   position: map.position
  //   // });
  //   // fragment.set('alignmentMask', map.alignmentMask().sequence())

  //   // fragment.position = map.position;
  //   // fragment.mask = map.alignmentMask().sequence();

  //   fragment.set('position', map.position);
  //   fragment.set('mask', map.alignmentMask().sequence());

  //   fragments.add(_.extend({
  //     'position': map.position,
  //     'mask': map.alignmentMask().sequence()
  //   },
  //     chromatogram
  //   ));

  //   this.updateConsensus(fragment);
  //   // this.updateConsensus(chromatogram);

  //   // fragments = fragments.concat(fragment)

  //   // this.set('chromatogramFragments', fragments).throttledSave();

  //   // this.getChromatogramFragments().add(fragment)
  //   this.throttledSave();

  //   this.trigger('add:chromatogramFragment', fragments, fragment);

  // }

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
