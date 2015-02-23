import _ from 'underscore.mixed';
import SequenceCalculations from '../../../sequence/lib/sequence_calculations';
import SequenceTransforms from '../../../sequence/lib/sequence_transforms';
import PrimerCalculation from './primer_calculation';
import Q from 'q';


var getPCRProduct = function(sequence, opts = {}) {
  sequence = _.isString(sequence) ? sequence : sequence.get('sequence');

  var forwardPrimerPromise = PrimerCalculation(sequence, opts);
  var reversePrimerPromise = PrimerCalculation(SequenceTransforms.toReverseComplements(sequence), opts);
  var lastProgress = [{}, {}];

  return Q.promise(function (resolve, reject, notify) {

    Q.all([forwardPrimerPromise, reversePrimerPromise]).progress(function(current) {
      lastProgress[current.index] = current.value;
      var total = _.reduce(lastProgress, (memo, i) => memo + i.total, 0);
      notify(total ? _.reduce(lastProgress, (memo, i) => memo + i.current, 0)/total : 0);
    }).then(function(results) {

      var [forwardAnnealingRegion, reverseAnnealingRegion] = results;

      _.defaults(opts, {
        from: 0,
        to: sequence.length - 1
      });

      sequence = sequence.substr(opts.from, opts.to);

      if(opts.stickyEnds) {
        sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
      }

      var forwardAnnealingFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
      var reverseAnnealingFrom = sequence.length - reverseAnnealingRegion.sequence.length - 
        (opts.stickyEnds ? opts.stickyEnds.end.length : 0) + 1;

      _.extend(forwardAnnealingRegion, {
        from: forwardAnnealingFrom,
        to: forwardAnnealingFrom + forwardAnnealingRegion.sequence.length - 1,
        sequenceLength: forwardAnnealingRegion.sequence.length
      });

      _.extend(reverseAnnealingRegion, {
        from: reverseAnnealingFrom,
        to: reverseAnnealingFrom + reverseAnnealingRegion.sequence.length - 1,
        sequenceLength: reverseAnnealingRegion.sequence.length
      });

      var forwardPrimer = {
        sequence: (opts.stickyEnds ? opts.stickyEnds.start : '') + forwardAnnealingRegion.sequence,
        from: 0,
        to: (opts.stickyEnds ? opts.stickyEnds.start.length : 0) + forwardAnnealingRegion.sequence.length - 1
      };
      forwardPrimer.sequenceLength = forwardPrimer.sequence.length;
      forwardPrimer.gcContent = SequenceCalculations.gcContent(forwardPrimer.sequence);

      var reversePrimer = {
        sequence: (opts.stickyEnds ? SequenceTransforms.toReverseComplements(opts.stickyEnds.end) : '') +reverseAnnealingRegion.sequence,
        from: 0,
        to: (opts.stickyEnds ? opts.stickyEnds.end.length : 0) + reverseAnnealingRegion.sequence.length - 1
      };
      reversePrimer.sequenceLength = forwardPrimer.sequence.length;
      reversePrimer.gcContent = SequenceCalculations.gcContent(reversePrimer.sequence);


      resolve({
        id: _.uniqueId(),
        from: opts.from, 
        to: opts.to,
        forwardAnnealingRegion: forwardAnnealingRegion,
        reverseAnnealingRegion: reverseAnnealingRegion,
        forwardPrimer: forwardPrimer,
        reversePrimer: reversePrimer,
        sequenceLength: sequence.length,
        stickyEnds: opts.stickyEnds,
        meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
      });

    }).catch((e) => console.log('getpcrproduct err', e));

  });


  // _.defaults(opts, {
  //   from: 0,
  //   to: sequence.length - 1
  // });

  // sequence = sequence.substr(opts.from, opts.to);

  // if(opts.stickyEnds) {
  //   sequence = opts.stickyEnds.start + sequence + opts.stickyEnds.end;
  // }

  // var forwardPrimerFrom = opts.stickyEnds ? opts.stickyEnds.start.length : 0;
  // var reversePrimerFrom = sequence.length - reversePrimer.sequence.length;

  // console.log('optimalForward', forwardPrimer.sequence)
  // console.log('optimalReverse', reversePrimer.sequence)

  // return {
  //   id: _.uniqueId(),
  //   from: opts.from, 
  //   to: opts.to,
  //   forwardPrimer: _.extend(forwardPrimer, {
  //     from: 0,
  //     to: forwardPrimer.sequence.length - 1,
  //     sequenceLength: forwardPrimer.sequence.length
  //   }),
  //   reversePrimer: _.extend(reversePrimer, {
  //     from: reversePrimerFrom,
  //     to: reversePrimerFrom + reversePrimer.sequence.length,
  //     sequenceLength: reversePrimer.sequence.length
  //   }),
  //   sequenceLength: sequence.length,
  //   stickyEnds: opts.stickyEnds,
  //   meltingTemperature: SequenceCalculations.meltingTemperature(sequence)
  // };
};

export default getPCRProduct;